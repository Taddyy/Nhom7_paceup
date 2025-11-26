'use client'

import { Suspense, useEffect, useState } from 'react'

import HeroSection from '@/components/home/HeroSection'
import RegisteredEventsSection from '@/components/home/RegisteredEventsSection'
import UpcomingEventsSection from '@/components/home/UpcomingEventsSection'
import ContentHighlightsSection, {
  type ArticleHighlight,
  type ContentHighlight
} from '@/components/home/ContentHighlightsSection'
import CTASection from '@/components/home/CTASection'
import type { EventCardProps } from '@/components/events/EventCard'
import { getBlogPosts, type BlogPost } from '@/lib/api/blog-service'

const registeredEvents: EventCardProps[] = [
  {
    id: 'registered-1',
    title: 'Marathon Thành Phố HCM',
    image: '/Image/Event.png',
    date: '15 Tháng 12, 2024',
    location: 'TP. Hồ Chí Minh',
    participants: 5000,
    distance: '42K',
    status: 'open'
  },
  {
    id: 'registered-2',
    title: 'Ha Noi Midnight Run',
    image: '/Image/Run 1.png',
    date: '22 Tháng 12, 2024',
    location: 'Hà Nội',
    participants: 4200,
    distance: '21K',
    status: 'open'
  },
  {
    id: 'registered-3',
    title: 'Da Nang Beach Marathon',
    image: '/Image/Run 2.png',
    date: '18 Tháng 01, 2025',
    location: 'Đà Nẵng',
    participants: 3600,
    distance: '10K',
    status: 'open'
  }
]

