'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import EventCard from '@/components/events/EventCard'
import CTASection from '@/components/home/CTASection'
import { FALLBACK_EVENT_LIST } from '@/lib/data/fallback-events'

type EventItem = {
  id: string
  title: string
  description: string
  date: string
  location: string
  image?: string
  participants: number
  maxParticipants: number
  distance: string
  status: 'open' | 'closed'
}

const HERO_EVENT = {
  title: 'Chạy vì trái tim Việt',
  subtitle: '2km - Techcombank',
  description:
    'Khám phá các sự kiện chạy bộ đỉnh cao, nội dung truyền cảm hứng từ video livestream đến bài viết chuyên sâu. Tham gia cộng đồng, theo dõi tiến bộ và chinh phục mọi đường chạy.',
  sponsorLogo: '/Image/techcombank-seeklogo.png',
  stats: [
    { label: 'Số người đã chạy', value: '30,000+' },
    { label: 'Phí tham gia', value: 'Miễn phí' },
  ],
}

const CITY_OPTIONS = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ']
const DISTANCE_OPTIONS = ['Tất cả', '5K', '10K', '21K', '42K']

const CITY_ALIASES: Record<string, string[]> = {
  'TP. Hồ Chí Minh': ['thanh pho hcm', 'tp ho chi minh', 'ho chi minh', 'hcm', 'thanh pho ho chi minh', 'tp hcm'],
  'Hà Nội': ['ha noi', 'hanoi', 'thanh pho ha noi'],
  'Đà Nẵng': ['da nang'],
  'Cần Thơ': ['can tho'],
}

const QUICK_TAGS: Array<
  | { label: string; type: 'keyword'; value: string }
  | { label: string; type: 'city'; value: string }
  | { label: string; type: 'distance'; value: string }
> = [
  { label: 'official', type: 'keyword', value: 'official' },
  { label: 'Thành phố HCM', type: 'city', value: 'TP. Hồ Chí Minh' },
  { label: 'Phường Thủ Đức', type: 'keyword', value: 'Thủ Đức' },
  { label: '5K', type: 'distance', value: '5K' },
]

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-[120px] flex items-center justify-center text-neutral-500">
          Đang tải sự kiện...
        </div>
      }
    >
      <EventsPageInner />
    </Suspense>
  )
}

