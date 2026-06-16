// GET /api/draft/<draft_id>
//
// Returns a playable puzzle (existing puzzle schema) + a name->{img} card map,
// built from the 17lands draft stream. Permanent cache: each draft is fetched
// from 17lands at most once, ever.
//
// `maindecked` per pick is filled in by cross-referencing the deck route when a
// deck is reachable (deck_index defaults to 0; pass ?deck_index=n to override).
// If the deck can't be resolved the puzzle still plays — maindecked stays false.

import { cacheGet, cacheSet } from '../../../../lib/supabase.js'
import { fetchDraftPuzzle, fetchDeck } from '../../../../lib/seventeenlands.js'
import { json, error, liveGate, fromUpstream } from '../../_lib/respond.js'

export async function GET(request, { params }) {
  const { id } = await params
  if (!id) return error('Missing draft id.', 400)
  const deckIndex = Number(new URL(request.url).searchParams.get('deck_index') ?? 0) || 0

  const key = `draft:${id}:${deckIndex}`
  const cached = await cacheGet(key)
  if (cached) return json({ ...cached, cached: true })

  const gate = liveGate()
  if (gate) return gate

  try {
    const { puzzle, cards } = await fetchDraftPuzzle(id)

    // Best-effort maindeck enrichment — never fail the whole request over it.
    try {
      const deck = await fetchDeck(id, deckIndex)
      const main = new Set(deck.maindeck)
      for (const p of puzzle.picks) p.maindecked = main.has(p.picked)
      if (!puzzle.record && deck.record) puzzle.record = deck.record
      Object.assign(cards, deck.cards) // fill any gaps
    } catch (e) {
      console.warn(`[draft] deck enrich failed for ${id}: ${e.message}`)
    }

    const result = { puzzle, cards }
    await cacheSet(key, 'draft', result)
    return json(result)
  } catch (e) {
    return fromUpstream(e)
  }
}
