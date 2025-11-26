'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminStats, getAdminPosts, updatePostStatus, getAdminEvents, updateEventStatus, rejectEvent, getAdminReports, resolveReport, dismissReport, getAdminRegistrations, approveRegistration, rejectRegistration, type AdminStats, type EventRegistration, type RejectRegistrationRequest } from '@/lib/api/admin'
import { getCurrentUser, logout } from '@/lib/api/auth-service'
import type { BlogPost } from '@/lib/api/blog-service'
import type { Event } from '@/lib/api/events'
import type { Report } from '@/lib/api/reports'
import { deleteEmailSubscription, getEmailSubscriptions, type EmailSubscription } from '@/lib/api/email-subscriptions'
import Toast from '@/components/ui/Toast'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'events' | 'reports' | 'registrations' | 'emails'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [emailSubscriptions, setEmailSubscriptions] = useState<EmailSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({ message: '', type: 'success', isVisible: false })
  
  // Reject popup states
  const [rejectEventPopup, setRejectEventPopup] = useState<{ isOpen: boolean; eventId: string | null }>({ isOpen: false, eventId: null })
  const [rejectRegistrationPopup, setRejectRegistrationPopup] = useState<{ isOpen: boolean; registrationId: string | null }>({ isOpen: false, registrationId: null })
  const [rejectReasons, setRejectReasons] = useState<string[]>([])
  const [rejectDescription, setRejectDescription] = useState('')
  
  const rejectionReasonsList = [
    'Thông tin không chính xác',
    'Không đủ điều kiện tham gia',
    'Đăng ký trễ hạn',
    'Thiếu thông tin bắt buộc',
    'Không phù hợp với quy định',
    'Lý do khác'
  ]

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchStats()
    if (activeTab === 'posts') fetchPosts()
    if (activeTab === 'events') fetchEvents()
    if (activeTab === 'reports') fetchReports()
    if (activeTab === 'registrations') fetchRegistrations()
    if (activeTab === 'emails') fetchEmailSubscriptions()
  }, [activeTab])

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true)
      const user = await getCurrentUser()
      
      // Check if user is admin
      if (user.role !== 'admin' && user.email !== 'admin@gmail.com') {
        // Not an admin, redirect to home
        router.push('/')
        return
      }
      
      // Admin access confirmed, fetch initial data
      await fetchStats()
    } catch (error: any) {
      console.error('Admin access check failed:', error)
      
      // Only clear token if it's a real 401 Unauthorized error
      // Network errors or timeouts should not clear the token
      const isUnauthorized = error?.response?.status === 401
      
      if (isUnauthorized) {
        // Token is actually invalid - clear it and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
      } else {
        // Other errors (network, timeout, etc.) - show error but don't redirect
        // Allow user to retry without losing session
        setToast({ 
          message: 'Lỗi khi kiểm tra quyền admin. Vui lòng thử lại.', 
          type: 'error', 
          isVisible: true 
        })
        setIsLoading(false)
      }
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch admin stats:', error)
      
      // Only clear token if it's a real 401 Unauthorized error
      // Don't clear for network errors or timeouts
      if (error?.response?.status === 401) {
        // Token invalid or expired - clear it and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
        return
      }
      
      // Show error message for other errors
      setToast({ 
        message: 'Lỗi khi tải dữ liệu. Vui lòng thử lại.', 
        type: 'error', 
        isVisible: true 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const data = await getAdminPosts('pending')
      setPosts(data)
    } catch (error: any) {
      console.error('Failed to fetch admin posts:', error)
      
      // Only clear token if it's a real 401 Unauthorized error
      if (error?.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
        return
      }
      
      setToast({ 
        message: 'Lỗi khi tải danh sách bài viết.', 
        type: 'error', 
        isVisible: true 
      })
    }
  }

  const fetchEvents = async () => {
    try {
      const data = await getAdminEvents('pending')
      setEvents(data)
    } catch (error: any) {
      console.error('Failed to fetch admin events:', error)
      
      // Only clear token if it's a real 401 Unauthorized error
      if (error?.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
        return
      }
      
      setToast({ 
        message: 'Lỗi khi tải danh sách sự kiện.', 
        type: 'error', 
        isVisible: true 
      })
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

  const fetchReports = async () => {
    try {
      const data = await getAdminReports('pending')
      setReports(data)
    } catch (error: any) {
      console.error('Failed to fetch admin reports:', error)
      if (error?.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
        return
      }
      setToast({ 
        message: 'Lỗi khi tải danh sách báo cáo.', 
        type: 'error', 
        isVisible: true 
      })
    }
  }

  const fetchRegistrations = async () => {
    try {
      const data = await getAdminRegistrations('pending')
      setRegistrations(data)
    } catch (error: any) {
      console.error('Failed to fetch admin registrations:', error)
      if (error?.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/login')
        return
      }
      setToast({ 
        message: 'Lỗi khi tải danh sách đăng ký.', 
        type: 'error', 
        isVisible: true 
      })
    }
  }

  const fetchEmailSubscriptions = async () => {
    try {
      const data = await getEmailSubscriptions()
      setEmailSubscriptions(data.items)
    } catch (error: any) {
      console.error('Failed to fetch email subscriptions:', error)
      setToast({
        message: 'Lỗi khi tải danh sách email đăng ký.',
        type: 'error',
        isVisible: true,
      })
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
  
  const handleRejectReasonChange = (reason: string) => {
    setRejectReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }
  
  const handleOpenRejectEventPopup = (eventId: string) => {
    setRejectEventPopup({ isOpen: true, eventId })
    setRejectReasons([])
    setRejectDescription('')
  }
  
  const handleCloseRejectEventPopup = () => {
    setRejectEventPopup({ isOpen: false, eventId: null })
    setRejectReasons([])
    setRejectDescription('')
  }
  
  const handleSubmitRejectEvent = async () => {
    if (!rejectEventPopup.eventId) return
    if (rejectReasons.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất một lý do từ chối', type: 'error', isVisible: true })
      return
    }
    try {
      await rejectEvent(rejectEventPopup.eventId, {
        reasons: rejectReasons,
        description: rejectDescription || undefined
      })
      setToast({ message: 'Đã từ chối sự kiện', type: 'success', isVisible: true })
      handleCloseRejectEventPopup()
      fetchEvents()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi từ chối sự kiện', type: 'error', isVisible: true })
    }
  }
  
  const handleOpenRejectRegistrationPopup = (registrationId: string) => {
    setRejectRegistrationPopup({ isOpen: true, registrationId })
    setRejectReasons([])
    setRejectDescription('')
  }
  
  const handleCloseRejectRegistrationPopup = () => {
    setRejectRegistrationPopup({ isOpen: false, registrationId: null })
    setRejectReasons([])
    setRejectDescription('')
  }
  
  const handleSubmitRejectRegistration = async () => {
    if (!rejectRegistrationPopup.registrationId) return
    if (rejectReasons.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất một lý do từ chối', type: 'error', isVisible: true })
      return
    }
    try {
      await rejectRegistration(rejectRegistrationPopup.registrationId, {
        reasons: rejectReasons,
        description: rejectDescription || undefined
      })
      setToast({ message: 'Đã từ chối đăng ký', type: 'success', isVisible: true })
      handleCloseRejectRegistrationPopup()
      fetchRegistrations()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi từ chối đăng ký', type: 'error', isVisible: true })
    }
  }
  
  const handleResolveReport = async (reportId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return
    try {
      await resolveReport(reportId)
      setToast({ message: 'Đã xóa bài viết và giải quyết báo cáo', type: 'success', isVisible: true })
      fetchReports()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi xóa bài viết', type: 'error', isVisible: true })
    }
  }
  
  const handleDismissReport = async (reportId: string) => {
    if (!confirm('Bạn có chắc chắn muốn bỏ qua báo cáo này?')) return
    try {
      await dismissReport(reportId)
      setToast({ message: 'Đã bỏ qua báo cáo', type: 'success', isVisible: true })
      fetchReports()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi bỏ qua báo cáo', type: 'error', isVisible: true })
    }
  }
  
  const handleApproveRegistration = async (registrationId: string) => {
    try {
      await approveRegistration(registrationId)
      setToast({ message: 'Đã duyệt đăng ký', type: 'success', isVisible: true })
      fetchRegistrations()
      fetchStats()
    } catch (error) {
      setToast({ message: 'Lỗi khi duyệt đăng ký', type: 'error', isVisible: true })
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


  const handleLogout = () => {
    logout()
    router.push('/login')
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
          <div className="flex justify-between items-center border-b border-gray-200">
            <div className="flex">
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
                Báo cáo <span className="ml-2 bg-red-100 text-red-600 text-xs py-0.5 px-2 rounded-full">{stats?.pending_reports || 0}</span>
              </button>
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-6 py-4 font-medium transition-colors ${activeTab === 'registrations' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Đăng ký sự kiện <span className="ml-2 bg-red-100 text-red-600 text-xs py-0.5 px-2 rounded-full">{stats?.pending_registrations || 0}</span>
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-6 py-4 font-medium transition-colors ${activeTab === 'emails' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Email đăng ký
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 mx-4 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                  <h3 className="text-red-500 font-medium mb-2">Báo cáo</h3>
                  <p className="text-3xl font-bold text-red-900">{stats.pending_reports || 0}</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                  <h3 className="text-yellow-500 font-medium mb-2">Đăng ký chờ duyệt</h3>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pending_registrations || 0}</p>
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
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1 rounded"
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
                      <th className="py-3 px-4">Tài khoản nhận tiền</th>
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
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {event.bank_name && event.account_number && event.account_holder_name ? (
                              <div className="space-y-1">
                                <div className="font-medium">{event.bank_name}</div>
                                <div className="text-gray-500">{event.account_number}</div>
                                <div className="text-gray-500">{event.account_holder_name}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Chưa có thông tin</span>
                            )}
                          </td>
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
                              onClick={() => handleOpenRejectEventPopup(event.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Từ chối
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">Không có sự kiện nào chờ duyệt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">ID Bài viết</th>
                      <th className="py-3 px-4">Người báo cáo</th>
                      <th className="py-3 px-4">Lý do</th>
                      <th className="py-3 px-4">Mô tả</th>
                      <th className="py-3 px-4">Ngày báo cáo</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.length > 0 ? (
                      reports.map(report => (
                        <tr key={report.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-medium text-gray-900">
                            <button 
                              onClick={() => window.open(`/content`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {report.post_id.substring(0, 8)}...
                            </button>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{report.reporter_name}</td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {report.reasons.map((reason, idx) => (
                                <span key={idx} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm max-w-xs truncate" title={report.description}>
                            {report.description || '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-500 text-sm">{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <button 
                              onClick={() => handleResolveReport(report.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Xóa bài
                            </button>
                            <button 
                              onClick={() => handleDismissReport(report.id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Xóa báo cáo
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">Không có báo cáo nào cần xử lý.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">Sự kiện</th>
                      <th className="py-3 px-4">Người đăng ký</th>
                      <th className="py-3 px-4">Hạng mục</th>
                      <th className="py-3 px-4">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.length > 0 ? (
                      registrations.map(registration => (
                        <tr key={registration.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-medium text-gray-900 max-w-xs truncate" title={registration.event_title}>
                            {registration.event_title}
                          </td>
                          <td className="py-4 px-4 text-gray-600">{registration.user_name}</td>
                          <td className="py-4 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {registration.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-500 text-sm">{new Date(registration.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <button 
                              onClick={() => handleApproveRegistration(registration.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleOpenRejectRegistrationPopup(registration.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1 rounded"
                            >
                              Từ chối
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Không có đăng ký nào chờ duyệt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Email Subscriptions Tab */}
            {activeTab === 'emails' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Nguồn</th>
                      <th className="py-3 px-4">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {emailSubscriptions.length > 0 ? (
                      emailSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-4 font-medium text-gray-900">{sub.email}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {sub.source === 'cta_home' ? 'CTA Trang chủ' : sub.source || 'Không rõ'}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-sm">
                            {new Date(sub.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa email này khỏi danh sách?')) return
                                try {
                                  await deleteEmailSubscription(sub.id)
                                  setEmailSubscriptions((prev) => prev.filter((item) => item.id !== sub.id))
                                  setToast({
                                    message: 'Đã xóa email đăng ký.',
                                    type: 'success',
                                    isVisible: true,
                                  })
                                } catch (error) {
                                  console.error('Failed to delete email subscription:', error)
                                  setToast({
                                    message: 'Không thể xóa email, vui lòng thử lại.',
                                    type: 'error',
                                    isVisible: true,
                                  })
                                }
                              }}
                              className="bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium px-3 py-1 rounded"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          Chưa có email đăng ký nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Reject Event Popup */}
      {rejectEventPopup.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Từ chối sự kiện</h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <label className="text-sm font-medium text-neutral-700">Lý do từ chối (có thể chọn nhiều)</label>
              {rejectionReasonsList.map((reason) => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(reason)}
                    onChange={() => handleRejectReasonChange(reason)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#000] focus:ring-2 focus:ring-[#1c1c1c] checked:bg-[#000] checked:border-[#000]"
                    style={{ accentColor: '#000' }}
                  />
                  <span className="text-sm text-neutral-700">{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label htmlFor="reject-description" className="block text-sm font-medium text-neutral-700 mb-2">
                Mô tả thêm (tùy chọn)
              </label>
              <textarea
                id="reject-description"
                value={rejectDescription}
                onChange={(e) => setRejectDescription(e.target.value)}
                placeholder="Nhập mô tả thêm nếu cần..."
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseRejectEventPopup}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitRejectEvent}
                disabled={rejectReasons.length === 0}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Registration Popup */}
      {rejectRegistrationPopup.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Từ chối đăng ký</h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <label className="text-sm font-medium text-neutral-700">Lý do từ chối (có thể chọn nhiều)</label>
              {rejectionReasonsList.map((reason) => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(reason)}
                    onChange={() => handleRejectReasonChange(reason)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#000] focus:ring-2 focus:ring-[#1c1c1c] checked:bg-[#000] checked:border-[#000]"
                    style={{ accentColor: '#000' }}
                  />
                  <span className="text-sm text-neutral-700">{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label htmlFor="reject-reg-description" className="block text-sm font-medium text-neutral-700 mb-2">
                Mô tả thêm (tùy chọn)
              </label>
              <textarea
                id="reject-reg-description"
                value={rejectDescription}
                onChange={(e) => setRejectDescription(e.target.value)}
                placeholder="Nhập mô tả thêm nếu cần..."
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseRejectRegistrationPopup}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitRejectRegistration}
                disabled={rejectReasons.length === 0}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

