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
        <div className="flex items-center gap-1.5 px-4 py-1.5 overflow-x-auto catalog-chip-scroll shrink-0 border-b border-border/20">
            { visibleChildren.map((child: ICatalogNode, i: number) =>
            (
                <button
                    key={ i }
                    className={ `shrink-0 px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer select-none ${
                        child.isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent/50'
                    }` }
                    onClick={ () => activateNode(child) }
                >
                    { child.localization?.replace(/\s*\(\d+\)$/, '') }
                </button>
            )) }
        </div>
    );
};
