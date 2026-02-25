import { FC } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomListing, CustomOffer } from './CustomMarketplaceTypes';
import { ItemInfoTooltip } from './ItemInfoTooltip';
import { CurrencyIcon, ItemIcon, PriceDelta } from './marketplace-components';
import { fmtC, timeLeft, timeAgo, parseLtd, CURRENCY_LABELS } from './marketplace-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/reui-badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Star,
    Gavel,
    User,
    Clock,
    MessageSquare,
    X,
    Check,
    Hash,
    Shield,
} from 'lucide-react';

interface Props
{
    listing: CustomListing;
    mode: 'browse' | 'own' | 'sold';
    isMine?: boolean;
    isWatched?: boolean;
    onToggleWatch?: () => void;
    onBuy?: () => void;
    onCancel?: () => void;
    onOffer?: () => void;
    onEdit?: () => void;
}

interface OfferRowProps
{
    offer: CustomOffer;
    onAccept?: () => void;
    onReject?: () => void;
    isProcessing?: boolean;
}

function getDisplayName(listing: CustomListing): string
{
    const mainItem = listing.items[0];
    if(!mainItem) return 'Unknown';
    if(listing.is_bundle) return `Bundle (${ listing.items.length } Items)`;
    const sessionData = GetSessionDataManager();
    const baseName = mainItem.item_name?.split('*')[0];
    if(!baseName) return mainItem.public_name;
    const furniData = sessionData.getFloorItemDataByName(baseName) ?? sessionData.getWallItemDataByName(baseName);
    if(furniData?.name && furniData.name !== baseName && !furniData.name.endsWith('_name')) return furniData.name;
    return mainItem.public_name;
}

