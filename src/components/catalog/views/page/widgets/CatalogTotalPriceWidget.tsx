import { FC, HTMLAttributes } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplayWidgetView } from './CatalogPriceDisplayWidgetView';

interface CatalogTotalPriceWidgetProps extends HTMLAttributes<HTMLDivElement>
{

}
export const CatalogTotalPriceWidget: FC<CatalogTotalPriceWidgetProps> = props =>
{
    const { className = '', ...rest } = props;
    const { currentOffer = null } = useCatalog();

    return (
        <div className={ `flex flex-col gap-1 ${ className }` } { ...rest }>
            <CatalogPriceDisplayWidgetView offer={ currentOffer } />
        </div>
    );
}
