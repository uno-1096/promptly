from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anthropic
import base64
import json
import os

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
}

SYSTEM_PROMPT = """You are an expert AI image and video prompt engineer with deep knowledge of how different generation models interpret prompts. You analyze images and generate highly optimized prompts that recreate or build upon their visual elements.

When analyzing an image you consider: subject matter and focal points, composition and framing, lighting conditions and quality, color palette and tone, texture and materials, mood and atmosphere, style and artistic influences, and technical photography or cinematography elements.

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

Each prompt should be substantive (150–300 words) and highly optimized for the target platform. Tags should be 3–6 single words or short phrases capturing the key visual elements. The negative_prompt should be a concise comma-separated list."""


@app.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    platform: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    style_modifier: str = Form(""),
):
    if platform not in PLATFORM_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    image_data = await image.read()
    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")

    content_type = image.content_type or "image/jpeg"
    if content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        content_type = "image/jpeg"

    cfg = PLATFORM_CONFIGS[platform]
    style_instruction = f"\nApply a {style_modifier} aesthetic treatment to all three prompts." if style_modifier else ""

    user_message = f"""Analyze this image and generate 3 optimized prompts for {cfg['name']}.

Platform focus: {cfg['focus']}
Writing style: {cfg['style']}
Target aspect ratio: {aspect_ratio}{style_instruction}

Generate exactly 3 distinct prompt variations:
1. A faithful recreation prompt that captures the image as precisely as possible
2. An enhanced version that amplifies the strongest visual elements and mood
3. A creative reinterpretation that maintains the core essence while pushing artistic boundaries

For the Kling platform, each prompt must include specific camera movement descriptions (e.g., "slow dolly forward", "gentle pan left", "subtle zoom out") and motion directives for subjects.

Respond ONLY with the JSON object — no markdown, no explanation, no additional text."""

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": content_type,
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": user_message,
                        },
                    ],
                }
            ],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        result = json.loads(response_text)
        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok"}
