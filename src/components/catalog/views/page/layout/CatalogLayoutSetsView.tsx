import { FC, useEffect, useMemo, useState } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../../../../api';
import { getAuthHeaders } from '../../../../../api/utils/SessionTokenManager';
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

const DIFFICULTY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
    easy: {
        bg: 'hsl(var(--align-success-lighter))',
        border: 'hsl(var(--align-success-light))',
        text: 'hsl(var(--align-success-base))',
    },
    medium: {
        bg: 'hsl(var(--align-warning-lighter))',
        border: 'hsl(var(--align-warning-light))',
        text: 'hsl(var(--align-warning-base))',
    },
    hard: {
        bg: 'hsl(var(--align-warning-lighter))',
        border: 'hsl(var(--align-warning-light))',
        text: 'hsl(var(--align-warning-dark))',
    },
    expert: {
        bg: 'hsl(var(--align-error-lighter))',
        border: 'hsl(var(--align-error-light))',
        text: 'hsl(var(--align-error-base))',
    },
};
const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    expert: 'Experte',
};

const TEXT_STRONG = 'hsl(var(--align-text-strong-950))';
const TEXT_SUB = 'hsl(var(--align-text-sub-600))';
const TEXT_SOFT = 'hsl(var(--align-text-soft-400))';
const TEXT_DISABLED = 'hsl(var(--align-text-disabled-300))';
const STATIC_WHITE = 'hsl(var(--align-static-white))';
const BG_CARD = 'hsl(var(--align-bg-weak-50))';
const BG_SOFT = 'hsl(var(--align-bg-soft-200))';
const STROKE_SOFT = 'hsl(var(--align-stroke-soft-200))';
const SUCCESS = 'hsl(var(--align-success-base))';
const SUCCESS_BG = 'hsl(var(--align-success-lighter))';
const SUCCESS_BORDER = 'hsl(var(--align-success-light))';
const PRIMARY = 'hsl(var(--align-primary-base))';
const WARNING = 'hsl(var(--align-warning-base))';
const WARNING_DARK = 'hsl(var(--align-warning-dark))';
const ERROR = 'hsl(var(--align-error-base))';

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
            if(floorData) 
            {
                names.add(floorData.className); continue; 
            }
            const wallData = sessionData.getWallItemData(group.type);
            if(wallData) names.add(wallData.className);
        }

        return names;
    }, [ groupItems ]);
}

function getCmsUrl() 
{
    return GetConfiguration<string>('url.prefix', 'http://localhost:3030'); 
}
function getUserId() 
{
    return String(GetSessionDataManager().userId); 
}
function getImageUrl() 
{
    return GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/'); 
}

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
    for(const item of set.items) 
    {
        if(isItemOwned(ownedNames, item.item_name)) owned++; 
    }
    return { owned, total: set.items.length, percent: Math.round((owned / set.items.length) * 100) };
}

