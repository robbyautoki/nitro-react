import { FC, useCallback, useEffect, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { ItemInfoModal } from './ItemInfoModal';
import { CustomListing } from './CustomMarketplaceTypes';
import { Search, Package, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export const CustomMarketplaceBrowseView: FC<{}> = () =>
{
    const [ listings, setListings ] = useState<CustomListing[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ page, setPage ] = useState(0);
    const [ loading, setLoading ] = useState(true);

    const [ searchQuery, setSearchQuery ] = useState('');
    const [ minPrice, setMinPrice ] = useState('');
    const [ maxPrice, setMaxPrice ] = useState('');
    const [ currency, setCurrency ] = useState('');

    const [ error, setError ] = useState('');
    const myUserId = GetSessionDataManager().userId;

    // Info modal
    const [ infoTarget, setInfoTarget ] = useState<CustomListing | null>(null);

    // Offer dialog
    const [ offerTarget, setOfferTarget ] = useState<CustomListing | null>(null);
    const [ offerPrice, setOfferPrice ] = useState('');
    const [ offerSubmitting, setOfferSubmitting ] = useState(false);

    const doSearch = useCallback((p: number = 0) =>
    {
        setLoading(true);
        setPage(p);
        CustomMarketplaceApi.browse({
            q: searchQuery || undefined,
            minPrice: parseInt(minPrice) || undefined,
            maxPrice: parseInt(maxPrice) || undefined,
            currency: currency || undefined,
            page: p,
        })
            .then(data =>
            {
                setListings(data.listings ?? []);
                setTotal(data.total ?? 0);
            })
            .finally(() => setLoading(false));
    }, [ searchQuery, minPrice, maxPrice, currency ]);

    useEffect(() => { doSearch(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleBuy = async (listing: CustomListing) =>
    {
        if(!confirm(`${ listing.price.toLocaleString() } ${ listing.currency } bezahlen?`)) return;
        setError('');
        const res = await CustomMarketplaceApi.buy(listing.id);
        if(res.ok) doSearch(page);
        else setError(res.error || 'Kauf fehlgeschlagen');
    };

    const handleMakeOffer = async () =>
    {
        if(!offerTarget) return;
        const p = parseInt(offerPrice);
        if(!p || p < 1) return;
        setOfferSubmitting(true);
        setError('');
        const res = await CustomMarketplaceApi.makeOffer(offerTarget.id, p);
        setOfferSubmitting(false);
        if(res.ok) { setOfferTarget(null); setOfferPrice(''); doSearch(page); }
        else setError(res.error || 'Anfrage fehlgeschlagen');
    };

    const totalPages = Math.ceil(total / 20);

    return (
        <div className="flex flex-col gap-3">
            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                    <span className="text-[11px] text-red-300">{ error }</span>
                </div>
            ) }

            {/* Filters */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input
                        className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                        type="text"
                        placeholder="Item suchen..."
                        value={ searchQuery }
                        onChange={ e => setSearchQuery(e.target.value) }
                        onKeyDown={ e => e.key === 'Enter' && doSearch(0) }
                    />
                    <button
                        className="h-7 px-3 rounded-lg bg-white/[0.1] text-white/80 text-[11px] font-medium hover:bg-white/[0.15] transition-all flex items-center gap-1"
                        onClick={ () => doSearch(0) }
                    >
                        <Search className="size-3" />
                        Suchen
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        className="w-20 h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                        type="number"
                        min={ 0 }
                        placeholder="Min"
                        value={ minPrice }
                        onChange={ e => setMinPrice(e.target.value) }
                    />
                    <span className="text-white/30 text-[11px]">-</span>
                    <input
                        className="w-20 h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                        type="number"
                        min={ 0 }
                        placeholder="Max"
                        value={ maxPrice }
                        onChange={ e => setMaxPrice(e.target.value) }
                    />
                    <select
                        className="h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none"
                        value={ currency }
                        onChange={ e => { setCurrency(e.target.value); } }
                    >
                        <option value="" className="bg-zinc-900">Alle Währungen</option>
                        <option value="credits" className="bg-zinc-900">Credits</option>
                        <option value="pixels" className="bg-zinc-900">Pixel</option>
                        <option value="points" className="bg-zinc-900">Punkte</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">
                    { total > 0 ? `${ total } Angebot${ total !== 1 ? 'e' : '' }` : 'Keine Angebote gefunden' }
                </span>
                { totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded text-white/30 hover:text-white/60 disabled:opacity-30"
                            disabled={ page === 0 }
                            onClick={ () => doSearch(page - 1) }
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <span className="text-[10px] text-white/40">{ page + 1 }/{ totalPages }</span>
                        <button
                            className="p-1 rounded text-white/30 hover:text-white/60 disabled:opacity-30"
                            disabled={ page >= totalPages - 1 }
                            onClick={ () => doSearch(page + 1) }
                        >
                            <ChevronRight className="size-3.5" />
                        </button>
                    </div>
                ) }
            </div>

            { loading && <div className="text-center py-8 text-white/30 text-xs">Laden...</div> }

            { !loading && listings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <Package className="size-10 mb-2" />
                    <span className="text-xs">Keine Angebote vorhanden</span>
                </div>
            ) }

            { !loading && (
                <div className="flex flex-col gap-1.5">
                    { listings.map(listing => (
                        <CustomListingCard
                            key={ listing.id }
                            listing={ listing }
                            mode="browse"
                            isMine={ listing.seller_id === myUserId }
                            onBuy={ () => handleBuy(listing) }
                            onOffer={ () => { setOfferTarget(listing); setOfferPrice(''); } }
                            onInfo={ () => setInfoTarget(listing) }
                        />
                    )) }
                </div>
            ) }

            {/* Info Modal */}
            { infoTarget && <ItemInfoModal listing={ infoTarget } onClose={ () => setInfoTarget(null) } /> }

            {/* Offer Dialog */}
            { offerTarget && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={ () => setOfferTarget(null) } />
                    <div className="relative w-[320px] rounded-xl border border-white/[0.08] bg-[rgba(12,12,16,0.98)] p-4 shadow-2xl">
                        <h3 className="text-sm font-semibold text-white/90 mb-3">Anfrage stellen</h3>
                        <p className="text-[11px] text-white/50 mb-2">
                            { offerTarget.items[0]?.public_name } — Listenpreis: { offerTarget.price.toLocaleString() } { offerTarget.currency }
                        </p>
                        <div className="flex flex-col gap-2">
                            <input
                                className="h-8 px-3 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                                type="number"
                                min={ 1 }
                                placeholder="Dein Angebotspreis"
                                value={ offerPrice }
                                onChange={ e => setOfferPrice(e.target.value) }
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 h-8 rounded-lg bg-blue-500/20 text-blue-400 text-[11px] font-medium hover:bg-blue-500/30 transition-all disabled:opacity-40"
                                    onClick={ handleMakeOffer }
                                    disabled={ offerSubmitting || !offerPrice }
                                >
                                    { offerSubmitting ? 'Wird gesendet...' : 'Anfrage senden' }
                                </button>
                                <button
                                    className="h-8 px-3 rounded-lg bg-white/[0.06] text-white/50 text-[11px] font-medium hover:bg-white/10 transition-all"
                                    onClick={ () => setOfferTarget(null) }
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) }
        </div>
    );
};
