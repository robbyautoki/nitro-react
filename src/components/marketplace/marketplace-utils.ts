import { GetConfiguration } from '../../api';

export function getImageUrl()
{
    return GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
}

export function getAssetsUrl()
{
    return GetConfiguration<string>('assets.url', 'http://localhost:8080');
}

export function getFurniIcon(itemName: string)
{
    return `${ getImageUrl() }${ itemName.split('*')[0] }_icon.png`;
}

export const CURRENCY_ICONS = () => ({
    credits: `${ getAssetsUrl() }/wallet/-1.png`,
    duckets: `${ getAssetsUrl() }/wallet/0.png`,
    diamonds: `${ getAssetsUrl() }/wallet/5.png`,
    hc: `${ getAssetsUrl() }/wallet/hc.png`,
});

export const CURRENCY_LABELS: Record<string, string> = {
    credits: 'Credits',
    pixels: 'Pixel',
    points: 'Punkte',
};

export function timeAgo(dateStr: string): string
{
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if(min < 1) return 'gerade eben';
    if(min < 60) return `${ min } Min.`;
    const h = Math.floor(min / 60);
    if(h < 24) return `${ h } Std.`;
    return `${ Math.floor(h / 24) }d`;
}

export function timeLeft(expiresAt: string): string
{
    const diff = new Date(expiresAt).getTime() - Date.now();
    if(diff <= 0) return 'Abgelaufen';
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if(days > 0) return `${ days }T ${ hours % 24 }h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${ hours }h ${ mins }m` : `${ mins }m`;
}

export function fmtC(n: number): string
{
    return n.toLocaleString('de-DE');
}

export function parseLtd(limitedData?: string): { num: number; total: number } | null
{
    if(!limitedData || limitedData === '0:0') return null;
    const parts = limitedData.split(':');
    if(parts.length !== 2) return null;
    const total = parseInt(parts[0]);
    const num = parseInt(parts[1]);
    return (num > 0 && total > 0) ? { num, total } : null;
}
