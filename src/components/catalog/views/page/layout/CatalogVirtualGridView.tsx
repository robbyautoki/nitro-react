import { FC, useEffect, useState } from 'react';
import { FaClock, FaFire } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { loadTracked, TrackedPurchase } from '../../../CatalogView';

interface CatalogVirtualGridViewProps
{
    type: string;
}

export const CatalogVirtualGridView: FC<CatalogVirtualGridViewProps> = props =>
{
    const { type } = props;
    const { openPageByOfferId = null } = useCatalog();
    const storageKey = type === 'recent' ? 'catalog_recent_purchases' : 'catalog_most_purchased';
    const [ items, setItems ] = useState<TrackedPurchase[]>(() => loadTracked(storageKey));

    useEffect(() =>
    {
        const refresh = () => setItems(loadTracked(storageKey));

        window.addEventListener('catalog_purchase_tracked', refresh);
        return () => window.removeEventListener('catalog_purchase_tracked', refresh);
    }, [ storageKey ]);

    const Icon = type === 'recent' ? FaClock : FaFire;
    const title = type === 'recent'
        ? LocalizeText('catalog.nav.recent_purchases')
        : LocalizeText('catalog.nav.most_purchased');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <Icon className="text-[11px] text-white/30" />
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-[0.08em]">{ title }</span>
                    <span className="text-[10px] text-white/20">({ items.length })</span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
                { items.length === 0 && (
                    <div className="flex items-center justify-center h-full text-white/20 text-xs">
                        { LocalizeText('catalog.frontpage.no_items') }
                    </div>
                ) }

                <div className="grid grid-cols-[repeat(auto-fill,68px)] gap-1">
                    { items.map((item, i) => (
                        <div
                            key={ i }
                            className="relative flex items-center justify-center rounded-lg border border-white/[0.07] bg-card cursor-pointer overflow-hidden transition-all duration-150 aspect-square group hover:border-indigo-500/60 hover:shadow-[0_0_10px_rgba(99,102,241,0.35)] hover:z-10"
                            style={ item.iconUrl ? { backgroundImage: `url(${ item.iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                            onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                        >
                            {/* Name + Price overlay on hover */}
                            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center py-[2px] bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-[7px] text-white/70 truncate max-w-[60px] leading-tight">{ item.name }</span>
                                { item.priceCredits > 0 &&
                                    <span className="text-[8px] font-bold text-amber-300">{ item.priceCredits }</span> }
                            </div>

                            {/* Count badge for frequent purchases */}
                            { item.count > 1 &&
                                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-white/10 text-white/60 rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none z-10">
                                    ×{ item.count }
                                </span> }
                        </div>
                    )) }
                </div>
            </div>
        </div>
    );
}
