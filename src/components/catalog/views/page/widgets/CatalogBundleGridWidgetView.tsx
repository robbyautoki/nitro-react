import { FC, HTMLAttributes, useEffect, useRef } from 'react';
import { useCatalog } from '../../../../../hooks';

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
        <div ref={ elementRef } className={ `grid grid-cols-[repeat(auto-fill,82px)] gap-2 ${ className }` } { ...rest }>
            { currentOffer.products && (currentOffer.products.length > 0) && currentOffer.products.map((product, index) =>
            {
                const imageUrl = product.getIconUrl();

                return (
                    <div key={ index } className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-bg-weak-50 bg-contain bg-center bg-no-repeat" style={ imageUrl ? { backgroundImage: `url(${ imageUrl })` } : undefined }>
                        { (product.productCount > 1) &&
                            <span className="absolute right-1 top-1 rounded-md bg-primary-base px-1 text-subheading-2xs leading-tight text-static-white">
                                { product.productCount }
                            </span> }
                    </div>
                );
            }) }
            { children }
        </div>
    );
}
