import { useState, useEffect } from "react"

export type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let listeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify() {
  listeners.forEach((listener) => listener(toasts))
}

export function toast(message: string, type: ToastType = "info", duration = 3000) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { id, message, type, duration }
  toasts = [...toasts, newToast]
  notify()

  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function useToast() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>(toasts)

  useEffect(() => {
    listeners.push(setActiveToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setActiveToasts)
    }
  }, [])

  return { toasts: activeToasts, toast, dismiss }
}
