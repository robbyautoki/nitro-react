import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { FaCheck } from 'react-icons/fa';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ ref }
        className={ cn(
            'peer size-4 shrink-0 rounded-sm border border-zinc-300 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 data-[state=checked]:text-white',
            className
        ) }
        { ...props }
    >
        <CheckboxPrimitive.Indicator className={ cn('flex items-center justify-center text-current') }>
            <FaCheck className="size-2.5" />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
