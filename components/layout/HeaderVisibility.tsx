'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'

const HIDDEN_PATHS = ['/login', '/register']

export default function HeaderVisibility() {
  const pathname = usePathname()

  const shouldHideHeader =
    pathname !== null &&
    HIDDEN_PATHS.some((hiddenPath) => pathname === hiddenPath || pathname.startsWith(`${hiddenPath}/`))

  if (shouldHideHeader) {
    return null
  }

  return <Header floating />
}


