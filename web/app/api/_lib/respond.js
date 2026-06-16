// Small shared helpers for the proxy API routes.
import { liveEnabled } from '../../../lib/config.js'
import { UpstreamError } from '../../../lib/seventeenlands.js'

export const json = (data, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

export const error = (message, status = 500) => json({ error: message }, status)

// Returns a 503 Response when live calls are switched off, else null. Routes
// call this only on a cache miss — cached data is always served.
export function liveGate() {
  if (liveEnabled()) return null
  return error('Live 17lands data is currently disabled.', 503)
}

// Map an UpstreamError to its status; anything else is a 500.
export function fromUpstream(e) {
  if (e instanceof UpstreamError) return error(e.message, e.status)
  console.error('[proxy] unexpected error:', e)
  return error('Internal proxy error.', 500)
}
