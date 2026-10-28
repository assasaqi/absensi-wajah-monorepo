import React from 'react'
import { Check, FileText, Clock, Minus, HeartHandshake } from 'lucide-react'
import type { AttendanceStatus } from '~/types/attendance'

export interface StatusBadgeProps {
  status: AttendanceStatus
  variantStyle?: 'session' | 'daily'
  className?: string
}

export function StatusBadge({
  status,
  variantStyle = 'session',
  className = '',
}: StatusBadgeProps) {
  const config: Record<
    AttendanceStatus,
    {
      label: string
      bgClass: string
      textClass: string
      icon: React.ReactNode
    }
  > = {
    hadir: {
      label: 'Hadir',
      bgClass: 'bg-[#E5F3EC]',
      textClass: 'text-[#146350]',
      icon: <Check className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    izin: {
      label: 'Izin',
      bgClass: 'bg-[#E9ECF8]',
      textClass: 'text-[#283593]',
      icon: <FileText className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    sakit: {
      label: 'Sakit',
      bgClass: 'bg-[#FBF0D9]',
      textClass: 'text-[#8C5411]',
      icon:
        variantStyle === 'daily' ? (
          <HeartHandshake className="w-3.5 h-3.5 stroke-[2.2]" />
        ) : (
          <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
        ),
    },
    alpa: {
      label: 'Alpa',
      bgClass: 'bg-[#FBE6E5]',
      textClass: 'text-[#B42318]',
      icon: <Minus className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    belum_tercatat: {
      label: 'Belum tercatat',
      bgClass: 'bg-[#EFECE6]',
      textClass: 'text-[#5C5852]',
      icon: <Clock className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
  }

  const item = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${item.bgClass} ${item.textClass} ${className}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  )
}
