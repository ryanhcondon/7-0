// Server-side client for the live 17lands endpoints.
//
// IMPORTANT: every function here is gated by liveEnabled() at the call site in
// the API routes — this module just knows how to talk to 17lands. All requests
// carry a descriptive User-Agent so 17lands can identify the app (see config).
//
// Endpoint shapes (confirmed live 2026-06-15):
//   GET  /data/draft/stream?draft_id=<id>      SSE; a "complete" event with all
//                                              42 picks, each card's image inline
//   GET  /api/deck/draft/?draft_id=<id>&deck_index=<n>   maindeck/sideboard,
//                                              numeric card ids + a `cards` dict
//   POST /api/trophies/                        recent trophy decks (polling call)

import { SEVENTEEN_BASE, userAgent } from './config.js'

class UpstreamError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
  }
}
export { UpstreamError }

async function get(path) {
  const res = await fetch(`${SEVENTEEN_BASE}${path}`, {
    headers: { 'User-Agent': userAgent(), Accept: 'text/event-stream, application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new UpstreamError(`17lands GET ${path} → ${res.status}`, 502)
  return res
}

// ---- draft stream → puzzle shape ------------------------------------------

// The stream is Server-Sent Events but it terminates (it's a replay, not a live
// feed), so we can read it to completion and parse the events out of the text.
// SSE frames are separated by a blank line; `data:` lines within a frame are
// concatenated. We want the single frame whose JSON payload is the full draft.
function parseSSE(text) {
  const events = []
  for (const frame of text.split(/\r?\n\r?\n/)) {
    const data = frame
      .split(/\r?\n/)
      .filter(l => l.startsWith('data:'))
      .map(l => l.slice(5).trim())
      .join('')
    if (!data) continue
    try {
      events.push(JSON.parse(data))
    } catch {
      /* skip keep-alive / non-JSON frames */
    }
  }
  return events
}

// Pull the chosen card name out of a pick entry (17lands has used both a bare
// string and an object across endpoints — be defensive).
function pickName(pick) {
  return typeof pick === 'string' ? pick : pick?.name ?? pick?.card_name ?? null
}
function cardName(c) {
  return typeof c === 'string' ? c : c?.name ?? c?.card_name ?? null
}

// Transform a 17lands draft-stream payload into our puzzle schema. `maindecked`
// is left false here; it's filled in by cross-referencing the deck route.
export function streamToPuzzle(draftId, payload) {
  const picksRaw = payload?.picks ?? payload?.draft?.picks ?? []
  if (!Array.isArray(picksRaw) || picksRaw.length === 0) {
    throw new UpstreamError('17lands draft stream had no picks', 502)
  }

  const cards = {} // name -> { img }
  const picks = picksRaw.map(p => {
    const available = p.available ?? p.cards ?? []
    const names = []
    for (const c of available) {
      const name = cardName(c)
      if (!name) continue
      names.push(name)
      const img = c?.image_url ?? c?.img
      if (img && !cards[name]) cards[name] = { img }
    }
    const picked = pickName(p.pick ?? p.picked)
    if (picked && !cards[picked]) {
      // chosen card should also be in `available`, but guard anyway
      const img = (typeof p.pick === 'object' && (p.pick.image_url ?? p.pick.img)) || undefined
      if (img) cards[picked] = { img }
    }
    return {
      pack: (p.pack_number ?? p.pack ?? 1) - 1, // 17lands is 1-indexed; we store 0-indexed
      pick: (p.pick_number ?? p.pick_index ?? 1) - 1,
      cards: names,
      picked,
      maindecked: false,
    }
  })

  const puzzle = {
    set: payload?.expansion ?? payload?.set ?? null,
    id: draftId,
    rank: payload?.rank ?? payload?.start_rank ?? null,
    record: formatRecord(payload),
    drafted: dateOnly(payload?.time ?? payload?.date),
    source: '17lands',
    picks,
  }
  return { puzzle, cards }
}

function formatRecord(payload) {
  const w = payload?.wins ?? payload?.event_info?.wins
  const l = payload?.losses ?? payload?.event_info?.losses
  return w != null && l != null ? `${w}-${l}` : null
}
function dateOnly(t) {
  if (!t) return null
  const d = new Date(t)
  return isNaN(d) ? String(t).slice(0, 10) : d.toISOString().slice(0, 10)
}

export async function fetchDraftPuzzle(draftId) {
  const res = await get(`/data/draft/stream?draft_id=${encodeURIComponent(draftId)}`)
  const events = parseSSE(await res.text())
  const complete =
    events.find(e => e?.type === 'complete') ??
    events.find(e => Array.isArray(e?.picks) || Array.isArray(e?.draft?.picks))
  if (!complete) throw new UpstreamError('17lands draft stream had no complete event', 502)
  return streamToPuzzle(draftId, complete.payload ?? complete.data ?? complete)
}

// ---- deck route ------------------------------------------------------------

// Resolve the maindeck for a draft. 17lands returns numeric card ids per group
// plus a `cards` dict mapping id -> { name, image_url }. We return name lists
// and a name->{img} map matching the puzzle `cards` contract.
export async function fetchDeck(draftId, deckIndex = 0) {
  const res = await get(
    `/api/deck/draft/?draft_id=${encodeURIComponent(draftId)}&deck_index=${deckIndex}`,
  )
  const data = await res.json()
  const dict = data?.cards ?? {}
  const resolve = id => {
    const c = dict[id] ?? dict[String(id)]
    return c ? { name: c.name ?? c.card_name, img: c.image_url ?? c.img } : null
  }
  const groups = {}
  const cards = {}
  for (const g of data?.groups ?? []) {
    const names = []
    for (const id of g.cards ?? []) {
      const c = resolve(id)
      if (!c?.name) continue
      names.push(c.name)
      if (c.img && !cards[c.name]) cards[c.name] = { img: c.img }
    }
    groups[g.name ?? 'group'] = names
  }
  return {
    id: draftId,
    deckIndex,
    maindeck: groups.Maindeck ?? groups.maindeck ?? [],
    sideboard: groups.Sideboard ?? groups.sideboard ?? [],
    colors: data?.main_colors ?? null,
    record: formatRecord(data),
    cards,
  }
}

// ---- trophies route --------------------------------------------------------

export async function fetchTrophies(filters = {}) {
  const body = {
    expansion: filters.expansion ?? null,
    event_type: filters.event_type ?? 'PremierDraft',
    card_names: filters.card_names ?? [],
    ranks: filters.ranks ?? [],
    deck_colors: filters.deck_colors ?? [],
  }
  const res = await fetch(`${SEVENTEEN_BASE}/api/trophies/`, {
    method: 'POST',
    headers: {
      'User-Agent': userAgent(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new UpstreamError(`17lands trophies → ${res.status}`, 502)
  const list = await res.json()
  // Keep only entries we can actually turn into a puzzle.
  return (Array.isArray(list) ? list : []).filter(t => t?.has_draft && t?.aggregate_id)
}
