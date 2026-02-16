import { FC } from 'react';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogBundleGridWidgetView } from '../widgets/CatalogBundleGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSimplePriceWidgetView } from '../widgets/CatalogSimplePriceWidgetView';
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
                        { /* Server localization text (trusted content from game server) */ }
                        <div dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } />
                    </div> }
                <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-zinc-100 p-2">
                    <CatalogBundleGridWidgetView fullWidth className="nitro-catalog-layout-bundle-grid" />
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
                    <div className="w-[100px] h-[80px] shrink-0 rounded-md bg-white border border-zinc-100 overflow-hidden relative">
                        { !!page.localization.getImage(1) &&
                            <img alt="" className="w-full h-full object-contain" src={ page.localization.getImage(1) } /> }
                        <CatalogAddOnBadgeWidgetView position="absolute" className="bg-muted rounded bottom-0 start-0" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        { !!page.localization.getText(1) &&
                            <span className="text-xs text-zinc-500">{ page.localization.getText(1) }</span> }
                        <div className="flex items-center justify-between gap-2">
                            <CatalogSimplePriceWidgetView />
                            <CatalogPurchaseWidgetView />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
