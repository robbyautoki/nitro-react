import { FC, useCallback, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../../../../../api';
import { LayoutGridItem } from '../../../../../../common';

export interface MarketplaceItemViewProps
{
    offerData: MarketplaceOfferData;
    type?: number;
    onClick(offerData: MarketplaceOfferData): void;
}

export const OWN_OFFER = 1;
export const PUBLIC_OFFER = 2;

export const CatalogLayoutMarketplaceItemView: FC<MarketplaceItemViewProps> = props =>
{
    const { offerData = null, type = PUBLIC_OFFER, onClick = null } = props;

    const getMarketplaceOfferTitle = useMemo(() =>
    {
        if(!offerData) return '';

        // desc
        return LocalizeText(((offerData.furniType === 2) ? 'wallItem' : 'roomItem') + `.name.${ offerData.furniId }`);
    }, [ offerData ]);

    const offerTime = useCallback( () =>
    {
        if(!offerData) return '';

        if(offerData.status === MarketPlaceOfferState.SOLD) return LocalizeText('catalog.marketplace.offer.sold');

        if(offerData.timeLeftMinutes <= 0) return LocalizeText('catalog.marketplace.offer.expired');

        const time = Math.max(1, offerData.timeLeftMinutes);
        const hours = Math.floor(time / 60);
        const minutes = time - (hours * 60);

        let text = minutes + ' ' + LocalizeText('catalog.marketplace.offer.minutes');
        if(hours > 0)
        {
            text = hours + ' ' + LocalizeText('catalog.marketplace.offer.hours') + ' ' + text;
        }

        return LocalizeText('catalog.marketplace.offer.time_left', [ 'time' ], [ text ] );
    }, [ offerData ]);

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 bg-white">
            <div className="w-10 h-10 shrink-0">
                <LayoutGridItem column={ false } itemImage={ GetImageIconUrlForProduct(((offerData.furniType === MarketplaceOfferData.TYPE_FLOOR) ? ProductTypeEnum.FLOOR : ProductTypeEnum.WALL), offerData.furniId, offerData.extraData) } itemUniqueNumber={ offerData.isUniqueLimitedItem ? offerData.stuffData.uniqueNumber : 0 } />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-xs font-semibold text-zinc-900 truncate">{ getMarketplaceOfferTitle }</span>
                { (type === OWN_OFFER) &&
                    <>
                        <span className="text-[11px] text-zinc-500">{ LocalizeText('catalog.marketplace.offer.price_own_item', [ 'price' ], [ offerData.price.toString() ]) }</span>
                        <span className="text-[11px] text-zinc-500">{ offerTime() }</span>
                    </> }
                { (type === PUBLIC_OFFER) &&
                    <>
                        <span className="text-[11px] text-zinc-500">{ LocalizeText('catalog.marketplace.offer.price_public_item', [ 'price', 'average' ], [ offerData.price.toString(), ((offerData.averagePrice > 0) ? offerData.averagePrice.toString() : '-') ]) }</span>
                        <span className="text-[11px] text-zinc-500">{ LocalizeText('catalog.marketplace.offer_count', [ 'count' ], [ offerData.offerCount.toString() ]) }</span>
                    </> }
            </div>
            <div className="flex flex-col gap-1 shrink-0">
                { ((type === OWN_OFFER) && (offerData.status !== MarketPlaceOfferState.SOLD)) &&
                    <button className="h-7 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors" onClick={ () => onClick(offerData) }>
                        { LocalizeText('catalog.marketplace.offer.pick') }
                    </button> }
                { type === PUBLIC_OFFER &&
                    <>
                        <button className="h-7 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors" onClick={ () => onClick(offerData) }>
                            { LocalizeText('buy') }
                        </button>
                        <button className="h-7 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors" disabled>
                            { LocalizeText('catalog.marketplace.view_more') }
                        </button>
                    </> }
            </div>
        </div>
    );
}
