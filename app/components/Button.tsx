import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-2xl active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[11px] rounded-xl',
    md: 'px-3.5 py-2.5 text-xs',
    lg: 'px-4 py-3 text-sm',
  }

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#146350] text-white hover:bg-[#0F5242] shadow-xs border border-[#146350]',
    secondary:
      'bg-white text-[#146350] border border-[#E5E3DC] hover:bg-[#F4F8F6] shadow-2xs',
    outline:
      'bg-white/95 text-[#146350] border border-[#E5E3DC] hover:bg-[#F3F2EE]',
    ghost:
      'bg-transparent text-[#146350] hover:bg-[#146350]/10 border border-transparent',
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
