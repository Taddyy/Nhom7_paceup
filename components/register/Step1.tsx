'use client'

import { useState } from 'react'

interface Step1Props {
  formData: {
    email: string
    password: string
    confirmPassword: string
  }
  updateFormData: (data: Partial<Step1Props['formData']>) => void
  onNext: () => void
}

const INPUT_CLASS =
  'h-[62px] w-full rounded-[12px] border border-black/25 px-6 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all'

/**
 * Step 1: Account Information
 *
 * Collects email and password for account creation.
 */
export default function Step1({ formData, updateFormData, onNext }: Step1Props) {
  const [localError, setLocalError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ [e.target.name]: e.target.value })
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    setLocalError('')
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-black/40">Bước 1</p>
        <h2 className="text-2xl font-bold text-[#1c1c1c]">Thông tin tài khoản</h2>
      </div>
      <form onSubmit={handleNext} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-base text-black/60">
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
          <label htmlFor="password" className="text-base text-black/60">
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
          <label htmlFor="confirmPassword" className="text-base text-black/60">
            Xác nhận mật khẩu *
          </label>
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
        </div>

        {localError && <p className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{localError}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            className="h-[52px] rounded-[12px] bg-[#1c1c1c] px-10 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.2)]"
          >
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

