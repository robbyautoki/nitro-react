import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GetConfiguration, Offer, ProductTypeEnum } from '../../../api';
import { useCatalog } from '../../../hooks';
import { useFurnitureRarity } from '../../../hooks/rooms/widgets/useFurnitureRarity';
import { INTERACTION_LABELS } from './shared/CatalogInteractionFilter';
import { CatalogPriceDisplay } from './shared/CatalogPriceDisplay';
import { CatalogAddOnBadgeWidgetView } from './page/widgets/CatalogAddOnBadgeWidgetView';
import { CatalogLimitedItemWidgetView } from './page/widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from './page/widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from './page/widgets/CatalogSpinnerWidgetView';
import { CatalogViewProductWidgetView } from './page/widgets/CatalogViewProductWidgetView';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as Divider from '@/align-ui/components/ui/divider';
import { X, RotateCw, Eye, Sparkles } from 'lucide-react';

const ZOOM_SIZE = 300;
const ZOOM_GAP = 8;

export const CatalogInspectorView: FC<{}> = () =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null, setCurrentOffer = null } = useCatalog();
    const { rarityData } = useFurnitureRarity(currentOffer?.product?.productClassId ?? 0);
    const previewRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [ isHovering, setIsHovering ] = useState(false);
    const [ zoomPos, setZoomPos ] = useState({ top: 0, left: 0 });
    const [ variantIdx, setVariantIdx ] = useState(0);
    const [ loadedVariants, setLoadedVariants ] = useState<string[]>([]);

    const assetUrl = useMemo(() => GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/'), []);

    // Variant probing
    useEffect(() =>
    {
        if(!currentOffer?.product) 
        {
            setLoadedVariants([]); setVariantIdx(0); return; 
        }

        const className = currentOffer.product.furnitureData?.className || '';
        if(!className.includes('*')) 
        {
            setLoadedVariants([]); setVariantIdx(0); return; 
        }

        const baseName = className.split('*')[0];
        const results: string[] = [];
        let loaded = 0;
        const total = 10;

        for(let i = 1; i <= total; i++)
        {
            const url = `${ assetUrl }${ baseName }*${ i }_icon.png`;
            const img = new Image();
            img.onload = () => 
            {
                results.push(url); loaded++; if(loaded === total) setLoadedVariants([ ...results ]); 
            };
            img.onerror = () => 
            {
                loaded++; if(loaded === total) setLoadedVariants([ ...results ]); 
            };
            img.src = url;
        }
    }, [ currentOffer, assetUrl ]);

    // Auto-cycle variants
    useEffect(() =>
    {
        if(loadedVariants.length <= 1) return;
        const timer = setInterval(() => setVariantIdx(v => (v + 1) % loadedVariants.length), 2000);
        return () => clearInterval(timer);
    }, [ loadedVariants.length ]);

    // Zoom positioning
    useEffect(() =>
    {
        if(!isHovering || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        setZoomPos({
            top: Math.max(8, rect.top - ZOOM_SIZE - ZOOM_GAP),
            left: Math.max(8, rect.left + rect.width / 2 - ZOOM_SIZE / 2),
        });
    }, [ isHovering ]);

    useEffect(() => () => 
    {
        if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current); 
    }, []);

    // Zoom sync
    useEffect(() =>
    {
        if(!isHovering) return;
        const sync = () =>
        {
            if(previewRef.current && zoomRef.current)
            {
                const srcEl = previewRef.current.querySelector('.room-preview-image') as HTMLElement;
                if(srcEl?.style.backgroundImage) zoomRef.current.style.backgroundImage = srcEl.style.backgroundImage;
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

    // ── Multi-select view ──
    if(isMultiSelect)
    {
        const totalCredits = selectedOffers.reduce((sum, o) => sum + o.priceInCredits, 0);
        const totalPoints = selectedOffers.reduce((sum, o) => sum + o.priceInActivityPoints, 0);

        return (
            <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-stroke-soft-200 bg-bg-weak-50" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-title-h5 text-text-strong-950">{ selectedOffers.length }</span>
                        <span className="text-paragraph-xs text-text-sub-600">Items ausgewählt</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        { selectedOffers.map((offer) =>
                        {
                            const iconUrl = (offer.pricingModel !== Offer.PRICING_MODEL_BUNDLE && offer.product)
                                ? offer.product.getIconUrl(offer)
                                : null;
                            return (
                                <div
                                    key={ offer.offerId }
                                    className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-success-lighter ring-1 ring-inset ring-success-base"
                                    style={ iconUrl ? { backgroundImage: `url(${ iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                                    title={ offer.localizationName }
                                >
                                    { !iconUrl && <span className="truncate px-0.5 text-center text-subheading-2xs leading-tight text-text-sub-600">{ offer.localizationName }</span> }
                                </div>
                            );
                        }) }
                    </div>
                    <Divider.Root />
                    <CatalogPriceDisplay credits={ totalCredits } points={ totalPoints } />
                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        );
    }

    // ── Single item view ──
    const product = currentOffer.product;
    const furniData = product?.furnitureData;
    const interactionType = furniData?.interactionType || '';
    const interactionInfo = INTERACTION_LABELS[interactionType];
    const isWall = product?.productType === ProductTypeEnum.WALL;
    const stateCount = furniData?.customParams || 0;

    return (
        <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-stroke-soft-200 bg-bg-weak-50 catalog-inspector-enter" style={ { scrollbarWidth: 'thin' } }>
            <style>{ '@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }' }</style>
            { /* Room Preview Area */ }
            <div
                ref={ previewRef }
                className="relative h-[236px] shrink-0 cursor-zoom-in overflow-hidden border-b border-stroke-soft-200 bg-bg-white-0"
                onMouseEnter={ () =>
                {
                    if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = setTimeout(() => setIsHovering(true), 800);
                } }
                onMouseLeave={ () =>
                {
                    if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = null;
                    setIsHovering(false);
                } }
            >
                <div className="absolute inset-0 bg-[linear-gradient(150deg,hsl(var(--align-bg-white-0))_0%,hsl(var(--align-bg-weak-50))_52%,hsl(var(--align-bg-soft-200))_100%)]" />
                <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(30deg,hsl(var(--align-stroke-soft-200))_1px,transparent_1px),linear-gradient(150deg,hsl(var(--align-stroke-soft-200))_1px,transparent_1px)] [background-size:48px_48px]" />
                { (product?.productType !== ProductTypeEnum.BADGE) ? (
                    <div className="relative h-full" style={ loadedVariants.length <= 1 ? { animation: 'float 3s ease-in-out infinite' } : undefined }>
                        <CatalogViewProductWidgetView height={ 220 } />
                        <CatalogAddOnBadgeWidgetView className="absolute bottom-2 right-2 rounded bg-bg-strong-950/40" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full relative">
                        <CatalogAddOnBadgeWidgetView className="scale-[2]" />
                    </div>
                ) }
                { /* Close button */ }
                <button
                    onClick={ () => setCurrentOffer(null) }
                    className="absolute left-2.5 top-2.5 z-10 rounded-lg bg-bg-strong-950/40 p-1.5 text-static-white/70 backdrop-blur-sm transition-colors hover:bg-bg-strong-950/60 hover:text-static-white"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                { /* Variant controls */ }
                <div className="absolute top-2.5 right-2.5 flex gap-1">
                    { loadedVariants.length > 1 && (
                        <button
                            onClick={ () => setVariantIdx(v => (v + 1) % loadedVariants.length) }
                            className="rounded-lg bg-bg-strong-950/40 p-1.5 text-static-white/70 backdrop-blur-sm transition-colors hover:bg-bg-strong-950/60 hover:text-static-white"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                    ) }
                </div>
                { /* Variant dots */ }
                { loadedVariants.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                        { loadedVariants.map((_, i) => (
                            <div key={ i } className={ `w-1.5 h-1.5 rounded-full transition-all ${ i === variantIdx % loadedVariants.length ? 'bg-text-strong-950/80 w-3' : 'bg-text-strong-950/20' }` } />
                        )) }
                    </div>
                ) }
            </div>
            { /* Zoom Portal */ }
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
                        border: '1px solid hsl(var(--align-stroke-soft-200))',
                        boxShadow: 'var(--shadow-regular-md)',
                        backdropFilter: 'blur(16px)',
                        backgroundColor: 'color-mix(in oklch, var(--card) 95%, transparent)',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        imageRendering: 'pixelated',
                        overflow: 'hidden',
                    } }
                />,
                document.body
            ) }
            { /* Item Info */ }
            <div className="flex flex-col gap-3 p-4 flex-1">
                <div>
                    <h3 className="text-label-md text-text-strong-950">{ currentOffer.localizationName }</h3>
                    <p className="mt-0.5 truncate font-mono text-paragraph-xs text-text-soft-400">{ currentOffer.localizationDescription || furniData?.className }</p>
                </div>
                { /* Badges */ }
                <div className="flex items-center gap-1.5 flex-wrap">
                    <AlignBadge.Root color="gray" variant="lighter" size="small" square>
                        { isWall ? 'Wand' : 'Boden' }
                    </AlignBadge.Root>
                    { furniData && (
                        <AlignBadge.Root color="gray" variant="lighter" size="small" square>
                            { furniData.dimX }×{ furniData.dimY }
                        </AlignBadge.Root>
                    ) }
                    { interactionInfo && (
                        <AlignBadge.Root color="blue" variant="lighter" size="small" square>
                            <span className={ `text-subheading-2xs ${ interactionInfo.color }` }>●</span>
                            { interactionInfo.label }
                        </AlignBadge.Root>
                    ) }
                    { stateCount > 1 && (
                        <AlignBadge.Root color="gray" variant="lighter" size="small" square>
                            <Eye className="w-2.5 h-2.5" />{ stateCount } Zustände
                        </AlignBadge.Root>
                    ) }
                    { product?.isUniqueLimitedItem && (
                        <AlignBadge.Root color="yellow" variant="lighter" size="small" square>
                            <Sparkles className="w-2.5 h-2.5" />
                            { product.uniqueLimitedItemsLeft }/{ product.uniqueLimitedItemSeriesSize }
                        </AlignBadge.Root>
                    ) }
                </div>
                { /* Rarity */ }
                { rarityData?.rarityType && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="rounded-md px-2 py-0.5 text-subheading-2xs"
                            style={ {
                                background: `${ rarityData.rarityType.colorPrimary }20`,
                                color: rarityData.rarityType.colorPrimary,
                                border: `1px solid ${ rarityData.rarityType.colorPrimary }40`,
                            } }
                        >
                            { rarityData.rarityType.displayName }
                        </span>
                        { rarityData.circulation > 0 && (
                            <span className="text-paragraph-xs text-text-sub-600">{ rarityData.circulation.toLocaleString() } im Umlauf</span>
                        ) }
                    </div>
                ) }
                <CatalogLimitedItemWidgetView fullWidth />
                <Divider.Root />
                { /* Price */ }
                <CatalogPriceDisplay
                    credits={ currentOffer.priceInCredits }
                    points={ currentOffer.priceInActivityPoints }
                    pointsType={ currentOffer.activityPointType }
                />
                { /* Quantity */ }
                <CatalogSpinnerWidgetView />
                { currentOffer.bundlePurchaseAllowed && (
                    <div className="flex gap-1">
                        { [ 5, 10, 25, 50 ].map((n) => (
                            <AlignButton.Root
                                key={ n }
                                variant="neutral"
                                mode="stroke"
                                size="xxsmall"
                                className="h-7 flex-1 rounded-lg text-label-xs"
                                onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: n })) }
                            >
                                ×{ n }
                            </AlignButton.Root>
                        )) }
                    </div>
                ) }
                <Divider.Root />
                { /* Purchase */ }
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
};
