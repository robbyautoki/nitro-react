import { FC, useCallback, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../../../../../api';
import { Button } from '../../../../../ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../../../../../ui/item';

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
        <Item variant="outline" className="rounded-xl hover:shadow-md transition-all duration-200">
            <ItemMedia variant="image" className="w-12 h-12 rounded-lg border bg-muted">
                <div className="w-full h-full bg-center bg-no-repeat"
                    style={ { backgroundImage: `url(${ GetImageIconUrlForProduct(((offerData.furniType === MarketplaceOfferData.TYPE_FLOOR) ? ProductTypeEnum.FLOOR : ProductTypeEnum.WALL), offerData.furniId, offerData.extraData) })` } } />
            </ItemMedia>
            <ItemContent>
                <ItemTitle className="text-xs">{ getMarketplaceOfferTitle }</ItemTitle>
                { (type === OWN_OFFER) &&
                    <ItemDescription className="text-[11px]">
                        { LocalizeText('catalog.marketplace.offer.price_own_item', [ 'price' ], [ offerData.price.toString() ]) }
                        <br />
                        { offerTime() }
                    </ItemDescription> }
                { (type === PUBLIC_OFFER) &&
                    <ItemDescription className="text-[11px]">
                        { LocalizeText('catalog.marketplace.offer.price_public_item', [ 'price', 'average' ], [ offerData.price.toString(), ((offerData.averagePrice > 0) ? offerData.averagePrice.toString() : '-') ]) }
                        <br />
                        { LocalizeText('catalog.marketplace.offer_count', [ 'count' ], [ offerData.offerCount.toString() ]) }
                    </ItemDescription> }
            </ItemContent>
            <ItemActions className="flex-col">
                { ((type === OWN_OFFER) && (offerData.status !== MarketPlaceOfferState.SOLD)) &&
                    <Button size="sm" onClick={ () => onClick(offerData) }>
                        { LocalizeText('catalog.marketplace.offer.pick') }
                    </Button> }
                { type === PUBLIC_OFFER &&
                    <>
                        <Button size="sm" onClick={ () => onClick(offerData) }>
                            { LocalizeText('buy') }
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            { LocalizeText('catalog.marketplace.view_more') }
                        </Button>
                    </> }
            </ItemActions>
        </Item>
    );
}
