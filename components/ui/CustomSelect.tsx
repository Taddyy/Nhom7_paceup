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
  variant = 'default'
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
  const buttonClasses = isHeroVariant
    ? `bg-[#f3f3f3] border border-[rgba(182,182,182,0.1)] rounded-[12px] px-3 h-[50px] flex items-center gap-2 ${
        width === 'auto' ? 'w-full' : ''
      } hover:bg-neutral-100 transition-colors`
    : `w-full rounded-[12px] border px-4 py-3 text-base text-neutral-900 focus:outline-none transition bg-white flex items-center gap-2 ${
        error ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-900'
      } hover:bg-neutral-50`

  return (
    <div className={`relative ${className}`} ref={selectRef} style={width !== 'auto' && !isHeroVariant ? { width } : undefined}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        style={isHeroVariant && width !== 'auto' ? { width } : undefined}
      >
        {icon && <Image src={icon} alt="" width={14} height={14} className="flex-shrink-0" />}
        <span className={`flex-1 text-left ${isHeroVariant ? 'text-[17px] text-[#252525]' : 'text-base text-neutral-900'}`}>{displayValue}</span>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-neutral-200 shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto">
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
                className={`w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors ${
                  index > 0 ? 'border-t border-neutral-200' : ''
                } ${
                  option.value === value ? 'bg-neutral-50 font-medium' : ''
                } ${
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
