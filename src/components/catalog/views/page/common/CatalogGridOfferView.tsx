import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useState } from 'react';
import { IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView } from '../../../../../common';
import { LayoutLimitedEditionStyledNumberView } from '../../../../../common/layout/limited-edition';
import { cn } from '../../../../../lib/utils';
import { useCatalog, useInventoryFurni } from '../../../../../hooks';
import { Content as TooltipContent, Provider as TooltipProvider, Root as Tooltip, Trigger as TooltipTrigger } from '@/align-ui/components/ui/tooltip';
import { INTERACTION_LABELS } from '../../shared/CatalogInteractionFilter';
import { CatalogCurrencyIcon } from '../../shared/CatalogCurrencyIcon';
import { CatalogProductTile } from './CatalogProductTile';

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

    const isBundle = offer.pricingModel === Offer.PRICING_MODEL_BUNDLE;

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
    const isFree = !offer.isLazy && offer.priceInCredits === 0 && offer.priceInActivityPoints === 0;
    const furniData = product.furnitureData;
    const interactionInfo = furniData ? INTERACTION_LABELS[furniData.interactionType] : null;

    return (
        <TooltipProvider delayDuration={ 400 }>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        data-ltd={ isUnique ? 'true' : undefined }
                        className={ cn(
                            'group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-transparent p-1 transition-colors duration-100',
                            'hover:bg-bg-weak-50',
                            'data-[ltd=true]:min-h-16',
                            isMultiSelected
                                ? 'bg-success-lighter ring-1 ring-inset ring-success-base'
                                : itemActive
                                    ? 'bg-primary-alpha-10 ring-1 ring-inset ring-primary-base'
                                    : '',
                            isSoldOut && 'opacity-40 grayscale'
                        ) }
                        onMouseDown={ onMouseEvent }
                        onMouseUp={ onMouseEvent }
                        onMouseOut={ onMouseEvent }
                    >
                        { !isBundle && (
                            <CatalogProductTile product={ product } offer={ offer } />
                        ) }
                        { isMultiSelected &&
                            <span className="absolute left-0.5 top-0.5 z-20 flex size-3.5 items-center justify-center rounded-full bg-success-base text-[10px] leading-none text-static-white">✓</span> }
                        { (itemCount > 1) &&
                            <span className="absolute right-0.5 top-0.5 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded bg-primary-base px-0.5 text-[10px] leading-none text-static-white">
                                { itemCount }
                            </span> }
                        { isUnique && (
                            <>
                                <div className="absolute right-0.5 top-0.5 z-10">
                                    <span className="rounded bg-warning-lighter px-1 text-[10px] leading-tight text-warning-base">LTD</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 z-10">
                                    <LayoutLimitedEditionStyledNumberView value={ product.uniqueLimitedItemSeriesSize } />
                                </div>
                            </>
                        ) }
                        { isFree && !isUnique && (
                            <div className="absolute bottom-0.5 left-0.5">
                                <span className="rounded bg-success-lighter px-1 text-[10px] leading-tight text-success-base">GRATIS</span>
                            </div>
                        ) }
                        { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                            <LayoutAvatarImageView figure={ offer.product.extraParam } headOnly={ true } direction={ 3 } /> }
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={ 6 } variant="light" className="max-w-[220px] shadow-lg">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-label-xs text-text-strong-950">{ offer.localizationName }</span>
                        <div className="flex items-center gap-1.5 text-paragraph-xs opacity-80">
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
                            { isFree && <span className="text-success-base">Kostenlos</span> }
                        </div>
                        { interactionInfo && <span className={ `text-paragraph-xs ${ interactionInfo.color }` }>{ interactionInfo.label }</span> }
                        { isUnique && <span className="text-paragraph-xs text-warning-base">Limited: { product.uniqueLimitedItemsLeft }/{ product.uniqueLimitedItemSeriesSize }</span> }
                        <span className="font-mono text-subheading-2xs opacity-40">{ furniData?.className }</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
