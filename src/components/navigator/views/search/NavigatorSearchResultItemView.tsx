import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, MouseEvent } from 'react';
import { FaLock, FaKey, FaEyeSlash, FaThumbtack } from 'react-icons/fa';
import { CreateRoomSession, DoorStateType, GetSessionDataManager, TryVisitRoom } from '../../../../api';
import { LayoutRoomThumbnailView } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import { cn } from '@/lib/utils';
import { NavigatorSearchResultItemInfoView } from './NavigatorSearchResultItemInfoView';

export interface NavigatorSearchResultItemViewProps
{
    roomData: RoomDataParser;
    isPinned?: boolean;
}

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = props =>
{
    const { roomData = null, isPinned = false } = props;
    const { setDoorData = null } = useNavigator();

    const getUserCountBadge = () =>
    {
        const pct = 100 * (roomData.userCount / roomData.maxUserCount);
        const count = `${ roomData.userCount }/${ roomData.maxUserCount }`;

        if(roomData.userCount <= 0)
            return <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500">{ count }</span>;
        if(pct >= 92)
            return <span className="inline-flex items-center text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium shadow-[0_0_8px_rgba(239,68,68,0.2)]"><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />{ count }</span>;
        if(pct >= 50)
            return <span className="inline-flex items-center text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium shadow-[0_0_8px_rgba(245,158,11,0.2)]"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />{ count }</span>;

        return <span className="inline-flex items-center text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium shadow-[0_0_8px_rgba(34,197,94,0.2)]"><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1" />{ count }</span>;
    }

    const isEmpty = roomData.userCount <= 0;

    const getHashIcon = (): React.ReactNode =>
    {
        if(isPinned) return <FaThumbtack className="size-2 text-white drop-shadow-sm" />;

        if(roomData.doorMode === RoomDataParser.DOORBELL_STATE) return <FaLock className="size-2 text-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.PASSWORD_STATE) return <FaKey className="size-2 text-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.INVISIBLE_STATE) return <FaEyeSlash className="size-2 text-white drop-shadow-sm" />;

        return null;
    }

    const visitRoom = (event: MouseEvent) =>
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
                    setDoorData(prevValue =>
                    {
                        const newValue = { ...prevValue };

                        newValue.roomInfo = roomData;
                        newValue.state = DoorStateType.START_DOORBELL;

                        return newValue;
                    });
                    return;
                case RoomDataParser.PASSWORD_STATE:
                    setDoorData(prevValue =>
                    {
                        const newValue = { ...prevValue };

                        newValue.roomInfo = roomData;
                        newValue.state = DoorStateType.START_PASSWORD;

                        return newValue;
                    });
                    return;
            }
        }

        CreateRoomSession(roomData.roomId);
    }

    const hashIcon = getHashIcon();

    return (
        <div
            className={ cn(
                'group/room flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors duration-150',
                'hover:bg-white/[0.04]',
                isEmpty && 'opacity-40 hover:opacity-60'
            ) }
            onClick={ visitRoom }
        >
            { /* Thumbnail — compact left */ }
            <LayoutRoomThumbnailView
                roomId={ roomData.roomId }
                customUrl={ roomData.officialRoomPicRef }
                className="shrink-0 !w-[48px] !h-[36px] !rounded-[4px] overflow-hidden"
            >
                { hashIcon && (
                    <div className="absolute bottom-0 right-0 p-px bg-black/50 backdrop-blur-sm rounded-tl-sm">
                        { hashIcon }
                    </div>
                ) }
            </LayoutRoomThumbnailView>

            { /* Info — center */ }
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[12px] font-medium text-white/85 truncate leading-tight">
                    { roomData.roomName }
                </p>
                <span className="text-[10px] text-white/30 truncate">{ roomData.ownerName }</span>
            </div>

            { /* User count — right */ }
            <div className="shrink-0 ml-auto pl-2">
                { getUserCountBadge() }
            </div>

            { /* Info popover — on hover */ }
            <div className="opacity-0 group-hover/room:opacity-100 transition-opacity">
                <NavigatorSearchResultItemInfoView roomData={ roomData } />
            </div>
        </div>
    );
}
