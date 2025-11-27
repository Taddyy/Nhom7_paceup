'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '@/lib/api/auth-service'

const HERO_IMAGE = '/Image/Login.png'
const TESTIMONIAL_AVATAR = '/Image/Run 4.png'

/**
 * Login page component matching the Figma specification.
 *
 * Mirrors the two-panel layout: immersive hero with testimonial (left)
 * and minimalist form (right).
 */
export default function LoginPage() {
  const router = useRouter()
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Đồng bộ token Google từ query ?googleToken=... và chuyển user về trang chủ
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const googleToken = params.get('googleToken')
    if (googleToken) {
      localStorage.setItem('token', googleToken)
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const triggerErrorToast = (message: string) => {
    setToastMessage(message)
    setIsToastVisible(true)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = setTimeout(() => {
      setIsToastVisible(false)
    }, 4500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(formData)
      router.push('/')
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.'
      triggerErrorToast(message)
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const sharedInputClasses =
    'h-[62px] w-full rounded-[12px] border border-black/25 px-6 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all'

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide browser autofill icons */
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-strong-password-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none !important;
        }
        #password::-webkit-credentials-auto-fill-button,
        #password::-webkit-strong-password-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        #password::-ms-reveal,
        #password::-ms-clear {
          display: none !important;
        }
      `}} />
      <div className="bg-white min-h-screen">
      {isToastVisible && (
        <div
          className="fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-[24px] border border-red-300 bg-[#dc2626] px-5 py-4 text-white shadow-2xl"
          role="alert"
          aria-live="assertive"
        >
          <div className="mt-0.5">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-5">Đăng nhập thất bại</p>
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
        {/* Hero panel */}
        <div className="relative hidden min-h-screen w-full max-w-[640px] flex-shrink-0 overflow-hidden bg-black lg:block">
          <Image src={HERO_IMAGE} alt="Runner preparing for a race" fill className="object-cover" priority />

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/60" />

          {/* Testimonial */}
          <div className="absolute bottom-16 left-1/2 w-[85%] max-w-[480px] -translate-x-1/2 rounded-[24px] border border-white/30 bg-white/60 p-6 backdrop-blur-[18px]">
            <p className="text-base leading-6 text-black/90">
              PaceUp giúp tôi nhiều trong việc đăng kí nhanh gọn, các sản phẩm hỗ trợ cuộc thi được giao nhanh chóng!
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="relative h-16 w-16 overflow-hidden rounded-[10px]">
                <Image src={TESTIMONIAL_AVATAR} alt="Nguyễn Hùng" fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-black/90">Nguyễn Hùng</p>
                <p className="text-sm text-black/60">Runner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-20">
          <div className="w-full max-w-[640px] space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-black md:text-[36px]">
                Chào Mừng Trở Lại, Runner!
              </h1>
              <p className="text-base leading-6 text-black/80">
                Đăng nhập để theo dõi tiến bộ chạy bộ, nhận thông báo sự kiện và kết nối cộng đồng giải chạy Việt Nam.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-base text-black/50">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email của bạn"
                  value={formData.email}
                  onChange={handleChange}
                  className={sharedInputClasses}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-base text-black/50">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    placeholder="*******"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${sharedInputClasses} pr-14`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-10 text-black hover:opacity-70 transition-opacity"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12C2.73 7.11 7 4 12 4s9.27 3.11 11 8c-1.73 4.89-6 8-11 8S2.73 16.89 1 12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 15.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      {isPasswordVisible ? (
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" />
                      ) : null}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white btn-inner-shadow transition-opacity disabled:opacity-60"
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="mx-auto block text-sm font-medium text-black hover:text-black/70 underline-offset-4 hover:underline"
                >
                  Quên mật khẩu?
                </button>
                <p className="text-center text-base text-black/70">
                  Chưa có tài khoản?{' '}
                  <Link href="/register" className="font-medium text-black underline">
                    Đăng kí ngay
                  </Link>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-black/10" />
                <p className="text-base text-black/40">Hoặc</p>
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/api/v1/auth/google/login'
                }}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[12px] border border-black/10 bg-gradient-to-b from-white to-[#dfdfdf] text-sm font-medium uppercase text-black shadow-[inset_-3px_-3px_3px_rgba(0,0,0,0.12),inset_2px_2px_3px_rgba(0,0,0,0.1)]"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
                </svg>
                Tiếp tục với Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
