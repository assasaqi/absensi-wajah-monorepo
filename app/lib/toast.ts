import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastMessage {
  id: string
  type: ToastType
  title?: string
  message: string
}

type ToastListener = (toasts: ToastMessage[]) => void

let activeToasts: ToastMessage[] = []
const listeners = new Set<ToastListener>()

const FLASH_KEY = 'hadir_flash_toast'

export function showToast(
  message: string,
  type: ToastType = 'success',
  title?: string,
) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: ToastMessage = { id, type, title, message }
  activeToasts = [...activeToasts, newToast]
  listeners.forEach((listener) => listener(activeToasts))

  setTimeout(() => {
    removeToast(id)
  }, 4000)
}

export function showFlashToast(
  message: string,
  type: ToastType = 'success',
  title?: string,
) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(
      FLASH_KEY,
      JSON.stringify({ message, type, title }),
    )
  }
}

export function checkAndShowFlashToast() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.sessionStorage.getItem(FLASH_KEY)
    if (raw) {
      window.sessionStorage.removeItem(FLASH_KEY)
      const data = JSON.parse(raw) as {
        message: string
        type: ToastType
        title?: string
      }
      setTimeout(() => {
        showToast(data.message, data.type, data.title)
      }, 100)
    }
  } catch {
    // ignore
  }
}

export function removeToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id)
  listeners.forEach((listener) => listener(activeToasts))
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>(activeToasts)

  useEffect(() => {
    listeners.add(setToasts)
    checkAndShowFlashToast()
    return () => {
      listeners.delete(setToasts)
    }
  }, [])

  return toasts
}
