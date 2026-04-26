import { ComponentProps, FC } from 'react';
import { GetSessionDataManager } from '../../api';
import { CustomListing, CustomOffer } from './CustomMarketplaceTypes';
import { ItemInfoTooltip } from './ItemInfoTooltip';
import { CurrencyIcon, ItemIcon, PriceDelta } from './marketplace-components';
import { fmtC, timeLeft, timeAgo, parseLtd, CURRENCY_LABELS } from './marketplace-utils';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import {
    Star,
    Gavel,
    User,
    Clock,
    MessageSquare,
    X,
    Check,
    Hash,
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

function rarityBadgeColor(rarityName?: string | null): ComponentProps<typeof AlignBadge.Root>['color']
{
    if(rarityName === 'weekly_rare') return 'green';
    if(rarityName === 'monthly_rare') return 'purple';
    if(rarityName === 'cashshop_rare') return 'orange';
    if(rarityName === 'drachen_rare') return 'red';
    if(rarityName === 'bonzen_rare') return 'blue';
    return 'yellow';
}

export const CustomListingCard: FC<Props> = ({ listing, mode, isMine, isWatched, onToggleWatch, onBuy, onCancel, onOffer, onEdit }) =>
{
    const mainItem = listing.items[0];
    const ltd = mainItem ? parseLtd(mainItem.limited_data) : null;
    const seal = mainItem?.seal;
    const rarity = mainItem?.rarity;
    const rarityDisplay = seal?.rarity_display ?? rarity?.rarity_display ?? null;
    const displayName = getDisplayName(listing);
    const avgPrice = mainItem?.in_circulation ?? 0;

    return (
        <div className="flex items-center gap-2.5 rounded-xl bg-bg-white-0 px-2.5 py-2 transition-colors hover:bg-bg-weak-50">
            { /* Watchlist Star (browse only) */ }
            { mode === 'browse' && onToggleWatch && (
                <button onClick={ onToggleWatch } className="shrink-0">
                    <Star className={ `w-3.5 h-3.5 transition-colors ${ isWatched ? 'fill-warning-base text-warning-base' : 'text-text-soft-400 hover:text-warning-base' }` } />
                </button>
            ) }
            { /* Item Icon(s) */ }
            { listing.is_bundle && listing.items.length > 1 ? (
                <div className="flex items-center gap-0.5 shrink-0">
                    { listing.items.slice(0, 6).map((item, i) => (
                        <div key={ i } className="flex size-10 items-center justify-center rounded-lg bg-bg-weak-50">
                            <ItemIcon itemName={ item.item_name ?? '' } className="size-8" />
                        </div>
                    )) }
                    { listing.items.length > 6 && (
                        <span className="ml-0.5 text-subheading-2xs text-text-sub-600">+{ listing.items.length - 6 }</span>
                    ) }
                </div>
            ) : (
                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50">
                    <ItemIcon itemName={ mainItem?.item_name ?? '' } className="size-8" />
                    { ltd && (
                        <div className="absolute -right-1 -top-1 rounded-md bg-warning-base px-1 py-0.5 text-subheading-2xs leading-none text-static-white">
                            { ltd.num }
                        </div>
                    ) }
                </div>
            ) }
            { /* Info */ }
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate text-label-sm text-text-strong-950">
                    <span>{ displayName }</span>
                    { ltd && (
                        <AlignBadge.Root color="yellow" variant="lighter" size="small" square>
                            <Hash className="w-2 h-2 mr-0.5" />LTD
                        </AlignBadge.Root>
                    ) }
                    { !ltd && rarityDisplay && (
                        <AlignBadge.Root color={ rarityBadgeColor(seal?.rarity_name ?? rarity?.rarity_name) } variant="lighter" size="small" square>
                            { rarityDisplay }
                        </AlignBadge.Root>
                    ) }
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-paragraph-xs">
                    { mode === 'browse' && listing.seller && (
                        <span className="text-text-sub-600">{ listing.seller.username }</span>
                    ) }
                    { mode === 'sold' && listing.buyer && (
                        <span className="flex items-center gap-0.5 text-text-sub-600">
                            <User className="w-2.5 h-2.5" />{ listing.buyer }
                        </span>
                    ) }
                    { (mode === 'browse' || mode === 'own') && (
                        <>
                            <span className="text-text-soft-400">·</span>
                            <span className="flex items-center gap-0.5 text-text-soft-400">
                                <Clock className="w-2.5 h-2.5" />{ timeLeft(listing.expires_at) }
                            </span>
                        </>
                    ) }
                    { mode === 'sold' && listing.sold_at && (
                        <>
                            <span className="text-text-soft-400">·</span>
                            <span className="text-text-soft-400">{ timeAgo(listing.sold_at) }</span>
                        </>
                    ) }
                    { listing.note && (
                        <AlignTooltip.Root>
                            <AlignTooltip.Trigger asChild>
                                <span className="cursor-help text-text-soft-400"><MessageSquare className="w-2.5 h-2.5" /></span>
                            </AlignTooltip.Trigger>
                            <AlignTooltip.Content side="top"><p className="text-paragraph-xs italic">&quot;{ listing.note }&quot;</p></AlignTooltip.Content>
                        </AlignTooltip.Root>
                    ) }
                    { mode === 'browse' && listing.offer_count != null && listing.offer_count > 0 && (
                        <>
                            <span className="text-text-soft-400">·</span>
                            <span className="text-information-base">{ listing.offer_count } Gebote</span>
                        </>
                    ) }
                </div>
            </div>
            { /* Price */ }
            <div className="text-right shrink-0 mr-1">
                <div className="flex items-center gap-1 justify-end">
                    <CurrencyIcon type={ listing.currency } className="w-3.5 h-3.5" />
                    <span className={ `text-label-sm tabular-nums ${ mode === 'sold' ? 'text-success-base' : 'text-warning-base' }` }>
                        { mode === 'sold' ? '+' : '' }{ fmtC(listing.price) }
                    </span>
                </div>
                <div className="text-subheading-2xs text-text-soft-400">{ CURRENCY_LABELS[listing.currency] ?? listing.currency }</div>
            </div>
            { /* Actions */ }
            <div className="flex items-center gap-1 shrink-0">
                { mode === 'browse' && <ItemInfoTooltip listing={ listing } /> }
                { mode === 'browse' && isMine && (
                    <AlignBadge.Root color="gray" variant="lighter" size="small" square>Eigenes</AlignBadge.Root>
                ) }
                { mode === 'browse' && !isMine && onOffer && (
                    <AlignTooltip.Root>
                        <AlignTooltip.Trigger asChild>
                            <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-6 w-6 px-0" onClick={ onOffer }>
                                <Gavel className="w-3 h-3" />
                            </AlignButton.Root>
                        </AlignTooltip.Trigger>
                        <AlignTooltip.Content side="top">Gebot abgeben</AlignTooltip.Content>
                    </AlignTooltip.Root>
                ) }
                { mode === 'browse' && !isMine && onBuy && (
                    <FancyButton.Root variant="primary" size="xsmall" className="h-7 px-3 text-label-xs" onClick={ onBuy }>
                        Kaufen
                    </FancyButton.Root>
                ) }
                { mode === 'own' && onEdit && (
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-7 px-2 text-label-xs" onClick={ onEdit }>
                        Bearbeiten
                    </AlignButton.Root>
                ) }
                { mode === 'own' && listing.status === 'active' && onCancel && (
                    <AlignButton.Root variant="error" mode="stroke" size="xxsmall" className="h-6 w-6 px-0" onClick={ onCancel }>
                        <X className="w-3 h-3" />
                    </AlignButton.Root>
                ) }
            </div>
        </div>
    );
};

export const OfferRow: FC<OfferRowProps> = ({ offer, onAccept, onReject, isProcessing }) =>
{
    const mainItem = offer.items[0];

    return (
        <div className="flex items-center gap-2.5 rounded-xl bg-bg-white-0 px-2.5 py-2 transition-colors hover:bg-bg-weak-50">
            { offer.items.length > 1 ? (
                <div className="flex items-center gap-0.5 shrink-0">
                    { offer.items.slice(0, 6).map((item, i) => (
                        <div key={ i } className="flex size-10 items-center justify-center rounded-lg bg-bg-weak-50">
                            <ItemIcon itemName={ item.item_name ?? '' } className="size-8" />
                        </div>
                    )) }
                    { offer.items.length > 6 && (
                        <span className="ml-0.5 text-subheading-2xs text-text-sub-600">+{ offer.items.length - 6 }</span>
                    ) }
                </div>
            ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50">
                    <ItemIcon itemName={ mainItem?.item_name ?? '' } className="size-8" />
                </div>
            ) }
            <div className="flex-1 min-w-0">
                <div className="truncate text-label-sm text-text-strong-950">
                    { offer.items.length > 1 ? `Bundle (${ offer.items.length } Items)` : mainItem?.public_name ?? 'Unknown' }
                </div>
                <div className="flex items-center gap-0.5 text-paragraph-xs text-text-sub-600">
                    <User className="w-2.5 h-2.5" />{ offer.buyer?.username ?? 'Unbekannt' } · { timeAgo(offer.created_at) }
                </div>
            </div>
            <div className="text-right mr-1 shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-paragraph-xs text-text-soft-400 line-through tabular-nums">{ fmtC(offer.listing_price) }</span>
                    <CurrencyIcon type={ offer.currency } className="w-3 h-3" />
                    <span className="text-label-sm text-warning-base tabular-nums">{ fmtC(offer.offer_price) }</span>
                </div>
                <PriceDelta price={ offer.offer_price } avg={ offer.listing_price } />
            </div>
            <div className="flex items-center gap-1 shrink-0">
                { onAccept && (
                    <FancyButton.Root variant="primary" size="xsmall" className="h-7 px-2 text-label-xs" onClick={ onAccept } disabled={ isProcessing }>
                        <Check className="w-2.5 h-2.5 mr-0.5" />OK
                    </FancyButton.Root>
                ) }
                { onReject && (
                    <AlignButton.Root variant="error" mode="stroke" size="xxsmall" className="h-6 w-6 px-0" onClick={ onReject } disabled={ isProcessing }>
                        <X className="w-3 h-3" />
                    </AlignButton.Root>
                ) }
            </div>
        </div>
    );
};
