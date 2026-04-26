import { FC, MouseEvent, useMemo } from 'react';
import { Flag, X } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';
import { Column, ColumnProps, Flex } from '..';
import { useNitroCardContext } from './NitroCardContext';

interface NitroCardHeaderViewProps extends ColumnProps
{
    headerText: string;
    isGalleryPhoto?: boolean;
    noCloseButton?: boolean;
    onReportPhoto?: (event: MouseEvent) => void;
    onCloseClick: (event: MouseEvent) => void;
}

export const NitroCardHeaderView: FC<NitroCardHeaderViewProps> = props =>
{
    const { headerText = null, isGalleryPhoto = false, noCloseButton = false, onReportPhoto = null, onCloseClick = null, justifyContent = 'center', alignItems = 'center', classNames = [], children = null, ...rest } = props;
    const { theme = null } = useNitroCardContext();

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [
            'drag-handler',
            'container-fluid',
            'nitro-card-header',
            '!w-full',
            '!shrink-0',
            '!select-none',
            '!border-b',
            '!border-stroke-soft-200',
            '!bg-none',
            '!bg-bg-white-0',
            '!px-4',
            '!py-2',
            '!text-text-strong-950',
            '!shadow-none'
        ];

        if(theme === 'primary-slim') newClassNames.push('!min-h-8', '!max-h-8');
        else newClassNames.push('!min-h-10', '!max-h-10');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ theme, classNames ]);

    const onMouseDown = (event: MouseEvent<HTMLElement>) =>
    {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    }

    return (
        <Column center position="relative" classNames={ getClassNames } justifyContent={ justifyContent } alignItems={ alignItems } { ...rest }>
            <Flex fullWidth center className="min-w-0">
                <span className="nitro-card-header-text truncate !text-label-sm !font-medium !text-text-strong-950 !shadow-none">{ headerText }</span>
                { isGalleryPhoto &&
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="end-4 nitro-card-header-report-camera absolute size-7 p-0 !bg-transparent !text-text-sub-600 hover:!bg-bg-weak-50 hover:!text-text-strong-950 active:!bg-bg-weak-50"
                        onMouseDownCapture={ onMouseDown }
                        onClick={ onReportPhoto }>
                        <AlignButton.Icon as={ Flag } className="size-4" />
                    </AlignButton.Root>
                }
                { !noCloseButton &&
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="right-2 nitro-card-header-close absolute size-7 p-0 !bg-transparent !text-text-sub-600 hover:!bg-bg-weak-50 hover:!text-text-strong-950 active:!bg-bg-weak-50"
                        onMouseDownCapture={ onMouseDown }
                        onClick={ onCloseClick }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                }
            </Flex>
        </Column>
    );
}
