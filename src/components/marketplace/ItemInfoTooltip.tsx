import { ComponentProps, FC, useRef, useState } from 'react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { ItemInfo, CustomListing } from './CustomMarketplaceTypes';
import { fmtC } from './marketplace-utils';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { BarChart3, Coins, Hash, Info, Package, Shield, TrendingUp } from 'lucide-react';

interface Props
{
    listing: CustomListing;
}

function rarityColor(label?: string | null): ComponentProps<typeof AlignBadge.Root>['color']
{
    const value = (label ?? '').toLowerCase();
    if(value.includes('og')) return 'yellow';
    if(value.includes('woche')) return 'green';
    if(value.includes('monat')) return 'purple';
    if(value.includes('cash')) return 'orange';
    if(value.includes('drachen')) return 'red';
    if(value.includes('bonzen')) return 'blue';
    return 'gray';
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
        ? (() =>
        {
            const p = info.limited_data.split(':'); return { num: parseInt(p[1]), total: parseInt(p[0]) };
        })()
        : null;

    return (
        <AlignTooltip.Root delayDuration={ 150 } onOpenChange={ onOpenChange }>
            <AlignTooltip.Trigger asChild>
                <button
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-bg-weak-50 text-text-sub-600 transition-all hover:text-text-strong-950"
                    title="Info"
                >
                    <Info className="w-3 h-3" />
                </button>
            </AlignTooltip.Trigger>
            <AlignTooltip.Content side="left" sideOffset={ 8 } className="z-[9999] w-[280px] p-0">
                { loading && (
                    <div className="p-4 text-center text-paragraph-xs text-text-sub-600">Laden...</div>
                ) }
                { !loading && !info && (
                    <div className="p-4 text-center text-paragraph-xs text-text-sub-600">Keine Daten</div>
                ) }
                { !loading && info && (
                    <div className="flex flex-col gap-2.5 p-3.5">
                        <div className="text-label-sm leading-tight text-text-strong-950">{ info.public_name }</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            { ltd && (
                                <AlignBadge.Root color="yellow" variant="lighter" size="small" square>
                                    <Hash className="mr-1 w-2.5 h-2.5" />
                                    LTD { ltd.num }/{ ltd.total }
                                </AlignBadge.Root>
                            ) }
                            { info.seal && (
                                <AlignBadge.Root color={ rarityColor(info.seal.rarity_display) } variant="lighter" size="small" square>
                                    <Shield className="mr-1 w-2.5 h-2.5" />
                                    { info.seal.rarity_display }
                                </AlignBadge.Root>
                            ) }
                            { info.rarity_type && (
                                <AlignBadge.Root color={ rarityColor(info.rarity_type) } variant="lighter" size="small" square>
                                    { info.rarity_type }
                                </AlignBadge.Root>
                            ) }
                            <AlignBadge.Root color="blue" variant="lighter" size="small" square>
                                <Package className="mr-1 w-2.5 h-2.5" />
                                { info.in_circulation.toLocaleString('de-DE') }x
                            </AlignBadge.Root>
                        </div>
                        <AlignDivider.Root />
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            { [
                                { label: 'Letzter Verkauf', value: info.last_sale_price != null ? fmtC(info.last_sale_price) : '-', icon: Coins, color: 'text-success-base' },
                                { label: 'Durchschnitt', value: info.avg_price != null ? fmtC(info.avg_price) : '-', icon: TrendingUp, color: 'text-information-base' },
                                { label: 'Verkäufe', value: String(info.total_sales), icon: BarChart3, color: 'text-warning-base' },
                                { label: 'Listenpreis', value: fmtC(listing.price), icon: Coins, color: 'text-warning-base' },
                            ].map(cell =>
                            {
                                const Icon = cell.icon;
                                return (
                                    <div key={ cell.label } className="flex items-center gap-1.5">
                                        <Icon className={ `w-3 h-3 shrink-0 ${ cell.color }` } />
                                        <div className="min-w-0">
                                            <div className="text-subheading-2xs uppercase text-text-soft-400">{ cell.label }</div>
                                            <div className="text-label-xs text-text-strong-950">{ cell.value }</div>
                                        </div>
                                    </div>
                                );
                            }) }
                        </div>
                        { listing.is_bundle && listing.items.length > 1 && (
                            <>
                                <AlignDivider.Root />
                                <div>
                                    <div className="mb-1 text-subheading-2xs uppercase text-text-soft-400">Bundle-Inhalt</div>
                                    <div className="flex flex-col gap-0.5">
                                        { listing.items.map((item, i) => (
                                            <div key={ i } className="flex items-center gap-1.5 text-paragraph-xs text-text-sub-600">
                                                <span className="text-text-soft-400">{ i + 1 }.</span>
                                                <span className="truncate">{ item.public_name }</span>
                                                { item.limited_data && item.limited_data !== '0:0' && (
                                                    <span className="shrink-0 text-subheading-2xs text-warning-base">LTD { item.limited_data }</span>
                                                ) }
                                            </div>
                                        )) }
                                    </div>
                                </div>
                            </>
                        ) }
                    </div>
                ) }
            </AlignTooltip.Content>
        </AlignTooltip.Root>
    );
};
