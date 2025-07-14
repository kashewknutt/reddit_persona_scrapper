# utils.py
import httpx
import os
import re

def extract_json_loose(text: str) -> str | None:
    """
    Extracts and fixes common malformed JSON issues like missing commas.
    """
    # Remove code block markers
    text = text.strip().replace("```json", "").replace("```", "")

    # Try to find the largest JSON-like structure
    match = re.search(r'{[\s\S]+}', text)
    if not match:
        return None

    raw_json = match.group()

    # Common fixes for broken JSON
    # Fix: add missing commas between list items using regex
    raw_json = re.sub(r'"\s+"', '", "', raw_json)

    # Fix: trailing commas before list/obj endings
    raw_json = re.sub(r',(\s*[\]}])', r'\1', raw_json)

    return raw_json


HEADERS = {"Content-Type": "application/json"}

def call_llm_with_fallback(content: str):
    messages = [{"role": "user", "content": content}]

    providers = [
        {
            "name": "OpenRouter",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "headers": {
                **HEADERS,
                "Authorization": f"Bearer {os.environ['OPENROUTER_KEY']}"
            },
            "model": "google/gemma-3n-e2b-it:free"
        }
    ]

    for provider in providers:
        try:
            print(f"Calling provider: {provider['name']}", flush=True)
            response = httpx.post(
                provider['url'],
                headers=provider['headers'],
                json={
                    "model": provider['model'],
                    "messages": messages
                },
                timeout=30
            )
            print(f"{provider['name']} Response Text:", response.text[:300], flush=True)

            data = response.json()
            content = data['choices'][0]['message']['content'].strip()

            if not content:
                raise ValueError("Empty LLM response")

            return content
        except Exception as e:
            print(f"{provider['name']} Error:", e, flush=True)
            continue

    return None


def generate_persona_prompt(data: dict) -> str:
    posts_and_comments = data.get("posts", []) + data.get("comments", [])
    combined_text = "\n---\n".join([item.get("body", "") for item in posts_and_comments if item.get("body")])
    limited_text = combined_text[:5000]

    prompt = f"""
You are a senior behavioral psychologist and personality analyst. Your job is to infer detailed psychological and personality traits based on digital footprints such as Reddit posts and comments.

You are analyzing the following Reddit user's content. Based on their tone, opinions, patterns of speech, emotional tone, and values, construct a detailed persona.

Your response must be in **RAW MINIFIED JSON FORMAT ONLY**. Do not wrap your response in code blocks or add explanations. The JSON must be parsable and follow the exact schema below.

Guidelines:
- Each list item (for goals, motivations, etc.) should be a complete sentence, 2 to 4 lines long.
- Use empathetic, clear language suitable for psychological interpretation.
- The keywords must be four adjectives that best describe the person overall.

JSON Schema (strictly follow this):

{{
  "introversion_extroversion": int (1-10),  // 1 = highly introverted, 10 = highly extroverted
  "intuition_sensing": int (1-10),          // 1 = highly sensing, 10 = highly intuitive
  "feeling_thinking": int (1-10),           // 1 = highly feeling-based, 10 = highly logic/thought-based
  "perceiving_judging": int (1-10),         // 1 = highly spontaneous (perceiving), 10 = highly structured (judging)

  "behaviors_and_habits": [string],         // 3 to 5 descriptive sentences, full sentence form
  "goals_and_needs": [string],              // 3 to 5 full sentence entries
  "frustrations": [string],                 // 3 to 5 full sentence entries
  "motivations": [string],                  // 3 to 5 full sentence entries
  "keywords": [string]                      // Four descriptive adjectives only
}}

DATA:
{limited_text}
"""
    return prompt.strip()
