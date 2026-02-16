import { FC } from 'react';
import { Flex, FlexProps } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplayWidgetView } from './CatalogPriceDisplayWidgetView';

interface CatalogSimplePriceWidgetViewProps extends FlexProps
{

}

export const CatalogSimplePriceWidgetView: FC<CatalogSimplePriceWidgetViewProps> = props =>
{
    const { gap = 1, ...rest } = props;
    const { currentOffer = null } = useCatalog();

    return (
        <Flex gap={ gap } alignItems="center" className="py-0.5 px-2 rounded text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200" { ...rest }>
            <CatalogPriceDisplayWidgetView separator={ true } offer={ currentOffer } />
        </Flex>
    );
}
