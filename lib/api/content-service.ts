import apiClient from './client'

/**
 * Content API functions
 * 
 * Handles content post operations.
 * Content posts are automatically approved and displayed immediately.
 */

export interface ContentPost {
  id: string
  title: string
  content: string
  excerpt?: string
  author_id: string
  author_name: string
  author_avatar?: string
  category: string
  created_at: string
  updated_at: string
  image_url?: string
  likes_count: number
  comments_count: number
  status?: 'pending' | 'approved' | 'rejected'
}

export interface CreateContentPostRequest {
  title: string
  content: string
  category: string
  image_url?: string
}

export interface UpdateContentPostRequest extends Partial<CreateContentPostRequest> {}

/**
 * Get all content posts
 */
export async function getContentPosts(
  page: number = 1,
  limit: number = 10,
  author_id?: string
): Promise<{
  posts: ContentPost[]
  total: number
  page: number
  limit: number
}> {
  const params: Record<string, string | number> = { page, limit }
  if (author_id) {
    params.author_id = author_id
  }
  const response = await apiClient.get('/content/posts', {
    params,
  })
  return response.data
}

/**
 * Get single content post by ID
 */
export async function getContentPost(id: string): Promise<ContentPost> {
  const response = await apiClient.get(`/content/posts/${id}`)
  return response.data
}

/**
 * Create new content post (automatically approved)
 */
export async function createContentPost(data: CreateContentPostRequest): Promise<ContentPost> {
  const response = await apiClient.post('/content/posts', data)
  return response.data
}

/**
 * Update content post
 */
export async function updateContentPost(id: string, data: UpdateContentPostRequest): Promise<ContentPost> {
  const response = await apiClient.put(`/content/posts/${id}`, data)
  return response.data
}

/**
 * Delete content post
 */
export async function deleteContentPost(id: string): Promise<void> {
  await apiClient.delete(`/content/posts/${id}`)
}

