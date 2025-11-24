import apiClient from './client'

export interface Report {
  id: string
  post_id: string
  reporter_id: string
  reporter_name?: string
  reasons: string[]
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  updated_at?: string
}

export interface CreateReportRequest {
  post_id: string
  reasons: string[]
  description?: string
}

export const createReport = async (data: CreateReportRequest): Promise<Report> => {
  const response = await apiClient.post<Report>('/reports', data)
  return response.data
}

export const getReports = async (status?: string): Promise<Report[]> => {
  const params = status ? `?status=${status}` : ''
  const response = await apiClient.get<Report[]>(`/admin/reports${params}`)
  return response.data
}

export const resolveReport = async (reportId: string): Promise<void> => {
  await apiClient.put(`/admin/reports/${reportId}/resolve`)
}

export const dismissReport = async (reportId: string): Promise<void> => {
  await apiClient.put(`/admin/reports/${reportId}/dismiss`)
}

