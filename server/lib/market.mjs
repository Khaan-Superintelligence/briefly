// Live public data. No keys, no accounts, no mock data.
// CoinGecko free price API (no key) + Hacker News front page (no key).
// (Binance public API is geo-blocked from this host — 451 — so it is not
// used. CoinGecko returns the same live prices.)
const CG = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'
const HN = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5'

const IDS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
]

let marketCache = { at: 0, data: null }
let newsCache = { at: 0, data: null }

export async function market() {
  if (Date.now() - marketCache.at < 120_000 && marketCache.data) return marketCache.data
  const res = await fetch(CG, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const json = await res.json()
  const data = IDS.map(({ id, symbol }) => ({
    symbol,
    price: json[id]?.usd ?? null,
    changePct: json[id]?.usd_24h_change ?? null,
  })).filter((m) => m.price !== null)
  marketCache = { at: Date.now(), data }
  return data
}

export async function news() {
  if (Date.now() - newsCache.at < 300_000 && newsCache.data) return newsCache.data
  const res = await fetch(HN, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`HN ${res.status}`)
  const json = await res.json()
  const data = (json.hits || []).map((h) => ({ title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}` }))
  newsCache = { at: Date.now(), data }
  return data
}
