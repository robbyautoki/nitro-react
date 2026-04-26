import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "relative inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-transparent font-medium outline-none transition duration-200 ease-out focus-visible:shadow-button-important-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary-base text-static-white",
        outline: "border-stroke-soft-200 bg-bg-white-0 text-text-sub-600",
        secondary: "bg-faded-light text-faded-dark",
        info: "bg-information-base text-static-white",
        success: "bg-success-base text-static-white",
        warning: "bg-warning-base text-static-white",
        destructive: "bg-error-base text-static-white",
        invert: "bg-bg-strong-950 text-text-white-0",
        "primary-light":
          "border-none bg-primary-alpha-10 text-primary-base",
        "warning-light":
          "border-none bg-warning-light text-warning-dark",
        "success-light":
          "border-none bg-success-light text-success-dark",
        "info-light":
          "border-none bg-information-light text-information-dark",
        "destructive-light":
          "border-none bg-error-light text-error-dark",
        "invert-light":
          "border-none bg-faded-lighter text-faded-base",
        "primary-outline":
          "border-primary-base bg-bg-white-0 text-primary-base",
        "warning-outline":
          "border-warning-base bg-bg-white-0 text-warning-base",
        "success-outline":
          "border-success-base bg-bg-white-0 text-success-base",
        "info-outline":
          "border-information-base bg-bg-white-0 text-information-base",
        "destructive-outline":
          "border-error-base bg-bg-white-0 text-error-base",
        "invert-outline":
          "border-stroke-strong-950 bg-bg-white-0 text-text-strong-950",
      },
      size: {
        xs: "px-1 py-0.25 text-[0.6rem] leading-none h-4 min-w-4 gap-1",
        sm: "px-1 py-0.25 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1",
        default: "px-1.25 py-0.5 text-xs h-5 min-w-5 gap-1",
        lg: "px-1.5 py-0.5 text-xs h-5.5 min-w-5.5 gap-1",
        xl: "px-2 py-0.75 text-sm h-6 min-w-6 gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeProps }
