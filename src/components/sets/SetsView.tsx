import { ComponentProps, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, attemptItemPlacement, GetConfiguration, GetRoomSession, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { InventoryFurniAddedEvent } from '../../events';
import { useUiEvent } from '../../hooks/events';
import { useInventoryFurni } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { Calendar, Check, Clock, Gift, HelpCircle, Layers, Loader2, Lock, Package, Search, Trophy, Users, X } from 'lucide-react';

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

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    expert: 'Experte',
};

function difficultyBadgeColor(difficulty?: string): ComponentProps<typeof AlignBadge.Root>['color']
{
    if(difficulty === 'easy') return 'green';
    if(difficulty === 'medium') return 'yellow';
    if(difficulty === 'hard') return 'orange';
    if(difficulty === 'expert') return 'red';
    return 'gray';
}

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
    return <img src={ `${ url }/wallet${ map[type] }` } alt={ type } className={ className || 'w-4 h-4' } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
}

function ItemIcon({ itemName, className }: { itemName: string; className?: string })
{
    const [err, setErr] = useState(false);
    if(err) return <div className={ `flex items-center justify-center bg-bg-weak-50 text-text-soft-400 ${ className || 'w-full h-full' }` }><Package className="size-4" /></div>;
    return <img src={ getFurniIcon(itemName) } alt={ itemName } className={ `object-contain ${ className || 'w-full h-full' }` } style={ { imageRendering: 'pixelated' } } loading="lazy" onError={ () => setErr(true) } />;
}

