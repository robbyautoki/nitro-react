import { FC, useEffect, useMemo } from 'react';
import { MarketPlaceOfferState } from '../../api';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { Coins, Package } from 'lucide-react';

export const MarketplaceOwnOffersView: FC<{}> = () =>
{
    const { ownOffers, creditsWaiting, requestOwnOffers, cancelOffer, redeemCredits } = useMarketplace();

    useEffect(() =>
    {
        requestOwnOffers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const soldOffers = useMemo(() => ownOffers.filter(o => o.status === MarketPlaceOfferState.SOLD), [ ownOffers ]);
    const activeOffers = useMemo(() => ownOffers.filter(o => o.status !== MarketPlaceOfferState.SOLD), [ ownOffers ]);

    return (
        <div className="flex flex-col gap-3">
            {/* Credits to Redeem */}
            { creditsWaiting > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                        <Coins className="size-4 text-emerald-400" />
                        <span className="text-xs text-emerald-300">
                            { soldOffers.length } sold — <span className="font-semibold">{ creditsWaiting.toLocaleString() } credits</span> waiting
                        </span>
                    </div>
                    <button
                        className="h-7 px-3 rounded-lg bg-emerald-500/30 text-emerald-300 text-[11px] font-medium hover:bg-emerald-500/40 transition-all"
                        onClick={ redeemCredits }
                    >
                        Redeem
                    </button>
                </div>
            ) }

            { creditsWaiting <= 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Package className="size-4 text-white/30" />
                    <span className="text-[11px] text-white/40">No sold items to redeem</span>
                </div>
            ) }

            {/* Active Offers */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/50">
                    { activeOffers.length > 0
                        ? `${ activeOffers.length } active listing${ activeOffers.length !== 1 ? 's' : '' }`
                        : 'No active listings'
                    }
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                { activeOffers.map(offer => (
                    <MarketplaceItemCard
                        key={ offer.offerId }
                        offerData={ offer }
                        type="own"
                        onAction={ cancelOffer }
                    />
                )) }
            </div>
        </div>
    );
};
