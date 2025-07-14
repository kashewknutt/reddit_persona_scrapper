from reddit_scraper import extract_username, fetch_user_data
from fastapi import FastAPI, HTTPException
from models import ScrapeRequest, ScrapeResponse

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
