import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1 text-paragraph-sm text-text-strong-950 shadow-regular-xs outline-none transition duration-200 ease-out",
        "placeholder:text-text-soft-400 selection:bg-primary-alpha-10 selection:text-primary-base",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-label-sm file:text-text-strong-950",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-bg-weak-50 disabled:text-text-disabled-300",
        "focus-visible:border-stroke-strong-950 focus-visible:shadow-button-important-focus",
        "aria-invalid:border-error-base aria-invalid:shadow-button-error-focus",
        className
      )}
      {...props}
    />
  )
}

export { Input }
