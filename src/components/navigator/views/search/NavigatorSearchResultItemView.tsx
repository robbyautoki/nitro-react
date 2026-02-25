import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, MouseEvent } from 'react';
import { Crown, MessageCircle, Star, Users } from 'lucide-react';
import { CreateRoomSession, DoorStateType, GetSessionDataManager, TryVisitRoom } from '../../../../api';
import { LayoutBadgeImageView, LayoutRoomThumbnailView } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import { Badge } from '@/components/ui/reui-badge';
import { cn } from '@/lib/utils';

export interface NavigatorSearchResultItemViewProps
{
    roomData: RoomDataParser;
    isPinned?: boolean;
}

function ActivityBar({ roomId, userCount }: { roomId: number; userCount: number })
{
    const activity = userCount <= 0 ? 0 : Math.min(100, userCount * 8 + Math.floor(roomId * 7.3) % 30);
    let barColor = 'bg-emerald-500';
    if(activity >= 80) barColor = 'bg-red-500';
    else if(activity >= 45) barColor = 'bg-amber-500';
    else if(userCount <= 0) barColor = 'bg-muted-foreground/20';

    return (
        <div className="flex items-center gap-1.5 w-full">
            <MessageCircle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className={ `h-full rounded-full transition-all ${ barColor }` } style={ { width: `${ Math.max(activity, 2) }%` } } />
            </div>
        </div>
    );
}

function UserCountBadge({ userCount, maxUsers }: { userCount: number; maxUsers: number })
{
    const pct = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
    const label = `${ userCount }/${ maxUsers }`;

    if(userCount <= 0)
        return <Badge variant="outline" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{ label }</Badge>;
    if(pct >= 90)
        return <Badge variant="destructive-light" size="xs" className="gap-1 tabular-nums"><span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /><Users className="w-3 h-3" />{ label }</Badge>;
    if(pct >= 50)
        return <Badge variant="warning-light" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{ label }</Badge>;

    return <Badge variant="success-light" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{ label }</Badge>;
}

function getDoorIconSrc(doorMode: number): string | null
{
    if(doorMode === RoomDataParser.DOORBELL_STATE) return '/navigator/icons/room_locked.png';
    if(doorMode === RoomDataParser.PASSWORD_STATE) return '/navigator/icons/room_password.png';
    if(doorMode === RoomDataParser.INVISIBLE_STATE) return '/navigator/icons/room_invisible.png';
    return null;
}

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = props =>
{
    const { roomData = null, isPinned = false } = props;
    const { setDoorData = null } = useNavigator();

    const isEmpty = roomData.userCount <= 0;
    const isMine = roomData.ownerId === GetSessionDataManager().userId;
    const doorIconSrc = getDoorIconSrc(roomData.doorMode);

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

    return (
        <div
            className={ cn(
                'flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-accent/50',
                isEmpty && 'opacity-40 hover:opacity-60'
            ) }
            onClick={ visitRoom }
        >
            {/* Thumbnail — 80x80 like v2 prototype */}
            <LayoutRoomThumbnailView
                roomId={ roomData.roomId }
                customUrl={ roomData.officialRoomPicRef }
                className="shrink-0 !w-[80px] !h-[80px] !rounded-lg overflow-hidden relative"
            >
                { roomData.habboGroupId > 0 && (
                    <div className="absolute top-0 left-0 p-0.5">
                        <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } isGroup={ true } className="!w-[13px] !h-[11px]" />
                    </div>
                ) }
                { doorIconSrc && (
                    <div className="absolute bottom-0 right-0 p-0.5 bg-black/50 backdrop-blur-sm rounded-tl-sm">
                        <img src={ doorIconSrc } alt="" className="w-[13px] h-[16px]" style={ { imageRendering: 'pixelated' } } />
                    </div>
                ) }
            </LayoutRoomThumbnailView>

            {/* Info — v2 prototype RoomCard layout */}
            <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                {/* Name + Count */}
                <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-semibold truncate leading-tight">{ roomData.roomName }</span>
                    <UserCountBadge userCount={ roomData.userCount } maxUsers={ roomData.maxUserCount } />
                </div>

                {/* Activity bar */}
                <ActivityBar roomId={ roomData.roomId } userCount={ roomData.userCount } />

                {/* Owner row */}
                <div className="flex items-center gap-1.5">
                    <img
                        src={ `https://www.habbo.de/habbo-imaging/avatarimage?figure=${ roomData.ownerName ? encodeURIComponent(roomData.ownerName) : '' }&headonly=1&size=s&direction=2&user=${ roomData.ownerName }` }
                        alt=""
                        className="w-6 h-6 shrink-0"
                        style={ { imageRendering: 'pixelated' } }
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                    <span className="text-[11px] text-muted-foreground/60 truncate">{ roomData.ownerName }</span>
                    { isMine && <Crown className="w-3 h-3 text-amber-500 shrink-0" /> }
                </div>

                {/* Tags */}
                { roomData.tags && roomData.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        { roomData.tags.map((tag: string) => (
                            <span key={ tag } className="text-[9px] px-1.5 py-px rounded-full bg-muted/50 text-muted-foreground/50 font-medium">
                                { tag }
                            </span>
                        )) }
                    </div>
                ) }
            </div>
        </div>
    );
}
