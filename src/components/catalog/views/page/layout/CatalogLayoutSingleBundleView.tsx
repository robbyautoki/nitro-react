import { FC } from 'react';
import { CatalogBundleGridWidgetView } from '../widgets/CatalogBundleGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSingleBundleView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <div className="flex flex-col h-full gap-2">
                { !!page.localization.getText(2) &&
                    <div className="catalog-page-text text-xs shrink-0">
                        {/* Server localization text (trusted content from game server) */}
                        <div dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } />
                    </div> }
                <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-zinc-100 p-2">
                    <CatalogBundleGridWidgetView fullWidth className="nitro-catalog-layout-bundle-grid" />
                </div>
            </div>
        </>
    );
}
