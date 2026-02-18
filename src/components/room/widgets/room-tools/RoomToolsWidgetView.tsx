import { GetGuestRoomResultEvent, NavigatorSearchComposer, RateFlatMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreateLinkEvent, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../../api';
import { classNames } from '../../../../common';
import { useMessageEvent, useNavigator, useRoom } from '../../../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const RoomToolsWidgetView: FC<{}> = props =>
{
    const [ isZoomedIn, setIsZoomedIn ] = useState<boolean>(false);
    const [ roomName, setRoomName ] = useState<string>(null);
    const [ roomOwner, setRoomOwner ] = useState<string>(null);
    const [ roomTags, setRoomTags ] = useState<string[]>(null);
    const { navigatorData = null } = useNavigator();
    const { roomSession = null } = useRoom();

    const handleToolClick = (action: string, value?: string) =>
    {
        switch(action)
        {
            case 'settings':
                CreateLinkEvent('navigator/toggle-room-info');
                return;
            case 'zoom':
                setIsZoomedIn(prevValue =>
                {
                    let scale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);

                    if(!prevValue) scale /= 2;
                    else scale *= 2;

                    GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, scale);

                    return !prevValue;
                });
                return;
            case 'chat_history':
                CreateLinkEvent('chat-history/toggle');
                return;
            case 'like_room':
                SendMessageComposer(new RateFlatMessageComposer(1));
                return;
            case 'toggle_room_link':
                CreateLinkEvent('navigator/toggle-room-link');
                return;
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${ value }`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${ value }`));
                return;
        }
    }

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();

        if(!parser.roomEnter || (parser.data.roomId !== roomSession.roomId)) return;

        if(roomName !== parser.data.roomName) setRoomName(parser.data.roomName);
        if(roomOwner !== parser.data.ownerName) setRoomOwner(parser.data.ownerName);
        if(roomTags !== parser.data.tags) setRoomTags(parser.data.tags);
    });

    const portalTarget = document.getElementById('toolbar-room-tools-container');

    if(!portalTarget) return null;

    const settingsTooltip = [ roomName, roomOwner ].filter(Boolean).join(' - ');

    return createPortal(
        <TooltipProvider delayDuration={ 400 }>
            <div className="flex items-center">
                <div className="w-px h-6 bg-white/[0.06] mx-1" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => handleToolClick('settings') }
                        >
                            <i className="icon icon-cog" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm max-w-[200px]">
                        { settingsTooltip || LocalizeText('room.settings.button.text') }
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => handleToolClick('zoom') }
                        >
                            <i className={ classNames('icon', (!isZoomedIn && 'icon-zoom-less'), (isZoomedIn && 'icon-zoom-more')) } />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                        { LocalizeText('room.zoom.button.text') }
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => handleToolClick('chat_history') }
                        >
                            <i className="icon icon-chat-history" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                        { LocalizeText('room.chathistory.button.text') }
                    </TooltipContent>
                </Tooltip>
                { navigatorData.canRate &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={ () => handleToolClick('like_room') }
                            >
                                <i className="icon icon-like-room" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                            { LocalizeText('room.like.button.text') }
                        </TooltipContent>
                    </Tooltip> }
            </div>
        </TooltipProvider>,
        portalTarget
    );
}
