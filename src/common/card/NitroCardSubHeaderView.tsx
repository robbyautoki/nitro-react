import { FC, useMemo } from 'react';
import { Flex, FlexProps } from '..';

interface NitroCardSubHeaderProps extends FlexProps {
    variant?: string;
}

const SUB_HEADER_VARIANTS: Record<string, string[]> = {
    muted: [ '!bg-bg-weak-50', '!text-text-sub-600', '!border-stroke-soft-200' ],
    primary: [ '!bg-primary-alpha-10', '!text-primary-base', '!border-primary-alpha-16' ],
    success: [ '!bg-success-lighter', '!text-success-base', '!border-success-light' ],
    warning: [ '!bg-warning-lighter', '!text-warning-base', '!border-warning-light' ],
    danger: [ '!bg-error-lighter', '!text-error-base', '!border-error-light' ],
    error: [ '!bg-error-lighter', '!text-error-base', '!border-error-light' ],
    info: [ '!bg-information-lighter', '!text-information-base', '!border-information-light' ],
    light: [ '!bg-bg-white-0', '!text-text-strong-950', '!border-stroke-soft-200' ],
    dark: [ '!bg-bg-weak-50', '!text-text-strong-950', '!border-stroke-soft-200' ]
};

export const NitroCardSubHeaderView: FC<NitroCardSubHeaderProps> = props =>
{
    const { justifyContent = 'center', classNames = [], variant = 'muted', ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [
            'container-fluid',
            'p-1',
            '!border-b',
            '!text-label-xs'
        ];

        if(classNames.length) newClassNames.push(...classNames);

        newClassNames.push(...(SUB_HEADER_VARIANTS[variant] || SUB_HEADER_VARIANTS.muted));

        return newClassNames;
    }, [ classNames, variant ]);

    return <Flex justifyContent={ justifyContent } classNames={ getClassNames } { ...rest } />;
}
