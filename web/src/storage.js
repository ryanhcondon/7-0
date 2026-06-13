// localStorage persistence. One versioned key; everything inside it.
// Shape: { puzzles: { <puzzleId>: { picks: [names...], done: bool,
//          record, wins, score, date } } }
const KEY = 'trophyPick.v1'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // private mode / quota — game still works, just won't persist
  }
}

export function allProgress() {
  return read().puzzles ?? {}
}

export function saveProgress(id, entry) {
  const data = read()
  data.puzzles ??= {}
  data.puzzles[id] = { ...data.puzzles[id], ...entry }
  write(data)
}

// Local-timezone YYYY-MM-DD (toISOString would flip the date in the evening).
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Consecutive days (ending today, or yesterday if today is unplayed) with at
// least one completed puzzle.
export function currentStreak(days, progress, today) {
  const dates = Object.keys(days).sort().filter(d => d <= today)
  let streak = 0
  for (let i = dates.length - 1; i >= 0; i--) {
    const played = days[dates[i]].some(id => progress[id]?.done)
    if (played) streak++
    else if (dates[i] === today) continue // today still pending doesn't break it
    else break
  }
  return streak
}
