from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time


def init_driver():
    chrome_options = Options()
    # Comment out headless mode for debugging
    # chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    service = Service("chromedriver/chromedriver.exe")
    return webdriver.Chrome(service=service, options=chrome_options)


def scrape_old_reddit_user(username):
    url = f"https://old.reddit.com/user/{username}/"
    driver = init_driver()
    driver.get(url)

    try:
        # Wait up to 10 seconds for posts to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.thing"))
        )
        posts = driver.find_elements(By.CSS_SELECTOR, "div.thing")

        data = []
        for post in posts:
            try:
                title = post.find_element(By.CSS_SELECTOR, "a.title").text
                link = post.find_element(By.CSS_SELECTOR, "a.title").get_attribute("href")
                data.append({"title": title, "url": link})
            except Exception as e:
                print(f"⚠️  Skipping one post due to: {e}")
                continue

        print(f"\n📦 Found {len(data)} posts:")
        for item in data:
            print(f"- {item['title']}\n  🔗 {item['url']}")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n📄 Page preview (partial HTML):")
        print(driver.page_source[:1500])  # Print a snippet of the page HTML

    finally:
        driver.quit()


if __name__ == "__main__":
    scrape_old_reddit_user("kojied")
