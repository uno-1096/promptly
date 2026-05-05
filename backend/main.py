import base64
import json
import logging
import os
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List, Optional

import aiosqlite
import anthropic
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# ── Startup: fail fast if key is missing ──────────────────────────────────────
_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if not _api_key:
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is required")

# ── Privacy-safe logging — no user content ever logged ───────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("promptly")

# ── Rate limiting (per source IP) ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ── App — docs/schema hidden in production ────────────────────────────────────
app = FastAPI(title="Promptly API", docs_url=None, redoc_url=None, openapi_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — only the production origin (or overridden via env) ─────────────────
_allowed_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "https://prompt.unocloud.us").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Request-ID"],
)

# ── Clients / config ──────────────────────────────────────────────────────────
client = anthropic.Anthropic(api_key=_api_key)
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
DB_PATH = Path(os.environ.get("DB_PATH", "./prompts.db"))

# ── Upload limits ─────────────────────────────────────────────────────────────
MAX_FILE_BYTES = 10 * 1024 * 1024    # 10 MB per file
MAX_TOTAL_BYTES = 50 * 1024 * 1024   # 50 MB for batch uploads
MAX_IMAGE_DIMENSION = 8000            # pixels — reject gigapixel bombs

_ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}
_PIL_TO_MIME = {
    "JPEG": "image/jpeg",
    "PNG":  "image/png",
    "GIF":  "image/gif",
    "WEBP": "image/webp",
}

# ── Input length caps ─────────────────────────────────────────────────────────
MAX_DESCRIPTION_LEN    = 2000
MAX_SCENE_DESC_LEN     = 2000
MAX_VIDEO_DESC_LEN     = 2000
MAX_LABEL_LEN          = 200
MAX_PROMPT_TEXT_LEN    = 5000
MAX_STYLE_MODIFIER_LEN = 200
MAX_SEARCH_LEN         = 100

PLATFORM_CONFIGS = {
    "gemini": {
        "name": "Gemini Image Generation",
        "focus": "storytelling, narrative depth, emotional resonance, scene composition, atmospheric mood, visual metaphors, and cinematic storytelling",
        "style": "poetic and evocative with rich descriptive language that paints a complete scene and conveys feeling",
    },
    "chatgpt": {
        "name": "DALL-E / ChatGPT Image Generation",
        "focus": "technical precision, artistic medium, specific style references, composition rules, lighting parameters, color palettes, and photographic or artistic terminology",
        "style": "structured and technical with precise parameters and explicit style directives, often using comma-separated descriptors",
    },
    "kling": {
        "name": "Kling AI Video Generation",
        "focus": "camera movements (pan, tilt, zoom, dolly, tracking shot, crane), motion dynamics, temporal transitions, scene flow, movement trajectories, and video-specific elements",
        "style": "motion-centric with explicit camera direction language describing movement and temporal progression throughout the clip",
    },
    "stable_diffusion": {
        "name": "Stable Diffusion",
        "focus": "technical image parameters, subject description, artistic style, lighting, composition, quality modifiers, LoRA model compatibility, and negative space definition",
        "style": "comma-separated keyword-dense tags optimized for SD checkpoint models, including quality boosters, style tags, and technical parameters",
    },
}

LENGTH_CONFIGS = {
    "short": "40–80",
    "medium": "150–300",
    "long": "350–500",
}

SYSTEM_PROMPT = """You are an expert AI image and video prompt engineer with deep knowledge of how different generation models interpret prompts. You analyze images or text descriptions and generate highly optimized prompts that recreate or build upon visual elements.

When analyzing an image or description consider: subject matter and focal points, composition and framing, lighting conditions and quality, color palette and tone, texture and materials, mood and atmosphere, style and artistic influences, and technical photography or cinematography elements.

You always respond with valid JSON in exactly this format:
{
  "prompts": [
    {
      "text": "The complete prompt text",
      "tags": ["tag1", "tag2", "tag3", "tag4"]
    },
    {
      "text": "A second variation with different emphasis",
      "tags": ["tag1", "tag2", "tag3", "tag4"]
    },
    {
      "text": "A third variation with creative interpretation",
      "tags": ["tag1", "tag2", "tag3", "tag4"]
    }
  ],
  "negative_prompt": "elements to avoid, artifacts, quality issues to exclude"
}

Tags should be 3–6 single words or short phrases capturing the key visual elements. The negative_prompt should be a concise comma-separated list."""

