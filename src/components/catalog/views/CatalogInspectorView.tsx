import { FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Offer, ProductTypeEnum } from '../../../api';
import { useCatalog } from '../../../hooks';
import { useFurnitureRarity } from '../../../hooks/rooms/widgets/useFurnitureRarity';
import { CatalogAddOnBadgeWidgetView } from './page/widgets/CatalogAddOnBadgeWidgetView';
import { CatalogLimitedItemWidgetView } from './page/widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from './page/widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from './page/widgets/CatalogSpinnerWidgetView';
import { CatalogViewProductWidgetView } from './page/widgets/CatalogViewProductWidgetView';
import { Button } from '../../ui/button';

const ZOOM_SIZE = 300;
const ZOOM_GAP = 8;

export const CatalogInspectorView: FC<{}> = props =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { rarityData } = useFurnitureRarity(currentOffer?.product?.productClassId ?? 0);
    const previewRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [ isHovering, setIsHovering ] = useState(false);
    const [ zoomPos, setZoomPos ] = useState({ top: 0, left: 0 });

    // Calculate position when hover starts
    useEffect(() =>
    {
        if(!isHovering || !previewRef.current) return;

        const rect = previewRef.current.getBoundingClientRect();
        setZoomPos({
            top: Math.max(8, rect.top - ZOOM_SIZE - ZOOM_GAP),
            left: rect.left
        });
    }, [ isHovering ]);

    // Cleanup hover timer on unmount
    useEffect(() =>
    {
        return () =>
        {
            if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    // rAF sync loop — live copy backgroundImage from source to zoom div
    useEffect(() =>
    {
        if(!isHovering) return;

        const sync = () =>
        {
            if(previewRef.current && zoomRef.current)
            {
                const srcEl = previewRef.current.querySelector('.room-preview-image') as HTMLElement;

                if(srcEl?.style.backgroundImage)
                {
                    zoomRef.current.style.backgroundImage = srcEl.style.backgroundImage;
                }
            }

            rafRef.current = requestAnimationFrame(sync);
        };

        rafRef.current = requestAnimationFrame(sync);

        return () =>
        {
            if(rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ isHovering ]);

    if(!currentOffer) return null;

    const selectedOffers = purchaseOptions?.selectedOffers;
    const isMultiSelect = selectedOffers && selectedOffers.length > 1;

    if(isMultiSelect)
    {
        const totalCredits = selectedOffers.reduce((sum, o) => sum + o.priceInCredits, 0);
        const totalPoints = selectedOffers.reduce((sum, o) => sum + o.priceInActivityPoints, 0);

        return (
            <div className="flex items-stretch gap-0 h-[140px]">
                {/* Scrollable item strip */}
                <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden flex items-center gap-1.5 px-3 py-2">
                    { selectedOffers.map((offer, i) =>
                    {
                        const iconUrl = (offer.pricingModel !== Offer.PRICING_MODEL_BUNDLE && offer.product)
                            ? offer.product.getIconUrl(offer)
                            : null;

                        return (
                            <div
                                key={ offer.offerId }
                                className="shrink-0 w-[52px] h-[52px] rounded-lg border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center overflow-hidden"
                                style={ iconUrl ? { backgroundImage: `url(${ iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                                title={ offer.localizationName }
                            >
                                { !iconUrl &&
                                    <span className="text-[8px] text-white/40 text-center leading-tight px-0.5 truncate">{ offer.localizationName }</span> }
                            </div>
                        );
                    }) }
                </div>

                {/* Summary */}
                <div className="shrink-0 flex flex-col justify-center items-center px-4 border-l border-white/[0.06] min-w-[80px]">
                    <span className="text-lg font-bold text-white/90">{ selectedOffers.length }</span>
                    <span className="text-[10px] text-white/40 mb-1.5">Items</span>
                    { totalCredits > 0 &&
                        <span className="text-xs font-bold text-amber-300">{ totalCredits } Credits</span> }
                    { totalCredits > 0 && totalPoints > 0 &&
                        <span className="text-[9px] text-white/30">+</span> }
                    { totalPoints > 0 &&
                        <span className="text-xs font-bold text-cyan-300">{ totalPoints } Diamonds</span> }
                    { totalCredits === 0 && totalPoints === 0 &&
                        <span className="text-xs font-bold text-emerald-300">Kostenlos</span> }
                </div>

                {/* Purchase button */}
                <div className="w-[160px] shrink-0 flex items-center justify-center px-3 border-l border-white/[0.06]">
                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-stretch gap-0 h-[140px]">
            {/* Preview */}
            <div
                ref={ previewRef }
                className="relative w-[140px] shrink-0 bg-black/40 overflow-hidden cursor-zoom-in"
                onMouseEnter={ () =>
                {
                    if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = setTimeout(() => setIsHovering(true), 1000);
                } }
                onMouseLeave={ () =>
                {
                    if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = null;
                    setIsHovering(false);
                } }
            >
                { (currentOffer.product.productType !== ProductTypeEnum.BADGE) ? (
                    <>
                        <CatalogViewProductWidgetView height={ 140 } />
                        <CatalogAddOnBadgeWidgetView className="absolute bottom-1.5 right-1.5 bg-black/40 rounded" />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <CatalogAddOnBadgeWidgetView className="scale-[1.5]" />
                    </div>
                ) }
            </div>

            {/* Zoom Portal */}
            { isHovering && createPortal(
                <div
                    ref={ zoomRef }
                    className="pointer-events-none"
                    style={ {
                        position: 'fixed',
                        top: zoomPos.top,
                        left: zoomPos.left,
                        width: ZOOM_SIZE,
                        height: ZOOM_SIZE,
                        zIndex: 99999,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(16px)',
                        backgroundColor: 'rgba(10,10,14,0.95)',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        imageRendering: 'pixelated',
                        overflow: 'hidden',
                    } }
                />,
                document.body
            ) }

            {/* Info: Name + Price + Limited */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 px-4 py-2">
                <h3 className="text-[13px] font-semibold text-white/90 leading-tight truncate">
                    { currentOffer.localizationName }
                </h3>

                { rarityData && (
                    <div className="flex items-center gap-2 flex-wrap">
                        { rarityData.rarityType && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={ { background: `${ rarityData.rarityType.colorPrimary }20`, color: rarityData.rarityType.colorPrimary, border: `1px solid ${ rarityData.rarityType.colorPrimary }40` } }>
                                { rarityData.rarityType.displayName }
                            </span>
                        ) }
                        { rarityData.circulation > 0 && (
                            <span className="text-[10px] text-white/40">
                                { rarityData.circulation.toLocaleString() } im Umlauf
                            </span>
                        ) }
                    </div>
                ) }

                <CatalogLimitedItemWidgetView fullWidth />

                {/* Price */}
                <div className="flex items-center gap-2 flex-wrap">
                    { (currentOffer.priceInCredits > 0) &&
                        <span className="text-sm font-bold text-amber-300">
                            { currentOffer.priceInCredits } Credits
                        </span> }
                    { (currentOffer.priceInCredits > 0) && (currentOffer.priceInActivityPoints > 0) &&
                        <span className="text-white/30 text-xs">+</span> }
                    { (currentOffer.priceInActivityPoints > 0) &&
                        <span className="text-sm font-bold text-cyan-300">
                            { currentOffer.priceInActivityPoints } Diamonds
                        </span> }
                    { (currentOffer.priceInCredits === 0) && (currentOffer.priceInActivityPoints === 0) &&
                        <span className="text-sm font-bold text-emerald-300">Kostenlos</span> }
                </div>

                {/* Quantity + Quick amounts */}
                <div className="flex items-center gap-2">
                    <CatalogSpinnerWidgetView />
                    { currentOffer.bundlePurchaseAllowed &&
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2"
                                onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: 50 })) }>
                                ×50
                            </Button>
                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2"
                                onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: 100 })) }>
                                ×100
                            </Button>
                        </div> }
                </div>
            </div>

            {/* Purchase Button */}
            <div className="w-[160px] shrink-0 flex items-center justify-center px-3 border-l border-white/[0.06]">
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
}
