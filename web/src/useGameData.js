'use client'

import { useEffect, useState } from 'react'

// Loads the two shared static assets every player needs — the card catalog and
// the daily-puzzle manifest — once, and caches them at module scope so route
// changes don't refetch. Returns { cards, manifest } when ready, { error } on
// failure, or null while loading.
let cache = null
let inFlight = null

function load() {
  if (cache) return Promise.resolve(cache)
  inFlight ??= Promise.all([
    fetch('/cards.SOS.json').then(r => r.json()),
    fetch('/puzzles/manifest.json').then(r => r.json()),
  ]).then(([cards, manifest]) => {
    cache = { cards, manifest }
    return cache
  })
  return inFlight
}

export function useGameData() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (data) return
    let alive = true
    load()
      .then(d => alive && setData(d))
      .catch(e => alive && setData({ error: e.message }))
    return () => {
      alive = false
    }
  }, [data])
  return data
}

// Flat list of every puzzle id across all days (used by Quick).
export function allPuzzleIds(manifest) {
  return [...new Set(Object.values(manifest.days).flat())]
}
