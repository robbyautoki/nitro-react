import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { AutoGrid } from '../../../../common';
import { useCatalog } from '../../../../hooks';
import { ScrollArea } from '../../../ui/scroll-area';
import { CatalogSearchView } from '../page/common/CatalogSearchView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationViewProps
{
    node: ICatalogNode;
}

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = props =>
{
    const { node = null } = props;
    const { searchResult = null } = useCatalog();
    
    return (
        <div className="flex flex-col gap-1.5 h-full">
            <CatalogSearchView />
            <ScrollArea className="flex-1 nitro-catalog-navigation-grid-container rounded-lg bg-zinc-50/50 border border-zinc-100">
                <AutoGrid id="nitro-catalog-main-navigation" gap={ 1 } columnCount={ 1 } className="p-1">
                    { searchResult && (searchResult.filteredNodes.length > 0) && searchResult.filteredNodes.map((n, index) =>
                    {
                        return <CatalogNavigationItemView key={ index } node={ n } />;
                    }) }
                    { !searchResult &&
                        <CatalogNavigationSetView node={ node } /> }
                </AutoGrid>
            </ScrollArea>
        </div>
    );
}