SD_SYSTEM_PROMPT = """You are an expert Stable Diffusion prompt engineer. Analyze images or descriptions and generate highly optimized prompts for Stable Diffusion image generation models.

You always respond with valid JSON in exactly this format:
{
  "prompts": [
    {
      "text": "masterpiece, best quality, detailed positive prompt here, comma-separated tags",
      "negative_prompt": "lowres, bad anatomy, bad hands, specific variation negatives",
      "cfg_scale": 7,
      "sampler": "DPM++ 2M Karras",
      "steps": 20,
      "lora_tags": ["<lora:add_detail:0.8>"],
      "tags": ["tag1", "tag2", "tag3"]
    },
    {
      "text": "masterpiece, best quality, second variation positive prompt",
      "negative_prompt": "lowres, bad anatomy, bad hands, blurry",
      "cfg_scale": 7,
      "sampler": "DPM++ 2M Karras",
      "steps": 25,
      "lora_tags": ["<lora:film_grain:0.6>"],
      "tags": ["tag1", "tag2", "tag3"]
    },
    {
      "text": "masterpiece, best quality, third creative variation",
      "negative_prompt": "lowres, bad anatomy, bad hands, blurry",
      "cfg_scale": 9,
      "sampler": "DPM++ 2M Karras",
      "steps": 30,
      "lora_tags": [],
      "tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
}

CFG scale: 7 for balanced, 5-6 for artistic/dreamlike, 9-12 for photorealistic/precise.
Steps: 20 for quick, 25 for standard, 30-35 for high detail.
LoRA suggestions: add_detail for sharper detail, film_grain for cinematic, beautiful_eyes for portraits, ink_style for illustrations. Use empty array when no LoRAs fit."""


REFERENCE_SYSTEM_PROMPT = """You are an expert AI image prompt engineer specializing in reference-based scene assembly. You receive multiple reference images (person, outfit, location, props, lighting, etc.) alongside a scene description. Analyze ALL reference images together and synthesize their visual elements into one coherent, complete prompt per platform.

Combine: physical appearance from person references, outfit details from clothing references, environmental elements from location references, and any props or styling from additional references — all unified within the stated scene description.

Respond with valid JSON in exactly this format:
{
  "gemini": {
    "prompt": "Complete Gemini-optimized scene prompt combining all reference visuals and the scene description — poetic, evocative, narrative-rich",
    "tags": ["tag1", "tag2", "tag3", "tag4"]
  },
  "chatgpt": {
    "prompt": "Complete DALL-E/ChatGPT-optimized prompt — structured, technical, precise with comma-separated descriptors",
    "tags": ["tag1", "tag2", "tag3", "tag4"]
  },
  "kling": {
    "prompt": "Complete Kling video-optimized prompt including specific camera movement descriptions",
    "camera_movement": "specific camera movement for this scene",
    "tags": ["tag1", "tag2", "tag3", "tag4"]
  },
  "stable_diffusion": {
    "prompt": "masterpiece, best quality, detailed SD prompt combining all references",
    "negative_prompt": "lowres, bad anatomy, bad hands, blurry",
    "cfg_scale": 7,
    "sampler": "DPM++ 2M Karras",
    "steps": 25,
    "lora_tags": [],
    "tags": ["tag1", "tag2", "tag3"]
  },
  "negative_prompt": "general elements to avoid across all platforms, quality issues, artifacts"
}

CFG scale: 7 balanced, 5-6 artistic, 9-12 photorealistic. Steps: 20 quick, 25 standard, 30-35 high detail.
Respond ONLY with the JSON object — no markdown, no explanation."""

VIDEO_SYSTEM_PROMPT = """You are an expert AI video prompt engineer with deep knowledge of text-to-video generation models. Analyze a scene description and optional starting frame to generate platform-optimized video prompts for Kling, Sora, Runway, and Pika.

Platform strengths:
- Kling: cinematic shots, fluid camera movements, realistic human motion
- Sora (OpenAI): long duration, complex scenes, realistic physics, cinematic quality
- Runway Gen-3: stylized visuals, creative effects, shorter precise clips
- Pika Labs: dynamic action, expressive character motion, fast generation

Respond with valid JSON in exactly this format:
{
  "kling": {
    "prompt": "Complete optimized prompt for Kling AI",
    "camera_movement": "specific camera movement (e.g. slow dolly forward, tracking shot right)",
    "subject_motion": "how the subject/scene moves",
    "lighting": "lighting description",
    "transitions": "cut or transition style",
    "duration": "4-6 seconds",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "sora": {
    "prompt": "Complete optimized prompt for Sora",
    "camera_movement": "specific camera movement",
    "subject_motion": "subject/scene motion",
    "lighting": "lighting",
    "transitions": "transitions",
    "duration": "8-15 seconds",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "runway": {
    "prompt": "Complete optimized prompt for Runway Gen-3",
    "camera_movement": "specific camera movement",
    "subject_motion": "subject/scene motion",
    "lighting": "lighting",
    "transitions": "transitions",
    "duration": "3-5 seconds",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "pika": {
    "prompt": "Complete optimized prompt for Pika Labs",
    "camera_movement": "specific camera movement",
    "subject_motion": "subject/scene motion",
    "lighting": "lighting",
    "transitions": "transitions",
    "duration": "3-4 seconds",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

Respond ONLY with the JSON object — no markdown, no explanation."""


