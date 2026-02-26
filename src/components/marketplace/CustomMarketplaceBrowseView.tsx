import { FC, useCallback, useEffect, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CurrencyIcon } from './marketplace-components';
import { fmtC, CURRENCY_ICONS } from './marketplace-utils';
import { CustomListing } from './CustomMarketplaceTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Package, ChevronLeft, ChevronRight, AlertTriangle, Gavel, Loader2 } from 'lucide-react';

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
    const [ sortBy, setSortBy ] = useState('price_asc');

    const [ error, setError ] = useState('');
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
            currency: currency || undefined,
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

    useEffect(() => { doSearch(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const confirmBuy = async () =>
    {
        if(!buyTarget) return;
        setBuySubmitting(true);
        setError('');
        try
        {
            const res = await CustomMarketplaceApi.buy(buyTarget.id);
            if(res.ok) { setBuyTarget(null); doSearch(page); }
            else setError(res.error || 'Kauf fehlgeschlagen');
        }
        catch { setError('Netzwerkfehler — bitte erneut versuchen'); }
        finally { setBuySubmitting(false); }
    };

    const handleMakeOffer = async () =>
    {
        if(!offerTarget) return;
        const p = parseInt(offerPrice);
        if(!p || p < 1) return;
        setOfferSubmitting(true);
        setError('');
        try
        {
            const res = await CustomMarketplaceApi.makeOffer(offerTarget.id, p);
            if(res.ok) { setOfferTarget(null); setOfferPrice(''); doSearch(page); }
            else setError(res.error || 'Anfrage fehlgeschlagen');
        }
        catch { setError('Netzwerkfehler — bitte erneut versuchen'); }
        finally { setOfferSubmitting(false); }
    };

    const toggleWatch = (id: number) => setWatchlist(prev =>
    {
        const n = new Set(prev);
        if(n.has(id)) n.delete(id); else n.add(id);
        return n;
    });

    const totalPages = Math.ceil(total / 20);

    return (
        <div className="flex flex-col h-full">
            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <span className="text-[11px] text-destructive">{ error }</span>
                </div>
            ) }

            {/* Filter Bar */}
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                    <Input
                        placeholder="Suchen..."
                        value={ searchQuery }
                        onChange={ e => setSearchQuery(e.target.value) }
                        onKeyDown={ e => e.key === 'Enter' && doSearch(0) }
                        className="pl-7 h-6 text-[11px]"
                    />
                </div>
                <Input
                    type="number"
                    placeholder="Min"
                    value={ minPrice }
                    onChange={ e => setMinPrice(e.target.value) }
                    className="w-16 h-6 text-[11px]"
                />
                <Input
                    type="number"
                    placeholder="Max"
                    value={ maxPrice }
                    onChange={ e => setMaxPrice(e.target.value) }
                    className="w-16 h-6 text-[11px]"
                />
                <Select value={ currency } onValueChange={ setCurrency }>
                    <SelectTrigger className="w-24 h-6 text-[10px]">
                        <SelectValue placeholder="Währung" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="credits">Credits</SelectItem>
                        <SelectItem value="pixels">Pixel</SelectItem>
                        <SelectItem value="points">Punkte</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={ () => doSearch(0) }>
                    <Search className="w-3 h-3 mr-1" />Suchen
                </Button>
                <Separator orientation="vertical" className="h-3.5" />
                { [ { id: 'price_asc', label: 'Günstig' }, { id: 'price_desc', label: 'Teuer' }, { id: 'newest', label: 'Neu' } ].map(opt => (
                    <button
                        key={ opt.id }
                        onClick={ () => { setSortBy(opt.id); doSearch(0, opt.id); } }
                        className={ `px-1.5 py-0.5 rounded text-[9px] font-medium ${ sortBy === opt.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50' }` }
                    >
                        { opt.label }
                    </button>
                )) }
            </div>

            {/* Results Header */}
            <div className="shrink-0 flex items-center justify-between px-2.5 py-1 border-b border-border/20">
                <span className="text-[10px] text-muted-foreground/50">
                    { total > 0 ? `${ total } Ergebnis${ total !== 1 ? 'se' : '' }` : 'Keine Ergebnisse' }
                </span>
                { totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            className="p-0.5 rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-30"
                            disabled={ page === 0 }
                            onClick={ () => doSearch(page - 1) }
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] text-muted-foreground/50">{ page + 1 }/{ totalPages }</span>
                        <button
                            className="p-0.5 rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-30"
                            disabled={ page >= totalPages - 1 }
                            onClick={ () => doSearch(page + 1) }
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                ) }
            </div>

            {/* Listing Rows */}
            <ScrollArea className="flex-1 min-h-0">
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-xs">Laden...</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">Keine Angebote</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        { listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="browse"
                                isMine={ listing.seller_id === myUserId }
                                isWatched={ watchlist.has(listing.id) }
                                onToggleWatch={ () => toggleWatch(listing.id) }
                                onBuy={ () => setBuyTarget(listing) }
                                onOffer={ () => { setOfferTarget(listing); setOfferPrice(''); } }
                            />
                        )) }
                    </div>
                ) }
            </ScrollArea>

            {/* Buy Confirmation Dialog */}
            <AlertDialog open={ !!buyTarget } onOpenChange={ o => !o && !buySubmitting && setBuyTarget(null) }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CurrencyIcon type={ buyTarget?.currency ?? 'credits' } className="w-5 h-5" />
                            Möbel kaufen
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du <span className="font-semibold text-foreground">
                                { buyTarget?.is_bundle
                                    ? `Bundle (${ buyTarget.items.length } Items)`
                                    : buyTarget?.items[0]?.public_name
                                }
                            </span> für <span className="font-bold text-amber-500">{ buyTarget ? fmtC(buyTarget.price) : 0 } { buyTarget?.currency === 'credits' ? 'Credits' : buyTarget?.currency === 'pixels' ? 'Pixel' : 'Punkte' }</span> kaufen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ buySubmitting }>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={ confirmBuy } disabled={ buySubmitting }>
                            { buySubmitting ? 'Wird gekauft...' : 'Kaufen' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bid Dialog */}
            <Dialog open={ !!offerTarget } onOpenChange={ o => !o && setOfferTarget(null) }>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-blue-500" />
                            Preisvorschlag
                        </DialogTitle>
                        <DialogDescription>
                            Gib deinen Preisvorschlag für <span className="font-semibold text-foreground">{ offerTarget?.items[0]?.public_name }</span> ab. Aktueller Preis: <span className="font-bold text-amber-500">{ offerTarget ? fmtC(offerTarget.price) : 0 } { offerTarget?.currency === 'credits' ? 'Credits' : offerTarget?.currency ?? '' }</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative">
                        <CurrencyIcon type={ offerTarget?.currency ?? 'credits' } className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <Input
                            type="number"
                            placeholder="Dein Gebot"
                            value={ offerPrice }
                            onChange={ e => setOfferPrice(e.target.value) }
                            className="pl-9 h-10 text-base font-bold"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={ () => setOfferTarget(null) }>Abbrechen</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" disabled={ offerSubmitting || !offerPrice || Number(offerPrice) <= 0 } onClick={ handleMakeOffer }>
                            <Gavel className="w-3.5 h-3.5 mr-1.5" />
                            { offerSubmitting ? 'Wird gesendet...' : 'Gebot senden' }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
