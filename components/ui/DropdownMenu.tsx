'use client'

import { useEffect, useRef, useState } from 'react'

export interface DropdownOption {
  label: string
  value: string
  unavailable?: boolean
  selected?: boolean
  onClick: () => void
}

interface DropdownMenuProps {
  options: DropdownOption[]
  trigger: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}

export default function DropdownMenu({ options, trigger, className = '', align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (!option.unavailable && !option.selected) {
                  option.onClick()
                  setIsOpen(false)
                }
              }}
              disabled={option.unavailable || option.selected}
              className={`w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors ${
                index > 0 ? 'border-t border-neutral-200' : ''
              } ${
                option.unavailable || option.selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
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
