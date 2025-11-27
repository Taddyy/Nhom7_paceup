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

  // Icon colors based on type
  const iconColors = {
    success: '#10b981', // green-500
    error: '#dc2626', // red-600
    info: '#3b82f6' // blue-500
  }

  return (
    <div 
      className="fixed top-24 right-5 z-50 flex items-center gap-3 rounded-[24px] bg-white px-6 py-4 shadow-xl transition-all animate-in slide-in-from-right"
      style={{
        border: '1px solid rgba(190, 190, 190, 0.2)'
      }}
    >
      {type === 'success' && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: iconColors.success }}>
          <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {type === 'error' && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: iconColors.error }}>
          <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {type === 'info' && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: iconColors.info }}>
          <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <p className="font-medium" style={{ color: '#1c1c1c' }}>{message}</p>
    </div>
  )
}

