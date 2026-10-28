import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string | number
  label: string
  sublabel?: string
  badge?: string
}

export interface CustomDropdownProps {
  value: string | number
  onChange: (value: any) => void
  options: DropdownOption[]
  placeholder?: string
  className?: string
  ariaLabel?: string
  disabled?: boolean
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  className = '',
  ariaLabel = 'Pilih opsi',
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#171D1B] flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-[#146350] ring-2 ring-[#146350]/15'
            : 'border-[#E6E4DD] hover:border-[#146350]/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
          {selectedOption?.sublabel && (
            <span className="text-[#6E6D68] font-normal ml-1.5">
              • {selectedOption.sublabel}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#6E6D68] shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#146350]' : ''
          }`}
        />
      </button>

      {/* Styled Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-[#E6E4DD] rounded-2xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#E2F2EC] text-[#146350] font-extrabold'
                    : 'text-[#171D1B] font-semibold hover:bg-[#F4F8F6] hover:text-[#146350]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span
                      className={`text-[11px] truncate font-normal ${
                        isSelected ? 'text-[#146350]/80' : 'text-[#6E6D68]'
                      }`}
                    >
                      • {opt.sublabel}
                    </span>
                  )}
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF9F6] border border-[#E6E4DD]">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#146350] shrink-0 stroke-[2.5] ml-2" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
