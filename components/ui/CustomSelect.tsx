'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export interface SelectOption {
  label: string
  value: string
  unavailable?: boolean
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  icon?: string
  placeholder?: string
  className?: string
  width?: string
  error?: boolean
  variant?: 'default' | 'hero' // 'default' for forms, 'hero' for hero section
}

export default function CustomSelect({
  options,
  value,
  onChange,
  icon,
  placeholder = 'Chọn...',
  className = '',
  width = 'auto',
  error = false,
  variant = 'default',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || placeholder

  const isHeroVariant = variant === 'hero'
  const defaultStateClass = (() => {
    if (error) {
      return 'border-red-500 ring-2 ring-red-100'
    }
    if (isOpen) {
      return 'border-black ring-2 ring-black/10'
    }
    return 'border-black/15 hover:border-black/40'
  })()

  const buttonClasses = isHeroVariant
    ? `bg-[#f3f3f3] border border-[rgba(182,182,182,0.1)] rounded-[12px] px-3 h-[50px] flex items-center gap-2 ${
        width === 'auto' ? 'w-full' : ''
      } hover:bg-neutral-100 transition-colors`
    : `w-full h-[60px] rounded-[14px] bg-white px-5 text-base text-[#1c1c1c] flex items-center gap-2 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black ${defaultStateClass}`

  return (
    <div className={`relative ${className}`} ref={selectRef} style={width !== 'auto' && !isHeroVariant ? { width } : undefined}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        style={isHeroVariant && width !== 'auto' ? { width } : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <Image src={icon} alt="" width={14} height={14} className="flex-shrink-0" />}
        <span className={`flex-1 text-left ${isHeroVariant ? 'text-[17px] text-[#252525]' : 'text-base text-neutral-900'}`}>{displayValue}</span>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={variant === 'default' ? { paddingRight: '16px' } : undefined}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-[16px] border border-neutral-200 bg-white shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
          {options
            .filter((option) => !(option.value === '' && value !== '')) // Hide placeholder if value is selected
            .map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!option.unavailable) {
                    onChange(option.value)
                    setIsOpen(false)
                  }
                }}
                disabled={option.unavailable}
                className={`w-full px-4 py-3 text-left text-sm text-neutral-700 transition-colors ${
                  index > 0 ? 'border-t border-neutral-100' : ''
                } ${option.value === value ? 'bg-neutral-50 font-medium text-neutral-900' : 'hover:bg-neutral-50'} ${
                  option.unavailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
