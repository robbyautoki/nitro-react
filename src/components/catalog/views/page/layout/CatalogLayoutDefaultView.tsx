import { FC, useMemo } from 'react';
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

    const pageText = useMemo(() =>
    {
        if(!currentPage?.localization) return null;
        const text = currentPage.localization.getText(0);
        if(!text || text.length < 3) return null;
        return text;
    }, [ currentPage ]);

    return (
        <div className="flex flex-col h-full gap-0">
            <CatalogFirstProductSelectorWidgetView />
            { GetConfiguration('catalog.headers') &&
                <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) } /> }
            { pageText && (
                <div className="shrink-0 px-3 py-2 border-b border-white/[0.04]">
                    <div className="catalog-page-text text-[11px] leading-relaxed" dangerouslySetInnerHTML={ { __html: pageText } } />
                </div>
            ) }
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
