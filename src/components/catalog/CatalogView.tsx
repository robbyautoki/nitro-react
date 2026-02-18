import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, Fragment, useEffect, useMemo, useState } from 'react';
import { FaTimes, FaList, FaInfoCircle } from 'react-icons/fa';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { useCatalog } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '../ui/button';
import { CatalogInspectorView } from './views/CatalogInspectorView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { CatalogSearchView } from './views/page/common/CatalogSearchView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

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
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, currentOffer = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById } = useCatalog();

    const [ navOverlay, setNavOverlay ] = useState(false);
    const [ inspectorOverlay, setInspectorOverlay ] = useState(false);

    const showInspector = currentPage && !SELF_CONTAINED_LAYOUTS.has(currentPage.layoutCode);

    const breadcrumb = useMemo(() =>
        activeNodes?.filter(n => n.localization).map(n => n.localization) ?? [],
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
                    className="nitro-catalog flex flex-col rounded-2xl border border-white/[0.09] bg-[rgba(10,10,14,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden"
                    style={ { width: 'min(1100px, calc(100vw - 32px))', height: '380px' } }
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
                        { showInspector &&
                            <Button variant="ghost" size="icon-sm" className="xl:hidden shrink-0" onMouseDown={ e => e.stopPropagation() } onClick={ () => setInspectorOverlay(v => !v) }>
                                <FaInfoCircle className="size-3" />
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

                        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                            { currentPage?.offers && (
                                <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] text-white/20">
                                        { currentPage.offers.length } items
                                    </span>
                                </div>
                            ) }
                            <div className="flex-1 min-h-0 overflow-hidden">
                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                            </div>
                        </div>

                        { showInspector && (
                            <div className={ `w-[260px] min-w-[260px] border-l border-white/[0.06] overflow-y-auto hidden xl:flex xl:flex-col ${ inspectorOverlay ? '!flex absolute inset-y-0 right-0 z-20 bg-[rgba(10,10,14,0.98)] border-l border-white/[0.08]' : '' }` }>
                                <CatalogInspectorView />
                            </div>
                        ) }
                    </div>
                </div>
            </DraggableWindow>
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
}
