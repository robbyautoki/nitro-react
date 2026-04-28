import { FC, HTMLAttributes, useEffect, useRef } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CATALOG_GRID_CLASSES } from '../common/CatalogGridStyles';
import { CatalogProductTile } from '../common/CatalogProductTile';

interface CatalogBundleGridWidgetViewProps extends HTMLAttributes<HTMLDivElement>
{

}

export const CatalogBundleGridWidgetView: FC<CatalogBundleGridWidgetViewProps> = props =>
{
    const { children = null, className = '', ...rest } = props;
    const { currentOffer = null } = useCatalog();
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentOffer ]);

    if(!currentOffer) return null;

    return (
        <div ref={ elementRef } className={ `${ CATALOG_GRID_CLASSES } ${ className }` } { ...rest }>
            { currentOffer.products && (currentOffer.products.length > 0) && currentOffer.products.map((product, index) => (
                <div key={ index } className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50/50 p-1">
                    <CatalogProductTile product={ product } offer={ currentOffer } centered />
                    { (product.productCount > 1) &&
                        <span className="absolute right-0.5 top-0.5 rounded bg-primary-base px-0.5 text-[10px] leading-tight text-static-white">
                            { product.productCount }
                        </span> }
                </div>
            )) }
            { children }
        </div>
    );
}