function formatDate(dateStr: string | null): string
{
    if(!dateStr) return '';
    try 
    {
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    catch 
    {
        return ''; 
    }
}

// ============================================================
// STARTSEITE (pageId 9998)
// ============================================================
export const CatalogLayoutSetsStartView: FC<CatalogLayoutProps> = () =>
{
    const [ stats, setStats ] = useState<{ totalSets: number; totalCompletions: number } | null>(null);
    const ownedNames = useOwnedClassNames();
    const [ sets, setSets ] = useState<FurnitureSet[]>([]);

    useEffect(() =>
    {
        fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, {
            headers: getAuthHeaders(),
        })
            .then(res => res.json())
            .then((data: FurnitureSet[]) =>
            {
                setSets(data);
                const totalCompletions = data.reduce((sum, s) => sum + s.completions, 0);
                setStats({ totalSets: data.length, totalCompletions });
            })
            .catch(() => 
            {});
    }, []);

    const completedCount = useMemo(() =>
    {
        let count = 0;
        for(const set of sets) 
        {
            if(getProgress(set, ownedNames).percent === 100) count++; 
        }
        return count;
    }, [ sets, ownedNames ]);

    return (
        <div style={ { display: 'flex', flexDirection: 'column', height: '100%', gap: 8, padding: 8, color: TEXT_STRONG, overflowY: 'auto' } }>
            <div style={ { fontSize: 16, fontWeight: 'bold' } }>🏆 SET-Katalog</div>
            <div style={ { background: BG_CARD, borderRadius: 8, padding: 10 } }>
                <div style={ { fontSize: 12, fontWeight: 600, marginBottom: 6 } }>Sammle vollständige Möbel-Sets!</div>
                <div style={ { fontSize: 11, color: TEXT_SUB, lineHeight: '1.5' } }>
                    Finde alle Möbelstücke eines Sets und füge es dauerhaft ein, um Belohnungen zu erhalten.
                    Eingefügte Sets können nicht mehr aufgelöst werden – die Möbel sind dann permanent gesperrt.
                </div>
            </div>
            <div style={ { background: BG_CARD, borderRadius: 8, padding: 10 } }>
                <div style={ { fontSize: 12, fontWeight: 600, marginBottom: 6 } }>So funktioniert es</div>
                <div style={ { display: 'flex', flexDirection: 'column', gap: 4 } }>
                    <div style={ { fontSize: 11, color: TEXT_SUB } }>
                        <span style={ { color: PRIMARY, fontWeight: 600 } }>1.</span> Sammle alle Möbel eines Sets in dein Inventar
                    </div>
                    <div style={ { fontSize: 11, color: TEXT_SUB } }>
                        <span style={ { color: PRIMARY, fontWeight: 600 } }>2.</span> Öffne das Set hier im Katalog – grüne Haken zeigen was du hast
                    </div>
                    <div style={ { fontSize: 11, color: TEXT_SUB } }>
                        <span style={ { color: PRIMARY, fontWeight: 600 } }>3.</span> Bei 100% erscheint der Button zum Einfügen
                    </div>
                    <div style={ { fontSize: 11, color: TEXT_SUB } }>
                        <span style={ { color: PRIMARY, fontWeight: 600 } }>4.</span> Eingefügte Sets bringen Credits, Pixels &amp; Punkte!
                    </div>
                </div>
            </div>
            { stats && (
                <div style={ { background: BG_CARD, borderRadius: 8, padding: 10 } }>
                    <div style={ { fontSize: 12, fontWeight: 600, marginBottom: 6 } }>Deine Statistik</div>
                    <div style={ { display: 'flex', gap: 12 } }>
                        <div style={ { textAlign: 'center' } }>
                            <div style={ { fontSize: 20, fontWeight: 'bold', color: SUCCESS } }>{ completedCount }</div>
                            <div style={ { fontSize: 10, color: TEXT_SOFT } }>Vollständig</div>
                        </div>
                        <div style={ { textAlign: 'center' } }>
                            <div style={ { fontSize: 20, fontWeight: 'bold', color: PRIMARY } }>{ stats.totalSets }</div>
                            <div style={ { fontSize: 10, color: TEXT_SOFT } }>Sets gesamt</div>
                        </div>
                        <div style={ { textAlign: 'center' } }>
                            <div style={ { fontSize: 20, fontWeight: 'bold', color: WARNING } }>{ stats.totalCompletions }</div>
                            <div style={ { fontSize: 10, color: TEXT_SOFT } }>Eingefügt (alle)</div>
                        </div>
                    </div>
                </div>
            ) }
            <div style={ { fontSize: 11, color: TEXT_SOFT, textAlign: 'center', marginTop: 4 } }>
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
    const [ set, setSet ] = useState<FurnitureSet | null>(null);
    const [ loading, setLoading ] = useState(true);
    const ownedNames = useOwnedClassNames();

    const setId = page?.localization?.getText(0) || '';

    useEffect(() =>
    {
        if(!setId) 
        {
            setLoading(false); return; 
        }

        fetch(`${ getCmsUrl() }/api/sets?action=catalog-public`, {
            headers: getAuthHeaders(),
        })
            .then(res => res.json())
            .then((data: FurnitureSet[]) =>
            {
                const found = data.find(s => String(s.id) === setId);
                setSet(found || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [ setId ]);

    const handleComplete = (id: number) =>
    {
        try 
        {
            const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets complete ${ id }`, 0); 
        }
        catch(e) 
        {}
    };

    const handleClaim = (id: number) =>
    {
        try 
        {
            const session = GetRoomSession(); if(session) session.sendChatMessage(`:sets claim ${ id }`, 0); 
        }
        catch(e) 
        {}
    };

    const handlePlaceInRoom = (item: SetItem) =>
    {
        try 
        {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(`:sets preview ${ item.item_base_id }`, 0);
        }
        catch(e) 
        {}
    };

    if(loading)
    {
        return (
            <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: TEXT_SUB } }>
                Lade Set...
            </div>
        );
    }

    if(!set)
    {
        return (
            <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: TEXT_SOFT, fontSize: 12 } }>
                Set nicht gefunden.
            </div>
        );
    }

    const progress = getProgress(set, ownedNames);
    const complete = progress.percent === 100;
    const hasRewards = set.has_rewards || set.reward_credits > 0 || set.reward_pixels > 0 || set.reward_points > 0 || set.has_reward_item || set.reward_item !== null;
    const difficultyStyle = set.difficulty ? DIFFICULTY_STYLES[set.difficulty] : null;

    return (
        <div style={ { display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: 6, color: TEXT_STRONG } }>
            { /* Header */ }
            <div style={ { background: BG_CARD, borderRadius: 6, padding: 8 } }>
                <div style={ { display: 'flex', alignItems: 'center', gap: 6 } }>
                    <div style={ { fontWeight: 'bold', fontSize: 14 } }>{ set.name }</div>
                    { set.difficulty && difficultyStyle && DIFFICULTY_LABELS[set.difficulty] && (
                        <span style={ {
                            fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            background: difficultyStyle.bg,
                            color: difficultyStyle.text,
                            border: `1px solid ${ difficultyStyle.border }`,
                        } }>
                            { DIFFICULTY_LABELS[set.difficulty] }
                        </span>
                    ) }
                </div>
                { set.description &&
                    <div style={ { fontSize: 11, color: TEXT_SUB, marginTop: 2 } }>{ set.description }</div> }
                { set.catalog_description &&
                    <div style={ { fontSize: 10, color: TEXT_SOFT, marginTop: 2, fontStyle: 'italic' } }>{ set.catalog_description }</div> }
                { set.show_countdown && set.expires_at && (() => 
                {
                    const diff = new Date(set.expires_at).getTime() - Date.now();
                    if(diff <= 0) return null;
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return (
                        <div style={ { marginTop: 4, fontSize: 10, color: ERROR, fontWeight: 600 } }>
                            ⏰ Noch { days } { days === 1 ? 'Tag' : 'Tage' } verfügbar!
                        </div>
                    );
                })() }
                <div style={ { display: 'flex', gap: 8, marginTop: 6, fontSize: 11, alignItems: 'center', flexWrap: 'wrap' } }>
                    <span style={ { color: complete ? SUCCESS : TEXT_SUB, fontWeight: complete ? 600 : 400 } }>
                        { progress.owned }/{ progress.total } Möbel
                    </span>
                    <span style={ { color: TEXT_DISABLED } }>·</span>
                    <span style={ { color: TEXT_SOFT } }>{ set.completions }x eingefügt</span>
                    { set.release_date && (
                        <>
                            <span style={ { color: TEXT_DISABLED } }>·</span>
                            <span style={ { color: TEXT_SOFT } }>📅 { formatDate(set.release_date) }</span>
                        </>
                    ) }
                </div>
                { /* Progress bar */ }
                <div style={ { marginTop: 6, height: 6, width: '100%', borderRadius: 9999, background: BG_SOFT, overflow: 'hidden' } }>
                    <div style={ { height: '100%', borderRadius: 9999, background: complete ? SUCCESS : PRIMARY, width: `${ progress.percent }%`, transition: 'width 0.3s' } } />
                </div>
            </div>
            { /* Rewards */ }
            { hasRewards && set.show_rewards === false && (
                <div style={ { background: BG_CARD, borderRadius: 6, padding: 8 } }>
                    <div style={ { fontSize: 11, fontWeight: 600, color: WARNING_DARK } }>🎁 Belohnung: <span style={ { color: TEXT_SOFT } }>??? (Überraschung)</span></div>
                </div>
            ) }
            { hasRewards && set.show_rewards !== false && (
                <div style={ { background: BG_CARD, borderRadius: 6, padding: 8 } }>
                    <div style={ { fontSize: 11, fontWeight: 600, marginBottom: 4, color: WARNING_DARK } }>🎁 Belohnung</div>
                    <div style={ { display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' } }>
                        { set.reward_credits > 0 && <span style={ { color: WARNING } }>+{ set.reward_credits } Credits</span> }
                        { set.reward_pixels > 0 && <span style={ { color: PRIMARY } }>+{ set.reward_pixels } Pixels</span> }
                        { set.reward_points > 0 && <span style={ { color: SUCCESS } }>+{ set.reward_points } Punkte</span> }
                        { set.reward_item && (
                            <span style={ { display: 'inline-flex', alignItems: 'center', gap: 4 } }>
                                <img
                                    src={ getFurniIcon(set.reward_item.item_name) }
                                    alt={ set.reward_item.public_name }
                                    style={ { width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated' } }
                                    onError={ (e) => 
                                    {
                                        (e.target as HTMLImageElement).style.opacity = '0.3'; 
                                    } }
                                />
                                <span style={ { color: WARNING_DARK } }>{ set.reward_item.public_name }</span>
                            </span>
                        ) }
                    </div>
                </div>
            ) }
            { /* Complete button - only when 100% and not yet inserted */ }
            { complete && !set.isCompleted && (
                <button
                    style={ { width: '100%', padding: '6px 0', borderRadius: 6, background: SUCCESS, color: STATIC_WHITE, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' } }
                    onMouseEnter={ (e) => (e.currentTarget.style.background = SUCCESS) }
                    onMouseLeave={ (e) => (e.currentTarget.style.background = SUCCESS) }
                    onClick={ () => handleComplete(set.id) }>
                    ✓ Set einfügen
                </button>
            ) }
            { /* Claim reward button - only when inserted but reward not yet claimed */ }
            { set.isCompleted && !set.rewardClaimed && hasRewards && (
                <button
                    style={ { width: '100%', padding: '6px 0', borderRadius: 6, background: WARNING, color: STATIC_WHITE, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' } }
                    onMouseEnter={ (e) => (e.currentTarget.style.background = WARNING_DARK) }
                    onMouseLeave={ (e) => (e.currentTarget.style.background = WARNING) }
                    onClick={ () => handleClaim(set.id) }>
                    🎁 Belohnung abholen
                </button>
            ) }
            { /* Already fully done */ }
            { set.isCompleted && set.rewardClaimed && (
                <div style={ { width: '100%', padding: '6px 0', borderRadius: 6, background: SUCCESS_BG, color: SUCCESS, fontSize: 12, fontWeight: 600, textAlign: 'center', border: `1px solid ${ SUCCESS_BORDER }` } }>
                    ✅ Set eingefügt &amp; Belohnung abgeholt
                </div>
            ) }
            { /* Inserted but no rewards to claim */ }
            { set.isCompleted && !hasRewards && (
                <div style={ { width: '100%', padding: '6px 0', borderRadius: 6, background: SUCCESS_BG, color: SUCCESS, fontSize: 12, fontWeight: 600, textAlign: 'center', border: `1px solid ${ SUCCESS_BORDER }` } }>
                    ✅ Set eingefügt
                </div>
            ) }
            { /* Item list */ }
            <div style={ { flex: 1, minHeight: 0, overflowY: 'auto' } }>
                <div style={ { display: 'flex', flexDirection: 'column', gap: 2 } }>
                    { set.items.map((item, i) =>
                    {
                        const owned = isItemOwned(ownedNames, item.item_name);

                        return (
                            <div key={ i } style={ {
                                display: 'flex', alignItems: 'center', gap: 6,
                                borderRadius: 4, padding: '4px 6px',
                                background: owned ? SUCCESS_BG : BG_CARD,
                            } }>
                                <div style={ { position: 'relative', flexShrink: 0 } }>
                                    <img
                                        src={ getFurniIcon(item.item_name) }
                                        alt={ item.public_name }
                                        style={ { width: 30, height: 30, objectFit: 'contain', opacity: owned ? 1 : 0.4, filter: owned ? 'none' : 'grayscale(100%)', imageRendering: 'pixelated' } }
                                        onError={ (e) => 
                                        {
                                            (e.target as HTMLImageElement).style.opacity = '0.3'; 
                                        } }
                                    />
                                    { owned && (
                                        <div style={ { position: 'absolute', right: -3, top: -3, borderRadius: 9999, background: SUCCESS, padding: 2, lineHeight: 0 } }>
                                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={ STATIC_WHITE } strokeWidth={ 3 } strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) }
                                </div>
                                <span style={ { fontSize: 11, color: owned ? TEXT_STRONG : TEXT_SOFT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                                    { item.public_name }
                                </span>
                                <button
                                    onClick={ (e) => 
                                    {
                                        e.stopPropagation(); handlePlaceInRoom(item); 
                                    } }
                                    title="Im Raum platzieren (Vorschau)"
                                    style={ {
                                        flexShrink: 0, padding: '2px 6px', borderRadius: 4, fontSize: 10,
                                        background: BG_CARD, border: `1px solid ${ STROKE_SOFT }`,
                                        color: TEXT_SUB, cursor: 'pointer', transition: 'background 0.15s',
                                    } }
                                    onMouseEnter={ (e) => 
                                    {
                                        e.currentTarget.style.background = BG_SOFT; e.currentTarget.style.color = TEXT_STRONG; 
                                    } }
                                    onMouseLeave={ (e) => 
                                    {
                                        e.currentTarget.style.background = BG_CARD; e.currentTarget.style.color = TEXT_SUB; 
                                    } }
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
