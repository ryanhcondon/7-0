// Shared server-side config for the 17lands proxy.
// All of these are read at request time so they pick up Vercel env vars without
// a rebuild. Nothing here is sent to the browser.

export const APP_NAME = '7-0'
export const APP_VERSION = '1.0'

// Contact identity sent to 17lands on every request so they can identify the
// app and reach the maintainer (per their permission ask).
export const CONTACT_EMAIL = 'ryanhcondon@gmail.com'

// The public URL of the app. On Vercel, VERCEL_URL is set automatically per
// deployment; APP_PUBLIC_URL lets us pin a stable production URL once we have
// one. Falls back to undefined (UA then carries just the email).
export function publicUrl() {
  if (process.env.APP_PUBLIC_URL) return process.env.APP_PUBLIC_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return null
}

// Descriptive User-Agent: "7-0/1.0 (+https://site; ryanhcondon@gmail.com)".
export function userAgent() {
  const url = publicUrl()
  const contact = url ? `+${url}; ${CONTACT_EMAIL}` : `+contact: ${CONTACT_EMAIL}`
  return `${APP_NAME}/${APP_VERSION} (${contact})`
}

// Master on/off switch for live 17lands calls — "the on button". When this is
// not exactly 'true', the proxy serves cache only and refuses live fetches.
// Keeps us dark until 17lands grants permission.
export function liveEnabled() {
  return process.env.LIVE_17LANDS_ENABLED === 'true'
}

export const SEVENTEEN_BASE = 'https://www.17lands.com'
