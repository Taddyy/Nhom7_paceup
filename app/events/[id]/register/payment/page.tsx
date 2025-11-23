'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CTASection from '@/components/home/CTASection'
import { getEvent } from '@/lib/api/events'
import { FALLBACK_EVENT_DETAILS_MAP, type FallbackEventDetail } from '@/lib/data/fallback-events'
import { getFallbackEventDetail } from '@/lib/data/fallback-event-details'
import StepIndicator, {
  STEP_ICON_PATHS,
  type StepConfig
} from '@/components/register/StepIndicator'

const STEP_INDICATOR: StepConfig[] = [
  { id: 'ticket', label: 'Chọn loại vé', icon: STEP_ICON_PATHS.ticket, status: 'upcoming' },
  { id: 'participant', label: 'Thông tin người tham gia', icon: STEP_ICON_PATHS.participant, status: 'upcoming' },
  { id: 'payment', label: 'Thanh toán', icon: STEP_ICON_PATHS.payment, status: 'current' }
]

interface RegistrationEventInfo {
  id: string
  title: string
  description: string
  image: string
}

interface StoredTicketSelection {
  eventId: string
  ticketId: string
  ticketLabel: string
  ticketPrice: number
}

interface StoredParticipantInfo {
  fullName: string
  email: string
  phone: string
  bibName: string
}

const QR_PLACEHOLDER = '/Image/qr-placeholder.svg'

