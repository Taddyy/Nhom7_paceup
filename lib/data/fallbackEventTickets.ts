import { FALLBACK_EVENT_DETAILS_MAP } from './fallback-events'

export interface TicketOption {
  id: string
  label: string
  price: number
  description?: string
}

const DEFAULT_PRICE_SEQUENCE = [199_000, 399_000, 259_000, 459_000]

const DEFAULT_TICKET_OPTIONS: TicketOption[] = [
  { id: 'student-3k', label: '3km - Sinh viên', price: 199_000 },
  { id: 'alumni-3k', label: '3km - Cựu sinh viên / CBVC', price: 399_000 },
  { id: 'student-6k', label: '6km - Sinh viên', price: 199_000 },
  { id: 'alumni-6k', label: '6km - Cựu sinh viên / CBVC', price: 399_000 }
]

const FALLBACK_TICKET_OPTIONS: Record<string, TicketOption[]> = {
  'fallback-1': [
    { id: 'fallback-1-3k-student', label: '3km - Sinh viên', price: 199_000 },
    { id: 'fallback-1-3k-alumni', label: '3km - Cựu SV - CBVC', price: 399_000 },
    { id: 'fallback-1-6k-student', label: '6km - Sinh viên', price: 199_000 },
    { id: 'fallback-1-6k-alumni', label: '6km - Cựu SV - CBVC', price: 399_000 }
  ],
  'fallback-2': [
    { id: 'fallback-2-5k-open', label: '5km - Open', price: 249_000 },
    { id: 'fallback-2-10k-open', label: '10km - Open', price: 349_000 },
    { id: 'fallback-2-21k-open', label: '21km - Open', price: 499_000 }
  ]
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function getTicketOptions(eventId: string, categories: string[] = []): TicketOption[] {
  if (FALLBACK_TICKET_OPTIONS[eventId]) {
    return FALLBACK_TICKET_OPTIONS[eventId]
  }

  if (categories.length > 0) {
    return categories.map((category, index) => ({
      id: `${eventId}-${slugify(category) || index}`,
      label: category,
      price: DEFAULT_PRICE_SEQUENCE[index % DEFAULT_PRICE_SEQUENCE.length]
    }))
  }

  if (FALLBACK_EVENT_DETAILS_MAP[eventId]) {
    return DEFAULT_TICKET_OPTIONS.map((option) => ({
      ...option,
      id: `${eventId}-${option.id}`
    }))
  }

  return DEFAULT_TICKET_OPTIONS
}


