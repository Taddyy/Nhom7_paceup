'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/api/auth-service'
import NotificationBell from '@/components/ui/NotificationBell'

/**
 * Header component that mirrors the translucent navigation capsule in Figma.
 */
const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/events', label: 'Giải chạy' },
  { href: '/content', label: 'Nội dung' },
  { href: '/profile', label: 'Cá nhân' }
]

const LOGO_SRC = '/Icon/logo-header.svg'

const getInitials = (fullName: string) => {
  if (!fullName) return ''
  const parts = fullName.trim().split(' ').filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  return initials || fullName[0]?.toUpperCase() || ''
}

interface HeaderProps {
  floating?: boolean
}

export default function Header({ floating = false }: HeaderProps) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [initials, setInitials] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [role, setRole] = useState<string>('user')
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const syncAuth = async () => {
      if (typeof window === 'undefined') return
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoggedIn(false)
        setInitials('')
        setAvatar(null)
        setRole('user')
        return
      }

      try {
        const profile = await getCurrentUser()
        setIsLoggedIn(true)
        setInitials(getInitials(profile?.full_name ?? profile?.email ?? ''))
        setAvatar(profile?.avatar || null)
        setUserId(profile?.id)
        // Force update role from profile or specific email
        const userRole = (profile?.email === 'admin@gmail.com' || profile?.role === 'admin') ? 'admin' : 'user'
        setRole(userRole)
      } catch (error: any) {
        // Only clear token and logout if it's a real 401 Unauthorized error
        // Don't clear token for network errors, timeouts, or other temporary issues
        const isUnauthorized = error?.response?.status === 401
        
        if (isUnauthorized) {
          // Token is actually invalid - clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
          }
        }
        
        // Only update UI state - don't clear token for non-401 errors
        // This allows retry on network errors without losing session
        setIsLoggedIn(false)
        setInitials('')
        setAvatar(null)
        setRole('user')
      }
    }

    syncAuth()

    const handleStorage = () => syncAuth()
    const handleUserUpdate = () => syncAuth()

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)
      window.addEventListener('user:updated', handleUserUpdate)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener('user:updated', handleUserUpdate)
      }
    }
  }, [])

  const handleAvatarClick = () => {
    if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/profile')
    }
  }

  const wrapperClasses = floating
    ? 'pointer-events-none fixed left-0 right-0 top-4 z-50 flex justify-center px-4 sm:left-[73px] sm:right-auto sm:justify-start sm:px-0'
    : 'relative z-30 flex w-full justify-center px-4 pt-8 pb-2'

  const containerClasses = floating
    ? 'pointer-events-auto flex items-center w-full max-w-[960px]'
    : 'flex items-center w-full max-w-[960px] justify-center md:justify-start'

  return (
    <header className={wrapperClasses}>
      <div className={containerClasses}>
        <nav className="flex w-full items-center gap-5 rounded-[999px] border border-[rgba(190,190,190,0.12)] bg-[#f3f3f3]/80 px-6 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <Link href="/" className="relative block h-11 w-11 shrink-0">
            <Image
              src={LOGO_SRC}
              alt="PaceUp logo"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex flex-1 flex-wrap items-center gap-5">
            {NAV_ITEMS.map((item) => {
              if (!isLoggedIn && item.href === '/profile') return null
              
              const isProfile = item.href === '/profile'
              const isAdmin = role === 'admin'
              const href = isProfile && isAdmin ? '/admin' : item.href
              const label = isProfile && isAdmin ? 'Quản lý' : item.label

              return (
                <Link
                  key={item.href}
                  href={href}
                  className="font-medium text-sm text-white/80 whitespace-nowrap hover:text-white transition-colors"
                >
                  {label}
                </Link>
              )
            })}
          </div>
          {isLoggedIn ? (
            <>
              <NotificationBell userId={userId} />
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative h-11 w-11 rounded-full bg-white overflow-hidden shadow-[0_6px_12px_rgba(0,0,0,0.25)] flex items-center justify-center text-[#1c1c1c] text-sm font-semibold"
                aria-label={role === 'admin' ? 'Quản lý' : 'Trang cá nhân'}
              >
              {avatar ? (
                <Image src={avatar} alt="Avatar" fill className="object-cover" />
              ) : (
                initials || (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M4 22c0-3.866 3.134-7 7-7h2c3.866 0 7 3.134 7 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )
              )}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-auto bg-[#1c1c1c] flex items-center justify-center px-4 py-2 rounded-lg relative shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)]"
            >
              <span className="font-medium text-lg text-white uppercase">
                Đăng nhập
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
