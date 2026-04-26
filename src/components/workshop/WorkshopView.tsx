import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Wrench, Search, X, Coins, Utensils, AlertTriangle, Check,
    Package, ArrowRight
} from 'lucide-react';
import { useWorkshop, WorkshopItem, FeedCandidate } from '../../hooks/workshop/useWorkshop';
import { GetConfiguration } from '../../api';
import { DraggableWindow, DraggableWindowPosition, InlineFeedback } from '../../common';
import { InventoryFurniAddedEvent } from '../../events';
import { useUiEvent } from '../../hooks/events';
import { useDebouncedCallback } from '../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

const STATUS_TABS = [
    { id: '', label: 'Alle' },
    { id: 'active', label: 'Aktiv' },
    { id: 'broken', label: 'Zerbrochen' },
    { id: 'confiscated', label: 'Eingezogen' },
];

function GetFurniIconUrl(internalName: string): string
{
    const furniUrl = GetConfiguration<string>('hof.furni.url', 'http://localhost:8080/c_images');
    return `${ furniUrl }/${ internalName.split('*')[0] }_icon.png`;
}

function urgencyScore(item: WorkshopItem): number
{
    if(item.status === 'broken' && item.graceExpiresAt)
    {
        const days = Math.max(0, Math.ceil((new Date(item.graceExpiresAt).getTime() - Date.now()) / 86400000));
        if(days <= 7) return 0;
    }
    if(item.status === 'broken') return 1;
    if(item.status === 'active' && item.durabilityRemaining <= 20) return 2;
    if(item.status === 'confiscated') return 4;
    return 3;
}

function graceRemainingDays(item: WorkshopItem): number | null
{
    if(!item.graceExpiresAt) return null;
    return Math.max(0, Math.ceil((new Date(item.graceExpiresAt).getTime() - Date.now()) / 86400000));
}

// ─── Item Icon ───────────────────────────────────

const ItemIcon: FC<{ classname: string; className?: string; broken?: boolean }> = ({ classname, className, broken }) =>
{
    const [ err, setErr ] = useState(false);

    if(err) return (
        <div className={ `flex items-center justify-center ${ className || 'w-full h-full' }` }>
            <Package className="w-3.5 h-3.5 text-text-soft-400" />
        </div>
    );

    return (
        <img
            src={ GetFurniIconUrl(classname) }
            alt={ classname }
            className={ `object-contain ${ className || 'w-full h-full' }` }
            style={ { imageRendering: 'pixelated', ...(broken ? { filter: 'grayscale(1) opacity(0.5)' } : {}) } }
            loading="lazy"
            onError={ () => setErr(true) }
        />
    );
};

// ─── Donut Chart ─────────────────────────────────

const DonutChart: FC<{ value: number; size?: number; muted?: boolean }> = ({ value, size = 52, muted = false }) =>
{
    const r = (size - 6) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    return (
        <svg width={ size } height={ size } className={ `shrink-0 ${ muted ? 'text-text-soft-400' : value < 20 ? 'text-error-base' : 'text-text-sub-600' }` }>
            <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke="currentColor" strokeWidth={ 3 } className="opacity-10" />
            <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke="currentColor" strokeWidth={ 3 } strokeDasharray={ c } strokeDashoffset={ offset } strokeLinecap="round" transform={ `rotate(-90 ${ size / 2 } ${ size / 2 })` } style={ { transition: 'stroke-dashoffset 500ms ease', opacity: muted ? 0.25 : value < 20 ? 1 : 0.5 } } />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-current text-label-xs tabular-nums">{ value }%</text>
        </svg>
    );
};

// ═══════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════