export default function EventRegistrationPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const fallbackMeta: FallbackEventDetail | undefined = FALLBACK_EVENT_DETAILS_MAP[eventId]
  const fallbackDetail = useMemo(() => getFallbackEventDetail(eventId), [eventId])

  const [event, setEvent] = useState<RegistrationEventInfo | null>(null)
  const [ticket, setTicket] = useState<StoredTicketSelection | null>(null)
  const [participant, setParticipant] = useState<StoredParticipantInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    // Generate a random order ID for demo purposes
    setOrderId(`ORDER${Math.floor(100000 + Math.random() * 900000)}`)
  }, [])

  useEffect(() => {
    let isSubscribed = true
    const fetchEvent = async () => {
      try {
        const eventData = await getEvent(eventId)
        if (!isSubscribed) return
        setEvent({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          image: eventData.image_url ?? fallbackDetail.heroImage
        })
      } catch (error) {
        console.error('Unable to load event for payment step:', error)
        if (!isSubscribed) return
        if (fallbackMeta) {
          setEvent({
            id: fallbackMeta.id,
            title: fallbackMeta.title,
            description: fallbackMeta.description,
            image: fallbackMeta.image
          })
        } else {
          setEvent(null)
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const selectionRaw = window.sessionStorage.getItem('paceup-registration-progress')
    const participantRaw = window.sessionStorage.getItem('paceup-registration-participant')
    if (!selectionRaw || !participantRaw) {
      router.replace(`/events/${eventId}/register`)
      return
    }

    try {
      const parsedSelection: StoredTicketSelection = JSON.parse(selectionRaw)
      const parsedParticipant: StoredParticipantInfo = JSON.parse(participantRaw)

      if (parsedSelection.eventId !== eventId) {
          router.replace(`/events/${eventId}/register`)
          return
      }

      setTicket(parsedSelection)
      setParticipant(parsedParticipant)
    } catch (error) {
      console.warn('Unable to parse stored selection/participant info', error)
      router.replace(`/events/${eventId}/register`)
    }
  }, [eventId, router])

  // VietQR Link Generation
  const vietQrUrl = useMemo(() => {
    if (!ticket || !orderId) return QR_PLACEHOLDER
    // Template: https://img.vietqr.io/image/[BANK_ID]-[ACCOUNT_NO]-[TEMPLATE].png?amount=[AMOUNT]&addInfo=[CONTENT]
    // TPBank ID: 970423 (or just 'TPB')
    // Account: 04840606101
    // Name: Luu Quang Dat
    const bankId = 'TPB'
    const accountNo = '04840606101'
    const template = 'compact2'
    const amount = ticket.ticketPrice
    const content = `PACEUP ${orderId}`
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=Luu%20Quang%20Dat`
  }, [ticket, orderId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
          Đang tải thông tin thanh toán...
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-lg rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-xl">
          <p className="text-2xl font-semibold text-neutral-900">Không tìm thấy sự kiện</p>
          <p className="mt-4 text-neutral-600">Liên kết bạn truy cập có thể đã hết hạn hoặc sự kiện đã bị gỡ.</p>
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

  return (
    <>
      <div className="bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-20 pt-[150px] sm:pt-[170px]">
          <div className="flex w-full items-center justify-between">
            <Link
              href={`/events/${event.id}/register/participant`}
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
              Quay lại thông tin
            </Link>
            <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">Step 3 / 3</span>
          </div>

          <div className="relative h-[260px] w-full overflow-hidden rounded-[32px] bg-neutral-100 sm:h-[360px] lg:h-[520px]">
            <Image src={event.image || fallbackDetail.heroImage} alt={event.title} fill priority className="object-cover" />
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
              <StepIndicator steps={STEP_INDICATOR} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-10 text-center shadow-sm flex flex-col items-center">
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Quét mã QR để thanh toán</p>
              <h2 className="mt-3 text-2xl font-semibold text-neutral-900">Sử dụng ứng dụng ngân hàng hoặc MoMo</h2>
              <div className="mt-6 inline-flex rounded-[32px] border border-neutral-100 bg-neutral-50 p-6">
                <Image
                  src={vietQrUrl}
                  alt="VietQR Payment"
                  width={360}
                  height={360}
                  className="h-[300px] w-[300px] object-contain md:h-[360px] md:w-[360px]"
                  unoptimized
                />
              </div>
              <p className="mt-6 text-sm text-neutral-500 max-w-md">
                Mã QR được tạo tự động với số tiền và nội dung chuyển khoản chính xác. Vui lòng không thay đổi nội dung chuyển khoản.
              </p>
            </div>

            <div className="space-y-6 rounded-[32px] border border-neutral-200 bg-white p-8 shadow-sm">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Thông tin đơn hàng</p>
                <p className="mt-3 text-3xl font-bold text-neutral-900">
                  {ticket ? ticket.ticketPrice.toLocaleString('vi-VN') + ' VND' : '--'}
                </p>
                {ticket && (
                  <p className="text-sm text-neutral-500">Gói đã chọn: {ticket.ticketLabel}</p>
                )}
                {orderId && (
                   <p className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                     Mã đơn: {orderId}
                   </p>
                )}
              </div>
              {participant && (
                <div className="rounded-[20px] border border-neutral-100 bg-neutral-50 p-4 text-left text-sm text-neutral-600">
                  <p className="font-semibold text-neutral-900 mb-2">Người thanh toán</p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <span>Họ tên:</span> <span className="font-medium text-neutral-800">{participant.fullName}</span>
                    <span>Email:</span> <span className="font-medium text-neutral-800">{participant.email}</span>
                    <span>SĐT:</span> <span className="font-medium text-neutral-800">{participant.phone}</span>
                  </div>
                </div>
              )}
              <div className="space-y-3 text-left text-sm text-neutral-600 pt-4 border-t border-neutral-100">
                <p className="font-semibold text-neutral-900">Hướng dẫn thanh toán:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Mở ứng dụng ngân hàng (MB, Techcombank, Vietcombank...) hoặc MoMo.</li>
                  <li>Chọn tính năng <strong>Quét mã QR (Scan QR)</strong>.</li>
                  <li>Kiểm tra tên người thụ hưởng: <strong>LUU QUANG DAT</strong>.</li>
                  <li>Kiểm tra số tiền và nội dung: <strong>PACEUP {orderId}</strong>.</li>
                  <li>Xác nhận thanh toán. Hệ thống sẽ tự động cập nhật sau 1-3 phút.</li>
                </ul>
              </div>
              
              <button 
                className="w-full rounded-[14px] bg-[#1c1c1c] py-4 text-white font-semibold shadow-lg hover:bg-neutral-800 transition-all mt-4"
                onClick={() => alert('Đang kiểm tra trạng thái thanh toán... (Tính năng đang phát triển)')}
              >
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
      <CTASection />
    </>
  )
}
