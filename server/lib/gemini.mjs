// Gemini client. Uses the user's existing key from env (GEMINI_API_KEY).
// Model: gemini-3.5-flash-lite (fast, free tier), fallback gemini-3.5-flash.
// NOTE: the generateContent body must contain ONLY `contents` — adding
// generationConfig makes the API return 400.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function gemini(prompt, { model = 'gemini-3.5-flash-lite' } = {}) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  const url = `${BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  return text.trim()
}

export async function geminiShort(prompt) {
  try {
    return await gemini(prompt)
  } catch (e) {
    // One retry on timeout/abort: the sandbox egress path is slow on a cold
    // connection (first call can take 13s+); a single retry usually lands.
    if (/abort|timeout|Timeout|ECONNRESET|ETIMEDOUT/i.test(String(e.message))) {
      try {
        return await gemini(prompt)
      } catch (e2) {
        if (/404|400/.test(String(e2.message))) {
          return await gemini(prompt, { model: 'gemini-3.5-flash' })
        }
        throw e2
      }
    }
    if (/404|400/.test(String(e.message))) {
      return await gemini(prompt, { model: 'gemini-3.5-flash' })
    }
    throw e
  }
}
