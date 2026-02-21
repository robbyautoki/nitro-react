import { FC, HTMLAttributes, MouseEvent, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer, ProductTypeEnum } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

interface CatalogItemGridWidgetViewProps extends HTMLAttributes<HTMLDivElement>
{

}

export const CatalogItemGridWidgetView: FC<CatalogItemGridWidgetViewProps> = props =>
{
    const { children = null, className = '', ...rest } = props;
    const { currentOffer = null, setCurrentOffer = null, currentPage = null, setPurchaseOptions = null } = useCatalog();
    const elementRef = useRef<HTMLDivElement>();
    const [ multiSelected, setMultiSelected ] = useState<Set<number>>(new Set());

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentPage ]);

    // Clear multi-selection when page changes
    useEffect(() =>
    {
        setMultiSelected(new Set());
    }, [ currentPage ]);

    // Sync multi-selection to purchaseOptions
    useEffect(() =>
    {
        if(multiSelected.size > 1 && currentPage)
        {
            const offers = currentPage.offers.filter(o => multiSelected.has(o.offerId));
            setPurchaseOptions(prev => ({ ...prev, selectedOffers: offers }));
        }
        else
        {
            setPurchaseOptions(prev =>
            {
                if(!prev.selectedOffers) return prev;

                const { selectedOffers, ...rest } = prev;
                return rest;
            });
        }
    }, [ multiSelected, currentPage, setPurchaseOptions ]);

    if(!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer, event?: MouseEvent) =>
    {
        offer.activate();

        if(offer.isLazy) return;

        if(event && (event.metaKey || event.ctrlKey))
        {
            // Multi-select: toggle this offer
            setMultiSelected(prev =>
            {
                const next = new Set(prev);

                if(next.has(offer.offerId)) next.delete(offer.offerId);
                else next.add(offer.offerId);

                return next;
            });
        }
        else
        {
            // Single-select: clear multi-selection
            setMultiSelected(new Set());
        }

        setCurrentOffer(offer);

        if(offer.product && (offer.product.productType === ProductTypeEnum.WALL))
        {
            setPurchaseOptions(prevValue =>
            {
                const newValue = { ...prevValue };

                newValue.extraData = (offer.product.extraParam || null);

                return newValue;
            });
        }
    }

    return (
        <div ref={ elementRef } className={ `grid grid-cols-[repeat(auto-fill,68px)] gap-1 overflow-y-auto p-2 ${ className }` } { ...rest }>
            { currentPage.offers && (currentPage.offers.length > 0) && currentPage.offers.map((offer, index) =>
                <CatalogGridOfferView
                    key={ index }
                    itemActive={ (currentOffer && (currentOffer.offerId === offer.offerId)) }
                    isMultiSelected={ multiSelected.has(offer.offerId) }
                    offer={ offer }
                    selectOffer={ selectOffer }
                />
            ) }
            { children }
        </div>
    );
}
