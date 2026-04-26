import * as React from 'react';
import { cn } from '../../utils/cn';

type ProgressColor = 'blue' | 'red' | 'orange' | 'green';

const colorClass: Record<ProgressColor, string> = {
    blue: 'bg-information-base',
    red: 'bg-error-base',
    orange: 'bg-warning-base',
    green: 'bg-success-base',
};

export const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    value?: number;
    max?: number;
    color?: ProgressColor;
}>(({ className, value = 0, max = 100, color = 'blue', ...props }, ref) =>
{
    const safeMax = Math.max(1, max);
    const safeValue = Math.min(safeMax, Math.max(0, value));

    return (
        <div
            ref={ ref }
            className={ cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-soft-200', className) }
            { ...props }
        >
            <div
                className={ cn('h-full rounded-full transition-all duration-300 ease-out', colorClass[color]) }
                style={ { width: `${ (safeValue / safeMax) * 100 }%` } }
                aria-valuenow={ safeValue }
                aria-valuemax={ safeMax }
                role="progressbar"
            />
        </div>
    );
});

Root.displayName = 'AlignProgressBarRoot';
