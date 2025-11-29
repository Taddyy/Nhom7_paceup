import apiClient from './client'

export interface PaymentSession {
  id: string
  event_id: string
  category: string
  amount: number
  status: string
  created_at: string
  expires_at?: string | null
}

export interface CreatePaymentSessionRequest {
  event_id: string
  category: string
  amount: number
}

export async function createPaymentSession(
  data: CreatePaymentSessionRequest
): Promise<PaymentSession> {
  const response = await apiClient.post('/payment/session', data)
  return response.data
}

export async function getPaymentSession(sessionId: string): Promise<PaymentSession> {
  const response = await apiClient.get(`/payment/session/${sessionId}`)
  return response.data
}

export async function confirmPaymentSession(
  sessionId: string,
  action: 'confirm' | 'cancel' = 'confirm'
): Promise<{ status: string }> {
  const response = await apiClient.post('/payment/confirm', {
    session_id: sessionId,
    action,
  })
  return response.data
}


