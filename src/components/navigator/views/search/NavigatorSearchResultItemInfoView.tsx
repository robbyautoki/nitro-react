import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { FaInfoCircle, FaUser, FaLock, FaKey, FaEyeSlash } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { LayoutBadgeImageView, LayoutRoomThumbnailView, UserProfileIconView } from '../../../../common';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavigatorSearchResultItemInfoViewProps
{
    roomData: RoomDataParser;
}

export const NavigatorSearchResultItemInfoView: FC<NavigatorSearchResultItemInfoViewProps> = props =>
{
    const { roomData = null } = props;
    const [ isOpen, setIsOpen ] = useState(false);

    const getUserCountBadge = () =>
    {
        const pct = 100 * (roomData.userCount / roomData.maxUserCount);
        const count = `${ roomData.userCount }/${ roomData.maxUserCount }`;

        if(roomData.userCount <= 0)
            return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500"><FaUser className="size-2" />{ count }</span>;
        if(pct >= 92)
            return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium"><FaUser className="size-2" />{ count }</span>;
        if(pct >= 50)
            return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium"><FaUser className="size-2" />{ count }</span>;

        return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium"><FaUser className="size-2" />{ count }</span>;
    }

    const getDoorIcon = () =>
    {
        if(roomData.doorMode === RoomDataParser.DOORBELL_STATE) return <FaLock className="size-3 text-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.PASSWORD_STATE) return <FaKey className="size-3 text-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.INVISIBLE_STATE) return <FaEyeSlash className="size-3 text-white drop-shadow-sm" />;
        return null;
    }

    return (
        <Popover open={ isOpen } onOpenChange={ setIsOpen }>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-5"
                    onMouseEnter={ () => setIsOpen(true) }
                    onMouseLeave={ () => setIsOpen(false) }
                    onClick={ (e) => e.stopPropagation() }
                >
                    <FaInfoCircle className="size-3.5 text-zinc-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="right"
                className="w-64 p-0 overflow-hidden rounded-xl border border-white/15 bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-black/40"
                onMouseEnter={ () => setIsOpen(true) }
                onMouseLeave={ () => setIsOpen(false) }
                onOpenAutoFocus={ (e) => e.preventDefault() }
            >
                <div className="relative">
                    <LayoutRoomThumbnailView roomId={ roomData.roomId } customUrl={ roomData.officialRoomPicRef } className="image-rendering-pixelated w-full">
                        { roomData.habboGroupId > 0 && (
                            <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } isGroup={ true } className="absolute top-0 left-0 m-1" />
                        ) }
                    </LayoutRoomThumbnailView>
                    { roomData.doorMode !== RoomDataParser.OPEN_STATE && (
                        <div className="absolute bottom-1 right-1 p-1 bg-black/50 backdrop-blur-sm rounded-md">
                            { getDoorIcon() }
                        </div>
                    ) }
                </div>
                <div className="p-3 space-y-2 bg-black/30">
                    <p className="font-medium text-sm truncate text-white">{ roomData.roomName }</p>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <span className="italic">{ LocalizeText('navigator.roomownercaption') }</span>
                        <UserProfileIconView userId={ roomData.ownerId } />
                        <span className="italic">{ roomData.ownerName }</span>
                    </div>
                    { roomData.description && (
                        <>
                            <Separator className="bg-white/10" />
                            <p className="text-xs text-zinc-400 line-clamp-3">{ roomData.description }</p>
                        </>
                    ) }
                    <div className="flex justify-end">
                        { getUserCountBadge() }
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
