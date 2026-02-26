import { FC, useCallback, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import {
    Wrench, Search, X, Coins, Utensils, AlertTriangle, Check,
    Package, ChevronDown, History, ArrowRight
} from 'lucide-react';
import { useWorkshop, WorkshopItem, FeedCandidate } from '../../hooks/workshop/useWorkshop';
import { GetConfiguration } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common';

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
            <Package className="w-3.5 h-3.5 text-muted-foreground/30" />
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
    const color = muted
        ? 'var(--muted-foreground)'
        : value < 20
            ? 'var(--destructive)'
            : 'var(--foreground)';

    return (
        <svg width={ size } height={ size } className="shrink-0">
            <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke="currentColor" strokeWidth={ 3 } className="text-muted-foreground/10" />
            <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke={ color } strokeWidth={ 3 } strokeDasharray={ c } strokeDashoffset={ offset } strokeLinecap="round" transform={ `rotate(-90 ${ size / 2 } ${ size / 2 })` } style={ { transition: 'stroke-dashoffset 500ms ease', opacity: muted ? 0.25 : value < 20 ? 1 : 0.5 } } />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className={ `text-[11px] font-bold tabular-nums ${ muted ? 'fill-muted-foreground/40' : 'fill-foreground' }` }>{ value }%</text>
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
        repairWithCredits, repairWithFeed,
    } = useWorkshop();

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
            <div className="w-[660px] rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col" style={ { maxHeight: '75vh' } }>

                {/* Title Bar */}
                <div className="drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-move select-none">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[13px] font-semibold text-foreground">Werkstatt</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground tabular-nums">
                            <span>{ stats.total } Gesamt</span>
                            { stats.broken > 0 && <span className="text-destructive font-medium">{ stats.broken } zerbrochen</span> }
                            { stats.critical > 0 && <span className="text-muted-foreground/70">{ stats.critical } kritisch</span> }
                        </div>
                        <button
                            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={ onClose }
                            onMouseDown={ (e) => e.stopPropagation() }
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="shrink-0 px-3 py-2 space-y-1.5 border-b border-border/30">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                        <input
                            type="text"
                            placeholder="Suchen…"
                            value={ search }
                            onChange={ (e) => setSearch(e.target.value) }
                            className="w-full pl-7 pr-6 h-7 text-[11px] rounded-md border border-border/40 bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-ring/50"
                        />
                        { search && (
                            <button onClick={ () => setSearch('') } className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer">
                                <X className="w-2.5 h-2.5 text-muted-foreground/50" />
                            </button>
                        ) }
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        { STATUS_TABS.map(tab => (
                            <button
                                key={ tab.id }
                                onClick={ () => setStatusFilter(tab.id) }
                                className={ `px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                    statusFilter === tab.id
                                        ? 'bg-foreground/10 text-foreground'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                }` }
                            >
                                { tab.label }
                            </button>
                        )) }
                    </div>
                </div>

                {/* Split Layout */}
                <div className="flex flex-1 min-h-0" style={ { minHeight: 320 } }>

                    {/* Left: Item List */}
                    <div className="border-r border-border/30 overflow-y-auto" style={ { width: '44%', scrollbarWidth: 'thin' } }>
                        { isLoading && (
                            <div className="flex items-center justify-center py-16 text-muted-foreground/40 text-xs">Laden...</div>
                        ) }
                        { !isLoading && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Package className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Keine Items</p>
                            </div>
                        ) }
                        { !isLoading && filtered.length > 0 && (
                            <div className="divide-y divide-border/20">
                                { filtered.map(item =>
                                {
                                    const isBroken = item.status === 'broken';
                                    const isConf = item.status === 'confiscated';
                                    const isDanger = item.durabilityRemaining <= 20 && item.durabilityRemaining > 0 && item.status === 'active';

                                    return (
                                        <button
                                            key={ item.itemId }
                                            onClick={ () => selectItem(item) }
                                            className={ `w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors cursor-pointer ${
                                                selectedItem?.itemId === item.itemId ? 'bg-accent/40' : 'hover:bg-accent/20'
                                            } ${ isBroken ? 'border-l-2 border-l-destructive' : isConf ? 'border-l-2 border-l-muted-foreground/20' : 'border-l-2 border-l-transparent' }` }
                                        >
                                            <div className="relative w-8 h-8 shrink-0 rounded border border-border/30 bg-muted/10 flex items-center justify-center overflow-hidden">
                                                <ItemIcon classname={ item.internalName } className="w-6 h-6" broken={ isBroken } />
                                                { isBroken && <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-destructive" /> }
                                                { isConf && <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-muted-foreground/40" /> }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={ `text-[11px] font-medium truncate block ${ isConf ? 'text-muted-foreground/50 line-through' : 'text-foreground' }` }>
                                                    { item.itemName }
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="flex-1 h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
                                                        <div
                                                            className={ `h-full rounded-full transition-all ${ isDanger || isBroken ? 'bg-destructive' : 'bg-foreground/30' }` }
                                                            style={ { width: `${ item.durabilityRemaining }%` } }
                                                        />
                                                    </div>
                                                    <span className={ `text-[9px] font-bold tabular-nums ${ isDanger || isBroken ? 'text-destructive' : 'text-muted-foreground' }` }>
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
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
                                <Wrench className="w-8 h-8" />
                                <p className="text-[11px]">Item auswählen</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-3">

                                {/* Header */}
                                <div className="flex items-start gap-3">
                                    <DonutChart value={ selectedItem.durabilityRemaining } size={ 52 } muted={ selectedItem.status === 'confiscated' } />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13px] font-semibold truncate block text-foreground">{ selectedItem.itemName }</span>
                                        <p className="text-[9px] text-muted-foreground/40 font-mono mt-0.5">{ selectedItem.internalName } · #{ selectedItem.itemId }</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            { selectedItem.tradeValue > 0 && (
                                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 tabular-nums">
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
                                        <div key={ cell.label } className="rounded-md bg-muted/10 border border-border/20 px-2 py-1.5 text-center">
                                            <p className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">{ cell.label }</p>
                                            <p className="text-[12px] font-medium text-muted-foreground mt-0.5 tabular-nums">{ cell.value }</p>
                                        </div>
                                    )) }
                                </div>

                                {/* Alerts */}
                                { isUrgent && (
                                    <div className="flex items-center gap-2 rounded-md border border-destructive/30 px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                        <p className="text-[10px] text-destructive">Einziehung in <strong className="tabular-nums">{ graceDays } Tagen</strong> — jetzt reparieren!</p>
                                    </div>
                                ) }
                                { !isUrgent && selectedItem.status === 'broken' && (
                                    <div className="flex items-center gap-2 rounded-md border border-destructive/20 px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-destructive/60 shrink-0" />
                                        <p className="text-[10px] text-muted-foreground">
                                            Zerbrochen — { graceDays !== null ? <span className="tabular-nums">{ graceDays } Tage Grace verbleibend</span> : 'Grace-Periode aktiv' }
                                        </p>
                                    </div>
                                ) }
                                { !isUrgent && isCritical && (
                                    <div className="flex items-center gap-2 rounded-md border border-border/30 px-2.5 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                                        <p className="text-[10px] text-muted-foreground">Kritischer Zustand — Reparatur empfohlen</p>
                                    </div>
                                ) }
                                { selectedItem.status === 'confiscated' && (
                                    <div className="rounded-md border border-border/20 px-2.5 py-2">
                                        <p className="text-[10px] text-muted-foreground/50">Eingezogen — Reparatur nicht mehr möglich</p>
                                    </div>
                                ) }

                                {/* Repair Block */}
                                { selectedItem.status !== 'confiscated' && (
                                    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
                                        {/* Mode Toggle */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={ () => setRepairMode('credits') }
                                                className={ `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                                    repairMode === 'credits'
                                                        ? 'bg-foreground/10 text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }` }
                                            >
                                                <Coins className="w-3 h-3" />Credits
                                            </button>
                                            <button
                                                onClick={ () => setRepairMode('feed') }
                                                className={ `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                                    repairMode === 'feed'
                                                        ? 'bg-foreground/10 text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }` }
                                            >
                                                <Utensils className="w-3 h-3" />Verfüttern
                                            </button>
                                        </div>

                                        { repairMode === 'credits' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-muted-foreground">Kosten</span>
                                                    <span className="font-medium tabular-nums text-foreground">{ selectedItem.repairCost.toLocaleString('de-DE') } Credits</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-muted-foreground">Ergebnis</span>
                                                    <span className="font-medium tabular-nums text-foreground">
                                                        { selectedItem.durabilityRemaining }% <ArrowRight className="w-2.5 h-2.5 inline text-muted-foreground/40" /> 100%
                                                    </span>
                                                </div>
                                                <button
                                                    className="w-full h-8 text-[11px] font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                                                    disabled={ selectedItem.durabilityRemaining >= 100 || isRepairing }
                                                    onClick={ handleRepairCredits }
                                                >
                                                    { isRepairing ? 'Repariere...' : 'Jetzt reparieren' }
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[9px] text-muted-foreground/50">Opfer-Item wählen (wird zerstört):</p>
                                                <div className="space-y-0.5 max-h-[100px] overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                                                    { feedCandidates.length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground/40 py-3 text-center">Keine Items mit Trade-Value im Inventar</p>
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
                                                                    isSel ? 'bg-foreground/[0.07] ring-1 ring-foreground/20' : 'hover:bg-accent/20'
                                                                }` }
                                                            >
                                                                <div className="w-6 h-6 shrink-0 rounded border border-border/20 bg-muted/10 flex items-center justify-center">
                                                                    <ItemIcon classname={ fc.internalName } className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-[10px] truncate flex-1 text-foreground">{ fc.itemName }</span>
                                                                <span className="text-[9px] font-medium text-muted-foreground tabular-nums shrink-0">+{ repairPct }%</span>
                                                            </button>
                                                        );
                                                    }) }
                                                </div>
                                                { selectedFeed && (
                                                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/20">
                                                        <span className="text-muted-foreground">Ergebnis</span>
                                                        <span className="font-medium tabular-nums text-foreground">
                                                            { selectedItem.durabilityRemaining }% <ArrowRight className="w-2.5 h-2.5 inline text-muted-foreground/40" /> { Math.min(100, selectedItem.durabilityRemaining + (selectedItem.repairCost > 0 ? Math.min(100, Math.round(selectedFeed.tradeValue * (selectedItem.feedValuePercent / 100) * 100 / selectedItem.repairCost)) : 100)) }%
                                                        </span>
                                                    </div>
                                                ) }
                                                <button
                                                    className="w-full h-8 text-[11px] font-semibold rounded-md border border-border text-foreground hover:bg-accent/50 transition-colors disabled:opacity-40 cursor-pointer"
                                                    disabled={ !selectedFeed || selectedItem.durabilityRemaining >= 100 || isRepairing }
                                                    onClick={ handleRepairFeed }
                                                >
                                                    { isRepairing ? 'Verfüttere...' : 'Verfüttern' }
                                                </button>
                                            </div>
                                        ) }
                                    </div>
                                ) }
                            </div>
                        ) }
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
};
