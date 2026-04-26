import { FC, useCallback, useEffect, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { Coins, Gem, Gift, Package, Sparkles, Star, Trophy } from 'lucide-react';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useMessageEvent } from '../../hooks';
import { AlignGameWindow, EmptyState, MetricTile, SelectableCard } from '../align-game-ui';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

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
            .then(data =>
            {
                if(data.items) setItems(data.items); setItemsLoaded(true);
            })
            .catch(() =>
            {});
    }, [ itemsLoaded ]);

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
            .catch(() =>
            {});
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
        catch(e)
        {}
        finally
        {
            setClaiming(false);
        }
    }, [ selectedCurrency, selectedItem, current, claiming ]);

    if(!current) return null;

    const currencies = [
        { key: 'credits', label: 'Credits', amount: current.credits, color: 'orange' as const, icon: Coins, iconClassName: 'text-warning-base' },
        { key: 'pixels', label: 'Pixels', amount: current.pixels, color: 'blue' as const, icon: Gem, iconClassName: 'text-information-base' },
        { key: 'points', label: 'Punkte', amount: current.points, color: 'green' as const, icon: Star, iconClassName: 'text-success-base' },
    ];

    const queueCount = rewards.length;
    const selectedCurrencyMeta = currencies.find(c => c.key === selectedCurrency);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-overlay backdrop-blur-[10px] pointer-events-auto">
            <AlignGameWindow
                title="Event-Win erhalten"
                subtitle={ `Level ${ current.winLevel } von ${ current.giver }` }
                icon={ <Trophy className="size-4" /> }
                widthClassName="w-[520px] max-w-[94vw]"
                onClose={ claimed ? dismissCurrent : undefined }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <MetricTile icon={ <Trophy className="size-4 text-warning-base" /> } value={ `Level ${ current.winLevel }` } label="Win-Level" />
                        <MetricTile icon={ <Gift className="size-4 text-feature-base" /> } value={ queueCount > 1 ? `${ queueCount - 1 } weitere` : 'Aktuell' } label="Queue" />
                    </div>
                    { current.bonusPercent > 0 && (
                        <div className="flex justify-center">
                            <AlignBadge.Root color="purple" variant="lighter" size="medium">
                                <AlignBadge.Icon as={ Sparkles } className="size-3.5" />
                                +{ current.bonusPercent }% Rang-Bonus
                            </AlignBadge.Root>
                        </div>
                    ) }
                    { !claimed ? (
                        <>
                            <section className="space-y-2">
                                <div className="text-label-xs uppercase text-text-soft-400">Wähle eine Währung</div>
                                <div className="grid grid-cols-3 gap-2">
                                    { currencies.map(currency =>
                                    {
                                        const Icon = currency.icon;

                                        return (
                                            <SelectableCard
                                                key={ currency.key }
                                                selected={ selectedCurrency === currency.key }
                                                className="flex-col justify-center text-center"
                                                onClick={ () => setSelectedCurrency(currency.key) }
                                            >
                                                <Icon className={ `size-5 ${ currency.iconClassName }` } />
                                                <span className="text-label-sm tabular-nums text-text-strong-950">{ currency.amount.toLocaleString() }</span>
                                                <span className="text-paragraph-xs text-text-sub-600">{ currency.label }</span>
                                            </SelectableCard>
                                        );
                                    }) }
                                </div>
                            </section>
                            <section className="space-y-2">
                                <div className="text-label-xs uppercase text-text-soft-400">Wähle ein Item</div>
                                { items.length === 0 ? (
                                    <EmptyState icon={ <Package className="size-8" /> } title="Keine Items verfügbar" className="py-5" />
                                ) : (
                                    <div className="grid max-h-[200px] grid-cols-3 gap-2 overflow-auto pr-1">
                                        { items.map(item => (
                                            <SelectableCard
                                                key={ item.id }
                                                selected={ selectedItem?.id === item.id }
                                                className="flex-col justify-center p-2.5 text-center"
                                                onClick={ () => setSelectedItem(item) }
                                            >
                                                <img
                                                    src={ `${ getImageUrl() }${ item.item_name.split('*')[0] }_icon.png` }
                                                    alt={ item.public_name }
                                                    className="size-8 object-contain"
                                                    style={ { imageRendering: 'pixelated' } }
                                                    onError={ (e) =>
                                                    {
                                                        (e.target as HTMLImageElement).style.opacity = '0.35';
                                                    } }
                                                />
                                                <span className="w-full truncate text-paragraph-xs text-text-sub-600">
                                                    { item.public_name }
                                                </span>
                                            </SelectableCard>
                                        )) }
                                    </div>
                                ) }
                            </section>
                            <FancyButton.Root
                                type="button"
                                className="w-full"
                                size="small"
                                variant="primary"
                                disabled={ !selectedCurrency || claiming }
                                onClick={ handleClaim }
                            >
                                <FancyButton.Icon as={ Gift } />
                                { claiming ? 'Wird eingelöst...' : 'Belohnung einlösen' }
                            </FancyButton.Root>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-4 py-6 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-success-lighter text-success-base">
                                <Gift className="size-6" />
                            </div>
                            <div>
                                <div className="text-label-sm text-text-strong-950">Belohnung erfolgreich eingelöst</div>
                                <div className="mt-1 text-paragraph-xs text-text-sub-600">Die Auswahl wurde per :winclaim an den Client gesendet.</div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                { selectedCurrencyMeta && (
                                    <AlignBadge.Root color={ selectedCurrencyMeta.color } variant="lighter">
                                        +{ selectedCurrencyMeta.amount.toLocaleString() } { selectedCurrencyMeta.label }
                                    </AlignBadge.Root>
                                ) }
                                { selectedItem && (
                                    <AlignBadge.Root color="orange" variant="lighter">
                                        +1 { selectedItem.public_name }
                                    </AlignBadge.Root>
                                ) }
                            </div>
                            <FancyButton.Root type="button" variant="basic" size="small" onClick={ dismissCurrent }>
                                { queueCount > 1 ? `Weiter (${ queueCount - 1 } übrig)` : 'Schließen' }
                            </FancyButton.Root>
                        </div>
                    ) }
                </div>
            </AlignGameWindow>
        </div>
    );
};
