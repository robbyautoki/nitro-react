import { ComponentType, FC, MouseEvent, useMemo } from 'react';
import { Flex, FlexProps } from '../../../../common';

interface ContextMenuListItemViewProps extends FlexProps
{
    disabled?: boolean;
    icon?: ComponentType<{ className?: string }>;
}

export const ContextMenuListItemView: FC<ContextMenuListItemViewProps> = props =>
{
    const { disabled = false, fullWidth = true, justifyContent = 'center', alignItems = 'center', classNames = [], onClick = null, icon: Icon, children, ...rest } = props;

    const handleClick = (event: MouseEvent<HTMLDivElement>) =>
    {
        if(disabled) return;

        if(onClick) onClick(event);
    }

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'menu-item', 'list-item' ];

        if(Icon) newClassNames.push('with-icon');
        if(disabled) newClassNames.push('disabled');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ Icon, disabled, classNames ]);

    if(Icon)
    {
        return (
            <Flex fullWidth={ fullWidth } alignItems="center" gap={ 2 } classNames={ getClassNames } onClick={ handleClick } { ...rest }>
                <Icon className="menu-item-icon" />
                <span className="menu-item-label">{ children }</span>
            </Flex>
        );
    }

    return <Flex fullWidth={ fullWidth } justifyContent={ justifyContent } alignItems={ alignItems } classNames={ getClassNames } onClick={ handleClick } { ...rest }>{ children }</Flex>;
}
