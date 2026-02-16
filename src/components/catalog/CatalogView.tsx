import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AddEventLinkTracker, GetConfiguration, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { useCatalog } from '../../hooks';
import { Drawer, DrawerClose, DrawerContent } from '../ui/drawer';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogInspectorView } from './views/CatalogInspectorView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
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
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById } = useCatalog();

    const [ activeSnap, setActiveSnap ] = useState<number | string | null>(0.85);
    const activeTabId = useMemo(() => rootNode?.children?.find(c => c.isActive)?.pageId?.toString(), [ rootNode ]);
    const showInspector = currentPage && !SELF_CONTAINED_LAYOUTS.has(currentPage.layoutCode);

    const onTabChange = (value: string) =>
    {
        if(searchResult) setSearchResult(null);
        const node = rootNode?.children?.find(c => String(c.pageId) === value);
        if(node) activateNode(node);
    };

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

    return (
        <>
            <Drawer
                open={ isVisible }
                onOpenChange={ setIsVisible }
                modal={ false }
                snapPoints={ [ 0.55, 0.85 ] }
                activeSnapPoint={ activeSnap }
                setActiveSnapPoint={ setActiveSnap }
            >
                <DrawerContent className="nitro-catalog">
                    {/* Header: Title + Close */}
                    <div className="flex items-center justify-between px-5 py-2 shrink-0">
                        <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
                            { LocalizeText('catalog.title') }
                        </h2>
                        <DrawerClose className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                            <FaTimes className="text-xs" />
                        </DrawerClose>
                    </div>

                    {/* Tab Navigation */}
                    { rootNode && (rootNode.children.length > 0) &&
                        <Tabs value={ activeTabId } onValueChange={ onTabChange }>
                            <TabsList className="w-full justify-start gap-0.5 rounded-none border-b border-zinc-200 bg-zinc-50/80 px-3 h-auto py-1 shrink-0">
                                { rootNode.children.map(child =>
                                {
                                    if(!child.isVisible) return null;

                                    return (
                                        <TabsTrigger
                                            key={ child.pageId }
                                            value={ String(child.pageId) }
                                            className="gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium data-[state=active]:shadow-sm"
                                        >
                                            { GetConfiguration('catalog.tab.icons') && <CatalogIconView icon={ child.iconId } /> }
                                            { child.localization }
                                        </TabsTrigger>
                                    );
                                }) }
                            </TabsList>
                        </Tabs> }

                    {/* Content — 3-column layout */}
                    <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2">
                        <div className="flex h-full gap-3 max-w-[1200px] mx-auto">
                            { !navigationHidden &&
                                <div className="w-[180px] min-w-[180px] flex flex-col">
                                    <CatalogNavigationView node={ activeNodes?.[0] } />
                                </div> }
                            <div className="flex-1 min-w-0 overflow-hidden">
                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                            </div>
                            { showInspector &&
                                <div className="w-[220px] min-w-[220px] flex flex-col">
                                    <CatalogInspectorView />
                                </div> }
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
}
