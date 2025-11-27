'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBlogPost } from '@/lib/api/blog-service'
import { createContentPost, updateContentPost, deleteContentPost } from '@/lib/api/content-service'
import { getCurrentUser, type User } from '@/lib/api/auth-service'
import RichTextEditor from '@/components/ui/RichTextEditor'
import DropdownMenu, { type DropdownOption } from '@/components/ui/DropdownMenu'
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect'
import NotificationDialog from '@/components/ui/NotificationDialog'

export interface ContentHighlight {
  id: string
  title: string
  author: string
  date: string
  summary: string
  image: string
}

export interface CommentAttachment {
  id: string
  type: 'image' | 'video' | 'gif'
  url: string
}

export interface ArticleComment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  attachment?: string
  media?: CommentAttachment[]
}

export interface ArticleHighlight {
  id: string
  author: string
  handle: string
  avatar: string
  timestamp: string
  title: string
  caption: string
  media: string[]
  comments: ArticleComment[]
  likes: number
  author_id?: string // For checking if current user is the owner
  content_post_id?: string // ID of the content post in backend (for edit/delete)
}

interface GifResult {
  id: string
  url: string
  previewUrl: string
}

interface ContentHighlightsSectionProps {
  posts: ContentHighlight[]
  articles: ArticleHighlight[]
  showCreateButton?: boolean
  onArticleAdded?: (article: ArticleHighlight) => void
  onArticleDeleted?: (articleId: string) => void
  onContentPostCreated?: () => void
  isLoadingBlogs?: boolean
  hideTabNavigation?: boolean // If true, hide tab navigation and only show articles
}

type ContentTab = 'articles' | 'blog'

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? 'dc6zaTOxFJmzC'
const HAS_CUSTOM_GIPHY_KEY = GIPHY_API_KEY !== 'dc6zaTOxFJmzC'
const GIPHY_TRENDING_URL = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`
const GIPHY_SEARCH_URL_BASE = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&limit=12&rating=g&q=`

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY ?? 'LIVDSRZULELA'
const TENOR_TRENDING_URL = `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=12&media_filter=minimal`
const TENOR_SEARCH_URL_BASE = `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&limit=12&media_filter=minimal&q=`

const BLOG_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Chung', value: 'general' },
  { label: 'Tập luyện', value: 'training' },
  { label: 'Dinh dưỡng', value: 'nutrition' },
  { label: 'Trang thiết bị', value: 'gear' },
  { label: 'Sự kiện', value: 'events' }
]

const fetchGiphyGifs = async (url: string): Promise<GifResult[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('GIPHY request failed')
  }
  const payload = (await response.json()) as {
    data: Array<{
      id: string
      images: {
        downsized: { url: string }
        fixed_height_small: { url: string }
      }
    }>
  }
  return payload.data
    .map((item) => ({
      id: item.id,
      url: item.images.downsized.url,
      previewUrl: item.images.fixed_height_small.url
    }))
    .filter((gif) => Boolean(gif.url && gif.previewUrl))
}

const extractTenorUrls = (mediaEntry: Record<string, { url?: string }> | undefined): { url?: string; preview?: string } => {
  if (!mediaEntry) {
    return {}
  }
  const gifUrl = mediaEntry.gif?.url ?? mediaEntry.mediumgif?.url ?? mediaEntry.tinygif?.url ?? mediaEntry.nanogif?.url
  const previewUrl = mediaEntry.nanogif?.url ?? mediaEntry.tinygif?.url ?? mediaEntry.gif?.url ?? mediaEntry.mediumgif?.url
  return { url: gifUrl, preview: previewUrl }
}

const fetchTenorGifs = async (url: string): Promise<GifResult[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Tenor request failed')
  }
  const payload = (await response.json()) as {
    results: Array<{
      id: string
      media?: Array<Record<string, { url?: string }>>
      media_formats?: Record<string, { url?: string }>
    }>
  }
  return payload.results
    .map((result) => {
      const mediaFormats = result.media_formats
      if (mediaFormats) {
        const gifUrl =
          mediaFormats.gif?.url ?? mediaFormats.mediumgif?.url ?? mediaFormats.tinygif?.url ?? mediaFormats.nanogif?.url
        const previewUrl =
          mediaFormats.nanogif?.url ?? mediaFormats.tinygif?.url ?? mediaFormats.gif?.url ?? mediaFormats.mediumgif?.url
        if (gifUrl && previewUrl) {
          return { id: result.id, url: gifUrl, previewUrl }
        }
      }
      const mediaEntry = result.media?.[0]
      const { url, preview } = extractTenorUrls(mediaEntry)
      if (url && preview) {
        return { id: result.id, url, previewUrl: preview }
      }
      return null
    })
    .filter((gif): gif is GifResult => Boolean(gif))
}

const fetchTrendingGifs = async (): Promise<GifResult[]> => {
  if (HAS_CUSTOM_GIPHY_KEY) {
    try {
      const gifs = await fetchGiphyGifs(GIPHY_TRENDING_URL)
      if (gifs.length > 0) {
        return gifs
      }
    } catch {
      // continue to Tenor fallback
    }
  }
  return fetchTenorGifs(TENOR_TRENDING_URL)
}

const searchGifs = async (query: string): Promise<GifResult[]> => {
  const encodedQuery = encodeURIComponent(query)
  if (HAS_CUSTOM_GIPHY_KEY) {
    try {
      const gifs = await fetchGiphyGifs(`${GIPHY_SEARCH_URL_BASE}${encodedQuery}`)
      if (gifs.length > 0) {
        return gifs
      }
    } catch {
      // fallback to Tenor below
    }
  }
  return fetchTenorGifs(`${TENOR_SEARCH_URL_BASE}${encodedQuery}`)
}

/**
 * Content showcase mirroring the "Nội Dung Mới Nhất" section from Figma.
 */
