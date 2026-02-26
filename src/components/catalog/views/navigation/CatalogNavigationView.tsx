import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Star, ShieldCheck } from 'lucide-react';
import { GetConfiguration, ICatalogNode } from '../../../../api';
import { getAuthHeaders } from '../../../../api/utils/SessionTokenManager';
import { useCatalog } from '../../../../hooks';
import { Separator } from '../../../ui/separator';

import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';


const stripPageId = (text: string) => text?.replace(/\s*\(\d+\)$/, '') ?? '';

const getTotalOffers = (node: any): number =>
{
    let total = node.offerIds?.length || 0;
    for(const child of (node.children || []))
    {
        if(!child.isVisible) continue;
        total += getTotalOffers(child);
    }
    return total;
};

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
    const [ favoritesOpen, setFavoritesOpen ] = useState(true);
    const [ activeVirtual, setActiveVirtual ] = useState<string | null>(null);
    const [ favorites, setFavorites ] = useState<number[]>([]);
    const [ openSection, setOpenSection ] = useState<number | null>(null);

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

    const onSectionClick = (topNode: any) =>
    {
        setActiveVirtual(null);
        if(searchResult) setSearchResult(null);
        if(setNavigationHidden) setNavigationHidden(false);
        activateNode(topNode);
    };

    const renderTopNode = (topNode: any, index: number) =>
    {
        const hasChildren = topNode.isBranch && topNode.children.some((c: any) => c.isVisible);

        if(hasChildren)
        {
            const hasActiveChild = topNode.children.some((c: any) => c.isActive);
            const isOpen = openSection === topNode.pageId || hasActiveChild;

            return (
                <div key={ index } className={ index > 0 ? 'mt-0.5' : '' }>
                    <button
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-accent/30"
                        onClick={ () => { setOpenSection(isOpen && !hasActiveChild ? null : topNode.pageId); onSectionClick(topNode); } }
                    >
                        <CatalogIconView icon={ topNode.iconId } />
                        <span className="flex-1 text-left truncate text-xs font-semibold text-foreground/80">
                            { stripPageId(topNode.localization) }
                        </span>
                        { (() => { const count = getTotalOffers(topNode); return count > 0 ? <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">{ count.toLocaleString('de-DE') }</span> : null; })() }
                        <ChevronRight className={ `w-3.5 h-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${ isOpen ? 'rotate-90' : '' }` } />
                    </button>
                    <div
                        className="grid transition-[grid-template-rows,opacity] duration-200 ease-in-out"
                        style={ { gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 } }
                    >
                        <div className="overflow-hidden min-h-0">
                            <div className="px-1.5 pb-1">
                                { topNode.children.filter((c: any) => c.isVisible).map((child: any, i: number) =>
                                    <CatalogNavigationItemView key={ i } node={ child } onToggleFavorite={ toggleFavorite } isFavorite={ favorites.includes(child.pageId) } />
                                ) }
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={ index } className={ `px-1.5 ${ index > 0 ? 'mt-0.5' : '' }` }>
                <CatalogNavigationItemView node={ topNode } onToggleFavorite={ toggleFavorite } isFavorite={ favorites.includes(topNode.pageId) } />
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            {/* Staff mode indicator */}
            { staffView && (
                <div className="shrink-0 px-3 py-2 border-b border-amber-400/20 bg-amber-500/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Staff-Katalog aktiv
                    </div>
                </div>
            ) }

            <div className="py-1.5">
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
                            <div className="px-3 pt-2 pb-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60 flex items-center gap-1.5 cursor-pointer select-none"
                                    onClick={ () => setFavoritesOpen(v => !v) }
                                >
                                    <Star className="w-3 h-3 fill-current" /> Favoriten
                                </span>
                            </div>
                            { favoritesOpen &&
                                <div className="px-1.5 pb-1">
                                    { favorites.map(pageId =>
                                    {
                                        const node = findNodeByPageId(rootNode, pageId);
                                        if(!node) return null;
                                        return <CatalogNavigationItemView key={ pageId } node={ node } onToggleFavorite={ toggleFavorite } isFavorite={ true } />;
                                    }) }
                                </div> }
                        </div>
                        <Separator className="mx-3 my-1.5" />
                    </> }

                    {/* ── User Catalog Section ── */}
                    { !staffView && userNodes.length > 0 &&
                        userNodes.map((topNode, index) => renderTopNode(topNode, index)) }

                    {/* ── Staff Catalog Section ── */}
                    { staffView && staffNodes.length > 0 &&
                        staffNodes.map((topNode, index) => renderTopNode(topNode, index)) }
                </> }
            </div>
        </div>
    );
}
