'use client'

import { useRouter } from 'next/navigation'
import Archive from '../../src/Archive.jsx'
import { useGameData } from '../../src/useGameData.js'
import { allProgress, todayISO } from '../../src/storage.js'

export default function Page() {
  const router = useRouter()
  const data = useGameData()
  if (data?.error) return <div className="error">⚠️ Couldn&apos;t load game data ({data.error}).</div>
  if (!data) return <div className="loading">Loading…</div>
  return (
    <Archive
      days={data.manifest.days}
      progress={allProgress()}
      today={todayISO()}
      onPick={(d, id) => router.push(`/daily?p=${id}`)}
      onBack={() => router.push('/')}
    />
  )
}
