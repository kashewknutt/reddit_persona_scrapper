
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def init_driver(headless=False):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)

    service = Service("chromedriver/chromedriver.exe")
    driver = webdriver.Chrome(service=service, options=chrome_options)

    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": (
                "Object.defineProperty(navigator, 'webdriver', { get: () => undefined })"
            )
        },
    )

    return driver


def scrape_new_reddit_user(username, max_scrolls=3):
    url = f"https://www.reddit.com/user/{username}/"
    print(f"Visiting: {url}")
    driver = init_driver()
    driver.get(url)

    post_data = []

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "div[data-testid='post-container']")
            )
        )

        for scroll_num in range(max_scrolls):
            print(f"🌀 Scroll attempt {scroll_num + 1}/{max_scrolls}")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)  # Allow time for new posts to load

        posts = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='post-container']")
        print(f"Found {len(posts)} post containers")

        for post in posts:
            try:
                title_elem = post.find_element(By.TAG_NAME, "h3")
                title = title_elem.text
                url_elem = post.find_element(By.TAG_NAME, "a")
                post_url = url_elem.get_attribute("href")
                post_data.append({"title": title, "url": post_url})
            except Exception as e:
                print(f"Skipping a post due to error: {e}")
                continue

        print(f"\nExtracted {len(post_data)} posts:")
        for item in post_data:
            print(f"- {item['title']}\n  🔗 {item['url']}")

    except Exception as e:
        print(f"Failed to load or parse page: {e}")
        print(driver.page_source[:2000])  # Optional: for debugging

    finally:
        driver.quit()


if __name__ == "__main__":
    scrape_new_reddit_user("spez")
