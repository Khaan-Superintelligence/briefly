#!/bin/bash
# Start dev-harness automation server on :9899.
cd ~/workspace/even-realities-headsup/harness
export CHROME_BIN="$HOME/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
exec node serve.mjs --widget http://127.0.0.1:5173/harness/ --port 9899
