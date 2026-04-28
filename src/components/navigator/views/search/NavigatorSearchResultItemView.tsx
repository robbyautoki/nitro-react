import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, ReactElement, useEffect, useRef, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { CreateRoomSession, DoorStateType, GetSessionDataManager, TryVisitRoom } from '../../../../api';
import { LayoutRoomThumbnailView, UserProfileIconView } from '../../../../common';
import { useNavigator, useSpotlight } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';
import { NavigatorRoomPreviewCard } from './NavigatorRoomPreviewCard';
import { PixelIcon } from '../NavigatorPrimitives';
import { getOwnerHeadUrl, useOwnerFigure } from './useOwnerFigure';

export type NavigatorDensity = 'compact' | 'cozy';

export interface NavigatorSearchResultItemViewProps
{
    roomData: RoomDataParser;
    isPinned?: boolean;
    onTogglePin?: (roomId: number) => void;
    delta?: number;
    density?: NavigatorDensity;
}

type CountState = 'hot' | 'live' | 'empty';

function getCountState(userCount: number, maxUsers: number): CountState
{
    if(userCount <= 0) return 'empty';
    const pct = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
    if(pct >= 80) return 'hot';
    return 'live';
}

function useCountFlash(value: number)
{
    const [ flashKey, setFlashKey ] = useState(0);
    const prev = useRef(value);

    useEffect(() =>
    {
        if(prev.current !== value)
        {
            setFlashKey(k => k + 1);
            prev.current = value;
        }
    }, [ value ]);

    return flashKey;
}

const CountBadge: FC<{ userCount: number; maxUsers: number; delta?: number }> = ({ userCount, maxUsers, delta = 0 }) =>
{
    const state = getCountState(userCount, maxUsers);
    const flashKey = useCountFlash(userCount);
    const color: 'gray' | 'green' | 'red' = state === 'empty' ? 'gray' : state === 'hot' ? 'red' : 'green';

    return (
        <AlignBadge.Root key={ flashKey } size="small" variant="lighter" color={ color } className="h-4 gap-1 px-1.5 text-[10px] tabular-nums nav-count-pill">
            <PixelIcon src="/navigator/icons/user.png" size="size-2.5" />
            { userCount }/{ maxUsers }
            { delta > 0 && <span className="ml-0.5 text-[9px] font-bold">↑{ delta }</span> }
            { delta < 0 && <span className="ml-0.5 text-[9px] font-bold opacity-70">↓{ Math.abs(delta) }</span> }
        </AlignBadge.Root>
    );
};

const OwnerHead: FC<{ ownerId: number; ownerName: string }> = ({ ownerId, ownerName }) =>
{
    const figure = useOwnerFigure(ownerId);
    if(!ownerName) return null;

    if(!figure)
    {
        return <PixelIcon src="/navigator/icons/user.png" size="size-3.5" alt={ ownerName } />;
    }

    return (
        <img
            src={ getOwnerHeadUrl(figure, 's') }
            alt={ ownerName }
            loading="lazy"
            className="h-4 w-auto shrink-0"
            style={ { imageRendering: 'pixelated' } }
        />
    );
};

function getDoorIconSrc(doorMode: number): string | null
{
    if(doorMode === RoomDataParser.DOORBELL_STATE) return '/navigator/icons/room_locked.png';
    if(doorMode === RoomDataParser.PASSWORD_STATE) return '/navigator/icons/room_password.png';
    if(doorMode === RoomDataParser.INVISIBLE_STATE) return '/navigator/icons/room_invisible.png';
    return null;
}

