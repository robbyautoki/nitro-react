import { FC, useCallback } from 'react';
import { FaCopy } from 'react-icons/fa';
import { X } from 'lucide-react';
import { GetConfiguration, LocalizeText } from '../../../api';
import { DraggableWindow, DraggableWindowPosition, LayoutRoomThumbnailView } from '../../../common';
import { useNavigator } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { NavigatorTextInput } from './NavigatorPrimitives';

export class NavigatorRoomLinkViewProps
{
    onCloseClick: () => void;
}

export const NavigatorRoomLinkView: FC<NavigatorRoomLinkViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const { navigatorData = null } = useNavigator();

    const linkValue = navigatorData?.enteredGuestRoom
        ? LocalizeText('navigator.embed.src', [ 'roomId' ], [ navigatorData.enteredGuestRoom.roomId.toString() ]).replace('${url.prefix}', GetConfiguration<string>('url.prefix', ''))
        : '';

    const copyToClipboard = useCallback(() =>
    {
        navigator.clipboard?.writeText(linkValue);
    }, [ linkValue ]);

    if(!navigatorData.enteredGuestRoom) return null;

    return (
        <DraggableWindow uniqueKey="nitro-room-link" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <AlignSurface.Panel className="nitro-room-link flex w-[400px] flex-col overflow-hidden">
                <div className="drag-handler flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-stroke-soft-200 px-3 active:cursor-grabbing">
                    <span className="truncate text-label-xs text-text-strong-950">{ LocalizeText('navigator.embed.title') }</span>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onMouseDown={ event => event.stopPropagation() } onClick={ onCloseClick }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="flex items-start gap-3 p-3">
                    <LayoutRoomThumbnailView roomId={ navigatorData.enteredGuestRoom.roomId } customUrl={ navigatorData.enteredGuestRoom.officialRoomPicRef } />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <span className="text-label-sm text-text-strong-950">{ LocalizeText('navigator.embed.headline') }</span>
                        <p className="text-paragraph-xs leading-relaxed text-text-sub-600">{ LocalizeText('navigator.embed.info') }</p>
                        <div className="flex gap-1.5">
                            <NavigatorTextInput
                                type="text"
                                readOnly
                                value={ linkValue }
                                rootClassName="flex-1"
                            />
                            <AlignButton.Root
                                type="button"
                                variant="neutral"
                                mode="ghost"
                                size="xsmall"
                                className="size-8 shrink-0 p-0"
                                onClick={ copyToClipboard }
                            >
                                <AlignButton.Icon as={ FaCopy } className="size-3.5" />
                            </AlignButton.Root>
                        </div>
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
};
