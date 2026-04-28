import { FC, useState } from 'react';
import { Star } from 'lucide-react';
import { ICatalogNode } from '../../../../api';
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
    const [ hovered, setHovered ] = useState(false);

    return (
        <div>
            <div
                className="group/item"
                onMouseEnter={ () => setHovered(true) }
                onMouseLeave={ () => setHovered(false) }
            >
                <button
                    className={ `flex w-full items-center gap-2 rounded-md px-2 py-1 text-label-xs transition-colors duration-150 ${
                        node.isActive
                            ? 'bg-bg-white-0 text-text-strong-950'
                            : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950'
                    }` }
                    onClick={ () => activateNode(node) }
                >
                    <div className="flex size-5 shrink-0 items-center justify-center">
                        <CatalogIconView icon={ node.iconId } />
                    </div>
                    <span className="truncate flex-1 text-left">{ node.localization?.replace(/\s*\(\d+\)$/, '') }</span>

                    { hovered && onToggleFavorite ? (
                        <button
                            className="shrink-0 rounded p-0.5 transition-colors hover:bg-bg-weak-50"
                            onClick={ (e) => { e.stopPropagation(); onToggleFavorite(node.pageId); } }
                        >
                            <Star className={ `w-3 h-3 ${ isFavorite ? 'fill-warning-base text-warning-base' : 'text-text-soft-400' }` } />
                        </button>
                    ) : null }
                </button>
            </div>
            { node.isOpen && node.isBranch &&
                <div className="ml-4 mt-1 border-l border-stroke-soft-200 pl-1">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