function EventsPageInner() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0])
  const [selectedDistance, setSelectedDistance] = useState(DISTANCE_OPTIONS[0])
  const [keyword, setKeyword] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedWard, setSelectedWard] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const { getEvents } = await import('@/lib/api/events')
        const response = await getEvents(page, 12)
        const mappedEvents = response.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: new Date(event.date).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          location: event.location || 'TP. Hồ Chí Minh',
          image: event.image_url || '/Image/Event.png',
          participants: event.participants_count || 0,
          maxParticipants: event.max_participants || 1000,
          distance: event.categories?.[0] || '42K',
          status: (event.status === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
        }))

        if (mappedEvents.length === 0) {
          setEvents(FALLBACK_EVENT_LIST)
          setTotal(FALLBACK_EVENT_LIST.length)
        } else {
          setEvents(mappedEvents)
          setTotal(response.total)
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents(FALLBACK_EVENT_LIST)
        setTotal(FALLBACK_EVENT_LIST.length)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [page])

  // Initialize filters from query params (used when navigating from home hero section)
  useEffect(() => {
    const cityParam = searchParams.get('city')
    const wardParam = searchParams.get('ward')

    if (cityParam) {
      const cityMap: Record<string, string> = {
        'Thành phố HCM': 'TP. Hồ Chí Minh',
        'Hà Nội': 'Hà Nội',
        'Đà Nẵng': 'Đà Nẵng',
        'Cần Thơ': 'Cần Thơ',
      }
      const mappedCity = cityMap[cityParam] ?? cityParam
      if (CITY_OPTIONS.includes(mappedCity)) {
        setSelectedCity(mappedCity)
      }
    }

    if (wardParam) {
      setSelectedWard(wardParam)
    }
  }, [searchParams])

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()

  const matchesCity = (location: string, selected: string): boolean => {
    const normalizedLocation = normalizeText(location)
    const normalizedSelected = normalizeText(selected)

    if (normalizedSelected === 'tat ca') {
      return true
    }

    if (normalizedLocation.includes(normalizedSelected) || normalizedSelected.includes(normalizedLocation)) {
      return true
    }

    const aliases = CITY_ALIASES[selected] ?? []
    return aliases.some((alias) => normalizedLocation.includes(normalizeText(alias)))
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchCity =
        selectedCity === 'Tất cả' || matchesCity(event.location, selectedCity)
      const matchDistance =
        selectedDistance === 'Tất cả' || event.distance === selectedDistance
      const matchKeyword =
        keyword.length === 0 || event.title.toLowerCase().includes(keyword.toLowerCase())
      const matchWard =
        !selectedWard ||
        normalizeText(event.location).includes(normalizeText(selectedWard))

      return matchCity && matchDistance && matchKeyword && matchWard
    })
  }, [events, selectedCity, selectedDistance, keyword, selectedWard])

  return (
    <div className="flex flex-col items-center bg-white">
      {/* Hero */}
      <section className="relative mt-[100px] flex w-full justify-center px-4 text-white">
        <div className="relative w-full max-w-[1200px] overflow-hidden rounded-[32px] bg-neutral-900">
          <Image
            src="/Image/Event.png"
            alt="Event hero"
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="relative z-10 flex w-full flex-col gap-8 px-4 py-24 md:px-6 lg:px-10">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl font-semibold leading-tight md:text-[64px] md:tracking-[-1.5px]">
                {HERO_EVENT.title}
                <br />
                {HERO_EVENT.subtitle}
              </h1>
              <p className="text-lg text-white/80">{HERO_EVENT.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 rounded-[18px] border border-white/15 bg-white/5 p-6 backdrop-blur-md">
              <Image
                src={HERO_EVENT.sponsorLogo}
                alt="Techcombank"
                width={160}
                height={60}
                className="object-contain"
              />
              <div className="flex flex-1 flex-wrap gap-6">
                {HERO_EVENT.stats.map((stat) => (
                  <div key={stat.label} className="min-w-[150px] space-y-1">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">{stat.label}</p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button className="rounded-[12px] border border-white/30 px-6 py-3 text-base font-medium uppercase backdrop-blur-sm">
                  Xem chi tiết
                </button>
                <Link
                  href="/events"
                  className="rounded-[12px] bg-white/90 px-6 py-3 text-base font-semibold uppercase text-black shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.15),inset_4px_4px_6px_rgba(255,255,255,0.4)]"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 md:px-6 lg:px-10">
          <div className="flex flex-wrap gap-3 text-sm">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  setActiveTag(tag.label)
                  if (tag.type === 'keyword') {
                    setKeyword(tag.value)
                  } else {
                    setKeyword('')
                  }
                  if (tag.type === 'city') {
                    setSelectedCity(tag.value)
                  }
                  if (tag.type === 'distance') {
                    setSelectedDistance(tag.value)
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTag === tag.label
                    ? 'border-[#1c1c1c] bg-[#1c1c1c] text-white btn-inner-shadow'
                    : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tag.label}
              </button>
            ))}
            <button className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-neutral-200">
              <svg className="h-4 w-4" viewBox="0 0 10 17" fill="none">
                <path d="M1 1L9 8.5L1 16" stroke="black" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện"
              value={keyword}
              onChange={(event) => {
                setActiveTag(null)
                setKeyword(event.target.value)
              }}
              className="h-[54px] flex-1 rounded-[12px] border border-neutral-200 px-5 text-base text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
            />
            <select
              value={selectedCity}
              onChange={(event) => {
                setActiveTag(null)
                setSelectedCity(event.target.value)
              }}
              className="h-[54px] w-[200px] rounded-[12px] border border-neutral-200 px-4 text-base text-neutral-700 focus:border-black focus:outline-none"
            >
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={selectedDistance}
              onChange={(event) => {
                setActiveTag(null)
                setSelectedDistance(event.target.value)
              }}
              className="h-[54px] w-[200px] rounded-[12px] border border-neutral-200 px-4 text-base text-neutral-700 focus:border-black focus:outline-none"
            >
              {DISTANCE_OPTIONS.map((distance) => (
                <option key={distance} value={distance}>
                  {distance}
                </option>
              ))}
            </select>
            <Link
              href="/events/create"
              className="flex h-[54px] items-center justify-center rounded-[12px] bg-[#1c1c1c] px-6 text-base font-medium text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] hover:bg-neutral-800 transition-colors"
            >
              Tạo giải chạy
            </Link>
          </div>
        </div>
      </section>

      {/* Events grid */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-6 lg:px-10">
          {isLoading ? (
            <div className="py-20 text-center text-lg text-neutral-500">Đang tải sự kiện...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center text-neutral-600">
              Không tìm thấy sự kiện phù hợp.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {filteredEvents.slice(0, 12).map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
              {total > 12 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="rounded-full bg-[#1c1c1c] px-4 py-2 text-sm font-semibold text-white">{page}</span>
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={page * 12 >= total}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CTASection />
    </div>
  )
}
