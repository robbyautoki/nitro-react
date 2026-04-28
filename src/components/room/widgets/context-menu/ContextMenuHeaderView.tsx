import { ComponentType, FC, useMemo } from 'react';
import { Column, Flex, FlexProps } from '../../../../common';

interface ContextMenuHeaderViewProps extends FlexProps
{
    subtitle?: string;
    relationshipIcon?: string;
    relationshipColor?: string;
    icon?: ComponentType<{ className?: string }>;
}

export const ContextMenuHeaderView: FC<ContextMenuHeaderViewProps> = props =>
{
    const { subtitle, relationshipIcon, relationshipColor, icon: Icon, justifyContent = 'center', alignItems = 'center', classNames = [], children, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'menu-header' ];

        if(Icon || subtitle) newClassNames.push('with-icon');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ Icon, subtitle, classNames ]);

    if(Icon || subtitle || relationshipIcon)
    {
        return (
            <Flex alignItems="center" gap={ 2 } classNames={ getClassNames } { ...rest }>
                { Icon && <Icon className="menu-header-icon" /> }
                <Column className="menu-header-text" gap={ 0 }>
                    <Flex alignItems="center" gap={ 1 } className="menu-header-title">
                        { children }
                        { relationshipIcon && <span className="menu-header-relationship" style={{ color: relationshipColor || 'inherit' }}>{ relationshipIcon }</span> }
                    </Flex>
                    { subtitle && <span className="menu-header-subtitle">{ subtitle }</span> }
                </Column>
            </Flex>
        );
    }

    return <Flex justifyContent={ justifyContent } alignItems={ alignItems } classNames={ getClassNames } { ...rest }>{ children }</Flex>;
}
