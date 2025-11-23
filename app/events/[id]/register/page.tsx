'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import CTASection from '@/components/home/CTASection'
import { getEvent } from '@/lib/api/events'
import { FALLBACK_EVENT_DETAILS_MAP, type FallbackEventDetail } from '@/lib/data/fallbackEvents'
import { getFallbackEventDetail } from '@/lib/data/fallback-event-details'
import { getTicketOptions, type TicketOption } from '@/lib/data/fallbackEventTickets'
import StepIndicator, {
  STEP_ICON_PATHS,
  type StepConfig
} from '@/components/register/StepIndicator'

interface RegistrationEventInfo {
  id: string
  title: string
  description: string
  image: string
  categories: string[]
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const formatCurrency = (value: number): string =>
  currencyFormatter.format(value).replace(/\s?₫/, ' VND')

const REGISTRATION_STEPS: StepConfig[] = [
  { id: 'ticket', label: 'Chọn loại vé', icon: STEP_ICON_PATHS.ticket, status: 'current' },
  { id: 'participant', label: 'Thông tin người tham gia', icon: STEP_ICON_PATHS.participant, status: 'upcoming' },
  { id: 'payment', label: 'Thanh toán', icon: STEP_ICON_PATHS.payment, status: 'upcoming' }
]

export default function EventRegistrationStepOnePage() {
  const params = useParams()
  const eventId = params.id as string
  const router = useRouter()
  const fallbackMeta: FallbackEventDetail | undefined = FALLBACK_EVENT_DETAILS_MAP[eventId]
  const fallbackDetail = useMemo(() => getFallbackEventDetail(eventId), [eventId])
  const [event, setEvent] = useState<RegistrationEventInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    let isSubscribed = true

    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const eventData = await getEvent(eventId)
        if (!isSubscribed) return
        const mappedEvent: RegistrationEventInfo = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          image: eventData.image_url ?? fallbackDetail.heroImage,
          categories: eventData.categories ?? []
        }

        const options = getTicketOptions(eventData.id, mappedEvent.categories)

        setEvent(mappedEvent)
        setTicketOptions(options)
        setSelectedTicketId(options[0]?.id ?? null)
      } catch (error) {
        console.error('Unable to load event for registration:', error)
        if (!isSubscribed) return

        if (fallbackMeta) {
          const fallbackEvent: RegistrationEventInfo = {
            id: fallbackMeta.id,
            title: fallbackMeta.title,
            description: fallbackMeta.description,
            image: fallbackMeta.image,
            categories: fallbackMeta.categories
          }
          const options = getTicketOptions(fallbackMeta.id, fallbackMeta.categories)
          setEvent(fallbackEvent)
          setTicketOptions(options)
          setSelectedTicketId(options[0]?.id ?? null)
        } else {
          setEvent(null)
          setTicketOptions([])
          setSelectedTicketId(null)
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false)
        }
      }
    }

    fetchEvent()

    return () => {
      isSubscribed = false
    }
  }, [eventId, fallbackMeta, fallbackDetail.heroImage])

  const selectedTicket = ticketOptions.find((option) => option.id === selectedTicketId)

  const handleContinue = () => {
    if (!event) {
      setActionMessage('Không tìm thấy thông tin sự kiện. Vui lòng tải lại trang.')
      return
    }
    if (!selectedTicket) {
      setActionMessage('Vui lòng chọn một loại vé trước khi tiếp tục.')
      return
    }

    setActionMessage(null)

    if (typeof window !== 'undefined') {
      const selectionPayload = {
        eventId: event.id,
        ticketId: selectedTicket.id,
        ticketLabel: selectedTicket.label,
        ticketPrice: selectedTicket.price,
        storedAt: Date.now()
      }
      window.sessionStorage.setItem(
        'paceup-registration-progress',
        JSON.stringify(selectionPayload)
      )
    }

    router.push(`/events/${event.id}/register/participant`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
          Đang tải thông tin đăng ký...
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

  const coverImage = event.image || fallbackDetail.heroImage

  return (
    <>
      <div className="bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-20 pt-[150px] sm:pt-[170px]">
          <div className="flex w-full items-center justify-between">
            <Link
              href={`/events/${event.id}`}
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
              Quay lại chi tiết sự kiện
            </Link>
            <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">Step 1 / 3</span>
          </div>

          <div className="relative h-[260px] w-full overflow-hidden rounded-[32px] bg-neutral-100 sm:h-[360px] lg:h-[520px]">
            <Image
              src={coverImage}
              alt={event.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight text-neutral-900 md:text-[48px] md:leading-[1.1]">
              {event.title}
            </h1>
            <p className="text-lg text-neutral-600">{event.description}</p>
          </div>

          <div>
            <p className="text-center text-3xl font-semibold text-neutral-900">Đăng ký sự kiện</p>
            <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm">
              <StepIndicator steps={REGISTRATION_STEPS} />
            </div>
          </div>

          <div className="space-y-4 rounded-[32px] border border-neutral-200 bg-white p-8 shadow-sm">
            {ticketOptions.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
                Hiện chưa có gói vé nào được mở cho sự kiện này. Vui lòng quay lại sau.
              </div>
            )}
            {ticketOptions.map((ticket) => {
              const isSelected = ticket.id === selectedTicketId

              return (
                <label
                  key={ticket.id}
                  className={`flex cursor-pointer flex-col gap-4 rounded-[20px] border px-4 py-4 transition md:flex-row md:items-center md:justify-between ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-transparent hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      className="sr-only"
                      name="ticket"
                      value={ticket.id}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedTicketId(ticket.id)
                        setActionMessage(null)
                      }}
                    />
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-neutral-900' : 'border-neutral-300'
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-neutral-900 transition ${
                          isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                        }`}
                      />
                    </span>
                    <div className="text-left">
                      <p
                        className={`text-2xl font-semibold ${
                          isSelected ? 'text-neutral-900' : 'text-neutral-600'
                        }`}
                      >
                        {ticket.label}
                      </p>
                      {ticket.description && (
                        <p className="text-sm text-neutral-500">{ticket.description}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(ticket.price)}</p>
                </label>
              )
            })}
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white/80 p-6 shadow-lg backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Tổng tiền
                </p>
                <p className="text-3xl font-bold text-neutral-900">
                  {selectedTicket ? formatCurrency(selectedTicket.price) : '--'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.35),inset_4px_4px_8px_rgba(255,255,255,0.2)] transition hover:opacity-90"
              >
                Tiếp tục
              </button>
            </div>
            {actionMessage && <p className="mt-4 text-sm text-neutral-500">{actionMessage}</p>}
          </div>
        </div>
      </div>
      <CTASection />
    </>
  )
}
