import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!show) return null

  const bgColors = {
    success: 'bg-[#1c1c1c]',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  return (
    <div className={`fixed top-24 right-5 z-50 flex items-center gap-3 rounded-[12px] ${bgColors[type]} px-6 py-4 text-white shadow-xl transition-all animate-in slide-in-from-right`}>
      {type === 'success' && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <p className="font-medium">{message}</p>
    </div>
  )
}

