import { FC, useMemo } from 'react';
import { Column, Flex, FlexProps } from '../../../../common';

interface ContextMenuHeaderViewProps extends FlexProps
{
    subtitle?: string;
    relationshipIcon?: string;
    relationshipColor?: string;
}

export const ContextMenuHeaderView: FC<ContextMenuHeaderViewProps> = props =>
{
    const { subtitle, relationshipIcon, relationshipColor, justifyContent = 'center', alignItems = 'center', classNames = [], children, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'menu-header', 'p-1' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    if(subtitle || relationshipIcon)
    {
        return (
            <Column classNames={ getClassNames } { ...rest }>
                <Flex justifyContent="center" alignItems="center" gap={ 1 }>
                    { children }
                    { relationshipIcon && <span style={{ fontSize: '12px', color: relationshipColor || 'inherit' }}>{ relationshipIcon }</span> }
                </Flex>
                { subtitle && <span style={{ fontSize: '10px', opacity: 0.55, marginTop: '-2px' }}>{ subtitle }</span> }
            </Column>
        );
    }

    return <Flex justifyContent={ justifyContent } alignItems={ alignItems } classNames={ getClassNames } { ...rest }>{ children }</Flex>;
}
