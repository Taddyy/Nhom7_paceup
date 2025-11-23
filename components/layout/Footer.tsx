'use client'

import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Cá nhân', href: '/profile' },
  { label: 'Giải chạy', href: '/events' },
  { label: 'Nội dung', href: '/blog' }
]

const NavItem = ({ label, href }: { label: string; href: string }) => (
  <div className="flex items-center gap-3 text-white/85">
    <span className="inline-block h-5 w-[2px] rounded-full bg-gradient-to-b from-[#3d68ff] to-[#2643b7]" />
    <Link href={href} className="text-[18px] leading-[20px] hover:text-white transition-colors">
      {label}
    </Link>
  </div>
)

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#03030c] text-white">
      <div className="absolute inset-0">
        <Image src="/Image/Hero.png" alt="Footer background" fill className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03030c]/90 to-[#010103]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-24 flex flex-col gap-12">
        <div className="max-w-[600px] text-[32px] leading-[1.3]">
          <p className="mb-0">
            <span className="font-bold text-[#1e69ff]">Media Platform Giải Chạy </span>–
          </p>
          <p className="text-white text-[32px]">Nơi kết nối đam mê chạy bộ với truyền thông đa phương tiện</p>
        </div>

        <div className="flex flex-col gap-6 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Image src="/Icon/logo-footer.svg" alt="Footer icon" width={64} height={64} priority />
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              {NAV_LINKS.map((link) => (
                <NavItem key={link.label} {...link} />
              ))}
            </div>
          </div>
          <Link
            href="/contact"
            className="bg-[#1c1c1c] flex items-center justify-center px-6 py-3 rounded-lg relative shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)]"
          >
            <span className="font-medium text-lg uppercase whitespace-nowrap">Liên hệ ngay</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-white/15 pt-8 text-white/70">
          <p className="text-sm">Copyright © {new Date().getFullYear()}</p>
          <Image src="/Icon/social-footer.svg" alt="Mạng xã hội" width={62} height={19} />
        </div>
      </div>
    </footer>
  )
}
