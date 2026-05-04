from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anthropic
import aiosqlite
import base64
import json
import os
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Promptly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"
DB_PATH = Path("./prompts.db")

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


async def init_db():
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


@app.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    platform: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
    prompt_length: str = Form("medium"),
):
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    image_data = await image.read()
    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    content_type = image.content_type or "image/jpeg"
    if content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        content_type = "image/jpeg"

    cfg = PLATFORM_CONFIGS[platform]
    user_message = _build_user_prompt(cfg, aspect_ratio, style_modifier, prompt_length, "this image")
    system = SD_SYSTEM_PROMPT if platform == "stable_diffusion" else SYSTEM_PROMPT
    max_tokens = 3500 if prompt_length == "long" else 2048

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": content_type, "data": image_b64}},
                    {"type": "text", "text": user_message},
                ],
            }],
        )
        return _parse_response(msg.content[0].text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/text")
async def analyze_text(
    description: str = Form(...),
    platform: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
    prompt_length: str = Form("medium"),
):
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    cfg = PLATFORM_CONFIGS[platform]
    system = SD_SYSTEM_PROMPT if platform == "stable_diffusion" else SYSTEM_PROMPT
    user_message = _build_user_prompt(cfg, aspect_ratio, style_modifier, prompt_length, "this description")
    max_tokens = 3500 if prompt_length == "long" else 2048

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
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/prompts/save")
async def save_prompt(
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
                int(cfg_scale) if cfg_scale else None,
                sampler or None,
                int(steps) if steps else None,
                lora_tags,
            ),
        )
        await db.commit()
        return {"id": cursor.lastrowid}


@app.get("/prompts")
async def list_prompts(q: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if q:
            cursor = await db.execute(
                "SELECT * FROM saved_prompts WHERE prompt_text LIKE ? OR tags LIKE ? OR platform LIKE ? ORDER BY created_at DESC",
                (f"%{q}%", f"%{q}%", f"%{q}%"),
            )
        else:
            cursor = await db.execute("SELECT * FROM saved_prompts ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM saved_prompts WHERE id = ?", (prompt_id,))
        await db.commit()
    return {"ok": True}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
