# News Intelligence Hub — Local Ingestion Agent

A local CLI tool that runs on your machine to automatically discover and import articles from premium sources (The Economist, FT, Bloomberg) using your authenticated browser sessions.

## How It Works

1. **You log into economist.com** in Chrome as normal
2. **The agent reads your Chrome profile** to use your existing session cookies
3. **It visits configured section pages** (Homepage, Business, Finance, etc.)
4. **Discovers new article URLs** by parsing the page
5. **Extracts full article content** using your authenticated session
6. **Pushes articles to your News Intel Hub** via Supabase

No passwords are stored in the cloud. Everything runs locally on your machine.

## Setup

### Prerequisites

- Node.js 18+
- Chrome browser (logged into your premium source accounts)
- A News Intelligence Hub account (the web app)

### Install

```bash
cd agent
npm install
npx playwright install chromium
```

### Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://dhotjrblrzfkttpomlzl.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Your News Intel Hub login (NOT your Economist login)
USER_EMAIL=you@example.com
USER_PASSWORD=your_app_password

# Your Chrome profile path (see below)
CHROME_PROFILE_PATH=/path/to/chrome/profile
```

**Finding your Chrome profile path:**

| OS      | Default Path                                                   |
|---------|----------------------------------------------------------------|
| macOS   | `~/Library/Application Support/Google/Chrome/Default`          |
| Linux   | `~/.config/google-chrome/Default`                              |
| Windows | `%LOCALAPPDATA%\Google\Chrome\User Data\Default`               |

> **Important**: Close Chrome before running the agent (Chrome locks the profile directory).

### Add a Source in the App

1. Open News Intelligence Hub in your browser
2. Go to **Sources** → **Add Source**
3. Select **The Economist**
4. Choose which sections to monitor
5. Enable **Auto-sync**
6. Choose a sync frequency

## Usage

### Sync sources + briefing

```bash
npm start sync
```

Discovers and imports new articles from all enabled sources, plus syncs The Economist's "World in Brief" briefing.

### Sync only briefing (faster)

```bash
npm start briefing
```

Syncs only The Economist's "World in Brief" briefing without syncing full articles. Faster for getting daily updates.

### Run as daemon

```bash
npm start daemon
```

Runs continuously, syncing at the interval you configured (default: every 60 minutes).

### What you'll see

```
🚀 News Intelligence Hub — Local Agent
   Time: 3/8/2026, 2:30:00 PM

Found 1 source(s) to sync:
  • The Economist (browser_session_connector)

═══════════════════════════════════════
📰 Syncing: The Economist (economist.com)
═══════════════════════════════════════
🌐 Launching browser with your Chrome profile...

📂 Section: Homepage
  🔍 Discovering articles from: https://www.economist.com/
    Found 24 article links
    ✚ New: Iran nuclear talks stall after new sanctions warning
    ✚ New: Fed holds rates as inflation concerns persist

📂 Section: Finance & Economics
  🔍 Discovering articles from: https://www.economist.com/finance-and-economics
    Found 12 article links
    ✚ New: Why bond markets are getting nervous

📊 Discovery complete: 36 found, 3 new

📥 Extracting 3 new articles...

  📄 Extracting: https://www.economist.com/leaders/2026/03/08/...
    ✓ Extracted: "Iran nuclear talks stall" (4,230 chars)
    ✓ Imported: Iran nuclear talks stall after new sanctions warning

✅ Sync complete: 3 imported, 0 errors
```

## Running on a Schedule (Optional)

Instead of the built-in daemon, you can use your system's cron:

**macOS/Linux crontab:**
```cron
# Sync every hour
0 * * * * cd /path/to/agent && node --loader tsx src/index.ts sync >> /tmp/newsintel-agent.log 2>&1
```

**macOS launchd:** Create `~/Library/LaunchAgents/com.newsintel.agent.plist` for more reliable scheduling.

## Troubleshooting

### "Article appears paywalled"
→ Make sure you're logged into economist.com in Chrome and your subscription is active.

### "Chrome profile locked"
→ Close Chrome before running the agent. Chrome locks the profile directory.

### "Auth failed"
→ Check your News Intel Hub email/password in `.env` (not your Economist credentials).

## Architecture

```
Your Machine                          Cloud (Supabase)
┌─────────────────┐                  ┌──────────────────┐
│  Chrome Browser  │                 │  News Intel Hub   │
│  (logged into    │                 │                   │
│   economist.com) │                 │  ┌─────────────┐  │
│         │        │                 │  │  sources     │  │
│         ▼        │                 │  │  articles    │  │
│  ┌─────────────┐ │   Supabase     │  │  discovered_ │  │
│  │ Local Agent │ │───────────────▶│  │  urls        │  │
│  │ (this tool) │ │   API calls    │  │  sync_runs   │  │
│  └─────────────┘ │                 │  └─────────────┘  │
└─────────────────┘                  └──────────────────┘
```

No credentials for premium sources ever leave your machine.
