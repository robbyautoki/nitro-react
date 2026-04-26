import { NavigatorSearchResultSet, RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { CreateRoomSession, GetConfiguration } from '../../../api';
import { cn } from '@/align-ui/utils/cn';

export interface NavigatorFeaturedRoomsViewProps
{
    searchResult: NavigatorSearchResultSet;
}

export const NavigatorFeaturedRoomsView: FC<NavigatorFeaturedRoomsViewProps> = props =>
{
    const { searchResult = null } = props;

    const featuredRooms = useMemo(() =>
    {
        if(!searchResult || !searchResult.results) return [];

        const roomMap = new Map<number, RoomDataParser>();

        for(const resultList of searchResult.results)
        {
            for(const room of resultList.rooms)
            {
                if(room.userCount > 0 && !roomMap.has(room.roomId))
                    roomMap.set(room.roomId, room);
            }
        }

        return [ ...roomMap.values() ]
            .sort((a, b) => b.userCount - a.userCount)
            .slice(0, 3);
    }, [ searchResult ]);

    if(featuredRooms.length === 0) return null;

    const getStatusColor = (room: RoomDataParser) =>
    {
        const pct = 100 * (room.userCount / room.maxUserCount);
        if(pct >= 90) return 'bg-error-base';
        if(pct >= 50) return 'bg-warning-base';
        return 'bg-success-base';
    };

    return (
        <div className="mb-2">
            <div className="flex items-center gap-2 px-2 pb-1.5">
                <span className="text-subheading-2xs font-semibold uppercase tracking-[1px] text-text-soft-400">Live Activity</span>
            </div>
            <div className="nav-live-cards">
                { featuredRooms.map((room) =>
                {
                    const thumbnailUrl = GetConfiguration<string>('thumbnails.url').replace('%thumbnail%', room.roomId.toString());
                    return (
                        <div
                            key={ room.roomId }
                            className="nav-live-card"
                            onClick={ () => CreateRoomSession(room.roomId) }
                        >
                            <div className="nav-live-card-thumb">
                                <img src={ thumbnailUrl } alt="" onError={ (e) =>
                                {
                                    e.currentTarget.style.display = 'none';
                                } } />
                            </div>
                            <div className="nav-live-card-info">
                                <span className="nav-live-card-name">{ room.roomName }</span>
                                <div className="nav-live-card-meta">
                                    <span className={ cn('nav-live-dot', getStatusColor(room)) } />
                                    <span className="nav-live-card-count">{ room.userCount }/{ room.maxUserCount }</span>
                                    <span className="nav-live-card-owner">{ room.ownerName }</span>
                                </div>
                            </div>
                        </div>
                    );
                }) }
            </div>
        </div>
    );
};
