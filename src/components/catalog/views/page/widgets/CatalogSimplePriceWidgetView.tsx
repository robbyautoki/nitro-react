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
        <div className={ `flex items-center gap-1 py-0.5 px-2 rounded text-xs font-semibold bg-black/[0.03] text-black/50 border border-black/[0.06] ${ className }` } { ...rest }>
            <CatalogPriceDisplayWidgetView separator={ true } offer={ currentOffer } />
        </div>
    );
}
