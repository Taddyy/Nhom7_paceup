'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { performPasswordReset } from '@/lib/api/password-reset'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!sessionId && typeof window !== 'undefined') {
    router.replace('/forgot-password')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await performPasswordReset(sessionId, password)
      setInfo('Đổi mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Không thể đặt lại mật khẩu. Mã phiên có thể đã hết hạn, vui lòng thử lại từ đầu.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-[120px] pb-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-semibold text-[#1c1c1c] mb-2">Đặt lại mật khẩu</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Nhập mật khẩu mới cho tài khoản của bạn. Hãy chọn mật khẩu mạnh và không dùng lại mật khẩu cũ.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {info && <p className="mb-4 text-sm text-emerald-600">{info}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Mật khẩu mới
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_16px_rgba(255,255,255,0.3)] transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
        </form>
      </div>
    </div>
  )
}


