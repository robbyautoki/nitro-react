import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Store, Package, BarChart3, History, MessageCircle, ShoppingBag, X, GripVertical } from 'lucide-react';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { GetConfiguration } from '../../api';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
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

const MIN_W = 600;
const MIN_H = 420;
const MAX_W = 1000;
const MAX_H = 750;

export const MarketplaceView: FC<{}> = () =>
{
    const { isVisible, setIsVisible, currentTab, setCurrentTab } = useMarketplace();
    const onClose = useCallback(() => setIsVisible(false), [ setIsVisible ]);

    const [ size, setSize ] = useState({ w: 820, h: 580 });
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
        const onUp = () => { resizeRef.current = null; };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, []);

    const onResizeStart = useCallback((e: React.PointerEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    }, [ size ]);

    if(!isVisible) return null;

    return (
        <TooltipProvider delayDuration={ 150 }>
            <DraggableWindow uniqueKey="marketplace" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div
                    className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col relative"
                    style={ { width: size.w, height: size.h } }
                >
                    {/* Title Bar */}
                    <div className="drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                        <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                            <Store className="w-3.5 h-3.5 text-muted-foreground/50" />
                            <span className="text-[13px] font-semibold">Marktplatz</span>
                            <Separator orientation="vertical" className="h-3 mx-1" />
                            <span className="text-[9px] text-muted-foreground/50">Handelsplatz für Möbel</span>
                        </div>
                        <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onClick={ onClose }>
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Marketplace Banner */}
                    <div className="shrink-0 border-b border-border/30 overflow-hidden">
                        <img
                            src={ `${ GetConfiguration<string>('assets.url', 'http://localhost:8080') }/c_images/catalogue/bonush.gif` }
                            alt="Marktplatz"
                            className="w-full h-[64px] object-cover"
                            style={ { imageRendering: 'pixelated' } }
                            draggable={ false }
                        />
                    </div>

                    {/* Tab Bar */}
                    <div className="shrink-0 flex gap-0.5 px-2 pt-1.5 pb-1 border-b border-border/30">
                        { TABS.map(tab =>
                        {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;

                            return (
                                <button
                                    key={ tab.id }
                                    className={ `flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${ isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground' }` }
                                    onClick={ () => setCurrentTab(tab.id) }
                                >
                                    <Icon className="w-3 h-3" />
                                    { tab.label }
                                </button>
                            );
                        }) }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        { currentTab === 'custom-browse' && <CustomMarketplaceBrowseView /> }
                        { currentTab === 'custom-my' && <CustomMarketplaceMyListingsView /> }
                        { currentTab === 'custom-sales' && <CustomMarketplaceSalesView /> }
                        { currentTab === 'custom-offers' && <CustomMarketplaceOffersView /> }
                        { currentTab === 'custom-sell' && <CustomMarketplaceSellView /> }
                        { currentTab === 'charts' && <MarketplacePriceChartView /> }
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end"
                        onPointerDown={ onResizeStart }
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30">
                            <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                        </svg>
                    </div>
                </div>
            </DraggableWindow>
        </TooltipProvider>
    );
};
