import { FC } from 'react';
import { Flex, FlexProps } from '../..';

export interface NitroCardAccordionItemViewProps extends FlexProps
{

}

export const NitroCardAccordionItemView: FC<NitroCardAccordionItemViewProps> = props =>
{
    const { alignItems = 'center', gap = 1, classNames = [], children = null, ...rest } = props;

    const getClassNames = [
        '!text-text-strong-950',
        'transition-colors',
        'hover:!bg-bg-weak-50',
        ...classNames
    ];

    return (
        <Flex alignItems={ alignItems } gap={ gap } classNames={ getClassNames } { ...rest }>
            { children }
        </Flex>
    );
}
