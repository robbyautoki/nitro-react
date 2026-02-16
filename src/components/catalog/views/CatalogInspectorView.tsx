import { FC } from 'react';
import { ProductTypeEnum } from '../../../api';
import { Flex } from '../../../common';
import { useCatalog } from '../../../hooks';
import { CatalogAddOnBadgeWidgetView } from './page/widgets/CatalogAddOnBadgeWidgetView';
import { CatalogLimitedItemWidgetView } from './page/widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from './page/widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from './page/widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from './page/widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from './page/widgets/CatalogViewProductWidgetView';

export const CatalogInspectorView: FC<{}> = props =>
{
    const { currentOffer = null, currentPage = null } = useCatalog();

    if(!currentOffer)
    {
        return (
            <div className="flex flex-col h-full rounded-lg bg-zinc-50/80 border border-zinc-200/60 p-3">
                { currentPage ? (
                    <div className="catalog-page-text flex flex-col items-center gap-2 text-center flex-1">
                        { !!currentPage.localization.getImage(1) &&
                            <img alt="" className="max-w-full rounded-md" src={ currentPage.localization.getImage(1) } /> }
                        {/* Server localization text — trusted content from the game server, not user-generated */}
                        <div dangerouslySetInnerHTML={ { __html: currentPage.localization.getText(0) } } />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
                    </div>
                ) }
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-lg bg-zinc-50/80 border border-zinc-200/60 overflow-hidden">
            {/* 3D Preview */}
            <div className="relative shrink-0 bg-white border-b border-zinc-100">
                { (currentOffer.product.productType !== ProductTypeEnum.BADGE) ? (
                    <>
                        <CatalogViewProductWidgetView height={ 180 } />
                        <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 end-1" />
                    </>
                ) : (
                    <Flex center className="h-[180px]">
                        <CatalogAddOnBadgeWidgetView className="scale-2" />
                    </Flex>
                ) }
            </div>

            {/* Item Info + Purchase */}
            <div className="flex flex-col gap-2 p-3 flex-1 min-h-0 overflow-auto">
                {/* Name */}
                <span className="text-sm font-semibold text-zinc-900 leading-tight">
                    { currentOffer.localizationName }
                </span>

                {/* Limited Edition Badge */}
                <CatalogLimitedItemWidgetView fullWidth />

                {/* Price */}
                <CatalogTotalPriceWidget justifyContent="start" alignItems="start" />

                {/* Quantity Spinner */}
                <CatalogSpinnerWidgetView />

                {/* Spacer */}
                <div className="flex-1" />

                {/* Purchase + Gift */}
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
}
