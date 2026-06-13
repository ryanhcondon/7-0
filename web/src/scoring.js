// Scoring knobs — retune freely.
// Exact match = 1 point (a "win"). A miss earns flat partial credit only when
// your card was a near-community-favorite in that pack: its pick-rate-when-seen
// (prw) is within PARTIAL_MIN_RATIO of the best prw in the pack. Otherwise 0.
// Tuned 2026-06-12 (vs pack-best, not vs their pick — late-pack leftovers all
// have tiny prw, so pick-ratio alone made random clicking look defensible):
// random clicking = ~59% red / 18% yellow; always-take-the-community-favorite
// play never goes red.
export const PARTIAL_CREDIT = 0.5
export const PARTIAL_MIN_RATIO = 0.8

export function scorePick(cards, packCards, yourName, theirName) {
  if (yourName === theirName) return 1
  const best = Math.max(...packCards.map(n => cards[n]?.prw ?? 0))
  const yours = cards[yourName]?.prw ?? 0
  if (best <= 0 || yours < PARTIAL_MIN_RATIO * best) return 0
  return PARTIAL_CREDIT
}

// 0–100 headline score for an array of per-pick point values.
export function totalScore(points, totalPicks) {
  if (!totalPicks) return 0
  const sum = points.reduce((a, b) => a + b, 0)
  return Math.round((sum / totalPicks) * 100)
}

// Map your point fraction onto a simulated Premier Draft record (stop at 3
// losses or 7 wins), linearly over the 10 possible outcomes, capped at the
// drafter's real record — you can't out-pilot the person who drafted the deck.
export const RECORD_LADDER = ['0-3', '1-3', '2-3', '3-3', '4-3', '5-3', '6-3', '7-2', '7-1', '7-0']

export function draftRecord(points, totalPicks, theirRecord) {
  const frac = totalPicks ? points.reduce((a, b) => a + b, 0) / totalPicks : 0
  let idx = Math.min(RECORD_LADDER.length - 1, Math.floor(frac * RECORD_LADDER.length))
  const cap = RECORD_LADDER.indexOf(theirRecord)
  if (cap !== -1) idx = Math.min(idx, cap)
  return RECORD_LADDER[idx]
}
