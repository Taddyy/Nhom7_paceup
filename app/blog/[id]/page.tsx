'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Blog post detail page component
 * 
 * Displays a single blog post with full content. In the future, this will fetch data from backend API.
 */
interface BlogPost {
  id: string
  title: string
  content: string
  author: string
  date: string
  image?: string
  category: string
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true)
        const { getBlogPost } = await import('@/lib/api/blog')
        const postData = await getBlogPost(params.id as string)
        setPost({
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: postData.author_name,
          date: postData.created_at,
          category: postData.category,
          image: postData.image_url,
        })
      } catch (err) {
        console.error('Error fetching post:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPost()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Đang tải...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
          <Link href="/blog" className="text-primary hover:underline">
            Quay lại danh sách blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-12 pt-[150px] sm:pt-[170px]">
      {/* Back Button */}
      <Link
        href="/blog"
        className="inline-flex items-center text-primary hover:text-primary-dark mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại blog
      </Link>

      {/* Post Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-primary font-semibold">{post.category}</span>
          <span className="text-sm text-gray-500">
            {new Date(post.date).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-600">
          <span>Bởi {post.author}</span>
        </div>
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="relative w-full h-96 mb-8">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      {/* Post Content */}
      <div className="prose prose-lg max-w-none">
        {post.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">{paragraph}</p>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-12 pt-8 border-t flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-600 hover:text-primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Thích
          </button>
          <button className="flex items-center text-gray-600 hover:text-primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Bình luận
          </button>
        </div>
        <button className="text-gray-600 hover:text-primary">
          Chia sẻ
        </button>
      </div>
    </div>
  )
}

