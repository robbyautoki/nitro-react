import { FC, useEffect, useMemo } from 'react';
import { MarketPlaceOfferState } from '../../api';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { Coins, Package } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';

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
            { /* Credits to Redeem */ }
            { creditsWaiting > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-success-base/20 bg-success-lighter p-3">
                    <div className="flex items-center gap-2">
                        <Coins className="size-4 text-success-base" />
                        <span className="text-paragraph-xs text-success-base">
                            { soldOffers.length } sold — <span className="font-semibold">{ creditsWaiting.toLocaleString() } credits</span> waiting
                        </span>
                    </div>
                    <AlignButton.Root
                        variant="primary"
                        mode="lighter"
                        size="xxsmall"
                        onClick={ redeemCredits }
                    >
                        Redeem
                    </AlignButton.Root>
                </div>
            ) }
            { creditsWaiting <= 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3">
                    <Package className="size-4 text-text-soft-400" />
                    <span className="text-paragraph-xs text-text-sub-600">No sold items to redeem</span>
                </div>
            ) }
            { /* Active Offers */ }
            <div className="flex items-center justify-between">
                <span className="text-label-xs text-text-sub-600">
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
