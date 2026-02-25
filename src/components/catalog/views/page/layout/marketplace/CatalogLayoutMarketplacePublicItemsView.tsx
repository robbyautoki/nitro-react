import { BuyMarketplaceOfferMessageComposer, GetMarketplaceOffersMessageComposer, MarketplaceBuyOfferResultEvent, MarketPlaceOffersEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useMemo, useState } from 'react';
import { IMarketplaceSearchOptions, LocalizeText, MarketplaceOfferData, MarketplaceSearchType, NotificationAlertType, SendMessageComposer } from '../../../../../../api';
import { useMessageEvent, useNotification, usePurse } from '../../../../../../hooks';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { CatalogLayoutMarketplaceItemView, PUBLIC_OFFER } from './CatalogLayoutMarketplaceItemView';
import { SearchFormView } from './CatalogLayoutMarketplaceSearchFormView';

const SORT_TYPES_VALUE = [ 1, 2 ];
const SORT_TYPES_ACTIVITY = [ 3, 4, 5, 6 ];
const SORT_TYPES_ADVANCED = [ 1, 2, 3, 4, 5, 6 ];
export interface CatalogLayoutMarketplacePublicItemsViewProps extends CatalogLayoutProps
{

}

export const CatalogLayoutMarketplacePublicItemsView: FC<CatalogLayoutMarketplacePublicItemsViewProps> = props =>
{
    const [ searchType, setSearchType ] = useState(MarketplaceSearchType.BY_ACTIVITY);
    const [ totalItemsFound, setTotalItemsFound ] = useState(0);
    const [ offers, setOffers ] = useState(new Map<number, MarketplaceOfferData>());
    const [ lastSearch, setLastSearch ] = useState<IMarketplaceSearchOptions>({ minPrice: -1, maxPrice: -1, query: '', type: 3 });
    const { getCurrencyAmount = null } = usePurse();
    const { simpleAlert = null, showConfirm = null } = useNotification();

    const requestOffers = useCallback((options: IMarketplaceSearchOptions) =>
    {
        setLastSearch(options);
        SendMessageComposer(new GetMarketplaceOffersMessageComposer(options.minPrice, options.maxPrice, options.query, options.type))
    }, []);

    const getSortTypes = useMemo( () =>
    {
        switch(searchType)
        {
            case MarketplaceSearchType.BY_ACTIVITY:
                return SORT_TYPES_ACTIVITY;
            case MarketplaceSearchType.BY_VALUE:
                return SORT_TYPES_VALUE;
            case MarketplaceSearchType.ADVANCED:
                return SORT_TYPES_ADVANCED;
        }
        return [];
    }, [ searchType ]);

    const purchaseItem = useCallback((offerData: MarketplaceOfferData) =>
    {
        if(offerData.price > getCurrencyAmount(-1))
        {
            simpleAlert(LocalizeText('catalog.alert.notenough.credits.description'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.alert.notenough.title'));
            return;
        }

        const offerId = offerData.offerId;

        showConfirm(LocalizeText('catalog.marketplace.confirm_header'), () =>
        {
            SendMessageComposer(new BuyMarketplaceOfferMessageComposer(offerId));
        },
        null, null, null, LocalizeText('catalog.marketplace.confirm_title'));
    }, [ getCurrencyAmount, simpleAlert, showConfirm ]);

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
            // our shit was updated
            // todo: some dialogue modal
                setOffers( prev =>
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

                showConfirm(LocalizeText('catalog.marketplace.confirm_higher_header') +
                '\n' + LocalizeText('catalog.marketplace.confirm_price', [ 'price' ], [ parser.newPrice.toString() ]), () =>
                {
                    SendMessageComposer(new BuyMarketplaceOfferMessageComposer(parser.offerId));
                },
                null, null, null, LocalizeText('catalog.marketplace.confirm_higher_title'));
                break;
            case 4:
                simpleAlert(LocalizeText('catalog.alert.notenough.credits.description'), NotificationAlertType.DEFAULT, null, null, LocalizeText('catalog.alert.notenough.title'));
                break;
        }
    });

    return (
        <div className="flex flex-col h-full gap-3 bg-white rounded-xl p-3 border border-black/[0.04]">
            <div className="flex gap-1">
                <button className={ `appearance-none px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${ searchType === MarketplaceSearchType.BY_ACTIVITY ? 'bg-primary/10 text-black/85 border-black/[0.10]' : 'bg-transparent text-black/40 border-transparent hover:text-black/60 hover:bg-black/[0.03]' }` } onClick={ () => setSearchType(MarketplaceSearchType.BY_ACTIVITY) }>
                    { LocalizeText('catalog.marketplace.search_by_activity') }
                </button>
                <button className={ `appearance-none px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${ searchType === MarketplaceSearchType.BY_VALUE ? 'bg-primary/10 text-black/85 border-black/[0.10]' : 'bg-transparent text-black/40 border-transparent hover:text-black/60 hover:bg-black/[0.03]' }` } onClick={ () => setSearchType(MarketplaceSearchType.BY_VALUE) }>
                    { LocalizeText('catalog.marketplace.search_by_value') }
                </button>
                <button className={ `appearance-none px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${ searchType === MarketplaceSearchType.ADVANCED ? 'bg-primary/10 text-black/85 border-black/[0.10]' : 'bg-transparent text-black/40 border-transparent hover:text-black/60 hover:bg-black/[0.03]' }` } onClick={ () => setSearchType(MarketplaceSearchType.ADVANCED) }>
                    { LocalizeText('catalog.marketplace.search_advanced') }
                </button>
            </div>
            
            <div className="bg-black/[0.02] p-3 rounded-lg border border-black/[0.05]">
                <SearchFormView sortTypes={ getSortTypes } searchType={ searchType } onSearch={ requestOffers } />
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0 px-2 mt-2 border-b border-black/[0.06] pb-2">
                    <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em]">
                        { LocalizeText('catalog.marketplace.items_found', [ 'count' ], [ offers.size.toString() ]) }
                    </span>
                    <div className="flex items-center text-[10px] font-bold text-black/30 uppercase tracking-[0.1em] gap-8 pr-[70px]">
                        <span className="w-16 text-right">Spread</span>
                        <span className="w-16 text-right">Price</span>
                    </div>
                </div>
                
                <div className="flex flex-col overflow-auto h-full rounded border border-black/[0.04] bg-white">
                    { offers.size > 0 ? (
                        Array.from(offers.values()).map( (entry, index) => <CatalogLayoutMarketplaceItemView key={ index } offerData={ entry } type={ PUBLIC_OFFER } onClick={ purchaseItem } />)
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-black/15 text-xs gap-2 py-8">
                            <span className="text-2xl font-mono opacity-50">¯\_(ツ)_/¯</span>
                            No market data available.
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
}
