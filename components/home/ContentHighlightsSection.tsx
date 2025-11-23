'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
}

type ContentTab = 'articles' | 'blog'

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? 'dc6zaTOxFJmzC'
const HAS_CUSTOM_GIPHY_KEY = GIPHY_API_KEY !== 'dc6zaTOxFJmzC'
const GIPHY_TRENDING_URL = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`
const GIPHY_SEARCH_URL_BASE = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&limit=12&rating=g&q=`

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY ?? 'LIVDSRZULELA'
const TENOR_TRENDING_URL = `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=12&media_filter=minimal`
const TENOR_SEARCH_URL_BASE = `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&limit=12&media_filter=minimal&q=`

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
export default function ContentHighlightsSection({ posts, articles, showCreateButton }: ContentHighlightsSectionProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('blog')

  const tabButtonClass = (tab: ContentTab): string =>
    [
      'flex-1 py-2 rounded-md text-sm font-semibold transition-colors',
      activeTab === tab ? 'bg-white border border-black/10 shadow-inner text-neutral-950' : 'text-neutral-500'
    ].join(' ');

  return (
    <section className="w-full flex justify-center bg-white">
      <div className="w-full max-w-[1200px] px-4 md:px-0 py-10 flex flex-col gap-10 items-center">

        <div className="bg-[#ececf0] rounded-lg flex items-center justify-between p-1 w-full max-w-[368px]">
          <button type="button" className={tabButtonClass('articles')} onClick={() => setActiveTab('articles')}>
            Bài viết
          </button>
          <button type="button" className={tabButtonClass('blog')} onClick={() => setActiveTab('blog')}>
            Blog
          </button>
        </div>

        {showCreateButton && (
          <div className="flex justify-center">
            <Link
              href="/content/create"
              className="bg-[#1c1c1c] flex items-center justify-center px-6 py-3 rounded-xl shadow-[inset_-4px_-4px_4px_0px_rgba(0,0,0,0.4),inset_4px_4px_6px_0px_rgba(255,255,255,0.15)] hover:opacity-90 transition-opacity"
            >
              <span className="font-bold text-base text-white uppercase whitespace-nowrap">
                Tạo blog ngay
              </span>
            </Link>
          </div>
        )}

        {activeTab === 'blog' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col gap-8">
                <div className="h-[320px] relative rounded-[24px] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 570px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between text-white text-base">
                    <p>{post.author}</p>
                    <p>{post.date}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-[24px] leading-[32px] text-black">
                      {post.title}
                    </h3>
                    <p
                      className="font-medium text-[24px] leading-[32px] text-black/70 h-[94px] overflow-hidden"
                      style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                    >
                      {post.summary}
                    </p>
                  </div>
                  <Link
                    href="/content"
                    className="bg-[#1c1c1c] inline-flex items-center justify-center px-4 py-2 rounded-lg text-white uppercase text-sm tracking-wide shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] self-start"
                  >
                    Đọc ngay
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <div className="w-full flex justify-center">
              <Link
                href="/content"
                className="bg-[#1c1c1c] inline-flex items-center justify-center px-5 py-2 rounded-lg text-white uppercase text-sm tracking-wide shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)]"
              >
                Xem thêm
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const ArticleCard = ({ article }: { article: ArticleHighlight }) => {
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

  return (
    <article className="rounded-[32px] border border-black/5 bg-white p-6 md:p-8 flex flex-col gap-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden">
          <Image src={article.avatar} alt={article.author} fill sizes="56px" className="object-cover" />
        </div>
        <div className="flex flex-col">
          <p className="font-semibold text-lg text-neutral-900">{article.author}</p>
          <p className="text-sm text-neutral-500">{article.timestamp}</p>
        </div>
        <span className="ml-auto text-sm text-neutral-400">{article.handle}</span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[24px] font-semibold leading-[32px] text-neutral-950">{article.title}</h3>
        <p className="text-base text-neutral-600">{article.caption}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <div
            ref={mediaContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x"
            style={{ scrollbarWidth: 'none' }}
          >
            {limitedMedia.map((imageSrc) => (
              <div
                key={`${article.id}-${imageSrc}`}
                className="relative h-[260px] w-full flex-shrink-0 snap-center rounded-[24px] overflow-hidden"
              >
                <Image
                  src={imageSrc}
                  alt={article.title}
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

      <div className="flex h-[200px] flex-col justify-end gap-3 overflow-hidden">
        {commentList.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[24px] bg-[#f8f8fb] p-4 text-sm text-neutral-500">
            Không có bình luận
          </div>
        ) : (
          commentList.map((comment) => {
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
                            className="h-[120px] w-[120px] rounded-2xl object-cover"
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
        )}
      </div>

      <form className="rounded-[28px] border border-black/5 bg-white p-4" onSubmit={handleSubmit}>
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


