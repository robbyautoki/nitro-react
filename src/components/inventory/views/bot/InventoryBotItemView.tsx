import { FC, MouseEvent, useState } from 'react';
import { attemptBotPlacement, IBotItem, UnseenItemCategory } from '../../../../api';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';

const HABBO_IMAGER = 'https://www.habbo.de/habbo-imaging/avatarimage';

function avatarUrl(figure: string)
{
    return `${ HABBO_IMAGER }?figure=${ encodeURIComponent(figure) }&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}

interface InventoryBotItemViewProps {
    botItem: IBotItem;
    hasRoomSession: boolean;
}

export const InventoryBotItemView: FC<InventoryBotItemViewProps> = ({ botItem, hasRoomSession }) =>
{
    const { selectedBot, setSelectedBot } = useInventoryBots();
    const { isUnseen } = useInventoryUnseenTracker();
    const [ imgError, setImgError ] = useState(false);

    const isActive = selectedBot === botItem;
    const unseen = isUnseen(UnseenItemCategory.BOT, botItem.botData.id);

    const handleClick = () => setSelectedBot(botItem);

    const handleDblClick = () =>
    {
        if (hasRoomSession) attemptBotPlacement(botItem);
    };

    const handlePlace = (e: MouseEvent) =>
    {
        e.stopPropagation();
        attemptBotPlacement(botItem);
    };

    return (
        <div
            className={
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ' +
                (isActive
                    ? 'bg-primary-alpha-10 ring-1 ring-primary-base'
                    : 'bg-transparent hover:bg-bg-weak-50')
            }
            onClick={ handleClick }
            onDoubleClick={ handleDblClick }
        >
            { /* Avatar */ }
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                { !imgError ? (
                    <img
                        src={ avatarUrl(botItem.botData.figure) }
                        alt=""
                        className="h-10 object-contain"
                        style={ { imageRendering: 'pixelated' } }
                        draggable={ false }
                        onError={ () => setImgError(true) }
                    />
                ) : (
                    <span className="text-lg opacity-30">🤖</span>
                ) }
                { unseen && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-success-base ring-2 ring-bg-white-0" />
                ) }
            </div>
            { /* Info */ }
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-strong-950 leading-tight truncate">
                    { botItem.botData.name }
                </div>
                { botItem.botData.motto && (
                    <div className="text-xs text-text-sub-600 italic leading-tight truncate mt-0.5">
                        { botItem.botData.motto }
                    </div>
                ) }
            </div>
            { /* Place Button */ }
            { hasRoomSession && isActive && (
                <AlignButton.Root
                    variant="primary"
                    mode="filled"
                    size="xxsmall"
                    className="shrink-0"
                    onClick={ handlePlace }
                >
                    Platzieren
                </AlignButton.Root>
            ) }
        </div>
    );
};
