'use client'

import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import { useGameData } from './useGameData.js'
import { allProgress, todayISO, currentStreak } from './storage.js'

// The daily wrapper, re-homed onto /daily. Each calendar day exposes a few
// puzzles (days after today stay hidden). Results, streaks and resume state
// live in localStorage. Accepts ?p=<puzzleId> to deep-link a specific puzzle
// (used by the Archive page).
export default function DailyGame() {
  const data = useGameData()
  const [date, setDate] = useState(null)
  const [puzzleId, setPuzzleId] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [progress, setProgress] = useState(() => allProgress())
  const [error, setError] = useState(null)

  const today = todayISO()
  const manifest = data && !data.error ? data.manifest : null
  const cards = data && !data.error ? data.cards : null

  // Choose the initial day + puzzle once the manifest is loaded.
  useEffect(() => {
    if (!manifest) return
    const days = manifest.days
    const dates = Object.keys(days).sort().filter(d => d <= today)
    const wanted = new URLSearchParams(window.location.search).get('p')
    const saved = allProgress()

    if (wanted) {
      const d = dates.find(dd => days[dd].includes(wanted))
      if (d) { setDate(d); setPuzzleId(wanted); return }
    }
    const def = dates.at(-1) ?? Object.keys(days).sort()[0]
    setDate(def)
    const ids = days[def]
    setPuzzleId(ids.find(id => !saved[id]?.done) ?? ids[0])
  }, [manifest, today])

  // Load the selected puzzle's JSON.
  useEffect(() => {
    if (!puzzleId) return
    setPuzzle(null)
    fetch(`/puzzles/${puzzleId}.json`)
      .then(r => r.json())
      .then(setPuzzle)
      .catch(e => setError(`Couldn't load puzzle ${puzzleId} (${e.message}).`))
  }, [puzzleId])

  if (error || data?.error) return <div className="error">⚠️ {error ?? `Couldn't load game data (${data.error}).`}</div>
  if (!manifest || !cards || !date || !puzzle) return <div className="loading">Loading…</div>

  const days = manifest.days
  const dayIds = days[date] ?? []
  const streak = currentStreak(days, progress, today)
  const nextUnfinished = dayIds.find(id => id !== puzzleId && !progress[id]?.done)

  return (
    <div className="daily">
      <div className="daily-bar">
        <span className="topbar-date">{date}</span>
        <div className="puzzle-tabs">
          {dayIds.map((id, idx) => {
            const p = progress[id]
            return (
              <button
                key={id}
                className={id === puzzleId ? 'tab active' : 'tab'}
                onClick={() => setPuzzleId(id)}
              >
                {idx + 1}{p?.done ? ` ✓ ${p.record}` : ''}
              </button>
            )
          })}
        </div>
        {streak > 1 && <span className="streak" title="day streak">🔥 {streak}</span>}
      </div>

      <Game
        key={puzzle.id}
        puzzle={puzzle}
        cards={cards}
        saved={progress[puzzle.id]}
        meta={{ date, index: dayIds.indexOf(puzzleId), total: dayIds.length }}
        onComplete={entry => setProgress({ ...progress, [puzzle.id]: entry })}
        onNext={nextUnfinished ? () => setPuzzleId(nextUnfinished) : null}
      />
    </div>
  )
}
