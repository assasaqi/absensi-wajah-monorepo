import React from 'react'
import { AlertCircle, LogOut } from 'lucide-react'
import { Button } from './Button'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  icon?: React.ReactNode
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDestructive = true,
  icon,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] bg-white text-[#171D1B] rounded-3xl border border-[#E6E4DD] p-5 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col items-center text-center space-y-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDestructive
              ? 'bg-[#FBE6E5] text-[#D92D20]'
              : 'bg-[#E3F1EC] text-[#146350]'
          }`}
        >
          {icon ||
            (isDestructive ? (
              <LogOut className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            ))}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-[#171D1B]">{title}</h3>
          <p className="text-xs text-[#6E6D68] leading-relaxed max-w-[260px]">
            {description}
          </p>
        </div>

        <div className="flex gap-2.5 w-full pt-1">
          <Button
            variant="outline"
            size="md"
            className="flex-1 text-xs font-bold"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="md"
            className={`flex-1 text-xs font-bold text-white ${
              isDestructive
                ? 'bg-[#D92D20] hover:bg-[#B42318] border-[#D92D20]'
                : 'bg-[#146350] hover:bg-[#0F5242] border-[#146350]'
            }`}
            disabled={isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
