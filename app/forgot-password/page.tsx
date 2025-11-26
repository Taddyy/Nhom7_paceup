'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPasswordReset } from '@/lib/api/password-reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)
      await requestPasswordReset(email)
      setInfo('Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.')
      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-[120px] pb-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-semibold text-[#1c1c1c] mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Nhập email bạn đã dùng để đăng ký tài khoản PaceUp. Chúng tôi sẽ gửi mã 6 ký tự để bạn đặt lại
          mật khẩu.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {info && <p className="mb-4 text-sm text-emerald-600">{info}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@domain.com"
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_16px_rgba(255,255,255,0.3)] transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi mã đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/api/password-reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)
      await requestPasswordReset(email)
      router.push(`/forgot-password/verify/${encodeURIComponent(email)}`)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại sau.'
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
            Quên mật khẩu
          </h1>
          <p className="text-sm text-neutral-500">
            Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi mã 6 ký tự để
            bạn đặt lại mật khẩu.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="reset-email"
              className="text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[56px] w-full rounded-[12px] border border-black/20 px-4 text-base text-[#1c1c1c] placeholder-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all"
              placeholder="nhapemail@vidu.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[50px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_12px_rgba(255,255,255,0.25)] disabled:opacity-60"
          >
            {isSubmitting ? 'Đang gửi mã...' : 'Gửi mã đặt lại mật khẩu'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Nhớ mật khẩu rồi?{' '}
          <Link
            href="/login"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPasswordReset } from '@/lib/api/password-reset'

const INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/20 px-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)

    try {
      setIsSubmitting(true)
      await requestPasswordReset(email)
      setInfo('Nếu email tồn tại, mã xác nhận sẽ được gửi tới hộp thư của bạn.')
      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? 'Không thể gửi mã. Vui lòng thử lại sau.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-[120px] pb-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-semibold text-[#1c1c1c] mb-2">Quên mật khẩu?</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Nhập email bạn đã dùng để đăng ký tài khoản. Chúng tôi sẽ gửi mã xác nhận gồm 6 ký tự để bạn đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@paceup.vn"
              className={INPUT_CLASS}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_16px_rgba(255,255,255,0.3)] disabled:opacity-60"
          >
            {isSubmitting ? 'Đang gửi mã...' : 'Gửi mã'}
          </button>
        </form>
      </div>
    </div>
  )
}


