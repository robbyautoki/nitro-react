import { FC } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { cn } from '../../../../lib/utils';
import { useCatalog } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
    onToggleFavorite?: (pageId: number) => void;
    isFavorite?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false, onToggleFavorite, isFavorite = false } = props;
    const { activateNode = null } = useCatalog();

    return (
        <div>
            <div
                className={ cn(
                    'group/item px-3 py-[3px] text-[11px] cursor-pointer select-none transition-colors rounded-sm flex items-center gap-2 border-l-2',
                    node.isActive
                        ? 'text-black/85 bg-black/[0.04] font-medium border-sky-400/60'
                        : 'text-black/40 hover:text-black/60 hover:bg-black/[0.03] border-transparent'
                ) }
                onClick={ () => activateNode(node) }
            >
                <div className="w-5 h-5 rounded bg-black/[0.03] flex items-center justify-center shrink-0">
                    <CatalogIconView icon={ node.iconId } />
                </div>
                <span className="truncate flex-1">{ node.localization?.replace(/\s*\(\d+\)$/, '') }</span>
                { onToggleFavorite &&
                    <button
                        className={ `shrink-0 transition-opacity ${ isFavorite ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100' }` }
                        onClick={ (e) => { e.stopPropagation(); onToggleFavorite(node.pageId); } }
                    >
                        { isFavorite
                            ? <FaStar className="text-[8px] text-amber-400/70" />
                            : <FaRegStar className="text-[8px] text-black/20 hover:text-amber-400/50" /> }
                    </button> }
            </div>
            { node.isOpen && node.isBranch &&
                <div className="ml-3 border-l border-black/[0.05] pl-0.5 mt-0.5">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
