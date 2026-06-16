'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Persistent top bar shown on every page. The "7-0" title links home, so
// players can always get back to the hub after a game.
const LINKS = [
  { href: '/daily', label: 'Daily' },
  { href: '/draft', label: 'Full Draft' },
  { href: '/quick', label: 'Quick' },
  { href: '/archive', label: 'Archive' },
  { href: '/about', label: 'About' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="topbar">
      <Link href="/" className="brand"><h1>7-0</h1></Link>
      <nav className="topnav">
        {LINKS.map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          return (
            <Link key={l.href} href={l.href} className={active ? 'navlink active' : 'navlink'}>
              {l.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
