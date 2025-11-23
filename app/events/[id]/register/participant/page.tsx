'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import CTASection from '@/components/home/CTASection'
import { getEvent } from '@/lib/api/events'
import { FALLBACK_EVENT_DETAILS_MAP, type FallbackEventDetail } from '@/lib/data/fallbackEvents'
import { getFallbackEventDetail } from '@/lib/data/fallbackEventDetails'
import StepIndicator, {
  STEP_ICON_PATHS,
  type StepConfig
} from '@/components/register/StepIndicator'

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

const STEP_TWO_INDICATOR: StepConfig[] = [
  { id: 'ticket', label: 'Chọn loại vé', icon: STEP_ICON_PATHS.ticket, status: 'upcoming' },
  { id: 'participant', label: 'Thông tin người tham gia', icon: STEP_ICON_PATHS.participant, status: 'current' },
  { id: 'payment', label: 'Thanh toán', icon: STEP_ICON_PATHS.payment, status: 'upcoming' }
]

type ParticipantFormState = {
  fullName: string
  email: string
  phone: string
  birthDate: string
  citizenId: string
  address: string
  shirtSize: string
  bibName: string
  studentCode: string
  bloodType: string
  emergencyContactName: string
  emergencyContactPhone: string
}

interface StoredParticipantInfo {
  fullName: string
  email: string
  phone: string
  bibName: string
}

const INITIAL_FORM_STATE: ParticipantFormState = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  citizenId: '',
  address: '',
  shirtSize: '',
  bibName: '',
  studentCode: '',
  bloodType: '',
  emergencyContactName: '',
  emergencyContactPhone: ''
}

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const REQUIRED_FIELDS: Array<keyof ParticipantFormState> = [
  'fullName',
  'email',
  'phone',
  'birthDate',
  'citizenId',
  'address',
  'shirtSize',
  'bibName',
  'bloodType',
  'emergencyContactName',
  'emergencyContactPhone'
]

