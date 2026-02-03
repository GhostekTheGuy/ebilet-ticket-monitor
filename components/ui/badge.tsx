import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#052e1c] text-[#34d399] [a&]:hover:bg-[#063d24]',
        secondary:
          'border-transparent bg-[#191919] text-[#8a8a92] [a&]:hover:bg-[#1f1f1f]',
        destructive:
          'border-transparent bg-[#2e0c0c] text-[#ef4444] [a&]:hover:bg-[#3a0f0f] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border-[#252528] bg-transparent text-[#8a8a92] [a&]:hover:bg-white/5 [a&]:hover:text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
