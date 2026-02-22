import { FC, useEffect, useState } from 'react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { ItemInfo, CustomListing } from './CustomMarketplaceTypes';
import { X, Coins, TrendingUp, Hash, Shield, Package, BarChart3 } from 'lucide-react';

const RARITY_LABELS: Record<string, string> = {
    bonzenrare: 'Bonzenrare',
    wochenrare: 'Wochenrare',
    monatsrare: 'Monatsrare',
    limited: 'Limited',
    ultra: 'Ultra-Rare',
};

interface Props
{
    listing: CustomListing;
    onClose: () => void;
}

export const ItemInfoModal: FC<Props> = ({ listing, onClose }) =>
{
    const [ info, setInfo ] = useState<ItemInfo | null>(null);
    const [ loading, setLoading ] = useState(true);

    const mainItem = listing.items[0];

    useEffect(() =>
    {
        if(!mainItem) return;
        setLoading(true);
        CustomMarketplaceApi.itemInfo(mainItem.item_base_id, mainItem.item_id)
            .then(data => setInfo(data.error ? null : data))
            .finally(() => setLoading(false));
    }, [ mainItem ]);

    const ltd = info?.limited_data && info.limited_data !== '0:0'
        ? (() => { const p = info.limited_data.split(':'); return { num: parseInt(p[0]), total: parseInt(p[1]) }; })()
        : null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={ onClose } />
            <div className="relative w-[380px] rounded-xl border border-white/[0.08] bg-[rgba(12,12,16,0.98)] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white/90">Item-Info</h3>
                    <button onClick={ onClose } className="text-white/30 hover:text-white/70 transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="p-4">
                    { loading && <div className="text-center py-8 text-white/30 text-xs">Laden...</div> }

                    { !loading && !info && <div className="text-center py-8 text-white/30 text-xs">Keine Daten verfügbar</div> }

                    { !loading && info && (
                        <div className="flex flex-col gap-3">
                            {/* Item Name */}
                            <div className="text-sm font-medium text-white/90">{ info.public_name }</div>

                            {/* LTD Number */}
                            { ltd && (
                                <div className="flex items-center gap-2">
                                    <Hash className="size-3.5 text-amber-400/80" />
                                    <span className="text-[11px] text-white/70">LTD <span className="font-bold text-amber-400">{ ltd.num }</span> von { ltd.total }</span>
                                </div>
                            ) }

                            {/* Seal (instance-level) */}
                            { info.seal && (
                                <div className="flex items-center gap-2">
                                    <Shield className="size-3.5" style={ { color: info.seal.color } } />
                                    <span className="text-[11px] font-semibold" style={ { color: info.seal.color } }>
                                        Siegel: { info.seal.rarity_display }
                                    </span>
                                </div>
                            ) }

                            {/* Rarity Type (base-level) */}
                            { info.rarity_type && (
                                <div className="flex items-center gap-2">
                                    <Shield className="size-3.5" style={ { color: info.rarity_color ?? '#a78bfa' } } />
                                    <span className="text-[11px] text-white/70">
                                        { RARITY_LABELS[info.rarity_type.toLowerCase()] ?? info.rarity_type }
                                    </span>
                                </div>
                            ) }

                            {/* In Circulation */}
                            <div className="flex items-center gap-2">
                                <Package className="size-3.5 text-blue-400/80" />
                                <span className="text-[11px] text-white/70">{ info.in_circulation.toLocaleString() } Stück im Umlauf</span>
                            </div>

                            {/* Price Stats */}
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Preisstatistik</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <Coins className="size-3 text-emerald-400/80" />
                                        <div>
                                            <div className="text-[10px] text-white/40">Letzter Verkauf</div>
                                            <div className="text-[11px] text-white/80 font-medium">
                                                { info.last_sale_price != null ? info.last_sale_price.toLocaleString() : '—' }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="size-3 text-blue-400/80" />
                                        <div>
                                            <div className="text-[10px] text-white/40">Durchschnitt</div>
                                            <div className="text-[11px] text-white/80 font-medium">
                                                { info.avg_price != null ? info.avg_price.toLocaleString() : '—' }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="size-3 text-amber-400/80" />
                                        <div>
                                            <div className="text-[10px] text-white/40">Verkäufe gesamt</div>
                                            <div className="text-[11px] text-white/80 font-medium">{ info.total_sales }</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Coins className="size-3 text-amber-400/80" />
                                        <div>
                                            <div className="text-[10px] text-white/40">Listenpreis</div>
                                            <div className="text-[11px] text-white/80 font-medium">{ listing.price.toLocaleString() }</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bundle Contents */}
                            { listing.is_bundle && listing.items.length > 1 && (
                                <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Bundle-Inhalt</div>
                                    <div className="flex flex-col gap-1">
                                        { listing.items.map((item, i) =>
                                        {
                                            const itemLtd = item.limited_data && item.limited_data !== '0:0' ? item.limited_data : null;
                                            return (
                                                <div key={ i } className="flex items-center gap-2 text-[11px] text-white/60">
                                                    <span className="text-white/30">{ i + 1 }.</span>
                                                    <span>{ item.public_name }</span>
                                                    { itemLtd && <span className="text-[9px] text-amber-400 font-bold">LTD { itemLtd }</span> }
                                                </div>
                                            );
                                        }) }
                                    </div>
                                </div>
                            ) }
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};
