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

// Map your score fraction (points / picks, partial credit included) onto a
// simulated Premier Draft record. Deliberately demanding — anchored to:
//   frac < 0.50  -> 0-3   (matched well under half)
//   frac ~ 0.90  -> 7-2
//   frac >= 0.95 -> 7-0   (near-perfect agreement)
// linearly interpolated between those anchors, then capped at the drafter's
// real record (you can't out-finish the deck's pilot).
export const RECORD_LADDER = ['0-3', '1-3', '2-3', '3-3', '4-3', '5-3', '6-3', '7-2', '7-1', '7-0']

export function draftRecord(points, totalPicks, theirRecord) {
  const frac = totalPicks ? points.reduce((a, b) => a + b, 0) / totalPicks : 0
  let idx
  if (frac < 0.50) idx = 0                                          // 0-3
  else if (frac < 0.90) idx = Math.round(((frac - 0.50) / 0.40) * 7) // 0-3 .. 7-2
  else if (frac < 0.95) idx = 7 + Math.round(((frac - 0.90) / 0.05) * 2) // 7-2 .. 7-0
  else idx = 9                                                       // 7-0
  idx = Math.max(0, Math.min(RECORD_LADDER.length - 1, idx))
  const cap = RECORD_LADDER.indexOf(theirRecord)
  if (cap !== -1) idx = Math.min(idx, cap)
  return RECORD_LADDER[idx]
}
