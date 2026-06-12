// Scoring knobs — retune freely.
// Exact match = 1 point. A miss earns partial credit scaled by how popular your
// card was with the community relative to theirs (prw = pick-rate-when-seen),
// capped at PARTIAL_CREDIT_MAX. So a defensible "wrong" pick still scores.
export const PARTIAL_CREDIT_MAX = 0.5

export function scorePick(cards, yourName, theirName) {
  if (yourName === theirName) return 1
  const yours = cards[yourName]?.prw ?? 0
  const theirs = cards[theirName]?.prw ?? 0
  if (theirs <= 0) return 0
  return PARTIAL_CREDIT_MAX * Math.min(1, yours / theirs)
}

// 0–100 headline score for an array of per-pick point values.
export function totalScore(points, totalPicks) {
  if (!totalPicks) return 0
  const sum = points.reduce((a, b) => a + b, 0)
  return Math.round((sum / totalPicks) * 100)
}