export const CustomListingCard: FC<Props> = ({ listing, mode, isMine, isWatched, onToggleWatch, onBuy, onCancel, onOffer, onEdit }) =>
{
    const mainItem = listing.items[0];
    const ltd = mainItem ? parseLtd(mainItem.limited_data) : null;
    const seal = mainItem?.seal;
    const rarity = mainItem?.rarity;
    const rarityDisplay = seal?.rarity_display ?? rarity?.rarity_display ?? null;
    const rarityColor = seal?.color ?? rarity?.color ?? null;
    const displayName = getDisplayName(listing);
    const avgPrice = mainItem?.in_circulation ?? 0;

    return (
        <div className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30 transition-colors">
            {/* Watchlist Star (browse only) */}
            { mode === 'browse' && onToggleWatch && (
                <button onClick={ onToggleWatch } className="shrink-0">
                    <Star className={ `w-3.5 h-3.5 transition-colors ${ isWatched ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20 hover:text-amber-300' }` } />
                </button>
            ) }

            {/* Item Icon */}
            <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center relative">
                <ItemIcon itemName={ mainItem?.item_name ?? '' } className="w-7 h-7" />
                { ltd && (
                    <div className="absolute -top-1 -right-1 px-0.5 py-[1px] bg-amber-500/90 text-white text-[7px] font-bold leading-none rounded-sm">
                        { ltd.num }
                    </div>
                ) }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate flex items-center gap-1.5">
                    <span>{ displayName }</span>
                    { ltd && (
                        <Badge variant="outline" size="xs" className="text-[8px] text-amber-500 border-amber-500/30 bg-amber-500/10">
                            <Hash className="w-2 h-2 mr-0.5" />LTD
                        </Badge>
                    ) }
                    { !ltd && rarityDisplay && (
                        <span
                            className="inline-flex items-center px-1 rounded text-[8px] font-bold border"
                            style={ { backgroundColor: (rarityColor ?? '#888') + '15', color: rarityColor ?? '#a78bfa', borderColor: (rarityColor ?? '#888') + '30' } }
                        >
                            { rarityDisplay }
                        </span>
                    ) }
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    { mode === 'browse' && listing.seller && (
                        <span className="text-[9px] text-muted-foreground/50">{ listing.seller.username }</span>
                    ) }
                    { mode === 'sold' && listing.buyer && (
                        <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" />{ listing.buyer }
                        </span>
                    ) }
                    { (mode === 'browse' || mode === 'own') && (
                        <>
                            <span className="text-[8px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />{ timeLeft(listing.expires_at) }
                            </span>
                        </>
                    ) }
                    { mode === 'sold' && listing.sold_at && (
                        <>
                            <span className="text-[8px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/40">{ timeAgo(listing.sold_at) }</span>
                        </>
                    ) }
                    { listing.note && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-muted-foreground/30 cursor-help"><MessageSquare className="w-2.5 h-2.5" /></span>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p className="text-xs italic">"{ listing.note }"</p></TooltipContent>
                        </Tooltip>
                    ) }
                    { mode === 'browse' && listing.offer_count != null && listing.offer_count > 0 && (
                        <>
                            <span className="text-[8px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-blue-500/60">{ listing.offer_count } Gebote</span>
                        </>
                    ) }
                </div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0 mr-1">
                <div className="flex items-center gap-1 justify-end">
                    <CurrencyIcon type={ listing.currency } className="w-3.5 h-3.5" />
                    <span className={ `text-[12px] font-bold tabular-nums ${ mode === 'sold' ? 'text-emerald-500' : 'text-amber-500' }` }>
                        { mode === 'sold' ? '+' : '' }{ fmtC(listing.price) }
                    </span>
                </div>
                <div className="text-[8px] text-muted-foreground/40">{ CURRENCY_LABELS[listing.currency] ?? listing.currency }</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <ItemInfoTooltip listing={ listing } />
                { mode === 'browse' && isMine && (
                    <Badge variant="outline" size="xs" className="text-muted-foreground/40">Eigenes</Badge>
                ) }
                { mode === 'browse' && !isMine && onOffer && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={ onOffer }>
                                <Gavel className="w-3 h-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Gebot abgeben</TooltipContent>
                    </Tooltip>
                ) }
                { mode === 'browse' && !isMine && onBuy && (
                    <Button size="sm" className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={ onBuy }>
                        Kaufen
                    </Button>
                ) }
                { mode === 'own' && onEdit && (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] px-1.5" onClick={ onEdit }>
                        Bearbeiten
                    </Button>
                ) }
                { mode === 'own' && listing.status === 'active' && onCancel && (
                    <Button variant="outline" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={ onCancel }>
                        <X className="w-3 h-3" />
                    </Button>
                ) }
            </div>
        </div>
    );
};

export const OfferRow: FC<OfferRowProps> = ({ offer, onAccept, onReject, isProcessing }) =>
{
    const mainItem = offer.items[0];

    return (
        <div className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30 transition-colors">
            <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center">
                <ItemIcon itemName={ mainItem?.item_name ?? '' } className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">
                    { offer.items.length > 1 ? `Bundle (${ offer.items.length } Items)` : mainItem?.public_name ?? 'Unknown' }
                </div>
                <div className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                    <User className="w-2.5 h-2.5" />{ offer.buyer?.username ?? 'Unbekannt' } · { timeAgo(offer.created_at) }
                </div>
            </div>
            <div className="text-right mr-1 shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] text-muted-foreground/40 line-through tabular-nums">{ fmtC(offer.listing_price) }</span>
                    <CurrencyIcon type={ offer.currency } className="w-3 h-3" />
                    <span className="text-[12px] font-bold text-amber-500 tabular-nums">{ fmtC(offer.offer_price) }</span>
                </div>
                <PriceDelta price={ offer.offer_price } avg={ offer.listing_price } />
            </div>
            <div className="flex items-center gap-1 shrink-0">
                { onAccept && (
                    <Button size="sm" className="h-6 text-[9px] px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={ onAccept } disabled={ isProcessing }>
                        <Check className="w-2.5 h-2.5 mr-0.5" />OK
                    </Button>
                ) }
                { onReject && (
                    <Button variant="outline" size="icon" className="h-6 w-6 text-red-400" onClick={ onReject } disabled={ isProcessing }>
                        <X className="w-3 h-3" />
                    </Button>
                ) }
            </div>
        </div>
    );
};
