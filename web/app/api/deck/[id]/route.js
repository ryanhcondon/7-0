// GET /api/deck/<draft_id>?deck_index=<n>
//
// Returns the resolved maindeck/sideboard for a draft (names + name->{img} map).
// Permanent cache per (draft_id, deck_index). deck_index comes from a trophies
// list entry; defaults to 0.

import { cacheGet, cacheSet } from '../../../../lib/supabase.js'
import { fetchDeck } from '../../../../lib/seventeenlands.js'
import { json, error, liveGate, fromUpstream } from '../../_lib/respond.js'

export async function GET(request, { params }) {
  const { id } = await params
  if (!id) return error('Missing draft id.', 400)
  const deckIndex = Number(new URL(request.url).searchParams.get('deck_index') ?? 0) || 0

  const key = `deck:${id}:${deckIndex}`
  const cached = await cacheGet(key)
  if (cached) return json({ ...cached, cached: true })

  const gate = liveGate()
  if (gate) return gate

  try {
    const deck = await fetchDeck(id, deckIndex)
    await cacheSet(key, 'deck', deck)
    return json(deck)
  } catch (e) {
    return fromUpstream(e)
  }
}
