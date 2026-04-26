import { FC, useMemo } from 'react';
import { Flex, FlexProps } from '../../Flex';
import { LayoutItemCountView } from '../../layout';

interface NitroCardTabsItemViewProps extends FlexProps
{
    isActive?: boolean;
    count?: number;
}

export const NitroCardTabsItemView: FC<NitroCardTabsItemViewProps> = props =>
{
    const { isActive = false, count = 0, overflow = 'hidden', position = 'relative', pointer = true, classNames = [], children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [
            'nav-item',
            'rounded-top',
            'border',
            '!items-center',
            '!gap-1.5',
            '!rounded-lg',
            '!border-transparent',
            '!px-3',
            '!py-1.5',
            '!text-label-xs',
            '!font-medium',
            '!text-text-sub-600',
            '!transition',
            '!duration-200',
            'hover:!bg-bg-weak-50',
            'hover:!text-text-strong-950'
        ];

        if(isActive) newClassNames.push('active', '!bg-bg-weak-50', '!text-text-strong-950', '!ring-1', '!ring-inset', '!ring-stroke-soft-200', '!shadow-regular-xs');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ isActive, classNames ]);

    return (
        <Flex overflow={ overflow } pointer={ pointer } position={ position } classNames={ getClassNames } { ...rest }>
            <Flex shrink center>
                { children }
            </Flex>
            { (count > 0) &&
                <LayoutItemCountView count={ count } /> }
        </Flex>
    );
}
