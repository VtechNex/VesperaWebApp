import React, { useEffect, useState } from 'react'
import { __toastSubscribe } from '../../hooks/use-toast.js'

export function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const unsub = __toastSubscribe(({ title, description }) => {
      const id = Math.random().toString(36).slice(2)
      setItems((prev) => [...prev, { id, title, description }])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3000)
    })
    return unsub
  }, [])

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {items.map((t) => (
        <div key={t.id} className="bg-black/80 border border-white/15 text-white rounded-md px-4 py-3 shadow">
          {t.title && <div className="font-medium">{t.title}</div>}
          {t.description && <div className="text-sm text-white/80">{t.description}</div>}
        </div>
      ))}
    </div>
  )
}

