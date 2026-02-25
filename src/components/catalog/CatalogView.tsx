import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, PanelLeftClose, PanelLeft, Clock, Flame, ShieldCheck } from 'lucide-react';
import { AddEventLinkTracker, CatalogType, GetSessionDataManager, LocalizeText, Offer, OpenUrl, RemoveLinkEventTracker } from '../../api';
import { CatalogPurchasedEvent } from '../../events';
import { useCatalog, useUiEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { CatalogInspectorView } from './views/CatalogInspectorView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSubcategoryChipsView } from './views/navigation/CatalogSubcategoryChipsView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { CatalogVirtualGridView } from './views/page/layout/CatalogVirtualGridView';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const RECENT_KEY = 'catalog_recent_purchases';
const FREQUENT_KEY = 'catalog_most_purchased';
const MAX_TRACKED = 8;

export interface TrackedPurchase
{
    name: string;
    iconUrl: string;
    offerId: number;
    priceCredits: number;
    count?: number;
}

export const loadTracked = (key: string): TrackedPurchase[] =>
{
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
};

const saveTracked = (key: string, items: TrackedPurchase[]) =>
{
    try { localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_TRACKED))); }
    catch {}
};

const SELF_CONTAINED_LAYOUTS = new Set([
    'frontpage4', 'frontpage_featured',
    'pets', 'pets2', 'pets3',
    'vip_buy', 'club_gifts',
    'marketplace', 'marketplace_own_items',
    'guild_frontpage', 'guild_forum',
    'info_loyalty', 'roomads',
]);

