import { FC, useCallback, useEffect, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useMessageEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Frame, FramePanel } from '../ui/frame';
import { Button } from '../ui/button';
import { Trophy, X } from 'lucide-react';

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
        { key: 'credits', label: 'Credits', amount: current.credits, color: 'text-amber-500', bgActive: 'border-amber-500/40 bg-amber-500/5', emoji: '💰' },
        { key: 'pixels', label: 'Pixels', amount: current.pixels, color: 'text-blue-500', bgActive: 'border-blue-500/40 bg-blue-500/5', emoji: '💎' },
        { key: 'points', label: 'Punkte', amount: current.points, color: 'text-emerald-500', bgActive: 'border-emerald-500/40 bg-emerald-500/5', emoji: '⭐' },
    ];

    const queueCount = rewards.length;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[520px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b">
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-4 text-amber-500" />
                                    <span className="text-sm font-semibold">Event-Win erhalten!</span>
                                    { queueCount > 1 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                                            +{ queueCount - 1 } weitere
                                        </span>
                                    )}
                                </div>
                                { claimed && (
                                    <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ dismissCurrent }>
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-auto">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-500">Level { current.winLevel }</div>
                                    <div className="text-xs text-muted-foreground mt-1">Win von <span className="text-foreground font-medium">{ current.giver }</span></div>
                                    { current.bonusPercent > 0 && (
                                        <div className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-medium border border-purple-500/20 bg-purple-500/5 text-purple-500">
                                            +{ current.bonusPercent }% Rang-Bonus
                                        </div>
                                    )}
                                </div>

                                { !claimed ? (
                                    <>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground mb-2">Wähle eine Währung:</div>
                                            <div className="grid grid-cols-3 gap-2">
                                                { currencies.map(c => (
                                                    <button
                                                        key={ c.key }
                                                        className={ `flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${ selectedCurrency === c.key ? c.bgActive : 'border-border' }` }
                                                        onClick={ () => setSelectedCurrency(c.key) }>
                                                        <span className="text-lg">{ c.emoji }</span>
                                                        <span className={ `text-sm font-bold ${ c.color }` }>{ c.amount.toLocaleString() }</span>
                                                        <span className="text-[10px] text-muted-foreground">{ c.label }</span>
                                                    </button>
                                                )) }
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground mb-2">Wähle ein Item:</div>
                                            { items.length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground/50 text-xs">Keine Items verfügbar</div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-auto">
                                                    { items.map(item => (
                                                        <button
                                                            key={ item.id }
                                                            className={ `flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${ selectedItem?.id === item.id ? 'border-amber-500/40 bg-amber-500/5' : 'border-border' }` }
                                                            onClick={ () => setSelectedItem(item) }>
                                                            <img
                                                                src={ `${ getImageUrl() }${ item.item_name.split('*')[0] }_icon.png` }
                                                                alt={ item.public_name }
                                                                className="w-8 h-8 object-contain"
                                                                style={{ imageRendering: 'pixelated' }}
                                                                onError={ (e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; } }
                                                            />
                                                            <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">
                                                                { item.public_name }
                                                            </span>
                                                        </button>
                                                    )) }
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            className="w-full"
                                            size="sm"
                                            disabled={ !selectedCurrency || claiming }
                                            onClick={ handleClaim }>
                                            { claiming ? 'Wird eingelöst...' : '🎁 Belohnung einlösen' }
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <div className="text-4xl">🎉</div>
                                        <div className="text-sm font-semibold text-foreground">Belohnung erfolgreich eingelöst!</div>
                                        <div className="flex gap-3">
                                            { selectedCurrency && (
                                                <div className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
                                                    +{ currencies.find(c => c.key === selectedCurrency)?.amount.toLocaleString() } { currencies.find(c => c.key === selectedCurrency)?.label }
                                                </div>
                                            )}
                                            { selectedItem && (
                                                <div className="px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-500/20 bg-amber-500/5 text-amber-500">
                                                    +1 { selectedItem.public_name }
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" onClick={ dismissCurrent }>
                                            { queueCount > 1 ? `Weiter (${ queueCount - 1 } übrig)` : 'Schließen' }
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        </div>
    );
};
