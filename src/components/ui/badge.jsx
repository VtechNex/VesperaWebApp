import React from 'react'
import { cn } from '../../lib/utils'

const Badge = React.forwardRef(({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}, ref) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-300',
    secondary: 'bg-blue-100 text-blue-800 border border-blue-300',
    destructive: 'bg-red-100 text-red-800 border border-red-300',
    outline: 'bg-transparent text-white border border-white/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    gold: 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40',
  }

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export { Badge }