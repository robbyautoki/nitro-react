import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo } from 'react';
import { AddEventLinkTracker, GetConfiguration, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useCatalog } from '../../hooks';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

export const CatalogView: FC<{}> = props =>
{
    const { isVisible = false, setIsVisible = null, rootNode = null, currentPage = null, navigationHidden = false, setNavigationHidden = null, activeNodes = [], searchResult = null, setSearchResult = null, openPageByName = null, openPageByOfferId = null, activateNode = null, getNodeById } = useCatalog();

    const activeTabId = useMemo(() => rootNode?.children?.find(c => c.isActive)?.pageId?.toString(), [ rootNode ]);

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
            { isVisible &&
                <NitroCardView uniqueKey="catalog" className="nitro-catalog" style={ GetConfiguration('catalog.headers') ? { width: 820 } : {} }>
                    <NitroCardHeaderView headerText={ LocalizeText('catalog.title') } onCloseClick={ event => setIsVisible(false) } />
                    {/* Tab Navigation */}
                    { rootNode && (rootNode.children.length > 0) &&
                        <Tabs value={ activeTabId } onValueChange={ onTabChange }>
                            <TabsList className="w-full justify-start gap-0.5 rounded-none border-b border-zinc-200 bg-zinc-50/80 px-2 h-auto py-1">
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
                    <NitroCardContentView>
                        <div className="catalog-body">
                            { !navigationHidden &&
                                <div className="catalog-sidebar">
                                    <CatalogNavigationView node={ activeNodes?.[0] } />
                                </div> }
                            <div className={ `catalog-content ${ navigationHidden ? 'full-width' : '' }` }>
                                { GetCatalogLayout(currentPage, () => setNavigationHidden(true)) }
                            </div>
                        </div>
                    </NitroCardContentView>
                </NitroCardView> }
            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
}
