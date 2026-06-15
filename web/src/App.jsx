'use client'

import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import QuickGame from './QuickGame.jsx'
import Archive from './Archive.jsx'
import About from './About.jsx'
import { allProgress, todayISO, currentStreak } from './storage.js'

// Phase 3: daily wrapper. Each calendar day exposes a few puzzles; days after
// today stay hidden. Results, streaks and resume state live in localStorage.
export default function App() {
  const [cards, setCards] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [date, setDate] = useState(null)
  const [puzzleId, setPuzzleId] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [view, setView] = useState('play') // play | archive | about
  const [mode, setMode] = useState('daily') // daily | quick
  const [progress, setProgress] = useState(() => allProgress())
  const [error, setError] = useState(null)

  const today = todayISO()

  useEffect(() => {
    Promise.all([
      fetch('/cards.SOS.json').then(r => r.json()),
      fetch('/puzzles/manifest.json').then(r => r.json()),
    ])
      .then(([cardData, manifestData]) => {
        setCards(cardData)
        setManifest(manifestData)
        const dates = Object.keys(manifestData.days).sort().filter(d => d <= today)
        const def = dates.at(-1) ?? Object.keys(manifestData.days).sort()[0]
        setDate(def)
        // land on the first unfinished puzzle of the day
        const saved = allProgress()
        const ids = manifestData.days[def]
        setPuzzleId(ids.find(id => !saved[id]?.done) ?? ids[0])
      })
      .catch(e => setError(`Couldn't load game data (${e.message}).`))
  }, [])

  useEffect(() => {
    if (!puzzleId) return
    setPuzzle(null)
    fetch(`/puzzles/${puzzleId}.json`)
      .then(r => r.json())
      .then(setPuzzle)
      .catch(e => setError(`Couldn't load puzzle ${puzzleId} (${e.message}).`))
  }, [puzzleId])

  if (error) return <div className="app"><div className="error">⚠️ {error}</div></div>
  const needPuzzle = view === 'play' && mode === 'daily'
  if (!manifest || !cards || (needPuzzle && !puzzle)) {
    return <div className="app"><div className="loading">Loading…</div></div>
  }

  const days = manifest.days
  const dayIds = days[date] ?? []
  const allIds = [...new Set(Object.values(days).flat())]
  const streak = currentStreak(days, progress, today)
  const nextUnfinished = dayIds.find(id => id !== puzzleId && !progress[id]?.done)

  function openPuzzle(d, id) {
    setDate(d)
    setPuzzleId(id)
    setView('play')
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>7-0</h1>
        {mode === 'daily' && <span className="topbar-date">{date}</span>}
        {view === 'play' && mode === 'daily' && (
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
        )}
        <nav className="topnav">
          {streak > 1 && <span className="streak" title="day streak">🔥 {streak}</span>}
          <button
            className={mode === 'daily' && view === 'play' ? 'navlink active' : 'navlink'}
            onClick={() => { setMode('daily'); setView('play') }}
          >Daily</button>
          <button
            className={mode === 'quick' && view === 'play' ? 'navlink active' : 'navlink'}
            onClick={() => { setMode('quick'); setView('play') }}
          >Quick</button>
          <button className="navlink" onClick={() => setView(view === 'archive' ? 'play' : 'archive')}>Archive</button>
          <button className="navlink" onClick={() => setView(view === 'about' ? 'play' : 'about')}>About</button>
        </nav>
      </header>

      {view === 'about' && <About onBack={() => setView('play')} />}
      {view === 'archive' && (
        <Archive days={days} progress={progress} today={today} onPick={openPuzzle} onBack={() => setView('play')} />
      )}
      {view === 'play' && mode === 'quick' && (
        <QuickGame cards={cards} allIds={allIds} />
      )}
      {view === 'play' && mode === 'daily' && (
        <Game
          key={puzzle.id}
          puzzle={puzzle}
          cards={cards}
          saved={progress[puzzle.id]}
          meta={{ date, index: dayIds.indexOf(puzzleId), total: dayIds.length }}
          onComplete={entry => setProgress({ ...progress, [puzzle.id]: entry })}
          onNext={nextUnfinished ? () => setPuzzleId(nextUnfinished) : null}
        />
      )}
    </div>
  )
}
