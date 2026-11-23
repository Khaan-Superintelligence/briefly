// Live public data. No keys, no accounts, no mock data.
// Prices: Coinbase Exchange public stats API (Coinbase is a track-03 listed
// app). One call per symbol, no key. 24h change is derived from the stats
// open vs last price. Headlines: Hacker News front page (no key).
const CB = 'https://api.exchange.coinbase.com/products'
const HN = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5'

const IDS = [
  { id: 'BTC', symbol: 'BTC' },
  { id: 'ETH', symbol: 'ETH' },
  { id: 'SOL', symbol: 'SOL' },
]

let marketCache = { at: 0, data: null }
let newsCache = { at: 0, data: null }

async function oneStat(sym) {
  const res = await fetch(`${CB}/${sym}-USD/stats`, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`Coinbase ${sym} ${res.status}`)
  const j = await res.json()
  const last = Number(j.last)
  const open = Number(j.open)
  if (!last || !open) throw new Error(`Coinbase ${sym} bad stats`)
  return { symbol: sym, price: last, changePct: ((last - open) / open) * 100 }
}

export async function market() {
  if (Date.now() - marketCache.at < 120_000 && marketCache.data) return marketCache.data
  const data = (await Promise.all(IDS.map(({ id }) => oneStat(id)))).filter((m) => m.price !== null)
  if (!data.length) throw new Error('Coinbase returned no prices')
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
