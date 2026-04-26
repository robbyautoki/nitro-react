import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { FaInfoCircle, FaUser, FaLock, FaKey, FaEyeSlash } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { LayoutBadgeImageView, LayoutRoomThumbnailView, UserProfileIconView } from '../../../../common';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignPopover from '@/align-ui/components/ui/popover';

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
            return <AlignBadge.Root color="gray" variant="lighter" size="small" className="gap-1"><FaUser className="size-2" />{ count }</AlignBadge.Root>;
        if(pct >= 92)
            return <AlignBadge.Root color="red" variant="light" size="small" className="gap-1"><FaUser className="size-2" />{ count }</AlignBadge.Root>;
        if(pct >= 50)
            return <AlignBadge.Root color="orange" variant="light" size="small" className="gap-1"><FaUser className="size-2" />{ count }</AlignBadge.Root>;

        return <AlignBadge.Root color="green" variant="light" size="small" className="gap-1"><FaUser className="size-2" />{ count }</AlignBadge.Root>;
    }

    const getDoorIcon = () =>
    {
        if(roomData.doorMode === RoomDataParser.DOORBELL_STATE) return <FaLock className="size-3 text-static-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.PASSWORD_STATE) return <FaKey className="size-3 text-static-white drop-shadow-sm" />;
        if(roomData.doorMode === RoomDataParser.INVISIBLE_STATE) return <FaEyeSlash className="size-3 text-static-white drop-shadow-sm" />;
        return null;
    }

    return (
        <AlignPopover.Root open={ isOpen } onOpenChange={ setIsOpen }>
            <AlignPopover.Trigger asChild>
                <AlignButton.Root
                    type="button"
                    variant="neutral"
                    mode="ghost"
                    size="xxsmall"
                    className="size-5"
                    onMouseEnter={ () => setIsOpen(true) }
                    onMouseLeave={ () => setIsOpen(false) }
                    onClick={ (e) => e.stopPropagation() }
                >
                    <AlignButton.Icon as={ FaInfoCircle } className="size-3.5 text-text-soft-400" />
                </AlignButton.Root>
            </AlignPopover.Trigger>
            <AlignPopover.Content
                side="right"
                showArrow={ false }
                className="w-64 overflow-hidden rounded-xl bg-bg-white-0 p-0"
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
                        <div className="absolute bottom-1 right-1 rounded-md bg-bg-strong-950/70 p-1 backdrop-blur-sm">
                            { getDoorIcon() }
                        </div>
                    ) }
                </div>
                <div className="space-y-2 bg-bg-white-0 p-3">
                    <p className="truncate text-label-sm text-text-strong-950">{ roomData.roomName }</p>
                    <div className="flex items-center gap-1 text-paragraph-xs text-text-sub-600">
                        <span className="italic">{ LocalizeText('navigator.roomownercaption') }</span>
                        <UserProfileIconView userId={ roomData.ownerId } />
                        <span className="italic">{ roomData.ownerName }</span>
                    </div>
                    { roomData.description && (
                        <>
                            <AlignDivider.Root />
                            <p className="line-clamp-3 text-paragraph-xs text-text-sub-600">{ roomData.description }</p>
                        </>
                    ) }
                    <div className="flex justify-end">
                        { getUserCountBadge() }
                    </div>
                </div>
            </AlignPopover.Content>
        </AlignPopover.Root>
    );
}
