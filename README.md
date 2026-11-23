# Briefly

Your workday, on your glasses.

Briefly is a heads-up AI work brief for Even Realities G2 smart glasses. It answers three questions without pulling out a phone: what is next, what needs doing, and what should I say back. It was built for the Even Realities "Heads Up" hackathon, track 04 AI Assistants & Work (main) with track 03 Exchanges & Stocks (a live market card inside the brief).

## What it does

Three screens, one action each. Tap moves forward. Scroll picks an item. Double-tap closes a dialog.

**Brief.** The next item on your list, mail status, live crypto prices, and top headlines, all on one 576x288 screen. Prices come from the CoinGecko public API. Headlines come from the Hacker News front page.

**Tasks.** Your task list. Tap a task to mark it done. The change is saved to the backend at once, so the brief updates with it. A final list entry jumps to Ask.

**Ask.** Four preset questions: what's next, summarize the top news, how is BTC doing, and draft a reply. Gemini answers the news question in one short sentence from live headlines. Draft a reply writes a short reply to your teammate's message, and one more tap approves it. Approved drafts are logged to an outbox on the backend. Nothing is sent anywhere. The outbox is a log, not a mail client.

## Real data, no mocks

Every number and sentence on the glasses comes from a live service:

- Answers and drafts: Gemini 3.5-flash-lite through the backend, with 3.5-flash as fallback.
- Prices: CoinGecko free API, cached 120 seconds.
- Headlines: Hacker News Algolia front page, cached 300 seconds.
- Tasks and outbox: the Briefly backend, a plain Node server with a JSON store.

Gmail and Google Calendar are optional. When configured, the brief shows unread mail and the next calendar event instead of the top task. Both are off by default and neither was tested against a real mailbox in this build.

## Setup

You need Node 20 or newer. The backend and the app run on the same machine for development.

```bash
# backend (port 3000)
cd server
npm install
GEMINI_API_KEY=your-key npm start

# app (port 5173)
cd app
npm install
npm run dev
```

Then open the simulator:

```bash
cd app
npm run simulate
```

Point the app at a deployed backend by changing `BASE` in `app/src/api.ts` and the `network` whitelist in `app/app.json`. API keys live only on the server. The app never sees a key.

### Optional: Gmail and Calendar

```bash
GMAIL_USER=you@gmail.com GMAIL_APP_PASSWORD=xxxx npm start  # Gmail IMAP
ICAL_URL=https://calendar.google.com/calendar/ical/.../basic.ics npm start  # read-only calendar
```

## How it is put together

```
app/      Vite + TypeScript + Even Hub SDK 0.0.10. Three screens, no mock data.
server/   Node, no framework. /api/brief, /api/tasks, /api/market,
          /api/news, /api/ask, /api/draft, /api/send, /api/outbox.
demo/     End-to-end runner, screenshots, and the demo video.
harness/  Headless test harness (see below).
```

The app talks to the backend over HTTP. The backend calls Gemini, CoinGecko, and Hacker News, and keeps tasks in `server/data.json`. Upstream calls are slow on some networks, so the backend caches prices for 120 seconds and headlines for 300 seconds, and retries a timed-out Gemini call once. The app gives each request 30 seconds before it reports the backend as offline.

## Testing

No G2 hardware was available, so testing ran on the official Even Hub simulator and a headless harness.

`demo/e2e.mjs` drives the app through the harness automation API and checks every step, including lit-pixel counts on the glasses canvas (a blank screen fails the run). The full flow passed 8 of 8 steps on 2026-11-24: brief, task list, task toggle, Ask list, AI news answer, back to list, AI draft, approve to outbox. The toggle and the approval were also confirmed on the server side, with one entry in the outbox at the end.

The same build was then run in the official simulator (`@evenrealities/evenhub-simulator` 0.7.2). The brief rendered with live prices and the next task, matching the harness pixel for pixel. See `demo/shots/09-official-simulator.png`.

The demo video (`demo/briefly-demo.mp4`, 81 seconds) is built from the same eight screenshots by `demo/build-video.sh`.

## Known limits

- Tested on the official simulator and a headless harness only. No real G2 glasses were available.
- Voice input is not in this version. The SDK hands the app raw microphone audio, and speech-to-text is listed under feature requests below. The four preset questions cover the same ground by tap.
- Gmail and Calendar are implemented but not verified against a real account in this build.
- The backend URL in this repo is `http://localhost:3000`. Deploy the server and update `app.json` before putting the app on glasses away from the dev machine.
- The demo backend holds three sample tasks. Your tasks live in `server/data.json`.

## Feature requests for the Even Hub platform

See [FEATURE_REQUESTS.md](FEATURE_REQUESTS.md). Five items, in priority order: a speech-to-text API so apps do not have to ship their own recognizer, a way to read the selected list index without a tap event, a glasses-side cache for the last good brief when the backend is unreachable, a documented automation API for the official simulator, and a battery-friendly background refresh for the companion app.

## Prior work

Built during the hackathon, 2026-11-23 to 2026-11-24. The starting point was the official Even Realities minimal template (Vite, TypeScript, SDK 0.0.10). The headless harness is a clone of [oneticket99/even_hub_dev_simulator](https://github.com/oneticket99/even_hub_dev_simulator), patched to use a local Chromium binary and to serve the app from Vite. Everything else, app and backend, was written for this hackathon.

## Safety

Briefly holds no user funds and gives no investment advice. Market data is read-only. Drafts are logged, never sent. No API key or secret is committed to this repo or shipped in the app.

## License

MIT. See [LICENSE](LICENSE).
