import { FC } from 'react';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { CatalogBadgeSelectorWidgetView } from '../widgets/CatalogBadgeSelectorWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutBadgeDisplayView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <div className="flex flex-col h-full gap-2">
                <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-2">
                    <CatalogItemGridWidgetView shrink />
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-white/90 truncate">{ LocalizeText('catalog_selectbadge') }</span>
                        <CatalogBadgeSelectorWidgetView />
                    </div>
                </div>
            </div>
        </>
    );
}
