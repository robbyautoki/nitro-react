import { FC, MouseEvent, useState } from 'react';
import { attemptBotPlacement, IBotItem, UnseenItemCategory } from '../../../../api';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';

const HABBO_IMAGER = 'https://www.habbo.de/habbo-imaging/avatarimage';

function avatarUrl(figure: string) {
    return `${HABBO_IMAGER}?figure=${encodeURIComponent(figure)}&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}

interface InventoryBotItemViewProps {
    botItem: IBotItem;
    hasRoomSession: boolean;
}

export const InventoryBotItemView: FC<InventoryBotItemViewProps> = ({ botItem, hasRoomSession }) =>
{
    const { selectedBot, setSelectedBot } = useInventoryBots();
    const { isUnseen } = useInventoryUnseenTracker();
    const [imgError, setImgError] = useState(false);

    const isActive = selectedBot === botItem;
    const unseen = isUnseen(UnseenItemCategory.BOT, botItem.botData.id);

    const handleClick = () => setSelectedBot(botItem);

    const handleDblClick = () => {
        if (hasRoomSession) attemptBotPlacement(botItem);
    };

    const handlePlace = (e: MouseEvent) => {
        e.stopPropagation();
        attemptBotPlacement(botItem);
    };

    return (
        <div
            className={
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ' +
                (isActive
                    ? 'bg-white/[0.08]'
                    : 'bg-transparent hover:bg-white/[0.04]')
            }
            onClick={handleClick}
            onDoubleClick={handleDblClick}
        >
            {/* Avatar */}
            <div className="w-10 h-10 shrink-0 rounded-md bg-white/[0.04] flex items-center justify-center overflow-hidden relative">
                {!imgError ? (
                    <img
                        src={avatarUrl(botItem.botData.figure)}
                        alt=""
                        className="h-10 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        draggable={false}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-lg opacity-30">🤖</span>
                )}
                {unseen && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[oklch(var(--foreground))] leading-tight truncate">
                    {botItem.botData.name}
                </div>
                {botItem.botData.motto && (
                    <div className="text-xs text-[oklch(var(--foreground))]/40 italic leading-tight truncate mt-0.5">
                        {botItem.botData.motto}
                    </div>
                )}
            </div>

            {/* Place Button */}
            {hasRoomSession && isActive && (
                <button
                    className="shrink-0 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                    onClick={handlePlace}
                >
                    Platzieren
                </button>
            )}
        </div>
    );
};
