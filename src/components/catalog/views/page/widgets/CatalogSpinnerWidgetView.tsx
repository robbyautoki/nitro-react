import { FC } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 100;

export const CatalogSpinnerWidgetView: FC<{}> = props =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { quantity = 1 } = purchaseOptions;

    const updateQuantity = (value: number) =>
    {
        if(isNaN(value)) value = 1;

        value = Math.max(value, MIN_VALUE);
        value = Math.min(value, MAX_VALUE);

        if(value === quantity) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    }

    if(!currentOffer || !currentOffer.bundlePurchaseAllowed) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold flex-1">
                { LocalizeText('catalog.bundlewidget.spinner.select.amount') }
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md w-6 h-6 min-w-0"
                    onClick={ event => updateQuantity(quantity - 1) }
                >
                    <FaMinus className="text-[9px]" />
                </Button>
                <Input type="number" className="h-6 w-10 px-1 text-center text-xs rounded-md" value={ quantity } onChange={ event => updateQuantity(event.target.valueAsNumber) } />
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md w-6 h-6 min-w-0"
                    onClick={ event => updateQuantity(quantity + 1) }
                >
                    <FaPlus className="text-[9px]" />
                </Button>
            </div>
        </div>
    );
}
