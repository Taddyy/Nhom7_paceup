'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminStats, getAdminPosts, updatePostStatus, getAdminEvents, updateEventStatus, type AdminStats } from '@/lib/api/admin'
import { getCurrentUser } from '@/lib/api/auth-service'
import type { BlogPost } from '@/lib/api/blog-service'
import type { Event } from '@/lib/api/events'
import Toast from '@/components/ui/Toast'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'events' | 'reports'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', type: 'success' as const, isVisible: false })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchStats()
    if (activeTab === 'posts') fetchPosts()
    if (activeTab === 'events') fetchEvents()
  }, [activeTab])

  const checkAdminAccess = async () => {
    try {
      const user = await getCurrentUser()
      if (user.email !== 'admin@gmail.com' && user.role !== 'admin') {
        router.push('/') // Redirect non-admins
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const data = await getAdminPosts('pending')
      setPosts(data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchEvents = async () => {
    try {
      const data = await getAdminEvents('pending')
      setEvents(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleApprovePost = async (id: string) => {
    try {
      await updatePostStatus(id, 'approved')
      setToast({ message: 'Đã duyệt bài viết', type: 'success', isVisible: true })
      fetchPosts()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi duyệt bài', type: 'error', isVisible: true })
    }
  }

  const handleRejectPost = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối bài viết này?')) return
    try {
      await updatePostStatus(id, 'rejected')
      setToast({ message: 'Đã từ chối bài viết', type: 'success', isVisible: true })
      fetchPosts()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi từ chối bài', type: 'error', isVisible: true })
    }
  }

  const handleApproveEvent = async (id: string) => {
    try {
      await updateEventStatus(id, 'approved')
      setToast({ message: 'Đã duyệt sự kiện', type: 'success', isVisible: true })
      fetchEvents()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi duyệt sự kiện', type: 'error', isVisible: true })
    }
  }

  const handleRejectEvent = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối sự kiện này?')) return
    try {
      await updateEventStatus(id, 'rejected')
      setToast({ message: 'Đã từ chối sự kiện', type: 'success', isVisible: true })
      fetchEvents()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi từ chối sự kiện', type: 'error', isVisible: true })
    }
  }

  if (isLoading && !stats) return <div className="min-h-screen pt-20 flex justify-center">Đang tải...</div>

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] px-4 pb-20">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">Xin chào, Admin</div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition-colors ${activeTab === 'overview' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-4 font-medium transition-colors ${activeTab === 'posts' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Duyệt bài viết <span className="ml-2 bg-red-100 text-red-600 text-xs py-0.5 px-2 rounded-full">{stats?.pending_posts || 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 font-medium transition-colors ${activeTab === 'events' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Duyệt sự kiện <span className="ml-2 bg-red-100 text-red-600 text-xs py-0.5 px-2 rounded-full">{stats?.pending_events || 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-4 font-medium transition-colors ${activeTab === 'reports' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Báo cáo
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-blue-500 font-medium mb-2">Tổng người dùng</h3>
                  <p className="text-3xl font-bold text-blue-900">{stats.total_users}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <h3 className="text-green-500 font-medium mb-2">Tổng bài viết</h3>
                  <p className="text-3xl font-bold text-green-900">{stats.total_posts}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <h3 className="text-purple-500 font-medium mb-2">Tổng sự kiện</h3>
                  <p className="text-3xl font-bold text-purple-900">{stats.total_events}</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                  <h3 className="text-orange-500 font-medium mb-2">Chờ duyệt</h3>
                  <p className="text-3xl font-bold text-orange-900">{stats.pending_posts + stats.pending_events}</p>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">Tiêu đề</th>
                      <th className="py-3 px-4">Tác giả</th>
                      <th className="py-3 px-4">Danh mục</th>
                      <th className="py-3 px-4">Ngày tạo</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {posts.length > 0 ? (
                      posts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-medium text-gray-900 max-w-xs truncate" title={post.title}>{post.title}</td>
                          <td className="py-4 px-4 text-gray-600">{post.author_name}</td>
                          <td className="py-4 px-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs uppercase">{post.category}</span>
                          </td>
                          <td className="py-4 px-4 text-gray-500 text-sm">{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <button 
                              onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
                            >
                              Xem
                            </button>
                            <button 
                              onClick={() => handleApprovePost(post.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleRejectPost(post.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium px-3 py-1 rounded"
                            >
                              Từ chối
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Không có bài viết nào chờ duyệt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">Tên sự kiện</th>
                      <th className="py-3 px-4">Ban tổ chức</th>
                      <th className="py-3 px-4">Địa điểm</th>
                      <th className="py-3 px-4">Ngày diễn ra</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.length > 0 ? (
                      events.map(event => (
                        <tr key={event.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-medium text-gray-900 max-w-xs truncate" title={event.title}>{event.title}</td>
                          <td className="py-4 px-4 text-gray-600">{event.organizer_name}</td>
                          <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{event.location}</td>
                          <td className="py-4 px-4 text-gray-500 text-sm">{new Date(event.date).toLocaleDateString('vi-VN')}</td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <button 
                              onClick={() => window.open(`/events/${event.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
                            >
                              Xem
                            </button>
                            <button 
                              onClick={() => handleApproveEvent(event.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleRejectEvent(event.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium px-3 py-1 rounded"
                            >
                              Từ chối
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Không có sự kiện nào chờ duyệt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
               <div className="text-center py-12">
                 <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">Chưa có báo cáo nào</h3>
                 <p className="text-gray-500 mt-1">Hiện tại không có báo cáo vi phạm nào cần xử lý.</p>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