export const SetsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ sets, setSets ] = useState<FurnitureSet[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState('');
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
        setError('');
        try
        {
            const res = await fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, { headers: getAuthHeaders() });
            if(!res.ok) throw new Error('request failed');
            const data: FurnitureSet[] = await res.json();
            setSets(data);
            setSelectedSetId(prev => data.find(set => set.id === prev)?.id ?? data[0]?.id ?? null);
        }
        catch
        {
            setSets([]);
            setSelectedSetId(null);
            setError('Set-Katalog konnte nicht geladen werden');
        }
        finally { setLoading(false); }
    }, [ isVisible ]);

    useEffect(() => { fetchSets(); }, [ fetchSets ]);

    const selectedSet = useMemo(() => sets.find(s => s.id === selectedSetId) || null, [ sets, selectedSetId ]);
    const completedCount = useMemo(() => sets.filter(set => getProgress(set, ownedNames).percent === 100).length, [ sets, ownedNames ]);
    const filteredSets = useMemo(() =>
    {
        const q = search.trim().toLowerCase();
        if(!q) return sets;
        return sets.filter((s) => s.name.toLowerCase().includes(q) || (s.catalog_description ?? '').toLowerCase().includes(q));
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
            <AlignTooltip.Provider delayDuration={ 180 }>
                <AlignSurface.Panel className="w-[780px] max-w-[92vw] overflow-hidden flex flex-col" style={ { maxHeight: '82vh' } }>
                    <AlignSurface.Header
                        title={
                            <div className="drag-handler flex cursor-grab active:cursor-grabbing select-none items-center gap-2">
                                <Trophy className="size-4 text-warning-base" />
                                <span>Set-Katalog</span>
                                <AlignBadge.Root color="green" variant="lighter" size="small" square>{ completedCount }/{ sets.length } komplett</AlignBadge.Root>
                            </div>
                        }
                        description="Sammlungen, Fortschritt, Rewards und Preview"
                        onClose={ onClose }
                        className="drag-handler cursor-grab active:cursor-grabbing"
                    />

                    { error && (
                        <div className="mx-4 mt-3 rounded-xl border border-error-base/30 bg-error-lighter px-3 py-2 text-paragraph-xs text-error-base">
                            { error }
                        </div>
                    ) }

                    <div className="grid min-h-0 flex-1 grid-cols-[250px_1fr]" style={ { height: '62vh' } }>
                        <div className="flex min-h-0 flex-col border-r border-stroke-soft-200 bg-bg-weak-50">
                            <div className="shrink-0 p-3">
                                <AlignInput.Root size="xsmall">
                                    <AlignInput.Wrapper className="h-8">
                                        <AlignInput.Icon as={ Search } className="size-4" />
                                        <AlignInput.Input placeholder="Set suchen..." value={ search } onChange={ (e) => setSearch(e.target.value) } className="h-8 text-paragraph-xs" />
                                        { search && (
                                            <button onClick={ () => setSearch('') } className="text-text-soft-400 hover:text-text-strong-950">
                                                <X className="size-3" />
                                            </button>
                                        ) }
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" style={ { scrollbarWidth: 'thin' } }>
                                { loading && (
                                    <div className="flex items-center justify-center py-12 text-text-soft-400">
                                        <Loader2 className="size-5 animate-spin" />
                                    </div>
                                ) }
                                { !loading && filteredSets.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-text-soft-400">
                                        <Package className="mb-2 size-8" />
                                        <p className="text-paragraph-xs">Keine Sets vorhanden</p>
                                    </div>
                                ) }
                                { !loading && filteredSets.map(set =>
                                {
                                    const progress = getProgress(set, ownedNames);
                                    const isSelected = selectedSetId === set.id;
                                    const remaining = daysLeft(set.expires_at);
                                    const isComplete = progress.percent === 100;

                                    return (
                                        <button
                                            key={ set.id }
                                            onClick={ () => setSelectedSetId(set.id) }
                                            className={ `mb-1.5 w-full rounded-xl border px-3 py-2 text-left transition duration-200 ${
                                                isSelected ? 'border-primary-base bg-bg-white-0 shadow-regular-xs' : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50'
                                            }` }
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-label-xs text-text-strong-950">{ set.name }</p>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <AlignBadge.Root color={ difficultyBadgeColor(set.difficulty) } variant="lighter" size="small" square>
                                                            { DIFFICULTY_LABELS[set.difficulty] ?? set.difficulty }
                                                        </AlignBadge.Root>
                                                        { isComplete && !set.rewardClaimed && set.has_rewards && <Gift className="size-3 text-warning-base" /> }
                                                        { isComplete && (set.rewardClaimed || !set.has_rewards) && <Check className="size-3 text-success-base" /> }
                                                    </div>
                                                </div>
                                                <span className="text-paragraph-xs tabular-nums text-text-soft-400">{ progress.owned }/{ progress.total }</span>
                                            </div>
                                            <AlignProgress.Root value={ progress.percent } color={ isComplete ? 'green' : remaining !== null && remaining < 14 ? 'orange' : 'blue' } className="mt-2" />
                                            { remaining !== null && remaining > 0 && remaining < 30 && (
                                                <div className="mt-1 flex items-center gap-1 text-paragraph-xs text-error-base">
                                                    <Clock className="size-3" />
                                                    Noch { remaining } Tage
                                                </div>
                                            ) }
                                        </button>
                                    );
                                }) }
                            </div>
                        </div>

                        <div className="min-w-0 overflow-y-auto p-4" style={ { scrollbarWidth: 'thin' } }>
                            { !selectedSet && (
                                <div className="flex h-full flex-col items-center justify-center text-text-soft-400">
                                    <Trophy className="mb-2 size-10" />
                                    <p className="text-paragraph-xs">Set auswählen</p>
                                </div>
                            ) }

                            { selectedSet && (() =>
                            {
                                const prog = getProgress(selectedSet, ownedNames);
                                const isComplete = prog.percent === 100;
                                const hasReward = selectedSet.has_rewards || selectedSet.reward_credits > 0 || selectedSet.reward_pixels > 0 || selectedSet.reward_points > 0 || selectedSet.has_reward_item || selectedSet.reward_item !== null;
                                const remaining = daysLeft(selectedSet.expires_at);

                                return (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="truncate text-label-lg text-text-strong-950">{ selectedSet.name }</h3>
                                                        <AlignBadge.Root color={ difficultyBadgeColor(selectedSet.difficulty) } variant="lighter" size="small" square>
                                                            { DIFFICULTY_LABELS[selectedSet.difficulty] ?? selectedSet.difficulty }
                                                        </AlignBadge.Root>
                                                        <AlignTooltip.Root>
                                                            <AlignTooltip.Trigger asChild>
                                                                <HelpCircle className="size-4 cursor-help text-text-soft-400" />
                                                            </AlignTooltip.Trigger>
                                                            <AlignTooltip.Content side="bottom" sideOffset={ 8 }>
                                                                <p className="max-w-[260px] text-paragraph-xs">Sammle alle Möbel eines Sets, füge es per Command ein und hole dir die sichtbaren Rewards.</p>
                                                            </AlignTooltip.Content>
                                                        </AlignTooltip.Root>
                                                    </div>
                                                    { selectedSet.description && <p className="mt-1 text-paragraph-sm text-text-sub-600">{ selectedSet.description }</p> }
                                                    { selectedSet.catalog_description && <p className="mt-1 text-paragraph-xs text-text-soft-400">{ selectedSet.catalog_description }</p> }
                                                </div>
                                                <div className="text-right">
                                                    <p className={ `text-title-h6 tabular-nums ${ isComplete ? 'text-success-base' : 'text-text-strong-950' }` }>{ prog.percent }%</p>
                                                    <p className="text-paragraph-xs text-text-soft-400">Fortschritt</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-3 text-paragraph-xs text-text-sub-600">
                                                <span className="inline-flex items-center gap-1"><Layers className="size-3.5" />{ selectedSet.items.length } Möbel</span>
                                                <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{ selectedSet.completions } abgeschlossen</span>
                                                { selectedSet.release_date && <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{ formatDate(selectedSet.release_date) }</span> }
                                            </div>
                                            <AlignProgress.Root value={ prog.percent } color={ isComplete ? 'green' : 'blue' } className="mt-3 h-2" />

                                            { selectedSet.show_countdown && remaining !== null && remaining > 0 && (
                                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning-base/30 bg-warning-lighter px-3 py-2 text-paragraph-xs text-warning-dark">
                                                    <Clock className="size-4" />
                                                    Noch { remaining } { remaining === 1 ? 'Tag' : 'Tage' } verfügbar
                                                </div>
                                            ) }
                                        </div>

                                        { hasReward && (
                                            <div className="rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="size-4 text-warning-base" />
                                                        <span className="text-label-sm text-text-strong-950">Belohnung</span>
                                                    </div>
                                                    { isComplete && !selectedSet.rewardClaimed && <AlignBadge.Root color="yellow" variant="lighter" size="small" square>Verfügbar</AlignBadge.Root> }
                                                    { selectedSet.rewardClaimed && <AlignBadge.Root color="green" variant="lighter" size="small" square><Check className="mr-1 size-3" />Eingelöst</AlignBadge.Root> }
                                                </div>

                                                { selectedSet.show_rewards === false ? (
                                                    <p className="mt-3 text-paragraph-xs text-text-sub-600">Überraschungsbelohnung nach Abschluss.</p>
                                                ) : (
                                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                                        { selectedSet.reward_credits > 0 && (
                                                            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                                                                <div className="flex items-center gap-2 text-label-sm text-text-strong-950"><CurrencyIcon type="credits" className="size-4" />{ selectedSet.reward_credits.toLocaleString('de-DE') }</div>
                                                                <p className="text-paragraph-xs text-text-soft-400">Credits</p>
                                                            </div>
                                                        ) }
                                                        { selectedSet.reward_pixels > 0 && (
                                                            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                                                                <div className="flex items-center gap-2 text-label-sm text-text-strong-950"><CurrencyIcon type="duckets" className="size-4" />{ selectedSet.reward_pixels.toLocaleString('de-DE') }</div>
                                                                <p className="text-paragraph-xs text-text-soft-400">Duckets</p>
                                                            </div>
                                                        ) }
                                                        { selectedSet.reward_points > 0 && (
                                                            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                                                                <div className="flex items-center gap-2 text-label-sm text-text-strong-950"><CurrencyIcon type="diamonds" className="size-4" />{ selectedSet.reward_points.toLocaleString('de-DE') }</div>
                                                                <p className="text-paragraph-xs text-text-soft-400">Diamanten</p>
                                                            </div>
                                                        ) }
                                                        { selectedSet.reward_item && (
                                                            <div className="col-span-2 flex items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                                                                <div className="flex size-11 items-center justify-center rounded-xl border border-stroke-soft-200 bg-bg-white-0">
                                                                    <ItemIcon itemName={ selectedSet.reward_item.item_name } className="size-8" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-label-sm text-text-strong-950">{ selectedSet.reward_item.public_name }</p>
                                                                    <p className="text-paragraph-xs text-text-soft-400">Exklusives Reward-Möbel</p>
                                                                </div>
                                                            </div>
                                                        ) }
                                                    </div>
                                                ) }

                                                <div className="mt-3">
                                                    <AlignButton.Root
                                                        variant={ isComplete && !selectedSet.rewardClaimed ? 'primary' : 'neutral' }
                                                        mode={ isComplete && !selectedSet.rewardClaimed ? 'filled' : 'stroke' }
                                                        size="xsmall"
                                                        className="w-full"
                                                        disabled={ !isComplete || selectedSet.rewardClaimed }
                                                        onClick={ () => isComplete && !selectedSet.rewardClaimed && setClaimDialog(selectedSet) }
                                                    >
                                                        { selectedSet.rewardClaimed ? <><Check className="size-4" />Bereits eingelöst</> :
                                                          isComplete ? <><Gift className="size-4" />Belohnung einlösen</> :
                                                          <><Lock className="size-4" />Alle { selectedSet.items.length } Möbel sammeln</> }
                                                    </AlignButton.Root>
                                                </div>
                                            </div>
                                        ) }

                                        { isComplete && !selectedSet.isCompleted && (
                                            <AlignButton.Root variant="primary" mode="filled" size="small" className="w-full" onClick={ () => handleComplete(selectedSet.id) }>
                                                Set einfügen
                                            </AlignButton.Root>
                                        ) }
                                        { selectedSet.isCompleted && !selectedSet.rewardClaimed && hasReward && (
                                            <AlignButton.Root variant="primary" mode="filled" size="small" className="w-full" onClick={ () => setClaimDialog(selectedSet) }>
                                                Belohnung abholen
                                            </AlignButton.Root>
                                        ) }
                                        { selectedSet.isCompleted && selectedSet.rewardClaimed && (
                                            <div className="rounded-xl border border-success-base/30 bg-success-lighter px-3 py-2 text-center text-label-xs text-success-base">
                                                Set eingefügt und Belohnung abgeholt
                                            </div>
                                        ) }

                                        <AlignDivider.Root />

                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Package className="size-4 text-text-sub-600" />
                                                    <span className="text-label-sm text-text-strong-950">Benötigte Möbel</span>
                                                </div>
                                                <AlignBadge.Root color="gray" variant="lighter" size="small" square>{ prog.owned }/{ prog.total }</AlignBadge.Root>
                                            </div>

                                            <div className="grid grid-cols-6 gap-2">
                                                { selectedSet.items.map((item) =>
                                                {
                                                    const owned = isItemOwned(ownedNames, item.item_name);
                                                    return (
                                                        <AlignTooltip.Root key={ item.item_base_id }>
                                                            <AlignTooltip.Trigger asChild>
                                                                <button
                                                                    className={ `relative flex aspect-square items-center justify-center rounded-xl border transition duration-200 ${
                                                                        owned ? 'border-success-base/40 bg-success-lighter' : 'border-stroke-soft-200 bg-bg-weak-50 opacity-70 hover:opacity-100'
                                                                    }` }
                                                                    onClick={ () => handlePreview(item) }
                                                                >
                                                                    <ItemIcon itemName={ item.item_name } className="size-10" />
                                                                    { owned && <Check className="absolute right-1 top-1 size-3.5 text-success-base" /> }
                                                                </button>
                                                            </AlignTooltip.Trigger>
                                                            <AlignTooltip.Content side="top" sideOffset={ 6 }>
                                                                <div className="max-w-[180px]">
                                                                    <p className="text-label-xs">{ item.public_name }</p>
                                                                    <p className="truncate text-paragraph-xs text-text-soft-400">{ item.item_name }</p>
                                                                    <p className={ `mt-1 text-paragraph-xs ${ owned ? 'text-success-base' : 'text-error-base' }` }>{ owned ? 'Im Besitz' : 'Fehlt noch' }</p>
                                                                </div>
                                                            </AlignTooltip.Content>
                                                        </AlignTooltip.Root>
                                                    );
                                                }) }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() }
                        </div>
                    </div>
                </AlignSurface.Panel>

                { claimDialog && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay p-4 backdrop-blur-[10px]">
                        <AlignSurface.Panel className="w-[360px] overflow-hidden">
                            <AlignSurface.Header
                                title={<span className="flex items-center gap-2"><Gift className="size-4 text-warning-base" />Belohnung einlösen</span>}
                                description={ `Set: ${ claimDialog.name }` }
                                onClose={ () => setClaimDialog(null) }
                            />
                            <div className="space-y-3 p-4">
                                <p className="text-paragraph-sm text-text-sub-600">Du hast dieses Set komplett. Die Belohnung wird über den bestehenden Set-Command abgeholt.</p>
                                <div className="flex flex-wrap gap-1.5">
                                    { claimDialog.reward_credits > 0 && <AlignBadge.Root color="yellow" variant="lighter" size="medium" square><CurrencyIcon type="credits" className="mr-1 size-3.5" />{ claimDialog.reward_credits.toLocaleString('de-DE') }</AlignBadge.Root> }
                                    { claimDialog.reward_pixels > 0 && <AlignBadge.Root color="purple" variant="lighter" size="medium" square><CurrencyIcon type="duckets" className="mr-1 size-3.5" />{ claimDialog.reward_pixels.toLocaleString('de-DE') }</AlignBadge.Root> }
                                    { claimDialog.reward_points > 0 && <AlignBadge.Root color="teal" variant="lighter" size="medium" square><CurrencyIcon type="diamonds" className="mr-1 size-3.5" />{ claimDialog.reward_points.toLocaleString('de-DE') }</AlignBadge.Root> }
                                    { claimDialog.reward_item && <AlignBadge.Root color="blue" variant="lighter" size="medium" square><Package className="mr-1 size-3.5" />{ claimDialog.reward_item.public_name }</AlignBadge.Root> }
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ () => setClaimDialog(null) }>Abbrechen</AlignButton.Root>
                                    <AlignButton.Root variant="primary" mode="filled" size="small" onClick={ () => { handleClaim(claimDialog.id); setClaimDialog(null); } }>Einlösen</AlignButton.Root>
                                </div>
                            </div>
                        </AlignSurface.Panel>
                    </div>
                ) }
            </AlignTooltip.Provider>
        </DraggableWindow>
    );
};
