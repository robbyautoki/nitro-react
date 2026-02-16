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
                className={ `flex items-center gap-2 px-2.5 py-[7px] rounded-lg cursor-pointer text-xs select-none transition-all duration-150 ${ node.isActive ? 'bg-white text-zinc-900 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]' : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-800' } ${ child ? 'ml-2' : '' }` }
                onClick={ event => activateNode(node) }
            >
                <CatalogIconView icon={ node.iconId } />
                <span className="flex-1 truncate">{ node.localization }</span>
                { node.isBranch &&
                    <FaChevronRight className={ `text-[8px] text-zinc-300 transition-transform duration-150 ${ node.isOpen ? 'rotate-90' : '' }` } /> }
            </div>
            { node.isOpen && node.isBranch &&
                <div className="pl-2 ml-3 border-l border-zinc-200">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
