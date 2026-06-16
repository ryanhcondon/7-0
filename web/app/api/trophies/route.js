// POST /api/trophies
//
// Proxies 17lands' recent-trophy list. This is the ONLY repeated/polling call
// the proxy makes, so it's the traffic 17lands cares about — we protect it with:
//   - a short in-memory TTL cache keyed by the filter body (per warm instance)
//   - a global minimum interval between live upstream calls (crude rate limit)
// Both are per-instance (Vercel serverless), so they cap a single hot instance
// rather than enforcing a strict global rate; good enough for the expected load
// and they keep us from hammering 17lands during bursts.
//
// Body: { expansion?, event_type?, card_names?, ranks?, deck_colors? }

import { fetchTrophies } from '../../../lib/seventeenlands.js'
import { json, error, liveGate, fromUpstream } from '../_lib/respond.js'

const TTL_MS = 60_000 // serve a cached list for up to a minute
const MIN_INTERVAL_MS = 2_000 // at most one upstream trophies call / 2s / instance

const cache = new Map() // key -> { at, data }
let lastUpstreamAt = 0

const keyOf = body =>
  JSON.stringify({
    e: body.expansion ?? null,
    t: body.event_type ?? 'PremierDraft',
    c: body.card_names ?? [],
    r: body.ranks ?? [],
    d: body.deck_colors ?? [],
  })

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const key = keyOf(body)

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return json({ trophies: hit.data, cached: true })
  }

  const gate = liveGate()
  if (gate) return gate

  if (Date.now() - lastUpstreamAt < MIN_INTERVAL_MS) {
    // Serve a stale entry if we have one rather than spamming upstream.
    if (hit) return json({ trophies: hit.data, cached: true, stale: true })
    return error('Rate limited — try again shortly.', 429)
  }

  try {
    lastUpstreamAt = Date.now()
    const trophies = await fetchTrophies(body)
    cache.set(key, { at: Date.now(), data: trophies })
    return json({ trophies })
  } catch (e) {
    return fromUpstream(e)
  }
}
