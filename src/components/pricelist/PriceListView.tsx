import { ComponentProps, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { DraggableWindow, DraggableWindowPosition, InlineFeedback, LayoutFurniImageView } from '../../common';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTable from '@/align-ui/components/ui/table';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { ArrowDownAZ, ArrowDownWideNarrow, ArrowUpWideNarrow, BarChart3, ChevronLeft, ChevronRight, Clock3, Hash, Loader2, Package, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';

interface PriceListItem
{
    itemBaseId: number;
    name: string;
    itemName: string;
    spriteId: number;
    tradeValue: number;
    rarityType: string | null;
    rarityDisplayName: string | null;
    rarityColor?: string | null;
    circulation: number;
    setName: string | null;
    lastUpdated?: string;
    activeListings?: number;
    marketplaceApproved?: boolean;
    lastSalePrice?: number | null;
    averageSalePrice?: number | null;
    totalSales?: number;
    productType: string;
}

interface PriceListStats
{
    averageValue: number;
    highestValue: number;
    totalValue: number;
    lastUpdated: string | null;
    rarityTypes: { name: string; displayName: string }[];
}

const FALLBACK_RARITY_TABS = [
    { name: 'og_rare', displayName: 'OG' },
    { name: 'weekly_rare', displayName: 'Wochen' },
    { name: 'monthly_rare', displayName: 'Monat' },
    { name: 'cashshop_rare', displayName: 'Cash' },
    { name: 'bonzen_rare', displayName: 'Bonzen' },
    { name: 'drachen_rare', displayName: 'Drachen' },
];

const SORT_OPTIONS = [
    { id: 'value_desc', label: 'Hoechster Wert', icon: ArrowDownWideNarrow },
    { id: 'value_asc', label: 'Niedrigster Wert', icon: ArrowUpWideNarrow },
    { id: 'name_asc', label: 'Name', icon: ArrowDownAZ },
    { id: 'updated_desc', label: 'Update', icon: Clock3 },
];

function getCmsUrl() { return GetConfiguration<string>('url.prefix', 'http://localhost:3030'); }

function CurrencyIcon({ className }: { className?: string })
{
    const url = GetConfiguration<string>('asset.url', 'http://localhost:8080');
    return <img src={ `${ url }/wallet/-1.png` } alt="credits" className={ className || 'w-4 h-4' } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
}

function formatNumber(value?: number | null)
{
    return (value ?? 0).toLocaleString('de-DE');
}

function formatDate(value?: string | null)
{
    if(!value) return 'Keine Daten';
    try { return new Date(value).toLocaleDateString('de-DE'); }
    catch { return 'Keine Daten'; }
}

function rarityColor(rarityType?: string | null): ComponentProps<typeof AlignBadge.Root>['color']
{
    if(rarityType === 'og_rare') return 'yellow';
    if(rarityType === 'weekly_rare') return 'green';
    if(rarityType === 'monthly_rare') return 'purple';
    if(rarityType === 'cashshop_rare') return 'orange';
    if(rarityType === 'bonzen_rare') return 'blue';
    if(rarityType === 'drachen_rare') return 'red';
    return 'gray';
}

export const PriceListView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ items, setItems ] = useState<PriceListItem[]>([]);
    const [ selectedItem, setSelectedItem ] = useState<PriceListItem | null>(null);
    const [ stats, setStats ] = useState<PriceListStats | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState('');
    const [ search, setSearch ] = useState('');
    const [ activeTab, setActiveTab ] = useState('');
    const [ sortBy, setSortBy ] = useState('value_desc');
    const [ minValue, setMinValue ] = useState('');
    const [ maxValue, setMaxValue ] = useState('');
    const [ page, setPage ] = useState(1);
    const [ total, setTotal ] = useState(0);
    const [ totalPages, setTotalPages ] = useState(1);
    const [ lastUpdate, setLastUpdate ] = useState<number | null>(null);
    const [ refreshTick, setRefreshTick ] = useState(0);
    const [ feedback, setFeedback ] = useState<{ tone: 'success' | 'error' | 'info' | 'pending'; message: string } | null>(null);
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showFeedback = useCallback((tone: 'success' | 'error' | 'info' | 'pending', message: string, autoDismissMs: number = 4000) =>
    {
        if(feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedback({ tone, message });
        if(autoDismissMs > 0) feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), autoDismissMs);
    }, []);

    useEffect(() => () =>
    {
        if(feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    }, []);

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
            eventUrlPrefix: 'pricelist/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const fetchItems = useCallback(async (silent: boolean = false) =>
    {
        if(!isVisible) return;
        if(!silent) setLoading(true);
        setError('');
        try
        {
            const params = new URLSearchParams();
            if(search.trim()) params.set('search', search.trim());
            if(activeTab) params.set('rarityType', activeTab);
            if(minValue) params.set('minValue', minValue);
            if(maxValue) params.set('maxValue', maxValue);
            params.set('sort', sortBy);
            params.set('page', page.toString());
            params.set('limit', '36');

            const response = await fetch(`${ getCmsUrl() }/api/pricelist?${ params.toString() }`);
            if(!response.ok) throw new Error('request failed');
            const data = await response.json();

            const resolvedItems = (data.items || []).map((item: PriceListItem) =>
            {
                const floorData = GetSessionDataManager().getFloorItemData(item.itemBaseId);
                const wallData = !floorData ? GetSessionDataManager().getWallItemData(item.itemBaseId) : null;
                const displayName = floorData?.name || wallData?.name || item.name;
                const productType = floorData ? 's' : 'i';
                return { ...item, name: displayName, productType };
            });

            setItems(resolvedItems);
            setStats(data.stats ?? null);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages || 1);
            setSelectedItem(prev => resolvedItems.find((item: PriceListItem) => item.itemBaseId === prev?.itemBaseId) ?? resolvedItems[0] ?? null);
            setLastUpdate(Date.now());
        }
        catch
        {
            if(!silent)
            {
                setItems([]);
                setSelectedItem(null);
                setError('Preisliste konnte nicht geladen werden');
            }
        }
        finally { if(!silent) setLoading(false); }
    }, [ isVisible, search, activeTab, minValue, maxValue, sortBy, page ]);

    useEffect(() => { fetchItems(); }, [ fetchItems ]);
    useEffect(() => { setPage(1); }, [ search, activeTab, minValue, maxValue, sortBy ]);

    // Auto-refresh every 30s while visible (silent)
    useEffect(() =>
    {
        if(!isVisible) return;
        const id = setInterval(() => fetchItems(true), 30000);
        return () => clearInterval(id);
    }, [ isVisible, fetchItems ]);

    // Tick every 5s so "vor X Sek." stays fresh without re-fetching
    useEffect(() =>
    {
        if(!isVisible) return;
        const id = setInterval(() => setRefreshTick(t => t + 1), 5000);
        return () => clearInterval(id);
    }, [ isVisible ]);

    const handleManualRefresh = useCallback(() =>
    {
        fetchItems(true).then(() => showFeedback('success', 'Preisliste aktualisiert'));
    }, [ fetchItems, showFeedback ]);

    const updateAgo = useMemo(() =>
    {
        if(!lastUpdate) return null;
        const sec = Math.max(0, Math.floor((Date.now() - lastUpdate) / 1000));
        if(sec < 5) return 'gerade eben';
        if(sec < 60) return `vor ${ sec }s`;
        const min = Math.floor(sec / 60);
        if(min < 60) return `vor ${ min }m`;
        return `vor ${ Math.floor(min / 60) }h`;
    // refreshTick forces re-eval
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ lastUpdate, refreshTick ]);

    const rarityTabs = useMemo(() => stats?.rarityTypes?.length ? stats.rarityTypes : FALLBACK_RARITY_TABS, [ stats ]);
    const onClose = useCallback(() => setIsVisible(false), []);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="pricelist" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <AlignTooltip.Provider delayDuration={ 180 }>
                <AlignSurface.Panel className="flex w-[1040px] max-w-[94vw] overflow-hidden flex-col" style={ { maxHeight: '84vh' } }>
                    <AlignSurface.Header
                        title={
                            <div className="drag-handler flex cursor-grab active:cursor-grabbing select-none items-center gap-2">
                                <BarChart3 className="size-4 text-text-sub-600" />
                                <span>Preisliste</span>
                                <AlignBadge.Root color="gray" variant="lighter" size="small" square>{ formatNumber(total) } Items</AlignBadge.Root>
                                { updateAgo && (
                                    <span className="text-paragraph-xs text-text-soft-400">· { updateAgo }</span>
                                ) }
                                <button
                                    type="button"
                                    onClick={ handleManualRefresh }
                                    onPointerDown={ (e) => e.stopPropagation() }
                                    title="Jetzt aktualisieren"
                                    className="ml-1 inline-flex size-6 items-center justify-center rounded-md text-text-sub-600 transition-colors hover:bg-bg-weak-50 hover:text-text-strong-950 disabled:opacity-50"
                                    disabled={ loading }
                                >
                                    <RefreshCw className={ `size-3.5 ${ loading ? 'animate-spin' : '' }` } />
                                </button>
                            </div>
                        }
                        description="Recherche, Wertentwicklung und Marktplatz-Signale"
                        onClose={ onClose }
                        className="drag-handler cursor-grab active:cursor-grabbing"
                    />

                    { feedback && (
                        <div className="mx-4 mt-3">
                            <InlineFeedback tone={ feedback.tone } message={ feedback.message } onDismiss={ () => setFeedback(null) } />
                        </div>
                    ) }

                    <div className="grid grid-cols-4 gap-2 bg-bg-weak-50 px-4 py-3">
                        { [
                            { label: 'Gesamtwert', value: formatNumber(stats?.totalValue), tone: 'yellow' as const },
                            { label: 'Durchschnitt', value: formatNumber(stats?.averageValue), tone: 'blue' as const },
                            { label: 'Top-Wert', value: formatNumber(stats?.highestValue), tone: 'green' as const },
                            { label: 'Letztes Update', value: formatDate(stats?.lastUpdated), tone: 'gray' as const },
                        ].map(card => (
                            <div key={ card.label } className="rounded-xl bg-bg-white-0 px-3 py-2 shadow-regular-xs">
                                <p className="text-subheading-2xs uppercase text-text-soft-400">{ card.label }</p>
                                <div className="mt-1 flex items-center gap-1.5 text-label-sm text-text-strong-950">
                                    { card.tone !== 'gray' && <CurrencyIcon className="size-3.5" /> }
                                    <span className="truncate tabular-nums">{ card.value }</span>
                                </div>
                            </div>
                        )) }
                    </div>

                    <div className="border-y border-stroke-soft-200 bg-bg-white-0 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <AlignInput.Root size="xsmall" className="flex-1">
                                <AlignInput.Wrapper className="h-8">
                                    <AlignInput.Icon as={ Search } className="size-4" />
                                    <AlignInput.Input placeholder="Name, Item-Code oder Set suchen..." value={ search } onChange={ (e) => setSearch(e.target.value) } className="h-8 text-paragraph-xs" />
                                    { search && (
                                        <button onClick={ () => setSearch('') } className="shrink-0 text-text-soft-400 hover:text-text-strong-950">
                                            <X className="size-3" />
                                        </button>
                                    ) }
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                            <AlignInput.Root size="xsmall" className="w-24">
                                <AlignInput.Wrapper className="h-8">
                                    <AlignInput.Input type="number" placeholder="Min" value={ minValue } onChange={ (e) => setMinValue(e.target.value) } className="h-8 text-paragraph-xs" />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                            <AlignInput.Root size="xsmall" className="w-24">
                                <AlignInput.Wrapper className="h-8">
                                    <AlignInput.Input type="number" placeholder="Max" value={ maxValue } onChange={ (e) => setMaxValue(e.target.value) } className="h-8 text-paragraph-xs" />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <AlignButton.Root variant={ activeTab === '' ? 'primary' : 'neutral' } mode={ activeTab === '' ? 'filled' : 'ghost' } size="xxsmall" onClick={ () => setActiveTab('') }>
                                Alle
                            </AlignButton.Root>
                            { rarityTabs.map(tab => (
                                <AlignButton.Root
                                    key={ tab.name }
                                    variant={ activeTab === tab.name ? 'primary' : 'neutral' }
                                    mode={ activeTab === tab.name ? 'filled' : 'ghost' }
                                    size="xxsmall"
                                    onClick={ () => setActiveTab(tab.name) }
                                >
                                    { tab.displayName }
                                </AlignButton.Root>
                            )) }
                            <AlignDivider.Root className="mx-1 h-5 w-px" />
                            { SORT_OPTIONS.map(option => {
                                const Icon = option.icon;
                                return (
                                    <AlignButton.Root
                                        key={ option.id }
                                        variant={ sortBy === option.id ? 'neutral' : 'neutral' }
                                        mode={ sortBy === option.id ? 'lighter' : 'ghost' }
                                        size="xxsmall"
                                        onClick={ () => setSortBy(option.id) }
                                    >
                                        <AlignButton.Icon as={ Icon } className="size-3.5" />
                                        { option.label }
                                    </AlignButton.Root>
                                );
                            }) }
                        </div>
                    </div>

                    { error && (
                        <div className="mx-4 mt-3 rounded-xl border border-error-base/30 bg-error-lighter px-3 py-2 text-paragraph-xs text-error-base">
                            { error }
                        </div>
                    ) }

                    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] gap-0">
                        <div className="min-w-0 overflow-y-auto bg-bg-white-0 px-4 py-3" style={ { maxHeight: 'calc(84vh - 220px)', scrollbarWidth: 'thin' } }>
                            { loading && (
                                <div className="flex items-center justify-center py-16 text-text-soft-400">
                                    <Loader2 className="size-5 animate-spin" />
                                </div>
                            ) }

                            { !loading && items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-text-soft-400">
                                    <Package className="mb-2 size-9" />
                                    <p className="text-label-sm text-text-sub-600">Keine passenden Preislisten-Einträge</p>
                                </div>
                            ) }

                            { !loading && items.length > 0 && (
                                <AlignTable.Root>
                                    <AlignTable.Header>
                                        <AlignTable.Row>
                                            <AlignTable.Head>Möbel</AlignTable.Head>
                                            <AlignTable.Head>Rarity</AlignTable.Head>
                                            <AlignTable.Head className="text-right">Wert</AlignTable.Head>
                                            <AlignTable.Head className="text-right">Markt</AlignTable.Head>
                                        </AlignTable.Row>
                                    </AlignTable.Header>
                                    <AlignTable.Body spacing={ 6 }>
                                        { items.map(item => (
                                            <AlignTable.Row
                                                key={ item.itemBaseId }
                                                onClick={ () => setSelectedItem(item) }
                                                className={ selectedItem?.itemBaseId === item.itemBaseId ? 'cursor-pointer rounded-xl bg-bg-weak-50' : 'cursor-pointer' }
                                            >
                                                <AlignTable.Cell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50">
                                                            <LayoutFurniImageView productType={ item.productType } productClassId={ item.spriteId } scale={ 0.5 } />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-label-sm text-text-strong-950">{ item.name }</p>
                                                            <p className="truncate text-paragraph-xs text-text-soft-400">{ item.itemName }</p>
                                                        </div>
                                                    </div>
                                                </AlignTable.Cell>
                                                <AlignTable.Cell>
                                                    <div className="flex flex-col items-start gap-1">
                                                        { item.rarityDisplayName ? (
                                                            <AlignBadge.Root color={ rarityColor(item.rarityType) } variant="lighter" size="small" square>
                                                                { item.rarityDisplayName }
                                                            </AlignBadge.Root>
                                                        ) : (
                                                            <AlignBadge.Root color="gray" variant="lighter" size="small" square>Standard</AlignBadge.Root>
                                                        ) }
                                                        { item.setName && <span className="max-w-[150px] truncate text-paragraph-xs text-text-soft-400">{ item.setName }</span> }
                                                    </div>
                                                </AlignTable.Cell>
                                                <AlignTable.Cell className="text-right">
                                                    <div className="inline-flex items-center justify-end gap-1.5 text-label-sm text-warning-base">
                                                        <CurrencyIcon className="size-4" />
                                                        <span className="tabular-nums">{ formatNumber(item.tradeValue) }</span>
                                                    </div>
                                                </AlignTable.Cell>
                                                <AlignTable.Cell className="text-right">
                                                    <div className="flex flex-col items-end gap-1 text-paragraph-xs text-text-sub-600">
                                                        <span>{ item.activeListings ?? 0 } aktiv</span>
                                                        <span>{ item.totalSales ?? 0 } Sales</span>
                                                    </div>
                                                </AlignTable.Cell>
                                            </AlignTable.Row>
                                        )) }
                                    </AlignTable.Body>
                                </AlignTable.Root>
                            ) }
                        </div>

                        <div className="border-l border-stroke-soft-200 bg-bg-weak-50 p-4">
                            { selectedItem ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-bg-white-0 shadow-regular-xs">
                                            <LayoutFurniImageView productType={ selectedItem.productType } productClassId={ selectedItem.spriteId } scale={ 0.65 } />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-label-md text-text-strong-950">{ selectedItem.name }</h3>
                                            <p className="truncate text-paragraph-xs text-text-soft-400">{ selectedItem.itemName }</p>
                                            { selectedItem.marketplaceApproved && (
                                                <AlignBadge.Root color="green" variant="lighter" size="small" square className="mt-2">
                                                    <ShieldCheck className="mr-1 size-3" />Handelbar
                                                </AlignBadge.Root>
                                            ) }
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        { [
                                            { label: 'Preis', value: formatNumber(selectedItem.tradeValue), icon: CurrencyIcon },
                                            { label: 'Circulation', value: formatNumber(selectedItem.circulation), icon: Hash },
                                            { label: 'Aktive Angebote', value: formatNumber(selectedItem.activeListings), icon: Package },
                                            { label: 'Sales', value: formatNumber(selectedItem.totalSales), icon: BarChart3 },
                                        ].map(card => {
                                            const Icon = card.icon;
                                            return (
                                                <div key={ card.label } className="rounded-xl bg-bg-white-0 px-3 py-2 shadow-regular-xs">
                                                    <p className="text-subheading-2xs uppercase text-text-soft-400">{ card.label }</p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-label-sm text-text-strong-950">
                                                        <Icon className="size-3.5" />
                                                        <span className="tabular-nums">{ card.value }</span>
                                                    </div>
                                                </div>
                                            );
                                        }) }
                                    </div>

                                    <div className="rounded-xl bg-bg-white-0 p-3 shadow-regular-xs">
                                        <p className="text-label-xs text-text-strong-950">Recherche-Details</p>
                                        <div className="mt-2 space-y-2 text-paragraph-xs text-text-sub-600">
                                            <div className="flex justify-between gap-2">
                                                <span>Letzter Listenwert</span>
                                                <span>{ formatDate(selectedItem.lastUpdated) }</span>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <span>Letzter Sale</span>
                                                <span>{ selectedItem.lastSalePrice ? `${ formatNumber(selectedItem.lastSalePrice) } Credits` : 'Keine Daten' }</span>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <span>Durchschnitt Sale</span>
                                                <span>{ selectedItem.averageSalePrice ? `${ formatNumber(selectedItem.averageSalePrice) } Credits` : 'Keine Daten' }</span>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <span>Set</span>
                                                <span className="max-w-[120px] truncate text-right">{ selectedItem.setName ?? 'Kein Set' }</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-text-soft-400">
                                    <Package className="mb-2 size-8" />
                                    <span className="text-paragraph-xs">Item auswählen</span>
                                </div>
                            ) }
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between border-t border-stroke-soft-200 px-4 py-2">
                        <p className="text-paragraph-xs text-text-sub-600">
                            Seite <span className="tabular-nums">{ page }</span> von <span className="tabular-nums">{ totalPages }</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" disabled={ page <= 1 } onClick={ () => setPage((p) => Math.max(1, p - 1)) }>
                                <AlignButton.Icon as={ ChevronLeft } className="size-4" />
                            </AlignButton.Root>
                            <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" disabled={ page >= totalPages } onClick={ () => setPage((p) => Math.min(totalPages, p + 1)) }>
                                <AlignButton.Icon as={ ChevronRight } className="size-4" />
                            </AlignButton.Root>
                        </div>
                    </div>
                </AlignSurface.Panel>
            </AlignTooltip.Provider>
        </DraggableWindow>
    );
};
