'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CTASection from '@/components/home/CTASection'
import ContentHighlightsSection, {
  type ArticleHighlight,
  type ContentHighlight
} from '@/components/home/ContentHighlightsSection'

const DEFAULT_POSTS: ContentHighlight[] = [
  {
    id: 'post-1',
    title: 'Chinh phục cung đường Techcombank Marathon',
    author: 'PaceUp Studio',
    date: '02 Tháng 11, 2025',
    summary:
      'Khám phá các bí quyết giữ pace ổn định và chiến thuật tiếp nước giúp bạn hoàn thành 42km với kết quả tốt nhất.',
    image: 'http://localhost:3845/assets/758e40716c21136fbea225c08347430dea16d070.png'
  },
  {
    id: 'post-2',
    title: 'Trải nghiệm Night Run Đà Nẵng',
    author: 'Run To The Light',
    date: '17 Tháng 10, 2025',
    summary:
      'Ánh sáng LED tương tác trên cầu Rồng, cung đường ven sông Hàn rực rỡ mang tới trải nghiệm chạy bộ độc nhất.',
    image: 'http://localhost:3845/assets/7045ae395d136850870676a9ff83680f1efe4585.png'
  }
]

const DEFAULT_ARTICLES: ArticleHighlight[] = [
  {
    id: 'article-1',
    author: 'Minh Runner',
    handle: '@minhrun',
    avatar: '/Image/Run 1.png',
    timestamp: '1 giờ trước',
    title: 'Slow and steady',
    caption: 'Buổi tempo run sáng sớm cùng đội crew.',
    media: ['/Image/Run 2.png', '/Image/Run 3.png', '/Image/Run 4.png', '/Image/Run 5.png'],
    comments: [
      {
        id: 'comment-1',
        author: 'An',
        avatar: '/Image/Run 2.png',
        content: 'Giữ nhịp quá tốt luôn! 💪',
        timestamp: '30 phút trước'
      }
    ],
    likes: 132
  },
  {
    id: 'article-2',
    author: 'Lan Pace',
    handle: '@lanpace',
    avatar: '/Image/Run 6.png',
    timestamp: '2 giờ trước',
    title: 'Tập hill repeat tại Thủ Đức',
    caption: 'Độ cao vừa đủ để đốt cháy bắp chân.',
    media: ['/Image/Run 6.png', '/Image/Run 5.png'],
    comments: [],
    likes: 86
  }
]

export default function ContentPage() {
  const [posts] = useState<ContentHighlight[]>(DEFAULT_POSTS)
  const [articles, setArticles] = useState<ArticleHighlight[]>(DEFAULT_ARTICLES)

  // Hydrate from server data when available later
  useEffect(() => {
    // Placeholder for future fetch
  }, [])

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

          <ContentHighlightsSection posts={posts} articles={articles} showCreateButton={true} />
        </div>
      </div>

      <CTASection />
    </div>
  )
}

