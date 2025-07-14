#  Reddit Persona Profiler

Scrape any Reddit user's profile and generate a detailed personality analysis using AI.

---

##  Features

- Reddit scraper for public user data (posts & comments)
- Persona generation using AI (powered by OpenRouter LLMs)
- Beautiful Next.js frontend with history and visualization
- Export persona insights as `.pdf` or `.txt`

---

##  Setup Instructions

Follow these steps to get the app running locally on your machine.

---

## 🗂️ Project Structure

```bash
root/ 
├── backend/              # FastAPI backend 
│   ├── main.py 
│   ├── reddit_scraper.py # You might need to edit this if not on Windows
│   ├── .env              # You'll create this 
│   └── requirements.txt 
└── frontend/             # Next.js 15     
```


---

## 🐍 Backend Setup

1. **Open a terminal and navigate to the project root:**
    
    ```bash
    cd .....\reddit_persona_scrapper>
    ```
    
2. **Enter the backend folder:**
    ```bash
    cd backend
    ```
    
3. **Create a virtual environment:**

    ```bash
    python -m venv venv
    ```
    
4. **Activate the virtual environment:**
    
    - **Windows:**
      ```bash
      venv\Scripts\activate
      ```
    - **macOS/Linux:**
      ```bash
      source venv/bin/activate
      ```
        
5. **Install dependencies:**
    
    ```bash
    pip install -r requirements.txt
    ```
    

---

## 🔑 Setting up API Keys

### 🛠️ 1. Reddit API Setup

You’ll need Reddit API credentials:

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps).
    
2. Scroll to the bottom and click **"Create App"** or **"Create Another App"**.
    
3. Fill in the fields:
    
    - **Name:** PersonaScrapper
        
    - **App type:** `script`
        
    - **Redirect URI:** `http://localhost:8080`
        
    - **Description:** Optional
        
4. Once created, copy your:
    
    - `client_id` - This will be under your app name, on the top left corner.
        
    - `client_secret` - This will be labelled 'secret' clearly.
        

### 2. OpenRouter API Setup (LLM Access)

OpenRouter provides free access to powerful open-source LLMs.

1. Visit [https://openrouter.ai](https://openrouter.ai)
    
2. Sign up for a free account.

3. Go to `Keys` in the top right dropdown.

3. Alternatively, you could go to `Settings` and choose `Api Keys` in the left sidebar.
    
4. In the API Keys, Create a New Key.

5. Name it anything you want, and you can even add the usage limit and set it to `0`. (Just to be safe.)

6. Copy your API Key for now, You'll will need to add it into the `.env`
    

> Everything is 100% free to use. No billing is required for this app.

---

## Create the `.env` file

Create a file named `.env` inside the **backend/** folder (not the root), with the following content:

```ini
REDDIT_CLIENT_ID=your_reddit_client_id # You'll get this from the reddit app.
REDDIT_CLIENT_SECRET=your_reddit_client_secret # You'll get this from reddit.
REDDIT_USER_AGENT="script:PersonaScrapper:0.1 (by /u/{your reddit username})" # Cope this as it is
OPENROUTER_API_KEY=your_openrouter_key # You'll get a key when you register here. Don't worry, the model I'm using is free, you won't be charged.
```

---

## Chromedriver Instructions

If you're not using **Windows**, you need to install the correct `chromedriver` for your OS:

1. Visit https://chromedriver.chromium.org/downloads
    
2. Download the version matching your Chrome browser.
    
3. Rename the downloaded file to `chromedriver` (no extension).
    
4. Replace the existing file in `backend/reddit_scraper.py` or update the path accordingly.
    

> **Windows users:** You don’t need to install anything. `chromedriver.exe` is already included.

---

## Running the Backend

With your environment set up and `.env` in place:

```bash
uvicorn main:app --reload
```

Your FastAPI server will be live at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Frontend Setup

1. Open a **new terminal window** (do NOT close the backend).
    
2. Navigate to the frontend folder:
    
    ```bash
    cd frontend
    ```
    
3. Install dependencies:
    
    ```bash
    npm install
    ```
    
4. Start the development server:
    
    ```bash
    npm run dev
    ```
    

Your app will be live at: [http://localhost:3000](http://localhost:3000)

---

## All Set!

You can now enter any Reddit username and generate an AI-powered personality insight with history, export options, and more!

---

## Tech Stack

- **Frontend:** Next.js 14, TailwindCSS, React
    
- **Backend:** FastAPI, PRAW, OpenRouter
    
- **AI:** Gemma (via OpenRouter)
    
- **PDF/TXT Export:** HTML-to-PDF, download link
    
- **Scraping:** Reddit's official API + optional Chromedriver
    

---

## License

MIT License