import { useEffect, useState } from 'react'
import Game from './Game.jsx'

// Phase 2: local playtest build. Defaults to today's puzzle if it exists,
// otherwise the first date in the manifest. The date dropdown is a playtest
// aid; Phase 3 replaces it with the real daily/archive wrapper.
export default function App() {
  const [cards, setCards] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [date, setDate] = useState(null)
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
        const today = new Date().toISOString().slice(0, 10)
        setDate(manifestData.dates.includes(today) ? today : manifestData.dates[0])
      })
      .catch(e => setError(`Couldn't load game data (${e.message}).`))
  }, [])

  useEffect(() => {
    if (!date) return
    setPuzzle(null)
    fetch(`puzzles/${date}.json`)
      .then(r => r.json())
      .then(setPuzzle)
      .catch(e => setError(`Couldn't load the ${date} puzzle (${e.message}).`))
  }, [date])

  if (error) return <div className="app"><div className="error">⚠️ {error}</div></div>
  if (!puzzle || !cards) return <div className="app"><div className="loading">Loading…</div></div>

  return (
    <div className="app">
      <header className="topbar">
        <h1>Trophy Pick</h1>
        <select value={date} onChange={e => setDate(e.target.value)} title="Playtest: choose a puzzle">
          {manifest.dates.map(d => <option key={d}>{d}</option>)}
        </select>
      </header>
      <Game key={puzzle.id} puzzle={puzzle} cards={cards} />
    </div>
  )
}
