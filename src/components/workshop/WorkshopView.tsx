import { FC, useCallback, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Wrench, AlertTriangle, Package } from 'lucide-react';
import { useWorkshop, WorkshopItem, FeedCandidate } from '../../hooks/workshop/useWorkshop';
import { GetConfiguration } from '../../api';

const TABS = [
    { id: 'items', label: 'Meine Rares', icon: Package },
    { id: 'broken', label: 'Zerbrochen', icon: AlertTriangle },
] as const;

const getDurabilityColor = (remaining: number, status: string) =>
{
    if(status === 'broken') return '#6b7280';
    if(remaining > 50) return '#22c55e';
    if(remaining > 25) return '#eab308';
    return '#ef4444';
};

export const WorkshopView: FC<{}> = () =>
{
    const {
        isVisible, setIsVisible,
        currentTab, setCurrentTab,
        items, feedCandidates,
        selectedItem, setSelectedItem,
        isLoading, isRepairing,
        repairWithCredits, repairWithFeed,
    } = useWorkshop();

    const [ showFeedPicker, setShowFeedPicker ] = useState(false);

    const onClose = useCallback(() =>
    {
        setIsVisible(false);
        setSelectedItem(null);
        setShowFeedPicker(false);
    }, [ setIsVisible, setSelectedItem ]);

    const filteredItems = currentTab === 'broken'
        ? items.filter(i => i.status === 'broken')
        : items;

    const handleRepairCredits = useCallback(async () =>
    {
        if(!selectedItem) return;
        await repairWithCredits(selectedItem.itemId);
    }, [ selectedItem, repairWithCredits ]);

    const handleRepairFeed = useCallback(async (feedItem: FeedCandidate) =>
    {
        if(!selectedItem) return;
        await repairWithFeed(selectedItem.itemId, feedItem.itemId);
        setShowFeedPicker(false);
    }, [ selectedItem, repairWithFeed ]);

    if(!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

            <div className="relative w-[620px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <Wrench className="size-4 text-white/70" />
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Werkstatt</span>
                        </div>
                        <button
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={ onClose }
                        >
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
                        { TABS.map(tab =>
                        {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            const count = tab.id === 'broken' ? items.filter(i => i.status === 'broken').length : items.length;

                            return (
                                <button
                                    key={ tab.id }
                                    className={ `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ isActive
                                        ? 'bg-white/[0.12] text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                                    }` }
                                    onClick={ () => { setCurrentTab(tab.id); setSelectedItem(null); setShowFeedPicker(false); } }
                                >
                                    <Icon className="size-3.5" />
                                    <span>{ tab.label }</span>
                                    { count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[10px]">{ count }</span> }
                                </button>
                            );
                        }) }
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[300px]">
                        { isLoading && (
                            <div className="flex items-center justify-center h-40 text-white/40 text-sm">
                                Laden...
                            </div>
                        ) }

                        { !isLoading && filteredItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-white/40 text-sm gap-2">
                                <Wrench className="size-8 opacity-30" />
                                <span>{ currentTab === 'broken' ? 'Keine zerbrochenen Items' : 'Keine Items mit Haltbarkeit' }</span>
                            </div>
                        ) }

                        { !isLoading && filteredItems.length > 0 && !showFeedPicker && (
                            <div className="space-y-1">
                                { filteredItems.map(item => (
                                    <WorkshopItemRow
                                        key={ item.itemId }
                                        item={ item }
                                        isSelected={ selectedItem?.itemId === item.itemId }
                                        onClick={ () => setSelectedItem(selectedItem?.itemId === item.itemId ? null : item) }
                                    />
                                )) }
                            </div>
                        ) }

                        { showFeedPicker && selectedItem && (
                            <FeedPickerView
                                candidates={ feedCandidates }
                                targetItem={ selectedItem }
                                onSelect={ handleRepairFeed }
                                onBack={ () => setShowFeedPicker(false) }
                                isRepairing={ isRepairing }
                            />
                        ) }
                    </div>

                    {/* Footer — repair actions */}
                    { selectedItem && !showFeedPicker && (
                        <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-white/50">
                                    { selectedItem.itemName } — { selectedItem.status === 'broken' ? 'Zerbrochen' : `${ selectedItem.durabilityRemaining }%` }
                                    { selectedItem.graceExpiresAt && (
                                        <span className="text-red-400 ml-2">
                                            Einziehung: { new Date(selectedItem.graceExpiresAt).toLocaleDateString('de-DE') }
                                        </span>
                                    ) }
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-40"
                                        onClick={ () => setShowFeedPicker(true) }
                                        disabled={ isRepairing }
                                    >
                                        Rare opfern
                                    </button>
                                    <button
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-40"
                                        onClick={ handleRepairCredits }
                                        disabled={ isRepairing }
                                    >
                                        Reparieren ({ selectedItem.repairCost } Credits)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};

// ─── Item Row ────────────────────────────────────

const WorkshopItemRow: FC<{ item: WorkshopItem; isSelected: boolean; onClick: () => void }> = ({ item, isSelected, onClick }) =>
{
    const color = getDurabilityColor(item.durabilityRemaining, item.status);

    return (
        <button
            className={ `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${ isSelected
                ? 'bg-white/[0.1] ring-1 ring-white/[0.15]'
                : 'hover:bg-white/[0.05]'
            }` }
            onClick={ onClick }
        >
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 relative">
                <img
                    src={ GetFurniIconUrl(item.internalName) }
                    alt=""
                    className="max-w-[32px] max-h-[32px] object-contain"
                    style={ item.status === 'broken' ? { filter: 'grayscale(1) opacity(0.5)' } : undefined }
                    onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                />
                { item.status === 'broken' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span style={ { fontSize: '16px' } }>🔨</span>
                    </div>
                ) }
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">{ item.itemName }</div>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={ { width: `${ item.durabilityRemaining }%`, background: color } }
                        />
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0">
                        { item.status === 'broken' ? 'Zerbrochen' : `${ item.durabilityRemaining }%` }
                    </span>
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className="text-[10px] text-white/30">
                    { item.inRoom ? 'Im Raum' : 'Inventar' }
                </div>
                { item.tradeValue > 0 && (
                    <div className="text-[10px] text-white/30">
                        { item.tradeValue.toLocaleString() } C
                    </div>
                ) }
            </div>
        </button>
    );
};

// ─── Feed Picker ─────────────────────────────────

const FeedPickerView: FC<{
    candidates: FeedCandidate[];
    targetItem: WorkshopItem;
    onSelect: (item: FeedCandidate) => void;
    onBack: () => void;
    isRepairing: boolean;
}> = ({ candidates, targetItem, onSelect, onBack, isRepairing }) =>
{
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <button
                    className="px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all"
                    onClick={ onBack }
                >
                    ← Zurueck
                </button>
                <span className="text-xs text-white/40">
                    Rare opfern fuer: <span className="text-white/70">{ targetItem.itemName }</span>
                </span>
            </div>

            { candidates.length === 0 && (
                <div className="text-center text-white/30 text-sm py-8">
                    Keine Items mit Trade-Value im Inventar
                </div>
            ) }

            <div className="space-y-1">
                { candidates.map(candidate =>
                {
                    const feedValue = Math.floor(candidate.tradeValue * targetItem.feedValuePercent / 100);
                    const repairPercent = Math.min(100, Math.floor(feedValue * 100 / Math.max(1, targetItem.repairCost)));

                    return (
                        <button
                            key={ candidate.itemId }
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/[0.05] transition-all disabled:opacity-40"
                            onClick={ () => onSelect(candidate) }
                            disabled={ isRepairing }
                        >
                            <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center shrink-0">
                                <img
                                    src={ GetFurniIconUrl(candidate.internalName) }
                                    alt=""
                                    className="max-w-[24px] max-h-[24px] object-contain"
                                    onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-white/70 truncate">{ candidate.itemName }</div>
                                <div className="text-[10px] text-white/30">
                                    Wert: { candidate.tradeValue.toLocaleString() } Credits
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={ `text-xs font-medium ${ repairPercent >= 50 ? 'text-emerald-400' : repairPercent >= 25 ? 'text-amber-400' : 'text-red-400' }` }>
                                    +{ repairPercent }%
                                </span>
                            </div>
                        </button>
                    );
                }) }
            </div>
        </div>
    );
};

// ─── Helper ──────────────────────────────────────

function GetFurniIconUrl(internalName: string): string
{
    const furniUrl = GetConfiguration<string>('hof.furni.url', 'http://localhost:8080/c_images');
    return `${ furniUrl }/${ internalName }_icon.png`;
}
