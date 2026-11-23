// Optional Google Calendar module (env-gated).
// Reads the user's real calendar from its secret iCal URL.
// Setup (user step, 1 minute, no new account):
//   Google Calendar -> Settings -> your calendar -> "Secret address in
//   iCal format" -> copy the URL into .env as ICAL_URL.
// If ICAL_URL is absent the module is inert and the brief falls back to
// the next undone task instead of inventing a meeting.
function parseIcsDate(s) {
  // 20261130T020000Z or 20261130T020000
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/)
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]))
}

export function calendarConfigured() {
  return Boolean(process.env.ICAL_URL)
}

export async function nextEvent() {
  if (!calendarConfigured()) return null
  const res = await fetch(process.env.ICAL_URL, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`iCal ${res.status}`)
  const text = await res.text()
  const now = new Date()
  let best = null
  for (const block of text.split('BEGIN:VEVENT')) {
    const sum = /SUMMARY:(.*)/.exec(block)?.[1]?.trim()
    const start = /DTSTART[^:]*:(.*)/.exec(block)?.[1]?.trim()
    if (!sum || !start) continue
    const d = parseIcsDate(start)
    if (!d || d < now) continue
    if (!best || d < best.start) best = { summary: sum, start: d }
  }
  return best
}
