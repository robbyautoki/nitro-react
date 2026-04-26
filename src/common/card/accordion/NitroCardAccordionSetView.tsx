import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Column, ColumnProps, Flex, Text } from '../..';
import { useNitroCardAccordionContext } from './NitroCardAccordionContext';

export interface NitroCardAccordionSetViewProps extends ColumnProps
{
    headerText: string;
    isExpanded?: boolean;
}

export const NitroCardAccordionSetView: FC<NitroCardAccordionSetViewProps> = props =>
{
    const { headerText = '', isExpanded = false, gap = 0, classNames = [], children = null, ...rest } = props;
    const [ isOpen, setIsOpen ] = useState(false);
    const { setClosers = null, closeAll = null } = useNitroCardAccordionContext();

    const onClick = () =>
    {
        closeAll();
        
        setIsOpen(prevValue => !prevValue);
    }

    const onClose = useCallback(() => setIsOpen(false), []);

    const getClassNames = useMemo(() =>
    {
        const newClassNames = [
            'nitro-card-accordion-set',
            '!border-b',
            '!border-stroke-soft-200',
            '!bg-bg-white-0',
            '!text-text-strong-950'
        ];

        if(isOpen) newClassNames.push('active', '!bg-bg-weak-50');

        if(classNames && classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ isOpen, classNames ]);

    useEffect(() =>
    {
        setIsOpen(isExpanded);
    }, [ isExpanded ]);

    useEffect(() =>
    {
        const closeFunction = onClose;

        setClosers(prevValue =>
        {
            const newClosers = [ ...prevValue ];

            newClosers.push(closeFunction);

            return newClosers;
        });

        return () =>
        {
            setClosers(prevValue =>
            {
                const newClosers = [ ...prevValue ];

                const index = newClosers.indexOf(closeFunction);

                if(index >= 0) newClosers.splice(index, 1);
    
                return newClosers;
            });
        }
    }, [ onClose, setClosers ]);

    return (
        <Column classNames={ getClassNames } gap={ gap } { ...rest }>
            <Flex pointer justifyContent="between" className="nitro-card-accordion-set-header !border-b !border-stroke-soft-200 !bg-none !bg-bg-white-0 px-2 py-1 !text-text-strong-950" onClick={ onClick }>
                <Text className="truncate !text-label-xs !font-medium !text-text-strong-950">{ headerText }</Text>
                { isOpen && <ChevronUp className="size-4 shrink-0 text-text-sub-600" /> }
                { !isOpen && <ChevronDown className="size-4 shrink-0 text-text-sub-600" /> }
            </Flex>
            { isOpen &&
                <Column fullHeight overflow="auto" gap={ 0 } className="nitro-card-accordion-set-content !bg-bg-white-0 !text-text-strong-950">
                    { children }
                </Column> }
        </Column>
    );
}
