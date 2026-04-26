import { FC, useCallback, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '../../../../../../lib/utils';

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

    // Calculate price delta for Enterprise/Bloomberg style
    const priceDeltaInfo = useMemo(() =>
    {
        if(!offerData || type !== PUBLIC_OFFER || offerData.averagePrice <= 0) return null;
        
        const diff = offerData.price - offerData.averagePrice;
        const percentage = Math.round((diff / offerData.averagePrice) * 100);
        
        if(diff === 0) return { text: '±0%', className: 'text-text-soft-400' };
        if(diff < 0) return { text: `${ percentage }%`, className: 'text-emerald-600 bg-emerald-500/10' };
        return { text: `+${ percentage }%`, className: 'text-rose-600 bg-rose-500/10' };
    }, [ offerData, type ]);

    return (
        <div className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-bg-white-0 group">
            { /* Item Image */ }
            <div className="size-10 shrink-0 rounded-10 bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 overflow-hidden flex items-center justify-center">
                <div className="size-8 bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity"
                    style={ { backgroundImage: `url(${ GetImageIconUrlForProduct(((offerData.furniType === MarketplaceOfferData.TYPE_FLOOR) ? ProductTypeEnum.FLOOR : ProductTypeEnum.WALL), offerData.furniId, offerData.extraData) })` } } 
                />
            </div>
            { /* Title & Info */ }
            <div className="flex-1 min-w-0">
                <div className="text-label-sm text-text-strong-950 truncate">
                    { getMarketplaceOfferTitle }
                </div>
                { (type === OWN_OFFER) && (
                    <div className="text-paragraph-xs text-text-sub-600 mt-0.5">
                        { offerTime() }
                    </div>
                ) }
                { (type === PUBLIC_OFFER) && (
                    <div className="text-paragraph-xs text-text-sub-600 mt-0.5 flex items-center gap-2">
                        <span>VOL: { offerData.offerCount }</span>
                        { offerData.averagePrice > 0 && (
                            <>
                                <span className="text-text-soft-400">·</span>
                                <span>Ø { offerData.averagePrice }c</span>
                            </>
                        ) }
                    </div>
                ) }
            </div>
            { /* Price Data */ }
            <div className="flex flex-col items-end shrink-0 mr-4">
                <div className="text-label-md text-warning-dark tabular-nums leading-none">
                    { offerData.price }<span className="text-paragraph-xs text-warning-base/60 ml-0.5">c</span>
                </div>
                { priceDeltaInfo && (
                    <div className={ cn('text-paragraph-xs font-medium px-1.5 rounded-md mt-1 tabular-nums', priceDeltaInfo.className) }>
                        { priceDeltaInfo.text }
                    </div>
                ) }
            </div>
            { /* Actions */ }
            <div className="shrink-0">
                { ((type === OWN_OFFER) && (offerData.status !== MarketPlaceOfferState.SOLD)) &&
                    <AlignButton.Root
                        variant="neutral"
                        mode="stroke"
                        size="xxsmall"
                        onClick={ () => onClick(offerData) }
                    >
                        { LocalizeText('catalog.marketplace.offer.pick') }
                    </AlignButton.Root>
                }
                { type === PUBLIC_OFFER &&
                    <AlignButton.Root
                        variant="primary"
                        mode="lighter"
                        size="xsmall"
                        onClick={ () => onClick(offerData) }
                    >
                        { LocalizeText('buy') }
                    </AlignButton.Root>
                }
            </div>
        </div>
    );
}
