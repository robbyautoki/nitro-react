import { FC, useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { ItemInfo, CustomListing } from './CustomMarketplaceTypes';
import { Coins, TrendingUp, Hash, Shield, Package, BarChart3, Info } from 'lucide-react';

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
}

export const ItemInfoTooltip: FC<Props> = ({ listing }) =>
{
    const [ info, setInfo ] = useState<ItemInfo | null>(null);
    const [ loading, setLoading ] = useState(false);
    const fetched = useRef(false);

    const mainItem = listing.items[0];

    const onOpenChange = (open: boolean) =>
    {
        if(open && !fetched.current && mainItem)
        {
            fetched.current = true;
            setLoading(true);
            CustomMarketplaceApi.itemInfo(mainItem.item_base_id, mainItem.item_id)
                .then(data => setInfo(data.error ? null : data))
                .finally(() => setLoading(false));
        }
    };

    const ltd = info?.limited_data && info.limited_data !== '0:0'
        ? (() => { const p = info.limited_data.split(':'); return { num: parseInt(p[0]), total: parseInt(p[1]) }; })()
        : null;

    return (
        <Tooltip delayDuration={ 150 } onOpenChange={ onOpenChange }>
            <TooltipTrigger asChild>
                <button
                    className="h-7 w-7 rounded-lg bg-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/10 transition-all flex items-center justify-center"
                    title="Info"
                >
                    <Info className="size-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="left"
                sideOffset={ 8 }
                className="!z-[500] w-[300px] p-0 rounded-xl border border-white/[0.08] bg-[rgba(12,12,16,0.97)] backdrop-blur-xl shadow-2xl text-white"
            >
                { loading && (
                    <div className="p-4 text-center text-white/30 text-[11px]">Laden...</div>
                ) }

                { !loading && !info && (
                    <div className="p-4 text-center text-white/30 text-[11px]">Keine Daten</div>
                ) }

                { !loading && info && (
                    <div className="flex flex-col gap-2.5 p-3.5">
                        {/* Item Name */}
                        <div className="text-[13px] font-semibold text-white/90 leading-tight">{ info.public_name }</div>

                        {/* Tags row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            { ltd && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-400">
                                    <Hash className="size-2.5" />
                                    LTD { ltd.num }/{ ltd.total }
                                </span>
                            ) }
                            { info.seal && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white"
                                    style={ { backgroundColor: info.seal.color + '30', color: info.seal.color } }
                                >
                                    <Shield className="size-2.5" />
                                    { info.seal.rarity_display }
                                </span>
                            ) }
                            { info.rarity_type && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                                    style={ { backgroundColor: (info.rarity_color ?? '#888') + '20', color: info.rarity_color ?? '#a78bfa' } }
                                >
                                    { RARITY_LABELS[info.rarity_type.toLowerCase()] ?? info.rarity_type }
                                </span>
                            ) }
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] text-blue-400/80">
                                <Package className="size-2.5" />
                                { info.in_circulation.toLocaleString() }x
                            </span>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-white/[0.06]" />

                        {/* Price Stats */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Coins className="size-3 text-emerald-400/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Letzter Verkauf</div>
                                    <div className="text-[11px] text-white/80 font-medium">
                                        { info.last_sale_price != null ? info.last_sale_price.toLocaleString() : '—' }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp className="size-3 text-blue-400/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Durchschnitt</div>
                                    <div className="text-[11px] text-white/80 font-medium">
                                        { info.avg_price != null ? info.avg_price.toLocaleString() : '—' }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BarChart3 className="size-3 text-amber-400/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Verkäufe</div>
                                    <div className="text-[11px] text-white/80 font-medium">{ info.total_sales }</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Coins className="size-3 text-amber-400/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Listenpreis</div>
                                    <div className="text-[11px] text-white/80 font-medium">{ listing.price.toLocaleString() }</div>
                                </div>
                            </div>
                        </div>

                        {/* Bundle Contents */}
                        { listing.is_bundle && listing.items.length > 1 && (
                            <>
                                <div className="h-px bg-white/[0.06]" />
                                <div>
                                    <div className="text-[9px] font-bold text-white/35 uppercase tracking-wider mb-1">Bundle-Inhalt</div>
                                    <div className="flex flex-col gap-0.5">
                                        { listing.items.map((item, i) =>
                                        {
                                            const itemLtd = item.limited_data && item.limited_data !== '0:0' ? item.limited_data : null;
                                            return (
                                                <div key={ i } className="flex items-center gap-1.5 text-[10px] text-white/55">
                                                    <span className="text-white/25">{ i + 1 }.</span>
                                                    <span className="truncate">{ item.public_name }</span>
                                                    { itemLtd && <span className="text-[9px] text-amber-400 font-bold shrink-0">LTD { itemLtd }</span> }
                                                </div>
                                            );
                                        }) }
                                    </div>
                                </div>
                            </>
                        ) }
                    </div>
                ) }
            </TooltipContent>
        </Tooltip>
    );
};
