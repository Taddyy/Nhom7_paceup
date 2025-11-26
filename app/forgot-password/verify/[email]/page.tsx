'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { requestPasswordReset, verifyResetCode } from '@/lib/api/password-reset'

const CODE_LENGTH = 6
const RESEND_SECONDS = 60

export default function VerifyResetCodePage() {
  const params = useParams<{ email: string }>()
  const router = useRouter()
  const email = useMemo(
    () => decodeURIComponent(params.email ?? ''),
    [params.email],
  )

  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number>(RESEND_SECONDS)
  const [isResending, setIsResending] = useState(false)

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || code.length !== CODE_LENGTH || isVerifying) return

    try {
      setIsVerifying(true)
      setError(null)
      const token = await verifyResetCode(email, code)
      router.push(`/forgot-password/reset/${encodeURIComponent(token.id)}`)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng thử lại.'
      setError(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!email || remaining > 0 || isResending) return
    try {
      setIsResending(true)
      setError(null)
      await requestPasswordReset(email)
      setRemaining(RESEND_SECONDS)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Không thể gửi lại mã, vui lòng thử lại sau.'
      setError(message)
    } finally {
      setIsResending(false)
    }
  }

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH)
    setCode(sanitized)
  }

  const codeDigits = Array.from({ length: CODE_LENGTH }).map((_, index) =>
    code[index] ?? '',
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-[100px] pb-12 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Nhập mã xác nhận
          </h1>
          <p className="text-sm text-neutral-500">
            Chúng tôi đã gửi mã 6 ký tự đến{' '}
            <span className="font-medium text-neutral-900">{email}</span>.
            Vui lòng kiểm tra hộp thư và nhập mã bên dưới.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => {
                    const next =
                      code.slice(0, index) +
                      event.target.value.replace(/[^0-9]/g, '').slice(0, 1) +
                      code.slice(index + 1)
                    handleCodeChange(next)
                  }}
                  className="h-12 w-10 rounded-[10px] border border-black/20 text-center text-lg font-semibold text-[#1c1c1c] focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none"
                />
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              className="sr-only"
              value={code}
              onChange={(event) => handleCodeChange(event.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isVerifying || code.length !== CODE_LENGTH}
            className="h-[50px] w-full rounded-[12px] bg-[#1c1c1c] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_12px_rgba(255,255,255,0.25)] disabled:opacity-60"
          >
            {isVerifying ? 'Đang kiểm tra...' : 'Tiếp tục'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={remaining > 0 || isResending}
          className={`mx-auto block text-sm font-medium ${
            remaining > 0 || isResending
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-black hover:text-black/70'
          }`}
        >
          {remaining > 0
            ? `Gửi lại mã sau ${remaining} giây`
            : 'Gửi lại mã'}
        </button>

        <p className="text-center text-sm text-neutral-500">
          Nhập sai email?{' '}
          <Link
            href="/forgot-password"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Thử lại với email khác
          </Link>
        </p>
      </div>
    </div>
  )
}


