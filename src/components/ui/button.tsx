import * as React from 'react';
import { cn } from '@/lib/utils';
import { TextureButton, TextureButtonVariant, TextureButtonSize } from './texture-button';

const VARIANT_MAP: Record<string, TextureButtonVariant> = {
    default: 'primary',
    destructive: 'destructive',
    outline: 'secondary',
    secondary: 'secondary',
    ghost: 'minimal',
    link: 'link',
    warning: 'warning',
    success: 'success',
};

const SIZE_MAP: Record<string, TextureButtonSize> = {
    default: 'default',
    xs: 'sm',
    sm: 'sm',
    lg: 'lg',
    icon: 'icon',
    'icon-xs': 'icon',
    'icon-sm': 'icon',
    'icon-lg': 'icon',
};

interface ButtonProps extends React.ComponentProps<'button'>
{
    variant?: string;
    size?: string;
    asChild?: boolean;
}

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: ButtonProps) {
    return (
        <TextureButton
            variant={ VARIANT_MAP[variant] || 'primary' }
            size={ SIZE_MAP[size] || 'default' }
            asChild={ asChild }
            className={ cn(className) }
            { ...props }
        />
    );
}

export { Button };