const eventImages = ['/Image/Event.png', '/Image/Run 1.png', '/Image/Run 2.png', '/Image/Run 3.png', '/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png']
const cities = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ', 'Đà Lạt', 'Hải Phòng', 'Quy Nhơn', 'Vũng Tàu', 'Phú Quốc']
const raceThemes = ['Marathon', 'Night Run', 'Heritage Run', 'Trail Challenge', 'Beach Marathon', 'City Run']
const distances = ['5K', '10K', '15K', '21K', '32K', '42K']

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day} Tháng ${month}, ${year}`
}

const contentHighlightTemplates: Array<Pick<ContentHighlight, 'title' | 'summary'>> = [
  {
    title: 'Giải mã chiến thuật negative split 21K',
    summary: 'Cách chia pace giúp giữ sức cho 5KM cuối và bứt tốc để đạt PR mới trong giải bán marathon.'
  },
  {
    title: 'Checklist thiết bị cho runner đường dài',
    summary: 'Gợi ý giày, đồng hồ GPS, gel năng lượng và mẹo chống phồng rộp cho các giải trên 30KM.'
  },
  {
    title: 'Bài tập sức mạnh lõi cho người chạy bộ',
    summary: 'Chuỗi plank, dead bug và single-leg squat giúp ổn định thân trên, giảm chấn thương IT band.'
  },
  {
    title: 'Kinh nghiệm race-cation cùng cộng đồng PaceUp',
    summary: 'Lên kế hoạch du lịch kết hợp chạy bộ, quản lý dinh dưỡng khi di chuyển và giữ lịch luyện tập.'
  },
  {
    title: 'Livestream chiến thuật pacer 42KM',
    summary: 'Chia sẻ từ các pacer kỳ cựu về cách duy trì nhịp thở, call-out động lực và xử lý khủng hoảng năng lượng.'
  }
]

const contentAuthors = ['Nguyễn Minh Tuấn', 'Trần Bích Chi', 'Phạm Quốc Phong', 'Lê Mai Anh', 'Đỗ Văn Khoa']

const contentImages = ['/Image/Run 1.png', '/Image/Run 2.png', '/Image/Run 3.png', '/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png']

const generateContentHighlights = (count: number): ContentHighlight[] => {
  const today = new Date()
  return Array.from({ length: count }).map((_, index) => {
    const template = contentHighlightTemplates[index % contentHighlightTemplates.length]
    const author = contentAuthors[index % contentAuthors.length]
    const image = contentImages[index % contentImages.length]
    const publishedDate = new Date(today)
    publishedDate.setDate(today.getDate() - index * 3)

    return {
      id: `content-${index + 1}`,
      title: template.title,
      author,
      date: formatDate(publishedDate),
      summary: template.summary,
      image
    }
  })
}

const articleAuthors = [
  { name: 'Joshua Lê', handle: '@joshua_l', avatar: '/Image/Run 3.png' },
  { name: 'Mai Vũ', handle: '@maivu.run', avatar: '/Image/Run 4.png' },
  { name: 'Kelvin Trần', handle: '@kelvin.ontrack', avatar: '/Image/Run 5.png' },
  { name: 'Anna Nguyễn', handle: '@annan.goesfar', avatar: '/Image/Run 6.png' }
]

const articleStories = [
  {
    title: 'Slow and steady',
    caption: 'Nhật ký chạy phục hồi pace Z2 quanh hồ Bảy Mẫu, tập trung vào form và cảm nhận cơ thể.',
    media: ['/Image/Run 1.png', '/Image/Run 2.png', '/Image/Run 3.png'],
    attachment: '/Image/Run 4.png',
    likes: 1240
  },
  {
    title: 'Sunrise tempo',
    caption: 'Buổi tempo sáng sớm cùng đội pacer 4:45/km, điều chỉnh nhịp thở theo gió biển Đà Nẵng.',
    media: ['/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png', '/Image/Run 2.png'],
    attachment: '/Image/Run 6.png',
    likes: 980
  },
  {
    title: 'Track day energy',
    caption: 'Workout 8×400m negative split ở sân Mỹ Đình, tập trung vào kỹ thuật xuất phát và gia tốc.',
    media: ['/Image/Run 2.png', '/Image/Run 4.png', '/Image/Run 5.png'],
    attachment: '/Image/Run 1.png',
    likes: 1520
  },
  {
    title: 'Racecation Quy Nhơn',
    caption: 'Kết hợp nghỉ dưỡng và chinh phục 21K ven biển, kiểm soát dinh dưỡng với đồ biển lành mạnh.',
    media: ['/Image/Run 5.png', '/Image/Run 6.png', '/Image/Run 3.png', '/Image/Run 4.png'],
    attachment: '/Image/Run 2.png',
    likes: 1785
  }
]

const articleCommentTemplates = [
  {
    author: 'Anna',
    avatar: '/Image/Run 4.png',
    content: 'Bạn trông tuyệt vời!',
    timestamp: '3 giờ trước'
  },
  {
    author: 'Kelvin',
    avatar: '/Image/Run 5.png',
    content: 'Vừa gặp chiến binh này ở đường track tuần rồi 😄',
    timestamp: '3 giờ trước'
  },
  {
    author: 'Lan Chi',
    avatar: '/Image/Run 6.png',
    content: 'Nhịp thở ổn định ghê, cảm ơn vì chia sẻ.',
    timestamp: '2 giờ trước'
  },
  {
    author: 'Hoàng Nam',
    avatar: '/Image/Run 1.png',
    content: 'Pha negative split chuẩn chỉnh!',
    timestamp: '1 giờ trước'
  }
]

const formatArticleTimestamp = (offsetHours: number): string => {
  const now = new Date()
  const snapshot = new Date(now)
  snapshot.setHours(now.getHours() - offsetHours)
  const timeString = snapshot.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return `Hôm nay • ${timeString}`
}

const generateArticleHighlights = (count: number): ArticleHighlight[] =>
  Array.from({ length: count }).map((_, index) => {
    const author = articleAuthors[index % articleAuthors.length]
    const story = articleStories[index % articleStories.length]
    const comments = Array.from({ length: 2 }).map((__, commentIndex) => {
      const template = articleCommentTemplates[(index + commentIndex) % articleCommentTemplates.length]
      return {
        id: `article-${index + 1}-comment-${commentIndex + 1}`,
        ...template,
        attachment: commentIndex === 1 ? story.attachment : undefined
      }
    })

    return {
      id: `article-${index + 1}`,
      author: author.name,
      handle: author.handle,
      avatar: author.avatar,
      timestamp: formatArticleTimestamp(index),
      title: story.title,
      caption: story.caption,
      media: story.media,
      comments,
      likes: story.likes
    }
  })

const generateUpcomingEvents = (count: number): EventCardProps[] => {
  const today = new Date()
  return Array.from({ length: count }).map((_, index) => {
    const eventDate = new Date(today)
    eventDate.setDate(today.getDate() + (index + 1) * 7)
    const city = cities[index % cities.length]
    const theme = raceThemes[index % raceThemes.length]
    return {
      id: `upcoming-${index + 1}`,
      title: `${city} ${theme}`,
      image: eventImages[index % eventImages.length],
      date: formatDate(eventDate),
      location: city,
      participants: 1800 + (index % 6) * 420,
      distance: distances[index % distances.length],
      status: 'open'
    }
  })
}

const upcomingEvents = generateUpcomingEvents(12)

const staticContentHighlights = generateContentHighlights(4)
const staticArticleHighlights = generateArticleHighlights(4)

const mapBlogPostToHighlight = (post: BlogPost): ContentHighlight => {
  const plain = (post.excerpt || post.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const summary =
    plain.length > 200 ? `${plain.slice(0, 200)}…` : plain || 'Bài viết đang chờ cập nhật nội dung.'

  return {
    id: post.id,
    title: post.title,
    author: post.author_name || 'PaceUp Studio',
    date: new Date(post.created_at).toLocaleDateString('vi-VN'),
    summary,
    image: post.image_url || '/Image/Event.png'
  }
}

import HomeToast from '@/components/home/HomeToast'

/**
 * Home page component matching Figma design.
 */
export default function HomePage() {
  const [posts, setPosts] = useState<ContentHighlight[]>(staticContentHighlights)
  const [articles] = useState<ArticleHighlight[]>(staticArticleHighlights)
  const [isFetchingPosts, setIsFetchingPosts] = useState<boolean>(true)

  useEffect(() => {
    const fetchApprovedBlogs = async () => {
      try {
        setIsFetchingPosts(true)
        const response = await getBlogPosts(1, 4, undefined, 'approved')
        if (response.posts.length > 0) {
          setPosts(response.posts.map(mapBlogPostToHighlight))
        }
      } catch (error) {
        console.error('Failed to load blog posts for home:', error)
        setPosts(staticContentHighlights)
      } finally {
        setIsFetchingPosts(false)
      }
    }

    fetchApprovedBlogs()
  }, [])

  return (
    <div className="bg-white flex flex-col items-center relative min-h-screen w-full">
      <Suspense fallback={null}>
        <HomeToast />
      </Suspense>
      <div className="w-full max-w-[1440px] relative">
        <HeroSection />
      </div>
      <RegisteredEventsSection events={registeredEvents} />
      <UpcomingEventsSection events={upcomingEvents} />
      <ContentHighlightsSection
        posts={posts}
        articles={articles}
        isLoadingBlogs={isFetchingPosts}
      />
      <CTASection />
    </div>
  )
}

