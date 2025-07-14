
from reddit_scraper import fetch_user_data


if __name__ == "__main__":
    url = "https://www.reddit.com/user/kojied/"
    data = fetch_user_data(url)

    print(f"\nUser: {data['username']}")
    print("\nRecent Posts:")
    for post in data['posts'][:3]:
        print(f"- {post.get('title', 'No title')} — {post['url']}\n{post.get('body', '')[:200]}\n")

    print("\nRecent Comments:")
    for comment in data['comments'][:3]:
        print(f"- {comment['url']}\n{comment.get('body', '')[:200]}\n")
