import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useToasts, removeToast, type ToastType } from '~/lib/toast'

export function ToastContainer() {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-[#146350] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#283593] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#8C5411] shrink-0" />,
  }

  const styles: Record<ToastType, string> = {
    success: 'bg-[#EAF5F0] border-[#A8DFC9] text-[#146350]',
    error: 'bg-[#FBE6E5] border-[#F97066] text-[#B42318]',
    info: 'bg-[#EEF0FA] border-[#C5CEF4] text-[#283593]',
    warning: 'bg-[#FBF0D9] border-[#F5D89D] text-[#8C5411]',
  }

  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-full p-3.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-200 ${
            styles[toast.type]
          }`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0 pr-1">
            {toast.title && (
              <h4 className="text-xs font-extrabold leading-tight mb-0.5">
                {toast.title}
              </h4>
            )}
            <p className="text-xs font-semibold leading-relaxed text-[#171D1B]">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-full text-[#6E6D68] hover:text-[#171D1B] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
