import React, { createContext, useContext, useState } from 'react'

const AccordionContext = createContext(null)
const ItemContext = createContext(null)

export function Accordion({ type = 'single', collapsible = true, children, className = '' }) {
  const [open, setOpen] = useState(null)
  return (
    <AccordionContext.Provider value={{ open, setOpen, type, collapsible }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ value, children, className = '' }) {
  return (
    <ItemContext.Provider value={value}>
      <div className={className}>{children}</div>
    </ItemContext.Provider>
  )
}

export function AccordionTrigger({ children, className = '' }) {
  const ctx = useContext(AccordionContext)
  const value = useContext(ItemContext)
  const isOpen = ctx.open === value
  return (
    <button
      type="button"
      className={`w-full py-3 text-left ${className}`}
      onClick={() => {
        if (ctx.type === 'single') {
          ctx.setOpen(isOpen && ctx.collapsible ? null : value)
        } else {
          ctx.setOpen(isOpen ? null : value)
        }
      }}
    >
      {children}
    </button>
  )
}

export function AccordionContent({ children, className = '' }) {
  const ctx = useContext(AccordionContext)
  const value = useContext(ItemContext)
  if (ctx.open !== value) return null
  return <div className={`py-2 ${className}`}>{children}</div>
}

