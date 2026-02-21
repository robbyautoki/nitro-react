import { FC, useEffect, useMemo, useState } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../../../../api';
import { useInventoryFurni } from '../../../../../hooks';

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

const WHITE = '#ffffff';
const WHITE60 = 'rgba(255,255,255,0.6)';
const WHITE40 = 'rgba(255,255,255,0.4)';
const WHITE30 = 'rgba(255,255,255,0.3)';
const WHITE70 = 'rgba(255,255,255,0.7)';
const WHITE90 = 'rgba(255,255,255,0.9)';
const WHITE10 = 'rgba(255,255,255,0.1)';
const BG_CARD = 'rgba(0,0,0,0.2)';
const GREEN = '#22c55e';
const GREEN_BG = 'rgba(20,83,45,0.3)';
const BLUE = '#3b82f6';
const YELLOW = '#facc15';
const BLUE_LIGHT = '#60a5fa';
const GREEN_LIGHT = '#4ade80';
const ORANGE = '#fb923c';

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
    }, [groupItems]);
}

function getCmsUrl() { return GetConfiguration<string>('url.prefix', 'http://localhost:3030'); }
function getUserId() { return String(GetSessionDataManager().userId); }
function getImageUrl() { return GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/'); }

function getFurniIcon(itemName: string)
{
    return `${ getImageUrl() }${ itemName.split('*')[0] }_icon.png`;
}

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
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
}

// ============================================================
// STARTSEITE (pageId 9998)
// ============================================================
export const CatalogLayoutSetsStartView: FC<CatalogLayoutProps> = () =>
{
    const [stats, setStats] = useState<{ totalSets: number; totalCompletions: number } | null>(null);
    const ownedNames = useOwnedClassNames();
    const [sets, setSets] = useState<FurnitureSet[]>([]);

    useEffect(() =>
    {
        fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, {
            headers: { 'X-Habbo-User-Id': getUserId() },
        })
            .then(res => res.json())
            .then((data: FurnitureSet[]) =>
            {
                setSets(data);
                const totalCompletions = data.reduce((sum, s) => sum + s.completions, 0);
                setStats({ totalSets: data.length, totalCompletions });
            })
            .catch(() => {});
    }, []);

    const completedCount = useMemo(() =>
    {
        let count = 0;
        for(const set of sets) { if(getProgress(set, ownedNames).percent === 100) count++; }
        return count;
    }, [sets, ownedNames]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, padding: 8, color: WHITE, overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>🏆 SET-Katalog</div>

            <div style={{ background: BG_CARD, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Sammle vollständige Möbel-Sets!</div>
                <div style={{ fontSize: 11, color: WHITE70, lineHeight: '1.5' }}>
                    Finde alle Möbelstücke eines Sets und füge es dauerhaft ein, um Belohnungen zu erhalten.
                    Eingefügte Sets können nicht mehr aufgelöst werden – die Möbel sind dann permanent gesperrt.
                </div>
            </div>

            <div style={{ background: BG_CARD, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>So funktioniert's</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, color: WHITE70 }}>
                        <span style={{ color: BLUE_LIGHT, fontWeight: 600 }}>1.</span> Sammle alle Möbel eines Sets in dein Inventar
                    </div>
                    <div style={{ fontSize: 11, color: WHITE70 }}>
                        <span style={{ color: BLUE_LIGHT, fontWeight: 600 }}>2.</span> Öffne das Set hier im Katalog – grüne Haken zeigen was du hast
                    </div>
                    <div style={{ fontSize: 11, color: WHITE70 }}>
                        <span style={{ color: BLUE_LIGHT, fontWeight: 600 }}>3.</span> Bei 100% erscheint der Button zum Einfügen
                    </div>
                    <div style={{ fontSize: 11, color: WHITE70 }}>
                        <span style={{ color: BLUE_LIGHT, fontWeight: 600 }}>4.</span> Eingefügte Sets bringen Credits, Pixels &amp; Punkte!
                    </div>
                </div>
            </div>

            { stats && (
                <div style={{ background: BG_CARD, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Deine Statistik</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: GREEN_LIGHT }}>{ completedCount }</div>
                            <div style={{ fontSize: 10, color: WHITE40 }}>Vollständig</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: BLUE_LIGHT }}>{ stats.totalSets }</div>
                            <div style={{ fontSize: 10, color: WHITE40 }}>Sets gesamt</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: YELLOW }}>{ stats.totalCompletions }</div>
                            <div style={{ fontSize: 10, color: WHITE40 }}>Eingefügt (alle)</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ fontSize: 11, color: WHITE40, textAlign: 'center', marginTop: 4 }}>
                ← Wähle ein Set links aus um Details zu sehen
            </div>
        </div>
    );
}

