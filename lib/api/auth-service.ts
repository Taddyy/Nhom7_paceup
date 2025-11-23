import apiClient from './client'
import { Event } from './events'

/**
 * Authentication API functions
 * 
 * Handles user authentication operations.
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone: string
  date_of_birth: string
  gender: string
  address?: string
  running_experience: string
  goals?: string
}

export interface UserUpdate {
  full_name?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  running_experience?: string
  goals?: string
  avatar?: string
}

export interface UserStats {
  total_distance_km: number
  events_joined: number
}

export interface User {
  id: string
  email: string
  full_name: string
  role?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  running_experience?: string
  goals?: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data)
  if (typeof window !== 'undefined' && response.data.access_token) {
    localStorage.setItem('token', response.data.access_token)
  }
  return response.data
}

/**
 * Register new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data)
  if (typeof window !== 'undefined' && response.data.access_token) {
    localStorage.setItem('token', response.data.access_token)
  }
  return response.data
}

/**
 * Logout user
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}

/**
 * Update current user profile
 */
export async function updateProfile(data: UserUpdate): Promise<User> {
  const response = await apiClient.put<User>('/auth/me', data)
  return response.data
}

/**
 * Get authenticated user's stats
 */
export async function getUserStats(): Promise<UserStats> {
  const response = await apiClient.get<UserStats>('/auth/stats')
  return response.data
}

/**
 * Get events joined by current user
 */
export async function getJoinedEvents(): Promise<Event[]> {
  const response = await apiClient.get<Event[]>('/auth/joined-events')
  return response.data
}
