'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { createEmailSubscription } from '@/lib/api/email-subscriptions'
import Toast from '@/components/ui/Toast'

const CTA_STATS = [
  {
    value: '50,000+',
    label: 'Thành viên cộng đồng',
    icon: '/Icon/Thành viên cộng đồng.svg'
  },
  {
    value: '200+',
    label: 'Sự kiện mỗi năm',
    icon: '/Icon/Sự kiện mỗi năm.svg'
  },
  {
    value: '63',
    label: 'Tỉnh thành',
    icon: '/Icon/Tỉnh thành.svg'
  }
]

const CTA_SOCIALS = [
  {
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M14 0H6a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V6a6 6 0 0 0-6-6Zm4 14a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4ZM10 5.5A4.5 4.5 0 1 0 14.5 10 4.5 4.5 0 0 0 10 5.5Zm0 7A2.5 2.5 0 1 1 12.5 10 2.5 2.5 0 0 1 10 12.5ZM15.25 4.3a1.3 1.3 0 1 0 1.3 1.3 1.3 1.3 0 0 0-1.3-1.3Z" />
      </svg>
    )
  },
  {
    name: 'Twitter',
    icon: (
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M19.46 4.12a6.72 6.72 0 0 1-1.98.54 3.45 3.45 0 0 0 1.5-1.9 6.74 6.74 0 0 1-2.14.83 3.37 3.37 0 0 0-5.77 2.3 3.5 3.5 0 0 0 .09.77A9.57 9.57 0 0 1 1.14 2.58 3.38 3.38 0 0 0 2.2 7.09a3.32 3.32 0 0 1-1.53-.44v.05a3.38 3.38 0 0 0 2.7 3.31 3.34 3.34 0 0 1-1.52.06 3.38 3.38 0 0 0 3.15 2.35A6.78 6.78 0 0 1 .8 14.84a6.49 6.49 0 0 1-.8-.05 9.52 9.52 0 0 0 5.18 1.53c6.21 0 9.61-5.29 9.61-9.88 0-.15 0-.31-.01-.46a6.92 6.92 0 0 0 1.68-1.74Z" />
      </svg>
    )
  }
]

/**
 * CTA (Call To Action) section styled after the glassmorphism block in the design.
 */
export default function CTASection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({ message: '', type: 'success', isVisible: false })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || isSubmitting) return

    try {
      setIsSubmitting(true)
      await createEmailSubscription(email, 'cta_home')
      setToast({
        message: 'Cảm ơn bạn đã đăng ký nhận thông tin!',
        type: 'success',
        isVisible: true,
      })
      setEmail('')
    } catch (error) {
      console.error('Failed to subscribe email:', error)
      setToast({
        message: 'Không thể đăng ký email, vui lòng thử lại sau.',
        type: 'error',
        isVisible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050816] px-4 text-white md:px-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
      <div className="absolute inset-0">
        <Image src="/Image/BG CTA.png" alt="CTA background" fill className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050816]/30 via-[#050816]/80 to-[#050816]" />
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 whitespace-nowrap text-[150px] font-semibold uppercase tracking-[-6px] text-transparent opacity-70 bg-gradient-to-b from-white to-white/0 bg-clip-text"
      >
        Đăng kí ngay
      </span>

      <div className="relative z-20 flex w-full justify-center py-24">
        <div className="relative w-full max-w-[1140px] rounded-[50px] border border-white/20 bg-white/5 px-6 py-20 text-center text-white backdrop-blur-[55px] md:px-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[50px]">
            <div className="absolute -left-20 top-20 h-64 w-64 rotate-12 bg-gradient-to-br from-white/35 to-transparent opacity-40 blur-3xl" />
            <div className="absolute -right-24 top-10 h-72 w-72 -rotate-12 bg-gradient-to-br from-[#7f6bff]/40 to-transparent opacity-60 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-12">

            <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CTA_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="relative flex min-w-[260px] flex-col items-center gap-3 rounded-[20px] border border-white/15 bg-white/5 px-8 py-6 text-white/90"
                >
                  <Image src={stat.icon} alt={stat.label} width={48} height={48} className="opacity-90" />
                  <p className="text-[22px] font-semibold text-white">{stat.value}</p>
                  <p className="text-base text-white/75">{stat.label}</p>
                  <span className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[0_1px_12px_rgba(255,255,255,0.12)]" />
                </div>
              ))}
            </div>

            <div className="max-w-[749px] space-y-3">
              <h2 className="text-[40px] md:text-[57px] leading-[1.14] tracking-[-1.1px]">
                Tham Gia Cộng Đồng Runner Việt Nam
              </h2>
              <p className="text-[20px] text-white/75">
                Kết nối với hàng nghìn vận động viên, nhận thông tin sự kiện mới nhất và tham gia các giải chạy hấp dẫn trên khắp cả nước.
              </p>
            </div>

            <form
              className="flex w-full max-w-[714px] flex-col gap-4 md:flex-row"
              onSubmit={handleSubmit}
            >
              <label htmlFor="cta-email" className="sr-only">
                Email của bạn
              </label>
              <div className="flex h-[88px] w-full overflow-hidden rounded-[20px] border border-white/15 bg-white/10">
                <input
                  id="cta-email"
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 bg-transparent px-6 text-2xl text-white placeholder-white/55 focus:outline-none"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  className="w-full bg-[#3d27ff] px-8 text-2xl font-semibold tracking-[-0.48px] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] md:w-[255px] disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Đăng kí ngay'}
                </button>
              </div>
            </form>

            <div className="flex gap-4 text-white/70">
              {CTA_SOCIALS.map((social) => (
                <span
                  key={social.name}
                  aria-label={social.name}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30"
                >
                  {social.icon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}