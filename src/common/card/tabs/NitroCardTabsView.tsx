import { FC, useMemo } from 'react';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import { Flex, FlexProps } from '../..';

export const NitroCardTabsView: FC<FlexProps> = props =>
{
    const { justifyContent = 'center', gap = 1, position = 'relative', classNames = [], children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [
            'container-fluid',
            'nitro-card-tabs',
            'pt-1',
            '!min-h-10',
            '!max-h-10',
            '!border-0',
            '!bg-bg-white-0',
            '!px-2'
        ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    return (
        <Flex justifyContent={ justifyContent } gap={ gap } position={ position } classNames={ getClassNames } { ...rest }>
            { children }
            <AlignDivider.Root className="pointer-events-none absolute inset-x-0 bottom-0" />
        </Flex>
    );
}
