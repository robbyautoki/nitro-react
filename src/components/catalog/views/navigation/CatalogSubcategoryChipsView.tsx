import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { cn } from '../../../../lib/utils';
import { useCatalog } from '../../../../hooks';

export const CatalogSubcategoryChipsView: FC<{}> = () =>
{
    const { activeNodes = [], activateNode = null } = useCatalog();

    // Find the deepest active branch node that has visible children (works for any depth)
    const parentNode = [...activeNodes].reverse().find(n => n.isBranch && n.children?.some(c => c.isVisible));

    if(!parentNode || !parentNode.children) return null;

    const visibleChildren = parentNode.children.filter(c => c.isVisible);

    if(visibleChildren.length < 2) return null;

    return (
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto catalog-chip-scroll shrink-0 border-b border-white/[0.04]">
            { visibleChildren.map((child: ICatalogNode, i: number) =>
            (
                <button
                    key={ i }
                    className={ cn(
                        'shrink-0 px-2.5 py-[3px] rounded-full text-[10px] font-medium transition-all cursor-pointer select-none border',
                        child.isActive
                            ? 'bg-white/[0.12] text-white/90 border-white/[0.15]'
                            : 'bg-transparent text-white/40 border-transparent hover:text-white/60 hover:bg-white/[0.05]'
                    ) }
                    onClick={ () => activateNode(child) }
                >
                    { child.localization?.replace(/\s*\(\d+\)$/, '') }
                </button>
            )) }
        </div>
    );
};
