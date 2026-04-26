import { FC } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import * as Input from '@/align-ui/components/ui/input';
import * as AlignButton from '@/align-ui/components/ui/button';

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
            <span className="text-subheading-2xs uppercase text-text-soft-400 flex-1">
                { LocalizeText('catalog.bundlewidget.spinner.select.amount') }
            </span>
            <div className="flex items-center gap-1">
                <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    size="xxsmall"
                    className="h-7 w-7 min-w-0 px-0"
                    onClick={ event => updateQuantity(quantity - 1) }
                >
                    <FaMinus className="text-paragraph-xs" />
                </AlignButton.Root>
                <Input.Root size="xsmall" className="w-11">
                    <Input.Wrapper className="h-7 px-1">
                        <Input.Input type="number" className="h-7 text-center text-label-xs" value={ quantity } onChange={ event => updateQuantity(event.target.valueAsNumber) } />
                    </Input.Wrapper>
                </Input.Root>
                <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    size="xxsmall"
                    className="h-7 w-7 min-w-0 px-0"
                    onClick={ event => updateQuantity(quantity + 1) }
                >
                    <FaPlus className="text-paragraph-xs" />
                </AlignButton.Root>
            </div>
        </div>
    );
}
