import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Search, Package, X, Clock, Gift, Calendar, Users, HelpCircle, Check, Lock, Loader2, Layers } from 'lucide-react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, attemptItemPlacement, GetConfiguration, GetRoomSession, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { InventoryFurniAddedEvent } from '../../events';
import { useUiEvent } from '../../hooks/events';
import { useInventoryFurni } from '../../hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/reui-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SetItem {
    item_base_id: number;
    public_name: string;
    item_name: string;
}

interface RewardItem {
    id: number;
    public_name: string;
    item_name: string;
}

interface FurnitureSet {
    id: number;
    name: string;
    description: string | null;
    catalog_description: string | null;
    difficulty: string;
    show_countdown: boolean;
    expires_at: string | null;
    show_rewards: boolean;
    reward_credits: number;
    reward_pixels: number;
    reward_points: number;
    has_reward_item: boolean;
    has_rewards: boolean;
    release_date: string | null;
    reward_item: RewardItem | null;
    totalItems: number;
    completions: number;
    isCompleted: boolean;
    rewardClaimed: boolean;
    items: SetItem[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: '#4ade80', medium: '#facc15', hard: '#fb923c', expert: '#ef4444',
};
const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Einfach', medium: 'Mittel', hard: 'Schwer', expert: 'Experte',
};

function useOwnedClassNames()
{
    const { groupItems = [] } = useInventoryFurni();
    return useMemo(() =>
    {
        const names = new Set<string>();
        const sessionData = GetSessionDataManager();
        for(const group of groupItems)
        {
            const floorData = sessionData.getFloorItemData(group.type);
            if(floorData) { names.add(floorData.className); continue; }
            const wallData = sessionData.getWallItemData(group.type);
            if(wallData) names.add(wallData.className);
        }
        return names;
    }, [ groupItems ]);
}

