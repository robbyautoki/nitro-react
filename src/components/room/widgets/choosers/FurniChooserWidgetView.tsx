import { ILinkEventTracker, RoomObjectOperationType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddEventLinkTracker, GetRoomEngine, GetRoomSession, GetSessionDataManager, RemoveLinkEventTracker, RoomObjectItem } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common';
import { useFurniChooserWidget } from '../../../../hooks';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, X, Package, LayoutGrid, List, ArrowUpDown, GripVertical, ChevronLeft, MousePointer, PackageOpen } from 'lucide-react';

// ─── Types ──────────────────────────────────────

type ViewMode = 'list' | 'grid';
type SortMode = 'name' | 'id' | 'count';
type FilterMode = 'all' | 'floor' | 'wall';

// ─── Helpers ────────────────────────────────────

function getIconUrl(item: RoomObjectItem): string | null
{
    if(item.typeId <= 0) return null;
    return item.isWallItem
        ? GetRoomEngine().getFurnitureWallIconUrl(item.typeId)
        : GetRoomEngine().getFurnitureFloorIconUrl(item.typeId);
}

function groupItems(items: RoomObjectItem[]): { item: RoomObjectItem; count: number; allIds: { id: number; category: number }[] }[]
{
    const map = new Map<string, { item: RoomObjectItem; count: number; allIds: { id: number; category: number }[] }>();

    for(const item of items)
    {
        if(!item) continue;
        const key = `${ item.typeId }-${ item.isWallItem ? 'w' : 'f' }`;

        if(map.has(key))
        {
            const group = map.get(key);
            group.count++;
            group.allIds.push({ id: item.id, category: item.category });
        }
        else
        {
            map.set(key, { item, count: 1, allIds: [ { id: item.id, category: item.category } ] });
        }
    }

    return Array.from(map.values());
}

// ─── Item Icon ──────────────────────────────────

const FurniIcon: FC<{ item: RoomObjectItem; className?: string }> = ({ item, className }) =>
{
    const [ err, setErr ] = useState(false);
    const url = getIconUrl(item);

    if(!url || err) return (
        <div className={ `flex items-center justify-center bg-muted/20 ${ className || 'w-full h-full' }` }>
            <Package className="w-3.5 h-3.5 text-muted-foreground/30" />
        </div>
    );

    return (
        <img src={ url } alt={ item.name }
            className={ `object-contain ${ className || 'w-full h-full' }` }
            style={ { imageRendering: 'pixelated' } } loading="lazy" onError={ () => setErr(true) } />
    );
};

// ─── Item Row (List View) ───────────────────────

const ItemRow: FC<{
    item: RoomObjectItem; count: number; isSelected: boolean; canSeeId: boolean;
    onSelect: () => void;
}> = ({ item, count, isSelected, canSeeId, onSelect }) =>
{
    return (
        <button onClick={ onSelect }
            className={ `w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-100 border-b border-border/20
                ${ isSelected
                    ? 'bg-primary/8 border-l-2 border-l-primary'
                    : 'hover:bg-accent/40 border-l-2 border-l-transparent' }` }>
            <div className="w-10 h-10 shrink-0 rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center overflow-hidden">
                <div className="w-8 h-8"><FurniIcon item={ item } /></div>
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold truncate block">{ item.name }</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    { canSeeId && (
                        <>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">ID { item.typeId }</span>
                            <span className="text-[10px] text-muted-foreground/30">·</span>
                        </>
                    ) }
                    <span className="text-[10px] text-muted-foreground/60">{ item.isWallItem ? 'Wand' : 'Boden' }</span>
                    <span className="text-[10px] text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground/60 font-semibold">{ count }×</span>
                </div>
            </div>
            <ChevronLeft className={ `w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${ isSelected ? 'rotate-180 text-primary' : 'text-muted-foreground/20 rotate-180' }` } />
        </button>
    );
};

// ─── Item Tile (Grid View) ──────────────────────

