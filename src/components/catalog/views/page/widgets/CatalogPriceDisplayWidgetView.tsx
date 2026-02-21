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
                <Badge className="gap-1 bg-amber-900/30 text-amber-300 border-amber-700/40">
                    <span className="font-bold">{ (offer.priceInCredits * quantity) }</span>
                    <LayoutCurrencyIcon type={ -1 } />
                </Badge> }
            { separator && (offer.priceInCredits > 0) && (offer.priceInActivityPoints > 0) &&
                <FaPlus size="xs" className="text-white/30" /> }
            { (offer.priceInActivityPoints > 0) &&
                <Badge className="gap-1 bg-teal-900/30 text-teal-300 border-teal-700/40">
                    <span className="font-bold">{ (offer.priceInActivityPoints * quantity) }</span>
                    <LayoutCurrencyIcon type={ offer.activityPointType } />
                </Badge> }
        </>
    );
}
