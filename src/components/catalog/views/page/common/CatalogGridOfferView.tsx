import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView } from '../../../../../common';
import { LayoutLimitedEditionStyledNumberView } from '../../../../../common/layout/limited-edition';
import { cn } from '../../../../../lib/utils';
import { useCatalog, useInventoryFurni } from '../../../../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../ui/tooltip';
import { INTERACTION_LABELS } from '../../shared/CatalogInteractionFilter';
import { CatalogCurrencyIcon } from '../../shared/CatalogCurrencyIcon';

interface CatalogGridOfferViewProps
{
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer, event?: MouseEvent) => void;
    itemActive?: boolean;
    isMultiSelected?: boolean;
}

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = props =>
{
    const { offer = null, selectOffer = null, itemActive = false, isMultiSelected = false } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const { requestOfferToMover = null } = useCatalog();
    const { isVisible = false } = useInventoryFurni();

    const iconUrl = useMemo(() =>
    {
        if(offer.pricingModel === Offer.PRICING_MODEL_BUNDLE) return null;
        return offer.product.getIconUrl(offer);
    }, [ offer ]);

    const onMouseEvent = (event: MouseEvent) =>
    {
        switch(event.type)
        {
            case MouseEventType.MOUSE_DOWN:
                selectOffer(offer, event);
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
    const isFree = offer.priceInCredits === 0 && offer.priceInActivityPoints === 0;
    const furniData = product.furnitureData;
    const interactionInfo = furniData ? INTERACTION_LABELS[furniData.interactionType] : null;

    return (
        <TooltipProvider delayDuration={ 400 }>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={ cn(
                            'group relative aspect-square rounded-xl border p-1.5 transition-all duration-150 cursor-pointer overflow-hidden',
                            'hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm hover:z-10',
                            isMultiSelected
                                ? 'border-emerald-400/80 shadow-[0_0_14px_rgba(52,211,153,0.3)] bg-emerald-500/10 z-10'
                                : itemActive
                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-[0_0_12px_rgba(var(--primary),0.15)] z-10'
                                    : 'border-border/50 bg-card',
                            isSoldOut && 'opacity-40 grayscale'
                        ) }
                        style={ (iconUrl && !isUnique) ? { backgroundImage: `url(${ iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                        onMouseDown={ onMouseEvent }
                        onMouseUp={ onMouseEvent }
                        onMouseOut={ onMouseEvent }
                    >
                        { isMultiSelected &&
                            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold z-20 shadow-sm">✓</span> }
                        { (itemCount > 1) &&
                            <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none z-10 shadow-sm">
                                { itemCount }
                            </span> }
                        { isUnique && (
                            <>
                                <div className="absolute inset-0 bg-center bg-no-repeat" style={ { backgroundImage: `url(${ iconUrl })` } } />
                                <div className="absolute top-1 right-1">
                                    <span className="text-[8px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-1">LTD</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 z-10">
                                    <LayoutLimitedEditionStyledNumberView value={ product.uniqueLimitedItemSeriesSize } />
                                </div>
                            </>
                        ) }
                        { isFree && !isUnique && (
                            <div className="absolute bottom-1 left-1">
                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded px-1">GRATIS</span>
                            </div>
                        ) }
                        { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                            <LayoutAvatarImageView figure={ offer.product.extraParam } headOnly={ true } direction={ 3 } /> }
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={ 6 } className="max-w-[220px] shadow-lg">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs">{ offer.localizationName }</span>
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                            { offer.priceInCredits > 0 && (
                                <span className="flex items-center gap-0.5">
                                    <CatalogCurrencyIcon type={ -1 } className="w-3.5 h-3.5" />{ offer.priceInCredits }
                                </span>
                            ) }
                            { offer.priceInActivityPoints > 0 && (
                                <span className="flex items-center gap-0.5">
                                    <CatalogCurrencyIcon type={ offer.activityPointType } className="w-3.5 h-3.5" />{ offer.priceInActivityPoints }
                                </span>
                            ) }
                            { isFree && <span className="text-emerald-500">Kostenlos</span> }
                        </div>
                        { interactionInfo && <span className={ `text-[10px] ${ interactionInfo.color }` }>{ interactionInfo.label }</span> }
                        { isUnique && <span className="text-[10px] text-amber-500">Limited: { product.uniqueLimitedItemsLeft }/{ product.uniqueLimitedItemSeriesSize }</span> }
                        <span className="text-[9px] opacity-40 font-mono">{ furniData?.className }</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