export const WorkshopView: FC<{}> = () =>
{
    const {
        isVisible, setIsVisible,
        items, feedCandidates,
        selectedItem, setSelectedItem,
        isLoading, isRepairing,
        error, lastRepairResult,
        repairWithCredits, repairWithFeed,
        loadItems,
    } = useWorkshop();

    const debouncedReload = useDebouncedCallback(() => loadItems(), 500);

    // Live re-sync when new furniture arrives in inventory (e.g. user picks up an item)
    useUiEvent<InventoryFurniAddedEvent>(InventoryFurniAddedEvent.FURNI_ADDED, () =>
    {
        if(isVisible) debouncedReload();
    });

    // Auto-refresh every 60s while open so grace-period countdown stays current
    useEffect(() =>
    {
        if(!isVisible) return;
        const id = setInterval(() => loadItems(), 60000);
        return () => clearInterval(id);
    }, [ isVisible, loadItems ]);

    const [ search, setSearch ] = useState('');
    const [ statusFilter, setStatusFilter ] = useState('');
    const [ repairMode, setRepairMode ] = useState<'credits' | 'feed'>('credits');
    const [ selectedFeed, setSelectedFeed ] = useState<FeedCandidate | null>(null);
    const [ logOpen, setLogOpen ] = useState(false);

    const onClose = useCallback(() =>
    {
        setIsVisible(false);
        setSelectedItem(null);
        setSearch('');
        setStatusFilter('');
    }, [ setIsVisible, setSelectedItem ]);

    const filtered = useMemo(() =>
    {
        let list = items;
        if(statusFilter) list = list.filter(i => i.status === statusFilter);
        if(search)
        {
            const q = search.toLowerCase();
            list = list.filter(i => i.itemName.toLowerCase().includes(q) || i.internalName.toLowerCase().includes(q));
        }
        return [ ...list ].sort((a, b) => urgencyScore(a) - urgencyScore(b) || a.durabilityRemaining - b.durabilityRemaining);
    }, [ items, search, statusFilter ]);

    const stats = useMemo(() => ({
        total: items.length,
        broken: items.filter(i => i.status === 'broken').length,
        confiscated: items.filter(i => i.status === 'confiscated').length,
        critical: items.filter(i => i.status === 'active' && i.durabilityRemaining <= 20).length,
    }), [ items ]);

    const graceDays = selectedItem ? graceRemainingDays(selectedItem) : null;
    const isUrgent = selectedItem ? (selectedItem.status === 'broken' && graceDays !== null && graceDays <= 7) : false;
    const isCritical = selectedItem ? (selectedItem.status === 'active' && selectedItem.durabilityRemaining <= 20 && selectedItem.durabilityRemaining > 0) : false;

    const handleRepairCredits = useCallback(async () =>
    {
        if(!selectedItem) return;
        await repairWithCredits(selectedItem.itemId);
    }, [ selectedItem, repairWithCredits ]);

    const handleRepairFeed = useCallback(async () =>
    {
        if(!selectedItem || !selectedFeed) return;
        await repairWithFeed(selectedItem.itemId, selectedFeed.itemId);
        setSelectedFeed(null);
    }, [ selectedItem, selectedFeed, repairWithFeed ]);

    const selectItem = useCallback((item: WorkshopItem) =>
    {
        setSelectedItem(selectedItem?.itemId === item.itemId ? null : item);
        setRepairMode('credits');
        setSelectedFeed(null);
        setLogOpen(false);
    }, [ selectedItem, setSelectedItem ]);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="workshop" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <AlignSurface.Panel className="flex w-[900px] max-w-[94vw] overflow-hidden flex-col" style={ { maxHeight: '84vh' } }>

                {/* Title Bar */}
                <div className="drag-handler flex h-11 shrink-0 cursor-move select-none items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0 px-3">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-text-sub-600" />
                        <span className="text-label-sm text-text-strong-950">Werkstatt</span>
                        <AlignBadge.Root color="gray" variant="lighter" size="small" square>{ stats.total } Items</AlignBadge.Root>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 text-paragraph-xs text-text-sub-600 tabular-nums">
                            <span>{ stats.total } Gesamt</span>
                            { stats.broken > 0 && <span className="text-error-base font-medium">{ stats.broken } zerbrochen</span> }
                            { stats.critical > 0 && <span className="text-warning-base">{ stats.critical } kritisch</span> }
                        </div>
                        <AlignButton.Root
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="w-7 h-7 px-0"
                            onClick={ onClose }
                            onMouseDown={ (e) => e.stopPropagation() }
                        >
                            <X className="w-3.5 h-3.5" />
                        </AlignButton.Root>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="shrink-0 space-y-2 border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-3">
                    <AlignInput.Root size="xsmall">
                        <AlignInput.Wrapper className="h-8">
                            <AlignInput.Icon as={ Search } className="size-3.5" />
                            <AlignInput.Input
                                placeholder="Suchen..."
                                value={ search }
                                onChange={ (e) => setSearch(e.target.value) }
                                className="h-8 text-paragraph-xs"
                            />
                            { search && (
                                <button onClick={ () => setSearch('') } className="shrink-0 cursor-pointer text-text-soft-400 hover:text-text-strong-950">
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            ) }
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                    <div className="flex flex-wrap gap-1">
                        { STATUS_TABS.map(tab => (
                            <AlignButton.Root
                                key={ tab.id }
                                onClick={ () => setStatusFilter(tab.id) }
                                variant="neutral"
                                mode={ statusFilter === tab.id ? 'lighter' : 'ghost' }
                                size="xxsmall"
                                className="text-label-xs"
                            >
                                { tab.label }
                            </AlignButton.Root>
                        )) }
                    </div>
                </div>

                {/* Split Layout */}
                <div className="flex flex-1 min-h-0" style={ { minHeight: 320 } }>

                    {/* Left: Item List */}
                    <div className="overflow-y-auto border-r border-stroke-soft-200 bg-bg-white-0 p-2" style={ { width: '42%', scrollbarWidth: 'thin' } }>
                        { isLoading && (
                            <div className="flex items-center justify-center py-16 text-text-soft-400 text-xs">Laden...</div>
                        ) }
                        { !isLoading && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-text-soft-400">
                                <Package className="w-8 h-8 mb-2" />
                                <p className="text-xs font-medium">Keine Items</p>
                            </div>
                        ) }
                        { !isLoading && filtered.length > 0 && (
                            <div className="space-y-1">
                                { filtered.map(item =>
                                {
                                    const isBroken = item.status === 'broken';
                                    const isConf = item.status === 'confiscated';
                                    const isDanger = item.durabilityRemaining <= 20 && item.durabilityRemaining > 0 && item.status === 'active';

                                    return (
                                        <button
                                            key={ item.itemId }
                                            onClick={ () => selectItem(item) }
                                            className={ `w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                                                selectedItem?.itemId === item.itemId ? 'bg-bg-weak-50' : 'hover:bg-bg-weak-50'
                                            } ${ isBroken ? 'border-l-2 border-l-error-base' : isConf ? 'border-l-2 border-l-stroke-soft-200' : 'border-l-2 border-l-transparent' }` }
                                        >
                                            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50">
                                                <ItemIcon classname={ item.internalName } className="w-6 h-6" broken={ isBroken } />
                                                { isBroken && <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-error-base" /> }
                                                { isConf && <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-faded-base" /> }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={ `block truncate text-label-xs ${ isConf ? 'text-text-soft-400 line-through' : 'text-text-strong-950' }` }>
                                                    { item.itemName }
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <AlignProgress.Root value={ item.durabilityRemaining } color={ isDanger || isBroken ? 'red' : 'blue' } className="flex-1 h-1" />
                                                    <span className={ `text-subheading-2xs tabular-nums ${ isDanger || isBroken ? 'text-error-base' : 'text-text-sub-600' }` }>
                                                        { item.durabilityRemaining }%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }) }
                            </div>
                        ) }
                    </div>

                    {/* Right: Detail Panel */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                        { !selectedItem ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-text-soft-400 gap-2">
                                <Wrench className="w-8 h-8" />
                                <p className="text-paragraph-xs">Item auswählen</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-3">

                                {/* Header */}
                                <div className="flex items-start gap-3">
                                    <DonutChart value={ selectedItem.durabilityRemaining } size={ 52 } muted={ selectedItem.status === 'confiscated' } />
                                    <div className="flex-1 min-w-0">
                                        <span className="block truncate text-label-sm text-text-strong-950">{ selectedItem.itemName }</span>
                                        <p className="mt-0.5 font-mono text-paragraph-xs text-text-soft-400">{ selectedItem.internalName } · #{ selectedItem.itemId }</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            { selectedItem.tradeValue > 0 && (
                                                <span className="flex items-center gap-0.5 text-paragraph-xs text-text-sub-600 tabular-nums">
                                                    { selectedItem.tradeValue.toLocaleString('de-DE') } Credits
                                                </span>
                                            ) }
                                        </div>
                                    </div>
                                </div>

                                {/* Info Row */}
                                <div className="grid grid-cols-3 gap-1.5">
                                    { [
                                        { label: 'Tage übrig', value: selectedItem.status === 'active' ? String(Math.ceil(selectedItem.durabilityRemaining / (100 / selectedItem.maxDays))) : '—' },
                                        { label: 'Max Tage', value: String(selectedItem.maxDays) },
                                        { label: 'Status', value: selectedItem.status === 'active' ? 'Aktiv' : selectedItem.status === 'broken' ? 'Zerbrochen' : 'Eingezogen' },
                                    ].map(cell => (
                                        <div key={ cell.label } className="rounded-lg bg-bg-weak-50 px-2 py-1.5 text-center">
                                            <p className="text-subheading-2xs uppercase text-text-soft-400">{ cell.label }</p>
                                            <p className="mt-0.5 text-label-xs text-text-sub-600 tabular-nums">{ cell.value }</p>
                                        </div>
                                    )) }
                                </div>

                                {/* Alerts */}
                                { error && (
                                    <InlineFeedback tone="error" message={ error } />
                                ) }
                                { lastRepairResult?.success === true && (
                                    <InlineFeedback
                                        tone="success"
                                        message={ `Reparatur abgeschlossen: ${ String(lastRepairResult.durabilityBefore ?? selectedItem.durabilityRemaining) }% auf ${ String(lastRepairResult.durabilityAfter ?? 100) }%.` }
                                    />
                                ) }
                                { lastRepairResult?.error && !lastRepairResult?.success && (
                                    <InlineFeedback tone="error" message={ String(lastRepairResult.error) } />
                                ) }
                                { isUrgent && (
                                    <div className="flex items-center gap-2 rounded-md border border-error-base/30 bg-error-lighter px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-error-base shrink-0" />
                                        <p className="text-paragraph-xs text-error-base">Einziehung in <strong className="tabular-nums">{ graceDays } Tagen</strong> - jetzt reparieren!</p>
                                    </div>
                                ) }
                                { !isUrgent && selectedItem.status === 'broken' && (
                                    <div className="flex items-center gap-2 rounded-md border border-error-base/20 px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-error-base shrink-0" />
                                        <p className="text-paragraph-xs text-text-sub-600">
                                            Zerbrochen — { graceDays !== null ? <span className="tabular-nums">{ graceDays } Tage Grace verbleibend</span> : 'Grace-Periode aktiv' }
                                        </p>
                                    </div>
                                ) }
                                { !isUrgent && isCritical && (
                                    <div className="flex items-center gap-2 rounded-md border border-warning-base/30 bg-warning-lighter px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-warning-base shrink-0" />
                                        <p className="text-paragraph-xs text-warning-dark">Kritischer Zustand - Reparatur empfohlen</p>
                                    </div>
                                ) }
                                { selectedItem.status === 'confiscated' && (
                                    <div className="rounded-md border border-stroke-soft-200 px-2.5 py-2">
                                        <p className="text-paragraph-xs text-text-soft-400">Eingezogen - Reparatur nicht mehr möglich</p>
                                    </div>
                                ) }

                                {/* Repair Block */}
                                { selectedItem.status !== 'confiscated' && (
                                    <div className="space-y-2.5 rounded-xl bg-bg-weak-50 p-3">
                                        {/* Mode Toggle */}
                                        <div className="flex items-center gap-1">
                                            <AlignButton.Root
                                                onClick={ () => setRepairMode('credits') }
                                                variant="neutral"
                                                mode={ repairMode === 'credits' ? 'lighter' : 'ghost' }
                                                size="xxsmall"
                                                className="gap-1 text-label-xs"
                                            >
                                                <Coins className="w-3 h-3" />Credits
                                            </AlignButton.Root>
                                            <AlignButton.Root
                                                onClick={ () => setRepairMode('feed') }
                                                variant="neutral"
                                                mode={ repairMode === 'feed' ? 'lighter' : 'ghost' }
                                                size="xxsmall"
                                                className="gap-1 text-label-xs"
                                            >
                                                <Utensils className="w-3 h-3" />Verfüttern
                                            </AlignButton.Root>
                                        </div>

                                        { repairMode === 'credits' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-paragraph-xs">
                                                    <span className="text-text-sub-600">Kosten</span>
                                                    <span className="font-medium tabular-nums text-text-strong-950">{ selectedItem.repairCost.toLocaleString('de-DE') } Credits</span>
                                                </div>
                                                <div className="flex items-center justify-between text-paragraph-xs">
                                                    <span className="text-text-sub-600">Ergebnis</span>
                                                    <span className="font-medium tabular-nums text-text-strong-950">
                                                        { selectedItem.durabilityRemaining }% <ArrowRight className="w-2.5 h-2.5 inline text-text-soft-400" /> 100%
                                                    </span>
                                                </div>
                                                <FancyButton.Root
                                                    variant="primary"
                                                    size="xsmall"
                                                    className="w-full"
                                                    disabled={ selectedItem.durabilityRemaining >= 100 || isRepairing }
                                                    onClick={ handleRepairCredits }
                                                >
                                                    { isRepairing ? 'Repariere...' : 'Jetzt reparieren' }
                                                </FancyButton.Root>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-paragraph-xs text-text-sub-600">Opfer-Item wählen (wird zerstört):</p>
                                                <div className="space-y-0.5 max-h-[100px] overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                                                    { feedCandidates.length === 0 && (
                                                        <p className="py-3 text-center text-paragraph-xs text-text-soft-400">Keine Items mit Trade-Value im Inventar</p>
                                                    ) }
                                                    { feedCandidates.map(fc =>
                                                    {
                                                        const repairPct = selectedItem.repairCost > 0
                                                            ? Math.min(100, Math.round(fc.tradeValue * (selectedItem.feedValuePercent / 100) * 100 / selectedItem.repairCost))
                                                            : 100;
                                                        const isSel = selectedFeed?.itemId === fc.itemId;

                                                        return (
                                                            <button
                                                                key={ fc.itemId }
                                                                onClick={ () => setSelectedFeed(fc) }
                                                                className={ `w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                                                                    isSel ? 'bg-bg-weak-50 ring-1 ring-stroke-soft-200' : 'hover:bg-bg-weak-50'
                                                                }` }
                                                            >
                                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-bg-white-0">
                                                                    <ItemIcon classname={ fc.internalName } className="w-5 h-5" />
                                                                </div>
                                                                <span className="flex-1 truncate text-paragraph-xs text-text-strong-950">{ fc.itemName }</span>
                                                                <span className="shrink-0 text-subheading-2xs text-text-sub-600 tabular-nums">+{ repairPct }%</span>
                                                            </button>
                                                        );
                                                    }) }
                                                </div>
                                                { selectedFeed && (
                                                    <div className="flex items-center justify-between border-t border-stroke-soft-200 pt-1 text-paragraph-xs">
                                                        <span className="text-text-sub-600">Ergebnis</span>
                                                        <span className="font-medium tabular-nums text-text-strong-950">
                                                            { selectedItem.durabilityRemaining }% <ArrowRight className="w-2.5 h-2.5 inline text-text-soft-400" /> { Math.min(100, selectedItem.durabilityRemaining + (selectedItem.repairCost > 0 ? Math.min(100, Math.round(selectedFeed.tradeValue * (selectedItem.feedValuePercent / 100) * 100 / selectedItem.repairCost)) : 100)) }%
                                                        </span>
                                                    </div>
                                                ) }
                                                <FancyButton.Root
                                                    variant="basic"
                                                    size="xsmall"
                                                    className="w-full"
                                                    disabled={ !selectedFeed || selectedItem.durabilityRemaining >= 100 || isRepairing }
                                                    onClick={ handleRepairFeed }
                                                >
                                                    { isRepairing ? 'Verfüttere...' : 'Verfüttern' }
                                                </FancyButton.Root>
                                            </div>
                                        ) }
                                    </div>
                                ) }
                            </div>
                        ) }
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
};
