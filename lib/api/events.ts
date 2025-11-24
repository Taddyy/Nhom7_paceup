import apiClient from './client'

/**
 * Events API functions
 * 
 * Handles event operations.
 */

export interface Event {
  id: string
  title: string
  description: string
  full_description: string
  date: string
  time: string
  location: string
  address: string
  image_url?: string
  participants_count: number
  max_participants: number
  registration_deadline: string
  categories: string[]
  organizer_id: string
  organizer_name: string
  bank_name?: string
  account_number?: string
  account_holder_name?: string
  created_at: string
  updated_at: string
}

export interface CreateEventRequest {
  title: string
  description: string
  full_description: string
  date: string
  time: string
  location: string
  address: string
  image_url?: string
  max_participants: number
  registration_deadline: string
  categories: string[]
  // Bank account information
  bank_name?: string
  account_number?: string
  account_holder_name?: string
  // New fields for "Event Detail" parity
  badges?: string[]
  route_map_url?: string
  elevation?: string
  hydration_points?: number
  finish_location?: string
  highlights?: string[]
  schedule?: Array<{ time: string; activity: string }>
  race_kit_items?: string[]
  organizer_note?: string
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface RegisterEventRequest {
  event_id: string
  category: string
}

/**
 * Get all events
 */
export async function getEvents(page: number = 1, limit: number = 10, organizer_id?: string): Promise<{
  events: Event[]
  total: number
  page: number
  limit: number
}> {
  const params: any = { page, limit }
  if (organizer_id) {
    params.organizer_id = organizer_id
  }
  const response = await apiClient.get('/events', {
    params,
  })
  return response.data
}

/**
 * Get single event by ID
 */
export async function getEvent(id: string): Promise<Event> {
  const response = await apiClient.get(`/events/${id}`)
  return response.data
}

/**
 * Create new event
 */
export async function createEvent(data: CreateEventRequest): Promise<Event> {
  const response = await apiClient.post('/events', data)
  return response.data
}

/**
 * Update event
 */
export async function updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
  const response = await apiClient.put(`/events/${id}`, data)
  return response.data
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`)
}

/**
 * Register for event
 */
export async function registerForEvent(data: RegisterEventRequest): Promise<void> {
  await apiClient.post('/events/register', data)
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string): Promise<void> {
  await apiClient.delete(`/events/${eventId}/register`)
}
