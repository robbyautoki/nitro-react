import { FC, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../api';
import { Coins, Clock, TrendingUp } from 'lucide-react';

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
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group">
            {/* Item Image */}
            <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                <div
                    className="w-full h-full bg-center bg-no-repeat bg-contain"
                    style={ { backgroundImage: `url(${ imageUrl })` } }
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">{ title }</div>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
                        <Coins className="size-3" />
                        { offerData.price.toLocaleString() }
                    </span>
                    { type === 'public' && offerData.averagePrice > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <TrendingUp className="size-3" />
                            avg { offerData.averagePrice.toLocaleString() }
                        </span>
                    ) }
                    { type === 'public' && offerData.offerCount > 1 && (
                        <span className="text-[11px] text-white/30">
                            { offerData.offerCount } offers
                        </span>
                    ) }
                    { type === 'own' && (
                        <span className={ `flex items-center gap-1 text-[11px] ${ isSold ? 'text-emerald-400/80' : 'text-white/30' }` }>
                            <Clock className="size-3" />
                            { timeLeft }
                        </span>
                    ) }
                </div>
            </div>

            {/* Action Button */}
            { type === 'public' && (
                <button
                    className="h-7 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-all shrink-0"
                    onClick={ () => onAction(offerData) }
                >
                    Buy
                </button>
            ) }
            { type === 'own' && !isSold && (
                <button
                    className="h-7 px-3 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/30 transition-all shrink-0"
                    onClick={ () => onAction(offerData) }
                >
                    Cancel
                </button>
            ) }
        </div>
    );
};