# ── Security middleware: inject request ID + hardening headers ─────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Request-ID"] = str(uuid.uuid4())
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Server"] = "promptly"
    return response


# ── Image validation (magic bytes via Pillow + dimension check) ────────────────
def _validate_image(data: bytes, rid: str) -> str:
    """Validate image bytes. Returns MIME type. Never logs user content."""
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")
    try:
        img = Image.open(BytesIO(data))
        fmt = img.format
        if fmt not in _ALLOWED_PIL_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        w, h = img.size
        if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
            raise HTTPException(status_code=400, detail="Image dimensions too large")
        img.load()
        img.close()
    except HTTPException:
        raise
    except Exception:
        logger.warning("image validation failed rid=%s", rid)
        raise HTTPException(status_code=400, detail="Invalid image file")
    return _PIL_TO_MIME[fmt]


def _sanitize_text(text: str, max_len: int) -> str:
    """Strip C0/C1 control chars; keep printable ASCII and unicode >= 160."""
    text = text[:max_len]
    return "".join(
        ch for ch in text
        if ch in ("\t", "\n", "\r") or (32 <= ord(ch) <= 126) or ord(ch) >= 160
    ).strip()


# ── DB init ───────────────────────────────────────────────────────────────────
async def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS saved_prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                platform TEXT NOT NULL,
                label TEXT,
                prompt_text TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                negative_prompt TEXT DEFAULT '',
                cfg_scale INTEGER,
                sampler TEXT,
                steps INTEGER,
                lora_tags TEXT DEFAULT '[]'
            )
        """)
        await db.commit()


@app.on_event("startup")
async def startup():
    await init_db()


def _build_user_prompt(cfg: dict, aspect_ratio: str, style_modifier: str, prompt_length: str, source_label: str) -> str:
    word_range = LENGTH_CONFIGS.get(prompt_length, LENGTH_CONFIGS["medium"])
    style_note = f"\nApply a {style_modifier} aesthetic treatment to all prompts." if style_modifier else ""
    return f"""Analyze {source_label} and generate 3 optimized prompts for {cfg['name']}.

Platform focus: {cfg['focus']}
Writing style: {cfg['style']}
Target aspect ratio: {aspect_ratio}
Target prompt length: {word_range} words per prompt{style_note}

Generate exactly 3 distinct prompt variations:
1. Faithful — recreate the subject as precisely as possible
2. Enhanced — amplify the strongest visual elements and mood
3. Creative — maintain the core essence while pushing artistic boundaries

For Kling platform only: each prompt must include specific camera movement descriptions (e.g., "slow dolly forward", "gentle pan left", "subtle zoom out").

