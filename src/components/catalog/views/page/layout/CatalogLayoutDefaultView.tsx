import { FC } from 'react';
import { GetConfiguration } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentPage = null } = useCatalog();

    return (
        <div className="flex flex-col h-full gap-2">
            <CatalogFirstProductSelectorWidgetView />
            { GetConfiguration('catalog.headers') &&
                <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) } /> }
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
