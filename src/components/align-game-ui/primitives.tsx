import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/align-ui/utils/cn';

interface MetricTileProps
{
    icon?: ReactNode;
    label: ReactNode;
    value: ReactNode;
    meta?: ReactNode;
    className?: string;
    valueClassName?: string;
}

export function MetricTile({ icon, label, value, meta, className, valueClassName }: MetricTileProps)
{
    return (
        <div className={ cn('flex min-w-0 flex-col items-center gap-1 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 text-center shadow-regular-xs', className) }>
            { icon && <div className="flex size-6 items-center justify-center text-text-sub-600">{ icon }</div> }
            <div className={ cn('max-w-full truncate text-label-sm text-text-strong-950', valueClassName) }>{ value }</div>
            <div className="max-w-full truncate text-paragraph-xs text-text-sub-600">{ label }</div>
            { meta && <div className="max-w-full truncate text-subheading-2xs text-text-soft-400">{ meta }</div> }
        </div>
    );
}

type SelectableCardProps = (ButtonHTMLAttributes<HTMLButtonElement> | HTMLAttributes<HTMLDivElement>) &
{
    selected?: boolean;
    as?: 'button' | 'div';
    children: ReactNode;
};

export function SelectableCard({ selected, as = 'button', className, children, ...props }: SelectableCardProps)
{
    const cardClassName = cn(
        'flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition duration-200 ease-out',
        selected ? 'border-primary-base bg-primary-alpha-10 shadow-regular-xs' : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50',
        'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300',
        className,
    );

    if(as === 'div')
    {
        return (
            <div className={ cardClassName } { ...(props as HTMLAttributes<HTMLDivElement>) }>
                { children }
            </div>
        );
    }

    return (
        <button type="button" className={ cardClassName } { ...(props as ButtonHTMLAttributes<HTMLButtonElement>) }>
            { children }
        </button>
    );
}

interface EmptyStateProps
{
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps)
{
    return (
        <div className={ cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-8 text-center', className) }>
            { icon && <div className="mb-2 text-text-soft-400">{ icon }</div> }
            <div className="text-label-sm text-text-strong-950">{ title }</div>
            { description && <div className="mt-1 text-paragraph-xs text-text-sub-600">{ description }</div> }
        </div>
    );
}