Respond ONLY with the JSON object — no markdown, no explanation."""


def _parse_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])
    return json.loads(text)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/analyze")
@limiter.limit("20/minute")
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    platform: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
    prompt_length: str = Form("medium"),
):
    rid = str(uuid.uuid4())
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid platform")
    if prompt_length not in LENGTH_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid prompt length")
    style_modifier = _sanitize_text(style_modifier, MAX_STYLE_MODIFIER_LEN)

    raw = await image.read()
    mime = _validate_image(raw, rid)
    image_b64 = base64.standard_b64encode(raw).decode("utf-8")
    del raw

    cfg = PLATFORM_CONFIGS[platform]
    user_message = _build_user_prompt(cfg, aspect_ratio, style_modifier, prompt_length, "this image")
    system = SD_SYSTEM_PROMPT if platform == "stable_diffusion" else SYSTEM_PROMPT
    max_tokens = 3500 if prompt_length == "long" else 2048

    logger.info("analyze rid=%s platform=%s", rid, platform)
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": mime, "data": image_b64}},
                    {"type": "text", "text": user_message},
                ],
            }],
        )
        return _parse_response(msg.content[0].text)
    except json.JSONDecodeError:
        logger.error("json parse error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Failed to process AI response")
    except anthropic.APIError:
        logger.error("anthropic api error rid=%s", rid)
        raise HTTPException(status_code=500, detail="AI service error")
    except Exception:
        logger.exception("unexpected error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/analyze/text")
@limiter.limit("20/minute")
async def analyze_text(
    request: Request,
    description: str = Form(...),
    platform: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
    prompt_length: str = Form("medium"),
):
    rid = str(uuid.uuid4())
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid platform")
    if prompt_length not in LENGTH_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid prompt length")

    description = _sanitize_text(description, MAX_DESCRIPTION_LEN)
    style_modifier = _sanitize_text(style_modifier, MAX_STYLE_MODIFIER_LEN)
    if not description:
        raise HTTPException(status_code=400, detail="Description is required")

    cfg = PLATFORM_CONFIGS[platform]
    system = SD_SYSTEM_PROMPT if platform == "stable_diffusion" else SYSTEM_PROMPT
    user_message = _build_user_prompt(cfg, aspect_ratio, style_modifier, prompt_length, "this description")
    max_tokens = 3500 if prompt_length == "long" else 2048

    logger.info("analyze/text rid=%s platform=%s", rid, platform)
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{
                "role": "user",
                "content": f"Description: {description}\n\n{user_message}",
            }],
        )
        return _parse_response(msg.content[0].text)
    except json.JSONDecodeError:
        logger.error("json parse error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Failed to process AI response")
    except anthropic.APIError:
        logger.error("anthropic api error rid=%s", rid)
        raise HTTPException(status_code=500, detail="AI service error")
    except Exception:
        logger.exception("unexpected error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/prompts/save")
@limiter.limit("30/minute")
async def save_prompt(
    request: Request,
    platform: str = Form(...),
    label: str = Form(""),
    prompt_text: str = Form(...),
    tags: str = Form("[]"),
    negative_prompt: str = Form(""),
    cfg_scale: str = Form(""),
    sampler: str = Form(""),
    steps: str = Form(""),
    lora_tags: str = Form("[]"),
):
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid platform")

    label         = _sanitize_text(label, MAX_LABEL_LEN)
    prompt_text   = _sanitize_text(prompt_text, MAX_PROMPT_TEXT_LEN)
    negative_prompt = _sanitize_text(negative_prompt, MAX_PROMPT_TEXT_LEN)
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt text is required")

    try:
        json.loads(tags)
    except json.JSONDecodeError:
        tags = "[]"
    try:
        json.loads(lora_tags)
    except json.JSONDecodeError:
        lora_tags = "[]"

    cfg_scale_int: Optional[int] = None
    steps_int: Optional[int] = None
    sampler_val: Optional[str] = None
    if cfg_scale:
        try:
            cfg_scale_int = int(cfg_scale)
            if not (1 <= cfg_scale_int <= 30):
                raise ValueError
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cfg_scale")
    if steps:
        try:
            steps_int = int(steps)
            if not (1 <= steps_int <= 150):
                raise ValueError
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid steps value")
    if sampler:
        sampler_val = _sanitize_text(sampler, 50)

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO saved_prompts
               (created_at, platform, label, prompt_text, tags, negative_prompt, cfg_scale, sampler, steps, lora_tags)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                datetime.utcnow().isoformat(),
                platform,
                label,
                prompt_text,
                tags,
                negative_prompt,
                cfg_scale_int,
                sampler_val,
                steps_int,
                lora_tags,
            ),
        )
        await db.commit()
        return {"id": cursor.lastrowid}


@app.get("/prompts")
@limiter.limit("60/minute")
async def list_prompts(
    request: Request,
    q: str = Query("", max_length=100),
):
    q = _sanitize_text(q, MAX_SEARCH_LEN)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if q:
            cursor = await db.execute(
                "SELECT * FROM saved_prompts WHERE prompt_text LIKE ? OR tags LIKE ? OR platform LIKE ? ORDER BY created_at DESC LIMIT 200",
                (f"%{q}%", f"%{q}%", f"%{q}%"),
            )
        else:
            cursor = await db.execute("SELECT * FROM saved_prompts ORDER BY created_at DESC LIMIT 200")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


@app.delete("/prompts/{prompt_id}")
@limiter.limit("30/minute")
async def delete_prompt(request: Request, prompt_id: int):
    if prompt_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid prompt ID")
    async with aiosqlite.connect(DB_PATH) as db:
        row = await (await db.execute("SELECT id FROM saved_prompts WHERE id = ?", (prompt_id,))).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Prompt not found")
        await db.execute("DELETE FROM saved_prompts WHERE id = ?", (prompt_id,))
        await db.commit()
    return {"ok": True}


@app.post("/analyze/reference")
@limiter.limit("10/minute")
async def analyze_reference(
    request: Request,
    images: List[UploadFile] = File(...),
    scene_description: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
):
    rid = str(uuid.uuid4())
    if not images:
        raise HTTPException(status_code=400, detail="At least one reference image is required")
    if len(images) > 8:
        raise HTTPException(status_code=400, detail="Maximum 8 reference images allowed")

    scene_description = _sanitize_text(scene_description, MAX_SCENE_DESC_LEN)
    style_modifier    = _sanitize_text(style_modifier, MAX_STYLE_MODIFIER_LEN)
    if not scene_description:
        raise HTTPException(status_code=400, detail="Scene description is required")

    total_bytes = 0
    content = []
    for i, img_file in enumerate(images):
        raw = await img_file.read()
        total_bytes += len(raw)
        if total_bytes > MAX_TOTAL_BYTES:
            raise HTTPException(status_code=413, detail="Total upload size exceeds 50 MB")
        mime = _validate_image(raw, f"{rid}-{i}")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": mime, "data": base64.standard_b64encode(raw).decode("utf-8")},
        })
        content.append({"type": "text", "text": f"Reference image {i + 1}"})
        del raw

    style_note = f"\nApply a {style_modifier} aesthetic treatment." if style_modifier else ""
    content.append({"type": "text", "text": f"""Scene description: {scene_description}

