import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { cn } from '../../../../lib/utils';
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
                className={ cn(
                    'px-3 py-[3px] text-[11px] cursor-pointer select-none transition-colors rounded-sm flex items-center gap-2',
                    node.isActive
                        ? 'text-white/90 bg-white/[0.07] font-medium'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                ) }
                onClick={ () => activateNode(node) }
            >
                <CatalogIconView icon={ node.iconId } />
                <span className="truncate">{ node.localization?.replace(/\s*\(\d+\)$/, '') }</span>
            </div>
            { node.isOpen && node.isBranch &&
                <div className="ml-3 border-l border-white/[0.05] pl-0.5 mt-0.5">
                    <CatalogNavigationSetView node={ node } child={ true } />
                </div> }
        </div>
    );
}
