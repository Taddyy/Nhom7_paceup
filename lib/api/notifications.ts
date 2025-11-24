import apiClient from './client'
import type { Notification } from '@/components/ui/NotificationBell'

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[]>('/notifications')
  return response.data
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.put(`/notifications/${notificationId}/read`)
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  const response = await apiClient.get<{ unread_count: number }>('/notifications/unread-count')
  return response.data
}

