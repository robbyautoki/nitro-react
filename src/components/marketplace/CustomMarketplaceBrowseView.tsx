import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CurrencyIcon } from './marketplace-components';
import { fmtC, CURRENCY_LABELS } from './marketplace-utils';
import { CustomListing } from './CustomMarketplaceTypes';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignModal from '@/align-ui/components/ui/modal';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Package, RefreshCw, Search, X } from 'lucide-react';

export const CustomMarketplaceBrowseView: FC<{}> = () =>
{
    const [ listings, setListings ] = useState<CustomListing[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ page, setPage ] = useState(0);
    const [ loading, setLoading ] = useState(true);

    const [ searchQuery, setSearchQuery ] = useState('');
    const [ minPrice, setMinPrice ] = useState('');
    const [ maxPrice, setMaxPrice ] = useState('');
    const [ currency, setCurrency ] = useState('all');
    const [ sortBy, setSortBy ] = useState('price_asc');

    const [ error, setError ] = useState('');
    const [ success, setSuccess ] = useState('');
    const [ watchlist, setWatchlist ] = useState<Set<number>>(new Set());
    const myUserId = GetSessionDataManager().userId;

    const [ offerTarget, setOfferTarget ] = useState<CustomListing | null>(null);
    const [ offerPrice, setOfferPrice ] = useState('');
    const [ offerSubmitting, setOfferSubmitting ] = useState(false);

    const [ buyTarget, setBuyTarget ] = useState<CustomListing | null>(null);
    const [ buySubmitting, setBuySubmitting ] = useState(false);

    const doSearch = useCallback((p: number = 0, sort?: string) =>
    {
        const s = sort ?? sortBy;
        setLoading(true);
        setPage(p);
        CustomMarketplaceApi.browse({
            q: searchQuery || undefined,
            minPrice: parseInt(minPrice) || undefined,
            maxPrice: parseInt(maxPrice) || undefined,
            currency: currency && currency !== 'all' ? currency : undefined,
            sort: s || undefined,
            page: p,
        })
            .then(data =>
            {
                setListings(data.listings ?? []);
                setTotal(data.total ?? 0);
                setError('');
            })
            .catch(() => setError('Angebote konnten nicht geladen werden'))
            .finally(() => setLoading(false));
    }, [ searchQuery, minPrice, maxPrice, currency, sortBy ]);

    useEffect(() =>
    {
        doSearch(0);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const confirmBuy = async () =>
    {
        if(!buyTarget) return;
        setBuySubmitting(true);
        setError('');
        setSuccess('');
        try
        {
            const res = await CustomMarketplaceApi.buy(buyTarget.id);
            if(res.ok)
            {
                const count = res.transferred_items?.length ?? buyTarget.items.length;
                setSuccess(`${ count } ${ count === 1 ? 'Möbel wurde' : 'Möbel wurden' } in dein Inventar übertragen.`);
                setBuyTarget(null);
                doSearch(page);
            }
            else setError(res.error || 'Kauf fehlgeschlagen');
        }
        catch
        {
            setError('Netzwerkfehler - bitte erneut versuchen');
        }
        finally
        {
            setBuySubmitting(false);
        }
    };

    const handleMakeOffer = async () =>
    {
        if(!offerTarget) return;
        const p = parseInt(offerPrice);
        if(!p || p < 1) return;
        setOfferSubmitting(true);
        setError('');
        setSuccess('');
        try
        {
            const res = await CustomMarketplaceApi.makeOffer(offerTarget.id, p);
            if(res.ok)
            {
                setSuccess('Dein Preisvorschlag wurde gesendet.');
                setOfferTarget(null);
                setOfferPrice('');
                doSearch(page);
            }
            else setError(res.error || 'Anfrage fehlgeschlagen');
        }
        catch
        {
            setError('Netzwerkfehler - bitte erneut versuchen');
        }
        finally
        {
            setOfferSubmitting(false);
        }
    };

    const toggleWatch = (id: number) => setWatchlist(prev =>
    {
        const n = new Set(prev);
        if(n.has(id)) n.delete(id); else n.add(id);
        return n;
    });

    const totalPages = Math.ceil(total / 20);
    const listingStats = useMemo(() =>
    {
        const totalValue = listings.reduce((sum, listing) => sum + listing.price, 0);
        const offers = listings.reduce((sum, listing) => sum + (listing.offer_count ?? 0), 0);
        const average = listings.length ? Math.round(totalValue / listings.length) : 0;
        const bundles = listings.filter(listing => listing.is_bundle).length;
        return { totalValue, offers, average, bundles };
    }, [ listings ]);

    return (
        <div className="flex h-full flex-col bg-bg-white-0">
            <div className="shrink-0 border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-3">
                <div className="flex items-center gap-2">
                    <AlignInput.Root size="xsmall" className="flex-1">
                        <AlignInput.Wrapper className="h-8">
                            <AlignInput.Icon as={ Search } className="size-4" />
                            <AlignInput.Input
                                placeholder="Möbel, Rarity oder Set suchen..."
                                value={ searchQuery }
                                onChange={ e => setSearchQuery(e.target.value) }
                                onKeyDown={ e => e.key === 'Enter' && doSearch(0) }
                                className="h-8 text-paragraph-xs"
                            />
                            { searchQuery && (
                                <button onClick={ () => setSearchQuery('') } className="text-text-soft-400 hover:text-text-strong-950">
                                    <X className="size-3" />
                                </button>
                            ) }
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                    <AlignInput.Root size="xsmall" className="w-20">
                        <AlignInput.Wrapper className="h-8">
                            <AlignInput.Input type="number" placeholder="Min" value={ minPrice } onChange={ e => setMinPrice(e.target.value) } className="h-8 text-paragraph-xs" />
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                    <AlignInput.Root size="xsmall" className="w-20">
                        <AlignInput.Wrapper className="h-8">
                            <AlignInput.Input type="number" placeholder="Max" value={ maxPrice } onChange={ e => setMaxPrice(e.target.value) } className="h-8 text-paragraph-xs" />
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                    <AlignSelect.Root value={ currency } onValueChange={ setCurrency } size="xsmall" variant="compact">
                        <AlignSelect.Trigger className="w-28">
                            <AlignSelect.Value />
                        </AlignSelect.Trigger>
                        <AlignSelect.Content>
                            <AlignSelect.Item value="all">Alle</AlignSelect.Item>
                            <AlignSelect.Item value="credits">Credits</AlignSelect.Item>
                            <AlignSelect.Item value="pixels">Pixel</AlignSelect.Item>
                            <AlignSelect.Item value="points">Punkte</AlignSelect.Item>
                        </AlignSelect.Content>
                    </AlignSelect.Root>
                    <FancyButton.Root variant="primary" size="xsmall" onClick={ () => doSearch(0) }>
                        <FancyButton.Icon as={ Search } className="size-4" />
                        Suchen
                    </FancyButton.Root>
                    <AlignButton.Root variant="neutral" mode="ghost" size="xsmall" onClick={ () => doSearch(page) }>
                        <AlignButton.Icon as={ RefreshCw } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    { [ { id: 'price_asc', label: 'Günstig' }, { id: 'price_desc', label: 'Teuer' }, { id: 'newest', label: 'Neu' } ].map(opt => (
                        <AlignButton.Root
                            key={ opt.id }
                            variant="neutral"
                            mode={ sortBy === opt.id ? 'lighter' : 'ghost' }
                            size="xxsmall"
                            className="text-label-xs"
                            onClick={ () =>
                            {
                                setSortBy(opt.id); doSearch(0, opt.id);
                            } }
                        >
                            { opt.label }
                        </AlignButton.Root>
                    )) }
                    <AlignDivider.Root className="mx-1 h-5 w-px" />
                    <AlignBadge.Root color="gray" variant="lighter" size="small" square>{ total || 0 } Ergebnisse</AlignBadge.Root>
                    { listings.length > 0 && (
                        <>
                            <AlignBadge.Root color="yellow" variant="lighter" size="small" square>{ fmtC(listingStats.average) } Schnitt</AlignBadge.Root>
                            <AlignBadge.Root color="blue" variant="lighter" size="small" square>{ fmtC(listingStats.totalValue) } sichtbar</AlignBadge.Root>
                            <AlignBadge.Root color="purple" variant="lighter" size="small" square>{ listingStats.bundles } Bundles</AlignBadge.Root>
                            { listingStats.offers > 0 && <AlignBadge.Root color="green" variant="lighter" size="small" square>{ listingStats.offers } Gebote</AlignBadge.Root> }
                        </>
                    ) }
                </div>
            </div>
            { error && (
                <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-error-base/30 bg-error-lighter px-3 py-2 text-paragraph-xs text-error-base">
                    <AlertTriangle className="size-4 shrink-0" />
                    { error }
                </div>
            ) }
            { success && (
                <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-success-base/30 bg-success-lighter px-3 py-2 text-paragraph-xs text-success-base">
                    <CheckCircle2 className="size-4 shrink-0" />
                    { success }
                </div>
            ) }
            <div className="min-h-0 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-soft-400">
                        <Loader2 className="mb-2 size-6 animate-spin" />
                        <p className="text-paragraph-xs">Angebote werden geladen...</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-soft-400">
                        <Package className="mb-2 size-9" />
                        <p className="text-label-sm text-text-sub-600">Keine Angebote</p>
                        <p className="mt-1 text-paragraph-xs">Passe Suche, Preis oder Währung an.</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        { listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="browse"
                                isMine={ listing.seller_id === myUserId }
                                isWatched={ watchlist.has(listing.id) }
                                onToggleWatch={ () => toggleWatch(listing.id) }
                                onBuy={ () => setBuyTarget(listing) }
                                onOffer={ () =>
                                {
                                    setOfferTarget(listing); setOfferPrice('');
                                } }
                            />
                        )) }
                    </div>
                ) }
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-stroke-soft-200 px-3 py-2">
                <p className="text-paragraph-xs text-text-sub-600">
                    Seite <span className="tabular-nums">{ page + 1 }</span>{ totalPages > 0 ? <> / <span className="tabular-nums">{ totalPages }</span></> : null }
                </p>
                <div className="flex items-center gap-1">
                    <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" disabled={ page === 0 } onClick={ () => doSearch(page - 1) }>
                        <AlignButton.Icon as={ ChevronLeft } className="size-4" />
                    </AlignButton.Root>
                    <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" disabled={ page >= totalPages - 1 } onClick={ () => doSearch(page + 1) }>
                        <AlignButton.Icon as={ ChevronRight } className="size-4" />
                    </AlignButton.Root>
                </div>
            </div>
            <AlignModal.Root open={ !!buyTarget } onOpenChange={ open => !open && !buySubmitting && setBuyTarget(null) }>
                { buyTarget && (
                    <AlignModal.Content className="max-w-[380px]" overlayClassName="z-[1000]" showClose={ false }>
                        <AlignModal.Header
                            title="Möbel kaufen"
                            description={ buyTarget.is_bundle ? `Bundle mit ${ buyTarget.items.length } Items` : buyTarget.items[0]?.public_name }
                        />
                        <AlignModal.Body className="space-y-4">
                            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                                <p className="text-paragraph-xs text-text-sub-600">Kaufpreis</p>
                                <div className="mt-1 flex items-center gap-2 text-label-lg text-text-strong-950">
                                    <CurrencyIcon type={ buyTarget.currency } className="size-5" />
                                    { fmtC(buyTarget.price) } { CURRENCY_LABELS[buyTarget.currency] ?? buyTarget.currency }
                                </div>
                            </div>
                            <p className="text-paragraph-sm text-text-sub-600">Nach dem Kauf wird das Angebot geschlossen und die enthaltenen Möbel werden deinem Inventar zugeordnet.</p>
                        </AlignModal.Body>
                        <AlignModal.Footer className="justify-end">
                            <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled={ buySubmitting } onClick={ () => setBuyTarget(null) }>Abbrechen</AlignButton.Root>
                            <FancyButton.Root variant="primary" size="small" disabled={ buySubmitting } onClick={ confirmBuy }>
                                { buySubmitting ? <><Loader2 className="size-4 animate-spin" />Kaufe...</> : 'Kaufen' }
                            </FancyButton.Root>
                        </AlignModal.Footer>
                    </AlignModal.Content>
                ) }
            </AlignModal.Root>
            <AlignModal.Root open={ !!offerTarget } onOpenChange={ open => !open && !offerSubmitting && setOfferTarget(null) }>
                { offerTarget && (
                    <AlignModal.Content className="max-w-[380px]" overlayClassName="z-[1000]" showClose={ false }>
                        <AlignModal.Header
                            title="Preisvorschlag"
                            description={ offerTarget.items[0]?.public_name }
                        />
                        <AlignModal.Body className="space-y-4">
                            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-sub-600">
                                Aktueller Preis: <span className="text-label-sm text-text-strong-950">{ fmtC(offerTarget.price) } { CURRENCY_LABELS[offerTarget.currency] ?? offerTarget.currency }</span>
                            </div>
                            <AlignInput.Root size="small">
                                <AlignInput.Wrapper className="h-10">
                                    <CurrencyIcon type={ offerTarget.currency } className="size-4" />
                                    <AlignInput.Input
                                        type="number"
                                        placeholder="Dein Gebot"
                                        value={ offerPrice }
                                        onChange={ e => setOfferPrice(e.target.value) }
                                        className="h-10 text-label-sm"
                                        autoFocus
                                    />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                        </AlignModal.Body>
                        <AlignModal.Footer className="justify-end">
                            <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled={ offerSubmitting } onClick={ () => setOfferTarget(null) }>Abbrechen</AlignButton.Root>
                            <FancyButton.Root variant="primary" size="small" disabled={ offerSubmitting || !offerPrice || Number(offerPrice) <= 0 } onClick={ handleMakeOffer }>
                                { offerSubmitting ? <><Loader2 className="size-4 animate-spin" />Sende...</> : 'Gebot senden' }
                            </FancyButton.Root>
                        </AlignModal.Footer>
                    </AlignModal.Content>
                ) }
            </AlignModal.Root>
        </div>
    );
};
