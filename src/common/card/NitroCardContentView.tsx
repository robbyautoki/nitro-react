import { FC, useMemo } from 'react';
import { Column, ColumnProps } from '..';

export const NitroCardContentView: FC<ColumnProps> = props =>
{
    const { overflow = 'auto', classNames = [], ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [
            'container-fluid',
            'content-area',
            '!min-h-0',
            '!bg-bg-white-0',
            '!p-3',
            '!text-text-strong-950'
        ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    return <Column classNames={ getClassNames } overflow={ overflow } { ...rest } />;
}
