import { FC, useState } from 'react';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { CURRENCY_ICONS, getFurniIcon } from './marketplace-utils';

export const CurrencyIcon: FC<{ type: string; className?: string }> = ({ type, className }) =>
{
    const icons = CURRENCY_ICONS();
    const src = (icons as Record<string, string>)[type] ?? icons.credits;
    return <img src={ src } alt={ type } className={ className || 'w-4 h-4' } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
};

export const ItemIcon: FC<{ itemName: string; className?: string }> = ({ itemName, className }) =>
{
    const [ err, setErr ] = useState(false);
    if(err) return <div className={ `flex items-center justify-center bg-muted/20 ${ className || 'w-full h-full' }` }><Package className="w-3.5 h-3.5 text-muted-foreground/30" /></div>;
    return <img src={ getFurniIcon(itemName) } alt={ itemName } className={ `object-contain ${ className || 'w-full h-full' }` } style={ { imageRendering: 'pixelated' } } loading="lazy" onError={ () => setErr(true) } />;
};

export const PriceDelta: FC<{ price: number; avg: number }> = ({ price, avg }) =>
{
    if(avg <= 0) return null;
    const pct = ((price - avg) / avg) * 100;
    if(Math.abs(pct) < 1) return <span className="text-[9px] text-muted-foreground/50 tabular-nums">~Ø</span>;
    const isUp = pct > 0;
    return (
        <span className={ `text-[9px] tabular-nums font-medium flex items-center gap-0.5 ${ isUp ? 'text-red-500' : 'text-emerald-500' }` }>
            { isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" /> }
            { isUp ? '+' : '' }{ pct.toFixed(1) }%
        </span>
    );
};
