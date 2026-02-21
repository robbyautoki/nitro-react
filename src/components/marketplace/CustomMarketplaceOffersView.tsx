import { FC, useEffect, useState, useCallback } from 'react';
import { GetConfiguration } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomOffer } from './CustomMarketplaceTypes';
import { MessageCircle, Package, Coins, User, Check, X } from 'lucide-react';

const CURRENCY_COLORS: Record<string, string> = {
    credits: 'text-amber-400/80',
    pixels: 'text-purple-400/80',
    points: 'text-emerald-400/80',
};

function getFurniIcon(itemName: string)
{
    const baseUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
    return `${ baseUrl }${ itemName.split('*')[0] }_icon.png`;
}

export const CustomMarketplaceOffersView: FC<{}> = () =>
{
    const [ offers, setOffers ] = useState<CustomOffer[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ processing, setProcessing ] = useState<number | null>(null);

    const loadOffers = useCallback(() =>
    {
        setLoading(true);
        CustomMarketplaceApi.myOffersReceived()
            .then(data => setOffers(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadOffers(); }, [ loadOffers ]);

    const handleAccept = async (offerId: number) =>
    {
        setProcessing(offerId);
        const res = await CustomMarketplaceApi.acceptOffer(offerId);
        if(res.ok) setOffers(prev => prev.filter(o => o.offer_id !== offerId));
        setProcessing(null);
    };

    const handleReject = async (offerId: number) =>
    {
        setProcessing(offerId);
        const res = await CustomMarketplaceApi.rejectOffer(offerId);
        if(res.ok) setOffers(prev => prev.filter(o => o.offer_id !== offerId));
        setProcessing(null);
    };

    if(loading) return <div className="text-center py-8 text-white/30 text-xs">Laden...</div>;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <MessageCircle className="size-3.5 text-white/40" />
                <span className="text-[11px] font-medium text-white/50">
                    { offers.length > 0
                        ? `${ offers.length } offene Anfrage${ offers.length !== 1 ? 'n' : '' }`
                        : 'Keine Anfragen vorhanden'
                    }
                </span>
            </div>

            { offers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <MessageCircle className="size-10 mb-2" />
                    <span className="text-xs">Keine offenen Anfragen</span>
                </div>
            ) }

            <div className="flex flex-col gap-1.5">
                { offers.map(offer =>
                {
                    const mainItem = offer.items[0];
                    const currColor = CURRENCY_COLORS[offer.currency] ?? 'text-white/60';
                    const isProcessing = processing === offer.offer_id;

                    return (
                        <div key={ offer.offer_id } className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                            {/* Item Image */}
                            <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                { mainItem ? (
                                    <img
                                        src={ getFurniIcon(mainItem.item_name) }
                                        alt={ mainItem.public_name }
                                        className="max-w-full max-h-full object-contain"
                                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                    />
                                ) : (
                                    <Package className="size-4 text-white/20" />
                                ) }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white/80 truncate">
                                    { offer.items.length > 1 ? `Bundle (${ offer.items.length } Items)` : mainItem?.public_name ?? 'Unknown' }
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className={ `flex items-center gap-1 text-[11px] ${ currColor }` }>
                                        <Coins className="size-3" />
                                        <span className="line-through opacity-50">{ offer.listing_price.toLocaleString() }</span>
                                        { ' → ' }
                                        <span className="font-semibold">{ offer.offer_price.toLocaleString() }</span>
                                    </span>
                                    { offer.buyer && (
                                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                                            <User className="size-3" />
                                            { offer.buyer.username }
                                        </span>
                                    ) }
                                </div>
                            </div>

                            {/* Accept / Reject */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    className="h-7 px-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
                                    onClick={ () => handleAccept(offer.offer_id) }
                                    disabled={ isProcessing }
                                >
                                    <Check className="size-3" />
                                    Annehmen
                                </button>
                                <button
                                    className="h-7 px-2.5 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
                                    onClick={ () => handleReject(offer.offer_id) }
                                    disabled={ isProcessing }
                                >
                                    <X className="size-3" />
                                    Ablehnen
                                </button>
                            </div>
                        </div>
                    );
                }) }
            </div>
        </div>
    );
};
