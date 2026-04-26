import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2 text-label-xs leading-none whitespace-nowrap transition duration-200 ease-out focus-visible:shadow-button-important-focus [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary-base text-static-white [a&]:hover:bg-primary-darker",
        secondary:
          "bg-faded-light text-faded-dark [a&]:hover:bg-faded-lighter",
        destructive:
          "bg-error-light text-error-dark [a&]:hover:bg-error-lighter",
        outline:
          "border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 [a&]:hover:bg-bg-weak-50 [a&]:hover:text-text-strong-950",
        ghost: "bg-transparent text-text-sub-600 [a&]:hover:bg-bg-weak-50 [a&]:hover:text-text-strong-950",
        link: "bg-transparent text-primary-base [a&]:hover:bg-primary-alpha-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
