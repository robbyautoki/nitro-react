import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const frameVariants = cva(
    'relative flex flex-col bg-muted/50 gap-[3px] p-[3px] rounded-lg border border-border/50 bg-clip-padding',
    {
        variants: {
            spacing: {
                xs: '[&_[data-slot=frame-panel]]:p-2',
                sm: '[&_[data-slot=frame-panel]]:p-3',
                default: '[&_[data-slot=frame-panel]]:p-4',
                lg: '[&_[data-slot=frame-panel]]:p-5',
            },
        },
        defaultVariants: {
            spacing: 'default',
        },
    }
);

function Frame({
    className,
    spacing,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof frameVariants>) {
    return (
        <div
            className={ cn(frameVariants({ spacing }), className) }
            data-slot="frame"
            { ...props }
        />
    );
}

function FramePanel({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={ cn(
                'bg-background relative rounded-lg border bg-clip-padding shadow-sm',
                className
            ) }
            data-slot="frame-panel"
            { ...props }
        />
    );
}

export { Frame, FramePanel, frameVariants };
