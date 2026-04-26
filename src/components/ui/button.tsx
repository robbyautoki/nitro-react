import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-10 text-label-sm outline-none",
    "transition duration-200 ease-out disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:ring-transparent",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary-base text-static-white hover:bg-primary-darker focus-visible:shadow-button-primary-focus",
        destructive:
          "bg-error-base text-static-white hover:bg-error-dark focus-visible:shadow-button-error-focus",
        success:
          "bg-success-base text-static-white hover:bg-success-dark focus-visible:shadow-button-important-focus",
        warning:
          "bg-warning-base text-static-white hover:bg-warning-dark focus-visible:shadow-button-important-focus",
        outline:
          "bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none hover:ring-transparent focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950",
        secondary:
          "bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-transparent hover:bg-bg-white-0 hover:text-text-strong-950 hover:shadow-regular-xs hover:ring-stroke-soft-200 focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950",
        ghost:
          "bg-transparent text-text-sub-600 ring-1 ring-inset ring-transparent hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950",
        link: "bg-transparent text-primary-base ring-1 ring-inset ring-transparent hover:bg-primary-alpha-10 focus-visible:bg-bg-white-0 focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base",
      },
      size: {
        default: "h-10 px-3.5",
        xs: "h-7 gap-2 rounded-lg px-2 text-label-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2.5 rounded-lg px-3",
        lg: "h-11 px-4 text-label-md",
        icon: "size-10 p-0",
        "icon-xs": "size-7 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg p-0",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