function getDoorLabel(doorMode: number): string | null
{
    if(doorMode === RoomDataParser.DOORBELL_STATE) return 'Klingel';
    if(doorMode === RoomDataParser.PASSWORD_STATE) return 'Passwort';
    if(doorMode === RoomDataParser.INVISIBLE_STATE) return 'Privat';
    return null;
}

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = props =>
{
    const { roomData = null, isPinned = false, onTogglePin = null, delta = 0, density = 'compact' } = props;
    const { setDoorData = null } = useNavigator();
    const { isSpotlight: checkSpotlight } = useSpotlight();
    const isSpotlight = checkSpotlight(roomData.roomId);

    const fillPct = roomData.maxUserCount > 0 ? (roomData.userCount / roomData.maxUserCount) * 100 : 0;
    const isHot = roomData.userCount > 0 && fillPct >= 80;

    const handlePinClick = (event: MouseEvent) =>
    {
        event.preventDefault();
        event.stopPropagation();
        if(onTogglePin) onTogglePin(roomData.roomId);
    };

    const isEmpty = roomData.userCount <= 0;
    const isMine = roomData.ownerId === GetSessionDataManager().userId;
    const doorIconSrc = getDoorIconSrc(roomData.doorMode);

    const visitRoom = () =>
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
    };

    const firstTag = roomData.tags && roomData.tags.length > 0 ? roomData.tags[0] : null;

    const PinButton = onTogglePin && (
        <AlignButton.Root
            type="button"
            variant="neutral"
            mode="ghost"
            size="xxsmall"
            className={ cn(
                'size-6 shrink-0 p-0',
                isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            ) }
            onClick={ handlePinClick }
            aria-label={ isPinned ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen' }
            title={ isPinned ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen' }
        >
            <PixelIcon
                src={ isPinned ? '/navigator/icons/pin-on.png' : '/navigator/icons/pin-off.png' }
                size="size-3.5"
                alt={ isPinned ? 'Favorit' : 'Zu Favoriten' }
            />
        </AlignButton.Root>
    );

    const wrapWithPreview = (trigger: ReactElement) => (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
                { trigger }
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side="left"
                    align="center"
                    sideOffset={ 12 }
                    avoidCollisions={ true }
                    collisionPadding={ 12 }
                    className={ cn(
                        'z-[2000] outline-none',
                        'animate-in fade-in-0 zoom-in-95',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2'
                    ) }
                >
                    <NavigatorRoomPreviewCard roomData={ roomData } isMine={ isMine } />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );

    // ── Compact (40px) — 1 line, owner inline as 16px avatar ────────────────
    if(density === 'compact')
    {
        return wrapWithPreview(
            <button
                type="button"
                className={ cn(
                    'group relative flex h-10 w-full cursor-pointer items-center gap-2.5 px-5 text-left transition-colors',
                    'border-b border-stroke-soft-200/60 hover:bg-bg-weak-50',
                    isEmpty && 'opacity-65 hover:opacity-100',
                    isSpotlight && 'nitro-room-spotlight'
                ) }
                onClick={ visitRoom }
            >
                <LayoutRoomThumbnailView
                    roomId={ roomData.roomId }
                    customUrl={ roomData.officialRoomPicRef }
                    className="shrink-0 !w-7 !h-7 !rounded overflow-hidden relative ring-1 ring-stroke-soft-200"
                >
                    { isHot && <span className="nav-hot-pulse absolute right-0 top-0 inline-flex h-1 w-1 rounded-full bg-error-base" /> }
                </LayoutRoomThumbnailView>

                <div className="min-w-0 flex flex-1 items-center gap-1.5">
                    <span className="truncate text-label-sm leading-tight text-text-strong-950">{ roomData.roomName }</span>
                    <OwnerHead ownerId={ roomData.ownerId } ownerName={ roomData.ownerName } />
                    { doorIconSrc && (
                        <PixelIcon
                            src={ doorIconSrc }
                            className="h-3.5 w-auto shrink-0"
                            alt={ getDoorLabel(roomData.doorMode) ?? '' }
                            title={ getDoorLabel(roomData.doorMode) ?? '' }
                        />
                    ) }
                    { isMine && <PixelIcon src="/navigator/icons/owner-crown.png" size="size-3" alt="Besitzer" /> }
                    { isSpotlight && <PixelIcon src="/navigator/icons/sign-yellow.png" size="size-3" className="nav-spotlight-icon" alt="Spotlight" /> }
                    { isHot && <PixelIcon src="/navigator/icons/sign-red.png" size="size-3" className="nav-hot-icon" alt="Hot" /> }
                </div>

                <CountBadge userCount={ roomData.userCount } maxUsers={ roomData.maxUserCount } delta={ delta } />
                { PinButton }
            </button>
        );
    }

    // ── Cozy (52px) — 2 lines, name above + owner+tag subline ───────────────
    return wrapWithPreview(
        <button
            type="button"
            className={ cn(
                'group relative flex h-[52px] w-full cursor-pointer items-center gap-3 px-5 text-left transition-colors',
                'border-b border-stroke-soft-200/60 hover:bg-bg-weak-50',
                isEmpty && 'opacity-65 hover:opacity-100',
                isSpotlight && 'nitro-room-spotlight'
            ) }
            onClick={ visitRoom }
        >
            <LayoutRoomThumbnailView
                roomId={ roomData.roomId }
                customUrl={ roomData.officialRoomPicRef }
                className="shrink-0 !w-9 !h-7 !rounded overflow-hidden relative ring-1 ring-stroke-soft-200"
            >
                { roomData.habboGroupId > 0 && (
                    <div className="absolute top-0 left-0 rounded-br-sm bg-bg-strong-950/70 backdrop-blur-sm p-[1px]">
                        <img src="/navigator/icons/room_group.png" alt="" className="w-[10px] h-[10px]" style={ { imageRendering: 'pixelated' } } />
                    </div>
                ) }
                { isHot && (
                    <span className="nav-hot-pulse absolute right-0.5 top-0.5 inline-flex h-1 w-1 rounded-full bg-error-base" />
                ) }
            </LayoutRoomThumbnailView>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label-sm leading-tight text-text-strong-950">{ roomData.roomName }</span>
                    { doorIconSrc && (
                        <PixelIcon
                            src={ doorIconSrc }
                            className="h-3.5 w-auto shrink-0"
                            alt={ getDoorLabel(roomData.doorMode) ?? '' }
                            title={ getDoorLabel(roomData.doorMode) ?? '' }
                        />
                    ) }
                    { isMine && <PixelIcon src="/navigator/icons/owner-crown.png" size="size-3" alt="Besitzer" /> }
                    { isSpotlight && <PixelIcon src="/navigator/icons/sign-yellow.png" size="size-3" className="nav-spotlight-icon" alt="Spotlight" /> }
                    { isHot && <PixelIcon src="/navigator/icons/sign-red.png" size="size-3" className="nav-hot-icon" alt="Hot" /> }
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-paragraph-xs text-text-soft-400">
                    <OwnerHead ownerId={ roomData.ownerId } ownerName={ roomData.ownerName } />
                    <span className="truncate">{ roomData.ownerName }</span>
                    { firstTag && (
                        <>
                            <span className="size-0.5 shrink-0 rounded-full bg-stroke-soft-200" />
                            <span className="truncate">#{ firstTag }</span>
                        </>
                    ) }
                </div>
            </div>

            <CountBadge userCount={ roomData.userCount } maxUsers={ roomData.maxUserCount } delta={ delta } />
            { PinButton }
        </button>
    );
};
