import { FC } from 'react';
import { GetConfiguration } from '../../api';
import { CustomListing } from './CustomMarketplaceTypes';
import { ItemInfoTooltip } from './ItemInfoTooltip';
import { Coins, Clock, MessageSquare, Package, User } from 'lucide-react';

const CURRENCY_COLORS: Record<string, string> = {
    credits: 'text-amber-400/80',
    pixels: 'text-purple-400/80',
    points: 'text-emerald-400/80',
};

const CURRENCY_LABELS: Record<string, string> = {
    credits: 'Credits',
    pixels: 'Pixel',
    points: 'Punkte',
};

function getFurniIcon(itemName: string)
{
    const baseUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
    return `${ baseUrl }${ itemName.split('*')[0] }_icon.png`;
}

function timeLeft(expiresAt: string): string
{
    const diff = new Date(expiresAt).getTime() - Date.now();
    if(diff <= 0) return 'Abgelaufen';
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if(days > 0) return `${ days }T ${ hours % 24 }h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${ hours }h ${ mins }m` : `${ mins }m`;
}

function parseLtd(limitedData?: string): { num: number; total: number } | null
{
    if(!limitedData || limitedData === '0:0') return null;
    const parts = limitedData.split(':');
    if(parts.length !== 2) return null;
    const total = parseInt(parts[0]);
    const num = parseInt(parts[1]);
    return (num > 0 && total > 0) ? { num, total } : null;
}

interface Props
{
    listing: CustomListing;
    mode: 'browse' | 'own' | 'sold';
    isMine?: boolean;
    onBuy?: () => void;
    onCancel?: () => void;
    onOffer?: () => void;
}

export const CustomListingCard: FC<Props> = ({ listing, mode, isMine, onBuy, onCancel, onOffer }) =>
{
    const mainItem = listing.items[0];
    const ltd = mainItem ? parseLtd(mainItem.limited_data) : null;
    const seal = mainItem?.seal;
    const rarity = mainItem?.rarity;
    const rarityDisplay = seal?.rarity_display ?? rarity?.rarity_display ?? null;
    const rarityColor = seal?.color ?? rarity?.color ?? null;
    const currColor = CURRENCY_COLORS[listing.currency] || 'text-white/60';

    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group">
            {/* Item Image */}
            <div className="relative w-11 h-11 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                { mainItem ? (
                    <img
                        src={ getFurniIcon(mainItem.item_name) }
                        alt={ mainItem.public_name }
                        className="max-w-full max-h-full object-contain"
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                ) : (
                    <Package className="size-4 text-white/20" />
                ) }
                { ltd && (
                    <div className="absolute -top-1 -right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500/90 text-black leading-none">
                        { ltd.num }/{ ltd.total }
                    </div>
                ) }
                { rarityDisplay && (
                    <div
                        className="absolute -bottom-1 -left-1 px-1 py-0.5 rounded text-[7px] font-bold leading-none text-white"
                        style={ { backgroundColor: rarityColor ?? '#888' } }
                    >
                        { rarityDisplay }
                    </div>
                ) }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">
                    { listing.is_bundle
                        ? `Bundle (${ listing.items.length } Items)`
                        : mainItem?.public_name ?? 'Unknown'
                    }
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className={ `flex items-center gap-1 text-[11px] ${ currColor }` }>
                        <Coins className="size-3" />
                        { listing.price.toLocaleString() } { CURRENCY_LABELS[listing.currency] ?? listing.currency }
                    </span>
                    { mode === 'browse' && listing.seller && (
                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <User className="size-3" />
                            { listing.seller.username }
                        </span>
                    ) }
                    { mode === 'sold' && listing.buyer && (
                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <User className="size-3" />
                            { listing.buyer }
                        </span>
                    ) }
                    { mode !== 'sold' && (
                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <Clock className="size-3" />
                            { timeLeft(listing.expires_at) }
                        </span>
                    ) }
                    { mode === 'sold' && listing.sold_at && (
                        <span className="text-[11px] text-white/30">
                            { new Date(listing.sold_at).toLocaleDateString('de-DE') }
                        </span>
                    ) }
                    { listing.note && (
                        <span className="flex items-center gap-1 text-[11px] text-white/30" title={ listing.note }>
                            <MessageSquare className="size-3" />
                        </span>
                    ) }
                    { mode === 'browse' && listing.offer_count != null && listing.offer_count > 0 && (
                        <span className="text-[11px] text-blue-400/60">
                            { listing.offer_count } Anfrage{ listing.offer_count !== 1 ? 'n' : '' }
                        </span>
                    ) }
                </div>
                { listing.note && mode === 'browse' && (
                    <div className="text-[10px] text-white/25 mt-0.5 truncate italic">{ listing.note }</div>
                ) }
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
                <ItemInfoTooltip listing={ listing } />
                { mode === 'browse' && isMine && (
                    <span className="h-7 px-2.5 rounded-lg bg-white/[0.06] text-white/30 text-[11px] font-medium flex items-center">
                        Dein Angebot
                    </span>
                ) }
                { mode === 'browse' && !isMine && onOffer && (
                    <button
                        className="h-7 px-2.5 rounded-lg bg-blue-500/20 text-blue-400 text-[11px] font-medium hover:bg-blue-500/30 transition-all"
                        onClick={ onOffer }
                    >
                        Anfrage
                    </button>
                ) }
                { mode === 'browse' && !isMine && onBuy && (
                    <button
                        className="h-7 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-all"
                        onClick={ onBuy }
                    >
                        Kaufen
                    </button>
                ) }
                { mode === 'own' && listing.status === 'active' && onCancel && (
                    <button
                        className="h-7 px-3 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/30 transition-all"
                        onClick={ onCancel }
                    >
                        Abbrechen
                    </button>
                ) }
            </div>
        </div>
    );
};
