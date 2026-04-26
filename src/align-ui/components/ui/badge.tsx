import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium leading-none tracking-normal transition duration-200 ease-out',
  {
    variants: {
      size: {
        small: 'h-5 gap-1.5 px-2 text-[11px]',
        medium: 'h-6 gap-1.5 px-2.5 text-xs',
      },
      variant: {
        filled: 'text-static-white',
        light: '',
        lighter: '',
        stroke: 'ring-1 ring-inset ring-current',
      },
      color: {
        gray: '',
        blue: '',
        orange: '',
        red: '',
        green: '',
        yellow: '',
        purple: '',
        sky: '',
        pink: '',
        teal: '',
      },
      square: {
        true: 'rounded-md',
      },
    },
    compoundVariants: [
      { variant: 'filled', color: 'gray', class: 'bg-faded-base' },
      { variant: 'filled', color: 'blue', class: 'bg-information-base' },
      { variant: 'filled', color: 'orange', class: 'bg-warning-base' },
      { variant: 'filled', color: 'red', class: 'bg-error-base' },
      { variant: 'filled', color: 'green', class: 'bg-success-base' },
      { variant: 'filled', color: 'yellow', class: 'bg-away-base' },
      { variant: 'filled', color: 'purple', class: 'bg-feature-base' },
      { variant: 'filled', color: 'sky', class: 'bg-verified-base' },
      { variant: 'filled', color: 'pink', class: 'bg-highlighted-base' },
      { variant: 'filled', color: 'teal', class: 'bg-stable-base' },
      { variant: 'light', color: 'gray', class: 'bg-faded-light text-faded-dark' },
      { variant: 'light', color: 'blue', class: 'bg-information-light text-information-dark' },
      { variant: 'light', color: 'orange', class: 'bg-warning-light text-warning-dark' },
      { variant: 'light', color: 'red', class: 'bg-error-light text-error-dark' },
      { variant: 'light', color: 'green', class: 'bg-success-light text-success-dark' },
      { variant: 'light', color: 'yellow', class: 'bg-away-light text-away-dark' },
      { variant: 'light', color: 'purple', class: 'bg-feature-light text-feature-dark' },
      { variant: 'light', color: 'sky', class: 'bg-verified-light text-verified-dark' },
      { variant: 'light', color: 'pink', class: 'bg-highlighted-light text-highlighted-dark' },
      { variant: 'light', color: 'teal', class: 'bg-stable-light text-stable-dark' },
      { variant: 'lighter', color: 'gray', class: 'bg-faded-lighter text-faded-base' },
      { variant: 'lighter', color: 'blue', class: 'bg-information-lighter text-information-base' },
      { variant: 'lighter', color: 'orange', class: 'bg-warning-lighter text-warning-base' },
      { variant: 'lighter', color: 'red', class: 'bg-error-lighter text-error-base' },
      { variant: 'lighter', color: 'green', class: 'bg-success-lighter text-success-base' },
      { variant: 'lighter', color: 'yellow', class: 'bg-away-lighter text-away-base' },
      { variant: 'lighter', color: 'purple', class: 'bg-feature-lighter text-feature-base' },
      { variant: 'lighter', color: 'sky', class: 'bg-verified-lighter text-verified-base' },
      { variant: 'lighter', color: 'pink', class: 'bg-highlighted-lighter text-highlighted-base' },
      { variant: 'lighter', color: 'teal', class: 'bg-stable-lighter text-stable-base' },
      { variant: 'stroke', color: 'gray', class: 'text-faded-base' },
      { variant: 'stroke', color: 'blue', class: 'text-information-base' },
      { variant: 'stroke', color: 'orange', class: 'text-warning-base' },
      { variant: 'stroke', color: 'red', class: 'text-error-base' },
      { variant: 'stroke', color: 'green', class: 'text-success-base' },
      { variant: 'stroke', color: 'yellow', class: 'text-away-base' },
      { variant: 'stroke', color: 'purple', class: 'text-feature-base' },
      { variant: 'stroke', color: 'sky', class: 'text-verified-base' },
      { variant: 'stroke', color: 'pink', class: 'text-highlighted-base' },
      { variant: 'stroke', color: 'teal', class: 'text-stable-base' },
    ],
    defaultVariants: {
      size: 'medium',
      variant: 'light',
      color: 'gray',
    },
  },
);

export type BadgeRootProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export const Root = React.forwardRef<HTMLSpanElement, BadgeRootProps>(
  ({ className, size, variant, color, square, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="align-badge"
      className={cn(badgeVariants({ size, variant, color, square }), className)}
      {...props}
    />
  ),
);
Root.displayName = 'AlignBadgeRoot';

export const Icon = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    as?: React.ElementType;
  }
>(({ as: Comp = 'span', className, ...props }, ref) => (
  <Comp ref={ref} className={cn('shrink-0', className)} {...props} />
));
Icon.displayName = 'AlignBadgeIcon';

export const Dot = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('flex size-4 items-center justify-center before:size-1 before:rounded-full before:bg-current', className)}
      {...props}
    />
  ),
);
Dot.displayName = 'AlignBadgeDot';
