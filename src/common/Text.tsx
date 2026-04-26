import { FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';
import { ColorVariantType, FontSizeType, FontWeightType, TextAlignType } from './types';

const COLOR_MAP: Record<string, string> = {
    'white': 'text-text-white-0',
    'black': 'text-text-strong-950',
    'primary': 'text-primary-base',
    'secondary': 'text-text-sub-600',
    'success': 'text-success-base',
    'danger': 'text-error-base',
    'warning': 'text-warning-base',
    'muted': 'text-text-sub-600',
    'dark': 'text-text-strong-950',
    'light': 'text-text-sub-600',
    'link': 'text-primary-base',
};

const FONT_SIZE_MAP: Record<number, string> = {
    1: 'text-title-h6',
    2: 'text-label-lg',
    3: 'text-label-md',
    4: 'text-label-sm',
    5: 'text-paragraph-sm',
    6: 'text-paragraph-xs',
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
    const { variant = 'secondary', fontWeight = null, fontSize = 0, align = null, bold = false, underline = false, italics = false, truncate = false, center = false, textEnd = false, small = false, wrap = false, noWrap = false, textBreak = false, ...rest } = props;

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

        if(small) newClassNames.push('text-paragraph-xs');

        if(wrap) newClassNames.push('text-wrap');

        if(noWrap) newClassNames.push('whitespace-nowrap');

        if(textBreak) newClassNames.push('break-all');

        return newClassNames;
    }, [ variant, fontWeight, fontSize, align, bold, underline, italics, truncate, center, textEnd, small, wrap, noWrap, textBreak ]);

    return <Base classNames={ getClassNames } { ...rest } />;
}
