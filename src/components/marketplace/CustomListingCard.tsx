import { FC } from 'react';
import { GetConfiguration, GetSessionDataManager } from '../../api';
import { CustomListing } from './CustomMarketplaceTypes';
import { ItemInfoTooltip } from './ItemInfoTooltip';
import { Coins, Clock, MessageSquare, Package, User, Hash, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

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

    const displayName = (() =>
    {
        if(!mainItem) return 'Unknown';
        const sessionData = GetSessionDataManager();
        const baseName = mainItem.item_name?.split('*')[0];
        if(!baseName) return mainItem.public_name;
        const furniData = sessionData.getFloorItemDataByName(baseName) ?? sessionData.getWallItemDataByName(baseName);
        if(furniData?.name && furniData.name !== baseName && !furniData.name.endsWith('_name')) return furniData.name;
        return mainItem.public_name;
    })();

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
            {/* Item Image */}
            <div className="relative w-10 h-10 shrink-0 bg-white/[0.02] border border-white/[0.05] rounded overflow-hidden flex items-center justify-center">
                { mainItem ? (
                    <img
                        src={ getFurniIcon(mainItem.item_name) }
                        alt={ mainItem.public_name }
                        className="w-8 h-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                ) : (
                    <Package className="size-4 text-white/10" />
                ) }
                { ltd && (
                    <div className="absolute top-0 right-0 px-0.5 py-[1px] bg-amber-500/90 text-black text-[8px] font-bold leading-none z-10">
                        { ltd.num }
                    </div>
                ) }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white/90 truncate uppercase tracking-wide flex items-center gap-2">
                    <span>
                        { listing.is_bundle
                            ? `Bundle (${ listing.items.length } Items)`
                            : displayName
                        }
                    </span>
                    { ltd && (
                        <span className="inline-flex items-center px-1 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            # LIMITED
                        </span>
                    ) }
                    { !ltd && rarityDisplay && (
                        <span
                            className="inline-flex items-center px-1 rounded text-[9px] font-bold border"
                            style={ { backgroundColor: (rarityColor ?? '#888') + '15', color: rarityColor ?? '#a78bfa', borderColor: (rarityColor ?? '#888') + '30' } }
                        >
                            { rarityDisplay }
                        </span>
                    ) }
                </div>
                
                <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[10px] font-mono text-white/40">
                    { mode === 'browse' && listing.seller && (
                        <span className="flex items-center gap-1">
                            <User className="size-2.5" />
                            { listing.seller.username.toUpperCase() }
                        </span>
                    ) }
                    { mode === 'sold' && listing.buyer && (
                        <span className="flex items-center gap-1">
                            <User className="size-2.5" />
                            { listing.buyer.toUpperCase() }
                        </span>
                    ) }
                    { mode !== 'sold' && (
                        <span className="flex items-center gap-1">
                            <Clock className="size-2.5" />
                            { timeLeft(listing.expires_at) }
                        </span>
                    ) }
                    { mode === 'sold' && listing.sold_at && (
                        <span>
                            { new Date(listing.sold_at).toLocaleDateString('de-DE') }
                        </span>
                    ) }
                    { listing.note && (
                        <span className="flex items-center gap-1 text-white/30" title={ listing.note }>
                            <MessageSquare className="size-2.5" />
                        </span>
                    ) }
                </div>
                
                { listing.note && mode === 'browse' && (
                    <div className="text-[9px] text-white/20 mt-0.5 truncate italic">"{ listing.note }"</div>
                ) }
            </div>

            {/* Stats Data */}
            <div className="flex flex-col items-end shrink-0 w-24">
                { mainItem?.in_circulation != null && mainItem.in_circulation > 0 && (
                    <div className="text-[10px] font-mono text-white/40">
                        VOL: { mainItem.in_circulation.toLocaleString() }
                    </div>
                ) }
                { mode === 'browse' && listing.offer_count != null && listing.offer_count > 0 && (
                    <div className="text-[10px] font-mono text-blue-400/60 mt-0.5">
                        BIDS: { listing.offer_count }
                    </div>
                ) }
            </div>

            {/* Price Data */}
            <div className="flex flex-col items-end shrink-0 w-28 pr-4">
                <div className={ cn("text-[14px] font-bold font-mono tabular-nums leading-none", currColor.replace('/80', '')) }>
                    { listing.price.toLocaleString() }
                </div>
                <div className="text-[9px] font-bold font-mono text-white/30 uppercase mt-1">
                    { CURRENCY_LABELS[listing.currency] ?? listing.currency }
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center shrink-0">
                <ItemInfoTooltip listing={ listing } />
                { mode === 'browse' && isMine && (
                    <span className="h-8 px-4 border border-white/5 rounded bg-white/[0.02] text-white/20 text-[10px] font-bold uppercase tracking-wider flex items-center ml-2">
                        OWNED
                    </span>
                ) }
                { mode === 'browse' && !isMine && onOffer && (
                    <button
                        className="h-8 px-3 ml-2 border border-blue-500/30 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
                        onClick={ onOffer }
                    >
                        BID
                    </button>
                ) }
                { mode === 'browse' && !isMine && onBuy && (
                    <button
                        className="h-8 px-4 ml-2 border border-emerald-500/30 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-colors"
                        onClick={ onBuy }
                    >
                        BUY
                    </button>
                ) }
                { mode === 'own' && listing.status === 'active' && onCancel && (
                    <button
                        className="h-8 px-4 ml-2 border border-red-500/30 rounded bg-red-500/10 text-red-400 text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                        onClick={ onCancel }
                    >
                        CANCEL
                    </button>
                ) }
            </div>
        </div>
    );
};
