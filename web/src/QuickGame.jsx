import { useEffect, useState } from 'react'
import { scorePick } from './scoring.js'
import { copyText } from './share.js'

// Compressed "best-of" mode (think 82-0 / Six Rings): a ladder of individual
// picks at escalating draft positions. Match their pick = a win, miss = a loss.
// Run ends at 7 wins or 3 losses. Nine slots is exactly the longest possible
// run (a 7-2). Each slot draws a real pick from a trophy draft at that stage.
const SLOTS = [
  { label: 'P1P1',     pack: 0, lo: 0, hi: 0 },
  { label: 'P1 early', pack: 0, lo: 1, hi: 3 },
  { label: 'P1 mid',   pack: 0, lo: 4, hi: 7 },
  { label: 'P2P1',     pack: 1, lo: 0, hi: 0 },
  { label: 'P2 early', pack: 1, lo: 1, hi: 3 },
  { label: 'P2 mid',   pack: 1, lo: 4, hi: 7 },
  { label: 'P3P1',     pack: 2, lo: 0, hi: 0 },
  { label: 'P3 early', pack: 2, lo: 1, hi: 3 },
  { label: 'P3 mid',   pack: 2, lo: 4, hi: 7 },
]

const WIN_TARGET = 7
const LOSS_LIMIT = 3

const rand = arr => arr[Math.floor(Math.random() * arr.length)]

// n distinct random ids (falls back to repeats if the pool is smaller than n).
function sample(arr, n) {
  const pool = [...arr]
  const out = []
  while (out.length < n) {
    if (!pool.length) pool.push(...arr)
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return out
}

const puzzleCache = {}
function fetchPuzzle(id) {
  puzzleCache[id] ??= fetch(`puzzles/${id}.json`).then(r => r.json())
  return puzzleCache[id]
}

// One round: a real pick from `pz` at a position inside `slot`, plus the pool
// that drafter actually had going into it.
function roundFromPuzzle(pz, slot) {
  const candidates = pz.picks
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.pack === slot.pack && p.pick >= slot.lo && p.pick <= slot.hi)
  const { p, idx } = rand(candidates)
  return {
    cards: p.cards,
    picked: p.picked,
    pack: p.pack,
    pickNum: p.pick,
    pool: pz.picks.slice(0, idx).map(x => x.picked),
    rank: pz.rank,
    record: pz.record,
    slot: slot.label,
  }
}

async function buildRounds(allIds, variant) {
  if (variant === 'same') {
    const pz = await fetchPuzzle(rand(allIds))
    return SLOTS.map(s => roundFromPuzzle(pz, s))
  }
  const pzs = await Promise.all(sample(allIds, SLOTS.length).map(fetchPuzzle))
  return SLOTS.map((s, k) => roundFromPuzzle(pzs[k], s))
}

