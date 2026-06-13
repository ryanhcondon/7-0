export default function About({ onBack }) {
  return (
    <div className="about">
      <h2>About Trophy Pick</h2>
      <p>
        Each day you get a few real trophy drafts — 7-win runs by high-ranked
        players in Magic: The Gathering Arena Premier Draft. You see every pack
        they saw, pick by pick. Predict what they took. Green = same pick,
        yellow = a defensible alternative (judged by community pick rates),
        red = a miss. Your picks earn a simulated draft record, capped at what
        the trophy drafter actually went.
      </p>
      <h3>Data &amp; credits</h3>
      <p>
        Draft data comes from the wonderful public datasets at{' '}
        <a href="https://www.17lands.com" target="_blank" rel="noreferrer">17lands.com</a>.
        Trophy Pick is not affiliated with 17lands.
      </p>
      <p>
        Card images and metadata courtesy of{' '}
        <a href="https://scryfall.com" target="_blank" rel="noreferrer">Scryfall</a>.
      </p>
      <p className="legal">
        Trophy Pick is unofficial Fan Content permitted under the{' '}
        <a href="https://company.wizards.com/en/legal/fancontentpolicy" target="_blank" rel="noreferrer">
          Wizards of the Coast Fan Content Policy
        </a>. Not approved or endorsed by Wizards. Portions of the materials
        used are property of Wizards of the Coast. © Wizards of the Coast LLC.
      </p>
      <button className="next" onClick={onBack}>← Back to today</button>
    </div>
  )
}
