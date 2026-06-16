'use client'

import QuickGame from '../../src/QuickGame.jsx'
import { useGameData, allPuzzleIds } from '../../src/useGameData.js'

export default function Page() {
  const data = useGameData()
  if (data?.error) return <div className="error">⚠️ Couldn&apos;t load game data ({data.error}).</div>
  if (!data) return <div className="loading">Loading…</div>
  return <QuickGame cards={data.cards} allIds={allPuzzleIds(data.manifest)} />
}
