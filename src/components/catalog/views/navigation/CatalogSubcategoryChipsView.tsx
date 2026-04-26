import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { useCatalog } from '../../../../hooks';

export const CatalogSubcategoryChipsView: FC<{}> = () =>
{
    const { activeNodes = [], activateNode = null } = useCatalog();

    const parentNode = [...activeNodes].reverse().find(n => n.isBranch && n.children?.some(c => c.isVisible));

    if(!parentNode || !parentNode.children) return null;

    const visibleChildren = parentNode.children.filter(c => c.isVisible);

    if(visibleChildren.length < 2) return null;

    return (
        <div className="catalog-chip-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2">
            { visibleChildren.map((child: ICatalogNode, i: number) =>
            (
                <button
                    key={ i }
                    className={ `shrink-0 cursor-pointer select-none rounded-lg px-3 py-1 text-label-xs transition-colors ${
                        child.isActive
                            ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs'
                            : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950'
                    }` }
                    onClick={ () => activateNode(child) }
                >
                    { child.localization?.replace(/\s*\(\d+\)$/, '') }
                </button>
            )) }
        </div>
    );
};
