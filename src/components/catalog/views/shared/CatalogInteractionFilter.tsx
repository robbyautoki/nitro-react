import { FC, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { IPurchasableOffer } from '../../../../api';

const INTERACTION_LABELS: Record<string, { label: string; color: string }> = {
    vendingmachine: { label: 'Automat', color: 'text-success-base' },
    gate: { label: 'Tor', color: 'text-information-base' },
    teleport: { label: 'Teleporter', color: 'text-primary-base' },
    trophy: { label: 'Trophäe', color: 'text-warning-base' },
    badge: { label: 'Badge', color: 'text-information-base' },
    bed: { label: 'Bett', color: 'text-feature-base' },
    roller: { label: 'Roller', color: 'text-warning-base' },
    dice: { label: 'Würfel', color: 'text-error-base' },
    crackable: { label: 'Knackbar', color: 'text-success-base' },
    effect: { label: 'Effekt', color: 'text-primary-base' },
    clothing: { label: 'Kleidung', color: 'text-feature-base' },
    pressureplate: { label: 'Druckplatte', color: 'text-information-base' },
    switch: { label: 'Schalter', color: 'text-warning-base' },
    multiheight: { label: 'Multiheight', color: 'text-information-base' },
    pet_food: { label: 'Tierfutter', color: 'text-success-base' },
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
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2" style={ { scrollbarWidth: 'none' } }>
            <Filter className="w-3 h-3 text-text-soft-400 shrink-0" />
            <button
                onClick={ () => onFilter(null) }
                className={ `shrink-0 rounded-lg px-2.5 py-1 text-label-xs transition-colors ${ !activeFilter ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs' : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950' }` }
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
                        className={ `flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-label-xs transition-colors ${ activeFilter === type ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs' : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950' }` }
                    >
                        { info?.label || type }
                        <span className="text-subheading-2xs opacity-40">{ count }</span>
                    </button>
                );
            }) }
        </div>
    );
};
