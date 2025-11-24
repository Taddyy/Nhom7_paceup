'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getNotifications, markNotificationAsRead, getUnreadCount } from '@/lib/api/notifications'

export interface Notification {
  id: string
  type: 'post_liked' | 'post_commented' | 'event_approved' | 'event_rejected' | 'blog_approved' | 'blog_rejected'
  title: string
  message: string
  related_id?: string
  is_read: boolean
  metadata?: string
  created_at: string
}

interface NotificationBellProps {
  userId?: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)


  const fetchNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }
  
  useEffect(() => {
    if (userId && isOpen) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isOpen])
  
  useEffect(() => {
    if (!userId) return
    
    // Fetch unread count periodically
    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadCount()
        setUnreadCount(data.unread_count)
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }
    
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id)
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate based on type
    switch (notification.type) {
      case 'event_approved':
      case 'event_rejected':
        router.push('/events')
        break
      case 'blog_approved':
      case 'blog_rejected':
        router.push('/content')
        break
      case 'post_liked':
      case 'post_commented':
        router.push('/content')
        break
      default:
        break
    }
    setIsOpen(false)
  }

  const formatNotificationMessage = (notification: Notification): string => {
    if (notification.type === 'event_rejected' && notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata)
        if (metadata.reasons && metadata.reasons.length > 0) {
          return `${notification.message}\nLý do: ${metadata.reasons.join(', ')}`
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return notification.message
  }

  const getNotificationAction = (notification: Notification): string | null => {
    if (notification.type === 'event_rejected') {
      return 'Tạo sự kiện mới'
    }
    return null
  }

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 rounded-full bg-white border border-black/12 flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Thông báo"
      >
        <Image 
          src="/Icon/bell.svg" 
          alt="Thông báo" 
          width={24} 
          height={24}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 max-h-[500px] overflow-y-auto">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">Thông báo</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${
                      !notification.is_read ? 'bg-blue-600' : 'bg-transparent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-neutral-600 whitespace-pre-line mb-2">
                        {formatNotificationMessage(notification)}
                      </p>
                      {getNotificationAction(notification) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (notification.type === 'event_rejected') {
                              router.push('/events/create')
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {getNotificationAction(notification)}
                        </button>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(notification.created_at).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

