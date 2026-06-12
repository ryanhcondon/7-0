import { useState } from 'react'
import { scorePick, totalScore } from './scoring.js'
import EndScreen from './EndScreen.jsx'

export default function Game({ puzzle, cards }) {
  const [i, setI] = useState(0)            // current pick index
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState([]) // {your, theirs, match, points} per pick

  const picks = puzzle.picks
  const done = i >= picks.length
  const p = picks[Math.min(i, picks.length - 1)]
  const matches = results.filter(r => r.match).length
  const answered = results.length
  const pool = picks.slice(0, i).map(pk => pk.picked)

  function choose(name) {
    if (revealed || done) return
    const match = name === p.picked
    const points = scorePick(cards, name, p.picked)
    setResults([...results, { your: name, theirs: p.picked, match, points }])
    setRevealed(true)
  }

  function next() {
    setRevealed(false)
    setI(i + 1)
  }

  if (done) return <EndScreen puzzle={puzzle} cards={cards} results={results} />

  const last = results[results.length - 1]

  return (
    <div className="game">
      <div className="statusbar">
        <span className="pp">Pack {p.pack + 1} · Pick {p.pick + 1}</span>
        <span className="meta">{puzzle.rank} player · went {puzzle.record} · drafted {puzzle.drafted}</span>
        <span className="score">
          {matches}/{answered} matched · score {totalScore(results.map(r => r.points), answered || 1)}
        </span>
      </div>

      <div className="banner">
        {revealed
          ? last.match
            ? <>✅ Match! They took <b>{last.theirs}</b>.</>
            : <>❌ You took <b>{last.your}</b> — they took <b>{last.theirs}</b>
                {last.points > 0 && <span className="partial"> (partial credit: +{last.points.toFixed(2)})</span>}.</>
          : <>Which card did they pick?</>}
        {revealed && (
          <button className="next" onClick={next}>
            {i + 1 < picks.length ? 'Next pick →' : 'See results →'}
          </button>
        )}
      </div>

      <div className={`pack ${revealed ? 'revealed' : ''}`}>
        {p.cards.map(name => {
          const c = cards[name]
          const cls = [
            'card',
            revealed && name === p.picked ? 'their' : '',
            revealed && last && !last.match && name === last.your ? 'yours-wrong' : '',
            revealed && name !== p.picked && (!last || name !== last.your) ? 'dim' : '',
          ].join(' ')
          return (
            <div key={name} className={cls} onClick={() => choose(name)}>
              <img src={c?.img} alt={name} title={name} loading="lazy" />
              <div className="stat">
                {c?.ata != null ? `avg pick ${c.ata}` : '—'} · taken {Math.round((c?.prw ?? 0) * 100)}%
              </div>
            </div>
          )
        })}
      </div>

      {pool.length > 0 && (
        <div className="pool">
          <div className="pool-label">Their pool ({pool.length})</div>
          <div className="pool-cards">
            {pool.map((name, idx) => (
              <img key={idx} src={cards[name]?.img} alt={name} title={name} loading="lazy" />
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <details className="pool your-pool">
          <summary>Your pool ({results.length}) — the cards you clicked</summary>
          <div className="pool-cards">
            {results.map((r, idx) => (
              <img key={idx} src={cards[r.your]?.img} alt={r.your} title={r.your} loading="lazy" />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
