import React, { createContext, useContext } from 'react'

const DialogContext = createContext(null)

export function Dialog({ open, onOpenChange, children }) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

export function DialogContent({ children, className = '' }) {
  const ctx = useContext(DialogContext)
  if (!ctx?.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => ctx.onOpenChange?.(false)} />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(900px 450px at 50% 10%, rgba(212,175,55,0.12), transparent 60%)",
        }}
      />
      <div className={`relative z-10 rounded-lg ${className}`}>{children}</div>
    </div>
  )
}

export const DialogHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)
export const DialogTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)
export const DialogDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-white/70 ${className}`}>{children}</p>
)
export const DialogFooter = ({ children, className = '' }) => (
  <div className={`mt-4 ${className}`}>{children}</div>
)
export const DialogTrigger = ({ children }) => children