export default function EventRegistrationStepTwoPage() {
  const params = useParams()
  const eventId = params.id as string
  const router = useRouter()
  const fallbackMeta: FallbackEventDetail | undefined = FALLBACK_EVENT_DETAILS_MAP[eventId]
  const fallbackDetail = useMemo(() => getFallbackEventDetail(eventId), [eventId])
  const [event, setEvent] = useState<RegistrationEventInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<ParticipantFormState>(INITIAL_FORM_STATE)
  const [ticketSelection, setTicketSelection] = useState<StoredTicketSelection | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [consents, setConsents] = useState({
    terms: false,
    health: false,
    updates: false
  })
  const [fieldErrors, setFieldErrors] =
    useState<Partial<Record<keyof ParticipantFormState, string>>>({})
  const [consentError, setConsentError] = useState<string | null>(null)

  useEffect(() => {
    let isSubscribed = true

    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const eventData = await getEvent(eventId)
        if (!isSubscribed) return
        setEvent({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          image: eventData.image_url ?? fallbackDetail.heroImage
        })
      } catch (error) {
        console.error('Unable to load event detail for participant form:', error)
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
    try {
      const storedValue = window.sessionStorage.getItem('paceup-registration-progress')
      if (!storedValue) return
      const parsed: StoredTicketSelection = JSON.parse(storedValue)
      if (parsed.eventId === eventId) {
        setTicketSelection(parsed)
      }
    } catch (error) {
      console.warn('Could not parse stored ticket selection', error)
    }
  }, [eventId])

  const coverImage = event?.image ?? fallbackDetail.heroImage

  const handleFieldChange = (field: keyof ParticipantFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }
      const next = { ...prev }
      delete next[field]
      return next
    })
    setFeedbackMessage(null)
  }

  const toggleConsent = (key: 'terms' | 'health' | 'updates') => {
    setConsents((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
    if ((key === 'terms' || key === 'health') && consentError) {
      setConsentError(null)
      setFeedbackMessage(null)
    }
  }

  const handleContinue = () => {
    const newErrors: Partial<Record<keyof ParticipantFormState, string>> = {}
    REQUIRED_FIELDS.forEach((field) => {
      if (!formState[field]?.trim()) {
        newErrors[field] = 'Thông tin bắt buộc'
      }
    })
    setFieldErrors(newErrors)

    const missingConsent = !consents.terms || !consents.health
    if (missingConsent) {
      setConsentError('Vui lòng đánh dấu các mục bắt buộc.')
    } else {
      setConsentError(null)
    }

    if (Object.keys(newErrors).length > 0 || missingConsent) {
      setFeedbackMessage('Vui lòng hoàn thành đầy đủ thông tin trước khi tiếp tục.')
      return
    }

    if (!event) {
      setFeedbackMessage('Không tìm thấy thông tin sự kiện. Vui lòng tải lại trang.')
      return
    }

    if (typeof window !== 'undefined') {
      const participantPayload: StoredParticipantInfo = {
        fullName: formState.fullName,
        email: formState.email,
        phone: formState.phone,
        bibName: formState.bibName
      }
      window.sessionStorage.setItem(
        'paceup-registration-participant',
        JSON.stringify(participantPayload)
      )
    }

    router.push(`/events/${event.id}/register/payment`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
          Đang tải biểu mẫu đăng ký...
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

  return (
    <>
      <div className="bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-20 pt-[150px] sm:pt-[170px]">
          <div className="flex w-full items-center justify-between">
            <Link
              href={`/events/${event.id}/register`}
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
              Quay lại chọn vé
            </Link>
            <span className="text-sm uppercase tracking-[0.3em] text-neutral-400">Step 2 / 3</span>
          </div>

          <div className="relative h-[260px] w-full overflow-hidden rounded-[32px] bg-neutral-100 sm:h-[360px] lg:h-[520px]">
            <Image src={coverImage} alt={event.title} fill priority className="object-cover" />
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
              <StepIndicator steps={STEP_TWO_INDICATOR} />
            </div>
          </div>

          <div className="space-y-6">
            {FORM_ROWS.map((row) => (
              <div key={row.map((field) => field.id).join('-')} className="grid gap-6 md:grid-cols-2">
                {row.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    value={formState[field.id]}
                    onChange={handleFieldChange}
                    error={fieldErrors[field.id]}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm">
            {CONSENT_ITEMS.map((consent) => (
              <label key={consent.id} className="flex items-start gap-4 text-sm text-neutral-700">
                <span
                  role="checkbox"
                  aria-checked={consents[consent.id]}
                  tabIndex={0}
                  onClick={() => toggleConsent(consent.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleConsent(consent.id)
                    }
                  }}
                  className={`mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-2 transition ${
                    consents[consent.id]
                      ? 'border-[#1f1f1f] bg-[#1f1f1f]'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {consents[consent.id] && (
                    <Image src="/Icon/check.svg" alt="Đã chọn" width={18} height={18} />
                  )}
                </span>
                <span>
                  {consent.label}{' '}
                  {consent.required && <span className="text-neutral-400">(bắt buộc)</span>}
                </span>
              </label>
            ))}
            {consentError && <p className="text-sm text-red-500">{consentError}</p>}
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white/80 p-6 shadow-lg backdrop-blur-lg">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Tổng tiền
                </p>
                <p className="text-3xl font-bold text-neutral-900">
                  {ticketSelection
                    ? ticketSelection.ticketPrice.toLocaleString('vi-VN') + ' VND'
                    : 'Vui lòng quay lại chọn vé'}
                </p>
                {ticketSelection && (
                  <p className="text-sm text-neutral-500">
                    Gói: {ticketSelection.ticketLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.35),inset_4px_4px_8px_rgba(255,255,255,0.2)] transition hover:opacity-90"
              >
                Tiếp tục
              </button>
            </div>
            {feedbackMessage && <p className="mt-4 text-sm text-neutral-500">{feedbackMessage}</p>}
          </div>
        </div>
      </div>
      <CTASection />
    </>
  )
}

const FORM_ROWS: Array<
  Array<{
    id: keyof ParticipantFormState
    label: string
    required?: boolean
    type?: 'text' | 'email' | 'date' | 'tel' | 'select'
  }>
> = [
  [
    { id: 'fullName', label: 'Họ và tên', required: true },
    { id: 'email', label: 'Email', required: true, type: 'email' }
  ],
  [
    { id: 'phone', label: 'Số điện thoại', required: true, type: 'tel' },
    { id: 'birthDate', label: 'Ngày sinh', required: true, type: 'date' }
  ],
  [
    { id: 'citizenId', label: 'Căn cước công dân', required: true },
    { id: 'address', label: 'Địa chỉ', required: true }
  ],
  [
    { id: 'shirtSize', label: 'Kích cỡ áo', required: true, type: 'select' },
    { id: 'bibName', label: 'Tên trên BIB', required: true }
  ],
  [
    { id: 'studentCode', label: 'Mã sinh viên (nếu có)' },
    { id: 'bloodType', label: 'Nhóm máu', required: true, type: 'select' }
  ],
  [
    { id: 'emergencyContactName', label: 'Tên người liên lạc khẩn cấp', required: true },
    { id: 'emergencyContactPhone', label: 'Số điện thoại khẩn cấp', required: true, type: 'tel' }
  ]
]

const CONSENT_ITEMS: Array<{
  id: 'terms' | 'health' | 'updates'
  label: string
  required?: boolean
}> = [
  {
    id: 'terms',
    label: 'Tôi đồng ý với Điều khoản tham gia và Chính sách hoàn tiền.',
    required: true
  },
  {
    id: 'health',
    label: 'Tôi đã đọc Quy định sức khỏe và cam kết đủ điều kiện tham gia.',
    required: true
  },
  {
    id: 'updates',
    label: 'Nhận thông báo về lịch tập luyện và cập nhật sự kiện.'
  }
]

function FormField({
  field,
  value,
  onChange,
  error
}: {
  field: { id: keyof ParticipantFormState; label: string; required?: boolean; type?: string }
  value: string
  onChange: (id: keyof ParticipantFormState, value: string) => void
  error?: string
}) {
  const inputId = `participant-${field.id}`
  const baseClasses =
    'w-full rounded-[12px] border px-4 py-3 text-base text-neutral-900 focus:outline-none transition'
  const stateClasses = error ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'
  const commonProps = {
    id: inputId,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(field.id, event.target.value),
    className: `${baseClasses} ${stateClasses}`,
    required: field.required,
    'aria-invalid': Boolean(error)
  }

  const label = (
    <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-neutral-600">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  )

  if (field.type === 'select' && field.id === 'shirtSize') {
    return (
      <div>
        {label}
        <select {...commonProps}>
          <option value="">Chọn kích cỡ áo</option>
          {SHIRT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  if (field.type === 'select' && field.id === 'bloodType') {
    return (
      <div>
        {label}
        <select {...commonProps}>
          <option value="">Chọn nhóm máu</option>
          {BLOOD_TYPES.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      {label}
      <input type={field.type ?? 'text'} placeholder={field.label} {...commonProps} />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}


