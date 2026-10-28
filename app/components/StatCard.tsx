import React from 'react'

export type StatVariant = 'hadir' | 'izin' | 'sakit' | 'alpa' | 'belum_tercatat'

export interface StatCardProps {
  value: number | string
  label: string
  variant: StatVariant
  onClick?: () => void
  active?: boolean
}

export function StatCard({
  value,
  label,
  variant,
  onClick,
  active = false,
}: StatCardProps) {
  const valueColors: Record<StatVariant, string> = {
    hadir: 'text-[#146350]',
    izin: 'text-[#283593]',
    sakit: 'text-[#8C5411]',
    alpa: 'text-[#B42318]',
    belum_tercatat: 'text-[#B42318]',
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-2xl border py-3 px-2 flex flex-col items-center justify-center text-center transition-all ${
        active
          ? 'border-[#146350] ring-2 ring-[#146350]/15'
          : 'border-[#E6E4DD]'
      } ${onClick ? 'cursor-pointer hover:border-[#146350]/50' : ''}`}
    >
      <span className={`text-[22px] leading-tight font-extrabold tracking-tight ${valueColors[variant]}`}>
        {value}
      </span>
      <span className="text-[11px] text-[#6E6D68] font-medium mt-0.5 leading-tight">
        {label}
      </span>
    </div>
  )
}
