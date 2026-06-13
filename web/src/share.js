// Wordle-style share text. One emoji row per pack (14 picks each).
export function shareText({ date, index, total, record, wins, picks, results }) {
  const rows = []
  for (let start = 0; start < results.length; start += 14) {
    rows.push(results.slice(start, start + 14)
      .map(r => (r.match ? '🟩' : r.points > 0 ? '🟨' : '🟥')).join(''))
  }
  return [
    `Trophy Pick ${date} · puzzle ${index + 1}/${total}`,
    `Went ${record} · matched ${wins}/${picks}`,
    ...rows,
  ].join('\n')
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
