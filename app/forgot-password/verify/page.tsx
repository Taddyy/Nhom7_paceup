'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyResetCode } from '@/lib/api/password-reset'

const CODE_LENGTH = 6
const RESEND_SECONDS = 60

export default function VerifyResetCodePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remaining, setRemaining] = useState<number>(RESEND_SECONDS)

  useEffect(() => {
    if (!email) {
      router.replace('/forgot-password')
    }
  }, [email, router])

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [remaining])

  const codeString = useMemo(() => code.join(''), [code])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)
    if (value && index < CODE_LENGTH - 1) {
      setActiveIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      setActiveIndex(index - 1)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || codeString.length !== CODE_LENGTH || isSubmitting) return
    try {
      setIsSubmitting(true)
      setError(null)
      const token = await verifyResetCode(email, codeString)
      router.push(`/forgot-password/reset?session=${encodeURIComponent(token.id)}`)
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    // Resend is wired via navigating back to forgot page; backend handles rate limiting if needed.
    router.push(`/forgot-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-[120px] pb-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-semibold text-[#1c1c1c] mb-2">Nhập mã xác nhận</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Chúng tôi đã gửi mã 6 ký tự tới email{' '}
          <span className="font-semibold text-[#1c1c1c]">{email}</span>. Vui lòng nhập mã để tiếp tục đặt
          lại mật khẩu.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="h-[56px] w-[48px] rounded-[12px] border border-black/20 text-center text-xl font-semibold text-[#1c1c1c] focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none"
                value={digit}
                autoFocus={index === activeIndex}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || codeString.length !== CODE_LENGTH}
            className="h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_16px_rgba(255,255,255,0.3)] transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Đang kiểm tra...' : 'Tiếp tục'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {remaining > 0 ? (
            <button
              type="button"
              disabled
              className="text-neutral-400 cursor-not-allowed"
            >
              Gửi lại mã sau {remaining} giây
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[#1c1c1c] hover:text-black/80 font-medium"
            >
              Gửi lại mã
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { requestPasswordReset, verifyResetCode } from '@/lib/api/password-reset'

const OTP_LENGTH = 6

const INPUT_CLASS =
  'h-[56px] w-full rounded-[12px] border border-black/20 px-5 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none transition-all'

export default function VerifyResetCodePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number>(60)
  const [resetSessionId, setResetSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!email) {
      router.replace('/forgot-password')
    }
  }, [email, router])

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  const canResend = useMemo(() => remaining <= 0, [remaining])

  const handleChangeCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setCode(value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (code.length !== OTP_LENGTH || !email) return

    setError(null)
    setInfo(null)

    try {
      setIsSubmitting(true)
      const result = await verifyResetCode(email, code)
      setResetSessionId(result.id)
      router.push(`/forgot-password/reset?session=${encodeURIComponent(result.id)}`)
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? 'Mã xác nhận không đúng hoặc đã hết hạn.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || !email) return
    setError(null)
    setInfo(null)

    try {
      setRemaining(60)
      await requestPasswordReset(email)
      setInfo('Đã gửi lại mã. Vui lòng kiểm tra hộp thư của bạn.')
    } catch (err: any) {
      setRemaining(0)
      const message = err?.response?.data?.detail ?? 'Không thể gửi lại mã. Vui lòng thử lại sau.'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-[120px] pb-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-semibold text-[#1c1c1c] mb-2">Nhập mã xác nhận</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Mã gồm 6 ký tự đã được gửi tới email{' '}
          <span className="font-medium text-[#1c1c1c]">{email}</span>. Nhập mã để tiếp tục đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-neutral-700">
              Mã xác nhận
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={handleChangeCode}
              placeholder="••••••"
              className={`${INPUT_CLASS} text-center tracking-[0.5em] text-lg`}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting || code.length !== OTP_LENGTH}
            className="mt-2 h-[52px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_16px_rgba(255,255,255,0.3)] disabled:opacity-60"
          >
            {isSubmitting ? 'Đang kiểm tra...' : 'Tiếp tục'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className={`mt-4 w-full text-sm font-medium ${
            canResend ? 'text-black hover:underline' : 'text-neutral-400 cursor-default'
          }`}
        >
          {canResend ? 'Gửi lại mã' : `Gửi lại mã sau ${remaining} giây`}
        </button>
      </div>
    </div>
  )
}


