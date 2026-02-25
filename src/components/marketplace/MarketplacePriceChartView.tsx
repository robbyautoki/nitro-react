import { FC, useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { CurrencyIcon, ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

const chartConfig: ChartConfig = {
    averagePrice: {
        label: 'Preis',
        color: 'hsl(var(--primary))',
    },
};

export const MarketplacePriceChartView: FC<{}> = () =>
{
    const { itemStats, requestItemStats } = useMarketplace();
    const [ open, setOpen ] = useState(false);
    const [ furniType, setFurniType ] = useState(1);
    const [ searchInput, setSearchInput ] = useState('');
    const [ displayName, setDisplayName ] = useState('');

    const doSearch = useCallback((input: string) =>
    {
        const id = parseInt(input);
        if(isNaN(id) || id <= 0) return;
        requestItemStats(furniType, id);
        setDisplayName(`Möbel #${ id }`);
        setOpen(false);
        setSearchInput('');
    }, [ furniType, requestItemStats ]);

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
            <div className="shrink-0 px-3 pt-2 pb-1 border-b border-border/30">
                <div className="flex items-center gap-2">
                    {/* Combobox Item Selector */}
                    <Popover open={ open } onOpenChange={ setOpen }>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/10 hover:bg-accent/30 px-2 py-1 transition-colors">
                                { itemStats ? (
                                    <>
                                        <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[12px] font-semibold leading-tight">{ displayName }</p>
                                            <p className="text-[9px] text-muted-foreground font-mono leading-tight">
                                                { furniType === 1 ? 'Bodenmöbel' : 'Wandmöbel' } · ID { itemStats.furniTypeId }
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-left">
                                        <p className="text-[12px] font-medium text-muted-foreground">Möbel auswählen...</p>
                                    </div>
                                ) }
                                <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50 ml-1 shrink-0" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="start">
                            <Command shouldFilter={ false }>
                                <CommandInput
                                    placeholder="Möbel-ID eingeben..."
                                    className="h-8 text-[12px]"
                                    value={ searchInput }
                                    onValueChange={ setSearchInput }
                                    onKeyDown={ e =>
                                    {
                                        if(e.key === 'Enter')
                                        {
                                            e.preventDefault();
                                            doSearch(searchInput);
                                        }
                                    } }
                                />
                                <CommandList>
                                    <CommandEmpty className="py-3 text-center text-[11px] text-muted-foreground">
                                        Möbel-ID eingeben und Enter drücken.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            className="flex items-center gap-2 text-[11px] cursor-pointer"
                                            onSelect={ () =>
                                            {
                                                setFurniType(furniType === 1 ? 2 : 1);
                                            } }
                                        >
                                            <span className="flex-1">Typ: { furniType === 1 ? 'Bodenmöbel' : 'Wandmöbel' }</span>
                                            <span className="text-[9px] text-muted-foreground">Klicke zum Wechseln</span>
                                        </CommandItem>
                                        { searchInput && parseInt(searchInput) > 0 && (
                                            <CommandItem
                                                className="flex items-center gap-2 text-[11px] cursor-pointer"
                                                onSelect={ () => doSearch(searchInput) }
                                            >
                                                <BarChart3 className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                                <span className="flex-1">Preisverlauf für #{ searchInput } laden</span>
                                            </CommandItem>
                                        ) }
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Stats in same row, ml-auto */}
                    { itemStats && (
                        <div className="ml-auto flex items-center gap-3">
                            <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Ø Preis</p>
                                <p className="text-[11px] font-bold tabular-nums flex items-center gap-0.5 justify-center">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(avg) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Min</p>
                                <p className="text-[11px] font-bold tabular-nums text-emerald-500 flex items-center gap-0.5 justify-center">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(min) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Max</p>
                                <p className="text-[11px] font-bold tabular-nums text-red-500 flex items-center gap-0.5 justify-center">
                                    <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(max) }
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Trend</p>
                                <p className={ `text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${ trend >= 0 ? 'text-emerald-500' : 'text-red-500' }` }>
                                    { trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> }
                                    { trend >= 0 ? '+' : '' }{ trend }
                                </p>
                            </div>
                        </div>
                    ) }
                </div>
            </div>

            { !itemStats ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <BarChart3 className="w-10 h-10 opacity-20 mb-2" />
                    <span className="text-xs">Gib eine Möbel-ID ein um den Preisverlauf zu sehen</span>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                    <span className="text-xs">Keine Verlaufsdaten vorhanden</span>
                </div>
            ) : (
                <div className="flex-1 min-h-0 px-2 py-3">
                    <ChartContainer config={ chartConfig } className="h-full w-full">
                        <AreaChart data={ chartData } margin={ { top: 4, right: 8, left: 0, bottom: 0 } }>
                            <defs>
                                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={ 0.2 } />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={ 0 } />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={ 0.3 } />
                            <XAxis dataKey="date" tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } interval={ 4 } />
                            <YAxis tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } width={ 35 } domain={ [ 'dataMin - 10', 'dataMax + 10' ] } />
                            <ChartTooltip content={ <ChartTooltipContent /> } />
                            <Area type="monotone" dataKey="averagePrice" stroke="hsl(var(--primary))" strokeWidth={ 2 } fill="url(#priceGrad)" />
                        </AreaChart>
                    </ChartContainer>
                </div>
            ) }
        </div>
    );
};
