import { FC, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { ItemInfo, CustomListing } from './CustomMarketplaceTypes';
import { fmtC } from './marketplace-utils';
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
        ? (() => { const p = info.limited_data.split(':'); return { num: parseInt(p[1]), total: parseInt(p[0]) }; })()
        : null;

    return (
        <Tooltip delayDuration={ 150 } onOpenChange={ onOpenChange }>
            <TooltipTrigger asChild>
                <button
                    className="h-6 w-6 rounded-md bg-accent/50 text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all flex items-center justify-center"
                    title="Info"
                >
                    <Info className="w-3 h-3" />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="left"
                sideOffset={ 8 }
                className="w-[280px] p-0 z-[9999]"
            >
                { loading && (
                    <div className="p-4 text-center text-muted-foreground text-[11px]">Laden...</div>
                ) }

                { !loading && !info && (
                    <div className="p-4 text-center text-muted-foreground text-[11px]">Keine Daten</div>
                ) }

                { !loading && info && (
                    <div className="flex flex-col gap-2.5 p-3.5">
                        <div className="text-[13px] font-semibold leading-tight">{ info.public_name }</div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            { ltd && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-500">
                                    <Hash className="w-2.5 h-2.5" />
                                    LTD { ltd.num }/{ ltd.total }
                                </span>
                            ) }
                            { info.seal && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                                    style={ { backgroundColor: info.seal.color + '30', color: info.seal.color } }
                                >
                                    <Shield className="w-2.5 h-2.5" />
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
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] text-blue-500">
                                <Package className="w-2.5 h-2.5" />
                                { info.in_circulation.toLocaleString() }x
                            </span>
                        </div>

                        <div className="h-px bg-border/40" />

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Coins className="w-3 h-3 text-emerald-500/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Letzter Verkauf</div>
                                    <div className="text-[11px] font-medium">
                                        { info.last_sale_price != null ? fmtC(info.last_sale_price) : '—' }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-blue-500/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Durchschnitt</div>
                                    <div className="text-[11px] font-medium">
                                        { info.avg_price != null ? fmtC(info.avg_price) : '—' }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BarChart3 className="w-3 h-3 text-amber-500/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Verkäufe</div>
                                    <div className="text-[11px] font-medium">{ info.total_sales }</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Coins className="w-3 h-3 text-amber-500/70 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Listenpreis</div>
                                    <div className="text-[11px] font-medium">{ fmtC(listing.price) }</div>
                                </div>
                            </div>
                        </div>

                        { listing.is_bundle && listing.items.length > 1 && (
                            <>
                                <div className="h-px bg-border/40" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Bundle-Inhalt</div>
                                    <div className="flex flex-col gap-0.5">
                                        { listing.items.map((item, i) => (
                                            <div key={ i } className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <span className="text-muted-foreground/30">{ i + 1 }.</span>
                                                <span className="truncate">{ item.public_name }</span>
                                                { item.limited_data && item.limited_data !== '0:0' && (
                                                    <span className="text-[9px] text-amber-500 font-bold shrink-0">LTD { item.limited_data }</span>
                                                ) }
                                            </div>
                                        )) }
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