const ItemTile: FC<{
    item: RoomObjectItem; count: number; isSelected: boolean; canSeeId: boolean;
    onSelect: () => void;
}> = ({ item, count, isSelected, canSeeId, onSelect }) =>
{
    return (
        <TooltipProvider delayDuration={ 200 }>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={ onSelect }
                        className={ `relative w-[56px] h-[56px] border border-border/30 flex items-center justify-center transition-colors duration-100
                            ${ isSelected ? 'bg-primary/15 border-primary/50 z-10' : 'bg-card hover:bg-accent/40' }` }>
                        <div className="w-9 h-9"><FurniIcon item={ item } /></div>
                        { count > 1 && (
                            <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-foreground/60 tabular-nums leading-tight">
                                { count }
                            </span>
                        ) }
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={ 4 }>
                    <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="font-semibold text-xs">{ item.name }</span>
                        { canSeeId && <span className="text-[9px] opacity-40 font-mono">{ item.classname }</span> }
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                            <span>{ count }×</span>
                            <span>·</span>
                            <span>{ item.isWallItem ? 'Wand' : 'Boden' }</span>
                            { canSeeId && <><span>·</span><span>ID { item.typeId }</span></> }
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// ─── Detail Panel ───────────────────────────────

const DetailPanel: FC<{
    item: RoomObjectItem; count: number; canSeeId: boolean;
    onBack: () => void; onSelect: () => void; onPickup: () => void;
}> = ({ item, count, canSeeId, onBack, onSelect, onPickup }) =>
{
    return (
        <div className="flex flex-col h-full">
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border/30">
                <button onClick={ onBack } className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Zurück</span>
                </button>
                <div className="flex-1" />
            </div>

            <div className="flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-3 flex flex-col gap-3">
                    {/* Large Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 opacity-[0.02]"
                                style={ { backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)', backgroundSize: '8px 8px' } } />
                            <div className="w-12 h-12 relative z-10 drop-shadow-md">
                                <FurniIcon item={ item } />
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="text-center">
                        <span className="text-[13px] font-semibold block">{ item.name }</span>
                    </div>

                    {/* Info Grid */}
                    <div className="rounded-lg border border-border/40 bg-muted/10 p-2.5 flex flex-col gap-1.5">
                        { canSeeId && <InfoRow label="Typ-ID" value={ String(item.typeId) } mono /> }
                        <InfoRow label="Typ" value={ item.isWallItem ? 'Wandmöbel' : 'Bodenmöbel' } />
                        <InfoRow label="Anzahl" value={ `${ count }× im Raum` } highlight />
                        { canSeeId && <InfoRow label="Classname" value={ item.classname } mono small /> }
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                        <button onClick={ onSelect }
                            className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-sm transition-all">
                            <MousePointer className="w-3.5 h-3.5" />
                            Auswählen
                        </button>
                        <button onClick={ onPickup }
                            className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <PackageOpen className="w-3.5 h-3.5" />
                            Aufnehmen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow: FC<{ label: string; value: string; mono?: boolean; small?: boolean; highlight?: boolean }> = ({ label, value, mono, small, highlight }) =>
{
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground/60 shrink-0">{ label }</span>
            <span className={ `text-[10px] text-right truncate
                ${ mono ? 'font-mono text-muted-foreground' : '' }
                ${ small ? 'text-[9px]' : '' }
                ${ highlight ? 'font-semibold text-foreground' : '' }
                ${ !mono && !highlight ? 'text-foreground' : '' }` }>
                { value }
            </span>
        </div>
    );
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export const FurniChooserWidgetView: FC<{}> = () =>
{
    const { items = null, onClose = null, selectItem = null, populateChooser = null } = useFurniChooserWidget();

    const [ search, setSearch ] = useState('');
    const [ viewMode, setViewMode ] = useState<ViewMode>('list');
    const [ sortMode, setSortMode ] = useState<SortMode>('name');
    const [ filterMode, setFilterMode ] = useState<FilterMode>('all');
    const [ selectedKey, setSelectedKey ] = useState<string | null>(null);
    const [ size, setSize ] = useState({ w: 380, h: 500 });
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    const canSeeId = GetSessionDataManager().hasSecurity(15);

    // ─── Link Tracker ─────────────────────────────

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                populateChooser();
                setSearch('');
                setSelectedKey(null);
            },
            eventUrlPrefix: 'furni-chooser/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ populateChooser ]);

    // ─── Resize ───────────────────────────────────

    useEffect(() =>
    {
        const onMove = (e: PointerEvent) =>
        {
            if(!resizeRef.current) return;
            setSize({
                w: Math.min(600, Math.max(340, resizeRef.current.startW + e.clientX - resizeRef.current.startX)),
                h: Math.min(700, Math.max(400, resizeRef.current.startH + e.clientY - resizeRef.current.startY)),
            });
        };
        const onUp = () => { resizeRef.current = null; };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, []);

    const onResizeStart = useCallback((e: React.PointerEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    }, [ size ]);

    // ─── Grouped + Filtered Data ──────────────────

    const grouped = useMemo(() => items ? groupItems(items) : [], [ items ]);

    const filteredGroups = useMemo(() =>
    {
        let result = grouped;

        if(filterMode === 'floor') result = result.filter(g => !g.item.isWallItem);
        if(filterMode === 'wall') result = result.filter(g => g.item.isWallItem);

        if(search.trim())
        {
            const q = search.toLowerCase();
            result = result.filter(g =>
                g.item.name?.toLowerCase().includes(q) ||
                g.item.classname?.toLowerCase().includes(q) ||
                String(g.item.typeId).includes(q)
            );
        }

        switch(sortMode)
        {
            case 'id': return [ ...result ].sort((a, b) => a.item.typeId - b.item.typeId);
            case 'count': return [ ...result ].sort((a, b) => b.count - a.count);
            default: return [ ...result ].sort((a, b) => (a.item.name || '').localeCompare(b.item.name || ''));
        }
    }, [ grouped, search, filterMode, sortMode ]);

    const selectedGroup = useMemo(() =>
        selectedKey ? filteredGroups.find(g => `${ g.item.typeId }-${ g.item.isWallItem ? 'w' : 'f' }` === selectedKey) ?? null : null,
    [ selectedKey, filteredGroups ]);

    const stats = useMemo(() =>
    {
        const total = grouped.length;
        const floor = grouped.filter(g => !g.item.isWallItem).length;
        const wall = grouped.filter(g => g.item.isWallItem).length;
        const totalCount = grouped.reduce((s, g) => s + g.count, 0);
        return { total, floor, wall, totalCount };
    }, [ grouped ]);

    // ─── Handlers ─────────────────────────────────

    const handleSelect = useCallback((group: typeof filteredGroups[0]) =>
    {
        const key = `${ group.item.typeId }-${ group.item.isWallItem ? 'w' : 'f' }`;
        setSelectedKey(prev => prev === key ? null : key);
        selectItem(group.item);
    }, [ selectItem ]);

    const handlePickup = useCallback(() =>
    {
        if(!selectedGroup) return;
        // Pickup first instance
        const first = selectedGroup.allIds[0];
        if(first) GetRoomEngine().processRoomObjectOperation(first.id, first.category, RoomObjectOperationType.OBJECT_PICKUP);
    }, [ selectedGroup ]);

    const handleClose = useCallback(() =>
    {
        setSelectedKey(null);
        setSearch('');
        onClose();
    }, [ onClose ]);

    const cycleSortMode = useCallback(() =>
    {
        setSortMode(prev =>
        {
            const modes: SortMode[] = [ 'name', 'id', 'count' ];
            return modes[(modes.indexOf(prev) + 1) % modes.length];
        });
    }, []);

    const sortLabel = sortMode === 'name' ? 'A-Z' : sortMode === 'id' ? 'ID' : 'Menge';

    // ─── Render ───────────────────────────────────

    if(!items) return null;

    return (
        <DraggableWindow uniqueKey="furni-chooser" handleSelector=".furni-drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col relative"
                style={ { width: size.w, height: size.h } }>

                {/* Title Bar */}
                <div className="furni-drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                    <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                        <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[13px] font-semibold">Möbel im Raum</span>
                    </div>
                    <div className="flex items-center gap-2" onMouseDownCapture={ e => e.stopPropagation() } onTouchStartCapture={ e => e.stopPropagation() }>
                        <span className="text-[9px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded tabular-nums">
                            { filteredGroups.length } { filteredGroups.length === 1 ? 'Item' : 'Items' }
                        </span>
                        <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
                            onClick={ handleClose }>
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Search + Controls */}
                <div className="shrink-0 px-2.5 py-2 border-b border-border/30 bg-card/30 flex flex-col gap-2"
                    onMouseDownCapture={ e => e.stopPropagation() } onTouchStartCapture={ e => e.stopPropagation() }>
                    <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                            <input type="text" placeholder="Suchen (Name, ID)..."
                                value={ search } onChange={ e => setSearch(e.target.value) }
                                className="w-full pl-7 h-7 text-[11px] rounded-md border border-border/40 bg-background px-2 py-1 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors" />
                            { search && (
                                <button onClick={ () => setSearch('') } className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                    <X className="w-2.5 h-2.5 text-muted-foreground/50" />
                                </button>
                            ) }
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center border border-border/30 rounded-md overflow-hidden">
                            <button onClick={ () => setViewMode('list') }
                                className={ `px-1.5 py-1 transition-colors ${ viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50' }` }>
                                <List className="w-3 h-3" />
                            </button>
                            <button onClick={ () => setViewMode('grid') }
                                className={ `px-1.5 py-1 transition-colors ${ viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50' }` }>
                                <LayoutGrid className="w-3 h-3" />
                            </button>
                        </div>
                        <button onClick={ cycleSortMode }
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/30 text-[10px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
                            <ArrowUpDown className="w-3 h-3" />
                            { sortLabel }
                        </button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1">
                        { ([ { key: 'all' as FilterMode, label: 'Alle', count: stats.total },
                             { key: 'floor' as FilterMode, label: 'Boden', count: stats.floor },
                             { key: 'wall' as FilterMode, label: 'Wand', count: stats.wall },
                        ]).map(f => (
                            <button key={ f.key } onClick={ () => setFilterMode(f.key) }
                                className={ `px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors
                                    ${ filterMode === f.key
                                        ? 'bg-primary/10 text-primary border border-primary/30'
                                        : 'text-muted-foreground border border-border/30 hover:bg-accent/40' }` }>
                                { f.label }
                                <span className="ml-1 text-[9px] opacity-60 tabular-nums">{ f.count }</span>
                            </button>
                        )) }
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 min-h-0" onMouseDownCapture={ e => e.stopPropagation() } onTouchStartCapture={ e => e.stopPropagation() }>
                    {/* Item List / Grid */}
                    <div className={ `flex-1 flex flex-col min-w-0 min-h-0 ${ selectedGroup ? 'border-r border-border/30' : '' }` }>
                        <div className="flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                            { filteredGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Package className="w-10 h-10 mb-3 opacity-15" />
                                    <p className="font-medium text-xs">Keine Möbel gefunden</p>
                                    <p className="text-[10px] text-muted-foreground/50 mt-1">Suchbegriff ändern oder Filter zurücksetzen</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="flex flex-col">
                                    { filteredGroups.map(group =>
                                    {
                                        const key = `${ group.item.typeId }-${ group.item.isWallItem ? 'w' : 'f' }`;
                                        return (
                                            <ItemRow key={ key } item={ group.item } count={ group.count }
                                                isSelected={ selectedKey === key } canSeeId={ canSeeId }
                                                onSelect={ () => handleSelect(group) } />
                                        );
                                    }) }
                                </div>
                            ) : (
                                <div className="p-1">
                                    <div className="flex flex-wrap">
                                        { filteredGroups.map(group =>
                                        {
                                            const key = `${ group.item.typeId }-${ group.item.isWallItem ? 'w' : 'f' }`;
                                            return (
                                                <div key={ key } style={ { margin: '-0.5px' } }>
                                                    <ItemTile item={ group.item } count={ group.count }
                                                        isSelected={ selectedKey === key } canSeeId={ canSeeId }
                                                        onSelect={ () => handleSelect(group) } />
                                                </div>
                                            );
                                        }) }
                                    </div>
                                </div>
                            ) }
                        </div>
                    </div>

                    {/* Detail Panel */}
                    { selectedGroup && (
                        <div className="w-[200px] shrink-0 bg-card/50">
                            <DetailPanel item={ selectedGroup.item } count={ selectedGroup.count }
                                canSeeId={ canSeeId }
                                onBack={ () => setSelectedKey(null) }
                                onSelect={ () => selectItem(selectedGroup.item) }
                                onPickup={ handlePickup } />
                        </div>
                    ) }
                </div>

                {/* Stats Footer */}
                <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-border/30 bg-muted/10">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                        <span className="font-semibold text-foreground/70">{ stats.total } Möbel</span>
                        <span>·</span>
                        <span>{ stats.floor } Boden</span>
                        <span>·</span>
                        <span>{ stats.wall } Wand</span>
                        <span>·</span>
                        <span>{ stats.totalCount } Stück</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/30 tabular-nums">
                        { filteredGroups.length }/{ stats.total }
                    </span>
                </div>

                {/* Resize Handle */}
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end"
                    onPointerDown={ onResizeStart }>
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30">
                        <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </svg>
                </div>
            </div>
        </DraggableWindow>
    );
};
