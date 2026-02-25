import { FC } from 'react';
import { ShoppingCart, Gift } from 'lucide-react';
import { Button } from '../../../ui/button';
import { useCatalog } from '../../../../hooks';
import { CatalogPurchaseWidgetView } from '../page/widgets/CatalogPurchaseWidgetView';

interface CatalogPurchaseButtonsProps
{
    size?: 'sm' | 'lg';
    className?: string;
}

export const CatalogPurchaseButtons: FC<CatalogPurchaseButtonsProps> = ({ size = 'lg', className }) =>
{
    return (
        <div className={ `flex flex-col gap-2 ${ className || '' }` }>
            <CatalogPurchaseWidgetView />
        </div>
    );
};
