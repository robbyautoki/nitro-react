import { IRoomSession } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { UnseenItemCategory } from '../../../../api';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import { InventoryBotItemView } from './InventoryBotItemView';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';

interface InventoryBotViewProps {
    roomSession: IRoomSession;
    roomPreviewer: any;
}

export const InventoryBotView: FC<InventoryBotViewProps> = ({ roomSession }) =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { botItems, selectedBot, activate, deactivate } = useInventoryBots();
    const { isUnseen, removeUnseen, resetCategory } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if (!selectedBot || !isUnseen(UnseenItemCategory.BOT, selectedBot.botData.id)) return;
        removeUnseen(UnseenItemCategory.BOT, selectedBot.botData.id);
    }, [ selectedBot, isUnseen, removeUnseen ]);

    useEffect(() =>
    {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        if (!isVisible) return;
        return () => { resetCategory(UnseenItemCategory.BOT); };
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    if (!botItems || !botItems.length)
    {
        return (
            <InventoryCategoryEmptyView
                title="Keine Bots vorhanden"
                desc="Kaufe Bots im Katalog"
                icon={ Bot }
            />
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-bg-white-0">
            { /* Toolbar */ }
            <div className="flex shrink-0 items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5">
                <span className="text-paragraph-xs font-medium text-text-sub-600">
                    { botItems.length } { botItems.length === 1 ? 'Bot' : 'Bots' }
                </span>
                <AlignBadge.Root color="gray" variant="lighter" size="small">
                    { botItems.length }
                </AlignBadge.Root>
            </div>
            { /* Bot List */ }
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
                { botItems.map(item => (
                    <InventoryBotItemView
                        key={ item.botData.id }
                        botItem={ item }
                        hasRoomSession={ !!roomSession }
                    />
                )) }
            </div>
        </div>
    );
};
