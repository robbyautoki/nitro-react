import { FC, useCallback, useMemo } from 'react';
import { GetImageIconUrlForProduct, LocalizeText, MarketplaceOfferData, MarketPlaceOfferState, ProductTypeEnum } from '../../../../../../api';
import { Button } from '../../../../../ui/button';
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
        
        if(diff === 0) return { text: '±0%', className: 'text-white/40' };
        if(diff < 0) return { text: `${percentage}%`, className: 'text-emerald-400 bg-emerald-400/10' };
        return { text: `+${percentage}%`, className: 'text-rose-400 bg-rose-400/10' };
    }, [ offerData, type ]);

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
            {/* Item Image */}
            <div className="w-10 h-10 shrink-0 bg-white/[0.02] border border-white/[0.05] rounded overflow-hidden flex items-center justify-center">
                <div className="w-8 h-8 bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity"
                    style={ { backgroundImage: `url(${ GetImageIconUrlForProduct(((offerData.furniType === MarketplaceOfferData.TYPE_FLOOR) ? ProductTypeEnum.FLOOR : ProductTypeEnum.WALL), offerData.furniId, offerData.extraData) })` } } 
                />
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white/90 truncate uppercase tracking-wide">
                    { getMarketplaceOfferTitle }
                </div>
                { (type === OWN_OFFER) && (
                    <div className="text-[10px] text-white/40 mt-0.5 font-mono">
                        { offerTime() }
                    </div>
                ) }
                { (type === PUBLIC_OFFER) && (
                    <div className="text-[10px] text-white/40 mt-0.5 font-mono flex items-center gap-2">
                        <span>VOL: { offerData.offerCount }</span>
                        { offerData.averagePrice > 0 && (
                            <>
                                <span className="text-white/20">|</span>
                                <span>Ø { offerData.averagePrice }c</span>
                            </>
                        ) }
                    </div>
                ) }
            </div>

            {/* Price Data */}
            <div className="flex flex-col items-end shrink-0 mr-4">
                <div className="text-[14px] font-bold text-amber-400 font-mono tabular-nums leading-none">
                    { offerData.price }<span className="text-[10px] text-amber-400/50 ml-0.5">c</span>
                </div>
                { priceDeltaInfo && (
                    <div className={ cn("text-[9px] font-bold px-1 rounded mt-1 font-mono", priceDeltaInfo.className) }>
                        { priceDeltaInfo.text }
                    </div>
                ) }
            </div>

            {/* Actions */}
            <div className="shrink-0">
                { ((type === OWN_OFFER) && (offerData.status !== MarketPlaceOfferState.SOLD)) &&
                    <button 
                        className="h-7 px-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded text-[10px] font-bold text-white/80 uppercase tracking-wider transition-colors"
                        onClick={ () => onClick(offerData) }
                    >
                        { LocalizeText('catalog.marketplace.offer.pick') }
                    </button> 
                }
                { type === PUBLIC_OFFER &&
                    <button 
                        className="h-8 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-[11px] font-bold text-emerald-400 uppercase tracking-wider transition-colors"
                        onClick={ () => onClick(offerData) }
                    >
                        { LocalizeText('buy') }
                    </button>
                }
            </div>
        </div>
    );
}
