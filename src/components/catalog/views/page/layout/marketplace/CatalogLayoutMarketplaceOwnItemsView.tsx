import { CancelMarketplaceOfferMessageComposer, GetMarketplaceOwnOffersMessageComposer, MarketplaceCancelOfferResultEvent, MarketplaceOwnOffersEvent, RedeemMarketplaceOfferCreditsMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, NotificationAlertType, SendMessageComposer } from '../../../../../../api';
import { useMessageEvent, useNotification } from '../../../../../../hooks';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { CatalogLayoutMarketplaceItemView, OWN_OFFER } from './CatalogLayoutMarketplaceItemView';

export const CatalogLayoutMarketplaceOwnItemsView: FC<CatalogLayoutProps> = props =>
{
    const [ creditsWaiting, setCreditsWaiting ] = useState(0);
    const [ offers, setOffers ] = useState<MarketplaceOfferData[]>([]);
    const { simpleAlert = null } = useNotification();

    useMessageEvent<MarketplaceOwnOffersEvent>(MarketplaceOwnOffersEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        const offers = parser.offers.map(offer =>
        {
            const newOffer = new MarketplaceOfferData(offer.offerId, offer.furniId, offer.furniType, offer.extraData, offer.stuffData, offer.price, offer.status, offer.averagePrice, offer.offerCount);

            newOffer.timeLeftMinutes = offer.timeLeftMinutes;

            return newOffer;
        });

        setCreditsWaiting(parser.creditsWaiting);
        setOffers(offers);
    });

    useMessageEvent<MarketplaceCancelOfferResultEvent>(MarketplaceCancelOfferResultEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        if(!parser.success)
        {
            simpleAlert(LocalizeText('catalog.marketplace.cancel_failed'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.marketplace.operation_failed.topic'));

            return;
        }

        setOffers(prevValue => prevValue.filter(value => (value.offerId !== parser.offerId)));
    });

    const soldOffers = useMemo(() =>
    {
        return offers.filter(value => (value.status === MarketPlaceOfferState.SOLD));
    }, [ offers ]);

    const redeemSoldOffers = useCallback(() =>
    {
        setOffers(prevValue =>
        {
            const idsToDelete = soldOffers.map(value => value.offerId);

            return prevValue.filter(value => (idsToDelete.indexOf(value.offerId) === -1));
        })

        SendMessageComposer(new RedeemMarketplaceOfferCreditsMessageComposer());
    }, [ soldOffers ]);

    const takeItemBack = (offerData: MarketplaceOfferData) =>
    {
        SendMessageComposer(new CancelMarketplaceOfferMessageComposer(offerData.offerId));
    };

    useEffect(() =>
    {
        SendMessageComposer(new GetMarketplaceOwnOffersMessageComposer());
    }, []);

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden bg-[#0a0a0a] rounded-xl p-3 border border-white/[0.04]">
            { (creditsWaiting <= 0) &&
                <div className="text-center text-[11px] font-mono bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 text-white/30 uppercase tracking-widest">
                    { LocalizeText('catalog.marketplace.redeem.no_sold_items') }
                </div> }
            { (creditsWaiting > 0) &&
                <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <span className="text-[11px] font-bold font-mono text-amber-400 uppercase">
                        { LocalizeText('catalog.marketplace.redeem.get_credits', [ 'count', 'credits' ], [ soldOffers.length.toString(), creditsWaiting.toString() ]) }
                    </span>
                    <button className="appearance-none border border-amber-500/40 h-8 px-4 text-[11px] font-bold font-mono rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors uppercase" onClick={ redeemSoldOffers }>
                        { LocalizeText('catalog.marketplace.offer.redeem') }
                    </button>
                </div> }
            
            <div className="flex flex-col flex-1 min-h-0 mt-2">
                <div className="flex items-center justify-between shrink-0 px-2 border-b border-white/[0.08] pb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">
                        { LocalizeText('catalog.marketplace.items_found', [ 'count' ], [ offers.length.toString() ]) }
                    </span>
                    <div className="flex items-center text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] gap-8 pr-[70px]">
                        <span className="w-16 text-right">Price</span>
                    </div>
                </div>
                
                <div className="flex flex-col overflow-auto h-full rounded border border-white/[0.04] bg-[#050505]">
                    { offers.length > 0 ? (
                        offers.map(offer => <CatalogLayoutMarketplaceItemView key={ offer.offerId } offerData={ offer } type={ OWN_OFFER } onClick={ takeItemBack } />)
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-xs gap-2 py-8">
                            <span className="text-2xl font-mono opacity-50">¯\_(ツ)_/¯</span>
                            No active listings.
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
}
