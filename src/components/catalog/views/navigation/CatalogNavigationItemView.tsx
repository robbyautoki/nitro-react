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
                    className={ `w-full flex items-center gap-2 py-1 px-2 text-xs rounded-lg transition-all duration-150 ${
                        node.isActive
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }` }
                    onClick={ () => activateNode(node) }
                >
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                        <CatalogIconView icon={ node.iconId } />
                    </div>
                    <span className="truncate flex-1 text-left">{ node.localization?.replace(/\s*\(\d+\)$/, '') }</span>

                    { hovered && onToggleFavorite ? (
                        <button
                            className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
                            onClick={ (e) => { e.stopPropagation(); onToggleFavorite(node.pageId); } }
                        >
                            <Star className={ `w-3 h-3 ${ isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30' }` } />
                        </button>
                    ) : null }
                </button>
            </div>
            { node.isOpen && node.isBranch &&
                <div className="ml-4 border-l border-border/40 pl-0.5 mt-0.5">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
