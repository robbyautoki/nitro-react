import { FC, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { Search, TrendingUp, TrendingDown, Minus, Coins, BarChart3 } from 'lucide-react';

const priceChartConfig: ChartConfig = {
    averagePrice: {
        label: 'Avg Price',
        color: 'rgb(52, 211, 153)',
    },
    soldAmount: {
        label: 'Sold',
        color: 'rgb(96, 165, 250)',
    },
};

export const MarketplacePriceChartView: FC<{}> = () =>
{
    const { itemStats, requestItemStats } = useMarketplace();
    const [ furniType, setFurniType ] = useState(1); // 1=floor, 2=wall
    const [ furniIdInput, setFurniIdInput ] = useState('');

    const doSearch = () =>
    {
        const id = parseInt(furniIdInput);
        if(isNaN(id) || id <= 0) return;
        requestItemStats(furniType, id);
    };

    const chartData = useMemo(() =>
    {
        if(!itemStats?.history?.length) return [];
        return itemStats.history
            .map(h => ({
                day: `${ h.dayOffset }d ago`,
                dayOffset: h.dayOffset,
                averagePrice: h.averagePrice,
                soldAmount: h.soldAmount,
            }))
            .sort((a, b) => b.dayOffset - a.dayOffset); // oldest first
    }, [ itemStats ]);

    const trend = useMemo(() =>
    {
        if(chartData.length < 2) return 0;
        const recent = chartData[chartData.length - 1].averagePrice;
        const older = chartData[0].averagePrice;
        if(older === 0) return 0;
        return ((recent - older) / older) * 100;
    }, [ chartData ]);

    return (
        <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex flex-col gap-2">
                <span className="text-[11px] text-white/40">Look up price history for a furniture item</span>
                <div className="flex items-center gap-2">
                    <select
                        className="h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none"
                        value={ furniType }
                        onChange={ e => setFurniType(parseInt(e.target.value)) }
                    >
                        <option value={ 1 } className="bg-zinc-900">Floor Item</option>
                        <option value={ 2 } className="bg-zinc-900">Wall Item</option>
                    </select>
                    <input
                        className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                        type="number"
                        min={ 1 }
                        placeholder="Furniture ID"
                        value={ furniIdInput }
                        onChange={ e => setFurniIdInput(e.target.value) }
                        onKeyDown={ e => e.key === 'Enter' && doSearch() }
                    />
                    <button
                        className="h-7 px-3 rounded-lg bg-white/[0.1] text-white/80 text-[11px] font-medium hover:bg-white/[0.15] transition-all flex items-center gap-1"
                        onClick={ doSearch }
                    >
                        <Search className="size-3" />
                        Lookup
                    </button>
                </div>
            </div>

            { !itemStats && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <BarChart3 className="size-10 mb-2" />
                    <span className="text-xs">Enter a furniture ID to see price history</span>
                </div>
            ) }

            { itemStats && (
                <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <Coins className="size-4 text-amber-400/60 mb-1" />
                            <span className="text-sm font-semibold text-white/90">{ itemStats.averagePrice.toLocaleString() }</span>
                            <span className="text-[10px] text-white/30">Avg Price</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-sm font-semibold text-white/90">{ itemStats.offerCount }</span>
                            <span className="text-[10px] text-white/30 mt-1">Active Offers</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            { trend > 0 && <TrendingUp className="size-4 text-emerald-400/60 mb-1" /> }
                            { trend < 0 && <TrendingDown className="size-4 text-red-400/60 mb-1" /> }
                            { trend === 0 && <Minus className="size-4 text-white/30 mb-1" /> }
                            <span className={ `text-sm font-semibold ${ trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-white/50' }` }>
                                { trend > 0 ? '+' : '' }{ trend.toFixed(1) }%
                            </span>
                            <span className="text-[10px] text-white/30">Trend</span>
                        </div>
                    </div>

                    {/* Price Chart */}
                    { chartData.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-medium text-white/50">Price History</span>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                                <ChartContainer config={ priceChartConfig } className="h-[200px] w-full">
                                    <AreaChart data={ chartData } margin={ { top: 5, right: 5, left: 0, bottom: 0 } }>
                                        <defs>
                                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="rgb(52, 211, 153)" stopOpacity={ 0.3 } />
                                                <stop offset="95%" stopColor="rgb(52, 211, 153)" stopOpacity={ 0 } />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="day" tick={ { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } } />
                                        <YAxis tick={ { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } } width={ 50 } />
                                        <ChartTooltip content={ <ChartTooltipContent /> } />
                                        <Area
                                            type="monotone"
                                            dataKey="averagePrice"
                                            stroke="rgb(52, 211, 153)"
                                            strokeWidth={ 2 }
                                            fill="url(#priceGradient)"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </div>
                        </div>
                    ) }

                    {/* Volume Chart */}
                    { chartData.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-medium text-white/50">Sales Volume</span>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                                <ChartContainer config={ priceChartConfig } className="h-[120px] w-full">
                                    <BarChart data={ chartData } margin={ { top: 5, right: 5, left: 0, bottom: 0 } }>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="day" tick={ { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } } />
                                        <YAxis tick={ { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } } width={ 30 } />
                                        <ChartTooltip content={ <ChartTooltipContent /> } />
                                        <Bar dataKey="soldAmount" fill="rgb(96, 165, 250)" radius={ [ 3, 3, 0, 0 ] } opacity={ 0.7 } />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </div>
                    ) }
                </>
            ) }
        </div>
    );
};
