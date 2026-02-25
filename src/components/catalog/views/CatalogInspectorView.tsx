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
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { X, RotateCw, Eye, Sparkles } from 'lucide-react';

const ROOM_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="220" viewBox="0 0 280 220"><rect fill="#f0f1f3" width="280" height="220"/><polygon points="140,60 280,130 140,200 0,130" fill="#e2e4e8"/><polygon points="0,130 0,60 140,60 140,130" fill="#e8eaed" opacity="0.6"/><polygon points="280,130 280,60 140,60 140,130" fill="#dcdfe3" opacity="0.6"/><line x1="0" y1="60" x2="140" y2="130" stroke="rgba(0,0,0,0.06)" stroke-width="1"/><line x1="280" y1="60" x2="140" y2="130" stroke="rgba(0,0,0,0.06)" stroke-width="1"/></svg>`)}`;

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
        if(!currentOffer?.product) { setLoadedVariants([]); setVariantIdx(0); return; }

        const className = currentOffer.product.furnitureData?.className || '';
        if(!className.includes('*')) { setLoadedVariants([]); setVariantIdx(0); return; }

        const baseName = className.split('*')[0];
        const results: string[] = [];
        let loaded = 0;
        const total = 10;

        for(let i = 1; i <= total; i++)
        {
            const url = `${ assetUrl }${ baseName }*${ i }_icon.png`;
            const img = new Image();
            img.onload = () => { results.push(url); loaded++; if(loaded === total) setLoadedVariants([ ...results ]); };
            img.onerror = () => { loaded++; if(loaded === total) setLoadedVariants([ ...results ]); };
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

    useEffect(() => () => { if(hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

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
        return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
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
            <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-foreground">{ selectedOffers.length }</span>
                        <span className="text-xs text-muted-foreground">Items ausgewählt</span>
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
                                    className="w-[48px] h-[48px] rounded-lg border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center overflow-hidden"
                                    style={ iconUrl ? { backgroundImage: `url(${ iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                                    title={ offer.localizationName }
                                >
                                    { !iconUrl && <span className="text-[7px] text-muted-foreground text-center leading-tight px-0.5 truncate">{ offer.localizationName }</span> }
                                </div>
                            );
                        }) }
                    </div>

                    <Separator />
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
        <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto catalog-inspector-enter" style={ { scrollbarWidth: 'thin' } }>
            <style>{ `@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }` }</style>

            {/* Room Preview Area */}
            <div
                ref={ previewRef }
                className="relative h-[220px] shrink-0 overflow-hidden rounded-b-xl border-b border-border/30 cursor-zoom-in"
                style={ { backgroundColor: 'var(--muted)' } }
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
                <div className="absolute inset-0" style={ { backgroundImage: `url('${ ROOM_BG_SVG }')`, backgroundSize: 'cover', backgroundPosition: 'center' } } />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30" />

                { (product?.productType !== ProductTypeEnum.BADGE) ? (
                    <div className="relative h-full" style={ loadedVariants.length <= 1 ? { animation: 'float 3s ease-in-out infinite' } : undefined }>
                        <CatalogViewProductWidgetView height={ 220 } />
                        <CatalogAddOnBadgeWidgetView className="absolute bottom-2 right-2 bg-black/40 rounded" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full relative">
                        <CatalogAddOnBadgeWidgetView className="scale-[2]" />
                    </div>
                ) }

                {/* Close button */}
                <button
                    onClick={ () => setCurrentOffer(null) }
                    className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-white/90 hover:bg-black/60 transition-colors z-10"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* Variant controls */}
                <div className="absolute top-2.5 right-2.5 flex gap-1">
                    { loadedVariants.length > 1 && (
                        <button
                            onClick={ () => setVariantIdx(v => (v + 1) % loadedVariants.length) }
                            className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-white/90 hover:bg-black/60 transition-colors"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                    ) }
                </div>

                {/* Variant dots */}
                { loadedVariants.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                        { loadedVariants.map((_, i) => (
                            <div key={ i } className={ `w-1.5 h-1.5 rounded-full transition-all ${ i === variantIdx % loadedVariants.length ? 'bg-foreground/80 w-3' : 'bg-foreground/20' }` } />
                        )) }
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
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
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

            {/* Item Info */}
            <div className="flex flex-col gap-3 p-4 flex-1">
                <div>
                    <h3 className="text-base font-bold tracking-tight leading-tight">{ currentOffer.localizationName }</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{ currentOffer.localizationDescription || furniData?.className }</p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium text-muted-foreground border border-border/40 rounded-md px-2 py-0.5">
                        { isWall ? 'Wand' : 'Boden' }
                    </span>
                    { furniData && (
                        <span className="text-[10px] font-medium text-muted-foreground border border-border/40 rounded-md px-2 py-0.5">
                            { furniData.dimX }×{ furniData.dimY }
                        </span>
                    ) }
                    { interactionInfo && (
                        <span className="text-[10px] font-medium text-muted-foreground border border-border/40 rounded-md px-2 py-0.5 flex items-center gap-1">
                            <span className={ `text-[6px] ${ interactionInfo.color }` }>●</span>
                            { interactionInfo.label }
                        </span>
                    ) }
                    { stateCount > 1 && (
                        <span className="text-[10px] font-medium text-muted-foreground border border-border/40 rounded-md px-2 py-0.5 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />{ stateCount } Zustände
                        </span>
                    ) }
                    { product?.isUniqueLimitedItem && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            { product.uniqueLimitedItemsLeft }/{ product.uniqueLimitedItemSeriesSize }
                        </span>
                    ) }
                </div>

                {/* Rarity */}
                { rarityData?.rarityType && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={ {
                                background: `${ rarityData.rarityType.colorPrimary }20`,
                                color: rarityData.rarityType.colorPrimary,
                                border: `1px solid ${ rarityData.rarityType.colorPrimary }40`,
                            } }
                        >
                            { rarityData.rarityType.displayName }
                        </span>
                        { rarityData.circulation > 0 && (
                            <span className="text-[10px] text-muted-foreground">{ rarityData.circulation.toLocaleString() } im Umlauf</span>
                        ) }
                    </div>
                ) }

                <CatalogLimitedItemWidgetView fullWidth />

                <Separator />

                {/* Price */}
                <CatalogPriceDisplay
                    credits={ currentOffer.priceInCredits }
                    points={ currentOffer.priceInActivityPoints }
                    pointsType={ currentOffer.activityPointType }
                />

                {/* Quantity */}
                <CatalogSpinnerWidgetView />

                { currentOffer.bundlePurchaseAllowed && (
                    <div className="flex gap-1">
                        { [ 5, 10, 25, 50 ].map((n) => (
                            <Button
                                key={ n }
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-[10px] rounded-lg font-semibold"
                                onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: n })) }
                            >
                                ×{ n }
                            </Button>
                        )) }
                    </div>
                ) }

                <Separator />

                {/* Purchase */}
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
};
