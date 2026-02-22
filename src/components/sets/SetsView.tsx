import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Trophy, Loader2 } from 'lucide-react';
import { ILinkEventTracker, RoomEngineObjectPlacedEvent, RoomObjectCategory, RoomObjectPlacementSource } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { useRoomEngineEvent } from '../../hooks/events';
import { useInventoryFurni } from '../../hooks';

interface SetItem {
    item_base_id: number;
    public_name: string;
    item_name: string;
    sprite_id: number;
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
    easy: '#4ade80',
    medium: '#facc15',
    hard: '#fb923c',
    expert: '#ef4444',
};

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    expert: 'Experte',
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
function getUserId() { return String(GetSessionDataManager().userId); }
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

export const SetsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ sets, setSets ] = useState<FurnitureSet[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ selectedSetId, setSelectedSetId ] = useState<number | null>(null);
    const ownedNames = useOwnedClassNames();
    const pendingPreviewRef = useRef<{ itemBaseId: number } | null>(null);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
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
            const res = await fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, {
                headers: { 'X-Habbo-User-Id': getUserId() },
            });
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

    useRoomEngineEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectPlacedEvent.PLACED, event =>
    {
        const preview = pendingPreviewRef.current;
        if(!preview) return;
        if(!event.placedInRoom) { pendingPreviewRef.current = null; return; }

        pendingPreviewRef.current = null;

        try
        {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(`:sets preview ${ preview.itemBaseId } ${ event.x } ${ event.y } ${ event.direction }`, 0);
        }
        catch {}
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
            const engine = GetRoomEngine();
            if(!engine) return;

            pendingPreviewRef.current = { itemBaseId: item.item_base_id };

            engine.processRoomObjectPlacement(
                RoomObjectPlacementSource.CATALOG,
                -(item.item_base_id),
                RoomObjectCategory.FLOOR,
                item.sprite_id,
                ''
            );

            setIsVisible(false);
        }
        catch {}
    }, []);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="sets" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[720px] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(80vh-4px)]">

                    {/* Header */}
                    <div className="drag-handler flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0 cursor-move">
                        <div className="flex items-center gap-2.5">
                            <Trophy className="size-4 text-yellow-400/80" />
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Sets</span>
                            <span className="text-xs text-white/30">{ completedCount }/{ sets.length } abgeschlossen</span>
                        </div>
                        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={ onClose }>
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 min-h-0" style={{ height: '60vh' }}>

                        {/* Left: Set list */}
                        <div className="w-[240px] min-w-[240px] border-r border-white/[0.06] overflow-y-auto">
                            { loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="size-5 animate-spin text-white/30" />
                                </div>
                            )}
                            { !loading && sets.length === 0 && (
                                <div className="flex items-center justify-center py-12 text-white/30 text-sm">Keine Sets vorhanden</div>
                            )}
                            { !loading && sets.map(set =>
                            {
                                const progress = getProgress(set, ownedNames);
                                const isSelected = selectedSetId === set.id;

                                return (
                                    <div
                                        key={ set.id }
                                        className={ `px-3 py-2.5 cursor-pointer border-b border-white/[0.04] transition-colors ${ isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]' }` }
                                        onClick={ () => setSelectedSetId(set.id) }
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-white/90 truncate flex-1">{ set.name }</span>
                                            { set.difficulty && DIFFICULTY_LABELS[set.difficulty] && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        background: `${ DIFFICULTY_COLORS[set.difficulty] }20`,
                                                        color: DIFFICULTY_COLORS[set.difficulty],
                                                        border: `1px solid ${ DIFFICULTY_COLORS[set.difficulty] }40`,
                                                    }}>
                                                    { DIFFICULTY_LABELS[set.difficulty] }
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${ progress.percent }%`,
                                                        background: progress.percent === 100 ? '#22c55e' : '#3b82f6',
                                                    }} />
                                            </div>
                                            <span className="text-[10px] text-white/40 shrink-0">{ progress.owned }/{ progress.total }</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right: Detail */}
                        <div className="flex-1 min-w-0 overflow-y-auto">
                            { !selectedSet && (
                                <div className="flex items-center justify-center h-full text-white/30 text-sm">Wähle ein Set aus</div>
                            )}
                            { selectedSet && <SetDetailPanel set={ selectedSet } ownedNames={ ownedNames } onComplete={ handleComplete } onClaim={ handleClaim } onPreview={ handlePreview } /> }
                        </div>
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
};

interface SetDetailPanelProps {
    set: FurnitureSet;
    ownedNames: Set<string>;
    onComplete: (id: number) => void;
    onClaim: (id: number) => void;
    onPreview: (item: SetItem) => void;
}

const SetDetailPanel: FC<SetDetailPanelProps> = ({ set, ownedNames, onComplete, onClaim, onPreview }) =>
{
    const progress = getProgress(set, ownedNames);
    const complete = progress.percent === 100;
    const hasRewards = set.has_rewards || set.reward_credits > 0 || set.reward_pixels > 0 || set.reward_points > 0 || set.has_reward_item || set.reward_item !== null;

    return (
        <div className="flex flex-col gap-3 p-4">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90">{ set.name }</span>
                    { set.difficulty && DIFFICULTY_LABELS[set.difficulty] && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                                background: `${ DIFFICULTY_COLORS[set.difficulty] }20`,
                                color: DIFFICULTY_COLORS[set.difficulty],
                                border: `1px solid ${ DIFFICULTY_COLORS[set.difficulty] }40`,
                            }}>
                            { DIFFICULTY_LABELS[set.difficulty] }
                        </span>
                    )}
                </div>
                { set.description && <div className="text-xs text-white/50 mt-1">{ set.description }</div> }
                { set.catalog_description && <div className="text-[11px] text-white/30 mt-1 italic">{ set.catalog_description }</div> }

                { set.show_countdown && set.expires_at && (() => {
                    const diff = new Date(set.expires_at).getTime() - Date.now();
                    if(diff <= 0) return null;
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return <div className="mt-1 text-[11px] text-red-400 font-semibold">Noch { days } { days === 1 ? 'Tag' : 'Tage' } verfügbar!</div>;
                })() }

                <div className="flex gap-3 mt-2 text-[11px] text-white/40 items-center">
                    <span className={ complete ? 'text-green-400 font-semibold' : '' }>{ progress.owned }/{ progress.total } Möbel</span>
                    <span className="text-white/20">·</span>
                    <span>{ set.completions }x eingefügt</span>
                    { set.release_date && (
                        <>
                            <span className="text-white/20">·</span>
                            <span>{ formatDate(set.release_date) }</span>
                        </>
                    )}
                </div>

                <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${ progress.percent }%`, background: complete ? '#22c55e' : '#3b82f6' }} />
                </div>
            </div>

            {/* Rewards */}
            { hasRewards && set.show_rewards === false && (
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
                    <div className="text-[11px] font-semibold text-orange-400">Belohnung: <span className="text-white/30">??? (Überraschung)</span></div>
                </div>
            )}
            { hasRewards && set.show_rewards !== false && (
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
                    <div className="text-[11px] font-semibold text-orange-400 mb-1">Belohnung</div>
                    <div className="flex gap-3 text-[11px] flex-wrap items-center">
                        { set.reward_credits > 0 && <span className="text-yellow-400">+{ set.reward_credits } Credits</span> }
                        { set.reward_pixels > 0 && <span className="text-blue-400">+{ set.reward_pixels } Pixels</span> }
                        { set.reward_points > 0 && <span className="text-green-400">+{ set.reward_points } Punkte</span> }
                        { set.reward_item && (
                            <span className="inline-flex items-center gap-1">
                                <img src={ getFurniIcon(set.reward_item.item_name) } alt={ set.reward_item.public_name }
                                    className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }}
                                    onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } } />
                                <span className="text-orange-400">{ set.reward_item.public_name }</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            { complete && !set.isCompleted && (
                <button className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
                    onClick={ () => onComplete(set.id) }>
                    Set einfügen
                </button>
            )}
            { set.isCompleted && !set.rewardClaimed && hasRewards && (
                <button className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                    onClick={ () => onClaim(set.id) }>
                    Belohnung abholen
                </button>
            )}
            { set.isCompleted && set.rewardClaimed && (
                <div className="w-full py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold text-center border border-green-500/20">
                    Set eingefügt &amp; Belohnung abgeholt
                </div>
            )}
            { set.isCompleted && !hasRewards && (
                <div className="w-full py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold text-center border border-green-500/20">
                    Set eingefügt
                </div>
            )}

            {/* Item list */}
            <div className="flex flex-col gap-1">
                { set.items.map((item, i) =>
                {
                    const owned = isItemOwned(ownedNames, item.item_name);

                    return (
                        <div key={ i } className={ `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 ${ owned ? 'bg-green-900/20' : 'bg-white/[0.03]' }` }>
                            <div className="relative shrink-0">
                                <img src={ getFurniIcon(item.item_name) } alt={ item.public_name }
                                    className="w-8 h-8 object-contain"
                                    style={{ opacity: owned ? 1 : 0.35, filter: owned ? 'none' : 'grayscale(100%)', imageRendering: 'pixelated' }}
                                    onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } } />
                                { owned && (
                                    <div className="absolute -right-1 -top-1 rounded-full bg-green-500 p-0.5 leading-none">
                                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={ 3 } strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className={ `text-[11px] flex-1 truncate ${ owned ? 'text-white/80' : 'text-white/35' }` }>
                                { item.public_name }
                            </span>
                            <button
                                onClick={ (e) => { e.stopPropagation(); onPreview(item); } }
                                title="Im Raum platzieren (Vorschau)"
                                className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] border border-white/[0.1] text-white/40 hover:bg-white/[0.14] hover:text-white/80 transition-colors cursor-pointer"
                            >📦</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
