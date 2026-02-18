import { FC } from 'react';
import { FaPlus } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../../api';
import { LayoutCurrencyIcon } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { Badge } from '../../../../ui/badge';

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
                <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                    <span className="font-bold">{ (offer.priceInCredits * quantity) }</span>
                    <LayoutCurrencyIcon type={ -1 } />
                </Badge> }
            { separator && (offer.priceInCredits > 0) && (offer.priceInActivityPoints > 0) &&
                <FaPlus size="xs" className="text-muted-foreground" /> }
            { (offer.priceInActivityPoints > 0) &&
                <Badge className="gap-1 bg-teal-100 text-teal-800 border-teal-200">
                    <span className="font-bold">{ (offer.priceInActivityPoints * quantity) }</span>
                    <LayoutCurrencyIcon type={ offer.activityPointType } />
                </Badge> }
        </>
    );
}
