import { FC, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { CurrencyIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, TrendingUp, TrendingDown, Minus, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

const chartConfig: ChartConfig = {
    averagePrice: {
        label: 'Ø Preis',
        color: 'hsl(var(--primary))',
    },
    soldAmount: {
        label: 'Verkauft',
        color: 'hsl(var(--chart-2))',
    },
};

export const MarketplacePriceChartView: FC<{}> = () =>
{
    const { itemStats, requestItemStats } = useMarketplace();
    const [ furniType, setFurniType ] = useState('1');
    const [ furniIdInput, setFurniIdInput ] = useState('');

    const doSearch = () =>
    {
        const id = parseInt(furniIdInput);
        if(isNaN(id) || id <= 0) return;
        requestItemStats(parseInt(furniType), id);
    };

    const chartData = useMemo(() =>
    {
        if(!itemStats?.history?.length) return [];
        return itemStats.history
            .map(h => ({
                day: `${ h.dayOffset }d`,
                dayOffset: h.dayOffset,
                averagePrice: h.averagePrice,
                soldAmount: h.soldAmount,
            }))
            .sort((a, b) => b.dayOffset - a.dayOffset);
    }, [ itemStats ]);

    const trend = useMemo(() =>
    {
        if(chartData.length < 2) return 0;
        const recent = chartData[chartData.length - 1].averagePrice;
        const older = chartData[0].averagePrice;
        if(older === 0) return 0;
        return ((recent - older) / older) * 100;
    }, [ chartData ]);

    const prices = chartData.map(d => d.averagePrice);
    const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="shrink-0 px-3 pt-2 pb-1.5 border-b border-border/30">
                <div className="flex items-center gap-2">
                    <Select value={ furniType } onValueChange={ setFurniType }>
                        <SelectTrigger className="w-28 h-7 text-[11px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Bodenmöbel</SelectItem>
                            <SelectItem value="2">Wandmöbel</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                        <Input
                            type="number"
                            min={ 1 }
                            placeholder="Möbel-ID eingeben..."
                            value={ furniIdInput }
                            onChange={ e => setFurniIdInput(e.target.value) }
                            onKeyDown={ e => e.key === 'Enter' && doSearch() }
                            className="pl-7 h-7 text-[11px]"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5" onClick={ doSearch }>
                        <Search className="w-3 h-3 mr-1" />Suchen
                    </Button>
                </div>
            </div>

            { !itemStats && (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <BarChart3 className="w-10 h-10 opacity-20 mb-2" />
                    <span className="text-xs">Gib eine Möbel-ID ein um den Preisverlauf zu sehen</span>
                </div>
            ) }

            { itemStats && (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Stats Row */}
                    <div className="shrink-0 flex items-center justify-end gap-4 px-3 py-2 border-b border-border/30">
                        <div className="text-center">
                            <p className="text-[9px] text-muted-foreground">Ø Preis</p>
                            <p className="text-[11px] font-bold tabular-nums flex items-center gap-0.5 justify-center">
                                <CurrencyIcon type="credits" className="w-3 h-3" />{ fmtC(itemStats.averagePrice) }
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
                            <p className="text-[9px] text-muted-foreground">Angebote</p>
                            <p className="text-[11px] font-bold tabular-nums">{ itemStats.offerCount }</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-muted-foreground">Trend</p>
                            <p className={ `text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${ trend >= 0 ? 'text-emerald-500' : 'text-red-500' }` }>
                                { trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> }
                                { trend >= 0 ? '+' : '' }{ trend.toFixed(1) }%
                            </p>
                        </div>
                    </div>

                    {/* Price Chart */}
                    { chartData.length > 0 && (
                        <div className="flex-1 min-h-0 px-2 py-3">
                            <div className="text-[10px] font-medium text-muted-foreground mb-1 px-1">Preisverlauf</div>
                            <ChartContainer config={ chartConfig } className="h-[180px] w-full">
                                <AreaChart data={ chartData } margin={ { top: 4, right: 8, left: 0, bottom: 0 } }>
                                    <defs>
                                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={ 0.2 } />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={ 0 } />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={ 0.3 } />
                                    <XAxis dataKey="day" tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } interval={ 4 } />
                                    <YAxis tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } width={ 40 } domain={ [ 'dataMin - 10', 'dataMax + 10' ] } />
                                    <ChartTooltip content={ <ChartTooltipContent /> } />
                                    <Area type="monotone" dataKey="averagePrice" stroke="hsl(var(--primary))" strokeWidth={ 2 } fill="url(#priceGrad)" />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    ) }

                    {/* Volume Chart */}
                    { chartData.length > 0 && (
                        <div className="shrink-0 px-2 pb-3">
                            <div className="text-[10px] font-medium text-muted-foreground mb-1 px-1">Verkaufsvolumen</div>
                            <ChartContainer config={ chartConfig } className="h-[100px] w-full">
                                <BarChart data={ chartData } margin={ { top: 4, right: 8, left: 0, bottom: 0 } }>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={ 0.3 } />
                                    <XAxis dataKey="day" tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } interval={ 4 } />
                                    <YAxis tick={ { fontSize: 9 } } tickLine={ false } axisLine={ false } width={ 30 } />
                                    <ChartTooltip content={ <ChartTooltipContent /> } />
                                    <Bar dataKey="soldAmount" fill="hsl(var(--chart-2))" radius={ [ 3, 3, 0, 0 ] } opacity={ 0.7 } />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    ) }

                    { chartData.length === 0 && (
                        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                            <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                            <span className="text-xs">Keine Verlaufsdaten vorhanden</span>
                        </div>
                    ) }
                </div>
            ) }
        </div>
    );
};
