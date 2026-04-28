import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LayoutBadgeImageView, LayoutRoomThumbnailView, UserProfileIconView } from '../../../../common';
import { PixelIcon, PixelStars } from '../NavigatorPrimitives';

interface Props
{
    roomData: RoomDataParser;
    isMine: boolean;
}

function getStarRating(score: number): number
{
    if(score <= 0) return 0;
    if(score < 5) return 1;
    if(score < 15) return 2;
    if(score < 50) return 3;
    if(score < 150) return 4;
    return 5;
}

export const NavigatorRoomPreviewCard: FC<Props> = ({ roomData, isMine }) =>
{
    const rating = getStarRating(roomData.score);
    const description = roomData.description?.trim();

    return (
        <div className="w-[280px] overflow-hidden rounded-xl bg-bg-white-0 shadow-tooltip ring-1 ring-stroke-soft-200">
            { /* Big thumbnail */ }
            <div className="relative h-[140px] w-full overflow-hidden bg-bg-weak-50">
                <LayoutRoomThumbnailView
                    roomId={ roomData.roomId }
                    customUrl={ roomData.officialRoomPicRef }
                    className="nav-thumb-fill !absolute !inset-0 !h-full !w-full"
                />
                { roomData.habboGroupId > 0 && roomData.groupBadgeCode && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/35 p-0.5 backdrop-blur-sm">
                        <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } isGroup={ true } />
                        <PixelIcon
                            src={ `/navigator/icons/grouptype_icon_${ roomData.habboGroupId % 3 }.png` }
                            size="size-4"
                            alt="Gruppen-Typ"
                        />
                    </div>
                ) }
            </div>

            { /* Body */ }
            <div className="flex flex-col gap-1.5 px-3 py-2.5">
                { /* Name */ }
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label-md font-semibold text-text-strong-950">{ roomData.roomName }</span>
                    { isMine && <PixelIcon src="/navigator/icons/owner-crown.png" size="size-3.5" alt="Besitzer" /> }
                </div>

                { /* Description */ }
                { description && (
                    <p className="line-clamp-3 text-paragraph-xs text-text-sub-600">
                        { description }
                    </p>
                ) }

                { /* Owner row */ }
                { roomData.ownerName && (
                    <div className="flex items-center gap-1.5 text-paragraph-xs text-text-soft-400">
                        { roomData.ownerId > 0 && (
                            <UserProfileIconView userId={ roomData.ownerId } classNames={ [ 'shrink-0' ] } />
                        ) }
                        <span className="truncate text-text-sub-600">{ roomData.ownerName }</span>
                    </div>
                ) }

                { /* Stats: rating + user count */ }
                <div className="mt-1 flex items-center gap-2 border-t border-stroke-soft-200 pt-2 text-paragraph-xs text-text-soft-400">
                    <div className="flex items-center gap-1">
                        <PixelStars rating={ rating } size="size-3.5" />
                        <span className="ml-1 tabular-nums">{ roomData.score }</span>
                    </div>
                    <span className="size-0.5 shrink-0 rounded-full bg-stroke-soft-200" />
                    <div className="flex items-center gap-1">
                        <PixelIcon src="/navigator/icons/user.png" size="size-3" alt="User" />
                        <span className="tabular-nums">{ roomData.userCount }/{ roomData.maxUserCount }</span>
                    </div>
                </div>

                { /* Footer: Tags */ }
                { roomData.tags && roomData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        { roomData.tags.slice(0, 3).map(tag => (
                            <span key={ tag } className="rounded bg-bg-weak-50 px-1.5 py-0.5 text-[10px] text-text-soft-400">
                                #{ tag }
                            </span>
                        )) }
                    </div>
                ) }
            </div>
        </div>
    );
};