I've provided {len(images)} reference image(s). Analyze ALL of them together and combine their visual elements (appearance, outfit, location, props, etc.) with the scene description to generate one optimized prompt per platform.

Target aspect ratio: {aspect_ratio}{style_note}

Respond ONLY with the JSON object — no markdown, no explanation."""})

    logger.info("analyze/reference rid=%s images=%d", rid, len(images))
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=3000,
            system=REFERENCE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
        )
        return _parse_response(msg.content[0].text)
    except json.JSONDecodeError:
        logger.error("json parse error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Failed to process AI response")
    except anthropic.APIError:
        logger.error("anthropic api error rid=%s", rid)
        raise HTTPException(status_code=500, detail="AI service error")
    except Exception:
        logger.exception("unexpected error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/analyze/video")
@limiter.limit("10/minute")
async def analyze_video(
    request: Request,
    video_description: str = Form(...),
    starting_image: Optional[UploadFile] = File(None),
    style_modifier: str = Form(""),
):
    rid = str(uuid.uuid4())
    video_description = _sanitize_text(video_description, MAX_VIDEO_DESC_LEN)
    style_modifier    = _sanitize_text(style_modifier, MAX_STYLE_MODIFIER_LEN)
    if not video_description:
        raise HTTPException(status_code=400, detail="Video description is required")

    content = []
    has_image = starting_image is not None and starting_image.filename not in (None, "")

    if has_image:
        raw = await starting_image.read()
        mime = _validate_image(raw, rid)
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": mime, "data": base64.standard_b64encode(raw).decode("utf-8")},
        })
        del raw

    style_note  = f"\nApply a {style_modifier} aesthetic treatment." if style_modifier else ""
    image_note  = "I've provided a starting frame image above — use it as the visual basis for the video.\n\n" if has_image else ""
    content.append({"type": "text", "text": f"""{image_note}Video description: {video_description}

Generate optimized video prompts for Kling, Sora, Runway, and Pika. Each must specify camera movement, subject motion, lighting, transitions, and duration.{style_note}

Respond ONLY with the JSON object — no markdown, no explanation."""})

    logger.info("analyze/video rid=%s has_image=%s", rid, has_image)
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=3000,
            system=VIDEO_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
        )
        return _parse_response(msg.content[0].text)
    except json.JSONDecodeError:
        logger.error("json parse error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Failed to process AI response")
    except anthropic.APIError:
        logger.error("anthropic api error rid=%s", rid)
        raise HTTPException(status_code=500, detail="AI service error")
    except Exception:
        logger.exception("unexpected error rid=%s", rid)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
