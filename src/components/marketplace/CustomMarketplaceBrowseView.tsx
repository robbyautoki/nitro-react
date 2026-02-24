import { FC, useCallback, useEffect, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CustomListing } from './CustomMarketplaceTypes';
import { Search, Package, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { LocalizeText } from '../../api';

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

    // Offer dialog
    const [ offerTarget, setOfferTarget ] = useState<CustomListing | null>(null);
    const [ offerPrice, setOfferPrice ] = useState('');
    const [ offerSubmitting, setOfferSubmitting ] = useState(false);

    // Buy confirmation dialog
    const [ buyTarget, setBuyTarget ] = useState<CustomListing | null>(null);
    const [ buySubmitting, setBuySubmitting ] = useState(false);

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
        setBuyTarget(listing);
    };

    const confirmBuy = async () =>
    {
        if(!buyTarget) return;
        setBuySubmitting(true);
        setError('');
        const res = await CustomMarketplaceApi.buy(buyTarget.id);
        setBuySubmitting(false);
        if(res.ok) { setBuyTarget(null); doSearch(page); }
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
        <div className="flex flex-col h-full gap-3 bg-[#0a0a0a] rounded-xl p-3 border border-white/[0.04]">
            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                    <span className="text-[11px] text-red-300">{ error }</span>
                </div>
            ) }

            {/* Filters */}
            <div className="flex flex-col gap-2 bg-black/50 p-3 rounded-lg border border-white/[0.05]">
                <div className="flex items-center gap-2">
                    <span className="w-[100px] text-[10px] uppercase font-bold text-white/40 tracking-[0.1em] shrink-0">Search Name</span>
                    <input
                        className="flex-1 h-7 px-2.5 text-xs font-mono rounded bg-black/40 border border-white/10 text-white/90 placeholder-white/20 outline-none focus:border-emerald-500/50 uppercase"
                        type="text"
                        placeholder="FURNI NAME..."
                        value={ searchQuery }
                        onChange={ e => setSearchQuery(e.target.value) }
                        onKeyDown={ e => e.key === 'Enter' && doSearch(0) }
                    />
                    <button
                        className="h-7 px-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono uppercase tracking-wider hover:bg-emerald-500/30 transition-colors flex items-center justify-center shrink-0"
                        onClick={ () => doSearch(0) }
                    >
                        SEARCH
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-[100px] text-[10px] uppercase font-bold text-white/40 tracking-[0.1em] shrink-0">Search Price</span>
                    <input
                        className="w-20 h-7 px-2 text-xs font-mono rounded bg-black/40 border border-white/10 text-amber-400 placeholder-white/20 outline-none focus:border-emerald-500/50"
                        type="number"
                        min={ 0 }
                        placeholder="MIN"
                        value={ minPrice }
                        onChange={ e => setMinPrice(e.target.value) }
                    />
                    <input
                        className="w-20 h-7 px-2 text-xs font-mono rounded bg-black/40 border border-white/10 text-amber-400 placeholder-white/20 outline-none focus:border-emerald-500/50"
                        type="number"
                        min={ 0 }
                        placeholder="MAX"
                        value={ maxPrice }
                        onChange={ e => setMaxPrice(e.target.value) }
                    />
                    
                    <div className="flex-1 bg-black/40 border border-white/10 rounded overflow-hidden ml-2">
                        <select
                            className="w-full h-7 px-2 text-xs font-mono bg-transparent border-0 text-white/80 outline-none uppercase"
                            value={ currency }
                            onChange={ e => { setCurrency(e.target.value); } }
                        >
                            <option value="" className="bg-black text-white">All Currencies</option>
                            <option value="credits" className="bg-black text-white">Credits</option>
                            <option value="pixels" className="bg-black text-white">Pixels</option>
                            <option value="points" className="bg-black text-white">Points</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 mt-2">
                <div className="flex items-center justify-between shrink-0 px-2 border-b border-white/[0.08] pb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold font-mono text-white/30 uppercase tracking-[0.1em]">
                            { total > 0 ? `${ total } MATCHES` : '0 MATCHES' }
                        </span>
                        { totalPages > 1 && (
                            <div className="flex items-center gap-1 bg-white/[0.05] rounded px-1">
                                <button
                                    className="p-0.5 rounded text-white/30 hover:text-white/60 disabled:opacity-30"
                                    disabled={ page === 0 }
                                    onClick={ () => doSearch(page - 1) }
                                >
                                    <ChevronLeft className="size-3" />
                                </button>
                                <span className="text-[9px] font-mono text-white/40">{ page + 1 }/{ totalPages }</span>
                                <button
                                    className="p-0.5 rounded text-white/30 hover:text-white/60 disabled:opacity-30"
                                    disabled={ page >= totalPages - 1 }
                                    onClick={ () => doSearch(page + 1) }
                                >
                                    <ChevronRight className="size-3" />
                                </button>
                            </div>
                        ) }
                    </div>
                    
                    <div className="flex items-center text-[10px] font-bold font-mono text-white/30 uppercase tracking-[0.1em] gap-4">
                        <span className="w-24 text-right">STATS</span>
                        <span className="w-24 text-right">PRICE</span>
                        <span className="w-32 text-center">ACTIONS</span>
                    </div>
                </div>

                <div className="flex flex-col overflow-auto h-full rounded border border-white/[0.04] bg-[#050505]">
                    { loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-500/50 text-xs gap-2 py-8">
                            <span className="text-xs font-mono uppercase tracking-[0.2em]">FETCHING DATA...</span>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-xs gap-2 py-8">
                            <span className="text-3xl font-mono opacity-50">¯\_(ツ)_/¯</span>
                            <span className="font-mono uppercase tracking-[0.1em]">No market data available</span>
                        </div>
                    ) : (
                        listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="browse"
                                isMine={ listing.seller_id === myUserId }
                                onBuy={ () => handleBuy(listing) }
                                onOffer={ () => { setOfferTarget(listing); setOfferPrice(''); } }
                            />
                        ))
                    ) }
                </div>
            </div>

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

            {/* Buy Confirmation Dialog */}
            { buyTarget && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={ () => !buySubmitting && setBuyTarget(null) } />
                    <div className="relative w-[320px] rounded-xl border border-white/[0.08] bg-[rgba(12,12,16,0.98)] p-4 shadow-2xl">
                        <h3 className="text-sm font-semibold text-white/90 mb-3">Kauf bestätigen</h3>
                        <p className="text-[11px] text-white/50 mb-1">
                            { buyTarget.is_bundle
                                ? `Bundle (${ buyTarget.items.length } Items)`
                                : buyTarget.items[0]?.public_name
                            }
                        </p>
                        <p className="text-xs text-white/70 mb-3">
                            Preis: <span className="font-semibold text-amber-400">{ buyTarget.price.toLocaleString() } { buyTarget.currency === 'credits' ? 'Credits' : buyTarget.currency === 'pixels' ? 'Pixel' : 'Punkte' }</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                className="flex-1 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-40"
                                onClick={ confirmBuy }
                                disabled={ buySubmitting }
                            >
                                { buySubmitting ? 'Wird gekauft...' : 'Jetzt kaufen' }
                            </button>
                            <button
                                className="h-8 px-3 rounded-lg bg-white/[0.06] text-white/50 text-[11px] font-medium hover:bg-white/10 transition-all"
                                onClick={ () => setBuyTarget(null) }
                                disabled={ buySubmitting }
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            ) }
        </div>
    );
};
