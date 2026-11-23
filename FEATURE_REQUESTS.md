# Feature requests for the Even Hub platform

Five requests, in the order they would help Briefly most. Each one comes from something we had to work around while building this app.

## 1. A speech-to-text API in the SDK

The SDK hands the app raw microphone audio. Every voice app then has to ship its own recognizer, which means bundling a model or streaming audio to a third-party service. A single `bridge.transcribe()` call, running on the phone, would let small apps offer voice input without that work. Briefly ships preset questions by tap because of this gap. Voice is the input the glasses form factor wants most.

## 2. Read the selected list index without a tap

List navigation today only reports an index inside a tap event. An app that wants to preview the selected item, or to show a hint for it, has to guess the selection from its own scroll counting. That guess drifts when the user scrolls fast. A read-only `currentSelectItemIndex` on the list container, or a scroll event that carries the new index, would remove the drift.

## 3. A glasses-side cache for the last good screen

When the backend is unreachable, the app can only show an error. The glasses could keep the last rendered frame per container and show it stamped as stale, so a glance still answers the question. Briefly would use it for the Brief screen. A stale price from two minutes ago beats a blank screen.

## 4. A documented automation API for the official simulator

The simulator is the only way to test without hardware, but driving it means clicking buttons by hand. A small HTTP automation API, screenshots plus input injection, would let teams run the same end-to-end checks in CI that they run by hand. We built our own headless harness to get this. It works, but it renders firmware pixels approximately, and every team rebuilding it is wasted effort.

## 5. Background refresh for the companion app

The companion app fetches when it is open. A brief that is fresh at 8am has to be fetched at 8am, while the user is already walking out the door. A scheduled background refresh, even once every 15 minutes with a strict battery budget, would make glanceable apps actually glanceable.
