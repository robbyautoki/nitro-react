import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Store, Package, BarChart3, History, MessageCircle, ShoppingBag, X, GripVertical } from 'lucide-react';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { GetConfiguration } from '../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplacePriceChartView } from './MarketplacePriceChartView';
import { CustomMarketplaceBrowseView } from './CustomMarketplaceBrowseView';
import { CustomMarketplaceSalesView } from './CustomMarketplaceSalesView';
import { CustomMarketplaceOffersView } from './CustomMarketplaceOffersView';
import { CustomMarketplaceSellView } from './CustomMarketplaceSellView';
import { CustomMarketplaceMyListingsView } from './CustomMarketplaceMyListingsView';

const TABS = [
    { id: 'custom-browse', label: 'Allgemein', icon: Store },
    { id: 'custom-my', label: 'Meine Angebote', icon: Package },
    { id: 'custom-sales', label: 'Meine Verkäufe', icon: History },
    { id: 'custom-offers', label: 'Anfragen', icon: MessageCircle },
    { id: 'custom-sell', label: 'Verkaufen', icon: ShoppingBag },
    { id: 'charts', label: 'Preisverlauf', icon: BarChart3 },
] as const;

const MIN_W = 820;
const MIN_H = 520;
const MAX_W = 1260;
const MAX_H = 860;

export const MarketplaceView: FC<{}> = () =>
{
    const { isVisible, setIsVisible, currentTab, setCurrentTab } = useMarketplace();
    const onClose = useCallback(() => setIsVisible(false), [ setIsVisible ]);

    const [ size, setSize ] = useState({ w: 1040, h: 660 });
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    useEffect(() =>
    {
        const onMove = (e: PointerEvent) =>
        {
            if(!resizeRef.current) return;
            setSize({
                w: Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.startW + e.clientX - resizeRef.current.startX)),
                h: Math.min(MAX_H, Math.max(MIN_H, resizeRef.current.startH + e.clientY - resizeRef.current.startY)),
            });
        };
        const onUp = () =>
        {
            resizeRef.current = null;
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () =>
        {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
        };
    }, []);

    const onResizeStart = useCallback((e: React.PointerEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    }, [ size ]);

    if(!isVisible) return null;

    return (
        <AlignTooltip.Provider delayDuration={ 150 }>
            <DraggableWindow uniqueKey="marketplace" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <AlignSurface.Panel
                    className="overflow-hidden flex flex-col relative"
                    style={ { width: size.w, height: size.h } }
                >
                    { /* Title Bar */ }
                    <div className="drag-handler flex h-11 shrink-0 cursor-grab select-none items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0 px-3 active:cursor-grabbing">
                        <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-text-soft-400" />
                            <Store className="w-3.5 h-3.5 text-text-sub-600" />
                            <span className="text-label-sm text-text-strong-950">Marktplatz</span>
                            <AlignDivider.Root className="h-4 w-px mx-1" />
                            <span className="text-paragraph-xs text-text-sub-600">Handelsplatz für Möbel</span>
                            <AlignBadge.Root color="green" variant="lighter" size="small" square>Live</AlignBadge.Root>
                        </div>
                        <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="w-7 h-7 px-0" onClick={ onClose }>
                            <X className="w-3 h-3" />
                        </AlignButton.Root>
                    </div>
                    { /* Marketplace Banner */ }
                    <div className="shrink-0 border-b border-stroke-soft-200 overflow-hidden">
                        <img
                            src={ `${ GetConfiguration<string>('asset.url', 'http://localhost:8080') }/c_images/catalogue/bonush.gif` }
                            alt="Marktplatz"
                            className="w-full h-[64px] object-cover"
                            style={ { imageRendering: 'pixelated' } }
                            draggable={ false }
                        />
                    </div>
                    { /* Tab Bar */ }
                    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-stroke-soft-200 bg-bg-weak-50 px-2">
                        { TABS.map(tab =>
                        {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;

                            return (
                                <AlignButton.Root
                                    key={ tab.id }
                                    variant="neutral"
                                    mode={ isActive ? 'lighter' : 'ghost' }
                                    size="xxsmall"
                                    className="h-8 gap-1.5 px-2 text-label-xs"
                                    onClick={ () => setCurrentTab(tab.id) }
                                >
                                    <Icon className="w-3 h-3" />
                                    { tab.label }
                                </AlignButton.Root>
                            );
                        }) }
                    </div>
                    { /* Content */ }
                    <div className="flex-1 min-h-0 overflow-hidden">
                        { currentTab === 'custom-browse' && <CustomMarketplaceBrowseView /> }
                        { currentTab === 'custom-my' && <CustomMarketplaceMyListingsView /> }
                        { currentTab === 'custom-sales' && <CustomMarketplaceSalesView /> }
                        { currentTab === 'custom-offers' && <CustomMarketplaceOffersView /> }
                        { currentTab === 'custom-sell' && <CustomMarketplaceSellView /> }
                        { currentTab === 'charts' && <MarketplacePriceChartView /> }
                    </div>
                    { /* Resize Handle */ }
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end"
                        onPointerDown={ onResizeStart }
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" className="text-text-soft-400">
                            <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                        </svg>
                    </div>
                </AlignSurface.Panel>
            </DraggableWindow>
        </AlignTooltip.Provider>
    );
};
