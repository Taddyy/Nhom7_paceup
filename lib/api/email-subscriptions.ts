import apiClient from './client'

export interface EmailSubscription {
  id: string
  email: string
  source?: string | null
  created_at: string
}

export interface EmailSubscriptionListResponse {
  items: EmailSubscription[]
  total: number
}

export async function createEmailSubscription(email: string, source?: string): Promise<EmailSubscription> {
  const response = await apiClient.post('/email/subscriptions', { email, source })
  return response.data
}

export async function getEmailSubscriptions(skip = 0, limit = 50): Promise<EmailSubscriptionListResponse> {
  const response = await apiClient.get('/email/admin/subscriptions', {
    params: { skip, limit },
  })
  return response.data
}

export async function deleteEmailSubscription(id: string): Promise<void> {
  await apiClient.delete(`/email/admin/subscriptions/${id}`)
}


