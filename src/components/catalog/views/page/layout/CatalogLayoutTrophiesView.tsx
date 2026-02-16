import { FC, useEffect, useState } from 'react';
import { Flex } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutTrophiesView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ trophyText, setTrophyText ] = useState<string>('');
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };
            newValue.extraData = trophyText;
            return newValue;
        });
    }, [ currentOffer, trophyText, setPurchaseOptions ]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
            { currentOffer ? (
                <div className="flex flex-col gap-2 shrink-0">
                    <textarea className="form-control w-full h-20 text-xs" defaultValue={ trophyText || '' } onChange={ event => setTrophyText(event.target.value) } />
                    <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <div className="w-[100px] h-[80px] shrink-0 rounded-md bg-white border border-zinc-100 overflow-hidden">
                            <Flex center className="w-full h-full">
                                <CatalogViewProductWidgetView />
                            </Flex>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-900 truncate">{ currentOffer.localizationName }</span>
                            <div className="flex items-center justify-between gap-2">
                                <CatalogTotalPriceWidget justifyContent="end" alignItems="end" />
                                <CatalogPurchaseWidgetView />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="catalog-page-text flex flex-col items-center gap-2 p-3 text-center shrink-0">
                    { !!page.localization.getImage(1) && <img alt="" src={ page.localization.getImage(1) } /> }
                    { /* Server localization text (trusted content from game server) */ }
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            ) }
        </div>
    );
}
