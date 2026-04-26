import { RoomControllerLevel, RoomObjectOperationType } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LogOut, Move, RotateCw, Trash2 } from 'lucide-react';
import { AvatarInfoFurni, ProcessRoomObjectOperation } from '../../../../../api';
import { ContextMenuView } from '../../context-menu/ContextMenuView';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';

interface AvatarInfoWidgetFurniViewProps
{
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

const Tooltip = AlignTooltip.Root;
const TooltipContent = AlignTooltip.Content;
const TooltipProvider = AlignTooltip.Provider;
const TooltipTrigger = AlignTooltip.Trigger;

export const AvatarInfoWidgetFurniView: FC<AvatarInfoWidgetFurniViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;

    const processAction = (name: string) =>
    {
        if(!name) return;

        switch(name)
        {
            case 'move':
                ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_MOVE);
                break;
            case 'rotate':
                ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
                break;
            case 'pickup':
                ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_PICKUP);
                break;
            case 'eject':
                ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_EJECT);
                break;
        }
    }

    const canPickup = avatarInfo.isOwner || avatarInfo.isAnyRoomController;
    const canEject = !canPickup && (avatarInfo.isRoomOwner || (avatarInfo.roomControllerLevel >= RoomControllerLevel.GUILD_ADMIN));

    return (
        <ContextMenuView objectId={ avatarInfo.id } category={ avatarInfo.category } onClose={ onClose } collapsable={ true } classNames={ [ 'nitro-furni-floatbar' ] }>
            <TooltipProvider delayDuration={ 200 }>
                <div className="flex flex-col">
                    <div className="px-3 pt-1 pb-1.5 text-center text-label-xs text-text-white-0 truncate max-w-[260px]">
                        { avatarInfo.name }
                    </div>
                    <div className="mx-2 h-px bg-stroke-white-0/15" />
                    <div className="flex items-center justify-center gap-1 px-1.5 py-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="ghost"
                                    size="xsmall"
                                    className="size-9 p-0 rounded-lg text-text-white-0 hover:bg-bg-white-0/10 hover:text-text-white-0"
                                    onClick={ () => processAction('move') }
                                    aria-label="Bewegen"
                                >
                                    <AlignButton.Icon as={ Move } className="size-4" />
                                </AlignButton.Root>
                            </TooltipTrigger>
                            <TooltipContent side="top" size="xsmall">Bewegen</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="ghost"
                                    size="xsmall"
                                    disabled={ avatarInfo.isWallItem }
                                    className="size-9 p-0 rounded-lg text-text-white-0 hover:bg-bg-white-0/10 hover:text-text-white-0 disabled:opacity-40"
                                    onClick={ () => processAction('rotate') }
                                    aria-label="Drehen"
                                >
                                    <AlignButton.Icon as={ RotateCw } className="size-4" />
                                </AlignButton.Root>
                            </TooltipTrigger>
                            <TooltipContent side="top" size="xsmall">Drehen</TooltipContent>
                        </Tooltip>
                        { canPickup && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlignButton.Root
                                        type="button"
                                        variant="neutral"
                                        mode="ghost"
                                        size="xsmall"
                                        className="size-9 p-0 rounded-lg text-text-white-0 hover:bg-error-base/20 hover:text-error-base"
                                        onClick={ () => processAction('pickup') }
                                        aria-label="Aufheben"
                                    >
                                        <AlignButton.Icon as={ Trash2 } className="size-4" />
                                    </AlignButton.Root>
                                </TooltipTrigger>
                                <TooltipContent side="top" size="xsmall">Aufheben</TooltipContent>
                            </Tooltip>
                        ) }
                        { canEject && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlignButton.Root
                                        type="button"
                                        variant="neutral"
                                        mode="ghost"
                                        size="xsmall"
                                        className="size-9 p-0 rounded-lg text-text-white-0 hover:bg-warning-base/20 hover:text-warning-base"
                                        onClick={ () => processAction('eject') }
                                        aria-label="Auswerfen"
                                    >
                                        <AlignButton.Icon as={ LogOut } className="size-4" />
                                    </AlignButton.Root>
                                </TooltipTrigger>
                                <TooltipContent side="top" size="xsmall">Auswerfen</TooltipContent>
                            </Tooltip>
                        ) }
                    </div>
                </div>
            </TooltipProvider>
        </ContextMenuView>
    );
}
