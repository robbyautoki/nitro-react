import { FC, MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { ChevronRight, Coins, Gem, Gift, Package, Sparkles, Star, Trophy } from 'lucide-react';

import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useMessageEvent } from '../../hooks';
import { AlignGameWindow } from '../align-game-ui';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

import './WinRewardView.scss';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WinItem
{
    id: number;
    item_base_id: number;
    public_name: string;
    item_name: string;
}

interface WinReward
{
    id: number;
    winId: number;
    winLevel: number;
    credits: number;
    pixels: number;
    points: number;
    bonusPercent: number;
    giver: string;
}

type CurrencyKey = 'credits' | 'pixels' | 'points';

interface CurrencyMeta
{
    key: CurrencyKey;
    label: string;
    amount: number;
    color: 'orange' | 'blue' | 'green';
    badgeColor: 'orange' | 'blue' | 'green';
    icon: typeof Coins;
    iconClass: string;
    gradient: string;
    glow: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getCmsUrl = () => GetConfiguration<string>('url.prefix', '');
const getUserId = () => GetSessionDataManager().userId;
const getImageUrl = () => GetConfiguration<string>('image.library.url', '');

let rewardIdCounter = 0;

function useCountUp(target: number, durationMs = 600): number
{
    const [ value, setValue ] = useState(0);

    useEffect(() =>
    {
        if(target <= 0)
        {
            setValue(0);
            return;
        }

        let start: number | null = null;
        let raf = 0;

        const step = (t: number) =>
        {
            if(start === null) start = t;
            const p = Math.min(1, (t - start) / durationMs);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if(p < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [ target, durationMs ]);

    return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

const TrophyHalo: FC<{ size?: number }> = ({ size = 88 }) =>
    (
        <div
            className="relative flex shrink-0 items-center justify-center"
            style={ { width: size, height: size } }
        >
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-warning-alpha-24 via-warning-alpha-10 to-transparent blur-md" />
            <span className="absolute inset-2 rounded-full bg-gradient-to-br from-warning-alpha-24 to-feature-alpha-10 ring-1 ring-inset ring-warning-alpha-24" />
            <span className="absolute inset-3 rounded-full bg-bg-white-0 shadow-regular-sm ring-1 ring-inset ring-stroke-soft-200" />
            <Trophy className="relative size-8 text-warning-base" strokeWidth={ 2.25 } />
        </div>
    );

interface QueueDotsProps
{
    total: number;
}

const QueueDots: FC<QueueDotsProps> = ({ total }) =>
{
    if(total <= 1) return null;
    const visible = Math.min(total, 5);

    return (
        <div className="flex items-center gap-1.5" aria-label={ `${ total } Belohnungen in der Queue` }>
            <span className="size-1.5 rounded-full bg-primary-base" />
            { Array.from({ length: visible - 1 }).map((_, i) => (
                <span key={ i } className="size-1.5 rounded-full bg-bg-soft-200" />
            )) }
            <span className="ml-1 text-paragraph-xs text-text-sub-600">
                { total } Wins
            </span>
        </div>
    );
};

interface CurrencyCardProps
{
    meta: CurrencyMeta;
    selected: boolean;
    onSelect: () => void;
}

const CurrencyCard: FC<CurrencyCardProps> = ({ meta, selected, onSelect }) =>
{
    const Icon = meta.icon;
    const animated = useCountUp(meta.amount, 700);

    const handleMove = (event: ReactMouseEvent<HTMLButtonElement>) =>
    {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        event.currentTarget.style.setProperty('--win-mouse-x', `${ x }%`);
        event.currentTarget.style.setProperty('--win-mouse-y', `${ y }%`);
    };

    return (
        <button
            type="button"
            onClick={ onSelect }
            onMouseMove={ handleMove }
            data-selected={ selected }
            className={ [
                'win-currency-card group flex h-28 flex-col justify-between rounded-2xl p-3 text-left',
                'border ring-1 ring-inset transition duration-200 ease-out',
                'hover:-translate-y-0.5',
                meta.gradient,
                selected
                    ? 'ring-2 ring-primary-base shadow-regular-md'
                    : 'border-stroke-soft-200 ring-stroke-soft-200',
            ].join(' ') }
        >
            <div className="flex items-center justify-between">
                <span className={ `flex size-9 items-center justify-center rounded-xl ${ meta.glow } ring-1 ring-inset ring-static-white/20` }>
                    <Icon className={ `size-5 ${ meta.iconClass }` } strokeWidth={ 2.25 } />
                </span>
                { selected && (
                    <span className="rounded-full bg-primary-base px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-static-white">
                        Gewählt
                    </span>
                ) }
            </div>
            <div>
                <div className="text-title-h5 font-semibold tabular-nums text-text-strong-950">
                    { animated.toLocaleString() }
                </div>
                <div className="text-paragraph-xs text-text-sub-600">{ meta.label }</div>
            </div>
        </button>
    );
};

interface ItemCardProps
{
    item: WinItem;
    selected: boolean;
    onSelect: () => void;
}

const ItemCard: FC<ItemCardProps> = ({ item, selected, onSelect }) =>
    (
        <button
            type="button"
            onClick={ onSelect }
            className={ [
                'group relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border bg-bg-white-0 p-2 text-center transition duration-200 ease-out',
                selected
                    ? 'border-primary-base ring-2 ring-primary-base shadow-regular-md'
                    : 'border-stroke-soft-200 hover:-translate-y-0.5 hover:border-stroke-sub-300 hover:shadow-regular-xs',
            ].join(' ') }
            title={ item.public_name }
        >
            { selected && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary-base text-static-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            ) }
            <img
                src={ `${ getImageUrl() }${ item.item_name.split('*')[0] }_icon.png` }
                alt={ item.public_name }
                className="size-10 object-contain transition group-hover:scale-110"
                style={ { imageRendering: 'pixelated' } }
                onError={ (e) =>
                {
                    (e.target as HTMLImageElement).style.opacity = '0.35';
                } }
            />
            <span className="line-clamp-2 w-full text-[10px] leading-tight text-text-sub-600">
                { item.public_name }
            </span>
        </button>
    );

const TrophyBurst: FC = () =>
    (
        <div className="relative flex size-28 items-center justify-center">
            <svg
                viewBox="0 0 200 200"
                className="win-rays absolute inset-0 size-full text-warning-base/40"
                aria-hidden="true"
            >
                { Array.from({ length: 12 }).map((_, i) =>
                {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = 100 + Math.cos(angle) * 50;
                    const y1 = 100 + Math.sin(angle) * 50;
                    const x2 = 100 + Math.cos(angle) * 92;
                    const y2 = 100 + Math.sin(angle) * 92;

                    return (
                        <line
                            key={ i }
                            x1={ x1 } y1={ y1 } x2={ x2 } y2={ y2 }
                            stroke="currentColor" strokeWidth={ 4 } strokeLinecap="round"
                        />
                    );
                }) }
            </svg>
            <span className="absolute inset-4 rounded-full bg-gradient-to-br from-warning-alpha-24 via-warning-alpha-10 to-transparent blur-md" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-warning-lighter ring-1 ring-inset ring-warning-base/30">
                <Trophy className="size-8 text-warning-base" strokeWidth={ 2.25 } />
            </span>
        </div>
    );

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export const WinRewardView: FC<{}> = () =>
{
    const [ rewards, setRewards ] = useState<WinReward[]>([]);
    const [ items, setItems ] = useState<WinItem[]>([]);
    const [ selectedCurrency, setSelectedCurrency ] = useState<CurrencyKey | null>(null);
    const [ selectedItem, setSelectedItem ] = useState<WinItem | null>(null);
    const [ claiming, setClaiming ] = useState(false);
    const [ claimed, setClaimed ] = useState(false);
    const [ itemsLoaded, setItemsLoaded ] = useState(false);
    const [ shake, setShake ] = useState(false);
    const ctaRef = useRef<HTMLButtonElement | null>(null);

    const current = rewards[0] ?? null;
    const queueCount = rewards.length;

    const loadItems = useCallback(() =>
    {
        if(itemsLoaded) return;
        fetch(`${ getCmsUrl() }/api/wins?action=config`, {
            headers: getAuthHeaders(),
        })
            .then(r => r.json())
            .then(data =>
            {
                if(data.items) setItems(data.items);
                setItemsLoaded(true);
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
        if(!selectedCurrency)
        {
            // Locked-Click: trigger shake on CTA.
            setShake(true);
            window.setTimeout(() => setShake(false), 500);
            return;
        }

        if(claiming || !current) return;
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

    const currencies: CurrencyMeta[] = [
        {
            key: 'credits',
            label: 'Credits',
            amount: current.credits,
            color: 'orange',
            badgeColor: 'orange',
            icon: Coins,
            iconClass: 'text-warning-base',
            gradient: 'bg-gradient-to-br from-warning-alpha-10 to-warning-alpha-24',
            glow: 'bg-warning-alpha-24',
        },
        {
            key: 'pixels',
            label: 'Pixels',
            amount: current.pixels,
            color: 'blue',
            badgeColor: 'blue',
            icon: Gem,
            iconClass: 'text-information-base',
            gradient: 'bg-gradient-to-br from-information-alpha-10 to-information-alpha-24',
            glow: 'bg-information-alpha-24',
        },
        {
            key: 'points',
            label: 'Punkte',
            amount: current.points,
            color: 'green',
            badgeColor: 'green',
            icon: Star,
            iconClass: 'text-success-base',
            gradient: 'bg-gradient-to-br from-success-alpha-10 to-success-alpha-24',
            glow: 'bg-success-alpha-24',
        },
    ];

    const selectedCurrencyMeta = currencies.find(c => c.key === selectedCurrency);
    const claimedAmount = useCountUp(selectedCurrencyMeta?.amount ?? 0, 800);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-bg-strong-950/70 backdrop-blur-xl pointer-events-auto">
            <AlignGameWindow
                title="Event-Win erhalten"
                subtitle={ `Belohnung von ${ current.giver }` }
                icon={ <Trophy className="size-4 text-warning-base" /> }
                widthClassName="w-[560px] max-w-[94vw]"
                bodyClassName="p-0"
                onClose={ claimed ? dismissCurrent : undefined }
            >
                {/* dezenter Gold/Lila-Edge-Gradient als Atmosphären-Layer */}
                <div className="relative">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-warning-alpha-10 via-transparent to-feature-alpha-10 opacity-60"
                    />

                    <div className="relative space-y-5 p-5">
                        {/* ─── Hero ─────────────────────────────────────────── */}
                        <section className="win-stagger win-stagger-0 flex items-start gap-4">
                            <TrophyHalo />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-soft-400">
                                        Event-Win
                                    </span>
                                    <span className="h-px flex-1 bg-stroke-soft-200" />
                                    <QueueDots total={ queueCount } />
                                </div>

                                <div className="mt-1 flex items-baseline gap-2">
                                    <h2 className="text-title-h3 font-semibold tracking-tight text-text-strong-950">
                                        Level&nbsp;{ current.winLevel }
                                    </h2>
                                    { current.bonusPercent > 0 && (
                                        <span className="win-bonus-pill inline-flex items-center gap-1 rounded-full bg-feature-alpha-16 px-2 py-0.5 text-[11px] font-semibold text-feature-base ring-1 ring-inset ring-feature-base/30">
                                            <Sparkles className="size-3" />
                                            +{ current.bonusPercent }%
                                        </span>
                                    ) }
                                </div>
                                <p className="mt-1 text-paragraph-sm text-text-sub-600">
                                    Vergeben von <span className="font-medium text-text-strong-950">{ current.giver }</span>. Wähle eine Belohnung — du bekommst eine Währung und optional ein Item.
                                </p>
                            </div>
                        </section>

                        { !claimed ? (
                            <>
                                {/* ─── Currency Picker ──────────────────────── */}
                                <section className="win-stagger win-stagger-1 space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <h3 className="text-label-sm font-semibold text-text-strong-950">
                                            Wähle eine Währung
                                        </h3>
                                        <span className="text-paragraph-xs text-text-sub-600">
                                            { selectedCurrency ? '✓ ausgewählt' : 'Pflichtfeld' }
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        { currencies.map(meta => (
                                            <CurrencyCard
                                                key={ meta.key }
                                                meta={ meta }
                                                selected={ selectedCurrency === meta.key }
                                                onSelect={ () => setSelectedCurrency(meta.key) }
                                            />
                                        )) }
                                    </div>
                                </section>

                                {/* ─── Item Picker ──────────────────────────── */}
                                <section className="win-stagger win-stagger-2 space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <h3 className="text-label-sm font-semibold text-text-strong-950">
                                            Wähle ein Item
                                        </h3>
                                        <span className="text-paragraph-xs text-text-sub-600">
                                            { items.length > 0
                                                ? `${ items.length } verfügbar · optional`
                                                : 'optional' }
                                        </span>
                                    </div>
                                    { items.length === 0 ? (
                                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-3">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200">
                                                <Package className="size-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-label-sm text-text-strong-950">Keine Item-Auswahl nötig</div>
                                                <div className="text-paragraph-xs text-text-sub-600">
                                                    Diesmal gibt es nur Währung — Glück gehabt!
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid max-h-[208px] grid-cols-4 gap-2 overflow-auto pr-1">
                                            { items.map(item => (
                                                <ItemCard
                                                    key={ item.id }
                                                    item={ item }
                                                    selected={ selectedItem?.id === item.id }
                                                    onSelect={ () =>
                                                        setSelectedItem(prev => prev?.id === item.id ? null : item)
                                                    }
                                                />
                                            )) }
                                        </div>
                                    ) }
                                </section>

                                {/* ─── Action Bar ───────────────────────────── */}
                                <section className="win-stagger win-stagger-3 space-y-2">
                                    <FancyButton.Root
                                        ref={ ctaRef }
                                        type="button"
                                        className={ `h-12 w-full text-label-md ${ shake ? 'win-shake' : '' }` }
                                        size="medium"
                                        variant={ selectedCurrency ? 'primary' : 'basic' }
                                        disabled={ claiming }
                                        onClick={ handleClaim }
                                    >
                                        <FancyButton.Icon as={ Gift } />
                                        { claiming
                                            ? 'Wird eingelöst...'
                                            : selectedCurrency
                                                ? `Belohnung einlösen — +${ selectedCurrencyMeta?.amount.toLocaleString() } ${ selectedCurrencyMeta?.label }${ selectedItem ? ` + ${ selectedItem.public_name }` : '' }`
                                                : 'Wähle eine Währung um fortzufahren' }
                                    </FancyButton.Root>
                                    <p className="text-center text-paragraph-xs text-text-sub-600">
                                        Wird sofort gutgeschrieben — kein Zurück.
                                    </p>
                                </section>
                            </>
                        ) : (
                            // ─── Success View ──────────────────────────────────
                            <section className="flex flex-col items-center gap-4 py-2 text-center">
                                <TrophyBurst />

                                <div>
                                    <h3 className="text-title-h4 font-semibold tracking-tight text-text-strong-950">
                                        Belohnung eingelöst!
                                    </h3>
                                    <p className="mt-1 text-paragraph-sm text-text-sub-600">
                                        Auf deinem Account in wenigen Sekunden.
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-2">
                                    { selectedCurrencyMeta && (
                                        <span className={ `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm font-semibold text-text-strong-950 ${ selectedCurrencyMeta.gradient } ring-1 ring-inset ring-stroke-soft-200` }>
                                            <selectedCurrencyMeta.icon className={ `size-4 ${ selectedCurrencyMeta.iconClass }` } strokeWidth={ 2.25 } />
                                            <span className="win-counter tabular-nums">
                                                +{ claimedAmount.toLocaleString() }
                                            </span>
                                            { selectedCurrencyMeta.label }
                                        </span>
                                    ) }
                                    { selectedItem && (
                                        <AlignBadge.Root color="orange" variant="lighter" size="medium">
                                            <AlignBadge.Icon as={ Gift } className="size-3.5" />
                                            +1 { selectedItem.public_name }
                                        </AlignBadge.Root>
                                    ) }
                                </div>

                                <FancyButton.Root
                                    type="button"
                                    variant={ queueCount > 1 ? 'primary' : 'basic' }
                                    size="small"
                                    className="mt-1"
                                    onClick={ dismissCurrent }
                                >
                                    { queueCount > 1
                                        ? `Weiter zu Win ${ Math.min(2, queueCount) } von ${ queueCount }`
                                        : 'Schließen' }
                                    { queueCount > 1 && <FancyButton.Icon as={ ChevronRight } /> }
                                </FancyButton.Root>
                            </section>
                        ) }
                    </div>
                </div>
            </AlignGameWindow>
        </div>
    );
};
