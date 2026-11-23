// Briefly backend — Node, no framework, built-in http + fetch.
// Serves the G2 glasses app: brief, tasks, AI answers, market, news,
// drafted replies (outbox), and optional Gmail / Calendar modules.
//
// Run:
//   set -a; source ~/workspace/khaan-si/api-keys.env   # GEMINI_API_KEY
//   cp .env.example .env   # optional: GMAIL_*, ICAL_URL
//   npm install && npm start        # listens on :3000
import http from 'node:http'
import { geminiShort } from './lib/gemini.mjs'
import { market, news } from './lib/market.mjs'
import { listTasks, addTask, toggleTask, deleteTask, listOutbox, sendOutbox } from './lib/store.mjs'
import { gmailConfigured, unreadMail } from './lib/gmail.mjs'
import { calendarConfigured, nextEvent } from './lib/calendar.mjs'

const PORT = Number(process.env.PORT || 3000)

function json(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let s = ''
    req.on('data', (c) => { s += c; if (s.length > 200_000) req.destroy() })
    req.on('end', () => {
      try { resolve(JSON.parse(s || '{}')) } catch { resolve({}) }
    })
  })
}

function fmtMoney(n, digits = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

async function buildBrief() {
  const [tasks, marketData, newsData] = await Promise.allSettled([
    Promise.resolve(listTasks()),
    market(),
    news(),
  ])
  const open = (tasks.status === 'fulfilled' ? tasks.value : []).filter((t) => !t.done)
  const mkt = marketData.status === 'fulfilled' ? marketData.value : []
  const nws = newsData.status === 'fulfilled' ? newsData.value : []

  // Next meeting: real calendar when connected, else the top open task.
  let next = null
  let nextSource = 'task'
  if (calendarConfigured()) {
    try {
      const ev = await nextEvent()
      if (ev) { next = { title: ev.summary, when: ev.start.toISOString() }; nextSource = 'calendar' }
    } catch (e) { console.error('calendar:', e.message) }
  }
  if (!next && open.length) next = { title: open[0].text, when: null }

  // Urgent mail: real Gmail when connected, else not connected (never invented).
  let mail = { connected: gmailConfigured(), unread: 0, top: null }
  if (gmailConfigured()) {
    try {
      const r = await unreadMail(1)
      mail = { connected: true, unread: r.items.length, top: r.items[0] || null }
    } catch (e) { console.error('gmail:', e.message); mail = { connected: false, unread: 0, top: null, error: String(e.message).slice(0, 80) } }
  }

  return {
    next, nextSource,
    openCount: open.length,
    mail,
    market: mkt.map((m) => ({ symbol: m.symbol, price: m.price, changePct: m.changePct })),
    marketLine: mkt.map((m) => `${m.symbol} $${fmtMoney(m.price)} ${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(1)}%`).join('  '),
    newsTop: nws[0] ? nws[0].title : null,
    news: nws.slice(0, 3),
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end() }
  const url = new URL(req.url, `http://${req.headers.host}`)
  const p = url.pathname
  try {
    if (p === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true, mail: gmailConfigured(), calendar: calendarConfigured() })

    if (p === '/api/brief' && req.method === 'GET') return json(res, 200, await buildBrief())

    if (p === '/api/tasks' && req.method === 'GET') return json(res, 200, { tasks: listTasks() })
    if (p === '/api/tasks' && req.method === 'POST') {
      const b = await readBody(req)
      if (!b.text || typeof b.text !== 'string') return json(res, 400, { error: 'text required' })
      return json(res, 201, { task: addTask(b.text) })
    }
    const mDone = p.match(/^\/api\/tasks\/([\w-]+)\/done$/)
    if (mDone && req.method === 'POST') {
      const t = toggleTask(mDone[1])
      return t ? json(res, 200, { task: t }) : json(res, 404, { error: 'not found' })
    }
    const mDel = p.match(/^\/api\/tasks\/([\w-]+)$/)
    if (mDel && req.method === 'DELETE') { deleteTask(mDel[1]); return json(res, 200, { ok: true }) }

    if (p === '/api/market' && req.method === 'GET') { try { return json(res, 200, { market: await market() }) } catch (e) { return json(res, 200, { market: [], error: String(e.message).slice(0, 120) }) } }
    if (p === '/api/news' && req.method === 'GET') { try { return json(res, 200, { news: await news() }) } catch (e) { return json(res, 200, { news: [], error: String(e.message).slice(0, 120) }) } }

    if (p === '/api/ask' && req.method === 'POST') {
      const b = await readBody(req)
      const q = (b.q || '').toString().slice(0, 500)
      if (!q) return json(res, 400, { error: 'q required' })
      const answer = await geminiShort(
        `You are a glanceable AI assistant on smart glasses. Answer in at most 2 short sentences, plain words, no markdown, no lists. Question: ${q}`,
      )
      return json(res, 200, { answer })
    }

    if (p === '/api/draft' && req.method === 'POST') {
      const b = await readBody(req)
      const ctx = (b.context || '').toString().slice(0, 1000)
      if (!ctx) return json(res, 400, { error: 'context required' })
      const draft = await geminiShort(
        `Draft a short, polite reply (at most 3 sentences, plain words, no greeting line, no sign-off) to this message or situation: ${ctx}`,
      )
      return json(res, 200, { draft })
    }

    if (p === '/api/send' && req.method === 'POST') {
      const b = await readBody(req)
      if (!b.text) return json(res, 400, { error: 'text required' })
      const item = sendOutbox({ to: (b.to || '').toString().slice(0, 200), text: b.text.toString().slice(0, 2000), channel: (b.channel || 'note').toString() })
      return json(res, 201, { sent: item })
    }
    if (p === '/api/outbox' && req.method === 'GET') return json(res, 200, { outbox: listOutbox() })

    return json(res, 404, { error: 'not found' })
  } catch (e) {
    console.error(req.method, p, e.message)
    return json(res, 500, { error: String(e.message).slice(0, 200) })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Briefly backend on :${PORT} (mail=${gmailConfigured()} calendar=${calendarConfigured()})`)
})
