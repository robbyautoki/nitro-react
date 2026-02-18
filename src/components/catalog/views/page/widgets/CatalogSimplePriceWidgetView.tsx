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
        <div className={ `flex items-center gap-1 py-0.5 px-2 rounded text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 ${ className }` } { ...rest }>
            <CatalogPriceDisplayWidgetView separator={ true } offer={ currentOffer } />
        </div>
    );
}
