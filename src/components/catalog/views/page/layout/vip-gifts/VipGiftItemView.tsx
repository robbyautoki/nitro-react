import { CatalogPageMessageOfferData } from '@nitrots/nitro-renderer';
import { FC, useCallback } from 'react';
import { LocalizeText, ProductImageUtility } from '../../../../../../api';

export interface VipGiftItemViewProps
{
    offer: CatalogPageMessageOfferData;
    isAvailable: boolean;
    daysRequired: number;
    onSelect(localizationId: string): void;
}

export const VipGiftItem : FC<VipGiftItemViewProps> = props =>
{
    const { offer = null, isAvailable = false, daysRequired = 0, onSelect = null } = props;
    
    const getImageUrlForOffer = useCallback( () =>
    {
        if(!offer || !offer.products.length) return '';

        const productData = offer.products[0];

        return ProductImageUtility.getProductImageUrl(productData.productType, productData.furniClassId, productData.extraParam);
    }, [ offer ]);
    
    const getItemTitle = useCallback(() =>
    {
        if(!offer || !offer.products.length) return '';

        const productData = offer.products[0];

        const localizationKey = ProductImageUtility.getProductCategory(productData.productType, productData.furniClassId) === 2 ? 'wallItem.name.' + productData.furniClassId : 'roomItem.name.' + productData.furniClassId;

        return LocalizeText(localizationKey);
    }, [ offer ]);

    const getItemDesc = useCallback( () =>
    {
        if(!offer || !offer.products.length) return '';

        const productData = offer.products[0];

        const localizationKey = ProductImageUtility.getProductCategory(productData.productType, productData.furniClassId) === 2 ? 'wallItem.desc.' + productData.furniClassId : 'roomItem.desc.' + productData.furniClassId ;

        return LocalizeText(localizationKey);
    }, [ offer ]);

    const getMonthsRequired = useCallback(() => 
    {
        return Math.floor(daysRequired / 31);
    },[ daysRequired ]);

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-white/[0.07] bg-white/[0.06]">
            <img src={getImageUrlForOffer()} alt="" className="w-10 h-10 object-contain shrink-0" />
            <span className="flex-1 text-xs font-semibold text-white/90 truncate">{ getItemTitle() }</span>
            <button className="appearance-none h-7 px-3 text-xs rounded-md border border-white/[0.08] bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0" onClick={ () => onSelect(offer.localizationId) } disabled={ !isAvailable }>
                { LocalizeText('catalog.club_gift.select') }
            </button>
        </div>
    );
}
