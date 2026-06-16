'use client'

import { useRouter } from 'next/navigation'
import About from '../../src/About.jsx'

export default function Page() {
  const router = useRouter()
  return <About onBack={() => router.push('/')} />
}
