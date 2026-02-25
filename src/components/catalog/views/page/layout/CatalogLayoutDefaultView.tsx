import { FC, useMemo, useState } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogInteractionFilter } from '../../shared/CatalogInteractionFilter';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null } = useCatalog();
    const [ interactionFilter, setInteractionFilter ] = useState<string | null>(null);

    if(!currentPage) return null;

    return (
        <div className="flex flex-col h-full gap-0">
            <CatalogFirstProductSelectorWidgetView />
            <CatalogPageHeaderBanner />
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
