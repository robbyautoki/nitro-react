import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
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
        <div className="flex flex-col gap-2 h-full">
            <CatalogSearchView />
            <ScrollArea className="flex-1 rounded-lg bg-zinc-50/80 border border-zinc-200/60">
                <div className="flex flex-col gap-0.5 p-2">
                    { searchResult && (searchResult.filteredNodes.length > 0) && searchResult.filteredNodes.map((n, index) =>
                    {
                        return <CatalogNavigationItemView key={ index } node={ n } />;
                    }) }
                    { !searchResult &&
                        <CatalogNavigationSetView node={ node } /> }
                </div>
            </ScrollArea>
        </div>
    );
}
