'use client'

import { useEffect } from 'react'

export interface NotificationDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean
  /** Title of the notification */
  title: string
  /** Message content */
  message: string
  /** Type of notification - 'negative' shows red button */
  type?: 'default' | 'negative'
  /** Label for confirm button */
  confirmLabel?: string
  /** Label for cancel button (if provided, shows cancel button) */
  cancelLabel?: string
  /** Callback when confirm button is clicked */
  onConfirm: () => void
  /** Callback when cancel button is clicked or dialog is closed */
  onCancel: () => void
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Auto close after specified milliseconds (default: 3000 for success, no auto-close for negative) */
  autoCloseDelay?: number
}

/**
 * Notification Dialog Component
 * 
 * Displays a centered popup notification with:
 * - White background (#fff)
 * - Red text
 * - 24px border radius
 * - Border stroke #bebebe with 20% opacity
 * - Background overlay #000 with 10% opacity
 * - Red button for negative actions (like "Xóa")
 */
export default function NotificationDialog({
  isOpen,
  title,
  message,
  type = 'default',
  confirmLabel = 'Xác nhận',
  cancelLabel,
  onConfirm,
  onCancel,
  showCloseButton = true,
  autoCloseDelay
}: NotificationDialogProps) {
  // Auto-close for success notifications (type='default' and no cancel button)
  useEffect(() => {
    if (!isOpen) return
    
    // Auto-close only for default type (success) and when no cancel button
    // Use provided autoCloseDelay or default 3000ms for success, no auto-close for negative
    const delay = autoCloseDelay !== undefined 
      ? autoCloseDelay 
      : (type === 'default' && !cancelLabel ? 3000 : undefined)
    
    if (delay) {
      const timer = setTimeout(() => {
        onConfirm() // Auto-close by calling onConfirm (which typically closes the dialog)
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, type, cancelLabel, autoCloseDelay, onConfirm])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={(e) => {
        // Close when clicking on overlay
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"
        style={{
          border: '1px solid rgba(190, 190, 190, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <h3 className="pr-8 text-xl font-semibold" style={{ color: type === 'default' ? '#1c1c1c' : '#dc2626' }}>
            {title}
          </h3>

          {/* Message */}
          <p className="text-base leading-relaxed" style={{ color: type === 'default' ? '#1c1c1c' : '#dc2626' }}>
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {cancelLabel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors ${
                type === 'negative'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#1c1c1c] hover:bg-neutral-800'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

