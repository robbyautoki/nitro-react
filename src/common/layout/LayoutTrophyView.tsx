import { ComponentProps, FC } from 'react';
import { Award } from 'lucide-react';
import { LocalizeText } from '../../api';
import { DraggableWindow } from '../draggable-window';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSurface from '@/align-ui/components/ui/surface';

interface LayoutTrophyViewProps
{
    color: string;
    message: string;
    date: string;
    senderName: string;
    customTitle?: string;
    onCloseClick: () => void;
}

const getTrophyColor = (color: string): ComponentProps<typeof AlignBadge.Root>['color'] =>
{
    if(color === '2') return 'gray';
    if(color === '3') return 'orange';

    return 'yellow';
};

export const LayoutTrophyView: FC<LayoutTrophyViewProps> = props =>
{
    const { color = '', message = '', date = '', senderName = '', customTitle = null, onCloseClick = null } = props;

    return (
        <DraggableWindow handleSelector=".drag-handler">
            <AlignSurface.Panel className="w-[300px] overflow-hidden">
                <AlignSurface.Header
                    className="drag-handler cursor-grab select-none active:cursor-grabbing"
                    title={
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-warning-lighter text-warning-base ring-1 ring-inset ring-warning-light">
                                <Award className="size-4" />
                            </span>
                            <span className="truncate">{ LocalizeText('widget.furni.trophy.title') }</span>
                        </div>
                    }
                    description={ senderName }
                    onClose={ onCloseClick }
                />
                <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <AlignBadge.Root color={ getTrophyColor(color) } variant="light" size="small">
                            Trophäe
                        </AlignBadge.Root>
                        <span className="text-paragraph-xs text-text-sub-600">{ date }</span>
                    </div>
                    <div className="rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                        { customTitle &&
                            <div className="mb-1 text-label-sm text-text-strong-950">{ customTitle }</div> }
                        <div className="whitespace-pre-wrap text-paragraph-sm text-text-sub-600">{ message }</div>
                    </div>
                    <AlignDivider.Root />
                    <AlignButton.Root className="w-full" variant="neutral" mode="stroke" size="small" onClick={ onCloseClick }>
                        Schließen
                    </AlignButton.Root>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
