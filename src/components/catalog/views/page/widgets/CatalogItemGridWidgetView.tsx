import { FC, HTMLAttributes, useEffect, useRef } from 'react';
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

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentPage ]);

    if(!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer) =>
    {
        offer.activate();

        if(offer.isLazy) return;

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
        <div ref={ elementRef } className={ `grid grid-cols-[repeat(auto-fill,52px)] gap-0.5 overflow-y-auto p-1.5 ${ className }` } { ...rest }>
            { currentPage.offers && (currentPage.offers.length > 0) && currentPage.offers.map((offer, index) => <CatalogGridOfferView key={ index } itemActive={ (currentOffer && (currentOffer.offerId === offer.offerId)) } offer={ offer } selectOffer={ selectOffer } />) }
            { children }
        </div>
    );
}
