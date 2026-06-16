'use client'

import Link from 'next/link'
import { todayISO } from './storage.js'

// The hub. Two paths (Full Draft / Quick) plus a featured "today's draft"
// call-to-action, so a returning player is one click from today's game.
export default function Home() {
  return (
    <div className="hub">
      <p className="hub-tagline">
        Follow a real 7-win Arena draft pick by pick. How close are you to a trophy run?
      </p>

      <Link href="/daily" className="featured">
        <span className="featured-kicker">Today&apos;s draft · {todayISO()}</span>
        <span className="featured-title">Play the daily →</span>
        <span className="featured-sub">A few hand-picked trophy drafts, fresh each day.</span>
      </Link>

      <div className="hub-paths">
        <Link href="/draft" className="path-card">
          <span className="path-title">Full Draft</span>
          <span className="path-sub">All 42 picks of one trophy draft — daily, random, or your own link.</span>
        </Link>
        <Link href="/quick" className="path-card">
          <span className="path-title">Quick</span>
          <span className="path-sub">A fast best-of run. First to 7 wins, out at 3 losses.</span>
        </Link>
      </div>
    </div>
  )
}
