import json
from utils import call_llm_with_fallback, extract_json_loose, generate_persona_prompt
from reddit_scraper import extract_username, fetch_user_data
from fastapi import FastAPI, HTTPException
from models import PersonaResponse, ScrapeRequest, ScrapeResponse
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI()

@app.post("/scrape", response_model=ScrapeResponse)
def scrape_user(data: ScrapeRequest):
    username = extract_username(data.username)

    try:
        result = fetch_user_data(username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

    posts = result["posts"]
    comments = result["comments"]

    return ScrapeResponse(
        username=username,
        posts=posts,
        comments=comments
    )

@app.post("/generate_persona", response_model=PersonaResponse)
def generate_persona(scrape_data: ScrapeResponse):
    try:
        prompt = generate_persona_prompt(scrape_data.dict())
        raw_text = call_llm_with_fallback(prompt)

        if not raw_text:
            raise HTTPException(status_code=502, detail="LLM returned empty response")

        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        try:
            final_response = PersonaResponse.model_validate_json(raw_text)
            print("Parsed JSON directly from model output", flush=True)
            return final_response
        except Exception as e:
            print("Direct parse failed:", e, flush=True)

        loose_json = extract_json_loose(raw_text)
        if loose_json:
            try:
                parsed = json.loads(loose_json)
                final_response = PersonaResponse.model_validate(parsed)
                print("Parsed JSON via loose fallback", flush=True)
                return final_response
            except Exception as inner_e:
                print("Loose JSON parse failed:", inner_e, flush=True)
        else:
            print("No valid JSON structure extracted", flush=True)

        raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Persona generation failed: {str(e)}")