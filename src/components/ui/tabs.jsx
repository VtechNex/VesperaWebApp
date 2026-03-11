import React, { createContext, useContext } from 'react'

const TabsContext = createContext(null)

export function Tabs({ value, onValueChange, children, className = '' }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return <div className={`tabs-list ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = '' }) {
  const ctx = useContext(TabsContext)
  const selected = ctx?.value === value
  return (
    <button
      type="button"
      onClick={() => ctx?.onValueChange?.(value)}
      aria-selected={selected}
      className={`tabs-trigger ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div className={className}>{children}</div>
}

