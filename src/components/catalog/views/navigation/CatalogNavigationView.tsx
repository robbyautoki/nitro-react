import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaClock, FaFire, FaStar, FaRegStar } from 'react-icons/fa';
import { GetConfiguration, LocalizeText, ICatalogNode } from '../../../../api';
import { getAuthHeaders } from '../../../../api/utils/SessionTokenManager';
import { useCatalog } from '../../../../hooks';

import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';
import { loadTracked, TrackedPurchase } from '../../CatalogView';

const stripPageId = (text: string) => text?.replace(/\s*\(\d+\)$/, '') ?? '';

const findNodeByPageId = (node: ICatalogNode, pageId: number): ICatalogNode | null =>
{
    if(node.pageId === pageId) return node;
    for(const child of (node.children || []))
    {
        const found = findNodeByPageId(child, pageId);
        if(found) return found;
    }
    return null;
};

interface CatalogNavigationViewProps
{
    staffView?: boolean;
}

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = ({ staffView = false }) =>
{
    const { rootNode = null, searchResult = null, activateNode = null, setSearchResult = null, setNavigationHidden = null, openPageByOfferId = null } = useCatalog();
    const [ userOpen, setUserOpen ] = useState(true);
    const [ staffOpen, setStaffOpen ] = useState(true);
    const [ favoritesOpen, setFavoritesOpen ] = useState(true);
    const [ activeVirtual, setActiveVirtual ] = useState<string | null>(null);
    const [ favorites, setFavorites ] = useState<number[]>([]);
    const [ recentPurchases, setRecentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_recent_purchases'));
    const [ frequentPurchases, setFrequentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_most_purchased'));

    const cmsUrl = useMemo(() => GetConfiguration<string>('url.prefix', ''), []);

    useEffect(() =>
    {
        if(!cmsUrl) return;
        fetch(`${ cmsUrl }/api/catalog/favorites`, { headers: getAuthHeaders() })
            .then(r => r.json())
            .then(d => { if(d.favorites) setFavorites(d.favorites); })
            .catch(() => {});
    }, [ cmsUrl ]);

    const toggleFavorite = useCallback((pageId: number) =>
    {
        if(!cmsUrl) return;
        const isFav = favorites.includes(pageId);
        setFavorites(prev => isFav ? prev.filter(id => id !== pageId) : [ ...prev, pageId ]);
        fetch(`${ cmsUrl }/api/catalog/favorites`, {
            method: isFav ? 'DELETE' : 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pageId }),
        }).catch(() => {});
    }, [ cmsUrl, favorites ]);

    // Refresh when a purchase is tracked
    useEffect(() =>
    {
        const refresh = () =>
        {
            setRecentPurchases(loadTracked('catalog_recent_purchases'));
            setFrequentPurchases(loadTracked('catalog_most_purchased'));
        };

        window.addEventListener('catalog_purchase_tracked', refresh);
        return () => window.removeEventListener('catalog_purchase_tracked', refresh);
    }, []);

    // Clear active virtual when a real page is activated externally
    useEffect(() =>
    {
        const clear = () => setActiveVirtual(null);
        window.addEventListener('catalog_virtual_clear', clear);
        return () => window.removeEventListener('catalog_virtual_clear', clear);
    }, []);

    const STAFF_PAGES = useMemo(() => new Set(['Staff', 'Habbox Import', 'Multi Import', 'Creators']), []);

    const { userNodes, staffNodes } = useMemo(() =>
    {
        if(!rootNode?.children) return { userNodes: [], staffNodes: [] };

        const user = [];
        const staff = [];

        for(const child of rootNode.children)
        {
            if(!child.isVisible) continue;

            if(STAFF_PAGES.has(stripPageId(child.localization))) staff.push(child);
            else user.push(child);
        }

        return { userNodes: user, staffNodes: staff };
    }, [ rootNode, STAFF_PAGES ]);

    const onVirtualClick = useCallback((type: string) =>
    {
        setActiveVirtual(type);
        window.dispatchEvent(new CustomEvent('catalog_virtual_page', { detail: type }));
    }, []);

    const onSectionClick = (topNode: any) =>
    {
        setActiveVirtual(null);
        if(searchResult) setSearchResult(null);
        if(setNavigationHidden) setNavigationHidden(false);
        activateNode(topNode);
    };

    const renderCategory = (topNode: any, index: number) =>
    {
        const hasChildren = topNode.isBranch && topNode.children.some(c => c.isVisible);
        const isActive = topNode.isActive && !activeVirtual;
        const isOpen = topNode.isOpen && hasChildren;
        const isFav = favorites.includes(topNode.pageId);

        return (
            <div key={ index } className={ `mt-0.5 ${ isOpen ? 'bg-white/[0.02] rounded-md' : '' }` }>
                <div
                    className={ `group/cat px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] cursor-pointer select-none transition-colors flex items-center gap-2 rounded-sm border-l-2 ${ isActive ? 'text-white/90 bg-white/[0.07] border-sky-400/60' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03] border-transparent' }` }
                    onClick={ () => onSectionClick(topNode) }
                >
                    <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0">
                        <CatalogIconView icon={ topNode.iconId } />
                    </div>
                    <span className="flex-1 truncate">{ stripPageId(topNode.localization) }</span>
                    <button
                        className={ `shrink-0 transition-opacity ${ isFav ? 'opacity-100' : 'opacity-0 group-hover/cat:opacity-100' }` }
                        onClick={ (e) => { e.stopPropagation(); toggleFavorite(topNode.pageId); } }
                    >
                        { isFav
                            ? <FaStar className="text-[9px] text-amber-400/70" />
                            : <FaRegStar className="text-[9px] text-white/25 hover:text-amber-400/50" /> }
                    </button>
                    { hasChildren &&
                        (topNode.isOpen
                            ? <FaChevronDown className="text-[7px] text-white/20 shrink-0" />
                            : <FaChevronRight className="text-[7px] text-white/20 shrink-0" />
                        ) }
                </div>
                { isOpen &&
                    <div className="px-2 pb-1">
                        <CatalogNavigationSetView node={ topNode } />
                    </div> }
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto" style={ { scrollbarWidth: 'none' } }>
            <div className="py-1">
                { searchResult && (searchResult.filteredNodes.length > 0) &&
                    <div className="px-2">
                        { searchResult.filteredNodes.map((n, index) =>
                            <CatalogNavigationItemView key={ index } node={ n } />
                        ) }
                    </div> }

                { !searchResult && <>

                    {/* ── Favoriten ── */}
                    { favorites.length > 0 && rootNode && <>
                        <div>
                            <div
                                className="px-3 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] cursor-pointer select-none flex items-center justify-between text-amber-400/40 hover:text-amber-400/60 transition-colors"
                                onClick={ () => setFavoritesOpen(v => !v) }
                            >
                                <span className="flex items-center gap-1.5"><FaStar className="text-[8px]" /> Favoriten</span>
                                { favoritesOpen
                                    ? <FaChevronDown className="text-[7px]" />
                                    : <FaChevronRight className="text-[7px]" /> }
                            </div>
                            { favoritesOpen &&
                                <div className="px-1 pb-1">
                                    { favorites.map(pageId =>
                                    {
                                        const node = findNodeByPageId(rootNode, pageId);
                                        if(!node) return null;
                                        return <CatalogNavigationItemView key={ pageId } node={ node } onToggleFavorite={ toggleFavorite } isFavorite={ true } />;
                                    }) }
                                </div> }
                        </div>
                        <div className="mx-3 my-1 border-t border-white/[0.06]" />
                    </> }

                    {/* ── Zuletzt gekauft ── */}
                    { recentPurchases.length > 0 &&
                        <div
                            className={ `px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] cursor-pointer select-none transition-colors flex items-center gap-2 rounded-sm ${ activeVirtual === 'recent' ? 'text-white/90 bg-white/[0.07]' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]' }` }
                            onClick={ () => onVirtualClick('recent') }
                        >
                            <FaClock className="text-[9px]" />
                            <span className="flex-1 truncate">{ LocalizeText('catalog.nav.recent_purchases') }</span>
                        </div> }

                    {/* ── Am meisten gekauft ── */}
                    { frequentPurchases.length > 0 &&
                        <div
                            className={ `px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] cursor-pointer select-none transition-colors flex items-center gap-2 rounded-sm ${ activeVirtual === 'frequent' ? 'text-white/90 bg-white/[0.07]' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]' }` }
                            onClick={ () => onVirtualClick('frequent') }
                        >
                            <FaFire className="text-[9px]" />
                            <span className="flex-1 truncate">{ LocalizeText('catalog.nav.most_purchased') }</span>
                        </div> }

                    {/* ── Divider ── */}
                    { (recentPurchases.length > 0 || frequentPurchases.length > 0) &&
                        <div className="mx-3 my-1 border-t border-white/[0.06]" /> }

                    {/* ── User Catalog Section ── */}
                    { !staffView && userNodes.length > 0 &&
                        <div>
                            <div
                                className="px-3 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] cursor-pointer select-none flex items-center justify-between text-white/30 hover:text-white/50 transition-colors"
                                onClick={ () => setUserOpen(v => !v) }
                            >
                                <span>Katalog</span>
                                { userOpen
                                    ? <FaChevronDown className="text-[7px]" />
                                    : <FaChevronRight className="text-[7px]" /> }
                            </div>
                            { userOpen &&
                                <div className="px-1 pb-1">
                                    { userNodes.map((topNode, index) => renderCategory(topNode, index)) }
                                </div> }
                        </div> }

                    {/* ── Staff Catalog Section ── */}
                    { staffView && staffNodes.length > 0 &&
                        <div>
                            <div
                                className="px-3 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] cursor-pointer select-none flex items-center justify-between text-white/30 hover:text-white/50 transition-colors"
                                onClick={ () => setStaffOpen(v => !v) }
                            >
                                <span>Staff</span>
                                { staffOpen
                                    ? <FaChevronDown className="text-[7px]" />
                                    : <FaChevronRight className="text-[7px]" /> }
                            </div>
                            { staffOpen &&
                                <div className="px-1 pb-1">
                                    { staffNodes.map((topNode, index) => renderCategory(topNode, index)) }
                                </div> }
                        </div> }
                </> }
            </div>
        </div>
    );
}
