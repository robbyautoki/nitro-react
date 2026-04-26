import { IFurnitureData } from '@nitrots/nitro-renderer';
import { FC, useState, useMemo, useCallback, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { GetSessionDataManager } from '../../api';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { CurrencyIcon, ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignPopover from '@/align-ui/components/ui/popover';
import { ChevronsUpDown, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

export const MarketplacePriceChartView: FC<{}> = () =>
{
    const { itemStats, requestItemStats } = useMarketplace();
    const [ open, setOpen ] = useState(false);
    const [ searchInput, setSearchInput ] = useState('');
    const [ displayName, setDisplayName ] = useState('');
    const [ selectedClassName, setSelectedClassName ] = useState('');
    const [ selectedFurniType, setSelectedFurniType ] = useState(1);
    const [ allFurniture, setAllFurniture ] = useState<IFurnitureData[]>([]);

    useEffect(() =>
    {
        const data = GetSessionDataManager().getAllFurnitureData({ loadFurnitureData: null });
        if(data) setAllFurniture(data);
    }, []);

    const suggestions = useMemo(() =>
    {
        if(!searchInput || searchInput.length < 2) return [];
        const q = searchInput.toLowerCase();
        return allFurniture
            .filter(f =>
                (f.name && f.name.toLowerCase().includes(q) && !f.name.endsWith('_name')) ||
                (f.className && f.className.toLowerCase().includes(q))
            )
            .slice(0, 20);
    }, [ searchInput, allFurniture ]);

    const selectItem = useCallback((item: IFurnitureData) =>
    {
        const ft = item.type === 'I' ? 2 : 1;
        setSelectedFurniType(ft);
        setSelectedClassName(item.className);
        setDisplayName(item.name && !item.name.endsWith('_name') ? item.name : item.className);
        requestItemStats(ft, item.id);
        setOpen(false);
        setSearchInput('');
    }, [ requestItemStats ]);

    const chartData = useMemo(() =>
    {
        if(!itemStats?.history?.length) return [];
        return itemStats.history
            .map(h => ({
                date: `${ h.dayOffset }d`,
                dayOffset: h.dayOffset,
                averagePrice: h.averagePrice,
            }))
            .sort((a, b) => b.dayOffset - a.dayOffset);
    }, [ itemStats ]);

    const prices = chartData.map(d => d.averagePrice);
    const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const trend = prices.length >= 2 ? prices[prices.length - 1] - prices[0] : 0;

    return (
        <div className="flex flex-col h-full">
            <div className="shrink-0 border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                <div className="flex items-center gap-2">
                    { /* Combobox Item Selector */ }
                    <AlignPopover.Root open={ open } onOpenChange={ setOpen }>
                        <AlignPopover.Trigger asChild>
                            <button className="flex items-center gap-2 rounded-10 bg-bg-white-0 px-2 py-1.5 shadow-regular-xs ring-1 ring-stroke-soft-200 transition-colors hover:bg-bg-weak-50">
                                { displayName ? (
                                    <>
                                        <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                                            <ItemIcon itemName={ selectedClassName } className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-label-xs leading-tight text-text-strong-950">{ displayName }</p>
                                            <p className="text-paragraph-xs text-text-soft-400 font-mono leading-tight">
                                                { selectedFurniType === 1 ? 'Bodenmöbel' : 'Wandmöbel' } · ID { itemStats?.furniTypeId ?? '...' }
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-left">
                                        <p className="text-label-xs text-text-sub-600">Möbel auswählen...</p>
                                    </div>
                                ) }
                                <ChevronsUpDown className="w-3 h-3 text-text-soft-400 ml-1 shrink-0" />
                            </button>
                        </AlignPopover.Trigger>
                        <AlignPopover.Content className="w-[280px] p-2" align="start" showArrow={ false }>
                            <AlignInput.Root size="xsmall">
                                <AlignInput.Wrapper className="h-8">
                                    <AlignInput.Input
                                        placeholder="Möbel suchen..."
                                        value={ searchInput }
                                        onChange={ e => setSearchInput(e.target.value) }
                                        className="h-8 text-label-xs"
                                    />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                            <div className="mt-2 max-h-[260px] overflow-y-auto pr-1" style={ { scrollbarWidth: 'thin' } }>
                                { searchInput.length < 2 ? (
                                    <div className="py-4 text-center text-paragraph-xs text-text-sub-600">
                                        Mindestens 2 Zeichen eingeben...
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div className="py-4 text-center text-paragraph-xs text-text-sub-600">
                                        Keine Möbel gefunden.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="px-2 py-1 text-subheading-2xs uppercase text-text-soft-400">
                                            { suggestions.length } Ergebnis{ suggestions.length !== 1 ? 'se' : '' }
                                        </div>
                                        { suggestions.map(item => (
                                            <button
                                                key={ `${ item.type }-${ item.id }` }
                                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-paragraph-xs transition-colors hover:bg-bg-weak-50"
                                                onClick={ () => selectItem(item) }
                                            >
                                                <div className="flex w-7 h-7 shrink-0 items-center justify-center rounded-10 bg-bg-weak-50 shadow-regular-xs ring-1 ring-stroke-soft-200">
                                                    <ItemIcon itemName={ item.className } className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-text-strong-950">{ item.name && !item.name.endsWith('_name') ? item.name : item.className }</p>
                                                    <p className="font-mono text-paragraph-xs text-text-soft-400">
                                                        { item.type === 'I' ? 'Wand' : 'Boden' } · ID { item.id }
                                                    </p>
                                                </div>
                                            </button>
                                        )) }
                                    </div>
                                ) }
                            </div>
                        </AlignPopover.Content>
                    </AlignPopover.Root>
                    { /* Stats in same row, ml-auto */ }
                    { itemStats && (
                        <div className="ml-auto flex items-center gap-3">
                            <div className="text-center">
                                <p className="text-subheading-2xs uppercase text-text-soft-400">Ø Preis</p>
                                <p className="text-label-xs tabular-nums flex items-center gap-0.5 justify-center text-text-strong-950">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(avg) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-subheading-2xs uppercase text-text-soft-400">Min</p>
                                <p className="text-label-xs tabular-nums text-success-base flex items-center gap-0.5 justify-center">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(min) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-subheading-2xs uppercase text-text-soft-400">Max</p>
                                <p className="text-label-xs tabular-nums text-error-base flex items-center gap-0.5 justify-center">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(max) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-subheading-2xs uppercase text-text-soft-400">Trend</p>
                                <p className={ `text-label-xs tabular-nums flex items-center gap-0.5 ${ trend >= 0 ? 'text-success-base' : 'text-error-base' }` }>
                                    { trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> }
                                    { trend >= 0 ? '+' : '' }{ trend }
                                </p>
                            </div>
                        </div>
                    ) }
                </div>
            </div>
            { !itemStats ? (
                <div className="flex flex-col items-center justify-center flex-1 text-text-sub-600">
                    <BarChart3 className="w-10 h-10 opacity-20 mb-2" />
                    <span className="text-paragraph-xs">Wähle ein Möbelstück um den Preisverlauf zu sehen</span>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-text-sub-600">
                    <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                    <span className="text-paragraph-xs">Keine Verlaufsdaten vorhanden</span>
                </div>
            ) : (
                <div className="flex-1 min-h-0 px-2 py-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ chartData } margin={ { top: 4, right: 8, left: 0, bottom: 0 } }>
                            <defs>
                                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--align-primary-base))" stopOpacity={ 0.2 } />
                                    <stop offset="95%" stopColor="hsl(var(--align-primary-base))" stopOpacity={ 0 } />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--align-stroke-soft-200))" strokeOpacity={ 0.6 } />
                            <XAxis dataKey="date" tick={ { fontSize: 9, fill: 'hsl(var(--align-text-soft-400))' } } tickLine={ false } axisLine={ false } interval={ 4 } />
                            <YAxis tick={ { fontSize: 9, fill: 'hsl(var(--align-text-soft-400))' } } tickLine={ false } axisLine={ false } width={ 35 } domain={ [ 'dataMin - 10', 'dataMax + 10' ] } />
                            <RechartsTooltip
                                cursor={ { stroke: 'hsl(var(--align-stroke-sub-300))' } }
                                contentStyle={ {
                                    backgroundColor: 'hsl(var(--align-bg-white-0))',
                                    border: '1px solid hsl(var(--align-stroke-soft-200))',
                                    borderRadius: '10px',
                                    boxShadow: 'var(--shadow-regular-md)',
                                    color: 'hsl(var(--align-text-strong-950))',
                                    fontSize: 11,
                                } }
                                labelStyle={ { color: 'hsl(var(--align-text-sub-600))' } }
                                itemStyle={ { color: 'hsl(var(--align-primary-base))' } }
                                formatter={ value => [ fmtC(Number(value)), 'Preis' ] }
                            />
                            <Area type="monotone" dataKey="averagePrice" stroke="hsl(var(--align-primary-base))" strokeWidth={ 2 } fill="url(#priceGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) }
        </div>
    );
};
