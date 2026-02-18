import { FC, useMemo } from 'react';
import { TextureButton, TextureButtonVariant, TextureButtonSize } from '../components/ui/texture-button';
import { FlexProps } from './Flex';
import { ButtonSizeType, ColorVariantType } from './types';

export interface ButtonProps extends FlexProps
{
    variant?: ColorVariantType;
    size?: ButtonSizeType;
    active?: boolean;
    disabled?: boolean;
}

const VARIANT_MAP: Record<string, TextureButtonVariant> = {
    primary: 'primary',
    success: 'success',
    danger: 'destructive',
    secondary: 'secondary',
    warning: 'warning',
    link: 'link',
    light: 'minimal',
    dark: 'primary',
    muted: 'secondary',
    black: 'primary',
    white: 'minimal',
};

const SIZE_MAP: Record<string, TextureButtonSize> = {
    sm: 'sm',
    lg: 'lg',
};

export const Button: FC<ButtonProps> = props =>
{
    const {
        variant = 'primary',
        size = 'sm',
        active = false,
        disabled = false,
        fullWidth = false,
        className = '',
        classNames = [],
        children,
        onClick,
        style,
        // Destructure away Flex/Base props so they don't get passed to <button>
        display: _d, column: _col, reverse: _rev, gap: _gap, center: _cen,
        alignSelf: _as, alignItems: _ai, justifyContent: _jc,
        fit: _f, fitV: _fv, grow: _g, shrink: _s, fullHeight: _fh,
        overflow: _o, position: _pos, float: _fl, pointer: _p,
        visible: _v, textColor: _tc, innerRef: _ir,
        ...rest
    } = props;

    const mappedVariant = VARIANT_MAP[variant] || 'primary';
    const mappedSize = SIZE_MAP[size] || 'default';

    const combinedClassName = useMemo(() =>
    {
        const parts: string[] = [];
        if(fullWidth) parts.push('w-full');
        if(active) parts.push('ring-1 ring-white/20');
        if(classNames.length) parts.push(...classNames);
        if(className.length) parts.push(className);
        return parts.join(' ') || undefined;
    }, [ fullWidth, active, classNames, className ]);

    return (
        <TextureButton
            variant={ mappedVariant }
            size={ mappedSize }
            disabled={ disabled }
            className={ combinedClassName }
            onClick={ onClick as any }
            style={ style }
            { ...rest }
        >
            { children }
        </TextureButton>
    );
}
