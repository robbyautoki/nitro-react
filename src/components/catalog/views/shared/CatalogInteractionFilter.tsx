import { FC, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { IPurchasableOffer } from '../../../../api';

const INTERACTION_LABELS: Record<string, { label: string; color: string }> = {
    vendingmachine: { label: 'Automat', color: 'text-emerald-500' },
    gate: { label: 'Tor', color: 'text-blue-500' },
    teleport: { label: 'Teleporter', color: 'text-purple-500' },
    trophy: { label: 'Trophäe', color: 'text-amber-500' },
    badge: { label: 'Badge', color: 'text-cyan-500' },
    bed: { label: 'Bett', color: 'text-pink-500' },
    roller: { label: 'Roller', color: 'text-orange-500' },
    dice: { label: 'Würfel', color: 'text-red-500' },
    crackable: { label: 'Knackbar', color: 'text-lime-500' },
    effect: { label: 'Effekt', color: 'text-violet-500' },
    clothing: { label: 'Kleidung', color: 'text-rose-500' },
    pressureplate: { label: 'Druckplatte', color: 'text-teal-500' },
    switch: { label: 'Schalter', color: 'text-yellow-500' },
    multiheight: { label: 'Multiheight', color: 'text-sky-500' },
    pet_food: { label: 'Tierfutter', color: 'text-green-500' },
};

export { INTERACTION_LABELS };

interface CatalogInteractionFilterProps
{
    offers: IPurchasableOffer[];
    activeFilter: string | null;
    onFilter: (f: string | null) => void;
}

export const CatalogInteractionFilter: FC<CatalogInteractionFilterProps> = ({ offers, activeFilter, onFilter }) =>
{
    const types = useMemo(() =>
    {
        const counts = new Map<string, number>();

        for(const offer of offers)
        {
            const fd = offer.product?.furnitureData;
            if(!fd) continue;
            const t = fd.interactionType || 'default';
            counts.set(t, (counts.get(t) || 0) + 1);
        }

        return Array.from(counts.entries())
            .filter(([ t ]) => t !== 'default' && INTERACTION_LABELS[t])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [ offers ]);

    if(types.length <= 1) return null;

    return (
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border/30 bg-muted/10 overflow-x-auto shrink-0" style={ { scrollbarWidth: 'none' } }>
            <Filter className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <button
                onClick={ () => onFilter(null) }
                className={ `shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${ !activeFilter ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50' }` }
            >
                Alle
            </button>
            { types.map(([ type, count ]) =>
            {
                const info = INTERACTION_LABELS[type];
                return (
                    <button
                        key={ type }
                        onClick={ () => onFilter(activeFilter === type ? null : type) }
                        className={ `shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${ activeFilter === type ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50' }` }
                    >
                        { info?.label || type }
                        <span className="opacity-40 text-[9px]">{ count }</span>
                    </button>
                );
            }) }
        </div>
    );
};
