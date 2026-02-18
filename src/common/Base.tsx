import { CSSProperties, DetailedHTMLProps, FC, HTMLAttributes, MutableRefObject, ReactNode, useMemo } from 'react';
import { ColorVariantType, DisplayType, FloatType, OverflowType, PositionType } from './types';

const DISPLAY_MAP: Record<string, string> = {
    'none': 'hidden',
    'inline': 'inline',
    'inline-block': 'inline-block',
    'block': 'block',
    'grid': 'grid',
    'table': 'table',
    'table-cell': 'table-cell',
    'table-row': 'table-row',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
};

const FLOAT_MAP: Record<string, string> = {
    'start': 'float-left',
    'end': 'float-right',
    'none': 'float-none',
};

const COLOR_MAP: Record<string, string> = {
    'white': 'text-white',
    'black': 'text-black',
    'primary': 'text-primary',
    'secondary': 'text-secondary-foreground',
    'success': 'text-green-500',
    'danger': 'text-red-500',
    'warning': 'text-yellow-1/20',
    'muted': 'text-muted-foreground',
    'dark': 'text-white/90',
    'light': 'text-white/60',
    'link': 'text-blue-400',
};

export interface BaseProps<T = HTMLElement> extends DetailedHTMLProps<HTMLAttributes<T>, T>
{
    innerRef?: MutableRefObject<T>;
    display?: DisplayType;
    fit?: boolean;
    fitV?: boolean;
    grow?: boolean;
    shrink?: boolean;
    fullWidth?: boolean;
    fullHeight?: boolean;
    overflow?: OverflowType;
    position?: PositionType;
    float?: FloatType;
    pointer?: boolean;
    visible?: boolean;
    textColor?: ColorVariantType;
    classNames?: string[];
    children?: ReactNode;
}

export const Base: FC<BaseProps<HTMLDivElement>> = props =>
{
    const { ref = null, innerRef = null, display = null, fit = false, fitV = false, grow = false, shrink = false, fullWidth = false, fullHeight = false, overflow = null, position = null, float = null, pointer = false, visible = null, textColor = null, classNames = [], className = '', style = {}, children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [];

        if(display && display.length) newClassNames.push(DISPLAY_MAP[display] || display);

        if(fit || fullWidth) newClassNames.push('w-full');

        if(fit || fullHeight) newClassNames.push('h-full');

        if(fitV) newClassNames.push('w-screen', 'h-screen');

        if(grow) newClassNames.push('grow');

        if(shrink) newClassNames.push('shrink-0');

        if(overflow) newClassNames.push('overflow-' + overflow);

        if(position) newClassNames.push(position);

        if(float) newClassNames.push(FLOAT_MAP[float] || ('float-' + float));

        if(pointer) newClassNames.push('cursor-pointer');

        if(visible !== null) newClassNames.push(visible ? 'visible' : 'invisible');

        if(textColor) newClassNames.push(COLOR_MAP[textColor] || ('text-' + textColor));

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ display, fit, fitV, grow, shrink, fullWidth, fullHeight, overflow, position, float, pointer, visible, textColor, classNames ]);

    const getClassName = useMemo(() =>
    {
        let newClassName = getClassNames.join(' ');

        if(className.length) newClassName += (' ' + className);

        return newClassName.trim();
    }, [ getClassNames, className ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ style ]);

    return (
        <div ref={ innerRef } className={ getClassName } style={ getStyle } { ...rest }>
            { children }
        </div>
    );
}
