import { useState } from 'react'
import { totalScore, draftRecord } from './scoring.js'
import { shareText, copyText } from './share.js'

const MV_BUCKETS = ['0', '1', '2', '3', '4', '5', '6', '7+']

// entries: [{ name, missed, yourPick }] — missed cards (you took something else
// at that pick) get a highlight, with your alternative in the tooltip.
function DeckPiles({ entries, cards }) {
  const buckets = new Map()
  for (const e of entries) {
    const mv = cards[e.name]?.mv ?? 0
    const label = mv >= 7 ? '7+' : String(mv)
    if (!buckets.has(label)) buckets.set(label, [])
    buckets.get(label).push(e)
  }
  return (
    <div className="mv-row">
      {MV_BUCKETS.filter(l => buckets.has(l)).map(label => (
        <div key={label} className="pile">
          <div className="pile-label">{label}</div>
          <div className="pile-cards">
            {buckets.get(label).sort((a, b) => a.name.localeCompare(b.name)).map((e, idx) => (
              <img
                key={idx}
                src={cards[e.name]?.img}
                alt={e.name}
                title={e.missed ? `${e.name} — you took ${e.yourPick} instead` : e.name}
                loading="lazy"
                className={e.missed ? 'missed' : ''}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EndScreen({ puzzle, cards, results, meta, onNext }) {
  const [copied, setCopied] = useState(false)
  const matches = results.filter(r => r.match).length
  const close = results.filter(r => !r.match && r.points > 0).length
  const points = results.map(r => r.points)
  const score = totalScore(points, results.length)
  const record = draftRecord(points, results.length, puzzle.record)

  async function share() {
    const ok = await copyText(shareText({
      date: meta?.date ?? puzzle.date,
      index: meta?.index ?? 0,
      total: meta?.total ?? 1,
      record,
      wins: matches,
      picks: results.length,
      results,
    }))
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2000)
  }

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

      <div className="end-actions">
        <button className="next" onClick={share}>{copied ? 'Copied! ✓' : 'Share results 📋'}</button>
        {onNext && <button className="next" onClick={onNext}>Next puzzle →</button>}
      </div>

      <h3>Their maindeck</h3>
      {(() => {
        // Each maindecked card aligned to the pick it came from, so we know
        // whether you matched and what you took instead.
        const entries = puzzle.picks
          .map((p, i) => ({ name: p.picked, maindecked: p.maindecked, missed: !results[i].match, yourPick: results[i].your }))
          .filter(e => e.maindecked)
        const missedCount = entries.filter(e => e.missed).length

        const isLand = n => (cards[n]?.type ?? '').includes('Land')
        const isCreature = n => (cards[n]?.type ?? '').includes('Creature') && !isLand(n)
        const creatures = entries.filter(e => isCreature(e.name))
        const lands = entries.filter(e => isLand(e.name))
        const spells = entries.filter(e => !isCreature(e.name) && !isLand(e.name))
        return (
          <>
            {missedCount > 0 && (
              <div className="deck-legend">
                <span className="swatch" /> {missedCount} card{missedCount === 1 ? '' : 's'} they
                maindecked that you passed on
              </div>
            )}
            {creatures.length > 0 && <>
              <div className="section-label">Creatures ({creatures.length})</div>
              <DeckPiles entries={creatures} cards={cards} />
            </>}
            {spells.length > 0 && <>
              <div className="section-label">Noncreatures ({spells.length})</div>
              <DeckPiles entries={spells} cards={cards} />
            </>}
            {lands.length > 0 && <>
              <div className="section-label">Lands ({lands.length})</div>
              <div className="deck">
                {lands.map((e, idx) => (
                  <img
                    key={idx}
                    src={cards[e.name]?.img}
                    alt={e.name}
                    title={e.missed ? `${e.name} — you took ${e.yourPick} instead` : e.name}
                    loading="lazy"
                    className={e.missed ? 'missed' : ''}
                  />
                ))}
              </div>
            </>}

            {missedCount > 0 && (
              <details className="pool swaps">
                <summary>What you took instead ({missedCount})</summary>
                <div className="swap-list">
                  {entries.filter(e => e.missed).map((e, idx) => (
                    <div className="swap" key={idx}>
                      <figure>
                        <img src={cards[e.name]?.img} alt={e.name} title={e.name} loading="lazy" />
                        <figcaption>in their deck</figcaption>
                      </figure>
                      <span className="swap-arrow">←</span>
                      <figure>
                        <img src={cards[e.yourPick]?.img} alt={e.yourPick} title={e.yourPick} loading="lazy" />
                        <figcaption>you took</figcaption>
                      </figure>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )
      })()}
    </div>
  )
}
