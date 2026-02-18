import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    [
        'relative w-full text-sm border grid gap-y-0.5 items-center [&>svg:not([class*=size-])]:size-4',
        'has-[>svg]:grid-cols-[1rem_1fr] grid-cols-[0_1fr]',
        'has-[>[data-slot=alert-title]+[data-slot=alert-description]]:items-start',
        'has-[>[data-slot=alert-title]+[data-slot=alert-description]]:[&_svg]:translate-y-0.5',
        'rounded-lg px-4 py-3 has-[>svg]:gap-x-3',
    ],
    {
        variants: {
            variant: {
                default: 'bg-card text-card-foreground',
                destructive: 'border-destructive/30 bg-destructive/[0.04] [&>svg]:text-destructive',
                info: 'border-blue-500/30 bg-blue-500/[0.04] [&>svg]:text-blue-500',
                success: 'border-green-500/30 bg-green-500/[0.04] [&>svg]:text-green-500',
                warning: 'border-yellow-1/20/30 bg-yellow-1/20/[0.04] [&>svg]:text-yellow-1/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

function Alert({
    className,
    variant,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
    return (
        <div
            data-slot="alert"
            role="alert"
            className={ cn(alertVariants({ variant }), className) }
            { ...props }
        />
    );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-title"
            className={ cn('col-left-2 line-clamp-1 min-h-4 font-medium tracking-tight', className) }
            { ...props }
        />
    );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-description"
            className={ cn('text-muted-foreground col-left-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed', className) }
            { ...props }
        />
    );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
