import { FC, HTMLAttributes } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplayWidgetView } from './CatalogPriceDisplayWidgetView';

interface CatalogSimplePriceWidgetViewProps extends HTMLAttributes<HTMLDivElement>
{

}

export const CatalogSimplePriceWidgetView: FC<CatalogSimplePriceWidgetViewProps> = props =>
{
    const { className = '', ...rest } = props;
    const { currentOffer = null } = useCatalog();

    return (
        <div className={ `flex items-center gap-1 rounded-md bg-bg-weak-50 px-2 py-0.5 text-label-xs text-text-sub-600 ring-1 ring-stroke-soft-200 ${ className }` } { ...rest }>
            <CatalogPriceDisplayWidgetView separator={ true } offer={ currentOffer } />
        </div>
    );
}
