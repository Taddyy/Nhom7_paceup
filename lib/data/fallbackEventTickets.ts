export interface TicketOption {
  id: string
  label: string
  price: number
  description?: string
}

const DEFAULT_PRICE_SEQUENCE = [199_000, 399_000, 259_000, 459_000]

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Generate ticket options for an event based on its categories.
 * Creates one ticket option per category with default pricing.
 */
export function getTicketOptions(eventId: string, categories: string[] = []): TicketOption[] {
  if (categories.length > 0) {
    return categories.map((category, index) => ({
      id: `${eventId}-${slugify(category) || index}`,
      label: category,
      price: DEFAULT_PRICE_SEQUENCE[index % DEFAULT_PRICE_SEQUENCE.length]
    }))
  }

  // If no categories, return empty array (event should have categories)
  return []
}


