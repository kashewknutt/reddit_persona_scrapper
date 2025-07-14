import os
import time
from typing import List, Dict
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import praw

load_dotenv()

reddit_api = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT")
)

def extract_username(url_or_username: str) -> str:
    if "reddit.com/user/" in url_or_username:
        return url_or_username.rstrip("/").split("/")[-1]
    return url_or_username.strip()


def init_selenium_driver(headless=True):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")

    # Realistic user-agent
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )

    # Anti-detection flags
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)

    from selenium.webdriver.chrome.service import Service
    service = Service("chromedriver/chromedriver.exe")
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # Remove navigator.webdriver
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
            """
        }
    )

    return driver



def scrape_with_selenium(username: str, max_scroll=3) -> Dict[str, List[Dict]]:
    url = f"https://old.reddit.com/user/{username}/"

    driver = init_selenium_driver()
    driver.get(url)
    time.sleep(2)

    posts, comments = [], []

    try:
        for _ in range(max_scroll):
            elements = driver.find_elements(By.CSS_SELECTOR, "div.thing")
            for el in elements:
                try:
                    thing_type = el.get_attribute("data-type")  # 'link' or 'comment'
                    link = el.find_element(By.CSS_SELECTOR, "a.title") if thing_type == "link" else el.find_element(By.CSS_SELECTOR, "a.bylink")
                    body_text = el.text

                    if thing_type == "comment":
                        comments.append({
                            "type": "comment",
                            "body": body_text,
                            "url": link.get_attribute("href")
                        })
                    else:
                        posts.append({
                            "type": "post",
                            "body": body_text,
                            "url": link.get_attribute("href")
                        })
                except:
                    continue

            # Pagination instead of infinite scroll
            next_btn = driver.find_elements(By.CSS_SELECTOR, "span.next-button > a")
            if next_btn:
                next_btn[0].click()
                time.sleep(2)
            else:
                break
    except Exception as e:
        print(f"Selenium scrape error: {e}")
    finally:
        driver.quit()

    if not posts and not comments:
        print(f"No posts/comments scraped with Selenium for user {username}")

    return {
        "username": username,
        "posts": posts,
        "comments": comments
    }


def scrape_with_praw(username: str, limit: int = 20) -> Dict[str, List[Dict]]:
    try:
        user = reddit_api.redditor(username)
        posts = []
        for submission in user.submissions.new(limit=limit):
            posts.append({
                "type": "post",
                "title": submission.title,
                "body": submission.selftext,
                "subreddit": str(submission.subreddit),
                "created_utc": submission.created_utc,
                "url": f"https://www.reddit.com{submission.permalink}"
            })

        comments = []
        for comment in user.comments.new(limit=limit):
            comments.append({
                "type": "comment",
                "body": comment.body,
                "subreddit": str(comment.subreddit),
                "created_utc": comment.created_utc,
                "url": f"https://www.reddit.com{comment.permalink}"
            })

        return {
            "username": username,
            "posts": posts,
            "comments": comments
        }
    except Exception as e:
        print(f"PRAW scrape error: {e}")
        return {
            "username": username,
            "posts": [],
            "comments": []
        }


def fetch_user_data(url_or_username: str) -> Dict[str, List[Dict]]:
    username = extract_username(url_or_username)
    data = scrape_with_selenium(username)

    if len(data["posts"]) < 2 and len(data["comments"]) < 2:
        print("Falling back to PRAW...")
        data = scrape_with_praw(username)

    return data
