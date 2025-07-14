# main.py
import json
from utils import call_llm_with_fallback, extract_json_loose, generate_persona_prompt
from reddit_scraper import extract_username, fetch_user_data
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PersonaCore, ScrapeRequest, ScrapeResponse, PersonaResponse
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/scrape", response_model=ScrapeResponse)
def scrape_user(data: ScrapeRequest):
    username = extract_username(data.username)

    try:
        result = fetch_user_data(username)
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

    return ScrapeResponse(
        username=username,
        profile_picture=result.get("profile_picture"),
        snoovatar=result.get("snoovatar"),
        comment_karma=result.get("comment_karma"),
        post_karma=result.get("post_karma"),
        total_karma=result.get("total_karma"),
        created_utc=result.get("created_utc"),
        is_mod=result.get("is_mod"),
        is_gold=result.get("is_gold"),
        verified=result.get("verified"),
        has_verified_email=result.get("has_verified_email"),
        accept_followers=result.get("accept_followers"),
        occupation=result.get("occupation"),
        status=result.get("status"),
        location=result.get("location"),
        posts=result.get("posts", []),
        comments=result.get("comments", [])
    )


@app.post("/generate_persona", response_model=PersonaResponse)
def generate_persona(scrape_data: ScrapeResponse):
    try:
        prompt = generate_persona_prompt(scrape_data.dict())
        raw_text = call_llm_with_fallback(prompt)

        if not raw_text:
            raise HTTPException(status_code=502, detail="LLM returned empty response")

        raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        llm_data = None

        try:
            llm_data = PersonaCore.model_validate_json(raw_text)
            print("Parsed JSON directly from model output", flush=True)
        except Exception as e:
            print("Direct parse failed:", e, flush=True)
            loose_json = extract_json_loose(raw_text)
            if loose_json:
                parsed = json.loads(loose_json)
                llm_data = PersonaCore.model_validate(parsed)
                print("Parsed JSON via loose fallback", flush=True)

        if not llm_data:
            raise HTTPException(status_code=500, detail="Failed to parse LLM response")

        # Merge with metadata
        llm_dict = llm_data.model_dump()
        meta_dict = scrape_data.model_dump()
        merged = {**meta_dict, **llm_dict}

        return PersonaResponse(**merged)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Persona generation failed: {str(e)}")
