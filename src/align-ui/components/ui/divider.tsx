import * as React from 'react';
import { cn } from '../../utils/cn';

type DividerVariant = 'line' | 'line-spacing' | 'line-text' | 'content' | 'text' | 'solid-text';

const variantClasses: Record<DividerVariant, string> = {
    line: 'h-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-stroke-soft-200',
    'line-spacing': 'h-1 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-stroke-soft-200',
    'line-text': 'gap-2.5 text-subheading-2xs text-text-soft-400 before:h-px before:w-full before:flex-1 before:bg-stroke-soft-200 after:h-px after:w-full after:flex-1 after:bg-stroke-soft-200',
    content: 'gap-2.5 before:h-px before:w-full before:flex-1 before:bg-stroke-soft-200 after:h-px after:w-full after:flex-1 after:bg-stroke-soft-200',
    text: 'px-2 py-1 text-subheading-xs text-text-soft-400',
    'solid-text': 'bg-bg-weak-50 px-5 py-1.5 uppercase text-subheading-xs text-text-soft-400',
};

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: DividerVariant;
}

export function Root({ className, variant, ...props }: DividerProps) {
    if(!variant) {
        return <div className={cn('h-px w-full bg-stroke-soft-200', className)} {...props} />;
    }
    return (
        <div
            role="separator"
            className={cn('relative flex w-full items-center', variantClasses[variant], className)}
            {...props}
        />
    );
}
