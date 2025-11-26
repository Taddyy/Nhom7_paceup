'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createBlogPost } from '@/lib/api/blog-service'
import Toast from '@/components/ui/Toast'
import RichTextEditor from '@/components/ui/RichTextEditor'
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect'

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Chung', value: 'general' },
  { label: 'Tập luyện', value: 'training' },
  { label: 'Dinh dưỡng', value: 'nutrition' },
  { label: 'Trang thiết bị', value: 'gear' },
  { label: 'Sự kiện', value: 'events' },
]

const INPUT_CLASS =
  'h-[60px] w-full rounded-[14px] border border-black/10 bg-white px-5 text-base text-[#1c1c1c] placeholder:text-neutral-400 shadow-[0_18px_45px_rgba(15,23,42,0.05)] focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all'
const LABEL_CLASS = 'text-sm font-medium text-neutral-600'
const SECTION_CARD_CLASS =
  'space-y-6 rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)]'

type ContentFormState = {
  title: string
  content: string
  category: string
  image_url: string
}

export default function CreateBlogPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  })

  const [formData, setFormData] = useState<ContentFormState>({
    title: '',
    content: '',
    category: 'general',
    image_url: '',
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [seoContent, setSeoContent] = useState<string>('')

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }))
  }

  const handleSEOContent = (content: string) => {
    setSeoContent(content)
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, image_url: data.url }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setToast({ message: 'Lỗi khi tải ảnh lên.', type: 'error', isVisible: true })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.title || !formData.content) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin.', type: 'error', isVisible: true })
      return
    }

    try {
      setIsLoading(true)
      const finalFormData = { ...formData }

      if (seoContent) {
        finalFormData.content += `
          <details style="display: none;">
            <summary>Hidden SEO Content</summary>
            ${seoContent}
          </details>
        `
      }

      await createBlogPost(finalFormData)
      setToast({ message: 'Bài viết đã được gửi và đang chờ đội ngũ phê duyệt.', type: 'success', isVisible: true })
      setTimeout(() => {
        router.push('/content')
      }, 1500)
    } catch (error) {
      console.error('Error creating post:', error)
      setToast({ message: 'Có lỗi xảy ra khi tạo bài viết.', type: 'error', isVisible: true })
    } finally {
      setIsLoading(false)
    }
  }

  const clearSelectedImage = () => {
    setPreviewImage(null)
    setFormData((prev) => ({ ...prev, image_url: '' }))
  }

  return (
    <div className="bg-[#F8F9FB] min-h-screen w-full pt-[140px] pb-20">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 lg:flex-row lg:px-0">
        <div className="space-y-3 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/40">Content Studio</p>
          <h1 className="text-3xl font-bold text-[#1c1c1c] md:text-[40px]">Xuất bản nội dung</h1>
          <p className="text-base text-neutral-500">
            Tạo bài viết nổi bật và tối ưu SEO nhờ khả năng đính kèm nội dung ẩn dành riêng cho bộ máy tìm kiếm.
          </p>
          <p className="text-sm text-neutral-400">
            * Nội dung sẽ hiển thị ở trang public sau khi admin phê duyệt (dự kiến trong 24 giờ).
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[1100px] flex-col gap-8 px-4 lg:flex-row lg:px-0">
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          <section className={SECTION_CARD_CLASS}>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-black/30">Bước 01</p>
              <h2 className="text-xl font-semibold text-[#1c1c1c]">Thông tin cơ bản</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor="title">
                  Tiêu đề bài viết
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={INPUT_CLASS}
                  placeholder="Ví dụ: Chiến lược dinh dưỡng trước ngày thi đấu"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor="category">
                  Danh mục
                </label>
                <CustomSelect
                  options={CATEGORY_OPTIONS}
                  value={formData.category}
                  onChange={handleCategoryChange}
                  placeholder="Chọn danh mục"
                  className="w-full"
                  width="100%"
                  variant="hero"
                />
              </div>
            </div>
          </section>

          <section className={SECTION_CARD_CLASS}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-black/30">Bước 02</p>
                <h2 className="text-xl font-semibold text-[#1c1c1c]">Ảnh bìa & SEO</h2>
                <p className="text-sm text-neutral-500">
                  Ảnh giúp bài viết nổi bật trên trang chủ và mạng xã hội. Có thể đính kèm tài liệu để trích xuất SEO.
                </p>
              </div>
              {previewImage && (
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[#1c1c1c] transition hover:border-black/40 hover:bg-black/5"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            <div className="group relative flex h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 text-center transition hover:border-black/40 hover:bg-white">
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Ảnh xem trước" fill className="object-cover" priority />
                  <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-neutral-500">
                  <svg className="h-12 w-12 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="text-base font-semibold text-[#1c1c1c]">Tải ảnh bìa</p>
                    <p className="text-sm">PNG, JPG hoặc WEBP (tối đa 5MB)</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </section>

          <section className={SECTION_CARD_CLASS}>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-black/30">Bước 03</p>
              <h2 className="text-xl font-semibold text-[#1c1c1c]">Nội dung chi tiết</h2>
              <p className="text-sm text-neutral-500">
                Soạn thảo nội dung chính và tải tài liệu để tự động trích xuất SEO ẩn. Người đọc chỉ thấy những gì bạn hiển thị.
              </p>
            </div>
            <RichTextEditor
              content={formData.content}
              onChange={handleEditorChange}
              onSEOContent={handleSEOContent}
              placeholder="Viết nội dung bài viết của bạn..."
            />
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-[56px] w-full rounded-[14px] border border-black/15 bg-white px-6 text-sm font-semibold uppercase tracking-[0.3em] text-[#1c1c1c] shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition hover:border-black/40 sm:w-auto"
              onClick={() => setToast({ message: 'Chức năng lưu nháp sắp ra mắt.', type: 'info', isVisible: true })}
            >
              Lưu nháp
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-[56px] w-full rounded-[14px] bg-[#1c1c1c] px-8 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.35),inset_4px_4px_8px_rgba(255,255,255,0.2)] transition hover:bg-[#0b0b0b] disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? 'Đang đăng bài...' : 'Xuất bản bài viết'}
            </button>
          </div>
        </form>

        <aside className="w-full space-y-6 lg:max-w-[320px]">
          <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
            <h3 className="text-lg font-semibold text-[#1c1c1c]">Tips SEO</h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Đính kèm tài liệu PDF/Docx để AI trích xuất nội dung ẩn cho SEO.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Giữ mỗi đoạn 2-3 câu để tăng khả năng đọc trên thiết bị di động.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Bổ sung số liệu/thống kê thực tế để tăng độ tin cậy.
              </li>
            </ul>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-gradient-to-br from-[#1c1c1c] to-[#3a3a3a] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Brand voice</p>
            <h3 className="mt-2 text-xl font-semibold">Thống nhất giọng điệu</h3>
            <p className="mt-3 text-sm text-white/80">
              Kết hợp kiến thức chuyên môn với ngôn ngữ gần gũi để người đọc cảm nhận PaceUp là người bạn đồng hành đáng tin cậy.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

