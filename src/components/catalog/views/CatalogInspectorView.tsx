import { FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GetConfiguration, Offer, ProductTypeEnum } from '../../../api';
import { useCatalog } from '../../../hooks';
import { useFurnitureRarity } from '../../../hooks/rooms/widgets/useFurnitureRarity';
import { CatalogAddOnBadgeWidgetView } from './page/widgets/CatalogAddOnBadgeWidgetView';
import { CatalogLimitedItemWidgetView } from './page/widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from './page/widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from './page/widgets/CatalogSpinnerWidgetView';
import { CatalogViewProductWidgetView } from './page/widgets/CatalogViewProductWidgetView';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';

const ROOM_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200"><rect fill="#111114" width="280" height="200"/><polygon points="140,50 280,120 140,190 0,120" fill="#1a1a2e"/><polygon points="0,120 0,50 140,50 140,120" fill="#15152a" opacity="0.6"/><polygon points="280,120 280,50 140,50 140,120" fill="#0e0e20" opacity="0.6"/><line x1="0" y1="50" x2="140" y2="120" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><line x1="280" y1="50" x2="140" y2="120" stroke="rgba(255,255,255,0.06)" stroke-width="1"/></svg>`)}`;

const ZOOM_SIZE = 300;
const ZOOM_GAP = 8;

const CurrencyImg: FC<{ type: number; className?: string }> = ({ type, className = 'w-4 h-4' }) =>
{
    const url = GetConfiguration<string>('currency.asset.icon.url')?.replace('%type%', String(type));
    if(!url) return null;
    return <img src={ url } alt="" className={ className } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
};

export const CatalogInspectorView: FC<{}> = () =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { rarityData } = useFurnitureRarity(currentOffer?.product?.productClassId ?? 0);
    const previewRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [ isHovering, setIsHovering ] = useState(false);
    const [ zoomPos, setZoomPos ] = useState({ top: 0, left: 0 });

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

    if(isMultiSelect)
    {
        const totalCredits = selectedOffers.reduce((sum, o) => sum + o.priceInCredits, 0);
        const totalPoints = selectedOffers.reduce((sum, o) => sum + o.priceInActivityPoints, 0);

        return (
            <div className="w-[260px] shrink-0 border-l border-white/[0.06] flex flex-col bg-[rgba(10,10,14,0.98)] overflow-y-auto catalog-inspector-enter" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white/90">{ selectedOffers.length }</span>
                        <span className="text-xs text-white/40">Items ausgewählt</span>
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
                                    { !iconUrl && <span className="text-[7px] text-white/40 text-center leading-tight px-0.5 truncate">{ offer.localizationName }</span> }
                                </div>
                            );
                        }) }
                    </div>

                    <Separator className="bg-white/[0.06]" />

                    <div className="flex items-center gap-2 flex-wrap">
                        { totalCredits > 0 && <span className="text-sm font-bold text-amber-300">{ totalCredits } Credits</span> }
                        { totalCredits > 0 && totalPoints > 0 && <span className="text-white/30 text-xs">+</span> }
                        { totalPoints > 0 && <span className="text-sm font-bold text-cyan-300">{ totalPoints } Diamonds</span> }
                        { totalCredits === 0 && totalPoints === 0 && <span className="text-sm font-bold text-emerald-300">Kostenlos</span> }
                    </div>

                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        );
    }

    const priceCredits = currentOffer.priceInCredits;
    const pricePoints = currentOffer.priceInActivityPoints;
    const isFree = priceCredits === 0 && pricePoints === 0;

    return (
        <div className="w-[260px] shrink-0 border-l border-white/[0.06] flex flex-col bg-[rgba(10,10,14,0.98)] overflow-y-auto catalog-inspector-enter" style={ { scrollbarWidth: 'thin' } }>
            {/* Room Preview Area */}
            <div
                ref={ previewRef }
                className="relative h-[200px] shrink-0 overflow-hidden border-b border-white/[0.06] cursor-zoom-in catalog-inspector-hero"
                style={ { backgroundColor: '#111114' } }
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
                <div className="absolute inset-0 opacity-40" style={ { backgroundImage: `url('${ ROOM_BG_SVG }')`, backgroundSize: 'cover', backgroundPosition: 'center' } } />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111114]/60 via-transparent to-[#111114]/30" />

                { (currentOffer.product?.productType !== ProductTypeEnum.BADGE) ? (
                    <div className="relative h-full">
                        <CatalogViewProductWidgetView height={ 200 } />
                        <CatalogAddOnBadgeWidgetView className="absolute bottom-2 right-2 bg-black/40 rounded" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full relative">
                        <CatalogAddOnBadgeWidgetView className="scale-[2]" />
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

            {/* Item Info */}
            <div className="flex flex-col gap-3 p-4 flex-1">
                <div>
                    <h3 className="text-sm font-bold text-white/90 leading-tight">{ currentOffer.localizationName }</h3>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate">{ currentOffer.localizationDescription }</p>
                </div>

                {/* Rarity */}
                { rarityData && (
                    <div className="flex items-center gap-2 flex-wrap">
                        { rarityData.rarityType && (
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
                        ) }
                        { rarityData.circulation > 0 && (
                            <span className="text-[10px] text-white/40">{ rarityData.circulation.toLocaleString() } im Umlauf</span>
                        ) }
                    </div>
                ) }

                <CatalogLimitedItemWidgetView fullWidth />

                <Separator className="bg-white/[0.06]" />

                {/* Price */}
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        { priceCredits > 0 && (
                            <div className="flex items-center gap-1.5">
                                <CurrencyImg type={ -1 } className="w-5 h-5" />
                                <span className="text-lg font-black tabular-nums text-amber-400">{ priceCredits.toLocaleString('de-DE') }</span>
                            </div>
                        ) }
                        { priceCredits > 0 && pricePoints > 0 && <span className="text-white/30 text-xs">+</span> }
                        { pricePoints > 0 && (
                            <div className="flex items-center gap-1.5">
                                <CurrencyImg type={ currentOffer.activityPointType } className="w-5 h-5" />
                                <span className="text-lg font-black tabular-nums text-cyan-400">{ pricePoints.toLocaleString('de-DE') }</span>
                            </div>
                        ) }
                        { isFree && <span className="text-lg font-black text-emerald-400">Kostenlos</span> }
                    </div>
                </div>

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

                <Separator className="bg-white/[0.06]" />

                {/* Purchase */}
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
};
