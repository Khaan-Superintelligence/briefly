#!/usr/bin/env node
// Briefly E2E re-run against the dev harness (automation :9899).
// Steps mirror the first green run; saves fresh shots to demo/shots/.
// Usage: node e2e.mjs   (backend :3000, vite :5173, harness :9899 must be up)
import { writeFileSync } from 'node:fs'

const H = 'http://127.0.0.1:9899'
const B = 'http://127.0.0.1:3000'
const SHOTS = new URL('../demo/shots/', import.meta.url).pathname

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function input(action) {
  const r = await fetch(`${H}/api/input`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!r.ok) throw new Error(`input ${action} -> ${r.status}`)
}
async function shot(name) {
  const s = await (await fetch(`${H}/api/screenshot/glasses?stats=1`)).json()
  const png = Buffer.from(await (await fetch(`${H}/api/screenshot/glasses`)).arrayBuffer())
  writeFileSync(`${SHOTS}${name}.png`, png)
  console.log(`${name}: litPixels=${s.litPixels}`)
  if (s.litPixels < 500) throw new Error(`${name}: screen looks blank (${s.litPixels})`)
  return s.litPixels
}
async function webview(name) {
  const png = Buffer.from(await (await fetch(`${H}/api/screenshot/webview`)).arrayBuffer())
  writeFileSync(`${SHOTS}${name}-webview.png`, png)
}

const results = []
// 1. Brief (fresh page load state)
results.push(await shot('01-brief'))
await webview('01-brief')
// 2. Tap -> Tasks
await input('click'); await sleep(1200)
results.push(await shot('02-tasks'))
// 3. Tap -> toggle first task
await input('click'); await sleep(1500)
results.push(await shot('03-task-toggled'))
// 4. Scroll down x3 to pseudo-item, tap -> Ask list
for (let i = 0; i < 3; i++) { await input('down'); await sleep(400) }
await input('click'); await sleep(1200)
results.push(await shot('04-ask-list'))
// 5. Scroll to "Summarize the top news" (idx 1), tap -> AI answer
await input('down'); await sleep(400)
await input('click'); await sleep(20000) // Gemini via sandbox egress: 13s+ per call
results.push(await shot('05-ask-answer'))
// 6. Tap -> back to Ask list
await input('click'); await sleep(800)
results.push(await shot('06-ask-back'))
// 7. Scroll to "Draft a reply" (idx 3), tap -> draft (Gemini).
// askSel persists from step 5 (=1), so first scroll fully up to 0.
for (let i = 0; i < 4; i++) { await input('up'); await sleep(300) }
for (let i = 0; i < 3; i++) { await input('down'); await sleep(400) }
await input('click'); await sleep(20000) // Gemini via sandbox egress: 13s+ per call
results.push(await shot('07-draft'))
await webview('07-draft')
// 8. Tap -> approve, logged to outbox
await input('click'); await sleep(1500)
results.push(await shot('08-approved'))

// Verify server-side effects
const tasks = await (await fetch(`${B}/api/tasks`)).json()
const outbox = await (await fetch(`${B}/api/outbox`)).json()
const t1 = tasks.tasks.find((t) => t.id === 'seed1')
console.log('seed1 done =', t1?.done, '| outbox entries =', outbox.outbox.length)
if (!t1?.done) throw new Error('seed1 was not toggled done')
if (outbox.outbox.length < 1) throw new Error('outbox empty after approve')
console.log('E2E GREEN — 8/8 shots, litPixels:', results.join(', '))
