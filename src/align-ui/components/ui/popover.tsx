import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';

export const Root = PopoverPrimitive.Root;
export const Anchor = PopoverPrimitive.Anchor;
export const Trigger = PopoverPrimitive.Trigger;
export const Close = PopoverPrimitive.Close;

export const Content = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    showArrow?: boolean;
    unstyled?: boolean;
  }
>(
  (
    {
      children,
      className,
      align = 'center',
      sideOffset = 12,
      collisionPadding = 12,
      arrowPadding = 12,
      showArrow = true,
      unstyled,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        arrowPadding={arrowPadding}
        className={cn(
          !unstyled &&
            'w-max rounded-2xl bg-bg-white-0 p-5 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200',
          'z-50 data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        {children}
        {showArrow && (
          <PopoverPrimitive.Arrow asChild>
            <div className='size-[11px] -translate-y-[calc(50%+1px)] -rotate-45 rounded-bl-[3px] border border-stroke-soft-200 bg-bg-white-0 [clip-path:polygon(0_100%,0_0,100%_100%)]' />
          </PopoverPrimitive.Arrow>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  ),
);
Content.displayName = 'AlignPopoverContent';
