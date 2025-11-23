'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'

export default function HomeToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create_event_success') {
      setShowToast(true)
      // Clean up URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('action')
      router.replace(`/?${newParams.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  return (
    <Toast
      message="Đăng ký giải chạy thành công! Admin sẽ duyệt và thông báo sau."
      type="success"
      isVisible={showToast}
      onClose={() => setShowToast(false)}
    />
  )
}

