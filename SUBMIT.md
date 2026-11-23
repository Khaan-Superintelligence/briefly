# SUBMIT — Briefly, Even Realities Heads Up

Status: **ready to submit**. Everything the form needs is below, copy-paste ready. Two user steps remain (about 10 minutes total). Do them in order, any time before **Nov 30, 03:59 CST** (Nov 29, 23:59 Dubai).

## Step 1 — Create the repo and push (about 5 minutes)

Why this is a user step: the GitHub App token available to the assistant cannot create repositories (403 on both the personal account and the KhaanSI org), and this VM's SSH key is not authorized on GitHub. Creating the repo takes one minute in the browser.

1. Open https://github.com/new (logged in as Mahgal).
2. Owner: **KhaanSI**. Repository name: **briefly**. Description: `Briefly — your workday, on your glasses. Heads-up AI work brief for Even Realities G2 smart glasses.`
3. Public. Do NOT tick "Add a README" (the repo already has one). Create repository.
4. Then push from this machine (the local repo already has the full history, 2 commits):

```bash
cd ~/workspace/even-realities-headsup
git remote add origin git@github.com:KhaanSI/briefly.git
git push -u origin main
```

If SSH push asks for a key that is not authorized, use HTTPS instead (it will ask for your GitHub login in the browser flow):

```bash
git remote add origin https://github.com/KhaanSI/briefly.git
git push -u origin main
```

5. Check the repo page shows the README, `app/`, `server/`, `demo/`, `FEATURE_REQUESTS.md`, and the video file. If you created it under **Mahgal** instead of KhaanSI, the repo URL below changes to `https://github.com/Mahgal/briefly`, and the video end card will say KhaanSI. That is cosmetic only; the submission still works.

## Step 2 — Submit on DoraHacks (about 5 minutes)

1. Open https://dorahacks.io/hackathon/even-realities/detail (logged in).
2. Click Submit / Apply for this hackathon, and fill in the fields below.
3. Demo video: the form usually takes a video link. Upload `demo/briefly-demo.mp4` to YouTube as Unlisted (or Vimeo) and paste the link. If the form accepts a direct file upload, upload the mp4 itself. The video is 81 seconds, 534 KB.
4. Optional `.ehpk`: attach `briefly-0.1.0.ehpk` if the form has a slot for it.

## Copy-paste form text

**Project name:** Briefly

**Tagline:** Your workday, on your glasses.

**Repository:** https://github.com/KhaanSI/briefly

**Tracks:** 04 AI Assistants & Work (main), 03 Exchanges & Stocks (secondary)

**Description:**

Problem: the workday lives on the phone, and checking it means pulling the phone out, unlocking it, and losing the thread of whatever you were doing. On smart glasses the check should take a glance and a tap.

Who it is for: anyone whose day is a list of tasks, a mailbox, and a market they watch. Knowledge workers first, but the pattern fits anyone who wants the next thing without the phone.

How it works: Briefly is a web app for Even Realities G2, with a small Node backend. Three screens. Brief shows the next task, mail status, live crypto prices from Coinbase, and top headlines. Tasks lists the day, and a tap marks one done and saves it. Ask offers four preset questions: Gemini answers the news question in one short sentence from live headlines, and drafts a short reply to a teammate, which one more tap approves and logs to an outbox. Nothing is sent without a tap. The market card is the track 03 half: live BTC, ETH and SOL prices, read-only, no trading, no advice. Every number on the glasses comes from a live service. No mocks.

**Feature requests (paste all five, or attach FEATURE_REQUESTS.md):**

1. A speech-to-text API in the SDK, so apps do not have to ship their own recognizer.
2. A way to read the selected list index without a tap event.
3. A glasses-side cache for the last good screen when the backend is unreachable.
4. A documented automation API for the official simulator.
5. Background refresh for the companion app.

## After submitting

- Demo Day is Dec 3, 14:00–18:00 Dubai time, at Daos Hub. Finalists can demo remotely. If Briefly is picked as a finalist, the demo is the same 8-step flow as the video, run live in the simulator.
- Prize money is paid in USDT within 7 days of Demo Day. One cash prize per project (highest one if it places in several categories).
- Keep the backend running if a live demo is needed: `cd ~/workspace/even-realities-headsup/server && ./start.sh` (needs `GEMINI_API_KEY` in the environment, see `server/.env.example`).

## Files in this package

| File | What it is |
|---|---|
| `README.md` | Repo README (setup, testing, limits, prior work) |
| `SUBMISSION_CHECKLIST.md` | Rule-by-rule self-check against the official page |
| `FEATURE_REQUESTS.md` | The 5 feature requests |
| `demo/briefly-demo.mp4` | 81-second demo video |
| `demo/DEMO_SCRIPT.md` | Narration for the video |
| `demo/shots/` | 8 end-to-end screenshots + official simulator shot |
| `briefly-0.1.0.ehpk` | Optional packaged build (32,726 bytes) |
| `demo/e2e.mjs` | The end-to-end test runner (8/8 green) |
