import { FC } from 'react';
import { Gift } from 'lucide-react';
import { CatalogCurrencyIcon } from './CatalogCurrencyIcon';

interface CatalogPriceDisplayProps
{
    credits: number;
    points: number;
    pointsType?: number;
    isFree?: boolean;
    size?: 'sm' | 'lg';
}

export const CatalogPriceDisplay: FC<CatalogPriceDisplayProps> = ({ credits, points, pointsType = 5, isFree, size = 'lg' }) =>
{
    const cls = size === 'lg' ? 'text-lg font-black' : 'text-sm font-bold';
    const iconCls = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    if(isFree || (credits === 0 && points === 0))
    {
        return (
            <div className="flex items-center gap-1.5 text-emerald-500">
                <Gift className={ size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5' } />
                <span className={ cls }>Gratis</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2.5">
            { credits > 0 && (
                <div className="flex items-center gap-1.5">
                    <CatalogCurrencyIcon type={ -1 } className={ iconCls } />
                    <span className={ `${ cls } tabular-nums text-amber-500` }>{ credits.toLocaleString('de-DE') }</span>
                    { size === 'lg' && <span className="text-xs font-medium opacity-70">Credits</span> }
                </div>
            ) }
            { credits > 0 && points > 0 && <span className="text-muted-foreground text-xs">+</span> }
            { points > 0 && (
                <div className="flex items-center gap-1.5">
                    <CatalogCurrencyIcon type={ pointsType } className={ iconCls } />
                    <span className={ `${ cls } tabular-nums text-teal-500` }>{ points.toLocaleString('de-DE') }</span>
                    { size === 'lg' && <span className="text-xs font-medium opacity-70">Diamanten</span> }
                </div>
            ) }
        </div>
    );
};
