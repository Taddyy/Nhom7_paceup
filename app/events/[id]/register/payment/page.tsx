'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CTASection from '@/components/home/CTASection'
import { getEvent } from '@/lib/api/events'
import { createPaymentSession, getPaymentSession, type PaymentSession } from '@/lib/api/payment'
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
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'running' | 'completed'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      // derive an order id based on ticket + time for display only
      setOrderId(`ORDER-${parsedSelection.ticketId}-${Date.now().toString().slice(-6)}`)
    } catch (error) {
      console.warn('Unable to parse stored selection/participant info', error)
      router.replace(`/events/${eventId}/register`)
    }
  }, [eventId, router])

  // Create sandbox payment session when we have ticket + participant
  useEffect(() => {
    let isSubscribed = true

    const ensureSession = async () => {
      if (!ticket || !participant || paymentSession) return
      try {
        setSessionError(null)
        const session = await createPaymentSession({
          event_id: eventId,
          category: ticket.ticketId,
          amount: ticket.ticketPrice
        })
        if (!isSubscribed) return
        setPaymentSession(session)
        setPollingStatus('running')
      } catch (error: any) {
        console.error('Unable to create payment session:', error)
        const errorMsg = error?.response?.data?.detail || error?.message || 'Không thể tạo phiên thanh toán. Vui lòng thử lại.'
        setSessionError(errorMsg)
      }
    }

    void ensureSession()

    return () => {
      isSubscribed = false
    }
  }, [eventId, ticket, participant, paymentSession])

  // Sandbox QR link generation (cross-device sync)
  const confirmUrl = useMemo(() => {
    if (!paymentSession) return null

    // The URL that mobile will open after scanning QR
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://paceup-sandbox.local'

    return `${baseUrl}/payment/confirm?session_id=${encodeURIComponent(paymentSession.id)}`
  }, [paymentSession])

  // Poll payment status
  useEffect(() => {
    if (!paymentSession || pollingStatus !== 'running') {
      // Clear any existing interval if conditions not met
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    let isSubscribed = true
    let pollCount = 0
    const MAX_POLLS = 60 // Stop after 3 minutes (60 * 3s)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++
      if (pollCount > MAX_POLLS) {
        clearInterval(pollingIntervalRef.current!)
        pollingIntervalRef.current = null
        setPollingStatus('completed')
        setErrorMessage('Phiên thanh toán đã hết thời gian chờ. Vui lòng thử lại.')
        return
      }

      try {
        const latest = await getPaymentSession(paymentSession.id)
        if (!isSubscribed) return

        setPaymentSession(latest)

        if (latest.status === 'success') {
          setPollingStatus('completed')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          // Small delay before redirect to show success state
          setTimeout(() => {
            router.push(`/events/${eventId}?registered=true`)
          }, 1000)
        } else if (latest.status === 'expired' || latest.status === 'cancelled') {
          setPollingStatus('completed')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setErrorMessage(
            latest.status === 'expired'
              ? 'Phiên thanh toán đã hết hạn. Vui lòng tải lại trang để tạo phiên mới.'
              : 'Thanh toán đã bị hủy. Vui lòng thử lại.'
          )
        }
      } catch (error) {
        console.warn('Unable to poll payment session:', error)
        // Don't stop polling on network errors, just log
      }
    }, 3000)

    return () => {
      isSubscribed = false
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [paymentSession, pollingStatus, router, eventId])

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
              <h2 className="mt-3 text-2xl font-semibold text-neutral-900">Thanh toán sandbox (Đồ án môn học)</h2>
              
              {sessionError && (
                <div className="mt-4 w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                  <p className="text-sm font-semibold text-red-800">Lỗi tạo phiên thanh toán</p>
                  <p className="mt-1 text-sm text-red-600">{sessionError}</p>
                  <button
                    onClick={() => {
                      setPaymentSession(null)
                      setSessionError(null)
                      setPollingStatus('idle')
                    }}
                    className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {!paymentSession && !sessionError && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8">
                    <div className="h-[200px] w-[200px] animate-pulse bg-neutral-200 rounded"></div>
                  </div>
                </div>
              )}

              {paymentSession && confirmUrl && (
                <>
                  <div className="mt-6 inline-flex rounded-[32px] border border-neutral-100 bg-neutral-50 p-6">
                    <QRCodeSVG
                      value={confirmUrl}
                      size={300}
                      level="H"
                      includeMargin={true}
                      className="h-[300px] w-[300px] md:h-[360px] md:w-[360px]"
                    />
                  </div>
                  <p className="mt-6 text-sm text-neutral-500 max-w-md">
                    Dùng điện thoại quét mã QR này để mở trang xác nhận thanh toán giả lập trên điện thoại.
                  </p>
                  {pollingStatus === 'running' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang chờ xác nhận từ điện thoại...
                    </div>
                  )}
                </>
              )}
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
                    Mã đơn sandbox: {orderId}
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
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                  <p className="text-sm font-semibold text-red-800">Thông báo</p>
                  <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {paymentSession && paymentSession.status === 'success' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-left">
                  <p className="text-sm font-semibold text-green-800">Thanh toán thành công!</p>
                  <p className="mt-1 text-sm text-green-600">Đang chuyển hướng...</p>
                </div>
              )}

              <div className="space-y-3 text-left text-sm text-neutral-600 pt-4 border-t border-neutral-100">
                <p className="font-semibold text-neutral-900">Hướng dẫn thanh toán sandbox:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Dùng điện thoại quét mã QR này (camera, Zalo, hoặc app bất kỳ).</li>
                  <li>Trình duyệt trên điện thoại sẽ mở trang xác nhận thanh toán giả lập.</li>
                  <li>Bấm nút <strong>&quot;Xác nhận thanh toán giả lập&quot;</strong> trên điện thoại.</li>
                  <li>Sau vài giây, màn hình máy tính sẽ tự chuyển sang trạng thái đã thanh toán.</li>
                </ul>
                <p className="mt-3 text-xs text-neutral-500 italic">
                  Lưu ý: Đây là mô phỏng cho đồ án môn học. Không có giao dịch tài chính thật được thực hiện.
                </p>
              </div>
              
              <button 
                className="w-full rounded-[14px] bg-[#1c1c1c] py-4 text-white font-semibold shadow-lg hover:bg-neutral-800 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!paymentSession || isCheckingStatus || pollingStatus === 'completed'}
                onClick={async () => {
                  if (!paymentSession) return
                  try {
                    setIsCheckingStatus(true)
                    setErrorMessage(null)
                    const latest = await getPaymentSession(paymentSession.id)
                    setPaymentSession(latest)
                    if (latest.status === 'success') {
                      setPollingStatus('completed')
                      router.push(`/events/${eventId}?registered=true`)
                    } else if (latest.status === 'expired') {
                      setErrorMessage('Phiên thanh toán đã hết hạn. Vui lòng tải lại trang.')
                    } else if (latest.status === 'cancelled') {
                      setErrorMessage('Thanh toán đã bị hủy. Vui lòng thử lại.')
                    } else {
                      setErrorMessage(`Trạng thái hiện tại: ${latest.status}. Hãy xác nhận trên điện thoại.`)
                    }
                  } catch (error: any) {
                    console.error('Error checking payment status:', error)
                    setErrorMessage('Không thể kiểm tra trạng thái. Vui lòng thử lại.')
                  } finally {
                    setIsCheckingStatus(false)
                  }
                }}
              >
                {isCheckingStatus 
                  ? 'Đang kiểm tra trạng thái...' 
                  : paymentSession?.status === 'success'
                  ? 'Đã thanh toán thành công'
                  : 'Tôi đã xác nhận trên điện thoại'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <CTASection />
    </>
  )
}
