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
        <div className="flex flex-col h-full gap-2 overflow-hidden">
            { (creditsWaiting <= 0) &&
                <div className="text-center text-xs bg-zinc-100 rounded-lg p-2 text-zinc-600">
                    { LocalizeText('catalog.marketplace.redeem.no_sold_items') }
                </div> }
            { (creditsWaiting > 0) &&
                <div className="flex flex-col items-center gap-1.5 bg-zinc-100 rounded-lg p-3">
                    <span className="text-xs text-zinc-700">
                        { LocalizeText('catalog.marketplace.redeem.get_credits', [ 'count', 'credits' ], [ soldOffers.length.toString(), creditsWaiting.toString() ]) }
                    </span>
                    <button className="mt-1 h-7 px-3 text-xs rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors" onClick={ redeemSoldOffers }>
                        { LocalizeText('catalog.marketplace.offer.redeem') }
                    </button>
                </div> }
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                <span className="text-xs font-semibold text-zinc-900 truncate shrink-0">
                    { LocalizeText('catalog.marketplace.items_found', [ 'count' ], [ offers.length.toString() ]) }
                </span>
                <div className="flex flex-col gap-1.5 overflow-auto nitro-catalog-layout-marketplace-grid">
                    { (offers.length > 0) && offers.map(offer => <CatalogLayoutMarketplaceItemView key={ offer.offerId } offerData={ offer } type={ OWN_OFFER } onClick={ takeItemBack } />) }
                </div>
            </div>
        </div>
    );
}
