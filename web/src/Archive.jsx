export default function Archive({ days, progress, today, onPick, onBack }) {
  const dates = Object.keys(days).sort().filter(d => d <= today).reverse()
  return (
    <div className="archive">
      <h2>Archive</h2>
      <div className="archive-list">
        {dates.map(d => (
          <div key={d} className="archive-day">
            <span className="archive-date">{d}{d === today ? ' · today' : ''}</span>
            <span className="archive-chips">
              {days[d].map((id, idx) => {
                const p = progress[id]
                return (
                  <button
                    key={id}
                    className={p?.done ? 'chip done' : 'chip'}
                    onClick={() => onPick(d, id)}
                    title={p?.done ? `went ${p.record}` : 'not played'}
                  >
                    {idx + 1}{p?.done ? ` · ${p.record}` : ''}
                  </button>
                )
              })}
            </span>
          </div>
        ))}
      </div>
      <button className="next" onClick={onBack}>← Home</button>
    </div>
  )
}
