import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-ink',
        'placeholder:text-faint transition-colors',
        'focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-sm text-ink',
      'placeholder:text-faint transition-colors resize-none',
      'focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'
