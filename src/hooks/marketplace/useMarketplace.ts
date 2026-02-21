import { GetMarketplaceConfigurationMessageComposer, GetMarketplaceOffersMessageComposer, GetMarketplaceOwnOffersMessageComposer, GetMarketplaceItemStatsComposer, ILinkEventTracker, MarketplaceConfigurationEvent, MarketPlaceOffersEvent, MarketplaceOwnOffersEvent, MarketplaceItemStatsEvent, MarketplaceBuyOfferResultEvent, MarketplaceCancelOfferResultEvent, BuyMarketplaceOfferMessageComposer, CancelMarketplaceOfferMessageComposer, RedeemMarketplaceOfferCreditsMessageComposer, MakeOfferMessageComposer } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { AddEventLinkTracker, IMarketplaceSearchOptions, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, MarketplaceSearchType, NotificationAlertType, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { useNotification } from '../notification';
import { usePurse } from '../purse';

export interface PriceHistoryData
{
    dayOffset: number;
    averagePrice: number;
    soldAmount: number;
}

export interface ItemStats
{
    averagePrice: number;
    offerCount: number;
    history: PriceHistoryData[];
    furniTypeId: number;
    furniCategoryId: number;
}

const useMarketplaceState = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>('custom-browse');
    const [ searchType, setSearchType ] = useState(MarketplaceSearchType.BY_ACTIVITY);
    const [ offers, setOffers ] = useState(new Map<number, MarketplaceOfferData>());
    const [ totalItemsFound, setTotalItemsFound ] = useState(0);
    const [ ownOffers, setOwnOffers ] = useState<MarketplaceOfferData[]>([]);
    const [ creditsWaiting, setCreditsWaiting ] = useState(0);
    const [ lastSearch, setLastSearch ] = useState<IMarketplaceSearchOptions>({ minPrice: -1, maxPrice: -1, query: '', type: 3 });
    const [ marketplaceConfig, setMarketplaceConfig ] = useState<any>(null);
    const [ itemStats, setItemStats ] = useState<ItemStats | null>(null);
    const { getCurrencyAmount = null } = usePurse();
    const { simpleAlert = null, showConfirm = null } = useNotification();

    // Link event tracker
    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'marketplace/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    // Request marketplace config on open
    useEffect(() =>
    {
        if(!isVisible) return;
        if(!marketplaceConfig) SendMessageComposer(new GetMarketplaceConfigurationMessageComposer());
    }, [ isVisible, marketplaceConfig ]);

    // === Message Events ===

    useMessageEvent<MarketplaceConfigurationEvent>(MarketplaceConfigurationEvent, event =>
    {
        setMarketplaceConfig(event.getParser());
    });

    useMessageEvent<MarketPlaceOffersEvent>(MarketPlaceOffersEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        const latestOffers = new Map<number, MarketplaceOfferData>();
        parser.offers.forEach(entry =>
        {
            const offerEntry = new MarketplaceOfferData(entry.offerId, entry.furniId, entry.furniType, entry.extraData, entry.stuffData, entry.price, entry.status, entry.averagePrice, entry.offerCount);
            offerEntry.timeLeftMinutes = entry.timeLeftMinutes;
            latestOffers.set(entry.offerId, offerEntry);
        });

        setTotalItemsFound(parser.totalItemsFound);
        setOffers(latestOffers);
    });

    useMessageEvent<MarketplaceOwnOffersEvent>(MarketplaceOwnOffersEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        const parsedOffers = parser.offers.map(offer =>
        {
            const newOffer = new MarketplaceOfferData(offer.offerId, offer.furniId, offer.furniType, offer.extraData, offer.stuffData, offer.price, offer.status, offer.averagePrice, offer.offerCount);
            newOffer.timeLeftMinutes = offer.timeLeftMinutes;
            return newOffer;
        });

        setCreditsWaiting(parser.creditsWaiting);
        setOwnOffers(parsedOffers);
    });

    useMessageEvent<MarketplaceBuyOfferResultEvent>(MarketplaceBuyOfferResultEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        switch(parser.result)
        {
            case 1:
                requestOffers(lastSearch);
                break;
            case 2:
                setOffers(prev =>
                {
                    const newVal = new Map(prev);
                    newVal.delete(parser.requestedOfferId);
                    return newVal;
                });
                simpleAlert(LocalizeText('catalog.marketplace.not_available_header'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.marketplace.not_available_title'));
                break;
            case 3:
                setOffers(prev =>
                {
                    const newVal = new Map(prev);
                    const item = newVal.get(parser.requestedOfferId);
                    if(item)
                    {
                        item.offerId = parser.offerId;
                        item.price = parser.newPrice;
                        item.offerCount--;
                        newVal.set(item.offerId, item);
                    }
                    newVal.delete(parser.requestedOfferId);
                    return newVal;
                });
                showConfirm(
                    LocalizeText('catalog.marketplace.confirm_higher_header') + '\n' + LocalizeText('catalog.marketplace.confirm_price', [ 'price' ], [ parser.newPrice.toString() ]),
                    () => SendMessageComposer(new BuyMarketplaceOfferMessageComposer(parser.offerId)),
                    null, null, null, LocalizeText('catalog.marketplace.confirm_higher_title')
                );
                break;
            case 4:
                simpleAlert(LocalizeText('catalog.alert.notenough.credits.description'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.alert.notenough.title'));
                break;
        }
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

        setOwnOffers(prev => prev.filter(v => v.offerId !== parser.offerId));
    });

    useMessageEvent<MarketplaceItemStatsEvent>(MarketplaceItemStatsEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        const history: PriceHistoryData[] = parser.dayOffsets.map((offset, i) => ({
            dayOffset: offset,
            averagePrice: parser.averagePrices[i],
            soldAmount: parser.soldAmounts[i],
        }));

        setItemStats({
            averagePrice: parser.averagePrice,
            offerCount: parser.offerCount,
            history,
            furniTypeId: parser.furniTypeId,
            furniCategoryId: parser.furniCategoryId,
        });
    });

    // === Actions ===

    const requestOffers = useCallback((options: IMarketplaceSearchOptions) =>
    {
        setLastSearch(options);
        SendMessageComposer(new GetMarketplaceOffersMessageComposer(options.minPrice, options.maxPrice, options.query, options.type));
    }, []);

    const requestOwnOffers = useCallback(() =>
    {
        SendMessageComposer(new GetMarketplaceOwnOffersMessageComposer());
    }, []);

    const purchaseOffer = useCallback((offerData: MarketplaceOfferData) =>
    {
        if(offerData.price > getCurrencyAmount(-1))
        {
            simpleAlert(LocalizeText('catalog.alert.notenough.credits.description'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.alert.notenough.title'));
            return;
        }

        showConfirm(LocalizeText('catalog.marketplace.confirm_header'), () =>
        {
            SendMessageComposer(new BuyMarketplaceOfferMessageComposer(offerData.offerId));
        }, null, null, null, LocalizeText('catalog.marketplace.confirm_title'));
    }, [ getCurrencyAmount, simpleAlert, showConfirm ]);

    const cancelOffer = useCallback((offerData: MarketplaceOfferData) =>
    {
        SendMessageComposer(new CancelMarketplaceOfferMessageComposer(offerData.offerId));
    }, []);

    const redeemCredits = useCallback(() =>
    {
        const soldIds = ownOffers.filter(o => o.status === MarketPlaceOfferState.SOLD).map(o => o.offerId);
        setOwnOffers(prev => prev.filter(v => !soldIds.includes(v.offerId)));
        SendMessageComposer(new RedeemMarketplaceOfferCreditsMessageComposer());
    }, [ ownOffers ]);

    const postOffer = useCallback((askingPrice: number, furniType: number, itemId: number) =>
    {
        SendMessageComposer(new MakeOfferMessageComposer(askingPrice, furniType, itemId));
    }, []);

    const requestItemStats = useCallback((furniType: number, furniId: number) =>
    {
        SendMessageComposer(new GetMarketplaceItemStatsComposer(furniType, furniId));
    }, []);

    return {
        isVisible, setIsVisible,
        currentTab, setCurrentTab,
        searchType, setSearchType,
        offers, totalItemsFound,
        ownOffers, creditsWaiting,
        marketplaceConfig,
        itemStats, setItemStats,
        lastSearch,
        requestOffers, requestOwnOffers,
        purchaseOffer, cancelOffer, redeemCredits, postOffer,
        requestItemStats,
    };
};

export const useMarketplace = () => useBetween(useMarketplaceState);
