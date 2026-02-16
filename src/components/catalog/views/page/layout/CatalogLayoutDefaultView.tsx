import { FC } from 'react';
import { GetConfiguration, ProductTypeEnum } from '../../../../../api';
import { Flex, LayoutImage, Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null, currentPage = null } = useCatalog();

    return (
        <div className="flex flex-col h-full gap-2">
            { GetConfiguration('catalog.headers') &&
                <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) } /> }

            {/* Product Grid — full width, scrollable */}
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>

            {/* Detail Panel — bottom strip */}
            { currentOffer ? (
                <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
                    {/* Preview */}
                    <div className="w-[100px] h-[80px] shrink-0 rounded-md bg-white border border-zinc-100 overflow-hidden">
                        <Flex center className="w-full h-full">
                            { (currentOffer.product.productType !== ProductTypeEnum.BADGE) &&
                                <>
                                    <CatalogViewProductWidgetView />
                                    <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 end-1" />
                                </> }
                            { (currentOffer.product.productType === ProductTypeEnum.BADGE) &&
                                <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                        </Flex>
                    </div>

                    {/* Info + Actions */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <CatalogLimitedItemWidgetView fullWidth />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-900 truncate">
                                { currentOffer.localizationName }
                            </span>
                            <CatalogTotalPriceWidget justifyContent="end" alignItems="end" />
                        </div>
                        <div className="flex items-center gap-2">
                            <CatalogSpinnerWidgetView />
                            <div className="flex-1" />
                            <CatalogPurchaseWidgetView />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 p-3 text-center shrink-0">
                    { !!page.localization.getImage(1) &&
                        <LayoutImage imageUrl={ page.localization.getImage(1) } /> }
                    { /* Page description text from server localization (trusted content) */ }
                    <Text center dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            ) }
        </div>
    );
}
