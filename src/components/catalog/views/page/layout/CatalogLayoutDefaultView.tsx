import { FC, useEffect, useRef, useState } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogInteractionFilter } from '../../shared/CatalogInteractionFilter';
import { CatalogPageHero } from '../common/CatalogPageHero';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null, activeNodes = [], activateNode = null } = useCatalog();
    const [ interactionFilter, setInteractionFilter ] = useState<string | null>(null);
    const redirectedRef = useRef<number | null>(null);

    // Auto-redirect: If page has 0 items but visible children with items exist, activate first one
    useEffect(() =>
    {
        if(!currentPage || !activateNode) return;
        if(currentPage.offers && currentPage.offers.length > 0) return;
        if(redirectedRef.current === currentPage.pageId) return;

        const lastNode = activeNodes[activeNodes.length - 1];
        if(!lastNode || !lastNode.isBranch || !lastNode.children?.length) return;

        const firstWithItems = lastNode.children.find((c: any) =>
            c.isVisible && (c.offerIds?.length > 0 || (c.children && c.children.some((sc: any) => sc.isVisible)))
        );

        if(firstWithItems)
        {
            redirectedRef.current = currentPage.pageId;
            activateNode(firstWithItems);
        }
    }, [ currentPage, activeNodes, activateNode ]);

    if(!currentPage) return null;

    return (
        <div className="flex flex-col h-full gap-0">
            <CatalogFirstProductSelectorWidgetView />
            <CatalogPageHero />
            <CatalogInteractionFilter
                offers={ currentPage.offers || [] }
                activeFilter={ interactionFilter }
                onFilter={ setInteractionFilter }
            />
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
