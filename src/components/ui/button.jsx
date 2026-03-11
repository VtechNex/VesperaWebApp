import React from 'react'

export const Button = React.forwardRef(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center rounded-md px-4 py-2 ${className}`}
    {...props}
  />
))
Button.displayName = 'Button'

