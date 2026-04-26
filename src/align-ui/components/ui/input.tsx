import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils/cn';

export interface InputRootProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'xsmall';
  hasError?: boolean;
  asChild?: boolean;
}

export const Root = React.forwardRef<HTMLDivElement, InputRootProps>(
  ({ asChild, className, size = 'small', hasError, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(
          'group relative flex w-full overflow-hidden bg-bg-white-0 text-text-strong-950 shadow-regular-xs transition duration-200 ease-out',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-inset before:ring-stroke-soft-200 before:transition',
          'hover:shadow-none focus-within:shadow-button-important-focus focus-within:before:ring-stroke-strong-950',
          hasError && 'focus-within:shadow-button-error-focus before:ring-error-base focus-within:before:ring-error-base',
          size === 'xsmall' ? 'rounded-lg' : 'rounded-lg',
          className
        )}
        {...props}
      />
    );
  }
);
Root.displayName = 'AlignInputRoot';

export const Wrapper = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'group/input-wrapper flex w-full cursor-text items-center gap-1.5 bg-bg-white-0 px-2 transition duration-200 ease-out',
        'hover:bg-bg-weak-50 has-[input:disabled]:pointer-events-none has-[input:disabled]:bg-bg-weak-50',
        className
      )}
      {...props}
    />
  )
);
Wrapper.displayName = 'AlignInputWrapper';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-8 w-full bg-transparent text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out',
        'placeholder:select-none placeholder:text-text-soft-400 disabled:text-text-disabled-300 disabled:placeholder:text-text-disabled-300',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'AlignInput';

export const Icon = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }>(
  ({ as: Comp = 'span', className, ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn('flex size-5 shrink-0 select-none items-center justify-center text-text-sub-600 transition duration-200 ease-out', className)}
      {...props}
    />
  )
);
Icon.displayName = 'AlignInputIcon';
