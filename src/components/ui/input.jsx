import React from 'react'

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`border rounded-md px-3 py-2 ${className}`} {...props} />
))
Input.displayName = 'Input'