// ============================================================
// DETAIL VIEW (Unterseiten, pageId >= 10000)
// ============================================================
export const CatalogLayoutSetsDetailView: FC<CatalogLayoutProps> = props =>
{
    const { page } = props;
    const [set, setSet] = useState<FurnitureSet | null>(null);
    const [loading, setLoading] = useState(true);
    const ownedNames = useOwnedClassNames();

    const setId = page?.localization?.getText(0) || '';

    useEffect(() =>
    {
        if(!setId) { setLoading(false); return; }

        fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, {
            headers: { 'X-Habbo-User-Id': getUserId() },
        })
            .then(res => res.json())
            .then((data: FurnitureSet[]) =>
            {
                const found = data.find(s => String(s.id) === setId);
                setSet(found || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [setId]);

    const handleComplete = (id: number) =>
    {
        try { const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets complete ${ id }`, 0); }
        catch(e) {}
    };

    const handleClaim = (id: number) =>
    {
        try { const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets claim ${ id }`, 0); }
        catch(e) {}
    };

    const handlePlaceInRoom = (item: SetItem) =>
    {
        try {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(`:sets preview ${ item.item_base_id }`, 0);
        } catch(e) {}
    };

    if(loading)
    {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: WHITE60 }}>
                Lade Set...
            </div>
        );
    }

    if(!set)
    {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: WHITE40, fontSize: 12 }}>
                Set nicht gefunden.
            </div>
        );
    }

    const progress = getProgress(set, ownedNames);
    const complete = progress.percent === 100;
    const hasRewards = set.reward_credits > 0 || set.reward_pixels > 0 || set.reward_points > 0 || set.reward_item !== null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: 6, color: WHITE }}>
            {/* Header */}
            <div style={{ background: BG_CARD, borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{ set.name }</div>
                    { set.difficulty && DIFFICULTY_LABELS[set.difficulty] && (
                        <span style={{
                            fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            background: `${ DIFFICULTY_COLORS[set.difficulty] }20`,
                            color: DIFFICULTY_COLORS[set.difficulty],
                            border: `1px solid ${ DIFFICULTY_COLORS[set.difficulty] }40`,
                        }}>
                            { DIFFICULTY_LABELS[set.difficulty] }
                        </span>
                    )}
                </div>
                { set.description &&
                    <div style={{ fontSize: 11, color: WHITE60, marginTop: 2 }}>{ set.description }</div> }
                { set.catalog_description &&
                    <div style={{ fontSize: 10, color: WHITE40, marginTop: 2, fontStyle: 'italic' }}>{ set.catalog_description }</div> }

                { set.show_countdown && set.expires_at && (() => {
                    const diff = new Date(set.expires_at).getTime() - Date.now();
                    if(diff <= 0) return null;
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return (
                        <div style={{ marginTop: 4, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                            ⏰ Noch { days } { days === 1 ? 'Tag' : 'Tage' } verfügbar!
                        </div>
                    );
                })() }

                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: complete ? GREEN_LIGHT : WHITE70, fontWeight: complete ? 600 : 400 }}>
                        { progress.owned }/{ progress.total } Möbel
                    </span>
                    <span style={{ color: WHITE30 }}>·</span>
                    <span style={{ color: WHITE40 }}>{ set.completions }x eingefügt</span>
                    { set.release_date && (
                        <>
                            <span style={{ color: WHITE30 }}>·</span>
                            <span style={{ color: WHITE40 }}>📅 { formatDate(set.release_date) }</span>
                        </>
                    )}
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 6, height: 6, width: '100%', borderRadius: 9999, background: WHITE10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: complete ? GREEN : BLUE, width: `${ progress.percent }%`, transition: 'width 0.3s' }} />
                </div>
            </div>

            {/* Rewards */}
            { hasRewards && set.show_rewards === false && (
                <div style={{ background: BG_CARD, borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ORANGE }}>🎁 Belohnung: <span style={{ color: WHITE40 }}>??? (Überraschung)</span></div>
                </div>
            )}
            { hasRewards && set.show_rewards !== false && (
                <div style={{ background: BG_CARD, borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: ORANGE }}>🎁 Belohnung</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' }}>
                        { set.reward_credits > 0 && <span style={{ color: YELLOW }}>+{ set.reward_credits } Credits</span> }
                        { set.reward_pixels > 0 && <span style={{ color: BLUE_LIGHT }}>+{ set.reward_pixels } Pixels</span> }
                        { set.reward_points > 0 && <span style={{ color: GREEN_LIGHT }}>+{ set.reward_points } Punkte</span> }
                        { set.reward_item && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <img
                                    src={ getFurniIcon(set.reward_item.item_name) }
                                    alt={ set.reward_item.public_name }
                                    style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated' }}
                                    onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } }
                                />
                                <span style={{ color: ORANGE }}>{ set.reward_item.public_name }</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Complete button - only when 100% and not yet inserted */}
            { complete && !set.isCompleted && (
                <button
                    style={{ width: '100%', padding: '6px 0', borderRadius: 6, background: '#16a34a', color: WHITE, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    onMouseEnter={ (e) => (e.currentTarget.style.background = GREEN) }
                    onMouseLeave={ (e) => (e.currentTarget.style.background = '#16a34a') }
                    onClick={ () => handleComplete(set.id) }>
                    ✓ Set einfügen
                </button>
            )}

            {/* Claim reward button - only when inserted but reward not yet claimed */}
            { set.isCompleted && !set.rewardClaimed && hasRewards && (
                <button
                    style={{ width: '100%', padding: '6px 0', borderRadius: 6, background: '#d97706', color: WHITE, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    onMouseEnter={ (e) => (e.currentTarget.style.background = ORANGE) }
                    onMouseLeave={ (e) => (e.currentTarget.style.background = '#d97706') }
                    onClick={ () => handleClaim(set.id) }>
                    🎁 Belohnung abholen
                </button>
            )}

            {/* Already fully done */}
            { set.isCompleted && set.rewardClaimed && (
                <div style={{ width: '100%', padding: '6px 0', borderRadius: 6, background: 'rgba(34,197,94,0.15)', color: GREEN_LIGHT, fontSize: 12, fontWeight: 600, textAlign: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ✅ Set eingefügt &amp; Belohnung abgeholt
                </div>
            )}

            {/* Inserted but no rewards to claim */}
            { set.isCompleted && !hasRewards && (
                <div style={{ width: '100%', padding: '6px 0', borderRadius: 6, background: 'rgba(34,197,94,0.15)', color: GREEN_LIGHT, fontSize: 12, fontWeight: 600, textAlign: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ✅ Set eingefügt
                </div>
            )}

            {/* Item list */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    { set.items.map((item, i) =>
                    {
                        const owned = isItemOwned(ownedNames, item.item_name);

                        return (
                            <div key={ i } style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                borderRadius: 4, padding: '4px 6px',
                                background: owned ? GREEN_BG : BG_CARD,
                            }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <img
                                        src={ getFurniIcon(item.item_name) }
                                        alt={ item.public_name }
                                        style={{ width: 30, height: 30, objectFit: 'contain', opacity: owned ? 1 : 0.4, filter: owned ? 'none' : 'grayscale(100%)', imageRendering: 'pixelated' }}
                                        onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } }
                                    />
                                    { owned && (
                                        <div style={{ position: 'absolute', right: -3, top: -3, borderRadius: 9999, background: GREEN, padding: 2, lineHeight: 0 }}>
                                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={ WHITE } strokeWidth={ 3 } strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: 11, color: owned ? WHITE90 : WHITE40, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    { item.public_name }
                                </span>
                                <button
                                    onClick={ (e) => { e.stopPropagation(); handlePlaceInRoom(item); } }
                                    title="Im Raum platzieren (Vorschau)"
                                    style={{
                                        flexShrink: 0, padding: '2px 6px', borderRadius: 4, fontSize: 10,
                                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                        color: WHITE60, cursor: 'pointer', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={ (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = WHITE; } }
                                    onMouseLeave={ (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = WHITE60; } }
                                >📦</button>
                            </div>
                        );
                    }) }
                </div>
            </div>
        </div>
    );
}

export const CatalogLayoutSetsView = CatalogLayoutSetsStartView;
