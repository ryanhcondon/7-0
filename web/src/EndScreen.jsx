import { totalScore, draftRecord } from './scoring.js'

const MV_BUCKETS = ['0', '1', '2', '3', '4', '5', '6', '7+']

function DeckPiles({ names, cards }) {
  const buckets = new Map()
  for (const name of names) {
    const mv = cards[name]?.mv ?? 0
    const label = mv >= 7 ? '7+' : String(mv)
    if (!buckets.has(label)) buckets.set(label, [])
    buckets.get(label).push(name)
  }
  return (
    <div className="mv-row">
      {MV_BUCKETS.filter(l => buckets.has(l)).map(label => (
        <div key={label} className="pile">
          <div className="pile-label">{label}</div>
          <div className="pile-cards">
            {buckets.get(label).map((name, idx) => (
              <img key={idx} src={cards[name]?.img} alt={name} title={name} loading="lazy" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EndScreen({ puzzle, cards, results }) {
  const matches = results.filter(r => r.match).length
  const close = results.filter(r => !r.match && r.points > 0).length
  const points = results.map(r => r.points)
  const score = totalScore(points, results.length)
  const record = draftRecord(points, results.length, puzzle.record)

  return (
    <div className="end">
      <div className="record-headline">
        <div className="record-label">You went</div>
        <div className="record">{record.replace('-', '–')}</div>
      </div>
      <div className="end-stats">
        <div className="end-stat">
          <div className="big">{matches}/{results.length}</div>
          <div className="label">picks matched</div>
        </div>
        <div className="end-stat">
          <div className="big">{close}</div>
          <div className="label">close calls</div>
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

      <div className="grid-strip" title="Your 42 picks: green = match, yellow = defensible, red = miss">
        {results.map((r, idx) => (
          <span key={idx} className={`cell ${r.match ? 'hit' : r.points > 0 ? 'part' : 'miss'}`} />
        ))}
      </div>

      <h3>Their maindeck</h3>
      {(() => {
        const isLand = n => (cards[n]?.type ?? '').includes('Land')
        const isCreature = n => (cards[n]?.type ?? '').includes('Creature') && !isLand(n)
        const creatures = puzzle.deck.filter(isCreature)
        const lands = puzzle.deck.filter(isLand)
        const spells = puzzle.deck.filter(n => !isCreature(n) && !isLand(n))
        return (
          <>
            {creatures.length > 0 && <>
              <div className="section-label">Creatures ({creatures.length})</div>
              <DeckPiles names={creatures} cards={cards} />
            </>}
            {spells.length > 0 && <>
              <div className="section-label">Noncreatures ({spells.length})</div>
              <DeckPiles names={spells} cards={cards} />
            </>}
            {lands.length > 0 && <>
              <div className="section-label">Lands ({lands.length})</div>
              <div className="deck">
                {lands.map((name, idx) => (
                  <img key={idx} src={cards[name]?.img} alt={name} title={name} loading="lazy" />
                ))}
              </div>
            </>}
          </>
        )
      })()}

      <button className="next" onClick={() => window.location.reload()}>Play again ↻</button>
    </div>
  )
}
