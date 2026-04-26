import { CancelMarketplaceOfferMessageComposer, GetMarketplaceOwnOffersMessageComposer, MarketplaceCancelOfferResultEvent, MarketplaceOwnOffersEvent, RedeemMarketplaceOfferCreditsMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, NotificationAlertType, SendMessageComposer } from '../../../../../../api';
import { useMessageEvent, useNotification } from '../../../../../../hooks';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { CatalogLayoutMarketplaceItemView, OWN_OFFER } from './CatalogLayoutMarketplaceItemView';
import * as AlignButton from '@/align-ui/components/ui/button';

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
        <div className="flex flex-col h-full gap-3 overflow-hidden p-3">
            { (creditsWaiting <= 0) &&
                <div className="rounded-16 bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200 p-3 text-center text-paragraph-xs text-text-sub-600">
                    { LocalizeText('catalog.marketplace.redeem.no_sold_items') }
                </div> }
            { (creditsWaiting > 0) &&
                <div className="flex items-center justify-between gap-3 rounded-16 bg-warning-lighter ring-1 ring-inset ring-warning-base/30 p-3">
                    <span className="text-label-sm text-warning-dark">
                        { LocalizeText('catalog.marketplace.redeem.get_credits', [ 'count', 'credits' ], [ soldOffers.length.toString(), creditsWaiting.toString() ]) }
                    </span>
                    <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ redeemSoldOffers }>
                        { LocalizeText('catalog.marketplace.offer.redeem') }
                    </AlignButton.Root>
                </div> }
            <div className="flex flex-col flex-1 min-h-0 gap-2">
                <div className="flex items-center justify-between shrink-0 px-3">
                    <span className="text-label-xs uppercase tracking-wide text-text-soft-400">
                        { LocalizeText('catalog.marketplace.items_found', [ 'count' ], [ offers.length.toString() ]) }
                    </span>
                    <div className="flex items-center text-label-xs uppercase tracking-wide text-text-soft-400 gap-8 pr-[70px]">
                        <span className="w-16 text-right">Preis</span>
                    </div>
                </div>
                <div className="flex flex-col overflow-auto h-full rounded-16 bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200 divide-y divide-stroke-soft-200">
                    { offers.length > 0 ? (
                        offers.map(offer => <CatalogLayoutMarketplaceItemView key={ offer.offerId } offerData={ offer } type={ OWN_OFFER } onClick={ takeItemBack } />)
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-soft-400 text-paragraph-xs gap-2 py-8">
                            <span className="text-subheading-md opacity-50">¯\_(ツ)_/¯</span>
                            Keine aktiven Angebote.
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
}
