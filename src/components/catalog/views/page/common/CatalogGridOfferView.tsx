import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView } from '../../../../../common';
import { LayoutLimitedEditionStyledNumberView } from '../../../../../common/layout/limited-edition';
import { cn } from '../../../../../lib/utils';
import { useCatalog, useInventoryFurni } from '../../../../../hooks';

interface CatalogGridOfferViewProps
{
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer) => void;
    itemActive?: boolean;
}

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = props =>
{
    const { offer = null, selectOffer = null, itemActive = false } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const { requestOfferToMover = null } = useCatalog();
    const { isVisible = false } = useInventoryFurni();

    const iconUrl = useMemo(() =>
    {
        if(offer.pricingModel === Offer.PRICING_MODEL_BUNDLE)
        {
            return null;
        }

        return offer.product.getIconUrl(offer);
    }, [ offer ]);

    const onMouseEvent = (event: MouseEvent) =>
    {
        switch(event.type)
        {
            case MouseEventType.MOUSE_DOWN:
                selectOffer(offer);
                setMouseDown(true);
                return;
            case MouseEventType.MOUSE_UP:
                setMouseDown(false);
                return;
            case MouseEventType.ROLL_OUT:
                if(!isMouseDown || !itemActive || !isVisible) return;

                requestOfferToMover(offer);
                return;
        }
    }

    const product = offer.product;

    if(!product) return null;

    const isUnique = product.uniqueLimitedItemSeriesSize > 0;
    const isSoldOut = product.uniqueLimitedItemSeriesSize > 0 && !product.uniqueLimitedItemsLeft;
    const itemCount = (offer.pricingModel === Offer.PRICING_MODEL_MULTI) ? product.productCount : 1;

    return (
        <div
            className={ cn(
                'relative flex items-center justify-center rounded-lg border bg-card cursor-pointer overflow-hidden transition-all duration-150 aspect-square group',
                'hover:border-indigo-500/60 hover:shadow-[0_0_10px_rgba(99,102,241,0.35)] hover:z-10',
                itemActive
                    ? 'border-indigo-400/80 shadow-[0_0_14px_rgba(99,102,241,0.55)] bg-indigo-500/10 z-10'
                    : 'border-white/[0.07]',
                isSoldOut && 'opacity-40 grayscale'
            ) }
            style={ (iconUrl && !isUnique) ? { backgroundImage: `url(${ iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined }
            onMouseDown={ onMouseEvent }
            onMouseUp={ onMouseEvent }
            onMouseOut={ onMouseEvent }
        >
            { (itemCount > 1) &&
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none z-10 shadow-sm">
                    { itemCount }
                </span> }
            { isUnique &&
                <>
                    <div className="absolute inset-0 bg-center bg-no-repeat" style={ { backgroundImage: `url(${ iconUrl })` } } />
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                        <LayoutLimitedEditionStyledNumberView value={ product.uniqueLimitedItemSeriesSize } />
                    </div>
                </> }
            { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                <LayoutAvatarImageView figure={ offer.product.extraParam } headOnly={ true } direction={ 3 } /> }
        </div>
    );
}
