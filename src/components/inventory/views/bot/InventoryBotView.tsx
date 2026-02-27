import { IRoomSession } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, UnseenItemCategory } from '../../../../api';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryBotItemView } from './InventoryBotItemView';

interface InventoryBotViewProps {
    roomSession: IRoomSession;
    roomPreviewer: any;
}

export const InventoryBotView: FC<InventoryBotViewProps> = ({ roomSession }) =>
{
    const [isVisible, setIsVisible] = useState(false);
    const { botItems, selectedBot, activate, deactivate } = useInventoryBots();
    const { isUnseen, removeUnseen, resetCategory } = useInventoryUnseenTracker();

    useEffect(() => {
        if (!selectedBot || !isUnseen(UnseenItemCategory.BOT, selectedBot.botData.id)) return;
        removeUnseen(UnseenItemCategory.BOT, selectedBot.botData.id);
    }, [selectedBot, isUnseen, removeUnseen]);

    useEffect(() => {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [isVisible, activate, deactivate]);

    useEffect(() => {
        if (!isVisible) return;
        return () => { resetCategory(UnseenItemCategory.BOT); };
    }, [isVisible, resetCategory]);

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    if (!botItems || !botItems.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40 select-none py-12">
                <span className="text-3xl">🤖</span>
                <span className="text-sm font-medium">Keine Bots vorhanden</span>
                <span className="text-xs opacity-60">Kaufe Bots im Katalog</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-[oklch(var(--foreground))]/50">
                    {botItems.length} {botItems.length === 1 ? 'Bot' : 'Bots'}
                </span>
            </div>

            {/* Bot List */}
            <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5" style={{ minHeight: 0 }}>
                {botItems.map(item => (
                    <InventoryBotItemView
                        key={item.botData.id}
                        botItem={item}
                        hasRoomSession={!!roomSession}
                    />
                ))}
            </div>
        </div>
    );
};
