import { CSSProperties, FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';
import { GridContextProvider } from './GridContext';
import { AlignItemType, AlignSelfType, JustifyContentType, SpacingType } from './types';

const GAP_MAP: Record<number, string> = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-4',
    4: 'gap-6',
    5: 'gap-12',
};

export interface GridProps extends BaseProps<HTMLDivElement>
{
    inline?: boolean;
    gap?: SpacingType;
    maxContent?: boolean;
    columnCount?: number;
    center?: boolean;
    alignSelf?: AlignSelfType;
    alignItems?: AlignItemType;
    justifyContent?: JustifyContentType;
}

export const Grid: FC<GridProps> = props =>
{
    const { inline = false, gap = 2, maxContent = false, columnCount = 0, center = false, alignSelf = null, alignItems = null, justifyContent = null, fullHeight = true, classNames = [], style = {}, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [];

        if(inline) newClassNames.push('inline-grid');
        else newClassNames.push('grid');

        if(gap !== null && gap !== undefined) newClassNames.push(GAP_MAP[gap] || ('gap-' + gap));

        if(columnCount) newClassNames.push(`grid-cols-${ columnCount }`);

        if(maxContent) newClassNames.push('flex-basis-max-content');

        if(alignSelf) newClassNames.push('self-' + alignSelf);

        if(alignItems) newClassNames.push('items-' + alignItems);

        if(justifyContent) newClassNames.push('justify-' + justifyContent);

        if(!alignItems && !justifyContent && center) newClassNames.push('items-center', 'justify-center');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ inline, gap, maxContent, columnCount, alignSelf, alignItems, justifyContent, center, classNames ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ style ]);

    return (
        <GridContextProvider value={ { isCssGrid: true } }>
            <Base fullHeight={ fullHeight } classNames={ getClassNames } style={ getStyle } { ...rest } />
        </GridContextProvider>
    );
}
