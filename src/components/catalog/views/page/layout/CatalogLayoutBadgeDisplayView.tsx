import { FC } from 'react';
import { Award } from 'lucide-react';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogBadgeSelectorWidgetView } from '../widgets/CatalogBadgeSelectorWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutBadgeDisplayView: FC<CatalogLayoutProps> = props =>
{
    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <CatalogFirstProductSelectorWidgetView />
            <CatalogPageHeaderBanner />
            <div className="flex-1 p-4">
                <CatalogItemGridWidgetView shrink />
                <div className="rounded-lg border border-border/40 bg-muted/10 p-3 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-primary/60" />
                        <span className="text-xs font-semibold">{ LocalizeText('catalog_selectbadge') }</span>
                    </div>
                    <CatalogBadgeSelectorWidgetView />
                </div>
            </div>
        </div>
    );
}
