'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { register as registerUser } from '@/lib/api/auth-service'

const HERO_IMAGE = '/Image/Login Image.png?v=20241127'
const TESTIMONIAL_AVATAR = '/Image/Run 6.png'

const INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/20 px-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

export default function RegisterPage() {
  const router = useRouter()
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const normalizeMessage = (detail: unknown): string => {
    if (!detail) return 'Đăng ký thất bại. Vui lòng thử lại.'
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            return (item as { msg?: string }).msg ?? JSON.stringify(item)
          }
          return String(item)
        })
        .join(', ')
    }
    if (typeof detail === 'object') {
      if ((detail as { msg?: string }).msg) {
        return (detail as { msg: string }).msg
      }
      if ((detail as { detail?: string }).detail) {
        return (detail as { detail: string }).detail
      }
      return JSON.stringify(detail)
    }
    return 'Đăng ký thất bại. Vui lòng thử lại.'
  }

  const triggerToast = (message: string) => {
    setToastMessage(message)
    setIsToastVisible(true)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = setTimeout(() => setIsToastVisible(false), 4500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'password' || name === 'confirmPassword') {
        setConfirmError(
          next.confirmPassword && next.password !== next.confirmPassword
            ? 'Mật khẩu xác nhận không khớp.'
            : '',
        )
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setConfirmError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (formData.password.length < 6) {
      triggerToast('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setIsLoading(true)
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        date_of_birth: '2000-01-01',
        gender: 'other',
        running_experience: 'beginner',
        address: undefined,
        goals: undefined,
      })
      // Add a small delay or immediate redirect. Router.push might be async/slow.
      // Using window.location.href ensures a full page reload to login, clearing any potential state issues.
      window.location.href = '/login'
    } catch (err: any) {
      // Enhanced error logging
      console.error('Registration error full object:', err);
      
      let detail = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (err.response) {
          // Server responded with a status code that falls out of the range of 2xx
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          console.error('Response headers:', err.response.headers);
          detail = err.response.data?.detail || `Server Error: ${err.response.status}`;
      } else if (err.request) {
          // The request was made but no response was received
          console.error('Request error (no response):', err.request);
          detail = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Setup error:', err.message);
          detail = err.message;
      }

      triggerToast(normalizeMessage(detail))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {isToastVisible && (
        <div className="fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-[24px] border border-red-300 bg-[#dc2626] px-5 py-4 text-white shadow-2xl">
          <div className="mt-0.5">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-5">Đăng ký thất bại</p>
            <p className="text-sm leading-5 text-white/90">{toastMessage}</p>
          </div>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={() => setIsToastVisible(false)}
            className="rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Mobile hero */}
        <div className="relative h-[280px] w-full overflow-hidden bg-black lg:hidden">
          <Image src={HERO_IMAGE} alt="Runner preparing for a race" fill className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        {/* Hero panel */}
        <div className="relative hidden min-h-screen w-full max-w-[640px] flex-shrink-0 overflow-hidden bg-black lg:block">
          <Image src={HERO_IMAGE} alt="Runner preparing for a race" fill className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/0 to-black/70" />

          <div className="absolute bottom-16 left-1/2 w-[85%] max-w-[480px] -translate-x-1/2 rounded-[24px] border border-white/30 bg-white/60 p-6 backdrop-blur-[18px]">
            <p className="text-base leading-6 text-black/90">
              Gia nhập PaceUp để nhận tài liệu luyện tập, cập nhật giải chạy mới nhất và kết nối cộng đồng runner khắp
              Việt Nam.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-[10px]">
                <Image src={TESTIMONIAL_AVATAR} alt="Đại sứ PaceUp" fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-black/90">Trần Minh Phúc</p>
                <p className="text-sm text-black/60">PaceUp Ambassador</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-20">
          <div className="w-full max-w-[780px] space-y-8">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-black/50">PACEUP COMMUNITY</p>
              <h1 className="text-3xl font-semibold tracking-tight text-black md:text-[36px]">
                Tạo Tài Khoản Runner Của Bạn
              </h1>
              <p className="text-base leading-6 text-black/80">
                Điền thông tin bên dưới để bắt đầu lưu trữ thành tích và đăng ký các giải chạy đang mở.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm text-black/60">
                    Họ và tên *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-black/60">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm text-black/60">
                    Số điện thoại *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="0123456789"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-black/60">
                    Mật khẩu *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm text-black/60">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="space-y-2">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={INPUT_CLASS}
                      placeholder="Nhập lại mật khẩu"
                    />
                    {confirmError && <p className="text-sm text-[#dc2626]">{confirmError}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative h-[54px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white btn-inner-shadow transition-opacity disabled:opacity-60"
                >
                  {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                </button>
                <p className="text-center text-base text-black/70">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="font-medium text-black underline">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
