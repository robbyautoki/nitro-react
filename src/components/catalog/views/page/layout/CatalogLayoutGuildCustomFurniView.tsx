import { FC } from 'react';
import { Paintbrush } from 'lucide-react';
import { useCatalog } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutGuildCustomFurniView: FC<CatalogLayoutProps> = props =>
{
    const { currentOffer = null } = useCatalog();

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <CatalogPageHeaderBanner />
            { currentOffer && (
                <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Paintbrush className="w-4 h-4 text-primary/60" />
                        <span className="text-xs font-semibold">Gruppe auswählen</span>
                    </div>
                    <CatalogGuildSelectorWidgetView />
                </div>
            ) }
            <div className="flex-1 p-3 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
