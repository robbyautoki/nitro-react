import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useMessageEvent } from '../../hooks';

interface WinItem {
    id: number;
    item_base_id: number;
    public_name: string;
    item_name: string;
}

interface WinReward {
    id: number;
    winId: number;
    winLevel: number;
    credits: number;
    pixels: number;
    points: number;
    bonusPercent: number;
    giver: string;
}

const WHITE = '#ffffff';
const WHITE60 = 'rgba(255,255,255,0.6)';
const WHITE40 = 'rgba(255,255,255,0.4)';
const WHITE10 = 'rgba(255,255,255,0.1)';
const BG_CARD = 'rgba(0,0,0,0.2)';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const YELLOW = '#facc15';
const ORANGE = '#fb923c';
const PURPLE = '#a855f7';

const getCmsUrl = () => GetConfiguration<string>('url.prefix', '');
const getUserId = () => GetSessionDataManager().userId;
const getImageUrl = () => GetConfiguration<string>('image.library.url', '');

let rewardIdCounter = 0;

export const WinRewardView: FC<{}> = () =>
{
    const [ rewards, setRewards ] = useState<WinReward[]>([]);
    const [ items, setItems ] = useState<WinItem[]>([]);
    const [ selectedCurrency, setSelectedCurrency ] = useState<string | null>(null);
    const [ selectedItem, setSelectedItem ] = useState<WinItem | null>(null);
    const [ claiming, setClaiming ] = useState(false);
    const [ claimed, setClaimed ] = useState(false);
    const [ itemsLoaded, setItemsLoaded ] = useState(false);

    const current = rewards[0] ?? null;

    const loadItems = useCallback(() =>
    {
        if(itemsLoaded) return;
        fetch(`${ getCmsUrl() }/api/wins?action=config`, {
            headers: getAuthHeaders(),
        })
            .then(r => r.json())
            .then(data => { if(data.items) setItems(data.items); setItemsLoaded(true); })
            .catch(() => {});
    }, [itemsLoaded]);

    const addReward = useCallback((reward: WinReward) =>
    {
        setRewards(prev =>
        {
            if(prev.some(r => r.winId === reward.winId)) return prev;
            return [ ...prev, reward ];
        });
    }, []);

    // Listen for win.reward from emulator
    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.type !== 'win.reward') return;

        const params = parser.parameters;
        addReward({
            id: ++rewardIdCounter,
            winId: parseInt(params?.get('win_id') || '0'),
            winLevel: parseInt(params?.get('win_level') || '0'),
            credits: parseInt(params?.get('credits') || '0'),
            pixels: parseInt(params?.get('pixels') || '0'),
            points: parseInt(params?.get('points') || '0'),
            bonusPercent: parseInt(params?.get('bonus_percent') || '0'),
            giver: params?.get('giver') || '',
        });
        loadItems();
    });

    // Load pending wins on mount (reconnect/reload recovery)
    useEffect(() =>
    {
        const userId = getUserId();
        if(!userId) return;

        fetch(`${ getCmsUrl() }/api/wins?action=pending`, {
            headers: getAuthHeaders(),
        })
            .then(r => r.json())
            .then(data =>
            {
                if(!data || !Array.isArray(data)) return;
                for(const win of data)
                {
                    if(!win || win.status !== 'pending') continue;
                    addReward({
                        id: ++rewardIdCounter,
                        winId: win.id,
                        winLevel: win.win_level,
                        credits: win.credits ?? 0,
                        pixels: win.pixels ?? 0,
                        points: win.points ?? 0,
                        bonusPercent: win.bonus_percent ?? 0,
                        giver: win.giver ?? '',
                    });
                }
                if(data.length > 0) loadItems();
            })
            .catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dismissCurrent = useCallback(() =>
    {
        setRewards(prev => prev.slice(1));
        setSelectedCurrency(null);
        setSelectedItem(null);
        setClaimed(false);
    }, []);

    const handleClaim = useCallback(async () =>
    {
        if(!selectedCurrency || claiming || !current) return;
        setClaiming(true);

        try
        {
            const session = GetRoomSession();
            if(session)
            {
                const itemPart = selectedItem ? ` ${ selectedItem.item_base_id }` : '';
                session.sendChatMessage(`:winclaim ${ current.winId } ${ selectedCurrency }${ itemPart }`, 0);
                setClaimed(true);
            }
        }
        catch(e) {}
        finally { setClaiming(false); }
    }, [selectedCurrency, selectedItem, current, claiming]);

    if(!current) return null;

    const currencies = [
        { key: 'credits', label: 'Credits', amount: current.credits, color: YELLOW, emoji: '💰' },
        { key: 'pixels', label: 'Pixels', amount: current.pixels, color: BLUE, emoji: '💎' },
        { key: 'points', label: 'Punkte', amount: current.points, color: GREEN, emoji: '⭐' },
    ];

    const queueCount = rewards.length;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative w-[520px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-amber-500/[0.08] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-semibold text-white/90 tracking-tight">
                                Event-Win erhalten!
                            </span>
                            { queueCount > 1 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                                    +{ queueCount - 1 } weitere
                                </span>
                            )}
                        </div>
                        { claimed && (
                            <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                                onClick={ dismissCurrent }>
                                <FaTimes className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto px-5 pb-5 pt-4 flex flex-col gap-4">

                        {/* Win Info */}
                        <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: ORANGE }}>Level { current.winLevel }</div>
                            <div className="text-xs text-white/40 mt-1">Win von <span className="text-white/70 font-medium">{ current.giver }</span></div>
                            { current.bonusPercent > 0 && (
                                <div className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-medium"
                                    style={{ background: 'rgba(168,85,247,0.15)', color: PURPLE, border: '1px solid rgba(168,85,247,0.2)' }}>
                                    +{ current.bonusPercent }% Rang-Bonus
                                </div>
                            )}
                        </div>

                        { !claimed ? (
                            <>
                                {/* Currency Selection */}
                                <div>
                                    <div className="text-xs font-semibold text-white/50 mb-2">Wähle eine Währung:</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        { currencies.map(c => (
                                            <button
                                                key={ c.key }
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                                                style={{
                                                    background: selectedCurrency === c.key ? `${ c.color }15` : BG_CARD,
                                                    borderColor: selectedCurrency === c.key ? `${ c.color }40` : 'rgba(255,255,255,0.06)',
                                                }}
                                                onClick={ () => setSelectedCurrency(c.key) }>
                                                <span className="text-lg">{ c.emoji }</span>
                                                <span className="text-sm font-bold" style={{ color: c.color }}>{ c.amount.toLocaleString() }</span>
                                                <span className="text-[10px] text-white/40">{ c.label }</span>
                                            </button>
                                        )) }
                                    </div>
                                </div>

                                {/* Item Selection */}
                                <div>
                                    <div className="text-xs font-semibold text-white/50 mb-2">Wähle ein Item:</div>
                                    { items.length === 0 ? (
                                        <div className="text-center py-4 text-white/20 text-xs">Keine Items verfügbar</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-auto">
                                            { items.map(item => (
                                                <button
                                                    key={ item.id }
                                                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                                                    style={{
                                                        background: selectedItem?.id === item.id ? 'rgba(251,146,60,0.1)' : BG_CARD,
                                                        borderColor: selectedItem?.id === item.id ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.06)',
                                                    }}
                                                    onClick={ () => setSelectedItem(item) }>
                                                    <img
                                                        src={ `${ getImageUrl() }${ item.item_name.split('*')[0] }_icon.png` }
                                                        alt={ item.public_name }
                                                        style={{ width: 32, height: 32, objectFit: 'contain', imageRendering: 'pixelated' }}
                                                        onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } }
                                                    />
                                                    <span className="text-[10px] text-white/60 text-center leading-tight truncate w-full">
                                                        { item.public_name }
                                                    </span>
                                                </button>
                                            )) }
                                        </div>
                                    )}
                                </div>

                                {/* Claim Button */}
                                <button
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        background: selectedCurrency ? ORANGE : 'rgba(255,255,255,0.05)',
                                        color: selectedCurrency ? WHITE : 'rgba(255,255,255,0.2)',
                                        cursor: selectedCurrency ? 'pointer' : 'not-allowed',
                                        border: 'none',
                                    }}
                                    disabled={ !selectedCurrency || claiming }
                                    onClick={ handleClaim }>
                                    { claiming ? 'Wird eingelöst...' : '🎁 Belohnung einlösen' }
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-6">
                                <div className="text-4xl">🎉</div>
                                <div className="text-sm font-semibold text-white/90">Belohnung erfolgreich eingelöst!</div>
                                <div className="flex gap-3">
                                    { selectedCurrency && (
                                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{ background: 'rgba(34,197,94,0.1)', color: GREEN, border: '1px solid rgba(34,197,94,0.2)' }}>
                                            +{ currencies.find(c => c.key === selectedCurrency)?.amount.toLocaleString() } { currencies.find(c => c.key === selectedCurrency)?.label }
                                        </div>
                                    )}
                                    { selectedItem && (
                                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{ background: 'rgba(251,146,60,0.1)', color: ORANGE, border: '1px solid rgba(251,146,60,0.2)' }}>
                                            +1 { selectedItem.public_name }
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="mt-2 px-6 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white/90 transition-all"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onClick={ dismissCurrent }>
                                    { queueCount > 1 ? `Weiter (${queueCount - 1} übrig)` : 'Schließen' }
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
