import axios from 'axios'

/**
 * API client configuration
 * 
 * Centralized axios instance for API calls.
 * Base URL will be configured from environment variables.
 */

// Determine the base URL
const getBaseUrl = () => {
  // If we are on the client side
  if (typeof window !== 'undefined') {
    return '/api/v1' // Use relative path which works with Vercel rewrites
  }
  
  // If we are on the server side (SSR)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  }
  
  // Default fallback for local development
  return 'http://localhost:8000/api/v1'
}

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Add this line for CORS cookies/credentials handling if needed
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
