import { totalScore } from './scoring.js'

export default function EndScreen({ puzzle, cards, results }) {
  const matches = results.filter(r => r.match).length
  const score = totalScore(results.map(r => r.points), results.length)

  return (
    <div className="end">
      <h2>Draft complete!</h2>
      <div className="end-stats">
        <div className="end-stat">
          <div className="big">{matches}/{results.length}</div>
          <div className="label">picks matched</div>
        </div>
        <div className="end-stat">
          <div className="big">{score}</div>
          <div className="label">score (with partial credit)</div>
        </div>
        <div className="end-stat">
          <div className="big">{puzzle.record}</div>
          <div className="label">their record ({puzzle.rank})</div>
        </div>
      </div>

      <div className="grid-strip" title="Your 42 picks: green = match, yellow = partial credit, red = miss">
        {results.map((r, idx) => (
          <span key={idx} className={`cell ${r.match ? 'hit' : r.points > 0 ? 'part' : 'miss'}`} />
        ))}
      </div>

      <h3>Their maindeck</h3>
      <div className="deck">
        {puzzle.deck.map((name, idx) => (
          <img key={idx} src={cards[name]?.img} alt={name} title={name} loading="lazy" />
        ))}
      </div>

      <button className="next" onClick={() => window.location.reload()}>Play again ↻</button>
    </div>
  )
}
