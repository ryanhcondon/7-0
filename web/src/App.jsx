import { useEffect, useState } from 'react'
import Game from './Game.jsx'

// Phase 2: local playtest build. Each day offers a few puzzles drafted the
// previous day ("yesterday's trophies"). Defaults to today's puzzles if the
// data has them, otherwise the most recent available day. The date dropdown
// is a playtest aid; Phase 3 replaces it with the real daily/archive wrapper.
export default function App() {
  const [cards, setCards] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [date, setDate] = useState(null)
  const [puzzleId, setPuzzleId] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('cards.SOS.json').then(r => r.json()),
      fetch('puzzles/manifest.json').then(r => r.json()),
    ])
      .then(([cardData, manifestData]) => {
        setCards(cardData)
        setManifest(manifestData)
        const dates = Object.keys(manifestData.days).sort()
        const today = new Date().toISOString().slice(0, 10)
        const def = manifestData.days[today]
          ? today
          : dates.filter(d => d <= today).at(-1) ?? dates[0]
        setDate(def)
        setPuzzleId(manifestData.days[def][0])
      })
      .catch(e => setError(`Couldn't load game data (${e.message}).`))
  }, [])

  useEffect(() => {
    if (!puzzleId) return
    setPuzzle(null)
    fetch(`puzzles/${puzzleId}.json`)
      .then(r => r.json())
      .then(setPuzzle)
      .catch(e => setError(`Couldn't load puzzle ${puzzleId} (${e.message}).`))
  }, [puzzleId])

  if (error) return <div className="app"><div className="error">⚠️ {error}</div></div>
  if (!puzzle || !cards) return <div className="app"><div className="loading">Loading…</div></div>

  const dayIds = manifest.days[date]

  return (
    <div className="app">
      <header className="topbar">
        <h1>Trophy Pick</h1>
        <select
          value={date}
          onChange={e => { setDate(e.target.value); setPuzzleId(manifest.days[e.target.value][0]) }}
          title="Playtest: choose a day"
        >
          {Object.keys(manifest.days).sort().map(d => <option key={d}>{d}</option>)}
        </select>
        <div className="puzzle-tabs">
          {dayIds.map((id, idx) => (
            <button
              key={id}
              className={id === puzzleId ? 'tab active' : 'tab'}
              onClick={() => setPuzzleId(id)}
            >
              Puzzle {idx + 1}
            </button>
          ))}
        </div>
      </header>
      <Game key={puzzle.id} puzzle={puzzle} cards={cards} />
    </div>
  )
}
