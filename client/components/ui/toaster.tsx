"use client"

import { useToast, dismiss } from "@/hooks/use-toast"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full fade-in duration-300 pointer-events-auto",
            t.type === "error" && "bg-destructive text-destructive-foreground border-destructive/50",
            t.type === "success" && "bg-green-600 text-white border-green-700",
            t.type === "info" && "bg-background text-foreground border-border"
          )}
        >
          {t.type === "success" && <CheckCircle className="h-5 w-5 shrink-0" />}
          {t.type === "error" && <AlertCircle className="h-5 w-5 shrink-0" />}
          {t.type === "info" && <Info className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-current/80 hover:text-current shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
