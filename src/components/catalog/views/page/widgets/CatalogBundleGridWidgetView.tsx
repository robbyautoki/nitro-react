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
        <div ref={ elementRef } className={ `grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2 ${ className }` } { ...rest }>
            { currentOffer.products && (currentOffer.products.length > 0) && currentOffer.products.map((product, index) =>
            {
                const imageUrl = product.getIconUrl();

                return (
                    <div key={ index } className="relative flex items-center justify-center rounded-lg border bg-card overflow-hidden aspect-square bg-center bg-no-repeat" style={ imageUrl ? { backgroundImage: `url(${ imageUrl })` } : undefined }>
                        { (product.productCount > 1) &&
                            <span className="absolute top-0.5 right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded px-1 leading-tight">
                                { product.productCount }
                            </span> }
                    </div>
                );
            }) }
            { children }
        </div>
    );
}
