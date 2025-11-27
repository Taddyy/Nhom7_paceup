'use client'

import { useEffect, useState } from 'react'
import CTASection from '@/components/home/CTASection'
import ContentHighlightsSection, {
  type ArticleHighlight,
  type ContentHighlight
} from '@/components/home/ContentHighlightsSection'
import { getContentPosts, type ContentPost } from '@/lib/api/content-service'

const mapContentPostToArticle = (post: ContentPost): ArticleHighlight => {
  // Extract plain text from HTML content for caption
  const plainText = (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const caption = plainText.length > 200 ? `${plainText.slice(0, 200)}…` : plainText || ''
  
  // Extract media URLs from HTML content (img and video tags)
  const media: string[] = []
  
  // Extract img src URLs (for GIFs and images)
  const imgMatches = (post.content || '').match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  if (imgMatches) {
    imgMatches.forEach((imgTag) => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        media.push(srcMatch[1])
      }
    })
  }
  
  // Extract video src URLs
  const videoMatches = (post.content || '').match(/<video[^>]+src=["']([^"']+)["'][^>]*>/gi)
  if (videoMatches) {
    videoMatches.forEach((videoTag) => {
      const srcMatch = videoTag.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        media.push(srcMatch[1])
      }
    })
  }
  
  // Fallback to image_url if no media found in content
  if (media.length === 0 && post.image_url) {
    media.push(post.image_url)
  }
  
  // Format timestamp
  const createdAt = new Date(post.created_at)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  let timestamp = 'Vừa xong'
  if (diffMins > 0 && diffMins < 60) {
    timestamp = `${diffMins} phút trước`
  } else if (diffHours > 0 && diffHours < 24) {
    timestamp = `${diffHours} giờ trước`
  } else if (diffDays > 0 && diffDays < 7) {
    timestamp = `${diffDays} ngày trước`
  } else {
    timestamp = createdAt.toLocaleDateString('vi-VN')
  }
  
  // Extract handle from email or use default
  const handle = post.author_name ? `@${post.author_name.toLowerCase().replace(/\s+/g, '')}` : '@user'
  
  return {
    id: post.id,
    author: post.author_name || 'PaceUp Studio',
    handle,
    avatar: post.author_avatar || '/Image/Run 1.png',
    timestamp,
    title: post.title,
    caption,
    media,
    comments: [],
    likes: post.likes_count || 0,
    author_id: post.author_id, // For checking ownership
    content_post_id: post.id // For edit/delete operations
  }
}

const mapContentPostToHighlight = (post: ContentPost): ContentHighlight => {
  const plain = (post.excerpt || post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const summary = plain.length > 200 ? `${plain.slice(0, 200)}…` : plain || 'Bài viết đang chờ cập nhật nội dung.'

  return {
    id: post.id,
    title: post.title,
    author: post.author_name || 'PaceUp Studio',
    date: new Date(post.created_at).toLocaleDateString('vi-VN'),
    summary,
    image: post.image_url || '/Image/Event.png'
  }
}

export default function ContentPage() {
  const [posts, setPosts] = useState<ContentHighlight[]>([])
  const [articles, setArticles] = useState<ArticleHighlight[]>([])
  const [isFetchingPosts, setIsFetchingPosts] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleArticleAdded = (newArticle: ArticleHighlight) => {
    setArticles(prev => [newArticle, ...prev])
  }

  const handleContentPostCreated = () => {
    // Trigger refresh of content posts
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    const fetchContentPosts = async () => {
      try {
        setIsFetchingPosts(true)
        const response = await getContentPosts(1, 100) // Fetch more for articles
        // Luôn set data từ API, kể cả khi empty array
        setPosts(response.posts.map(mapContentPostToHighlight))
        setArticles(response.posts.map(mapContentPostToArticle))
      } catch (error) {
        console.error('Failed to load content posts:', error)
        // Không fallback về hardcoded data, để empty arrays
        setPosts([])
        setArticles([])
      } finally {
        setIsFetchingPosts(false)
      }
    }

    fetchContentPosts()
  }, [refreshKey])

  return (
    <div className="flex flex-col bg-white">
      <div className="pt-[140px] pb-16">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <header className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-neutral-400">Nội dung</p>
            <h1 className="mt-3 text-4xl font-semibold text-neutral-900">Nội dung mới nhất</h1>
            <p className="mt-3 text-base text-neutral-500">
              Cập nhật hoạt động, highlight từ cộng đồng PaceUp mọi lúc mọi nơi.
            </p>
          </header>

          <ContentHighlightsSection 
            posts={posts} 
            articles={articles} 
            showCreateButton={true}
            onArticleAdded={handleArticleAdded}
            onContentPostCreated={handleContentPostCreated}
            isLoadingBlogs={isFetchingPosts}
          />
        </div>
      </div>

      <CTASection />
    </div>
  )
}

