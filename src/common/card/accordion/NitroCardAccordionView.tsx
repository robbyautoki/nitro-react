import { FC, useCallback, useState } from 'react';
import { Column, ColumnProps } from '../..';
import { NitroCardAccordionContextProvider } from './NitroCardAccordionContext';

interface NitroCardAccordionViewProps extends ColumnProps
{
    
}

export const NitroCardAccordionView: FC<NitroCardAccordionViewProps> = props =>
{
    const { classNames = [], ...rest } = props;
    const [ closers, setClosers ] = useState<Function[]>([]);

    const getClassNames = [
        '!overflow-hidden',
        '!rounded-10',
        '!border',
        '!border-stroke-soft-200',
        '!bg-bg-white-0',
        ...classNames
    ];

    const closeAll = useCallback(() =>
    {
        for(const closer of closers) closer();
    }, [ closers ]);

    return (
        <NitroCardAccordionContextProvider value={ { closers, setClosers, closeAll } }>
            <Column gap={ 0 } classNames={ getClassNames } { ...rest } />
        </NitroCardAccordionContextProvider>
    );
}
