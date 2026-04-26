import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { cn } from '@/align-ui/utils/cn';

interface AlignGameWindowProps
{
    uniqueKey?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    onClose?: () => void;
    children: ReactNode;
    footer?: ReactNode;
    widthClassName?: string;
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
    handleSelector?: string;
    windowPosition?: string;
}

const getHandleClassName = (handleSelector: string) =>
{
    if(handleSelector.startsWith('.')) return handleSelector.slice(1);
    return '';
};

export function AlignGameWindow({
    uniqueKey,
    title,
    subtitle,
    icon,
    onClose,
    children,
    footer,
    widthClassName = 'w-[440px]',
    className,
    bodyClassName,
    headerClassName,
    handleSelector = '.align-game-window-drag',
    windowPosition = DraggableWindowPosition.CENTER,
}: AlignGameWindowProps)
{
    return (
        <DraggableWindow uniqueKey={ uniqueKey } handleSelector={ handleSelector } windowPosition={ windowPosition }>
            <AlignSurface.Panel className={ cn('flex max-h-[78vh] flex-col overflow-hidden', widthClassName, className) }>
                <div className={ cn(getHandleClassName(handleSelector), 'flex shrink-0 cursor-move select-none items-center gap-3 border-b border-stroke-soft-200 bg-bg-white-0 px-4 py-3 active:cursor-grabbing', headerClassName) }>
                    { icon && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                            { icon }
                        </div>
                    ) }
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-label-sm text-text-strong-950">{ title }</div>
                        { subtitle && <div className="mt-0.5 truncate text-paragraph-xs text-text-sub-600">{ subtitle }</div> }
                    </div>
                    { onClose && (
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="size-7 p-0"
                            onClick={ onClose }
                            onMouseDown={ event => event.stopPropagation() }
                        >
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    ) }
                </div>
                <div className={ cn('min-h-0 flex-1 overflow-auto p-4', bodyClassName) }>
                    { children }
                </div>
                { footer && (
                    <div className="shrink-0 border-t border-stroke-soft-200 bg-bg-white-0 px-4 py-3">
                        { footer }
                    </div>
                ) }
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}

