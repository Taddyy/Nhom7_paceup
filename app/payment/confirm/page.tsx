'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getPaymentSession, confirmPaymentSession } from '@/lib/api/payment'

function PaymentConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'ready' | 'completed' | 'error'>('loading')
  const [sessionStatus, setSessionStatus] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    const bootstrap = async () => {
      if (!sessionId) {
        setStatus('error')
        return
      }
      try {
        const session = await getPaymentSession(sessionId)
        setSessionData(session)
        setSessionStatus(session.status)
        
        // If already completed/cancelled/expired, show completed state
        if (session.status === 'success' || session.status === 'cancelled' || session.status === 'expired') {
          setStatus('completed')
        } else {
          setStatus('ready')
        }
      } catch (error) {
        console.error('Unable to load payment session', error)
        setStatus('error')
      }
    }

    void bootstrap()
  }, [sessionId])

  const handleConfirm = async (action: 'confirm' | 'cancel') => {
    if (!sessionId) return
    try {
      setIsSubmitting(true)
      const result = await confirmPaymentSession(sessionId, action)
      setSessionStatus(result.status)
      setStatus('completed')
    } catch (error) {
      console.error('Unable to confirm payment', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
          Đang tải phiên thanh toán...
        </div>
      </div>
    )
  }

  if (status === 'error' || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
          <p className="text-2xl font-semibold text-neutral-900">Phiên thanh toán không hợp lệ</p>
          <p className="mt-3 text-neutral-600">
            Liên kết đã hết hạn hoặc không tồn tại. Vui lòng quét lại mã QR trên màn hình máy tính.
          </p>
          <button
            className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
            onClick={() => router.back()}
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
          <p className="text-2xl font-semibold text-neutral-900">
            {sessionStatus === 'success' ? 'Thanh toán giả lập thành công' : 'Phiên thanh toán đã bị hủy'}
          </p>
          <p className="mt-3 text-neutral-600">
            Hãy quay lại màn hình máy tính. Trạng thái thanh toán sẽ được đồng bộ tự động.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[#1c1c1c] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">PAYMENT SANDBOX</p>
        <p className="mt-2 text-2xl font-semibold text-neutral-900">Xác nhận thanh toán giả lập</p>
        <p className="mt-3 text-sm text-neutral-600">
          Đây chỉ là mô phỏng cho đồ án môn học. Không có giao dịch tài chính thật được thực hiện.
        </p>
        
        {sessionData && (
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-left text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900 mb-2">Thông tin thanh toán:</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Số tiền:</span>
                <span className="font-semibold text-neutral-900">
                  {sessionData.amount?.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Hạng mục:</span>
                <span className="font-medium text-neutral-800">{sessionData.category || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-left text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900 mb-1">Trạng thái hiện tại:</p>
          <p className="uppercase tracking-[0.2em] text-blue-600">{sessionStatus || 'PENDING'}</p>
        </div>

        {sessionStatus === 'pending' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              disabled={isSubmitting || status !== 'ready'}
              onClick={() => handleConfirm('cancel')}
              className="rounded-[14px] border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Huỷ
            </button>
            <button
              disabled={isSubmitting || status !== 'ready'}
              onClick={() => handleConfirm('confirm')}
              className="rounded-[14px] bg-[#1c1c1c] px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán giả lập'}
            </button>
          </div>
        )}

        {sessionStatus !== 'pending' && (
          <p className="text-sm text-neutral-500 italic">
            Phiên thanh toán này đã được xử lý. Vui lòng quét lại mã QR mới nếu cần.
          </p>
        )}
      </div>
    </div>
  )
}

export default function PaymentConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
          <div className="rounded-2xl border border-neutral-200 px-6 py-4 text-lg text-neutral-600 shadow-sm">
            Đang tải phiên thanh toán...
          </div>
        </div>
      }
    >
      <PaymentConfirmContent />
    </Suspense>
  )
}

