'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import CTASection from '@/components/home/CTASection'
import { FALLBACK_EVENT_DETAILS_MAP, type FallbackEventDetail } from '@/lib/data/fallbackEvents'
import { getFallbackEventDetail, type EventDetailSection } from '@/lib/data/fallback-event-details'

interface Event {
  id: string
  title: string
  description: string
  fullDescription: string
  date: string
  time: string
  location: string
  address: string
  image?: string
  participants: number
  maxParticipants: number
  registrationDeadline: string
  categories: string[]
}

const formatDisplayDate = (value?: string) => {
  if (!value) return '--'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default function EventDetailPage() {
  const params = useParams()
  const fallbackMeta: FallbackEventDetail | undefined =
    FALLBACK_EVENT_DETAILS_MAP[params.id as string]
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const { getEvent } = await import('@/lib/api/events')
        const eventData = await getEvent(params.id as string)
        setEvent({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          fullDescription: eventData.full_description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          address: eventData.address,
          image: eventData.image_url,
          participants: eventData.participants_count,
          maxParticipants: eventData.max_participants,
          registrationDeadline: eventData.registration_deadline,
          categories: eventData.categories
        })
      } catch (error) {
        console.error('Error fetching event:', error)
        if (fallbackMeta) {
          setEvent({
            id: fallbackMeta.id,
            title: fallbackMeta.title,
            description: fallbackMeta.description,
            fullDescription: fallbackMeta.fullDescription,
            date: fallbackMeta.date,
            time: fallbackMeta.time,
            location: fallbackMeta.location,
            address: fallbackMeta.address,
            image: fallbackMeta.image,
            participants: fallbackMeta.participants,
            maxParticipants: fallbackMeta.maxParticipants,
            registrationDeadline: fallbackMeta.registrationDeadline,
            categories: fallbackMeta.categories
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [params.id, fallbackMeta])

  const detailContent = useMemo(
    () => getFallbackEventDetail(event?.id ?? (params.id as string)),
    [event?.id, params.id]
  )

  const handleStartRegistration = () => {
    if (!event || isFull) {
      return
    }
    router.push(`/events/${event.id}/register`)
  }

  const sectionCards = detailContent.sections ?? []
  const summaryParagraphs =
    detailContent.summary && detailContent.summary.length > 0
      ? detailContent.summary
      : (event?.fullDescription ?? '')
          .split('\n')
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph.length > 0)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
          Đang tải dữ liệu sự kiện...
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-lg rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-xl">
          <p className="text-2xl font-semibold text-neutral-900">Không tìm thấy sự kiện</p>
          <p className="mt-4 text-neutral-600">
            Liên kết bạn truy cập có thể đã hết hạn hoặc sự kiện đã bị gỡ.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-flex items-center justify-center rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
          >
            Quay lại danh sách sự kiện
          </Link>
        </div>
      </div>
    )
  }

  const isFull = event.participants >= event.maxParticipants
  const heroImage = event.image ?? detailContent.heroImage
  const eventTimeDisplay =
    detailContent.eventTime ??
    [event.time, formatDisplayDate(event.date)].filter(Boolean).join(', ')
  const startLocation = detailContent.startLocation ?? event.location
  const finishLocation = detailContent.finishLocation ?? event.address
  const hasSectionContent = sectionCards.length > 0
  const infoCards = [
    {
      label: 'Ngày diễn ra',
      value: formatDisplayDate(event.date),
      caption: event.time
    },
    {
      label: 'Địa điểm',
      value: event.location,
      caption: event.address
    },
    {
      label: 'Hạn đăng ký',
      value: formatDisplayDate(event.registrationDeadline)
    },
    {
      label: 'Số suất đã nhận',
      value: `${event.participants.toLocaleString('vi-VN')} / ${event.maxParticipants.toLocaleString('vi-VN')}`,
      caption: `${Math.min(
        Math.round((event.participants / event.maxParticipants) * 100),
        100
      )}% đã đầy`
    }
  ]

  return (
    <>
      <div className="bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-20 pt-[150px] sm:pt-[170px]">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Quay lại danh sách sự kiện
        </Link>

        <section className="relative overflow-hidden rounded-[32px] bg-neutral-900 text-white">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={event.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col gap-8 px-6 py-12 md:px-12">
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
              {detailContent.badges.map((badge) => (
                <span key={badge} className="rounded-full bg-white/10 px-4 py-2">
                  {badge}
                </span>
              ))}
              {event.categories.map((category) => (
                <span key={category} className="rounded-full border border-white/30 px-4 py-2">
                  {category}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">PaceUp Series</p>
              <h1 className="text-4xl font-semibold md:text-[56px] md:leading-[1.1]">
                {event.title}
              </h1>
              <p className="max-w-2xl text-base text-white/85 md:text-lg">
                {event.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {detailContent.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  {stat.caption && (
                    <p className="text-sm text-white/70">{stat.caption}</p>
                  )}
                </div>
              ))}
            </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleStartRegistration}
              disabled={isFull}
              className="rounded-[14px] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.2),inset_4px_4px_6px_rgba(255,255,255,0.3)] transition disabled:opacity-50"
            >
              {isFull ? 'ĐÃ ĐẦY' : 'ĐĂNG KÝ NGAY'}
            </button>
            <a
              href="#roadbook"
              className="rounded-[14px] border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Xem Roadbook
            </a>
          </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-[12px] bg-neutral-100 p-3">
              <svg className="h-6 w-6 text-neutral-900" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold uppercase text-neutral-500">Thời gian</p>
              <p className="text-lg text-neutral-900">{eventTimeDisplay}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-[12px] bg-neutral-100 p-3">
              <svg className="h-6 w-6 text-neutral-900" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2.5c-3 0-5.5 2.4-5.5 5.3 0 3.7 5.5 9.7 5.5 9.7s5.5-6 5.5-9.7c0-2.9-2.5-5.3-5.5-5.3Zm0 7.3a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div className="text-lg text-neutral-900">
              <p>
                <span className="font-semibold">Xuất phát:</span> {startLocation}
              </p>
              {finishLocation && (
                <p>
                  <span className="font-semibold">Về đích:</span> {finishLocation}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-neutral-900">Giới thiệu & cung đường</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-neutral-600">
              {summaryParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {detailContent.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[18px] border border-neutral-100 bg-neutral-50 px-4 py-5"
                >
                  <p className="text-sm font-medium text-neutral-900">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900">Timeline sự kiện</h3>
            <div className="mt-6 space-y-5">
              {detailContent.schedule.map((item) => (
                <div key={`${item.time}-${item.title}`} className="flex items-center gap-4">
                  <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold leading-none text-white">
                    {item.time}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-neutral-900">{item.title}</p>
                    <p className="text-sm text-neutral-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="roadbook"
          className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        >
          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">Route & logistics</h3>
                <p className="text-sm text-neutral-500">Các thông số quan trọng cần lưu ý</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                {detailContent.route.distance}
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[18px] border border-neutral-100 bg-neutral-50 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Độ cao</p>
                <p className="text-xl font-semibold text-neutral-900">
                  {detailContent.route.elevation}
                </p>
              </div>
              <div className="rounded-[18px] border border-neutral-100 bg-neutral-50 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Trạm tiếp nước</p>
                <p className="text-xl font-semibold text-neutral-900">
                  {detailContent.route.hydrationPoints}
                </p>
              </div>
              <div className="rounded-[18px] border border-neutral-100 bg-neutral-50 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Map preview</p>
                <p className="text-xl font-semibold text-neutral-900">Tải roadbook</p>
              </div>
            </div>
            <div className="relative mt-6 h-[280px] overflow-hidden rounded-[20px] border border-neutral-100">
              <Image
                src={detailContent.route.mapImage}
                alt={`Route preview of ${event.title}`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900">Race kit & tiện ích</h3>
            <ul className="mt-4 space-y-3">
              {detailContent.raceKit.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium text-neutral-800"
                >
                  <span className="h-2 w-2 rounded-full bg-neutral-900" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-4">
              {detailContent.amenities.map((amenity) => (
                <div key={amenity.title} className="rounded-[18px] border border-neutral-100 p-4">
                  <p className="text-base font-semibold text-neutral-900">{amenity.title}</p>
                  <p className="text-sm text-neutral-600">{amenity.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-500">{detailContent.organizerNote}</p>
          </div>
        </section>

        {hasSectionContent && (
          <section className="flex flex-col gap-6">
            {sectionCards.map((section) => (
              <DetailSectionCard key={section.id} section={section} />
            ))}
          </section>
        )}

        {!hasSectionContent && detailContent.gallery.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">Khoảnh khắc nổi bật</h3>
                <p className="text-sm text-neutral-500">Cập nhật từ cộng đồng runner PaceUp</p>
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">
                #{event.title.replace(/\s+/g, '')}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {detailContent.gallery.map((galleryImage, index) => (
                <div
                  key={`${galleryImage}-${index}`}
                  className="relative h-56 overflow-hidden rounded-[18px]"
                >
                  <Image
                    src={galleryImage}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900">Thông tin chi tiết</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {infoCards.map((card) => (
                <div key={card.label} className="rounded-[18px] border border-neutral-100 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">{card.value}</p>
                  {card.caption && (
                    <p className="text-sm text-neutral-500">{card.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900">Đăng ký tham gia</h3>
            <p className="mt-3 text-sm text-neutral-500">
              Bấm nút bên dưới để chọn gói vé và điền thông tin tại bước tiếp theo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {event.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600"
                >
                  {category}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleStartRegistration}
              disabled={isFull}
              className="mt-6 w-full rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.35),inset_4px_4px_8px_rgba(255,255,255,0.2)] transition disabled:opacity-50"
            >
              {isFull ? 'Sự kiện đã đầy' : 'Đăng ký tham gia'}
            </button>
            <p className="mt-4 text-sm text-neutral-500">
              Hạn cuối đăng ký: {formatDisplayDate(event.registrationDeadline)}
            </p>
          </div>
        </section>
      </div>
    </div>
    <CTASection />
  </>
  )
}

function DetailSectionCard({ section }: { section: EventDetailSection }) {
  if (section.type === 'gallery') {
    return (
      <div className="bg-[#f7f7f7] rounded-[24px] p-6 shadow-[2px_6px_8px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-semibold text-neutral-900">{section.title}</p>
          <span className="text-sm text-neutral-500 uppercase tracking-[0.3em]">#gallery</span>
        </div>
        {section.description && (
          <p className="mt-2 text-base text-neutral-600">{section.description}</p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {section.images.map((image, index) => (
            <div key={`${section.id}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <Image src={image} alt={`${section.title} ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (section.type === 'image') {
    const aspectRatio = section.aspectRatio ?? 16 / 9
    return (
      <div className="bg-[#f7f7f7] rounded-[24px] p-6 shadow-[2px_6px_8px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-neutral-900">{section.title}</p>
          <span className="text-sm text-neutral-500">Infographic</span>
        </div>
        {section.description && (
          <p className="mt-2 text-base text-neutral-600">{section.description}</p>
        )}
        <div
          className="mt-6 overflow-hidden rounded-[20px] relative"
          style={{ aspectRatio: `${aspectRatio}` }}
        >
          <Image src={section.image} alt={section.title} fill className="object-cover" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f7f7f7] rounded-[24px] p-6 shadow-[2px_6px_8px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold text-neutral-900">{section.title}</p>
        <span className="text-sm text-neutral-500">Thông tin</span>
      </div>
      {section.description && (
        <p className="mt-2 text-base text-neutral-600">{section.description}</p>
      )}
      {section.paragraphs && (
        <div className="mt-4 space-y-3 text-base leading-7 text-neutral-700">
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-neutral-700">
          {section.bullets.map((bullet, index) => (
            <li key={`${section.id}-bullet-${index}`}>{bullet}</li>
          ))}
        </ul>
      )}
      {section.contacts && section.contacts.length > 0 && (
        <div className="mt-4 space-y-2 text-sm text-neutral-700">
          {section.contacts.map((contact) => (
            <p key={`${section.id}-${contact.label}`}>
              <span className="font-semibold">{contact.label}:</span>{' '}
              {contact.href ? (
                <a
                  href={contact.href}
                  className="underline decoration-dotted underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {contact.value}
                </a>
              ) : (
                contact.value
              )}
            </p>
          ))}
        </div>
      )}
      {section.image && (
        <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[20px]">
          <Image src={section.image} alt={section.title} fill className="object-cover" />
        </div>
      )}
    </div>
  )
}
