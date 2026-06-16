// Server-only Supabase access for the draft cache.
//
// The cache is permanent: every 17lands draft/deck is fetched at most once,
// ever, then served from Postgres. The service_role key bypasses RLS and must
// never reach the browser — these helpers are only imported by API routes.
//
// If the env vars aren't set yet (e.g. local dev before Ryan wires Supabase),
// the helpers degrade to no-ops so the proxy still works, just uncached.

import { createClient } from '@supabase/supabase-js'

let _client
function client() {
  if (_client !== undefined) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  _client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  if (!_client) console.warn('[supabase] SUPABASE_URL / SERVICE_ROLE_KEY unset — cache disabled')
  return _client
}

// Look up a cached payload by its composite key (e.g. "draft:abc", "deck:abc:0").
// Returns the stored JSON payload, or null on miss / when caching is disabled.
export async function cacheGet(id) {
  const db = client()
  if (!db) return null
  const { data, error } = await db.from('drafts').select('payload').eq('id', id).maybeSingle()
  if (error) {
    console.warn(`[supabase] cacheGet(${id}) failed: ${error.message}`)
    return null
  }
  return data?.payload ?? null
}

// Store a payload under its key. Best-effort: a cache write failure never breaks
// the request, the caller still returns the freshly fetched data.
export async function cacheSet(id, kind, payload) {
  const db = client()
  if (!db) return
  const { error } = await db.from('drafts').upsert({ id, kind, payload }, { onConflict: 'id' })
  if (error) console.warn(`[supabase] cacheSet(${id}) failed: ${error.message}`)
}
