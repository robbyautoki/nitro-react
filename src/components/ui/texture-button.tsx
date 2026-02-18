import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const outerVariants = cva(
    'border p-[1px] transition duration-200 ease-in-out',
    {
        variants: {
            variant: {
                primary:
                    'border-white/[0.12] bg-gradient-to-b from-white/20 to-white/[0.06]',
                success:
                    'border-emerald-400/30 bg-gradient-to-b from-emerald-400/40 to-emerald-600/30',
                destructive:
                    'border-red-400/30 bg-gradient-to-b from-red-400/40 to-red-600/30',
                secondary:
                    'border-white/[0.08] bg-white/[0.04]',
                warning:
                    'border-amber-400/30 bg-gradient-to-b from-amber-400/40 to-amber-600/30',
                accent:
                    'border-indigo-400/30 bg-gradient-to-b from-indigo-400/40 to-indigo-600/30',
                link:
                    'border-transparent bg-transparent p-0',
                minimal:
                    'border-white/[0.08] bg-transparent hover:bg-white/[0.04]',
                icon:
                    'rounded-full border-white/[0.10] bg-white/[0.04]',
            },
            size: {
                sm: 'rounded-[6px]',
                default: 'rounded-[10px]',
                lg: 'rounded-[10px]',
                icon: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    }
);

const innerVariants = cva(
    'w-full h-full flex items-center justify-center gap-1.5 font-medium transition duration-200 ease-in-out',
    {
        variants: {
            variant: {
                primary:
                    'bg-gradient-to-b from-white/[0.10] to-white/[0.04] text-white/90 hover:from-white/[0.14] hover:to-white/[0.08] active:from-white/[0.06] active:to-white/[0.02]',
                success:
                    'bg-gradient-to-b from-emerald-500/50 to-emerald-600/50 text-white/90 hover:from-emerald-500/60 hover:to-emerald-600/60 active:from-emerald-500/40 active:to-emerald-600/40',
                destructive:
                    'bg-gradient-to-b from-red-400/50 to-red-500/50 text-white/90 hover:from-red-400/60 hover:to-red-500/60 active:from-red-400/40 active:to-red-500/40',
                secondary:
                    'bg-gradient-to-b from-white/[0.06] to-white/[0.02] text-white/70 hover:from-white/[0.10] hover:to-white/[0.06] active:from-white/[0.04] active:to-white/[0.02]',
                warning:
                    'bg-gradient-to-b from-amber-400/50 to-amber-500/50 text-white/90 hover:from-amber-400/60 hover:to-amber-500/60 active:from-amber-400/40 active:to-amber-500/40',
                accent:
                    'bg-gradient-to-b from-indigo-400/50 to-indigo-600/50 text-white/90 hover:from-indigo-400/60 hover:to-indigo-600/60 active:from-indigo-400/40 active:to-indigo-600/40',
                link:
                    'bg-transparent text-sky-400/80 hover:text-sky-300 hover:underline underline-offset-2 active:text-sky-400',
                minimal:
                    'bg-transparent text-white/70 hover:bg-white/[0.04] active:bg-white/[0.02]',
                icon:
                    'bg-transparent text-white/70 hover:bg-white/[0.06] active:bg-white/[0.04] rounded-full',
            },
            size: {
                sm: 'text-xs rounded-[4px] px-3 py-1',
                default: 'text-sm rounded-[8px] px-4 py-1.5',
                lg: 'text-sm rounded-[8px] px-5 py-2',
                icon: 'rounded-full p-1.5',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    }
);

export type TextureButtonVariant =
    | 'primary'
    | 'success'
    | 'destructive'
    | 'secondary'
    | 'warning'
    | 'accent'
    | 'link'
    | 'minimal'
    | 'icon';

export type TextureButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface TextureButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>
{
    variant?: TextureButtonVariant;
    size?: TextureButtonSize;
    asChild?: boolean;
}

const TextureButton = React.forwardRef<HTMLButtonElement, TextureButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'default',
            asChild = false,
            className,
            disabled,
            ...props
        },
        ref
    ) =>
    {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={ cn(
                    outerVariants({ variant, size }),
                    disabled && 'opacity-50 pointer-events-none',
                    className
                ) }
                ref={ ref }
                disabled={ disabled }
                { ...props }
            >
                <div className={ cn(innerVariants({ variant, size })) }>
                    { children }
                </div>
            </Comp>
        );
    }
);

TextureButton.displayName = 'TextureButton';

export { TextureButton };
