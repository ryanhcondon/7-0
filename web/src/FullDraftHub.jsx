'use client'

import Link from 'next/link'

// Full Draft = one player fed by several sources. Today only the daily (static
// dataset) source is live; the 17lands-powered sources are gated behind the
// pending permission, shown here as "coming soon" so the layout is ready.
export default function FullDraftHub() {
  return (
    <div className="draft-hub">
      <h2>Full Draft</h2>
      <p className="hub-tagline">
        Play all 42 picks of a single trophy draft, pick by pick.
      </p>

      <Link href="/daily" className="source-card live">
        <span className="source-title">Today&apos;s daily draft</span>
        <span className="source-sub">A few hand-picked trophy drafts, fresh each day. Tracks your streak.</span>
      </Link>

      <div className="source-card soon" aria-disabled="true">
        <span className="source-title">Random recent trophy <span className="soon-tag">soon</span></span>
        <span className="source-sub">Spin up a puzzle from a random recent 7-win run on 17lands.</span>
      </div>

      <div className="source-card soon" aria-disabled="true">
        <span className="source-title">Paste your 17lands link <span className="soon-tag">soon</span></span>
        <span className="source-sub">Turn one of your own drafts into a shareable puzzle.</span>
      </div>
    </div>
  )
}