export default function QuickGame({ cards, allIds }) {
  const [variant, setVariant] = useState('mixed') // mixed | same
  const [rounds, setRounds] = useState(null)
  const [seed, setSeed] = useState(0) // bump to start a fresh run
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    setRounds(null)
    setI(0)
    setRevealed(false)
    setResults([])
    setCopied(false)
    buildRounds(allIds, variant).then(r => { if (live) setRounds(r) })
    return () => { live = false }
  }, [variant, seed, allIds])

  if (!rounds) return <div className="loading">Dealing…</div>

  const wins = results.filter(r => r.match).length
  const losses = results.filter(r => !r.match).length
  const over = wins >= WIN_TARGET || losses >= LOSS_LIMIT || i >= rounds.length
  const record = `${wins}-${losses}`
  const r = rounds[Math.min(i, rounds.length - 1)]
  const last = results[results.length - 1]

  function choose(name) {
    if (revealed || over) return
    const match = name === r.picked
    setResults([...results, {
      your: name,
      theirs: r.picked,
      match,
      points: scorePick(cards, r.cards, name, r.picked),
    }])
    setRevealed(true)
  }

  function next() {
    setRevealed(false)
    setI(i + 1)
  }

  function newRun() {
    setSeed(seed + 1)
  }

  async function share() {
    const grid = results.map(x => (x.match ? '🟩' : '🟥')).join('')
    const text = [
      `7-0 Quick — went ${record}`,
      grid,
      'ryanhcondon.github.io/7-0',
    ].join('\n')
    const ok = await copyText(text)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2000)
  }

  const Toggle = () => (
    <div className="quick-toggle">
      <button
        className={variant === 'mixed' ? 'tab active' : 'tab'}
        onClick={() => variant !== 'mixed' && setVariant('mixed')}
      >Mixed drafts</button>
      <button
        className={variant === 'same' ? 'tab active' : 'tab'}
        onClick={() => variant !== 'same' && setVariant('same')}
      >One draft</button>
    </div>
  )

  if (over && !revealed) {
    const verdict = wins >= WIN_TARGET ? 'Trophy! 🏆' : 'Knocked out'
    return (
      <div className="end">
        <div className="record-headline">
          <div className="record-label">{verdict}</div>
          <div className="record">{record.replace('-', '–')}</div>
          <div className="record-note">
            …matching {variant === 'same' ? 'one trophy drafter' : 'recent trophy drafters'} pick for pick
          </div>
        </div>

        <div className="grid-strip" title="Each round: green = match, red = miss">
          {results.map((x, idx) => (
            <span key={idx} className={`cell ${x.match ? 'hit' : 'miss'}`} />
          ))}
        </div>

        <div className="quick-recap">
          {results.map((x, idx) => (
            <div key={idx} className={`recap-row ${x.match ? 'win' : 'loss'}`}>
              <span className="recap-slot">{rounds[idx].slot}</span>
              <span className="recap-mark">{x.match ? '✅' : '❌'}</span>
              <span className="recap-pick">
                {x.match
                  ? <>matched <b>{x.theirs}</b></>
                  : <>you took <b>{x.your}</b> · they took <b>{x.theirs}</b></>}
              </span>
            </div>
          ))}
        </div>

        <div className="end-actions">
          <button className="next" onClick={share}>{copied ? 'Copied! ✓' : 'Share results 📋'}</button>
          <button className="next" onClick={newRun}>Play again →</button>
        </div>
        <Toggle />
      </div>
    )
  }

  return (
    <div className="game">
      <Toggle />
      <div className="statusbar">
        <span className="pp">Round {i + 1} · {r.slot}</span>
        <span className="meta">{r.rank} player · went {r.record}</span>
        <span className="score">{wins} W · {losses} L (first to 7 wins / 3 losses)</span>
      </div>

      <div className="life-pips" title="wins / losses this run">
        {Array.from({ length: WIN_TARGET }, (_, k) => (
          <span key={`w${k}`} className={`pip ${k < wins ? 'won' : ''}`} />
        ))}
        <span className="pip-sep">·</span>
        {Array.from({ length: LOSS_LIMIT }, (_, k) => (
          <span key={`l${k}`} className={`pip loss ${k < losses ? 'lost' : ''}`} />
        ))}
      </div>

      {r.pool.length > 0 && (
        <div className="pool">
          <div className="pool-label">Their pool so far ({r.pool.length})</div>
          <div className="pool-cards">
            {r.pool.map((name, idx) => (
              <img key={idx} src={cards[name]?.img} alt={name} title={name} loading="lazy" />
            ))}
          </div>
        </div>
      )}

      <div className="banner">
        {revealed
          ? last.match
            ? <>✅ Match! They took <b>{last.theirs}</b>.</>
            : <>❌ You took <b>{last.your}</b> — they took <b>{last.theirs}</b>
                {last.points > 0 && <span className="partial"> (defensible, but still a loss)</span>}.</>
          : <>Which card did they pick?</>}
        {revealed && (
          <button className="next" onClick={next}>
            {wins >= WIN_TARGET || losses >= LOSS_LIMIT ? 'See results →' : 'Next pick →'}
          </button>
        )}
      </div>

      <div className={`pack ${revealed ? 'revealed' : ''}`}>
        {r.cards.map(name => {
          const c = cards[name]
          const cls = [
            'card',
            revealed && name === r.picked ? 'their' : '',
            revealed && last && !last.match && name === last.your ? 'yours-wrong' : '',
            revealed && name !== r.picked && (!last || name !== last.your) ? 'dim' : '',
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
    </div>
  )
}