export const CatalogView: FC<{}> = props =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, setRootNode = null, currentType, setCurrentType = null, currentPage = null, currentOffer = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById, catalogSize, setCatalogSize } = useCatalog();

    const [ sidebarCollapsed, setSidebarCollapsed ] = useState(false);
    const [ inspectorOverlay, setInspectorOverlay ] = useState(false);
    const [ virtualPage, setVirtualPage ] = useState<string | null>(null);
    const [ staffView, setStaffView ] = useState(false);
    const isMod = GetSessionDataManager().isModerator;
    const catalogContentRef = useRef<HTMLDivElement>(null);

    const resizingRef = useRef(false);
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const resizeListenersRef = useRef<{ move: ((ev: MouseEvent) => void) | null, up: (() => void) | null }>({ move: null, up: null });

    const onResizeStart = useCallback((e: React.MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = true;
        resizeStartRef.current = { x: e.clientX, y: e.clientY, w: catalogSize.width, h: catalogSize.height };

        const onMouseMove = (ev: MouseEvent) =>
        {
            if(!resizingRef.current) return;
            const newW = Math.max(580, Math.min(1200, resizeStartRef.current.w + (ev.clientX - resizeStartRef.current.x)));
            const newH = Math.max(300, Math.min(window.innerHeight - 32, resizeStartRef.current.h + (ev.clientY - resizeStartRef.current.y)));
            setCatalogSize({ width: newW, height: newH });
        };

        const onMouseUp = () =>
        {
            resizingRef.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            resizeListenersRef.current = { move: null, up: null };
        };

        resizeListenersRef.current = { move: onMouseMove, up: onMouseUp };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [ catalogSize, setCatalogSize ]);

    useEffect(() =>
    {
        return () =>
        {
            const { move, up } = resizeListenersRef.current;
            if(move) document.removeEventListener('mousemove', move);
            if(up) document.removeEventListener('mouseup', up);
        };
    }, []);

    // Intercept clicks on <a> tags in server-rendered HTML (e.g. event:habbopages/ links)
    useEffect(() =>
    {
        const handleLinkClick = (event: MouseEvent) =>
        {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');

            if(!anchor) return;

            const href = anchor.getAttribute('href');
            if(!href) return;

            event.preventDefault();
            OpenUrl(href);
        };

        const el = catalogContentRef.current;
        if(!el) return;

        el.addEventListener('click', handleLinkClick);
        return () => el.removeEventListener('click', handleLinkClick);
    }, []);

    // Cmd+K / Ctrl+K keyboard shortcut to focus search
    useEffect(() =>
    {
        if(!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if((e.metaKey || e.ctrlKey) && e.key === 'k')
            {
                e.preventDefault();
                const searchInput = document.querySelector('.nitro-catalog input[type="text"]') as HTMLInputElement;
                if(searchInput) searchInput.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ isVisible ]);

    // Virtual page from navigation (Zuletzt gekauft / Am meisten gekauft)
    useEffect(() =>
    {
        const handler = (e: CustomEvent) => setVirtualPage(e.detail);

        window.addEventListener('catalog_virtual_page', handler as EventListener);
        return () => window.removeEventListener('catalog_virtual_page', handler as EventListener);
    }, []);

    // Clear virtual page when a real catalog page loads
    useEffect(() =>
    {
        if(currentPage) setVirtualPage(null);
    }, [ currentPage ]);

    // When virtual page activates, clear navigation highlight for real nodes
    useEffect(() =>
    {
        if(!virtualPage) return;

        window.dispatchEvent(new Event('catalog_virtual_clear'));
    }, [ virtualPage ]);

    // Track purchases globally (recent + frequency)
    useUiEvent<CatalogPurchasedEvent>(CatalogPurchasedEvent.PURCHASE_SUCCESS, (event) =>
    {
        const purchase = event.purchase;
        if(!purchase) return;

        const iconUrl = (currentOffer?.pricingModel !== Offer.PRICING_MODEL_BUNDLE && currentOffer?.product)
            ? currentOffer.product.getIconUrl(currentOffer)
            : '';

        const entry: TrackedPurchase = {
            name: purchase.localizationId,
            iconUrl,
            offerId: purchase.offerId,
            priceCredits: purchase.priceCredits,
        };

        // Update recent purchases
        const recent = loadTracked(RECENT_KEY);
        const updatedRecent = [ entry, ...recent.filter(p => p.offerId !== entry.offerId) ].slice(0, MAX_TRACKED);
        saveTracked(RECENT_KEY, updatedRecent);

        // Update most purchased (increment count)
        const frequent = loadTracked(FREQUENT_KEY);
        const existing = frequent.find(p => p.offerId === entry.offerId);

        if(existing)
        {
            existing.count = (existing.count || 1) + 1;
            existing.name = entry.name;
            existing.iconUrl = entry.iconUrl;
        }
        else
        {
            frequent.push({ ...entry, count: 1 });
        }

        const updatedFrequent = frequent.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, MAX_TRACKED);
        saveTracked(FREQUENT_KEY, updatedFrequent);

        // Dispatch a custom event so NavigationView can refresh
        window.dispatchEvent(new Event('catalog_purchase_tracked'));
    });

    const showInspector = currentPage && !SELF_CONTAINED_LAYOUTS.has(currentPage.layoutCode);

    const breadcrumb = useMemo(() =>
        activeNodes?.filter(n => n.localization).map(n => n.localization.replace(/\s*\(\d+\)$/, '')) ?? [],
    [ activeNodes ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setStaffView(false);
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'staff-toggle':
                        setStaffView(true);
                        setIsVisible(true);
                        return;
                    case 'open':
                        if(parts.length > 2)
                        {
                            if(parts.length === 4)
                            {
                                switch(parts[2])
                                {
                                    case 'offerId':
                                        openPageByOfferId(parseInt(parts[3]));
                                        return;
                                }
                            }
                            else
                            {
                                openPageByName(parts[2]);
                            }
                        }
                        else
                        {
                            setIsVisible(true);
                        }

                        return;
                }
            },
            eventUrlPrefix: 'catalog/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ setIsVisible, openPageByOfferId, openPageByName ]);

    if(!isVisible) return (
        <>
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );

    return (
        <>
            <DraggableWindow uniqueKey="catalog" windowPosition={ DraggableWindowPosition.CENTER }>
                <div
                    className="nitro-catalog relative flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden"
                    style={ { width: `min(${ catalogSize.width }px, calc(100vw - 32px))`, height: `${ catalogSize.height }px` } }
                >
                    {/* Header */}
                    <div className="drag-handler flex items-center gap-3 px-4 shrink-0 border-b border-border/40 bg-muted/30 h-12 min-h-12 cursor-move select-none">
                        <TooltipProvider delayDuration={ 300 }>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onMouseDown={ e => e.stopPropagation() } onClick={ () => setSidebarCollapsed(v => !v) }>
                                    { sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" /> }
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{ sidebarCollapsed ? 'Sidebar einblenden' : 'Sidebar ausblenden' }</TooltipContent>
                        </Tooltip>

                        <div className="flex-1 min-w-0">
                            { searchResult ? (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <span>Suche: &ldquo;<span className="text-foreground font-medium">{ searchResult.searchValue }</span>&rdquo;</span>
                                </div>
                            ) : breadcrumb.length > 0 ? (
                                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors shrink-0">Katalog</span>
                                    { breadcrumb.map((label, i) => (
                                        <Fragment key={ i }>
                                            <span className="text-[11px] text-muted-foreground/30 shrink-0">›</span>
                                            <span className={ `text-xs truncate ${ i === breadcrumb.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground' }` }>{ label }</span>
                                        </Fragment>
                                    )) }
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Wähle eine Kategorie</span>
                            ) }
                        </div>

                        <div className="w-[240px] shrink-0" onMouseDown={ e => e.stopPropagation() }>
                            <CatalogSearchView />
                        </div>

                        <Separator orientation="vertical" className="h-5" />

                        <div className="flex items-center gap-1 shrink-0" onMouseDown={ e => e.stopPropagation() }>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={ `h-7 w-7 ${ virtualPage === 'recent' ? 'bg-primary/10 text-primary' : '' }` }
                                        onClick={ () => window.dispatchEvent(new CustomEvent('catalog_virtual_page', { detail: 'recent' })) }
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Zuletzt gekauft</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={ `h-7 w-7 ${ virtualPage === 'frequent' ? 'bg-primary/10 text-primary' : '' }` }
                                        onClick={ () => window.dispatchEvent(new CustomEvent('catalog_virtual_page', { detail: 'frequent' })) }
                                    >
                                        <Flame className={ `w-3.5 h-3.5 ${ virtualPage !== 'frequent' ? 'text-orange-400' : '' }` } />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Meist gekauft</TooltipContent>
                            </Tooltip>

                            { isMod && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={ `h-7 w-7 ${ staffView ? 'bg-primary/10 text-primary' : '' }` }
                                            onClick={ () => setStaffView(v => !v) }
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">{ staffView ? 'Normal-Katalog' : 'Staff-Katalog' }</TooltipContent>
                                </Tooltip>
                            ) }
                        </div>

                        <button
                            className="appearance-none border-0 bg-transparent rounded-md p-1 text-muted-foreground/40 hover:bg-accent hover:text-foreground transition-colors shrink-0"
                            onMouseDown={ e => e.stopPropagation() }
                            onClick={ () => setIsVisible(false) }
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        </TooltipProvider>
                    </div>

                    {/* Content: Sidebar | Grid | Inspector */}
                    <div className="flex-1 min-h-0 overflow-hidden flex">

                        { !sidebarCollapsed && (
                            <div className="w-[260px] min-w-[260px] flex-col min-h-0 border-r border-border/40 bg-muted/5 flex">
                                <CatalogNavigationView staffView={ staffView } />
                            </div>
                        ) }

                        <div ref={ catalogContentRef } className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
                            { !virtualPage && <CatalogSubcategoryChipsView /> }
                            <div className="flex-1 min-h-0 overflow-hidden flex">
                                <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
                                    { virtualPage
                                        ? <CatalogVirtualGridView type={ virtualPage } />
                                        : GetCatalogLayout(currentPage, () => setNavigationHidden(true))
                                    }
                                </div>

                                {/* Right-side Inspector Panel */}
                                { showInspector && currentOffer && (
                                    <CatalogInspectorView />
                                ) }
                            </div>
                        </div>
                    </div>

                    <div className="catalog-resize-handle" onMouseDown={ onResizeStart } />
                </div>
            </DraggableWindow>
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
}
