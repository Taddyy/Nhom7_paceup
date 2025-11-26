'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { BlogPost } from '@/lib/api/blog-service'

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const formatDate = (value: string): string => {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function BlogPostPage() {
  const params = useParams<{ id: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchPost = async () => {
      try {
        setIsLoading(true)
        const { getBlogPost } = await import('@/lib/api/blog-service')
        const data = await getBlogPost(params.id)
        if (isMounted) {
          setPost(data)
        }
      } catch (err) {
        console.error('Error fetching blog detail:', err)
        if (isMounted) {
          setError('Không tìm thấy nội dung mà bạn yêu cầu.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    fetchPost()
    return () => {
      isMounted = false
    }
  }, [params.id])

  const readingTime = useMemo(() => {
    if (!post?.content) return '2 phút đọc'
    const words = stripHtml(post.content).split(/\s+/).length
    return `${Math.max(2, Math.round(words / 220))} phút đọc`
  }, [post?.content])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] pt-[150px] pb-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 text-center text-neutral-500">
          Đang tải nội dung...
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] pt-[150px] pb-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-4">Oops...</h1>
          <p className="text-neutral-600 mb-6">{error ?? 'Bài viết này không tồn tại hoặc đã bị xoá.'}</p>
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-[#1c1c1c] hover:border-black hover:bg-black/5 transition">
            ← Quay lại Blog
          </Link>
        </div>
      </div>
    )
  }

  const isPending = post.status === 'pending'

  return (
    <div className="min-h-screen bg-[#f8f9fb] pt-[140px] pb-20">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="mb-8 flex items-center gap-3 text-sm text-neutral-500">
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-2 text-sm font-semibold text-[#1c1c1c] hover:border-black hover:bg-black/5 transition">
            ← Danh sách blog
          </Link>
          {isPending && (
            <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Bản xem trước
            </span>
          )}
        </div>

        <article className="space-y-10">
          <header className="rounded-[32px] border border-black/5 bg-white px-6 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:px-12 md:py-10">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.4em] text-black/40">
              <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] tracking-[0.3em] text-black/70">
                {post.category || 'Blog'}
              </span>
              <span>{formatDate(post.created_at)}</span>
              <span className="text-black/30">{readingTime}</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold text-[#1c1c1c] md:text-[44px] md:leading-tight">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center font-semibold uppercase">
                  {post.author_name?.slice(0, 2) ?? 'PU'}
                </div>
                <div>
                  <p className="font-semibold text-[#1c1c1c]">{post.author_name ?? 'PaceUp Studio'}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/40">Tác giả</p>
                </div>
              </div>
              {isPending && (
                <p className="rounded-[12px] bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  * Bài viết đang chờ đội ngũ PaceUp phê duyệt trước khi hiển thị công khai.
                </p>
              )}
            </div>
          </header>

          {post.image_url && (
            <div className="rounded-[32px] border border-black/5 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.06)]">
              <div className="relative w-full overflow-hidden rounded-[32px]">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}

          <section className="rounded-[32px] border border-black/5 bg-white px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.06)] md:px-12">
            <div
              className="prose prose-lg max-w-none text-[#1c1c1c] prose-img:rounded-3xl prose-img:border prose-img:border-black/5 prose-img:shadow-lg prose-img:mx-auto prose-img:max-w-[1200px]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </section>

          <footer className="rounded-[32px] border border-dashed border-black/10 bg-white/60 px-6 py-8 text-sm text-neutral-500 md:px-10">
            <p>
              Chia sẻ cảm nhận hoặc góp ý cho đội ngũ PaceUp bằng cách gửi email về{' '}
              <a href="mailto:hello@paceup.vn" className="text-[#1c1c1c] underline decoration-dotted">
                hello@paceup.vn
              </a>
              . Đội ngũ kiểm duyệt sẽ phản hồi trong vòng 24 giờ làm việc.
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}

