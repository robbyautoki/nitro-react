import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaList, FaInfoCircle } from 'react-icons/fa';
import { AddEventLinkTracker, LocalizeText, Offer, OpenUrl, RemoveLinkEventTracker } from '../../api';
import { CatalogPurchasedEvent } from '../../events';
import { useCatalog, useUiEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '../ui/button';
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
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, currentOffer = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById, catalogSize, setCatalogSize } = useCatalog();

    const [ navOverlay, setNavOverlay ] = useState(false);
    const [ inspectorOverlay, setInspectorOverlay ] = useState(false);
    const [ virtualPage, setVirtualPage ] = useState<string | null>(null);
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
                        setIsVisible(prevValue => !prevValue);
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
                    className="nitro-catalog relative flex flex-col rounded-2xl border border-white/[0.09] bg-[rgba(10,10,14,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden"
                    style={ { width: `min(${ catalogSize.width }px, calc(100vw - 32px))`, height: `${ catalogSize.height }px` } }
                >
                    {/* Header */}
                    <div className="drag-handler flex items-center gap-3 px-4 shrink-0 border-b border-white/[0.06] h-11 cursor-move select-none">
                        <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-hidden">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 shrink-0">
                                { LocalizeText('catalog.title') }
                            </span>
                            { breadcrumb.map((label, i) => (
                                <Fragment key={ i }>
                                    <span className="text-[10px] text-white/20 shrink-0">›</span>
                                    <span className="text-[11px] text-white/50 truncate">{ label }</span>
                                </Fragment>
                            )) }
                        </div>

                        <div className="flex-1" />

                        <div className="w-[220px] shrink-0" onMouseDown={ e => e.stopPropagation() }>
                            <CatalogSearchView />
                        </div>

                        { !navigationHidden &&
                            <Button variant="ghost" size="icon-sm" className="xl:hidden shrink-0" onMouseDown={ e => e.stopPropagation() } onClick={ () => setNavOverlay(v => !v) }>
                                <FaList className="size-3" />
                            </Button> }

                        <button
                            className="appearance-none border-0 bg-transparent rounded-md p-1 text-white/25 hover:bg-white/[0.06] hover:text-white/70 transition-colors shrink-0"
                            onMouseDown={ e => e.stopPropagation() }
                            onClick={ () => setIsVisible(false) }
                        >
                            <FaTimes className="text-[11px]" />
                        </button>
                    </div>

                    {/* Content: Sidebar | Grid | Inspector */}
                    <div className="flex-1 min-h-0 overflow-hidden flex relative">

                        { !navigationHidden && (
                            <div className={ `w-[185px] min-w-[185px] flex-col min-h-0 border-r border-white/[0.06] hidden xl:flex ${ navOverlay ? '!flex absolute inset-y-0 left-0 z-20 bg-[rgba(10,10,14,0.98)] border-r border-white/[0.08]' : '' }` }>
                                <CatalogNavigationView />
                            </div>
                        ) }

                        <div ref={ catalogContentRef } className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
                            { !virtualPage && <CatalogSubcategoryChipsView /> }
                            <div className="flex-1 min-h-0 overflow-hidden">
                                { virtualPage
                                    ? <CatalogVirtualGridView type={ virtualPage } />
                                    : GetCatalogLayout(currentPage, () => setNavigationHidden(true))
                                }
                            </div>

                            {/* Bottom Inspector Panel */}
                            { showInspector && currentOffer && (
                                <div className="shrink-0 border-t border-white/[0.08] bg-[rgba(10,10,14,0.98)] catalog-inspector-enter">
                                    <CatalogInspectorView />
                                </div>
                            ) }
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
