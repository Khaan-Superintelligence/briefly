# Submission self-check — Briefly vs the official rules

Checked against the DoraHacks page (https://dorahacks.io/hackathon/even-realities/detail, read 2026-11-24). Deadline: Nov 29, 23:59 Dubai time (Nov 30, 03:59 CST).

## What to submit

| Required item | Status |
|---|---|
| Public GitHub/GitLab repo with a README explaining setup | READY, not yet pushed. Local git repo has 2 commits, 55 files. Pushing needs a repo created first (see SUBMIT.md). README covers setup, architecture, testing, limits, prior work. |
| Demo video, up to 3 minutes, simulator or G2 | READY. `demo/briefly-demo.mp4`, 81 seconds, 1152x720, built from the 8 end-to-end screenshots. |
| Short description: problem, audience, how it works, track | READY, copy-paste text in SUBMIT.md. |
| Feature requests, up to 5 | READY. `FEATURE_REQUESTS.md`, 5 items. |
| Optional packaged `.ehpk` | READY. `briefly-0.1.0.ehpk`, 32,726 bytes, magic `EHPK`, min_app_version stamped 2.2.5 (SDK 0.0.10 floor). |

## Rules

| Rule | Status |
|---|---|
| Team of 1–4, anywhere in the world | PASS. Solo, Mahgal. |
| Built during the hackathon (Nov 23–29) | PASS. Built Nov 23–24. README "Prior work" states what existed before Nov 23: the official minimal template and the cloned headless harness. |
| Use only the apps listed in the tracks entered | PASS with one disclosed exception, see below. Track 04 (main): Gemini answers, Gmail/Calendar modules implemented. Track 03 (secondary): live prices from the Coinbase public API, and Coinbase is listed in track 03. |
| Money safety: testnet/paper/read-only, no user funds, no financial advice, never commit keys/secrets | PASS. Market data is read-only. Drafts are logged, never sent. No key or secret is in the repo (verified: `grep -r` for key patterns finds only env-var names; `server/.env.example` has placeholders only). |
| Respect service terms and privacy | PASS. Public APIs only, no scraping, no other app's notifications, no personal data. |
| One screen at a time, glanceable, 576x288 monochrome | PASS. Three screens, each one thing, short lines, verified on the official simulator. |
| Backend, no keys in the app, app.json whitelist | PASS. Keys live only on the server. `app.json` whitelists `http://localhost:3000` for dev; README says to replace it with a deployed URL. |

## Known deviation, disclosed

Track 04 lists Claude, ChatGPT, OpenRouter, Notion, and Google Workspace. Briefly answers with Google Gemini, reached directly. Claude and ChatGPT were not usable here (no key for either), and OpenRouter was checked on 2026-11-24 and has a zero balance (402, never purchased credits); topping it up would mean paying, which the project does not do. Gemini is Google's AI assistant, the same kind of provider as the listed ones, and the event's own material names Gemini in the stack. The README says this plainly. The integration is a live model call per question, not canned text.

## Known limits, disclosed in README

- Tested on the official simulator and a headless harness only. No real G2 hardware was available.
- Voice input is not in v1. The SDK gives raw microphone audio; speech-to-text is feature request 1. Preset questions cover the same ground by tap.
- Gmail and Calendar modules are implemented but not verified against a real account in this build. They are off by default.
- The backend URL in the repo is `http://localhost:3000`. Deploy the server and update `app.json` before using the app away from the dev machine.

## Test evidence

- End-to-end run 2026-11-24, 8 of 8 steps, harness automation: brief 5483 lit pixels, tasks 7554, toggle 7573, Ask list 3561, AI answer 5485, back 3597, AI draft 6195, approve 3032. Server side confirmed: seed task done, 1 outbox entry. Runner: `demo/e2e.mjs`.
- Official simulator (`@evenrealities/evenhub-simulator` 0.7.2) run under Xvfb: brief rendered with live Coinbase prices and the next task. Screenshot: `demo/shots/09-official-simulator.png`.
- Production build passes: `npm run build` (74.86 kB JS), `evenhub pack` produces a valid `.ehpk`.
- Three real bugs found and fixed during this pass: Gemini key not mapped to `GEMINI_API_KEY`, app/backend 8-second timeouts racing slow sandbox egress (raised to 30s app / 25s upstream, Gemini 45s with one retry), and an Ask-list selection that persisted across screens in the test runner.
