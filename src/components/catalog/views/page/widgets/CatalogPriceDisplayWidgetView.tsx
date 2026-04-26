import { FC } from 'react';
import { FaPlus } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../../api';
import { LayoutCurrencyIcon } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';

interface CatalogPriceDisplayWidgetViewProps
{
    offer: IPurchasableOffer;
    separator?: boolean;
}

export const CatalogPriceDisplayWidgetView: FC<CatalogPriceDisplayWidgetViewProps> = props =>
{
    const { offer = null, separator = false } = props;
    const { purchaseOptions = null } = useCatalog();
    const { quantity = 1 } = purchaseOptions;

    if(!offer) return null;

    return (
        <>
            { (offer.priceInCredits > 0) &&
                <AlignBadge.Root color="orange" variant="lighter" size="small" square className="gap-1">
                    <span className="font-bold">{ (offer.priceInCredits * quantity) }</span>
                    <LayoutCurrencyIcon type={ -1 } />
                </AlignBadge.Root> }
            { separator && (offer.priceInCredits > 0) && (offer.priceInActivityPoints > 0) &&
                <FaPlus size="xs" className="text-text-soft-400" /> }
            { (offer.priceInActivityPoints > 0) &&
                <AlignBadge.Root color="blue" variant="lighter" size="small" square className="gap-1">
                    <span className="font-bold">{ (offer.priceInActivityPoints * quantity) }</span>
                    <LayoutCurrencyIcon type={ offer.activityPointType } />
                </AlignBadge.Root> }
        </>
    );
}
