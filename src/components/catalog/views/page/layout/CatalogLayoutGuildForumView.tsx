import { CatalogGroupsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayouGuildForumView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ selectedGroupIndex, setSelectedGroupIndex ] = useState<number>(0);
    const { currentOffer = null, setCurrentOffer = null, catalogOptions = null } = useCatalog();
    const { groups = null } = catalogOptions;

    useEffect(() =>
    {
        SendMessageComposer(new CatalogGroupsComposer());
    }, [ page ]);

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <div className="flex flex-col h-full gap-2">
                <div className="catalog-page-text flex-1 min-h-0 overflow-auto rounded-lg bg-white/[0.05] border border-white/[0.07] p-3">
                    { /* Server localization text (trusted content from game server) */ }
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(1) } } />
                </div>
                { !!currentOffer && (
                    <div className="flex items-center gap-3 p-2.5 bg-white/[0.05] rounded-lg border border-white/[0.07] shrink-0">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-sm font-medium text-white/90 truncate">{ currentOffer.localizationName }</span>
                            <CatalogGuildSelectorWidgetView />
                            <div className="flex items-center justify-between gap-2">
                                <CatalogTotalPriceWidget justifyContent="end" alignItems="end" />
                                <CatalogPurchaseWidgetView noGiftOption={ true } />
                            </div>
                        </div>
                    </div>
                ) }
            </div>
        </>
    );
}