function getCmsUrl() { return GetConfiguration<string>('url.prefix', 'http://localhost:3030'); }
function getImageUrl() { return GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/'); }
function getFurniIcon(itemName: string) { return `${ getImageUrl() }${ itemName.split('*')[0] }_icon.png`; }

function isItemOwned(ownedNames: Set<string>, itemName: string)
{
    return ownedNames.has(itemName) || ownedNames.has(itemName.split('*')[0]);
}

function getProgress(set: FurnitureSet, ownedNames: Set<string>)
{
    if(!set.items.length) return { owned: 0, total: 0, percent: 0 };
    let owned = 0;
    for(const item of set.items) { if(isItemOwned(ownedNames, item.item_name)) owned++; }
    return { owned, total: set.items.length, percent: Math.round((owned / set.items.length) * 100) };
}

function formatDate(dateStr: string | null): string
{
    if(!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return ''; }
}

function daysLeft(d: string | null): number | null
{
    if(!d) return null;
    const diff = new Date(d).getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function CurrencyIcon({ type, className }: { type: 'credits' | 'duckets' | 'diamonds'; className?: string })
{
    const url = GetConfiguration<string>('asset.url', 'http://localhost:8080');
    const map = { credits: '/-1.png', duckets: '/0.png', diamonds: '/5.png' };
    return <img src={ `${ url }/wallet${ map[type] }` } alt={ type } className={ className || 'w-4 h-4' } style={{ imageRendering: 'pixelated', objectFit: 'contain' }} draggable={ false } />;
}

function ItemIcon({ itemName, className }: { itemName: string; className?: string })
{
    const [err, setErr] = useState(false);
    if(err) return <div className={ `flex items-center justify-center bg-muted/20 ${ className || 'w-full h-full' }` }><Package className="w-3.5 h-3.5 text-muted-foreground/30" /></div>;
    return <img src={ getFurniIcon(itemName) } alt={ itemName } className={ `object-contain ${ className || 'w-full h-full' }` } style={{ imageRendering: 'pixelated' }} loading="lazy" onError={ () => setErr(true) } />;
}

export const SetsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ sets, setSets ] = useState<FurnitureSet[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ selectedSetId, setSelectedSetId ] = useState<number | null>(null);
    const [ search, setSearch ] = useState('');
    const [ claimDialog, setClaimDialog ] = useState<FurnitureSet | null>(null);
    const ownedNames = useOwnedClassNames();
    const { groupItems } = useInventoryFurni();
    const groupItemsRef = useRef(groupItems);
    groupItemsRef.current = groupItems;
    const pendingPreviewRef = useRef<{ spriteId: number } | null>(null);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                switch(parts[1])
                {
                    case 'toggle': setIsVisible(prev => !prev); return;
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                }
            },
            eventUrlPrefix: 'sets/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const fetchSets = useCallback(async () =>
    {
        if(!isVisible) return;
        setLoading(true);
        try
        {
            const res = await fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, { headers: getAuthHeaders() });
            const data: FurnitureSet[] = await res.json();
            setSets(data);
            if(data.length > 0 && selectedSetId === null) setSelectedSetId(data[0].id);
        }
        catch { setSets([]); }
        finally { setLoading(false); }
    }, [ isVisible ]);

    useEffect(() => { fetchSets(); }, [ fetchSets ]);

    const selectedSet = useMemo(() => sets.find(s => s.id === selectedSetId) || null, [ sets, selectedSetId ]);

    const completedCount = useMemo(() =>
    {
        let count = 0;
        for(const set of sets) { if(getProgress(set, ownedNames).percent === 100) count++; }
        return count;
    }, [ sets, ownedNames ]);

    const filteredSets = useMemo(() =>
    {
        if(!search) return sets;
        const q = search.toLowerCase();
        return sets.filter((s) => s.name.toLowerCase().includes(q));
    }, [ sets, search ]);

    useUiEvent<InventoryFurniAddedEvent>(InventoryFurniAddedEvent.FURNI_ADDED, event =>
    {
        const preview = pendingPreviewRef.current;
        if(!preview || event.spriteId !== preview.spriteId) return;
        pendingPreviewRef.current = null;
        setTimeout(() =>
        {
            const group = groupItemsRef.current.find(g => g.type === event.spriteId);
            if(group) attemptItemPlacement(group);
        }, 150);
    });

    const onClose = useCallback(() => setIsVisible(false), []);

    const handleComplete = useCallback((id: number) =>
    {
        try { const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets complete ${ id }`, 0); } catch {}
    }, []);

    const handleClaim = useCallback((id: number) =>
    {
        try { const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets claim ${ id }`, 0); } catch {}
    }, []);

    const handlePreview = useCallback((item: SetItem) =>
    {
        try
        {
            const session = GetRoomSession();
            if(!session) return;
            const sessionData = GetSessionDataManager();
            const baseName = item.item_name.split('*')[0];
            const floorData = sessionData.getFloorItemDataByName(baseName);
            const wallData = !floorData ? sessionData.getWallItemDataByName(baseName) : null;
            const spriteId = floorData?.id ?? wallData?.id ?? 0;
            if(spriteId === 0) return;
            pendingPreviewRef.current = { spriteId };
            session.sendChatMessage(`:sets preview ${ item.item_base_id }`, 0);
            setIsVisible(false);
        }
        catch {}
    }, []);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="sets" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <TooltipProvider delayDuration={ 200 }>
                <div className="w-[720px] max-h-[80vh] rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col">

                    {/* Title Bar */}
                    <div className="drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-amber-500/70" />
                            <span className="text-[13px] font-semibold">Set-Katalog</span>
                            <span className="text-[10px] text-muted-foreground/40 tabular-nums">{ completedCount }/{ sets.length } abgeschlossen</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="ml-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                                        <HelpCircle className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[260px]">
                                    <p className="text-xs font-semibold mb-1">Was ist der Set-Katalog?</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Sammle alle Möbelstücke eines Sets, um exklusive Belohnungen freizuschalten!</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onClick={ onClose }>
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 min-h-0" style={{ height: '60vh' }}>

                        {/* Left: Set List */}
                        <div className="w-[220px] min-w-[220px] shrink-0 border-r border-border/40 flex flex-col min-h-0">
                            <div className="shrink-0 p-2 border-b border-border/30">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                                    <Input placeholder="Set suchen..." value={ search } onChange={ (e) => setSearch(e.target.value) } className="pl-7 h-6 text-[11px]" />
                                </div>
                            </div>
                            <ScrollArea className="flex-1 min-h-0">
                                { loading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
                                    </div>
                                ) }
                                { !loading && sets.length === 0 && (
                                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Keine Sets vorhanden</div>
                                ) }
                                { !loading && filteredSets.map(set =>
                                {
                                    const progress = getProgress(set, ownedNames);
                                    const isSelected = selectedSetId === set.id;
                                    const remaining = daysLeft(set.expires_at);
                                    const isComplete = progress.percent === 100;

                                    return (
                                        <div key={ set.id } onClick={ () => setSelectedSetId(set.id) }
                                            className={ `px-2.5 py-2 border-b border-border/20 cursor-pointer transition-colors ${ isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/30' }` }>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[11px] font-medium truncate flex-1">{ set.name }</span>
                                                { set.difficulty && DIFFICULTY_LABELS[set.difficulty] && (
                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                                        style={{ background: `${ DIFFICULTY_COLORS[set.difficulty] }20`, color: DIFFICULTY_COLORS[set.difficulty], border: `1px solid ${ DIFFICULTY_COLORS[set.difficulty] }40` }}>
                                                        { DIFFICULTY_LABELS[set.difficulty] }
                                                    </span>
                                                ) }
                                                { isComplete && !set.rewardClaimed && set.has_rewards && <Gift className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" /> }
                                                { isComplete && (set.rewardClaimed || !set.has_rewards) && <Check className="w-3 h-3 text-emerald-500 shrink-0" /> }
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Progress value={ progress.percent } className="h-1 flex-1" />
                                                <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">{ progress.owned }/{ progress.total }</span>
                                            </div>
                                            { remaining !== null && remaining > 0 && remaining < 30 && (
                                                <div className="flex items-center gap-0.5 mt-1">
                                                    <Clock className="w-2.5 h-2.5 text-red-400" />
                                                    <span className="text-[8px] text-red-400 font-medium">Noch { remaining } Tage</span>
                                                </div>
                                            ) }
                                        </div>
                                    );
                                }) }
                            </ScrollArea>
                        </div>

                        {/* Right: Detail */}
                        <div className="flex-1 min-w-0 flex flex-col min-h-0">
                            { !selectedSet && (
                                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                                    <Trophy className="w-10 h-10 opacity-10 mb-2" /><p className="text-xs">Set auswählen</p>
                                </div>
                            ) }
                            { selectedSet && (() => {
                                const prog = getProgress(selectedSet, ownedNames);
                                const isComplete = prog.percent === 100;
                                const hasReward = selectedSet.has_rewards || selectedSet.reward_credits > 0 || selectedSet.reward_pixels > 0 || selectedSet.reward_points > 0 || selectedSet.has_reward_item || selectedSet.reward_item !== null;

                                return (
                                    <ScrollArea className="flex-1 min-h-0">
                                        <div className="p-4 space-y-4">
                                            {/* Header */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold">{ selectedSet.name }</h3>
                                                    { selectedSet.difficulty && DIFFICULTY_LABELS[selectedSet.difficulty] && (
                                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                                            style={{ background: `${ DIFFICULTY_COLORS[selectedSet.difficulty] }20`, color: DIFFICULTY_COLORS[selectedSet.difficulty], border: `1px solid ${ DIFFICULTY_COLORS[selectedSet.difficulty] }40` }}>
                                                            { DIFFICULTY_LABELS[selectedSet.difficulty] }
                                                        </span>
                                                    ) }
                                                </div>
                                                { selectedSet.description && <p className="text-[11px] text-muted-foreground mt-0.5">{ selectedSet.description }</p> }
                                                { selectedSet.catalog_description && <p className="text-[11px] text-muted-foreground/50 mt-0.5 italic">{ selectedSet.catalog_description }</p> }
                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" />{ selectedSet.items.length } Möbel</span>
                                                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{ selectedSet.completions }× abgeschlossen</span>
                                                    { selectedSet.release_date && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{ formatDate(selectedSet.release_date) }</span> }
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <Progress value={ prog.percent } className="h-2 flex-1" />
                                                    <span className={ `text-[11px] font-bold tabular-nums ${ isComplete ? 'text-emerald-500' : 'text-muted-foreground' }` }>{ prog.percent }%</span>
                                                </div>
                                                { selectedSet.show_countdown && selectedSet.expires_at && (() => {
                                                    const days = daysLeft(selectedSet.expires_at);
                                                    if(!days || days <= 0) return null;
                                                    return (
                                                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                                                            <Clock className="w-3 h-3 text-red-500" />
                                                            <span className="text-[10px] font-semibold text-red-500">Noch { days } { days === 1 ? 'Tag' : 'Tage' } verfügbar!</span>
                                                        </div>
                                                    );
                                                })() }
                                            </div>

                                            {/* Rewards */}
                                            { hasReward && selectedSet.show_rewards === false && (
                                                <div className="rounded-xl border border-border/50 overflow-hidden">
                                                    <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                                                        <div className="flex items-center gap-1.5">
                                                            <Gift className="w-3.5 h-3.5 text-amber-500" />
                                                            <span className="text-[11px] font-semibold">Belohnung: <span className="text-muted-foreground">??? (Überraschung)</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) }
                                            { hasReward && selectedSet.show_rewards !== false && (
                                                <div className="rounded-xl border border-border/50 overflow-hidden">
                                                    <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Gift className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="text-[11px] font-semibold">Belohnung für Abschluss</span>
                                                            </div>
                                                            { isComplete && !selectedSet.rewardClaimed && <Badge variant="success" size="xs">Verfügbar!</Badge> }
                                                            { selectedSet.rewardClaimed && <Badge variant="outline" size="xs" className="text-emerald-500 border-emerald-500/30"><Check className="w-2.5 h-2.5 mr-0.5" />Eingelöst</Badge> }
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-2.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            { selectedSet.reward_credits > 0 && (
                                                                <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                                                    <CurrencyIcon type="credits" className="w-4 h-4" />
                                                                    <span className="text-[11px] font-bold text-amber-600">{ selectedSet.reward_credits.toLocaleString('de-DE') }</span>
                                                                    <span className="text-[9px] text-muted-foreground">Credits</span>
                                                                </div>
                                                            ) }
                                                            { selectedSet.reward_pixels > 0 && (
                                                                <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                                                    <CurrencyIcon type="duckets" className="w-4 h-4" />
                                                                    <span className="text-[11px] font-bold text-purple-600">{ selectedSet.reward_pixels.toLocaleString('de-DE') }</span>
                                                                    <span className="text-[9px] text-muted-foreground">Duckets</span>
                                                                </div>
                                                            ) }
                                                            { selectedSet.reward_points > 0 && (
                                                                <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                                                    <CurrencyIcon type="diamonds" className="w-4 h-4" />
                                                                    <span className="text-[11px] font-bold text-teal-600">{ selectedSet.reward_points.toLocaleString('de-DE') }</span>
                                                                    <span className="text-[9px] text-muted-foreground">Diamanten</span>
                                                                </div>
                                                            ) }
                                                        </div>
                                                        { selectedSet.reward_item && (
                                                            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/20 border border-border/40">
                                                                <div className="w-10 h-10 rounded-lg border border-border/40 bg-card flex items-center justify-center">
                                                                    <ItemIcon itemName={ selectedSet.reward_item.item_name } className="w-8 h-8" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[11px] font-semibold">{ selectedSet.reward_item.public_name }</span>
                                                                    <p className="text-[9px] text-muted-foreground">Exklusives Belohnungs-Möbelstück</p>
                                                                </div>
                                                            </div>
                                                        ) }
                                                        <Button
                                                            size="sm"
                                                            className={ `w-full h-7 text-[11px] gap-1.5 ${ isComplete && !selectedSet.rewardClaimed ? 'bg-amber-600 hover:bg-amber-700 text-white' : '' }` }
                                                            variant={ isComplete && !selectedSet.rewardClaimed ? 'default' : 'outline' }
                                                            disabled={ !isComplete || selectedSet.rewardClaimed }
                                                            onClick={ () => isComplete && !selectedSet.rewardClaimed && setClaimDialog(selectedSet) }
                                                        >
                                                            { selectedSet.rewardClaimed ? <><Check className="w-3 h-3" />Bereits eingelöst</> :
                                                              isComplete ? <><Gift className="w-3 h-3" />Belohnung einlösen</> :
                                                              <><Lock className="w-3 h-3" />Sammle alle { selectedSet.items.length } Möbel</> }
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) }

                                            {/* Action Buttons */}
                                            { isComplete && !selectedSet.isCompleted && (
                                                <Button className="w-full h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={ () => handleComplete(selectedSet.id) }>
                                                    Set einfügen
                                                </Button>
                                            ) }
                                            { selectedSet.isCompleted && !selectedSet.rewardClaimed && hasReward && (
                                                <Button className="w-full h-8 text-[11px] bg-amber-600 hover:bg-amber-700 text-white" onClick={ () => handleClaim(selectedSet.id) }>
                                                    Belohnung abholen
                                                </Button>
                                            ) }
                                            { selectedSet.isCompleted && selectedSet.rewardClaimed && (
                                                <div className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold text-center border border-emerald-500/20">
                                                    Set eingefügt &amp; Belohnung abgeholt
                                                </div>
                                            ) }
                                            { selectedSet.isCompleted && !hasReward && (
                                                <div className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold text-center border border-emerald-500/20">
                                                    Set eingefügt
                                                </div>
                                            ) }

                                            <Separator />

                                            {/* Items */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
                                                    <span className="text-[11px] font-semibold">Benötigte Möbel ({ prog.owned }/{ prog.total })</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    { selectedSet.items.map((item) =>
                                                    {
                                                        const owned = isItemOwned(ownedNames, item.item_name);
                                                        return (
                                                            <Tooltip key={ item.item_base_id }>
                                                                <TooltipTrigger asChild>
                                                                    <div className={ `relative w-[52px] h-[52px] border rounded-md flex items-center justify-center transition-colors cursor-pointer ${ owned ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/40 bg-muted/10 opacity-50' }` }
                                                                        onClick={ () => handlePreview(item) }>
                                                                        <ItemIcon itemName={ item.item_name } className="w-9 h-9" />
                                                                        { owned && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-emerald-500" /> }
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" sideOffset={ 4 }>
                                                                    <p className="font-semibold text-xs">{ item.public_name }</p>
                                                                    <p className="text-[9px] opacity-40 font-mono">{ item.item_name }</p>
                                                                    <p className={ `text-[10px] font-medium ${ owned ? 'text-emerald-500' : 'text-red-400' }` }>
                                                                        { owned ? '✓ Im Besitz' : '✗ Fehlt noch' }
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    }) }
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                );
                            })() }
                        </div>
                    </div>
                </div>

                {/* Claim Dialog */}
                <AlertDialog open={ !!claimDialog } onOpenChange={ (o) => !o && setClaimDialog(null) }>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500" />Belohnung einlösen</AlertDialogTitle>
                            <AlertDialogDescription>
                                Du hast das Set <span className="font-semibold text-foreground">{ claimDialog?.name }</span> komplett abgeschlossen! Möchtest du die Belohnung jetzt einlösen?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        { claimDialog && (
                            <div className="flex items-center gap-2 flex-wrap py-1">
                                { claimDialog.reward_credits > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="credits" className="w-3.5 h-3.5" />{ claimDialog.reward_credits.toLocaleString('de-DE') } Credits</Badge> }
                                { claimDialog.reward_pixels > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="duckets" className="w-3.5 h-3.5" />{ claimDialog.reward_pixels.toLocaleString('de-DE') } Duckets</Badge> }
                                { claimDialog.reward_points > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="diamonds" className="w-3.5 h-3.5" />{ claimDialog.reward_points.toLocaleString('de-DE') } Diamanten</Badge> }
                                { claimDialog.reward_item && <Badge variant="outline" className="gap-1"><Package className="w-3 h-3 text-purple-500" />{ claimDialog.reward_item.public_name }</Badge> }
                            </div>
                        ) }
                        <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={ () => { if(claimDialog) { handleClaim(claimDialog.id); setClaimDialog(null); } } }>Einlösen</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TooltipProvider>
        </DraggableWindow>
    );
};
