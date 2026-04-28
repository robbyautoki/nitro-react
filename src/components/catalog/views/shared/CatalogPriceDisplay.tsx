import { FC } from 'react';
import { Gift } from 'lucide-react';
import { CatalogCurrencyIcon } from './CatalogCurrencyIcon';

interface CatalogPriceDisplayProps
{
    credits: number;
    points: number;
    pointsType?: number;
    isFree?: boolean;
    size?: 'sm' | 'lg' | 'xl';
}

export const CatalogPriceDisplay: FC<CatalogPriceDisplayProps> = ({ credits, points, pointsType = 5, isFree, size = 'lg' }) =>
{
    const cls = size === 'xl' ? 'text-title-h5' : size === 'lg' ? 'text-title-h6' : 'text-label-sm';
    const iconCls = size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    const labelCls = size === 'xl' ? 'text-paragraph-sm text-text-sub-600' : 'text-paragraph-xs text-text-sub-600';
    const showLabel = size === 'xl';

    if(isFree || (credits === 0 && points === 0))
    {
        const giftCls = size === 'xl' ? 'w-5 h-5' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
        return (
            <div className="flex items-center gap-1.5 text-success-base">
                <Gift className={ giftCls } />
                <span className={ cls }>Gratis</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2.5">
            { credits > 0 && (
                <div className="flex items-baseline gap-1.5">
                    <CatalogCurrencyIcon type={ -1 } className={ `${ iconCls } self-center` } />
                    <span className={ `${ cls } tabular-nums text-warning-base` }>{ credits.toLocaleString('de-DE') }</span>
                    { showLabel && <span className={ labelCls }>Credits</span> }
                </div>
            ) }
            { credits > 0 && points > 0 && <span className="text-text-soft-400 text-paragraph-xs">+</span> }
            { points > 0 && (
                <div className="flex items-baseline gap-1.5">
                    <CatalogCurrencyIcon type={ pointsType } className={ `${ iconCls } self-center` } />
                    <span className={ `${ cls } tabular-nums text-information-base` }>{ points.toLocaleString('de-DE') }</span>
                    { showLabel && <span className={ labelCls }>Diamanten</span> }
                </div>
            ) }
        </div>
    );
};
