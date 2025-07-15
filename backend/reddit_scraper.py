# reddit_scraper.py
import os
import time
import logging
from typing import List, Dict

import praw
import requests
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv()

reddit_api = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT"),
)

def extract_username(url_or_username: str) -> str:
    if "reddit.com/user/" in url_or_username:
        return url_or_username.rstrip("/").split("/")[-1]
    return url_or_username.strip()


def scrape_with_playwright(username: str, max_scrolls=3) -> Dict[str, List[Dict]]:
    logging.basicConfig(level=logging.INFO)
    url = f"https://old.reddit.com/user/{username}"
    logging.info(f"[Playwright] Starting scrape for user: {username} at {url}")

    posts = []
    comments = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto(url)
        time.sleep(2)

        for i in range(max_scrolls):
            entries = page.locator("div.thing").all()
            logging.info(f"[Playwright] Found {len(entries)} items on scroll {i+1}")
            for entry in entries:
                try:
                    body = entry.locator("div.entry").inner_text()
                    link = entry.get_attribute("data-url") or ""
                    is_comment = "comment" in (entry.get_attribute("class") or "")
                    result = {
                        "body": body,
                        "url": link,
                    }
                    if is_comment:
                        comments.append({"type": "comment", **result})
                    else:
                        posts.append({"type": "post", **result})
                except Exception as inner:
                    logging.warning(f"[Playwright] Failed to parse entry: {inner}")
                    continue

            page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

        browser.close()

    logging.info(f"[Playwright] Scraped {len(posts)} posts and {len(comments)} comments")
    return {
        "username": username,
        "posts": posts,
        "comments": comments,
    }


def scrape_with_praw(username: str, limit: int = 20) -> Dict[str, List[Dict]]:
    try:
        user = reddit_api.redditor(username)
        posts = [
            {
                "type": "post",
                "title": submission.title,
                "body": submission.selftext,
                "subreddit": str(submission.subreddit),
                "created_utc": submission.created_utc,
                "url": f"https://www.reddit.com{submission.permalink}",
            }
            for submission in user.submissions.new(limit=limit)
        ]

        comments = [
            {
                "type": "comment",
                "body": comment.body,
                "subreddit": str(comment.subreddit),
                "created_utc": comment.created_utc,
                "url": f"https://www.reddit.com{comment.permalink}",
            }
            for comment in user.comments.new(limit=limit)
        ]

        return {
            "username": username,
            "posts": posts,
            "comments": comments,
        }
    except Exception as e:
        print(f"[PRAW] Scrape error: {e}")
        return {
            "username": username,
            "posts": [],
            "comments": [],
        }


def fetch_user_data(url_or_username: str) -> Dict[str, List[Dict]]:
    username = extract_username(url_or_username)

    about_url = f"https://www.reddit.com/user/{username}/about.json"
    headers = {"User-Agent": "Mozilla/5.0"}

    metadata = {}
    try:
        resp = requests.get(about_url, headers=headers)
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            subreddit_data = data.get("subreddit", {})

            metadata = {
                "username": data.get("name"),
                "profile_picture": data.get("icon_img"),
                "snoovatar": data.get("snoovatar_img"),
                "comment_karma": data.get("comment_karma"),
                "post_karma": data.get("link_karma"),
                "total_karma": data.get("total_karma"),
                "created_utc": data.get("created_utc"),
                "is_mod": data.get("is_mod"),
                "is_gold": data.get("is_gold"),
                "verified": data.get("verified"),
                "has_verified_email": data.get("has_verified_email"),
                "accept_followers": data.get("accept_followers"),
                "occupation": subreddit_data.get("public_description"),
                "status": subreddit_data.get("title"),
                "location": None,
            }
        else:
            logging.warning(f"Non-200 status code: {resp.status_code}")
    except Exception as e:
        logging.error(f"[About.json] Error fetching metadata: {e}")

    playwright_data = scrape_with_playwright(username)
    praw_data = scrape_with_praw(username)

    combined_posts = praw_data.get("posts", [])[:10] + playwright_data.get("posts", [])[:10]
    combined_comments = praw_data.get("comments", [])[:10] + playwright_data.get("comments", [])[:10]

    return {
        **metadata,
        "posts": combined_posts,
        "comments": combined_comments,
    }
