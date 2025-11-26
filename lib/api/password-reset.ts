import apiClient from './client'

export interface PasswordResetToken {
  id: string
  email: string
  expires_at: string
  used: boolean
}

export interface VerifyResetResponse {
  id: string
  email: string
  expires_at: string
  used: boolean
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/password/forgot', { email })
}

export async function verifyResetCode(email: string, code: string): Promise<VerifyResetResponse> {
  const response = await apiClient.post<VerifyResetResponse>('/password/verify', {
    email,
    code,
  })
  return response.data
}

export async function performPasswordReset(resetSessionId: string, newPassword: string): Promise<void> {
  await apiClient.post('/password/reset', {
    reset_session_id: resetSessionId,
    new_password: newPassword,
  })
}
