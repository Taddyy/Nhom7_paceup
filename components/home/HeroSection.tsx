'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getUserStats, type UserStats } from '@/lib/api/auth'

/**
 * Hero section component matching Figma design.
 *
 * Displays hero section with title, description, location picker, and stats.
 */
export default function HeroSection() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFetchingAuth, setIsFetchingAuth] = useState(true)
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)

  const cityOptions = useMemo(
    () => [
      'Thành phố HCM',
      'Hà Nội',
      'Đà Nẵng',
      'Cần Thơ'
    ],
    []
  )

  const wardOptionsByCity: Record<string, string[]> = {
    'Thành phố HCM': ['Phường Thủ Đức', 'Quận 1', 'Quận 7'],
    'Hà Nội': ['Quận Hoàn Kiếm', 'Quận Cầu Giấy'],
    'Đà Nẵng': ['Quận Hải Châu', 'Quận Sơn Trà'],
    'Cần Thơ': ['Quận Ninh Kiều', 'Quận Bình Thủy']
  }

  const [selectedCity, setSelectedCity] = useState<string>(cityOptions[0])
  const [selectedWard, setSelectedWard] = useState<string>(wardOptionsByCity[cityOptions[0]][0])

  useEffect(() => {
    const wards = wardOptionsByCity[selectedCity] ?? []
    setSelectedWard((prev) => (wards.includes(prev) ? prev : wards[0]))
  }, [selectedCity, wardOptionsByCity])

  const handleSearch = () => {
    const params = new URLSearchParams({
      city: selectedCity,
      ward: selectedWard
    })
    router.push(`/events?${params.toString()}`)
  }

  useEffect(() => {
    const syncAuthState = async () => {
      if (typeof window === 'undefined') {
        setIsFetchingAuth(false)
        return
      }
      const token = localStorage.getItem('token')
      if (!token) {
        setIsAuthenticated(false)
        setStats(null)
        setUserName('')
        setIsFetchingAuth(false)
        return
      }

      try {
        setIsAuthenticated(true)
        const [profile, userStats] = await Promise.all([getCurrentUser(), getUserStats()])
        setUserName(profile?.full_name ?? profile?.email ?? '')
        setStats(userStats)
      } catch (error) {
        console.error('Không thể tải thông tin người dùng:', error)
        setIsAuthenticated(false)
        setStats(null)
        setUserName('')
      } finally {
        setIsFetchingAuth(false)
      }
    }

    syncAuthState()

    const handleStorage = () => {
      syncAuthState()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage)
      }
    }
  }, [])

  const getUserInitials = (name: string) => {
    if (!name) return ''
    const parts = name.trim().split(' ')
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
    return initials || name.charAt(0).toUpperCase()
  }

  const formattedDistance = stats ? `${stats.total_distance_km.toFixed(1)} KM` : '0 KM'
  const formattedEvents = stats ? `${stats.events_joined} giải` : '0 giải'

  return (
    <section className="relative w-full min-h-[950px] overflow-hidden bg-white mt-[100px]">
      {/* Background Hero Image */}
      <div className="absolute inset-0 right-0 rounded-[32px] overflow-hidden z-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
          <Image
            src="/Image/Hero.png"
            alt="Hero background"
            fill
            className="object-cover scale-150 -translate-x-1/4 -translate-y-1/4"
            priority
          />
        </div>
      </div>

      {/* Gradient overlay between background and text */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 md:px-[81px] pt-[236px] pb-10">
        <div className="max-w-[740px] flex flex-col gap-10 h-[622px] justify-between">
          {/* Title and Description */}
          <div className="flex flex-col gap-8 max-w-[621px]">
            <div className="flex flex-col gap-4">
              <h1 className="font-bold text-[64px] leading-[1.2] text-[#252525] tracking-[-1.28px]">
                Chạy Để Kết Nối – Giải Chạy Việt Nam!
              </h1>
              <p className="font-normal text-[19px] leading-[1.5] text-[#424242]">
                Khám phá các sự kiện chạy bộ đỉnh cao, nội dung truyền cảm hứng từ video livestream đến bài viết chuyên sâu. Tham gia cộng đồng, theo dõi tiến bộ và chinh phục mọi đường chạy.
              </p>
            </div>

            {/* Location Picker */}
            <div className="flex gap-2">
              <div className="bg-[#f3f3f3] border border-[rgba(182,182,182,0.1)] rounded-[12px] px-3 py-0 h-[50px] flex items-center gap-2 w-[246px]">
                <Image src="/Icon/city.svg" alt="" width={12} height={15} />
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="w-full bg-transparent text-[17px] text-[#252525] focus:outline-none"
                >
                  {cityOptions.map((option) => (
                    <option key={option} value={option} className="text-[#252525]">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-[#f3f3f3] border border-[rgba(182,182,182,0.2)] rounded-[12px] px-3 py-0 h-[50px] flex items-center gap-2 w-[233px]">
                <Image src="/Icon/ward.svg" alt="" width={14} height={14} />
                <select
                  value={selectedWard}
                  onChange={(event) => setSelectedWard(event.target.value)}
                  className="w-full bg-transparent text-[17px] text-[#252525] focus:outline-none"
                >
                  {(wardOptionsByCity[selectedCity] ?? []).map((option) => (
                    <option key={option} value={option} className="text-[#252525]">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="bg-[#0b0b0b] border border-[rgba(182,182,182,0.1)] rounded-[12px] h-[50px] w-[54px] flex items-center justify-center hover:bg-[#1c1c1c] transition-colors"
                aria-label="Tìm sự kiện"
              >
                <svg className="w-[10.059px] h-[17.244px]" viewBox="0 0 10 17" fill="none">
                  <path d="M1 1L9 8.5L1 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Stats and CTA */}
          {isAuthenticated && (
          <div className="backdrop-blur-[13px] bg-gradient-to-b from-[rgba(243,243,243,0.5)] to-[rgba(243,243,243,0.12)] border border-[rgba(255,255,255,0.12)] rounded-[15px] p-6 w-full">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1.5">
                  <p className="font-medium text-lg text-[#252525] uppercase whitespace-nowrap">
                    Quãng đường đã chạy
                  </p>
                  <p className="font-normal text-lg text-[#252525] opacity-70">
                    {formattedDistance}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-medium text-lg text-[#252525] uppercase whitespace-nowrap">
                    Giải chạy đã tham gia
                  </p>
                  <p className="font-normal text-lg text-[#252525] opacity-70">
                    {formattedEvents}
                  </p>
                </div>
                <Link
                  href="/events"
                  className="bg-[#1c1c1c] flex items-center justify-center px-6 py-3 rounded-lg relative shadow-[inset_-4px_-4px_4px_0px_rgba(0,0,0,0.4),inset_4px_4px_6px_0px_rgba(255,255,255,0.15)] text-white uppercase font-medium whitespace-nowrap"
                >
                  Đăng kí ngay
                </Link>
              </div>
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