export default function ContentHighlightsSection({
  posts,
  articles,
  showCreateButton,
  onArticleAdded,
  onArticleDeleted,
  onContentPostCreated,
  isLoadingBlogs = false,
  hideTabNavigation = false
}: ContentHighlightsSectionProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>(hideTabNavigation ? 'articles' : 'blog')
  const [localArticles, setLocalArticles] = useState<ArticleHighlight[]>(articles)
  const [blogSearchQuery, setBlogSearchQuery] = useState('')

  useEffect(() => {
    setLocalArticles(articles)
  }, [articles])

  const filteredPosts = useMemo(() => {
    const keyword = blogSearchQuery.trim().toLowerCase()
    if (!keyword) {
      return posts
    }
    return posts.filter((post) => {
      const haystacks = [post.title, post.summary, post.author].filter(Boolean)
      return haystacks.some((field) => field.toLowerCase().includes(keyword))
    })
  }, [blogSearchQuery, posts])

  const tabButtonClass = (tab: ContentTab): string =>
    [
      'flex-1 py-2 rounded-md text-sm font-semibold transition-colors',
      activeTab === tab ? 'bg-white border border-black/10 shadow-inner text-neutral-950' : 'text-neutral-500'
    ].join(' ');

  return (
    <section className="w-full flex justify-center bg-white">
      <div className="w-full max-w-[1200px] px-4 md:px-0 py-10 flex flex-col gap-10 items-center">

        {!hideTabNavigation && (
          <div className="bg-[#ececf0] rounded-lg flex items-center justify-between p-1 w-full max-w-[368px]">
            <button type="button" className={tabButtonClass('articles')} onClick={() => setActiveTab('articles')}>
              Bài viết
            </button>
            <button type="button" className={tabButtonClass('blog')} onClick={() => setActiveTab('blog')}>
              Blog
            </button>
          </div>
        )}

        {!hideTabNavigation && showCreateButton && activeTab === 'blog' && <BlogComposer />}

        {showCreateButton && (hideTabNavigation || activeTab === 'articles') && (
          <ArticleComposer 
            onArticleCreated={(newArticle) => {
              // Add new article to local state
              setLocalArticles(prev => [newArticle, ...prev])
              if (onArticleAdded) {
                onArticleAdded(newArticle)
              }
            }}
            onContentPostCreated={() => {
              // Trigger refresh of content posts
              if (onContentPostCreated) {
                onContentPostCreated()
              }
            }}
          />
        )}

        {(!hideTabNavigation && activeTab === 'blog') ? (
          <div className="w-full flex flex-col gap-6 items-center">
            <form
              className="relative w-full max-w-[520px] self-center"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="blog-search" className="sr-only">
                Tìm kiếm blog
              </label>
              <input
                id="blog-search"
                type="search"
                value={blogSearchQuery}
                onChange={(event) => setBlogSearchQuery(event.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, tác giả..."
                className="h-[56px] w-full rounded-[14px] border border-black/10 bg-white px-5 text-base text-[#1c1c1c] placeholder:text-neutral-400 shadow-[0_14px_40px_rgba(15,23,42,0.05)] focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
              />
              {blogSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBlogSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/5 px-2 text-xs font-semibold text-black/60 hover:bg-black/10 transition"
                >
                  Xóa
                </button>
              )}
            </form>

            {isLoadingBlogs ? (
              <div className="w-full rounded-[24px] border border-dashed border-neutral-300 py-12 text-center text-neutral-500">
                Đang tải bài viết...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="w-full rounded-[24px] border border-dashed border-neutral-300 py-12 text-center text-neutral-500">
                Không tìm thấy bài viết nào phù hợp với từ khóa.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="flex flex-col gap-4">
                    <Link href={`/blog/${post.id}`} className="group block">
                      <div className="h-[320px] relative rounded-[24px] overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 570px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between text-white text-base">
                          <p>{post.author}</p>
                          <p>{post.date}</p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-bold text-[24px] leading-[32px] text-black line-clamp-2">
                          {post.title}
                        </h3>
                        <p
                          className="text-[18px] leading-[26px] text-black/70 overflow-hidden"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        >
                          {post.summary}
                        </p>
                      </div>
                      <Link
                        href={`/blog/${post.id}`}
                        className="mt-2 bg-[#1c1c1c] inline-flex items-center justify-center px-4 py-2 rounded-lg text-white uppercase text-sm tracking-wide shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] self-start"
                      >
                        Đọc ngay
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (hideTabNavigation || activeTab === 'articles') ? (
          <div className="flex flex-col w-full">
            <div className="columns-1 lg:columns-2" style={{ columnGap: '40px' }}>
              {localArticles.map((article) => (
                <div key={article.id} className="break-inside-avoid mb-6">
                  <ArticleCard 
                    article={article}
                    onArticleUpdated={(updatedArticle) => {
                      setLocalArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a))
                    }}
                    onArticleDeleted={(articleId) => {
                      setLocalArticles(prev => prev.filter(a => a.id !== articleId))
                      if (onArticleDeleted) {
                        onArticleDeleted(articleId)
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            {!hideTabNavigation && (
              <div className="w-full flex justify-center mt-10">
                <Link
                  href="/content"
                  className="bg-[#1c1c1c] inline-flex items-center justify-center px-5 py-2 rounded-lg text-white uppercase text-sm tracking-wide shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)]"
                >
                  Xem thêm
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

const ArticleCard = ({ 
  article,
  onArticleUpdated,
  onArticleDeleted
}: { 
  article: ArticleHighlight
  onArticleUpdated?: (updatedArticle: ArticleHighlight) => void
  onArticleDeleted?: (articleId: string) => void
}) => {
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isGifPickerOpen, setGifPickerOpen] = useState(false)
  const [gifResults, setGifResults] = useState<GifResult[]>([])
  const [isLoadingGifs, setIsLoadingGifs] = useState(false)
  const [gifError, setGifError] = useState<string | null>(null)
  const [selectedGif, setSelectedGif] = useState<GifResult | null>(null)
  const [gifQuery, setGifQuery] = useState('')
  const [imagePreviews, setImagePreviews] = useState<CommentAttachment[]>([])
  const [videoPreviews, setVideoPreviews] = useState<CommentAttachment[]>([])
  const [commentList, setCommentList] = useState<ArticleComment[]>(article.comments)
  const COMMENTS_PER_VIEW = 2
  
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  
  // Edit state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState(article.title)
  const [editCaption, setEditCaption] = useState(article.caption)
  const [editMedia, setEditMedia] = useState<Array<{ id: string; type: 'image' | 'video' | 'gif'; url: string; preview?: string; file?: File }>>(
    article.media.map((url, idx) => ({ id: `media-${idx}`, type: 'image' as const, url }))
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const editImageInputRef = useRef<HTMLInputElement>(null)
  const editVideoInputRef = useRef<HTMLInputElement>(null)
  
  // GIF picker state for edit mode
  const [isEditGifPickerOpen, setEditGifPickerOpen] = useState(false)
  const [editGifResults, setEditGifResults] = useState<GifResult[]>([])
  const [isLoadingEditGifs, setIsLoadingEditGifs] = useState(false)
  const [editGifQuery, setEditGifQuery] = useState('')
  
  // Report and hide states
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [reportReasons, setReportReasons] = useState<string[]>([])
  const [reportDescription, setReportDescription] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)
  
  // Notification dialog states
  const [notificationDialog, setNotificationDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'default' | 'negative'
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: () => {}
  })
  
  // Check if current user is the owner
  const isOwner = currentUser && article.author_id && currentUser.id === article.author_id
  
  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error('Failed to load current user:', error)
        setCurrentUser(null)
      } finally {
        setIsLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  const [activeSlide, setActiveSlide] = useState(0)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const mediaContainerRef = useRef<HTMLDivElement>(null)

  const limitedMedia = article.media.slice(0, 4)
  const usingTenorOnly = !HAS_CUSTOM_GIPHY_KEY

  const likeCountLabel = (isLiked ? article.likes + 1 : article.likes).toLocaleString('vi-VN')

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const releasePreview = (preview: CommentAttachment) => {
    if (preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url)
    }
  }

  const loadTrendingGifs = useCallback(async () => {
    try {
      setGifError(null)
      setIsLoadingGifs(true)
      const results = await fetchTrendingGifs()
      if (results.length === 0) {
        throw new Error('Empty GIF payload')
      }
      setGifResults(results)
      return
    } catch (error) {
      console.error('Không thể tải GIF từ GIPHY', error)
      const fallback = await fetchTenorGifs(TENOR_TRENDING_URL)
      setGifResults(fallback)
      if (fallback.length === 0) {
        setGifError('Không thể tải GIF. Vui lòng thử lại sau.')
      } else {
        setGifError(null)
      }
    } finally {
      setIsLoadingGifs(false)
    }
  }, [])

  const handleGifSearch = useCallback(async () => {
    const trimmedQuery = gifQuery.trim()
    if (!trimmedQuery) {
      await loadTrendingGifs()
      return
    }
    try {
      setGifError(null)
      setIsLoadingGifs(true)
      const results = await searchGifs(trimmedQuery)
      if (results.length === 0) {
        throw new Error('No GIF result')
      }
      setGifResults(results)
      setGifError(null)
    } catch (error) {
      console.error('Không thể tìm GIF', error)
      setGifError('Không tìm thấy GIF phù hợp. Vui lòng thử từ khóa khác.')
      setGifResults([])
    } finally {
      setIsLoadingGifs(false)
    }
  }, [gifQuery, loadTrendingGifs])

  const handleGifToggle = useCallback(() => {
    const nextState = !isGifPickerOpen
    setGifPickerOpen(nextState)
    if (nextState && gifResults.length === 0 && !isLoadingGifs) {
      void loadTrendingGifs()
    }
  }, [gifResults.length, isGifPickerOpen, isLoadingGifs, loadTrendingGifs])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!commentText.trim()) {
      return
    }
    const attachments: CommentAttachment[] = [
      ...imagePreviews,
      ...videoPreviews,
      ...(selectedGif ? [{ id: selectedGif.id, type: 'gif' as const, url: selectedGif.url }] : [])
    ]
    const newComment: ArticleComment = {
      id: `comment-${generateId()}`,
      author: 'Bạn',
      avatar: article.avatar,
      content: commentText.trim(),
      timestamp: 'Vừa xong',
      media: attachments
    }
    setCommentList((previous) => [newComment, ...previous])
    setCommentText('')
    setImagePreviews([])
    setVideoPreviews([])
    setSelectedGif(null)
    setGifPickerOpen(false)
    setGifQuery('')
  }

  const handleSelectGif = (gif: GifResult) => {
    setSelectedGif(gif)
    setGifPickerOpen(false)
  }

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }
    const previews = Array.from(files).map((file) => ({
      id: `${type}-${generateId()}`,
      type,
      url: URL.createObjectURL(file)
    }))
    if (type === 'image') {
      setImagePreviews((prev) => [...prev, ...previews])
    } else {
      setVideoPreviews((prev) => [...prev, ...previews])
    }
    event.target.value = ''
  }

  const removePreview = (id: string, type: 'image' | 'video' | 'gif') => {
    if (type === 'gif') {
      setSelectedGif(null)
      return
    }
    if (type === 'image') {
      const preview = imagePreviews.find((item) => item.id === id)
      if (preview) {
        releasePreview(preview)
      }
      setImagePreviews((prev) => prev.filter((item) => item.id !== id))
    } else {
      const preview = videoPreviews.find((item) => item.id === id)
      if (preview) {
        releasePreview(preview)
      }
      setVideoPreviews((prev) => prev.filter((item) => item.id !== id))
    }
  }

  useEffect(() => {
    const container = mediaContainerRef.current
    if (!container) {
      return
    }
    const handleScroll = () => {
      const width = container.clientWidth
      if (width === 0) {
        return
      }
      setActiveSlide(Math.round(container.scrollLeft / width))
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [limitedMedia.length])

  const goToSlide = (index: number) => {
    const container = mediaContainerRef.current
    if (!container) {
      return
    }
    const clampedIndex = Math.max(0, Math.min(index, limitedMedia.length - 1))
    container.scrollTo({
      left: clampedIndex * container.clientWidth,
      behavior: 'smooth'
    })
    setActiveSlide(clampedIndex)
  }

  // Close report popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(event.target as Node) && isReportOpen) {
        setIsReportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isReportOpen])

  const reportReasonsList = [
    'Nội dung spam hoặc quảng cáo',
    'Nội dung không phù hợp',
    'Nội dung lừa đảo',
    'Bạo lực hoặc đe dọa',
    'Quấy rối hoặc bắt nạt',
    'Vi phạm bản quyền',
    'Khác'
  ]

  const handleReportReasonChange = (reason: string) => {
    setReportReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  const handleSubmitReport = async () => {
    if (reportReasons.length === 0) {
      return
    }
    
    try {
      const { createReport } = await import('@/lib/api/reports')
      await createReport({
        post_id: article.id,
        reasons: reportReasons,
        description: reportDescription || undefined
      })
      setIsReportOpen(false)
      setReportReasons([])
      setReportDescription('')
      // Show success notification
      setNotificationDialog({
        isOpen: true,
        title: 'Thành công',
        message: 'Báo cáo đã được gửi thành công!',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
    } catch (error: any) {
      console.error('Failed to submit report:', error)
      setNotificationDialog({
        isOpen: true,
        title: 'Lỗi',
        message: error?.response?.data?.detail || 'Lỗi khi gửi báo cáo. Vui lòng thử lại.',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  const handleHidePost = () => {
    setIsHidden(true)
  }

  const handleUnhidePost = () => {
    setIsHidden(false)
  }
  
  const handleEditPost = () => {
    setIsEditMode(true)
    setEditTitle(article.title)
    setEditCaption(article.caption)
    // Initialize editMedia from article.media - detect type (image/video/gif)
    setEditMedia(article.media.map((url, idx) => {
      // Try to detect type from URL or default to image
      let type: 'image' | 'video' | 'gif' = 'image'
      if (url.includes('.gif') || url.includes('giphy.com') || url.includes('tenor.com')) {
        type = 'gif'
      } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        type = 'video'
      }
      return { id: `media-${idx}`, type, url }
    }))
    // Reset GIF picker state
    setEditGifPickerOpen(false)
    setEditGifQuery('')
    setEditGifResults([])
  }
  
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditTitle(article.title)
    setEditCaption(article.caption)
    // Reset to original media
    setEditMedia(article.media.map((url, idx) => {
      let type: 'image' | 'video' | 'gif' = 'image'
      if (url.includes('.gif') || url.includes('giphy.com') || url.includes('tenor.com')) {
        type = 'gif'
      } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        type = 'video'
      }
      return { id: `media-${idx}`, type, url }
    }))
    // Reset GIF picker state
    setEditGifPickerOpen(false)
    setEditGifQuery('')
    setEditGifResults([])
  }
  
  const handleSaveEdit = async () => {
    if (!article.content_post_id) {
      setNotificationDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Không thể chỉnh sửa bài viết này.',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
      return
    }
    
    if (!editTitle.trim() && !editCaption.trim() && editMedia.length === 0) {
      setNotificationDialog({
        isOpen: true,
        title: 'Thông báo',
        message: 'Vui lòng nhập nội dung hoặc thêm ảnh/video/GIF.',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      // Upload images if available (for image_url and embedding in content)
      let imageUrl: string | undefined = undefined
      const imageUploadMap = new Map<string, string>() // Map from item.id to uploaded URL
      
      // Upload all image files
      for (const item of editMedia) {
        if (item.type === 'image' && item.file) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', item.file)
          try {
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            })
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json()
              const uploadedUrl = uploadData.url
              imageUploadMap.set(item.id, uploadedUrl)
              // Use first uploaded image as image_url
              if (!imageUrl) {
                imageUrl = uploadedUrl
              }
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError)
            // Continue without this image if upload fails
          }
        }
      }
      
      // Use first image URL if no file uploads
      if (!imageUrl) {
        const firstImage = editMedia.find(m => m.type === 'image')
        if (firstImage) {
          imageUrl = firstImage.url
        }
      }
      
      // Convert caption to HTML content (preserve line breaks)
      let htmlContent = editCaption.trim().split('\n').map(line => `<p>${line}</p>`).join('') || `<p>${editTitle}</p>`
      
      // Embed media (GIFs, videos, images) into HTML content
      const mediaHtml: string[] = []
      editMedia.forEach((item) => {
        if (item.type === 'gif') {
          // Embed GIF as img tag
          mediaHtml.push(`<img src="${item.url}" alt="GIF" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" />`)
        } else if (item.type === 'video') {
          // Embed video as video tag
          mediaHtml.push(`<video src="${item.url}" controls style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;"></video>`)
        } else if (item.type === 'image') {
          // For uploaded images, use the uploaded URL from map
          // For image URLs (not files), use the URL directly
          const imageUrlToUse = item.file 
            ? imageUploadMap.get(item.id) || item.url
            : item.url
          if (imageUrlToUse) {
            mediaHtml.push(`<img src="${imageUrlToUse}" alt="Image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" />`)
          }
        }
      })
      
      // Combine caption and media HTML
      if (mediaHtml.length > 0) {
        htmlContent = htmlContent + (htmlContent ? '<br/>' : '') + mediaHtml.join('')
      }
      
      // Update content post via API
      const updatedPost = await updateContentPost(article.content_post_id, {
        title: editTitle.trim() || 'Bài viết mới',
        content: htmlContent,
        category: 'general',
        image_url: imageUrl
      })
      
      // Update local article
      const updatedArticle: ArticleHighlight = {
        ...article,
        title: updatedPost.title,
        caption: editCaption.trim(),
        media: editMedia.map(m => m.url),
        content_post_id: updatedPost.id
      }
      
      if (onArticleUpdated) {
        onArticleUpdated(updatedArticle)
      }
      
      setIsEditMode(false)
      setNotificationDialog({
        isOpen: true,
        title: 'Thành công',
        message: 'Bài viết đã được cập nhật thành công!',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
    } catch (error: any) {
      console.error('Error updating post:', error)
      setNotificationDialog({
        isOpen: true,
        title: 'Lỗi',
        message: error?.response?.data?.detail || error?.message || 'Có lỗi xảy ra khi cập nhật bài viết.',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeletePost = () => {
    if (!article.content_post_id) {
      setNotificationDialog({
        isOpen: true,
        title: 'Lỗi',
        message: 'Không thể xóa bài viết này.',
        type: 'default',
        confirmLabel: 'Đóng',
        onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
      })
      return
    }
    
    // Store content_post_id in a const to ensure TypeScript knows it's defined
    const postId = article.content_post_id
    
    // Show confirmation dialog with negative type (red button)
    setNotificationDialog({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
      type: 'negative',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      onConfirm: async () => {
        setNotificationDialog(prev => ({ ...prev, isOpen: false }))
        try {
          setIsDeleting(true)
          await deleteContentPost(postId)
          
          if (onArticleDeleted) {
            onArticleDeleted(article.id)
          }
          
          // Show success notification
          setNotificationDialog({
            isOpen: true,
            title: 'Thành công',
            message: 'Bài viết đã được xóa thành công!',
            type: 'default',
            confirmLabel: 'Đóng',
            onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
          })
        } catch (error: any) {
          console.error('Error deleting post:', error)
          setNotificationDialog({
            isOpen: true,
            title: 'Lỗi',
            message: error?.response?.data?.detail || error?.message || 'Có lỗi xảy ra khi xóa bài viết.',
            type: 'default',
            confirmLabel: 'Đóng',
            onConfirm: () => setNotificationDialog(prev => ({ ...prev, isOpen: false }))
          })
          setIsDeleting(false)
        }
      }
    })
  }
  
  const handleEditMediaChange = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file)
      setEditMedia(prev => [...prev, {
        id: generateId(),
        type,
        url: objectUrl,
        preview: objectUrl,
        file: file
      }])
    })
    event.target.value = ''
  }
  
  const removeEditMedia = (id: string) => {
    setEditMedia(prev => {
      const item = prev.find(m => m.id === id)
      if (item && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url)
      }
      return prev.filter(m => m.id !== id)
    })
  }
  
  // GIF picker functions for edit mode
  const loadEditTrendingGifs = useCallback(async () => {
    try {
      setIsLoadingEditGifs(true)
      const results = await fetchTrendingGifs()
      setEditGifResults(results)
    } catch (error) {
      console.error('Không thể tải GIF', error)
    } finally {
      setIsLoadingEditGifs(false)
    }
  }, [])
  
  const handleEditGifSearch = useCallback(async () => {
    const trimmedQuery = editGifQuery.trim()
    if (!trimmedQuery) {
      await loadEditTrendingGifs()
      return
    }
    try {
      setIsLoadingEditGifs(true)
      const results = await searchGifs(trimmedQuery)
      setEditGifResults(results)
    } catch (error) {
      console.error('Không thể tìm GIF', error)
      setEditGifResults([])
    } finally {
      setIsLoadingEditGifs(false)
    }
  }, [editGifQuery, loadEditTrendingGifs])
  
  const handleEditGifToggle = useCallback(() => {
    const nextState = !isEditGifPickerOpen
    setEditGifPickerOpen(nextState)
    if (nextState && editGifResults.length === 0 && !isLoadingEditGifs) {
      void loadEditTrendingGifs()
    }
  }, [editGifResults.length, isEditGifPickerOpen, isLoadingEditGifs, loadEditTrendingGifs])
  
  const handleSelectEditGif = (gif: GifResult) => {
    setEditMedia(prev => [...prev, {
      id: generateId(),
      type: 'gif',
      url: gif.url,
      preview: gif.previewUrl
    }])
    setEditGifPickerOpen(false)
  }

  const hasTitleOrCaption = (article.title && article.title.trim()) || (article.caption && article.caption.trim())
  const hasMedia = limitedMedia.length > 0
  const hasComments = commentList.length > 0

  // If post is hidden, show hidden message
  if (isHidden) {
    return (
      <article className="rounded-[32px] border border-red-200 bg-red-50 p-6 md:p-8 flex flex-col shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-600">
            Bạn đã ẩn bài viết của <span className="font-semibold">{article.author}</span>
          </p>
          <button
            type="button"
            onClick={handleUnhidePost}
            className="text-sm font-medium text-red-600 hover:text-red-700 underline"
          >
            Hoàn tác
          </button>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-[32px] border border-black/5 bg-white p-6 md:p-8 flex flex-col shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-4 relative">
        <div className="relative w-14 h-14 rounded-full overflow-hidden">
          <Image src={article.avatar} alt={article.author} fill sizes="56px" className="object-cover" />
        </div>
        <div className="flex flex-col flex-1">
          <p className="font-semibold text-lg text-neutral-900">{article.author}</p>
          <p className="text-sm text-neutral-500">{article.timestamp}</p>
        </div>
        <span className="text-sm text-neutral-400">{article.handle}</span>
        
        {/* Options button */}
        {!isLoadingUser && (
          <DropdownMenu
            options={isOwner ? [
              {
                label: 'Sửa bài',
                value: 'edit',
                onClick: handleEditPost
              },
              {
                label: 'Xóa bài',
                value: 'delete',
                onClick: handleDeletePost,
                className: 'text-red-600 hover:bg-red-50'
              }
            ] : [
              {
                label: 'Báo cáo',
                value: 'report',
                onClick: () => setIsReportOpen(true)
              },
              {
                label: 'Ẩn',
                value: 'hide',
                onClick: handleHidePost
              }
            ]}
            trigger={
              <button
                type="button"
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Tùy chọn"
              >
                <Image src="/Icon/more.svg" alt="Tùy chọn" width={24} height={24} />
              </button>
            }
            align="right"
          />
        )}
      </div>

      {/* Report Popup */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            ref={reportRef}
            className="bg-white rounded-[32px] border border-black/5 shadow-[0_25px_70px_rgba(15,23,42,0.08)] p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Báo cáo bài viết</h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <label className="text-sm font-medium text-neutral-700">Lý do báo cáo (có thể chọn nhiều)</label>
              {reportReasonsList.map((reason) => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportReasons.includes(reason)}
                    onChange={() => handleReportReasonChange(reason)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#000] focus:ring-2 focus:ring-[#1c1c1c] checked:bg-[#000] checked:border-[#000]"
                    style={{
                      accentColor: '#000'
                    }}
                  />
                  <span className="text-sm text-neutral-700">{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label htmlFor="report-description" className="block text-sm font-medium text-neutral-700 mb-2">
                Mô tả thêm (tùy chọn)
              </label>
              <textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Vui lòng mô tả chi tiết hơn..."
                rows={4}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1c1c1c] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReportOpen(false)
                  setReportReasons([])
                  setReportDescription('')
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportReasons.length === 0}
                className="flex-1 px-4 py-2 rounded-xl bg-[#1c1c1c] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditMode ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1c1c1c]"
              placeholder="Nhập tiêu đề..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Nội dung</label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1c1c1c] resize-none"
              placeholder="Chia sẻ cảm xúc của bạn..."
            />
          </div>
          
          {/* Media Preview */}
          {editMedia.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {editMedia.map((item) => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" muted loop />
                  ) : (
                    <img src={item.preview || item.url} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeEditMedia(item.id)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* GIF Picker for Edit Mode */}
          {isEditGifPickerOpen && (
            <div className="w-full rounded-2xl border border-black/5 bg-white p-4">
              <div className="mb-3 flex gap-3">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-black/5 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Tìm kiếm GIF bạn muốn..."
                  value={editGifQuery}
                  onChange={(event) => setEditGifQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleEditGifSearch()
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  onClick={() => void handleEditGifSearch()}
                >
                  Tìm
                </button>
              </div>
              {isLoadingEditGifs ? (
                <p className="text-sm text-neutral-500">Đang tải GIF...</p>
              ) : editGifResults.length === 0 ? (
                <p className="text-sm text-neutral-500">Không tìm thấy GIF phù hợp.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {editGifResults.map((gif) => (
                    <button
                      type="button"
                      key={gif.id}
                      className="overflow-hidden rounded-2xl border border-transparent transition hover:border-neutral-900/20 aspect-square"
                      onClick={() => handleSelectEditGif(gif)}
                    >
                      <img src={gif.previewUrl} alt="GIF" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Media Upload Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => editImageInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
            >
              <Image src="/Icon/photo.svg" alt="Ảnh" width={20} height={20} />
              Thêm ảnh
            </button>
            <input
              ref={editImageInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => handleEditMediaChange(event, 'image')}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => editVideoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
            >
              <Image src="/Icon/clapperboard.svg" alt="Video" width={20} height={20} />
              Thêm video
            </button>
            <input
              ref={editVideoInputRef}
              type="file"
              accept="video/*"
              onChange={(event) => handleEditMediaChange(event, 'video')}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={handleEditGifToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
            >
              <Image src="/Icon/gif.svg" alt="GIF" width={20} height={20} />
              Thêm GIF
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving || (!editTitle.trim() && !editCaption.trim() && editMedia.length === 0)}
              className="flex-1 px-4 py-2 rounded-xl bg-[#1c1c1c] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasTitleOrCaption && (
            <div className="flex flex-col gap-2 mt-3">
              {article.title && article.title.trim() && (
                <h3 className="text-[24px] font-semibold leading-[32px] text-neutral-950">{article.title}</h3>
              )}
              {article.caption && article.caption.trim() && (
                <p className="text-base text-neutral-600">{article.caption}</p>
              )}
            </div>
          )}

          {hasMedia ? (
        <div className="flex flex-col gap-3 mt-3">
          <div className="relative w-full">
            <div
              ref={mediaContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x"
              style={{ scrollbarWidth: 'none' }}
            >
              {limitedMedia.map((imageSrc) => (
                <div
                  key={`${article.id}-${imageSrc}`}
                  className="relative aspect-square w-full flex-shrink-0 snap-center rounded-[24px] overflow-hidden"
                >
                  <Image
                    src={imageSrc}
                    alt={article.title || 'Article media'}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                    draggable={false}
                    priority={false}
                  />
                </div>
              ))}
            </div>
            {limitedMedia.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
                  onClick={() => goToSlide(activeSlide - 1)}
                  aria-label="Xem ảnh trước"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L5 8L10 13" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
                  onClick={() => goToSlide(activeSlide + 1)}
                  aria-label="Xem ảnh tiếp theo"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3L11 8L6 13" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-1">
                  {limitedMedia.map((_, index) => (
                    <button
                      type="button"
                      key={`${article.id}-dot-${index}`}
                      className={`h-2 w-2 rounded-full transition ${index === activeSlide ? 'bg-white' : 'bg-white/40'}`}
                      aria-label={`Chuyển tới ảnh ${index + 1}`}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition hover:bg-neutral-50 ${
                isLiked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-neutral-600 border-black/5'
              }`}
              onClick={() => setIsLiked((prev) => !prev)}
              aria-pressed={isLiked}
            >
              <HeartIcon filled={isLiked} />
              {likeCountLabel} lượt thích
            </button>
          </div>
        </div>
        ) : (
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition hover:bg-neutral-50 ${
              isLiked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-neutral-600 border-black/5'
            }`}
            onClick={() => setIsLiked((prev) => !prev)}
            aria-pressed={isLiked}
          >
            <HeartIcon filled={isLiked} />
            {likeCountLabel} lượt thích
          </button>
        </div>
        )}
        </>
      )}

      {!isEditMode && hasComments && (
        <div className="flex flex-col gap-3 mt-3">
          {commentList.length <= COMMENTS_PER_VIEW ? (
            // Nếu có 2 comments trở xuống, hiển thị tất cả không cần scroll
            // Đảo ngược để comment mới nhất ở dưới cùng
            [...commentList].reverse().map((comment) => {
              const legacyAttachments =
                comment.attachment && !comment.media
                  ? [{ id: `${comment.id}-attachment`, type: 'image' as const, url: comment.attachment }]
                  : []
              const attachments = comment.media ?? legacyAttachments
              return (
                <div key={comment.id} className="flex gap-3 rounded-[24px] bg-[#f8f8fb] p-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={comment.avatar} alt={comment.author} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-neutral-900">{comment.author}</p>
                      <span className="text-xs text-neutral-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1 whitespace-pre-line">{comment.content}</p>
                    {attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {attachments.map((attachment) =>
                          attachment.type === 'video' ? (
                            <video
                              key={attachment.id}
                              src={attachment.url}
                              className="h-[140px] w-[140px] rounded-2xl object-cover"
                              controls
                              muted
                            />
                          ) : (
                            <img
                              key={attachment.id}
                              src={attachment.url}
                              alt={`${comment.author} attachment`}
                              className="h-[120px] w-[120px] aspect-square rounded-2xl object-cover"
                              loading="lazy"
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            // Nếu có nhiều hơn 2 comments, hiển thị với scrollbar
            // Đảo ngược để comment mới nhất ở dưới cùng
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {[...commentList].reverse().map((comment) => {
                const legacyAttachments =
                  comment.attachment && !comment.media
                    ? [{ id: `${comment.id}-attachment`, type: 'image' as const, url: comment.attachment }]
                    : []
                const attachments = comment.media ?? legacyAttachments
                return (
                  <div key={comment.id} className="flex gap-3 rounded-[24px] bg-[#f8f8fb] p-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={comment.avatar} alt={comment.author} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-neutral-900">{comment.author}</p>
                        <span className="text-xs text-neutral-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1 whitespace-pre-line">{comment.content}</p>
                      {attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {attachments.map((attachment) =>
                            attachment.type === 'video' ? (
                              <video
                                key={attachment.id}
                                src={attachment.url}
                                className="h-[140px] w-[140px] rounded-2xl object-cover"
                                controls
                                muted
                              />
                            ) : (
                              <img
                                key={attachment.id}
                                src={attachment.url}
                                alt={`${comment.author} attachment`}
                                className="h-[120px] w-[120px] aspect-square rounded-2xl object-cover"
                                loading="lazy"
                              />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!isEditMode && (
        <form className="rounded-[28px] border border-black/5 bg-white p-4 mt-3" onSubmit={handleSubmit}>
        <label htmlFor={`comment-${article.id}`} className="sr-only">
          Viết bình luận
        </label>
        <textarea
          id={`comment-${article.id}`}
          className="w-full resize-none rounded-2xl bg-[#f8f8fb] px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          placeholder="Viết bình luận"
          rows={2}
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
        />
        {(imagePreviews.length > 0 || videoPreviews.length > 0 || selectedGif) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {imagePreviews.map((preview) => (
              <div key={preview.id} className="relative h-[90px] w-[90px] overflow-hidden rounded-2xl">
                <img src={preview.url} alt="Ảnh đã chọn" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                  onClick={() => removePreview(preview.id, 'image')}
                  aria-label="Gỡ ảnh"
                >
                  ×
                </button>
              </div>
            ))}
            {videoPreviews.map((preview) => (
              <div key={preview.id} className="relative h-[90px] w-[120px] overflow-hidden rounded-2xl">
                <video src={preview.url} className="h-full w-full object-cover" muted loop />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                  onClick={() => removePreview(preview.id, 'video')}
                  aria-label="Gỡ video"
                >
                  ×
                </button>
              </div>
            ))}
            {selectedGif && (
              <div className="relative h-[90px] w-[90px] overflow-hidden rounded-2xl">
                <img src={selectedGif.previewUrl} alt="GIF đã chọn" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                  onClick={() => removePreview(selectedGif.id, 'gif')}
                  aria-label="Gỡ GIF"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
        {isGifPickerOpen && (
          <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4">
            <div className="mb-3 flex gap-3">
              <input
                type="text"
                className="flex-1 rounded-xl border border-black/5 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                placeholder="Tìm kiếm GIF bạn muốn..."
                value={gifQuery}
                onChange={(event) => setGifQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleGifSearch()
                  }
                }}
              />
              <button
                type="button"
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                onClick={() => void handleGifSearch()}
              >
                Tìm
              </button>
            </div>
            {usingTenorOnly && (
              <p className="mb-2 text-xs text-neutral-400">
                Đang sử dụng nguồn GIF từ Tenor. Thêm <code>NEXT_PUBLIC_GIPHY_API_KEY</code> để mở rộng kết quả tìm kiếm.
              </p>
            )}
            {gifError && <p className="text-sm text-red-500">{gifError}</p>}
            {isLoadingGifs ? (
              <p className="text-sm text-neutral-500">Đang tải GIF...</p>
            ) : gifResults.length === 0 ? (
              <p className="text-sm text-neutral-500">Không tìm thấy GIF phù hợp.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {gifResults.map((gif) => (
                  <button
                    type="button"
                    key={gif.id}
                    className="overflow-hidden rounded-2xl border border-transparent transition hover:border-neutral-900/20"
                    onClick={() => handleSelectGif(gif)}
                  >
                    <img src={gif.previewUrl} alt="GIF" className="h-24 w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => handleMediaChange(event, 'image')}
              className="hidden"
              multiple
            />
            <CommentActionButton icon="/Icon/photo.svg" label="Ảnh" onClick={() => imageInputRef.current?.click()} />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(event) => handleMediaChange(event, 'video')}
              className="hidden"
            />
            <CommentActionButton icon="/Icon/clapperboard.svg" label="Video" onClick={() => videoInputRef.current?.click()} />
            <CommentActionButton icon="/Icon/gif.svg" label="GIF" onClick={handleGifToggle} ariaPressed={isGifPickerOpen} />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800"
            aria-label="Gửi bình luận"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L11 6L6 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 6H1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </form>
      )}
      
      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notificationDialog.isOpen}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
        confirmLabel={notificationDialog.confirmLabel}
        cancelLabel={notificationDialog.cancelLabel}
        onConfirm={notificationDialog.onConfirm}
        onCancel={() => setNotificationDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </article>
  )
}

const CommentActionButton = ({
  icon,
  label,
  onClick,
  ariaPressed
}: {
  icon: string
  label: string
  onClick: () => void
  ariaPressed?: boolean
}) => (
  <button
    type="button"
    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white transition hover:bg-neutral-50"
    onClick={onClick}
    aria-label={label}
    aria-pressed={ariaPressed}
  >
    <div className="relative h-6 w-6">
      <Image src={icon} alt={label} fill sizes="24px" />
    </div>
  </button>
)

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="24" height="22" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M2.35542 2.95007C5.92068 -0.807815 11.6065 -1.06451 15.1718 2.69324L16.0576 3.78503L17.0478 2.69324C20.5301 -0.97681 25.9291 -0.80615 29.5097 2.69324L29.7626 2.95007C33.2446 6.62076 32.3916 13.9573 29.0712 17.7313L28.6337 18.2177L28.1484 18.7401C26.2748 20.7234 23.4022 23.4383 19.5322 26.8856L17.3222 28.8387C16.5596 29.5076 15.4502 29.4976 14.6992 28.8143L11.9716 26.3182L9.54292 24.0663C6.65618 21.3682 4.48896 19.2565 3.04195 17.7313C-0.523315 13.9734 -1.20971 6.70808 2.35542 2.95007Z"
      fill={filled ? '#FF4D4F' : 'none'}
      stroke={filled ? '#FF4D4F' : '#262626'}
      strokeWidth={filled ? 0 : 1.5}
    />
  </svg>
)

/**
 * Article Composer - Inline editor for creating articles (Bài viết tab)
 * Based on Figma design node-id 214:554
 */
function ArticleComposer({ 
  onArticleCreated,
  onContentPostCreated 
}: { 
  onArticleCreated?: (article: ArticleHighlight) => void
  onContentPostCreated?: () => void
}) {
  const [caption, setCaption] = useState('')
  const [title, setTitle] = useState('')
  const [media, setMedia] = useState<Array<{ id: string; type: 'image' | 'video' | 'gif'; url: string; preview?: string; file?: File }>>([])
  const [isGifPickerOpen, setGifPickerOpen] = useState(false)
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('')
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('smileys')
  const [gifResults, setGifResults] = useState<GifResult[]>([])
  const [isLoadingGifs, setIsLoadingGifs] = useState(false)
  const [gifQuery, setGifQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiScrollRef = useRef<HTMLDivElement>(null)

  // Emoji categories and data (Apple-style emojis)
  const emojiCategories = {
    smileys: {
      name: 'Người',
      icon: '😀',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐']
    },
    people: {
      name: 'Cử chỉ',
      icon: '👋',
      emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃']
    },
    animals: {
      name: 'Động vật',
      icon: '🐶',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛']
    },
    food: {
      name: 'Đồ ăn',
      icon: '🍎',
      emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊']
    },
    activities: {
      name: 'Hoạt động',
      icon: '⚽',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩']
    },
    objects: {
      name: 'Đồ vật',
      icon: '⌚',
      emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️']
    },
    travel: {
      name: 'Du lịch',
      icon: '🚗',
      emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚀', '🛸', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛵', '🛶', '🚤', '🛟', '🚧', '⛽', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋']
    },
    symbols: {
      name: 'Biểu tượng',
      icon: '❤️',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢']
    }
  }

  // Get filtered emojis based on search and category
  const getFilteredEmojis = () => {
    const categoryEmojis = emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories]?.emojis || []
    
    if (!emojiSearchQuery.trim()) {
      return categoryEmojis
    }
    
    // Simple search - filter emojis (you can enhance this with emoji name search)
    const query = emojiSearchQuery.toLowerCase()
    return categoryEmojis.filter(emoji => emoji.includes(query) || query.length === 0)
  }

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const loadTrendingGifs = useCallback(async () => {
    try {
      setIsLoadingGifs(true)
      const results = await fetchTrendingGifs()
      setGifResults(results)
    } catch (error) {
      console.error('Không thể tải GIF', error)
    } finally {
      setIsLoadingGifs(false)
    }
  }, [])

  const handleGifSearch = useCallback(async () => {
    const trimmedQuery = gifQuery.trim()
    if (!trimmedQuery) {
      await loadTrendingGifs()
      return
    }
    try {
      setIsLoadingGifs(true)
      const results = await searchGifs(trimmedQuery)
      setGifResults(results)
    } catch (error) {
      console.error('Không thể tìm GIF', error)
      setGifResults([])
    } finally {
      setIsLoadingGifs(false)
    }
  }, [gifQuery, loadTrendingGifs])

  const handleGifToggle = useCallback(() => {
    const nextState = !isGifPickerOpen
    setGifPickerOpen(nextState)
    setEmojiPickerOpen(false) // Close emoji picker when opening GIF picker
    if (nextState && gifResults.length === 0 && !isLoadingGifs) {
      void loadTrendingGifs()
    }
  }, [gifResults.length, isGifPickerOpen, isLoadingGifs, loadTrendingGifs])

  const handleEmojiToggle = useCallback(() => {
    setEmojiPickerOpen(prev => !prev)
    setGifPickerOpen(false) // Close GIF picker when opening emoji picker
  }, [])

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = caption
    const newText = text.substring(0, start) + emoji + text.substring(end)
    
    setCaption(newText)
    setEmojiPickerOpen(false)
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const handleSelectGif = (gif: GifResult) => {
    setMedia(prev => [...prev, {
      id: generateId(),
      type: 'gif',
      url: gif.url,
      preview: gif.previewUrl
    }])
    setGifPickerOpen(false)
  }

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file)
      setMedia(prev => [...prev, {
        id: generateId(),
        type,
        url: objectUrl,
        preview: objectUrl,
        file: file
      }])
    })
    event.target.value = ''
  }

  const removeMedia = (id: string) => {
    setMedia(prev => {
      const item = prev.find(m => m.id === id)
      if (item && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url)
      }
      return prev.filter(m => m.id !== id)
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && media.length === 0) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      // Get current user info
      const currentUser = await getCurrentUser()
      
      // Generate title from first line of caption or default
      const firstLine = caption.trim().split('\n')[0]
      const finalTitle = firstLine || 'Bài viết mới'
      
      // Upload images if available (for image_url and embedding in content)
      let imageUrl: string | undefined = undefined
      const imageUploadMap = new Map<string, string>() // Map from item.id to uploaded URL
      
      // Upload all image files
      for (const item of media) {
        if (item.type === 'image' && item.file) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', item.file)
          try {
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            })
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json()
              const uploadedUrl = uploadData.url
              imageUploadMap.set(item.id, uploadedUrl)
              // Use first uploaded image as image_url
              if (!imageUrl) {
                imageUrl = uploadedUrl
              }
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError)
            // Continue without this image if upload fails
          }
        }
      }
      
      // Convert caption to HTML content (preserve line breaks)
      let htmlContent = caption.trim().split('\n').map(line => `<p>${line}</p>`).join('')
      
      // Embed media (GIFs, videos, images) into HTML content
      const mediaHtml: string[] = []
      media.forEach((item) => {
        if (item.type === 'gif') {
          // Embed GIF as img tag
          mediaHtml.push(`<img src="${item.url}" alt="GIF" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" />`)
        } else if (item.type === 'video') {
          // Embed video as video tag
          mediaHtml.push(`<video src="${item.url}" controls style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;"></video>`)
        } else if (item.type === 'image') {
          // For uploaded images, use the uploaded URL from map
          // For image URLs (not files), use the URL directly
          const imageUrlToUse = item.file 
            ? imageUploadMap.get(item.id) || item.url
            : item.url
          if (imageUrlToUse) {
            mediaHtml.push(`<img src="${imageUrlToUse}" alt="Image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" />`)
          }
        }
      })
      
      // Combine caption and media HTML
      if (mediaHtml.length > 0) {
        htmlContent = htmlContent + (htmlContent ? '<br/>' : '') + mediaHtml.join('')
      }
      
      // Create content post via API
      await createContentPost({
        title: finalTitle,
        content: htmlContent || '<p>Bài viết mới</p>',
        category: 'general',
        image_url: imageUrl
      })
      
      // Create article object for local display
      const newArticle: ArticleHighlight = {
        id: generateId(),
        author: currentUser.full_name || 'Bạn',
        handle: `@${currentUser.email?.split('@')[0] || 'user'}`,
        avatar: currentUser.avatar || '/Image/Run 1.png',
        timestamp: 'Vừa xong',
        title: finalTitle,
        caption: caption.trim(),
        media: media.map(m => m.url),
        comments: [],
        likes: 0
      }

      if (onArticleCreated) {
        onArticleCreated(newArticle)
      }
      
      // Notify parent to refresh content posts
      if (onContentPostCreated) {
        onContentPostCreated()
      }

      // Reset form
      setCaption('')
      setTitle('')
      setMedia([])
      setGifPickerOpen(false)
      setGifQuery('')
    } catch (error: any) {
      console.error('Error creating content post:', error)
      setError(error?.response?.data?.detail || error?.message || 'Có lỗi xảy ra khi đăng bài viết.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup blob URLs
      media.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url)
        }
      })
    }
  }, [media])

  return (
    <div 
      className="backdrop-blur-[13px] backdrop-filter border border-[rgba(36,36,36,0.12)] border-solid relative rounded-[15px] w-full"
      style={{ 
        backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(rgba(243, 243, 243, 0.5) 0%, rgba(243, 243, 243, 0.12) 100%)" 
      }}
    >
      <form onSubmit={handleSubmit} className="box-border content-stretch flex flex-col gap-[40px] items-start overflow-clip px-[24px] py-[16px] relative rounded-[inherit]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm w-full">
            {error}
          </div>
        )}
        <div className="h-[62px] relative shrink-0 w-full">
          <textarea
            ref={textareaRef}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value)
              // Auto-generate title from first line
              const firstLine = e.target.value.trim().split('\n')[0]
              if (firstLine) {
                setTitle(firstLine)
              }
            }}
            placeholder="Chia sẻ cảm xúc của bạn"
            className="w-full h-full resize-none bg-transparent border-none outline-none font-['Inter:Medium',sans-serif] font-medium leading-[1.5] text-[18px] text-[rgba(37,37,37,0.6)] placeholder:text-[rgba(37,37,37,0.6)] focus:text-[rgba(37,37,37,1)]"
            rows={3}
          />
        </div>

        {/* Media Previews - Square format */}
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full">
            {media.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={item.preview || item.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* GIF Picker */}
        {isGifPickerOpen && (
          <div className="w-full rounded-2xl border border-black/5 bg-white p-4">
            <div className="mb-3 flex gap-3">
              <input
                type="text"
                className="flex-1 rounded-xl border border-black/5 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                placeholder="Tìm kiếm GIF bạn muốn..."
                value={gifQuery}
                onChange={(event) => setGifQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleGifSearch()
                  }
                }}
              />
              <button
                type="button"
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                onClick={() => void handleGifSearch()}
              >
                Tìm
              </button>
            </div>
            {isLoadingGifs ? (
              <p className="text-sm text-neutral-500">Đang tải GIF...</p>
            ) : gifResults.length === 0 ? (
              <p className="text-sm text-neutral-500">Không tìm thấy GIF phù hợp.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {gifResults.map((gif) => (
                  <button
                    type="button"
                    key={gif.id}
                    className="overflow-hidden rounded-2xl border border-transparent transition hover:border-neutral-900/20 aspect-square"
                    onClick={() => handleSelectGif(gif)}
                  >
                    <img src={gif.previewUrl} alt="GIF" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emoji Picker */}
        {isEmojiPickerOpen && (
          <div className="w-full rounded-2xl border border-black/5 bg-white p-4 flex flex-col">
            {/* Search bar */}
            <div className="mb-3">
              <input
                type="text"
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                placeholder="Tìm kiếm emoji..."
                className="w-full rounded-xl border border-black/5 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedEmojiCategory(key)
                    setEmojiSearchQuery('')
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedEmojiCategory === key
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Scrollable emoji grid */}
            <div
              ref={emojiScrollRef}
              className="overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="grid grid-cols-8 gap-2">
                {getFilteredEmojis().map((emoji, index) => (
                  <button
                    type="button"
                    key={`${selectedEmojiCategory}-${index}`}
                    className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-neutral-50"
                    onClick={() => insertEmoji(emoji)}
                    aria-label={`Chèn emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {getFilteredEmojis().length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4">Không tìm thấy emoji</p>
              )}
            </div>
          </div>
        )}

        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
          <div className="h-[1px] w-full bg-neutral-200 relative shrink-0"></div>
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
            <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0">
              {/* Emoji button - First */}
              <button
                type="button"
                onClick={handleEmojiToggle}
                className="relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
                aria-label="Thêm emoji"
              >
                <Image src="/Icon/happy.svg" alt="Emoji" fill sizes="32px" />
              </button>
              
              {/* Photo button - Second */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
                aria-label="Thêm ảnh"
              >
                <Image src="/Icon/photo.svg" alt="Ảnh" fill sizes="32px" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleMediaChange(event, 'image')}
                className="hidden"
                multiple
              />
              
              {/* Video button - Third */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
                aria-label="Thêm video"
              >
                <Image src="/Icon/clapperboard.svg" alt="Video" fill sizes="32px" />
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(event) => handleMediaChange(event, 'video')}
                className="hidden"
                multiple
              />
              
              {/* GIF button - Fourth */}
              <button
                type="button"
                onClick={handleGifToggle}
                className="relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
                aria-label="Thêm GIF"
              >
                <Image src="/Icon/gif.svg" alt="GIF" fill sizes="32px" />
              </button>
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || (!caption.trim() && media.length === 0)}
              className="bg-[#0b0b0b] border border-[rgba(182,182,182,0.1)] border-solid box-border content-stretch flex gap-[12px] h-[30px] items-center justify-center px-[16px] py-0 relative rounded-[4px] shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Đăng bài"
            >
              <svg width="10" height="17" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1L11 6L6 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 6H1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

/**
 * Blog Composer - Inline editor for creating blog posts
 */
function BlogComposer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isTitleFocused, setIsTitleFocused] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    
    // Preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)

    // Upload
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setImageUrl(data.url)
      setError(null)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Lỗi khi tải ảnh lên.')
      setPreviewImage(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và nội dung.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await createBlogPost({
        title: title.trim(),
        content: content.trim(),
        category,
        image_url: imageUrl || undefined,
      })

      setSuccess(true)
      
      // Reset form
      setTitle('')
      setContent('')
      setCategory('general')
      setImageUrl(null)
      setPreviewImage(null)
      
      // Collapse after success
      setTimeout(() => {
        setIsExpanded(false)
        setSuccess(false)
      }, 1500)
    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error?.response?.data?.detail || error?.message || 'Có lỗi xảy ra khi đăng bài viết.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setTitle('')
    setContent('')
    setCategory('general')
    setImageUrl(null)
    setPreviewImage(null)
    setError(null)
    setSuccess(false)
  }

  if (!isExpanded) {
    return (
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="bg-[#1c1c1c] flex items-center justify-center px-6 py-3 rounded-xl shadow-[inset_-4px_-4px_4px_0px_rgba(0,0,0,0.4),inset_4px_4px_6px_0px_rgba(255,255,255,0.15)] hover:opacity-90 transition-opacity"
        >
          <span className="font-bold text-base text-white uppercase whitespace-nowrap">
            Tạo blog ngay
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[800px] rounded-[24px] border border-neutral-200 bg-white p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-neutral-900">Soạn bài viết mới</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-neutral-500 hover:text-neutral-700 transition"
            aria-label="Đóng"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            Bài viết đã được gửi và đang chờ đội ngũ PaceUp phê duyệt trước khi xuất hiện công khai.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài viết..."
            className={`w-full px-4 py-3 rounded-xl border outline-none transition text-lg font-medium ${
              isTitleFocused
                ? 'border-[#1c1c1c] ring-2 ring-[#1c1c1c]/10 text-[#000]'
                : title
                ? 'border-black/10 text-[#6b6b6b]'
                : 'border-black/10 text-[#1c1c1c]/60'
            }`}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <CustomSelect
            options={BLOG_CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            placeholder="Chọn danh mục"
            className="w-full"
            width="100%"
            variant="hero"
          />
        </div>

        {/* Image Upload */}
        <div>
          {previewImage ? (
            <div className="relative w-full h-[200px] rounded-xl overflow-hidden border border-neutral-200 group">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null)
                  setImageUrl(null)
                  if (imageInputRef.current) {
                    imageInputRef.current.value = ''
                  }
                }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full h-[120px] rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition flex items-center justify-center flex-col gap-2"
            >
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-neutral-500">Thêm ảnh bìa (tùy chọn)</span>
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Content Editor */}
        <div>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Viết nội dung bài viết của bạn..."
          />
        </div>

        <p className="text-xs text-neutral-500">
          * Bài viết sẽ hiển thị ở trang Nội dung sau khi admin duyệt (thường trong vòng 24 giờ).
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition text-sm font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !content.trim()}
            className="px-6 py-2 rounded-xl bg-[#1c1c1c] text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1)]"
          >
            {isLoading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  )
}


