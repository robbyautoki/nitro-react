import { FC, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../api';
import { Coins, Clock, TrendingUp } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';

export interface MarketplaceItemCardProps
{
    offerData: MarketplaceOfferData;
    type: 'public' | 'own';
    onAction(offerData: MarketplaceOfferData): void;
}

export const MarketplaceItemCard: FC<MarketplaceItemCardProps> = ({ offerData, type, onAction }) =>
{
    const title = useMemo(() =>
    {
        if(!offerData) return '';
        return LocalizeText(((offerData.furniType === 2) ? 'wallItem' : 'roomItem') + `.name.${ offerData.furniId }`);
    }, [ offerData ]);

    const timeLeft = useMemo(() =>
    {
        if(!offerData) return '';
        if(offerData.status === MarketPlaceOfferState.SOLD) return 'Sold';
        if(offerData.timeLeftMinutes <= 0) return 'Expired';

        const time = Math.max(1, offerData.timeLeftMinutes);
        const hours = Math.floor(time / 60);
        const minutes = time - (hours * 60);

        if(hours > 0) return `${ hours }h ${ minutes }m`;
        return `${ minutes }m`;
    }, [ offerData ]);

    const imageUrl = GetImageIconUrlForProduct(
        offerData.furniType === MarketplaceOfferData.TYPE_FLOOR ? ProductTypeEnum.FLOOR : ProductTypeEnum.WALL,
        offerData.furniId,
        offerData.extraData
    );

    const isSold = offerData.status === MarketPlaceOfferState.SOLD;

    return (
        <div className="group flex items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-2.5 transition-colors hover:bg-bg-weak-50">
            { /* Item Image */ }
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-weak-50">
                <div
                    className="w-full h-full bg-center bg-no-repeat bg-contain"
                    style={ { backgroundImage: `url(${ imageUrl })` } }
                />
            </div>
            { /* Info */ }
            <div className="flex-1 min-w-0">
                <div className="truncate text-label-xs text-text-strong-950">{ title }</div>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-paragraph-xs text-warning-base">
                        <Coins className="size-3" />
                        { offerData.price.toLocaleString() }
                    </span>
                    { type === 'public' && offerData.averagePrice > 0 && (
                        <span className="flex items-center gap-1 text-paragraph-xs text-text-soft-400">
                            <TrendingUp className="size-3" />
                            avg { offerData.averagePrice.toLocaleString() }
                        </span>
                    ) }
                    { type === 'public' && offerData.offerCount > 1 && (
                        <span className="text-paragraph-xs text-text-soft-400">
                            { offerData.offerCount } offers
                        </span>
                    ) }
                    { type === 'own' && (
                        <span className={ `flex items-center gap-1 text-paragraph-xs ${ isSold ? 'text-success-base' : 'text-text-soft-400' }` }>
                            <Clock className="size-3" />
                            { timeLeft }
                        </span>
                    ) }
                </div>
            </div>
            { /* Action Button */ }
            { type === 'public' && (
                <AlignButton.Root
                    variant="primary"
                    mode="lighter"
                    size="xxsmall"
                    className="shrink-0 text-label-xs"
                    onClick={ () => onAction(offerData) }
                >
                    Buy
                </AlignButton.Root>
            ) }
            { type === 'own' && !isSold && (
                <AlignButton.Root
                    variant="error"
                    mode="lighter"
                    size="xxsmall"
                    className="shrink-0 text-label-xs"
                    onClick={ () => onAction(offerData) }
                >
                    Cancel
                </AlignButton.Root>
            ) }
        </div>
    );
};
