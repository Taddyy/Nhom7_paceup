import apiClient from './client'

/**
 * Blog API functions
 * 
 * Handles blog post operations.
 */

export interface BlogPost {
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

export interface CreateBlogPostRequest {
  title: string
  content: string
  category: string
  image_url?: string
}

export interface UpdateBlogPostRequest extends Partial<CreateBlogPostRequest> {}

/**
 * Get all blog posts
 */
export type BlogStatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

export async function getBlogPosts(
  page: number = 1,
  limit: number = 10,
  author_id?: string,
  status_filter: BlogStatusFilter = 'approved'
): Promise<{
  posts: BlogPost[]
  total: number
  page: number
  limit: number
}> {
  const params: Record<string, string | number> = { page, limit, status_filter }
  if (author_id) {
    params.author_id = author_id
  }
  const response = await apiClient.get('/blog/posts', {
    params,
  })
  return response.data
}

/**
 * Get single blog post by ID
 */
export async function getBlogPost(id: string): Promise<BlogPost> {
  const response = await apiClient.get(`/blog/posts/${id}`)
  return response.data
}

/**
 * Create new blog post
 */
export async function createBlogPost(data: CreateBlogPostRequest): Promise<BlogPost> {
  const response = await apiClient.post('/blog/posts', data)
  return response.data
}

/**
 * Update blog post
 */
export async function updateBlogPost(id: string, data: UpdateBlogPostRequest): Promise<BlogPost> {
  const response = await apiClient.put(`/blog/posts/${id}`, data)
  return response.data
}

/**
 * Delete blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
  await apiClient.delete(`/blog/posts/${id}`)
}

/**
 * Like blog post
 */
export async function likeBlogPost(id: string): Promise<void> {
  await apiClient.post(`/blog/posts/${id}/like`)
}

