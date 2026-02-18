import { FC, useCallback } from 'react';
import { FaCopy } from 'react-icons/fa';
import { GetConfiguration, LocalizeText } from '../../../api';
import { LayoutRoomThumbnailView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../common';
import { useNavigator } from '../../../hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
        <NitroCardView className="nitro-room-link" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('navigator.embed.title') } onCloseClick={ onCloseClick } />
            <NitroCardContentView>
                <div className="flex items-start gap-3 p-1">
                    <LayoutRoomThumbnailView roomId={ navigatorData.enteredGuestRoom.roomId } customUrl={ navigatorData.enteredGuestRoom.officialRoomPicRef } />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{ LocalizeText('navigator.embed.headline') }</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">{ LocalizeText('navigator.embed.info') }</p>
                        <div className="flex gap-1.5">
                            <Input
                                type="text"
                                readOnly
                                value={ linkValue }
                                className="h-8 text-xs rounded-lg bg-white/10 border-0 text-zinc-300 flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="shrink-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                                onClick={ copyToClipboard }
                            >
                                <FaCopy className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
