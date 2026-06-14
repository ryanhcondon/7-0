import { useState } from 'react'
import { totalScore, draftRecord } from './scoring.js'
import { shareText, copyText } from './share.js'

const MV_BUCKETS = ['0', '1', '2', '3', '4', '5', '6', '7+']

// A card in a rendered deck. cls highlights it (e.g. 'missed' / 'swap'),
// title is the hover tooltip.
function Tile({ entry, cards }) {
  return (
    <img
      src={cards[entry.name]?.img}
      alt={entry.name}
      title={entry.title ?? entry.name}
      loading="lazy"
      className={entry.cls ?? ''}
    />
  )
}

// entries: [{ name, cls?, title? }] — mana-value piles, sorted within a pile.
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
            {buckets.get(label).slice().sort((a, b) => a.name.localeCompare(b.name)).map((e, idx) => (
              <Tile key={idx} entry={e} cards={cards} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// A full deck: creature / noncreature piles by mana value, lands in a row.
function DeckView({ entries, cards }) {
  const isLand = n => (cards[n]?.type ?? '').includes('Land')
  const isCreature = n => (cards[n]?.type ?? '').includes('Creature') && !isLand(n)
  const creatures = entries.filter(e => isCreature(e.name))
  const spells = entries.filter(e => !isCreature(e.name) && !isLand(e.name))
  const lands = entries.filter(e => isLand(e.name))
  return (
    <>
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
          {lands.map((e, idx) => <Tile key={idx} entry={e} cards={cards} />)}
        </div>
      </>}
    </>
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
        <div className="record-note">…if draft records were based on how well you matched someone else's picks 😉</div>
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

      {(() => {
        // Each maindecked card aligned to the pick it came from: their card,
        // your pick at that slot, and whether you matched.
        const md = puzzle.picks
          .map((p, i) => ({ their: p.picked, maindecked: p.maindecked, your: results[i].your, missed: !results[i].match }))
          .filter(e => e.maindecked)
        const swaps = md.filter(e => e.missed)
        const n = swaps.length

        // Their actual deck (cards you missed outlined red).
        const theirEntries = md.map(e => ({
          name: e.their,
          cls: e.missed ? 'missed' : '',
          title: e.missed ? `${e.their} — you took ${e.your} instead` : e.their,
        }))
        // Your version: your pick at every slot (swapped-in cards outlined blue).
        const yourEntries = md.map(e => ({
          name: e.your,
          cls: e.missed ? 'swap' : '',
          title: e.missed ? `${e.your} — you ran this over ${e.their}` : e.your,
        }))
        // The rest of your pool: your picks at slots they didn't maindeck — the
        // cards you'd swap in for any of the above that don't fit your colors.
        const restEntries = puzzle.picks
          .map((p, i) => ({ name: results[i].your, maindecked: p.maindecked }))
          .filter(e => !e.maindecked)
          .map(e => ({ name: e.name }))

        return (
          <>
            <h3>Their maindeck</h3>
            {n > 0 && (
              <div className="deck-legend">
                <span className="swatch missed" /> {n} card{n === 1 ? '' : 's'} they
                maindecked that you passed on
              </div>
            )}
            <DeckView entries={theirEntries} cards={cards} />

            {n > 0 && <>
              <h3>Your version of the deck</h3>
              <div className="deck-legend">
                <span className="swatch swap" /> {n} card{n === 1 ? '' : 's'} you took in their place —
                read against their deck to see how yours would have come together
              </div>
              <div className="deck-note">
                A literal one-for-one of your picks — some (early off-color speculation, say)
                you'd really cut. Your full pool below lets you swap those for cards that fit.
              </div>
              <DeckView entries={yourEntries} cards={cards} />

              <details className="pool swaps">
                <summary>The {n} swap{n === 1 ? '' : 's'}, one for one</summary>
                <div className="swap-list">
                  {swaps.map((e, idx) => (
                    <div className="swap-row" key={idx}>
                      <span className="side you">
                        <span className="nm">{e.your}</span>
                        <img src={cards[e.your]?.img} alt={e.your} loading="lazy" />
                      </span>
                      <span className="mid">in over</span>
                      <span className="side them">
                        <img src={cards[e.their]?.img} alt={e.their} loading="lazy" />
                        <span className="nm">{e.their}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </>}

            {restEntries.length > 0 && (
              <details className="pool restpool">
                <summary>The rest of your pool ({restEntries.length}) — cards you drafted they didn't maindeck</summary>
                <DeckView entries={restEntries} cards={cards} />
              </details>
            )}
          </>
        )
      })()}
    </div>
  )
}
