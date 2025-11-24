import apiClient from './client'
import type { BlogPost } from './blog-service'
import type { Event } from './events'
import type { Report } from './reports'

export interface AdminStats {
  total_users: number
  pending_posts: number
  pending_events: number
  total_posts: number
  total_events: number
  pending_reports: number
  pending_registrations: number
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  user_name?: string
  event_title?: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reasons?: string[]
  rejection_description?: string
  created_at: string
  updated_at?: string
}

export interface RejectRegistrationRequest {
  reasons: string[]
  description?: string
}

export interface RejectEventRequest {
  reasons: string[]
  description?: string
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await apiClient.get<AdminStats>('/admin/stats')
  return response.data
}

export async function getAdminPosts(status: string = 'pending', page = 1, limit = 10) {
  const response = await apiClient.get<BlogPost[]>('/admin/posts', {
    params: { status, page, limit }
  })
  return response.data
}

export async function updatePostStatus(postId: string, status: 'approved' | 'rejected') {
  const response = await apiClient.put(`/admin/posts/${postId}/status`, null, {
    params: { status_update: status }
  })
  return response.data
}

export async function getAdminEvents(status: string = 'pending', page = 1, limit = 10) {
  const response = await apiClient.get<Event[]>('/admin/events', {
    params: { status, page, limit }
  })
  return response.data
}

export async function updateEventStatus(eventId: string, status: 'approved' | 'rejected') {
  const response = await apiClient.put(`/admin/events/${eventId}/status`, null, {
    params: { status_update: status }
  })
  return response.data
}

export async function rejectEvent(eventId: string, data: RejectEventRequest) {
  const response = await apiClient.put(`/admin/events/${eventId}/reject`, data)
  return response.data
}

export async function getAdminReports(status: string = 'pending', page = 1, limit = 10) {
  const response = await apiClient.get<Report[]>('/admin/reports', {
    params: { status, page, limit }
  })
  return response.data
}

export async function resolveReport(reportId: string) {
  const response = await apiClient.put(`/admin/reports/${reportId}/resolve`)
  return response.data
}

export async function dismissReport(reportId: string) {
  const response = await apiClient.put(`/admin/reports/${reportId}/dismiss`)
  return response.data
}

export async function getAdminRegistrations(status: string = 'pending', page = 1, limit = 10) {
  const response = await apiClient.get<EventRegistration[]>('/admin/registrations', {
    params: { status, page, limit }
  })
  return response.data
}

export async function approveRegistration(registrationId: string) {
  const response = await apiClient.put(`/admin/registrations/${registrationId}/approve`)
  return response.data
}

export async function rejectRegistration(registrationId: string, data: RejectRegistrationRequest) {
  const response = await apiClient.put(`/admin/registrations/${registrationId}/reject`, data)
  return response.data
}

