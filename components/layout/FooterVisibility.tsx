'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

const HIDDEN_ROUTES = ['/login', '/register']

export default function FooterVisibility() {
  const pathname = usePathname()
  const hideFooter = pathname ? HIDDEN_ROUTES.some((route) => pathname.startsWith(route)) : false

  if (hideFooter) {
    return null
  }

  return <Footer />
}

