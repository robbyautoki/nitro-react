import { FC } from 'react';
import { useCatalog } from '../../../../hooks';
import { ScrollArea } from '../../../ui/scroll-area';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export const CatalogNavigationView: FC<{}> = props =>
{
    const { rootNode = null, searchResult = null, activateNode = null, setSearchResult = null, setNavigationHidden = null } = useCatalog();

    const onSectionClick = (topNode: any) =>
    {
        if(searchResult) setSearchResult(null);
        if(setNavigationHidden) setNavigationHidden(false);
        activateNode(topNode);
    };

    return (
        <ScrollArea className="flex-1">
            <div className="py-2">
                { searchResult && (searchResult.filteredNodes.length > 0) &&
                    <div className="px-2">
                        { searchResult.filteredNodes.map((n, index) =>
                            <CatalogNavigationItemView key={ index } node={ n } />
                        ) }
                    </div> }

                { !searchResult && rootNode?.children?.map((topNode, index) =>
                {
                    if(!topNode.isVisible) return null;

                    return (
                        <div key={ index }>
                            {/* Section header — top-level category */}
                            <div
                                className={ `px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] cursor-pointer select-none transition-colors flex items-center gap-2 ${ topNode.isActive ? 'text-white/80' : 'text-white/40 hover:text-white/70' }` }
                                onClick={ () => onSectionClick(topNode) }
                            >
                                <CatalogIconView icon={ topNode.iconId } />
                                <span>{ topNode.localization }</span>
                            </div>

                            {/* Sub-items — always visible */}
                            <div className="px-2 pb-1">
                                <CatalogNavigationSetView node={ topNode } />
                            </div>
                        </div>
                    );
                }) }
            </div>
        </ScrollArea>
    );
}
