import { FC } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayouGuildCustomFurniView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null } = useCatalog();

    return (
        <div className="flex flex-col h-full gap-2">
            { currentOffer &&
                <div className="shrink-0">
                    <CatalogGuildSelectorWidgetView />
                </div> }
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
