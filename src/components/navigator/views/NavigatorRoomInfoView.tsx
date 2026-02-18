import { GetCustomRoomFilterMessageComposer, NavigatorSearchComposer, RoomMuteComposer, RoomSettingsComposer, SecurityLevel, ToggleStaffPickMessageComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaCog, FaHome, FaLink, FaStar, FaCamera } from 'react-icons/fa';
import { CreateLinkEvent, DispatchUiEvent, GetGroupInformation, GetSessionDataManager, LocalizeText, ReportType, SendMessageComposer } from '../../../api';
import { classNames, LayoutBadgeImageView, LayoutRoomThumbnailView, NitroCardContentView, NitroCardHeaderView, NitroCardView, UserProfileIconView } from '../../../common';
import { RoomWidgetThumbnailEvent } from '../../../events';
import { useHelp, useNavigator } from '../../../hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export class NavigatorRoomInfoViewProps
{
    onCloseClick: () => void;
}

export const NavigatorRoomInfoView: FC<NavigatorRoomInfoViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const [ isRoomPicked, setIsRoomPicked ] = useState(false);
    const [ isRoomMuted, setIsRoomMuted ] = useState(false);
    const { report = null } = useHelp();
    const { navigatorData = null } = useNavigator();

    const hasPermission = (permission: string) =>
    {
        switch(permission)
        {
            case 'settings':
                return (GetSessionDataManager().userId === navigatorData.enteredGuestRoom.ownerId || GetSessionDataManager().isModerator);
            case 'staff_pick':
                return GetSessionDataManager().securityLevel >= SecurityLevel.COMMUNITY;
            default: return false;
        }
    }

    const processAction = (action: string, value?: string) =>
    {
        if(!navigatorData || !navigatorData.enteredGuestRoom) return;

        switch(action)
        {
            case 'set_home_room':
                let newRoomId = -1;

                if(navigatorData.homeRoomId !== navigatorData.enteredGuestRoom.roomId)
                {
                    newRoomId = navigatorData.enteredGuestRoom.roomId;
                }

                if(newRoomId > 0) SendMessageComposer(new UpdateHomeRoomMessageComposer(newRoomId));
                return;
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${ value }`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${ value }`));
                return;
            case 'open_room_thumbnail_camera':
                DispatchUiEvent(new RoomWidgetThumbnailEvent(RoomWidgetThumbnailEvent.TOGGLE_THUMBNAIL));
                return;
            case 'open_group_info':
                GetGroupInformation(navigatorData.enteredGuestRoom.habboGroupId);
                return;
            case 'toggle_room_link':
                CreateLinkEvent('navigator/toggle-room-link');
                return;
            case 'open_room_settings':
                SendMessageComposer(new RoomSettingsComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'toggle_pick':
                setIsRoomPicked(value => !value);
                SendMessageComposer(new ToggleStaffPickMessageComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'toggle_mute':
                setIsRoomMuted(value => !value);
                SendMessageComposer(new RoomMuteComposer());
                return;
            case 'room_filter':
                SendMessageComposer(new GetCustomRoomFilterMessageComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'open_floorplan_editor':
                CreateLinkEvent('floor-editor/toggle');
                return;
            case 'report_room':
                report(ReportType.ROOM, { roomId: navigatorData.enteredGuestRoom.roomId, roomName: navigatorData.enteredGuestRoom.roomName });
                return;
            case 'close':
                onCloseClick();
                return;
        }

    }

    useEffect(() =>
    {
        if(!navigatorData) return;

        setIsRoomPicked(navigatorData.currentRoomIsStaffPick);

        if(navigatorData.enteredGuestRoom) setIsRoomMuted(navigatorData.enteredGuestRoom.allInRoomMuted);
    }, [ navigatorData ]);

    if(!navigatorData.enteredGuestRoom) return null;

    const room = navigatorData.enteredGuestRoom;
    const isHome = navigatorData.homeRoomId === room.roomId;

    return (
        <NitroCardView className="nitro-room-info" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('navigator.roomsettings.roominfo') } onCloseClick={ () => processAction('close') } />
            <NitroCardContentView>
                <div className="flex flex-col gap-3 p-1 overflow-hidden">
                    <div className="flex gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            <LayoutRoomThumbnailView roomId={ room.roomId } customUrl={ room.officialRoomPicRef }>
                                { hasPermission('settings') &&
                                    <FaCamera className="absolute top-1 right-1 size-3 text-white/60 cursor-pointer hover:text-white transition-colors" onClick={ () => processAction('open_room_thumbnail_camera') } /> }
                            </LayoutRoomThumbnailView>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <FaHome
                                            className={ cn('size-3 cursor-pointer shrink-0 transition-colors', isHome ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400') }
                                            onClick={ () => processAction('set_home_room') }
                                        />
                                        <span className="text-sm font-medium text-white truncate">{ room.roomName }</span>
                                    </div>
                                    { room.showOwner && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[11px] text-zinc-500">{ LocalizeText('navigator.roomownercaption') }</span>
                                            <UserProfileIconView userId={ room.ownerId } />
                                            <span className="text-[11px] text-zinc-300">{ room.ownerName }</span>
                                        </div>
                                    ) }
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[11px] text-zinc-500">{ LocalizeText('navigator.roomrating') }</span>
                                        <div className="flex items-center gap-0.5">
                                            <FaStar className="size-2.5 text-amber-400" />
                                            <span className="text-[11px] text-zinc-300">{ navigatorData.currentRoomRating }</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    { hasPermission('settings') &&
                                        <FaCog className="size-3.5 text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={ () => processAction('open_room_settings') } /> }
                                    <FaLink className="size-3 text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={ () => CreateLinkEvent('navigator/toggle-room-link') } />
                                </div>
                            </div>
                            { (room.tags.length > 0) && (
                                <div className="flex flex-wrap gap-1">
                                    { room.tags.map(tag => (
                                        <span
                                            key={ tag }
                                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-300 cursor-pointer hover:bg-white/15 hover:text-white transition-colors"
                                            onClick={ () => processAction('navigator_search_tag', tag) }
                                        >
                                            #{ tag }
                                        </span>
                                    )) }
                                </div>
                            ) }
                            { room.description && (
                                <ScrollArea className="max-h-[50px]">
                                    <p className="text-xs text-zinc-400 leading-relaxed">{ room.description }</p>
                                </ScrollArea>
                            ) }
                            { (room.habboGroupId > 0) && (
                                <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 rounded-md p-1 -m-1 transition-colors" onClick={ () => processAction('open_group_info') }>
                                    <LayoutBadgeImageView className="flex-none" badgeCode={ room.groupBadgeCode } isGroup={ true } />
                                    <span className="text-xs text-sky-400 underline">
                                        { LocalizeText('navigator.guildbase', [ 'groupName' ], [ room.groupName ]) }
                                    </span>
                                </div>
                            ) }
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        { hasPermission('staff_pick') &&
                            <Button variant="ghost" className="w-full h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10" onClick={ () => processAction('toggle_pick') }>
                                { LocalizeText(isRoomPicked ? 'navigator.staffpicks.unpick' : 'navigator.staffpicks.pick') }
                            </Button> }
                        <Button variant="ghost" className="w-full h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={ () => processAction('report_room') }>
                            { LocalizeText('help.emergency.main.report.room') }
                        </Button>
                        { hasPermission('settings') && (
                            <>
                                <Button variant="ghost" className="w-full h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10" onClick={ () => processAction('toggle_mute') }>
                                    { LocalizeText(isRoomMuted ? 'navigator.muteall_on' : 'navigator.muteall_off') }
                                </Button>
                                <Button variant="ghost" className="w-full h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10" onClick={ () => processAction('room_filter') }>
                                    { LocalizeText('navigator.roomsettings.roomfilter') }
                                </Button>
                                <Button variant="ghost" className="w-full h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10" onClick={ () => processAction('open_floorplan_editor') }>
                                    { LocalizeText('open.floor.plan.editor') }
                                </Button>
                            </>
                        ) }
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
