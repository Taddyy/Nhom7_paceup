'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createBlogPost } from '@/lib/api/blog-service'
import Toast from '@/components/ui/Toast'
import RichTextEditor from '@/components/ui/RichTextEditor'

export default function CreateBlogPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' as const, isVisible: false })
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    image_url: '',
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

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
      setFormData(prev => ({ ...prev, image_url: data.url }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setToast({ message: 'Lỗi khi tải ảnh lên.', type: 'error', isVisible: true })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin.', type: 'error', isVisible: true })
      return
    }

    try {
      setIsLoading(true)
      await createBlogPost(formData)
      setToast({ message: 'Tạo bài viết thành công!', type: 'success', isVisible: true })
      setTimeout(() => {
        router.push('/blog')
      }, 1500)
    } catch (error) {
      console.error('Error creating post:', error)
      setToast({ message: 'Có lỗi xảy ra khi tạo bài viết.', type: 'error', isVisible: true })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen w-full pt-[150px] pb-20">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <div className="max-w-[800px] mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Tạo Bài Viết Mới</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tiêu đề bài viết</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="Nhập tiêu đề..."
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Danh mục</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
            >
              <option value="general">Chung</option>
              <option value="training">Tập luyện</option>
              <option value="nutrition">Dinh dưỡng</option>
              <option value="gear">Trang thiết bị</option>
              <option value="events">Sự kiện</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ảnh bìa</label>
            <div className="relative w-full h-[300px] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer hover:bg-gray-50 transition">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">Nhấn để tải ảnh lên</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nội dung</label>
            <RichTextEditor
              content={formData.content}
              onChange={handleEditorChange}
              placeholder="Viết nội dung bài viết của bạn..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-70 shadow-lg"
            >
              {isLoading ? 'Đang đăng bài...' : 'Đăng bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

