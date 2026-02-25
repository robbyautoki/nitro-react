import { FC } from 'react';
import { GetConfiguration } from '../../../../api';

export const CatalogCurrencyIcon: FC<{ type: number; className?: string }> = ({ type, className = 'w-4 h-4' }) =>
{
    const url = GetConfiguration<string>('currency.asset.icon.url')?.replace('%type%', String(type));
    if(!url) return null;
    return <img src={ url } alt="" className={ className } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
};

export const CatalogCurrencyIconByName: FC<{ name: 'credits' | 'diamonds' | 'duckets' | 'hc'; className?: string }> = ({ name, className = 'w-4 h-4' }) =>
{
    const typeMap: Record<string, number> = { credits: -1, diamonds: 5, duckets: 0 };
    const assetUrl = GetConfiguration<string>('asset.url', 'http://localhost:8080');

    if(name === 'hc')
    {
        return <img src={ `${ assetUrl }/wallet/hc.png` } alt="HC" className={ className } style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
    }

    return <CatalogCurrencyIcon type={ typeMap[name] ?? -1 } className={ className } />;
};
