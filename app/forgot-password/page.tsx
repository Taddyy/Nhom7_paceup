'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/api/password-reset'

const INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/20 px-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || isSubmitting) return

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
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Quên mật khẩu?
          </h1>
          <p className="text-sm text-neutral-500">
            Nhập email bạn đã dùng để đăng ký tài khoản. Chúng tôi sẽ gửi mã xác nhận gồm 6 ký tự để bạn đặt lại mật khẩu.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
              placeholder="email@paceup.vn"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-semibold uppercase tracking-[0.18em] text-white btn-inner-shadow disabled:opacity-60"
          >
            {isSubmitting ? 'Đang gửi mã...' : 'Gửi mã'}
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
