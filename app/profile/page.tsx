'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCurrentUser, updateProfile, getJoinedEvents, logout, type UserUpdate, type User } from '@/lib/api/auth-service'
import { deleteBlogPost, getBlogPosts, type BlogPost } from '@/lib/api/blog-service'
import { getEvents, type Event } from '@/lib/api/events'
import EventCard from '@/components/events/EventCard'
import Toast from '@/components/ui/Toast'
import Cropper, { Area } from 'react-easy-crop'
import getCroppedImg from '@/lib/utils/cropImage'
import CustomSelect from '@/components/ui/CustomSelect'

const INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/20 px-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

const TEXTAREA_CLASS =
  'w-full rounded-[12px] border border-black/20 p-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

const DISABLED_INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/10 bg-gray-50 px-5 text-base text-gray-500'

// const INPUT_CLASS = ...

type Tab = 'profile' | 'articles' | 'blogs' | 'events_joined' | 'events_created'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Data states
  const [myPosts, setMyPosts] = useState<BlogPost[]>([])
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([])
  const [createdEvents, setCreatedEvents] = useState<Event[]>([])

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({ message: '', type: 'success', isVisible: false })

  // Form state
  const [formData, setFormData] = useState<UserUpdate>({})

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      if (activeTab === 'blogs') fetchMyPosts()
      if (activeTab === 'events_joined') fetchJoinedEvents()
      if (activeTab === 'events_created') fetchCreatedEvents()
    }
  }, [activeTab, user?.id])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const userData = await getCurrentUser()
      setUser(userData)
      setFormData({
        full_name: userData.full_name,
        phone: (userData as any).phone || '',
        date_of_birth: (userData as any).date_of_birth?.split('T')[0] || '', // Format for input type="date"
        gender: (userData as any).gender || '',
        address: (userData as any).address || '',
        running_experience: (userData as any).running_experience || '',
        goals: (userData as any).goals || '',
        avatar: (userData as any).avatar || ''
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyPosts = async () => {
    try {
      if (!user?.id) return
      const res = await getBlogPosts(1, 100, user.id)
      setMyPosts(res.posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const handleDeleteBlog = async (postId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá blog này?')) {
      return
    }
    try {
      await deleteBlogPost(postId)
      setMyPosts(prev => prev.filter(post => post.id !== postId))
      setToast({ message: 'Đã xoá blog thành công.', type: 'success', isVisible: true })
    } catch (error) {
      console.error('Error deleting blog post:', error)
      setToast({ message: 'Không thể xoá blog. Vui lòng thử lại.', type: 'error', isVisible: true })
    }
  }

  const fetchJoinedEvents = async () => {
    try {
      const events = await getJoinedEvents()
      setJoinedEvents(events)
    } catch (error) {
      console.error('Error fetching joined events:', error)
    }
  }

  const fetchCreatedEvents = async () => {
    try {
      if (!user?.id) return
      const res = await getEvents(1, 100, user.id)
      setCreatedEvents(res.events)
    } catch (error) {
      console.error('Error fetching created events:', error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      // Filter out empty strings to avoid sending them if not intended (optional, but good for enums)
      const dataToSend = { ...formData }
      if (!dataToSend.gender) delete dataToSend.gender
      if (!dataToSend.running_experience) delete dataToSend.running_experience

      await updateProfile(dataToSend)
      window.dispatchEvent(new Event('user:updated'))
      setToast({ message: 'Cập nhật thông tin thành công!', type: 'success', isVisible: true })
      fetchUserData() // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error)
      setToast({ message: 'Có lỗi xảy ra khi cập nhật.', type: 'error', isVisible: true })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const imageDataUrl = await readFile(file)
      setImageSrc(imageDataUrl)
      setIsCropModalOpen(true)
    }
  }

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(reader.result as string), false)
      reader.readAsDataURL(file)
    })
  }

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return
      
      setIsSaving(true)
      
      let croppedImageBlob: Blob | null = null
      let uploadAttempts = 0
      const maxUploadAttempts = 3
      
      // Retry loop: compress and upload, retry with more aggressive compression if needed
      while (uploadAttempts < maxUploadAttempts) {
        uploadAttempts++
        
        try {
          // Step 1: Crop and compress image
          // On retry, use forceSmaller flag for more aggressive compression
          croppedImageBlob = await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            0, // rotation
            { horizontal: false, vertical: false }, // flip
            uploadAttempts > 1 // forceSmaller on retry
          )

          if (!croppedImageBlob) {
            // This should never happen with improved compression, but handle it gracefully
            throw new Error('Không thể xử lý ảnh. Vui lòng thử lại.')
          }

          // Log compression info for debugging
          const fileSizeKB = Math.round(croppedImageBlob.size / 1024)
          console.log(`Upload attempt ${uploadAttempts}: Image compressed to ${fileSizeKB}KB`)

          // Create form data to upload
          const formData = new FormData()
          formData.append('file', croppedImageBlob, 'avatar.jpg')

          // Step 2: Upload to API
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.error || errorData.message || 'Upload failed'
            
            // If error indicates we should retry (size error with retry flag) and we have retries left
            if ((errorMessage.includes('quá lớn') || errorData.retry) && uploadAttempts < maxUploadAttempts) {
              console.log(`Upload failed due to size, retrying with more aggressive compression (attempt ${uploadAttempts + 1}/${maxUploadAttempts})`)
              // Wait a bit before retrying to allow UI to update
              await new Promise(resolve => setTimeout(resolve, 100))
              // Continue to retry with forceSmaller flag
              continue
            }
            
            throw new Error(errorMessage)
          }

          const data = await response.json()
          
          if (!data.url) {
            throw new Error('No image URL returned from upload')
          }
          
          // Step 3: Update profile with new avatar URL
          await updateProfile({ avatar: data.url })
          window.dispatchEvent(new Event('user:updated'))
          
          setToast({ message: 'Cập nhật ảnh đại diện thành công!', type: 'success', isVisible: true })
          setIsCropModalOpen(false)
          fetchUserData()
          return // Success, exit retry loop
          
        } catch (uploadError: any) {
          // If this is not a size error or we're out of retries, throw immediately
          if (!uploadError.message?.includes('quá lớn') || uploadAttempts >= maxUploadAttempts) {
            throw uploadError
          }
          // Otherwise, continue retry loop
        }
      }
      
      // Should never reach here, but just in case
      throw new Error('Không thể upload ảnh sau nhiều lần thử.')
      
    } catch (e: any) {
      console.error('Upload error:', e)
      const errorMessage = e?.response?.data?.detail || e?.message || 'Lỗi khi cập nhật ảnh.'
      setToast({ message: errorMessage, type: 'error', isVisible: true })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-[100px]">Đang tải...</div>
  }

  return (
    <div className="bg-white min-h-screen w-full pt-[100px] pb-20">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Chỉnh sửa ảnh đại diện</h3>
            <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden mb-4">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              )}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-500">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={showCroppedImage}
                disabled={isSaving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-70"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu ảnh'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Trang Cá Nhân</h1>

        {/* Profile Header & Avatar */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="relative group cursor-pointer">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg group-hover:border-black/20 transition">
               {user?.avatar ? (
                 <Image 
                   src={user.avatar} 
                   alt={user.full_name} 
                   fill 
                   className="object-cover"
                 />
               ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl font-bold uppercase">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
               )}
               
               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
               </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{user?.full_name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <button 
              onClick={handleLogout}
              className="mt-3 text-red-500 hover:text-red-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center overflow-x-auto gap-2 mb-8 border-b border-gray-200 pb-1 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-t-lg whitespace-nowrap font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-100 text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}
          >
            Thông tin cá nhân
          </button>
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 rounded-t-lg whitespace-nowrap font-medium transition-colors ${activeTab === 'articles' ? 'bg-gray-100 text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}
          >
            Bài viết của tôi
          </button>
          <button 
            onClick={() => setActiveTab('blogs')}
            className={`px-6 py-3 rounded-t-lg whitespace-nowrap font-medium transition-colors ${activeTab === 'blogs' ? 'bg-gray-100 text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}
          >
            Blog của tôi
          </button>
          <button 
            onClick={() => setActiveTab('events_joined')}
            className={`px-6 py-3 rounded-t-lg whitespace-nowrap font-medium transition-colors ${activeTab === 'events_joined' ? 'bg-gray-100 text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}
          >
            Sự kiện tham gia
          </button>
          <button 
            onClick={() => setActiveTab('events_created')}
            className={`px-6 py-3 rounded-t-lg whitespace-nowrap font-medium transition-colors ${activeTab === 'events_created' ? 'bg-gray-100 text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}
          >
            Sự kiện đã tạo
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleInputChange}
                    className={INPUT_CLASS}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email (Không thể thay đổi)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={DISABLED_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className={INPUT_CLASS}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth || ''}
                    onChange={handleInputChange}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                  <CustomSelect
                    options={[
                      { label: 'Chọn giới tính', value: '' },
                      { label: 'Nam', value: 'male' },
                      { label: 'Nữ', value: 'female' },
                      { label: 'Khác', value: 'other' }
                    ]}
                    value={formData.gender || ''}
                    onChange={(value) => handleInputChange({ target: { name: 'gender', value } } as React.ChangeEvent<HTMLSelectElement>)}
                    placeholder="Chọn giới tính"
                    variant="default"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Kinh nghiệm chạy bộ</label>
                  <CustomSelect
                    options={[
                      { label: 'Chọn kinh nghiệm', value: '' },
                      { label: 'Người mới (Beginner)', value: 'beginner' },
                      { label: 'Trung bình (Intermediate)', value: 'intermediate' },
                      { label: 'Nâng cao (Advanced)', value: 'advanced' },
                      { label: 'Chuyên gia (Expert)', value: 'expert' }
                    ]}
                    value={formData.running_experience || ''}
                    onChange={(value) => handleInputChange({ target: { name: 'running_experience', value } } as React.ChangeEvent<HTMLSelectElement>)}
                    placeholder="Chọn kinh nghiệm"
                    variant="default"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className={INPUT_CLASS}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mục tiêu</label>
                <textarea
                  name="goals"
                  value={formData.goals || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className={TEXTAREA_CLASS}
                  placeholder="Chia sẻ mục tiêu tập luyện của bạn..."
                />
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'articles' && (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500 text-center max-w-xl">
                Tính năng lưu trữ <span className="font-semibold">bài viết</span> đang được phát triển. 
                Trong tương lai, các bài đăng bạn tạo ở mục <span className="font-semibold">Nội dung</span> sẽ xuất hiện tại đây.
              </p>
            </div>
          )}

          {activeTab === 'blogs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {myPosts.length > 0 ? (
                myPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col gap-4 group border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow bg-white"
                  >
                    <Link
                      href={`/blog/${post.id}`}
                      className="relative h-[220px] w-full rounded-lg overflow-hidden"
                    >
                      <Image
                        src={post.image_url || '/Image/Event.png'}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    </Link>
                    <div className="flex-1 flex flex-col gap-2">
                      <h3 className="font-bold text-xl group-hover:text-blue-600 transition line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {post.excerpt || post.content}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                        <span className="capitalize">
                          {post.status === 'approved'
                            ? 'Đã duyệt'
                            : post.status === 'rejected'
                            ? 'Bị từ chối'
                            : 'Đang chờ duyệt'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteBlog(post.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 7h12M10 11v6m4-6v6M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM5 7h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7z"
                          />
                        </svg>
                        Xoá blog
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-10">
                  Bạn chưa có blog nào.
                </p>
              )}
            </div>
          )}

          {activeTab === 'events_joined' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedEvents.length > 0 ? (
                joinedEvents.map((event) => (
                  <EventCard 
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    image={event.image_url}
                    date={new Date(event.date).toLocaleDateString('vi-VN')}
                    location={event.location}
                    participants={event.participants_count}
                    distance={event.categories?.[0] || 'N/A'}
                    status={new Date(event.registration_deadline) > new Date() ? 'open' : 'closed'}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-10">Bạn chưa tham gia sự kiện nào.</p>
              )}
            </div>
          )}

          {activeTab === 'events_created' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdEvents.length > 0 ? (
                createdEvents.map((event) => (
                  <EventCard 
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    image={event.image_url}
                    date={new Date(event.date).toLocaleDateString('vi-VN')}
                    location={event.location}
                    participants={event.participants_count}
                    distance={event.categories?.[0] || 'N/A'}
                    status={new Date(event.registration_deadline) > new Date() ? 'open' : 'closed'}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-10">Bạn chưa tạo sự kiện nào.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
