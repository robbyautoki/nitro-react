import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaClock, FaFire } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { ScrollArea } from '../../../ui/scroll-area';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';
import { loadTracked, TrackedPurchase } from '../../CatalogView';

const stripPageId = (text: string) => text?.replace(/\s*\(\d+\)$/, '') ?? '';

export const CatalogNavigationView: FC<{}> = props =>
{
    const { rootNode = null, searchResult = null, activateNode = null, setSearchResult = null, setNavigationHidden = null, openPageByOfferId = null } = useCatalog();
    const [ userOpen, setUserOpen ] = useState(true);
    const [ staffOpen, setStaffOpen ] = useState(true);
    const [ activeVirtual, setActiveVirtual ] = useState<string | null>(null);
    const [ recentPurchases, setRecentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_recent_purchases'));
    const [ frequentPurchases, setFrequentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_most_purchased'));

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

    const { userNodes, staffNode } = useMemo(() =>
    {
        if(!rootNode?.children) return { userNodes: [], staffNode: null };

        const user = [];
        let staff = null;

        for(const child of rootNode.children)
        {
            if(!child.isVisible) continue;

            if(child.localization === 'Staff') staff = child;
            else user.push(child);
        }

        return { userNodes: user, staffNode: staff };
    }, [ rootNode ]);

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

        return (
            <div key={ index }>
                <div
                    className={ `px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] cursor-pointer select-none transition-colors flex items-center gap-2 rounded-sm ${ topNode.isActive && !activeVirtual ? 'text-white/90 bg-white/[0.07]' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]' }` }
                    onClick={ () => onSectionClick(topNode) }
                >
                    <CatalogIconView icon={ topNode.iconId } />
                    <span className="flex-1 truncate">{ stripPageId(topNode.localization) }</span>
                    { hasChildren &&
                        (topNode.isOpen
                            ? <FaChevronDown className="text-[7px] text-white/20 shrink-0" />
                            : <FaChevronRight className="text-[7px] text-white/20 shrink-0" />
                        ) }
                </div>
                { topNode.isOpen && hasChildren &&
                    <div className="px-2 pb-0.5">
                        <CatalogNavigationSetView node={ topNode } />
                    </div> }
            </div>
        );
    };

    return (
        <ScrollArea className="flex-1">
            <div className="py-1">
                { searchResult && (searchResult.filteredNodes.length > 0) &&
                    <div className="px-2">
                        { searchResult.filteredNodes.map((n, index) =>
                            <CatalogNavigationItemView key={ index } node={ n } />
                        ) }
                    </div> }

                { !searchResult && <>

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
                    { userNodes.length > 0 &&
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
                    { staffNode &&
                        <div className="mt-1">
                            <div className="mx-3 border-t border-white/[0.06]" />
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
                                    { staffNode.children.map((child, index) =>
                                    {
                                        if(!child.isVisible) return null;
                                        return <CatalogNavigationItemView key={ index } node={ child } />;
                                    }) }
                                </div> }
                        </div> }
                </> }
            </div>
        </ScrollArea>
    );
}
