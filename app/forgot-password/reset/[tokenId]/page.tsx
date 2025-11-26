'use client'

import { FormEvent, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '@/lib/api/password-reset'

export default function ResetPasswordPage() {
  const params = useParams<{ tokenId: string }>()
  const router = useRouter()
  const resetSessionId = decodeURIComponent(params.tokenId ?? '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordsMatch = password.length >= 6 && password === confirmPassword

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resetSessionId || !passwordsMatch || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)
      await resetPassword(resetSessionId, password)
      router.push('/login')
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-[100px] pb-12 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Đặt lại mật khẩu
          </h1>
          <p className="text-sm text-neutral-500">
            Nhập mật khẩu mới cho tài khoản của bạn. Hãy chọn mật khẩu khó đoán
            nhưng dễ nhớ với bạn.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-neutral-700"
            >
              Mật khẩu mới
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
              placeholder="Nhập mật khẩu mới"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-neutral-700"
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          {password && confirmPassword && !passwordsMatch && (
            <p className="text-sm text-red-600">
              Mật khẩu xác nhận không khớp.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!passwordsMatch || isSubmitting}
            className="h-[50px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_12px_rgba(255,255,255,0.25)] disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Quay lại{' '}
          <Link
            href="/login"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            trang đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}


