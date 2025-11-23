import apiClient from './client'
import type { BlogPost } from './blog'
import type { Event } from './events'

export interface AdminStats {
  total_users: number
  pending_posts: number
  pending_events: number
  total_posts: number
  total_events: number
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

