import { FC } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();

    return (
        <div>
            <div
                className={ `flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs select-none transition-colors ${ node.isActive ? 'bg-white text-zinc-900 font-medium shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' } ${ child ? 'ml-3' : '' }` }
                onClick={ event => activateNode(node) }
            >
                <CatalogIconView icon={ node.iconId } />
                <span className="flex-1 truncate">{ node.localization }</span>
                { node.isBranch &&
                    <FaChevronRight className={ `text-[9px] text-zinc-400 transition-transform ${ node.isOpen ? 'rotate-90' : '' }` } /> }
            </div>
            { node.isOpen && node.isBranch &&
                <div className="pl-2 ml-3 border-l border-zinc-200">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
