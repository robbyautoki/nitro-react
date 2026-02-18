import { FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';
import { ColorVariantType, FontSizeType, FontWeightType, TextAlignType } from './types';

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

const FONT_SIZE_MAP: Record<number, string> = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
};

const FONT_WEIGHT_MAP: Record<string, string> = {
    'bold': 'font-bold',
    'bolder': 'font-extrabold',
    'normal': 'font-normal',
    'light': 'font-light',
    'lighter': 'font-thin',
};

export interface TextProps extends BaseProps<HTMLDivElement>
{
    variant?: ColorVariantType;
    fontWeight?: FontWeightType;
    fontSize?: FontSizeType;
    align?: TextAlignType;
    bold?: boolean;
    underline?: boolean;
    italics?: boolean;
    truncate?: boolean;
    center?: boolean;
    textEnd?: boolean;
    small?: boolean;
    wrap?: boolean;
    noWrap?: boolean;
    textBreak?: boolean;
}

export const Text: FC<TextProps> = props =>
{
    const { variant = 'white', fontWeight = null, fontSize = 0, align = null, bold = false, underline = false, italics = false, truncate = false, center = false, textEnd = false, small = false, wrap = false, noWrap = false, textBreak = false, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'inline' ];

        if(variant) newClassNames.push(COLOR_MAP[variant] || ('text-' + variant));

        if(bold) newClassNames.push('font-bold');

        if(fontWeight) newClassNames.push(FONT_WEIGHT_MAP[fontWeight] || ('font-' + fontWeight));

        if(fontSize) newClassNames.push(FONT_SIZE_MAP[fontSize] || ('text-' + fontSize));

        if(align) newClassNames.push('text-' + align);

        if(underline) newClassNames.push('underline');

        if(italics) newClassNames.push('italic');

        if(truncate) newClassNames.push('truncate');

        if(center) newClassNames.push('text-center');

        if(textEnd) newClassNames.push('text-right');

        if(small) newClassNames.push('text-sm');

        if(wrap) newClassNames.push('text-wrap');

        if(noWrap) newClassNames.push('whitespace-nowrap');

        if(textBreak) newClassNames.push('break-all');

        return newClassNames;
    }, [ variant, fontWeight, fontSize, align, bold, underline, italics, truncate, center, textEnd, small, wrap, noWrap, textBreak ]);

    return <Base classNames={ getClassNames } { ...rest } />;
}
