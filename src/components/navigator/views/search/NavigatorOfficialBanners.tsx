import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { CreateRoomSession, DoorStateType, GetSessionDataManager, TryVisitRoom } from '../../../../api';
import { LayoutBadgeImageView, LayoutRoomThumbnailView } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import { NavOfficialIcon, PixelIcon } from '../NavigatorPrimitives';

interface Props
{
    rooms: RoomDataParser[];
}

type CountColor = 'gray' | 'green' | 'red';

function getCountColor(userCount: number, maxUsers: number): CountColor
{
    if(userCount <= 0) return 'gray';
    const pct = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
    if(pct >= 80) return 'red';
    return 'green';
}

function getDoorIconSrc(doorMode: number): string | null
{
    if(doorMode === RoomDataParser.DOORBELL_STATE) return '/navigator/icons/room_locked.png';
    if(doorMode === RoomDataParser.PASSWORD_STATE) return '/navigator/icons/room_password.png';
    if(doorMode === RoomDataParser.INVISIBLE_STATE) return '/navigator/icons/room_invisible.png';
    return null;
}

export const NavigatorOfficialBanners: FC<Props> = ({ rooms }) =>
{
    const { setDoorData = null } = useNavigator();

    const sortedRooms = useMemo(() =>
    {
        return [ ...rooms ].sort((a, b) =>
        {
            if(b.userCount !== a.userCount) return b.userCount - a.userCount;
            return a.roomName.localeCompare(b.roomName);
        });
    }, [ rooms ]);

    if(sortedRooms.length === 0) return null;

    const visitRoom = (roomData: RoomDataParser) =>
    {
        if(roomData.ownerId !== GetSessionDataManager().userId)
        {
            if(roomData.habboGroupId !== 0)
            {
                TryVisitRoom(roomData.roomId);
                return;
            }

            switch(roomData.doorMode)
            {
                case RoomDataParser.DOORBELL_STATE:
                    setDoorData(prev =>
                    {
                        const next = { ...prev };
                        next.roomInfo = roomData;
                        next.state = DoorStateType.START_DOORBELL;
                        return next;
                    });
                    return;
                case RoomDataParser.PASSWORD_STATE:
                    setDoorData(prev =>
                    {
                        const next = { ...prev };
                        next.roomInfo = roomData;
                        next.state = DoorStateType.START_PASSWORD;
                        return next;
                    });
                    return;
            }
        }

        CreateRoomSession(roomData.roomId);
    };

    return (
        <div className="flex flex-col gap-2 px-5 py-3">
            { sortedRooms.map(room =>
            {
                const countColor = getCountColor(room.userCount, room.maxUserCount);
                const description = room.description?.trim() || `${ room.ownerName } · Offizieller Raum`;
                const doorIconSrc = getDoorIconSrc(room.doorMode);
                const isGroupRoom = room.habboGroupId > 0;
                const hasGroupBadge = isGroupRoom && !!room.groupBadgeCode;

                return (
                    <button
                        key={ room.roomId }
                        type="button"
                        onClick={ () => visitRoom(room) }
                        className="group relative h-[140px] w-full overflow-hidden rounded-lg ring-1 ring-stroke-soft-200 bg-bg-weak-50 transition-transform duration-200 hover:scale-[1.01]"
                    >
                        { /* Thumbnail fills the card */ }
                        <LayoutRoomThumbnailView
                            roomId={ room.roomId }
                            customUrl={ room.officialRoomPicRef }
                            className="nav-thumb-fill !absolute !inset-0 !h-full !w-full"
                        />

                        { /* Gradient overlay (bottom-up) */ }
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-200 group-hover:from-black/75" />

                        { /* Top-left: Offiziell badge */ }
                        <div className="absolute left-2 top-2 z-10">
                            <AlignBadge.Root size="small" variant="lighter" color="purple" className="h-5 gap-1 px-2 text-[10px] uppercase tracking-wider shadow-sm">
                                <AlignBadge.Icon as={ NavOfficialIcon } className="size-3" />
                                Offiziell
                            </AlignBadge.Root>
                        </div>

                        { /* Top-right: User count */ }
                        <div className="absolute right-2 top-2 z-10">
                            <AlignBadge.Root size="small" variant="lighter" color={ countColor } className="h-5 gap-1 px-2 text-[10px] tabular-nums shadow-sm">
                                <PixelIcon src="/navigator/icons/user.png" size="size-3" />
                                { room.userCount }/{ room.maxUserCount }
                            </AlignBadge.Root>
                        </div>

                        { /* Bottom-left: door-state icon + group badge (or fallback) */ }
                        <div className="absolute bottom-3 left-3 z-10 flex items-end gap-1.5">
                            { doorIconSrc && (
                                <div className="rounded bg-bg-strong-950/80 p-1 backdrop-blur-sm">
                                    <img src={ doorIconSrc } alt="" className="size-3" style={ { imageRendering: 'pixelated' } } />
                                </div>
                            ) }
                            { hasGroupBadge && (
                                <div className="rounded bg-black/30 p-1 backdrop-blur-sm">
                                    <LayoutBadgeImageView badgeCode={ room.groupBadgeCode } isGroup={ true } />
                                </div>
                            ) }
                            { isGroupRoom && !hasGroupBadge && (
                                <div className="rounded bg-bg-strong-950/80 p-1 backdrop-blur-sm">
                                    <img src="/navigator/icons/room_group.png" alt="" className="size-3" style={ { imageRendering: 'pixelated' } } />
                                </div>
                            ) }
                        </div>

                        { /* Bottom-right: Room name + description */ }
                        <div className="absolute bottom-2.5 right-3 z-10 max-w-[75%] text-right">
                            <span className="block truncate text-label-md font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.7)]">
                                { room.roomName }
                            </span>
                            <span className="mt-0.5 block truncate text-paragraph-xs text-white/85 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.7)]">
                                { description }
                            </span>
                        </div>
                    </button>
                );
            }) }
        </div>
    );
};
