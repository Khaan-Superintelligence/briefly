#!/bin/bash
# Start Briefly backend with Gemini key from env file.
cd ~/workspace/even-realities-headsup/server
set -a; source ~/workspace/khaan-si/api-keys.env 2>/dev/null; set +a
# server/lib/gemini.mjs reads GEMINI_API_KEY; the key file only carries
# suffixed variants — map the imahgal key to the plain name.
export GEMINI_API_KEY="${GEMINI_API_KEY_IMAHGAL:-}"
exec node server.mjs
