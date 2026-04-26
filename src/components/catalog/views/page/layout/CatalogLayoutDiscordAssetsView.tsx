import { PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { Check, Coins, Crown, Gem, Loader2, Lock, Search } from 'lucide-react';
import { FC, MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { IPurchasableOffer, SendMessageComposer } from '../../../../../api';
import { CatalogEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent, CatalogPurchaseNotAllowedEvent, CatalogPurchaseSoldOutEvent } from '../../../../../events';
import { useCatalog, useUiEvent } from '../../../../../hooks';
import { cn } from '@/lib/utils';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSelect from '@/align-ui/components/ui/select';
import {
    EquippedAssets,
    ShopAsset,
    ShopAssetType,
    ShopCatalog,
    VipOffer,
    fetchShopCatalog,
    invalidateEquippedAssets,
    postShopAction
} from '../../../../discord-shop/shop-api';
import { resolveProfileEffect } from '../../../../user-profile/ProfileEffects';
import { ProfileEffectPreview } from '../../../../user-profile/ProfileEffectRenderer';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const DISCORD_ASSET_CATALOG_PAGE_IDS = [ 9681, 9682, 9683, 9684 ] as const;

const PAGE_TYPE_BY_ID: Record<number, ShopAssetType | 'vip'> = {
    9681: 'nameplate',
    9682: 'avatar_decoration',
    9683: 'profile_effect',
    9684: 'vip'
};

const PAGE_LABELS: Record<ShopAssetType | 'vip', string> = {
    nameplate: 'Nameplates',
    avatar_decoration: 'Avatar-Deko',
    profile_effect: 'Profile-Effects',
    vip: 'VIP'
};

const ASSET_PREFIX: Record<ShopAssetType, string> = {
    nameplate: 'np',
    avatar_decoration: 'ad',
    profile_effect: 'pe'
};

const EQUIPPED_KEY: Record<ShopAssetType, keyof EquippedAssets> = {
    nameplate: 'nameplate',
    avatar_decoration: 'avatarDecoration',
    profile_effect: 'profileEffect'
};

export function isDiscordAssetCatalogPage(pageId?: number) {
    return !!pageId && DISCORD_ASSET_CATALOG_PAGE_IDS.includes(pageId as typeof DISCORD_ASSET_CATALOG_PAGE_IDS[number]);
}

function assetOfferName(asset: ShopAsset, currency: 'credits' | 'diamonds') {
    return `dasset_${ ASSET_PREFIX[asset.assetType] }_${ asset.skuId }_${ currency === 'credits' ? 'c' : 'd' }`;
}

function vipOfferName(tier: number, currency: 'credits' | 'diamonds') {
    return `dvip_${ tier }_${ currency === 'credits' ? 'c' : 'd' }`;
}

function priceText(value: number) {
    return value.toLocaleString('de-DE');
}

function hashAssetPreviewSeed(value: string) {
    let hash = 0;
    for(let index = 0; index < value.length; index++) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    return Math.abs(hash);
}

function patchCatalogEquipped(catalog: ShopCatalog, assetType: ShopAssetType, equipped: EquippedAssets): ShopCatalog {
    const equipKey = EQUIPPED_KEY[assetType];
    const equippedAssetKey = equipped[equipKey]?.assetKey ?? null;

    return {
        ...catalog,
        equipped,
        assets: catalog.assets.map(asset => asset.assetType === assetType
            ? { ...asset, equipped: asset.assetKey === equippedAssetKey }
            : asset)
    };
}

function parseAssetPurchasePendingKey(pendingKey: string) {
    if(pendingKey.startsWith('claim:')) {
        return { assetKey: pendingKey.slice('claim:'.length), currency: null as 'credits' | 'diamonds' | null, claim: true };
    }

    if(!pendingKey.startsWith('buy:')) return null;

    const rest = pendingKey.slice('buy:'.length);
    const separator = rest.lastIndexOf(':');
    if(separator <= 0) return null;

    const currency = rest.slice(separator + 1);
    if(currency !== 'credits' && currency !== 'diamonds') return null;

    return { assetKey: rest.slice(0, separator), currency, claim: false };
}

function patchCatalogAfterNativePurchase(catalog: ShopCatalog, pendingKey: string): ShopCatalog {
    const parsed = parseAssetPurchasePendingKey(pendingKey);
    if(!parsed) return catalog;

    const purchasedAsset = catalog.assets.find(asset => asset.assetKey === parsed.assetKey);
    if(!purchasedAsset) return catalog;

    const balances = { ...catalog.balances };
    if(parsed.currency === 'credits') balances.credits = Math.max(0, balances.credits - purchasedAsset.finalPriceCredits);
    if(parsed.currency === 'diamonds') balances.diamonds = Math.max(0, balances.diamonds - purchasedAsset.finalPriceDiamonds);

    const vip = parsed.claim
        ? {
            ...catalog.vip,
            claimsUsed: catalog.vip.claimsUsed + 1,
            claimsRemaining: Math.max(0, catalog.vip.claimsRemaining - 1)
        }
        : catalog.vip;

    return {
        ...catalog,
        balances,
        vip,
        assets: catalog.assets.map(asset => asset.assetKey === parsed.assetKey
            ? { ...asset, owned: true, locked: false }
            : asset)
    };
}

const AssetPreview: FC<{ asset: ShopAsset; compact?: boolean; animated?: boolean; className?: string }> = ({ asset, compact = false, animated = false, className }) => {
    if(asset.assetType === 'profile_effect') {
        return <ProfileEffectPreview resolution={ resolveProfileEffect(asset) } compact={ compact } animated={ animated } className={ className } />;
    }

    const mediaUrl = asset.videoUrl || asset.animatedUrl || asset.staticUrl;

    return (
        <div className={ cn(
            'relative flex items-center justify-center overflow-hidden rounded-10 bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200',
            compact ? 'h-20' : 'h-28',
            className
        ) }>
            { mediaUrl ? (
                asset.videoUrl ? (
                    <video src={ asset.videoUrl } className="h-full w-full object-contain" autoPlay muted loop playsInline />
                ) : (
                    <img src={ mediaUrl } alt={ asset.name } className="h-full w-full object-contain" draggable={ false } />
                )
            ) : (
                <ProfileEffectPreview
                    resolution={ { effect: null, key: asset.assetKey, seed: hashAssetPreviewSeed(asset.assetKey), exact: false } }
                    compact={ compact }
                    className="h-full w-full border-0 ring-0"
                />
            ) }
        </div>
    );
};

export const CatalogLayoutDiscordAssetsView: FC<CatalogLayoutProps> = props => {
    const { page } = props;
    const { currentPage = null } = useCatalog();
    const [ catalog, setCatalog ] = useState<ShopCatalog | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ query, setQuery ] = useState('');
    const [ collection, setCollection ] = useState('all');
    const [ selectedAssetKey, setSelectedAssetKey ] = useState<string | null>(null);
    const [ pendingKey, setPendingKey ] = useState<string | null>(null);

    const pageType = PAGE_TYPE_BY_ID[page.pageId];
    const offers = page.offers?.length ? page.offers : (currentPage?.offers || []);

    const offersByName = useMemo(() => {
        const map = new Map<string, IPurchasableOffer>();
        offers.forEach(offer => map.set(offer.localizationId, offer));
        return map;
    }, [ offers ]);

    const loadCatalog = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            setCatalog(await fetchShopCatalog(pageType));
        } catch (e) {
            setError(e instanceof TypeError ? 'Katalog-API nicht erreichbar. Bitte CMS-Verbindung pruefen.' : e instanceof Error ? e.message : 'Katalog konnte nicht geladen werden');
        } finally {
            setIsLoading(false);
        }
    }, [ pageType ]);

    useEffect(() => {
        loadCatalog();
    }, [ loadCatalog ]);

    useEffect(() => {
        setQuery('');
        setCollection('all');
        setSelectedAssetKey(null);
    }, [ page.pageId ]);

    const onCatalogEvent = useCallback((event: CatalogEvent) => {
        if(!pendingKey) return;

        switch(event.type) {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                if(pendingKey.startsWith('vip:')) {
                    loadCatalog().finally(() => {
                        invalidateEquippedAssets(catalog?.user.id);
                        setPendingKey(null);
                    });
                    return;
                }

                setCatalog(current => current ? patchCatalogAfterNativePurchase(current, pendingKey) : current);
                invalidateEquippedAssets(catalog?.user.id);
                setPendingKey(null);
                return;
            case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
            case CatalogPurchaseNotAllowedEvent.NOT_ALLOWED:
            case CatalogPurchaseSoldOutEvent.SOLD_OUT:
                setError('Kauf konnte nicht abgeschlossen werden.');
                setPendingKey(null);
                return;
        }
    }, [ catalog?.user.id, loadCatalog, pendingKey ]);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);
    useUiEvent(CatalogPurchaseNotAllowedEvent.NOT_ALLOWED, onCatalogEvent);
    useUiEvent(CatalogPurchaseSoldOutEvent.SOLD_OUT, onCatalogEvent);

    const filteredAssets = useMemo(() => {
        if(!catalog || pageType === 'vip') return [];

        const normalizedQuery = query.trim().toLowerCase();

        return catalog.assets
            .filter(asset => asset.assetType === pageType)
            .filter(asset => collection === 'all' || asset.collectionId === collection)
            .filter(asset => {
                if(!normalizedQuery) return true;
                return [ asset.name, asset.collectionName, asset.label || '' ].some(value => value.toLowerCase().includes(normalizedQuery));
            });
    }, [ catalog, collection, pageType, query ]);

    const collections = useMemo(() => {
        if(!catalog || pageType === 'vip') return [];

        const seen = new Map<string, string>();
        catalog.assets
            .filter(asset => asset.assetType === pageType)
            .forEach(asset => {
                if(!seen.has(asset.collectionId)) seen.set(asset.collectionId, asset.collectionName);
            });

        return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [ catalog, pageType ]);

    useEffect(() => {
        if(pageType === 'vip') {
            setSelectedAssetKey(null);
            return;
        }

        if(!filteredAssets.length) {
            setSelectedAssetKey(null);
            return;
        }

        if(!selectedAssetKey || !filteredAssets.some(asset => asset.assetKey === selectedAssetKey)) {
            setSelectedAssetKey(filteredAssets[0].assetKey);
        }
    }, [ filteredAssets, pageType, selectedAssetKey ]);

    const selectedAsset = useMemo(() => {
        if(pageType === 'vip') return null;
        return filteredAssets.find(asset => asset.assetKey === selectedAssetKey) || filteredAssets[0] || null;
    }, [ filteredAssets, pageType, selectedAssetKey ]);

    const purchaseOffer = useCallback((offer: IPurchasableOffer | undefined, pending: string, extraData = '') => {
        if(!offer) {
            setError('Dieses Angebot ist im Katalog noch nicht geladen.');
            return;
        }

        setError(null);
        setPendingKey(pending);
        SendMessageComposer(new PurchaseFromCatalogComposer(page.pageId, offer.offerId, extraData, 1));
    }, [ page.pageId ]);

    const equipAsset = useCallback(async (asset: ShopAsset) => {
        if(!catalog) return;

        setPendingKey(`equip:${ asset.assetKey }`);
        setError(null);

        try {
            const equipKey = EQUIPPED_KEY[asset.assetType];
            const isCurrentlyEquipped = catalog.equipped[equipKey]?.assetKey === asset.assetKey || asset.equipped;
            await postShopAction({
                action: 'equip_asset',
                assetType: asset.assetType,
                assetKey: isCurrentlyEquipped ? null : asset.assetKey
            }).then((response: { equipped?: EquippedAssets }) => {
                if(response.equipped) setCatalog(current => current ? patchCatalogEquipped(current, asset.assetType, response.equipped!) : current);
            });
            invalidateEquippedAssets(catalog.user.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Asset konnte nicht ausgeruestet werden');
        } finally {
            setPendingKey(null);
        }
    }, [ catalog ]);

    if(!pageType) return null;

    if(isLoading && !catalog) {
        return (
            <div className="flex h-full items-center justify-center text-text-sub-600">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Lade Assets
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-bg-white-0">
            <div className="shrink-0 border-b border-stroke-soft-200 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-title-h6 text-text-strong-950">{ PAGE_LABELS[pageType] }</h2>
                            { catalog?.vip.discountPercent ? (
                                <AlignBadge.Root color="green" variant="lighter" size="small">
                                    { catalog.vip.discountPercent }% VIP Rabatt
                                </AlignBadge.Root>
                            ) : null }
                        </div>
                        <p className="mt-1 text-paragraph-xs text-text-sub-600">
                            { pageType === 'vip' ? '30 Tage VIP kaufen' : 'Kaufen, claimen und direkt ausruesten' }
                        </p>
                    </div>

                    { catalog && (
                        <div className="flex items-center gap-2 text-label-sm text-text-sub-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2.5 py-1 ring-1 ring-inset ring-stroke-soft-200">
                                <Coins className="size-3.5" />{ priceText(catalog.balances.credits) }
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2.5 py-1 ring-1 ring-inset ring-stroke-soft-200">
                                <Gem className="size-3.5" />{ priceText(catalog.balances.diamonds) }
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2.5 py-1 ring-1 ring-inset ring-stroke-soft-200">
                                <Crown className="size-3.5" />VIP { catalog.vip.tier || 0 }
                            </span>
                        </div>
                    ) }
                </div>

                { pageType !== 'vip' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <AlignInput.Root size="small" className="min-w-[220px] flex-1">
                            <AlignInput.Wrapper className="h-9">
                                <AlignInput.Icon as={ Search } className="size-4" />
                                <AlignInput.Input
                                    value={ query }
                                    onChange={ event => setQuery(event.target.value) }
                                    placeholder="Suchen"
                                    className="h-9"
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>

                        <AlignSelect.Root value={ collection } onValueChange={ setCollection } size="small" variant="compact">
                            <AlignSelect.Trigger className="w-56">
                                <AlignSelect.Value placeholder="Alle Kollektionen" />
                            </AlignSelect.Trigger>
                            <AlignSelect.Content>
                                <AlignSelect.Item value="all">Alle Kollektionen</AlignSelect.Item>
                                { collections.map(([ id, name ]) => <AlignSelect.Item key={ id } value={ id }>{ name }</AlignSelect.Item>) }
                            </AlignSelect.Content>
                        </AlignSelect.Root>
                    </div>
                ) }

                { error && (
                    <div className="mt-3 rounded-10 bg-error-lighter px-3 py-2 text-paragraph-xs text-error-base ring-1 ring-inset ring-error-light">
                        { error }
                    </div>
                ) }
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
                { pageType === 'vip'
                    ? <VipGrid catalog={ catalog } offersByName={ offersByName } pendingKey={ pendingKey } purchaseOffer={ purchaseOffer } />
                    : (
                        <div className="grid min-h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <AssetGrid
                                assets={ filteredAssets }
                                catalog={ catalog }
                                offersByName={ offersByName }
                                pendingKey={ pendingKey }
                                purchaseOffer={ purchaseOffer }
                                equipAsset={ equipAsset }
                                selectedAssetKey={ selectedAsset?.assetKey ?? null }
                                onSelectAsset={ asset => setSelectedAssetKey(asset.assetKey) }
                            />
                            <AssetDetailPanel
                                asset={ selectedAsset }
                                catalog={ catalog }
                                offersByName={ offersByName }
                                pendingKey={ pendingKey }
                                purchaseOffer={ purchaseOffer }
                                equipAsset={ equipAsset }
                            />
                        </div>
                    )
                }
            </div>
        </div>
    );
};

const AssetGrid: FC<{
    assets: ShopAsset[];
    catalog: ShopCatalog | null;
    offersByName: Map<string, IPurchasableOffer>;
    pendingKey: string | null;
    purchaseOffer: (offer: IPurchasableOffer | undefined, pending: string, extraData?: string) => void;
    equipAsset: (asset: ShopAsset) => void;
    selectedAssetKey: string | null;
    onSelectAsset: (asset: ShopAsset) => void;
}> = ({ assets, catalog, offersByName, pendingKey, purchaseOffer, equipAsset, selectedAssetKey, onSelectAsset }) => {
    if(!catalog) return null;

    if(!assets.length) {
        return (
            <div className="flex h-full items-center justify-center rounded-10 bg-bg-weak-50 text-paragraph-sm text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                Keine Assets gefunden
            </div>
        );
    }

    return (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            { assets.map(asset => {
                const equipKey = EQUIPPED_KEY[asset.assetType];
                const isEquipped = catalog.equipped[equipKey]?.assetKey === asset.assetKey || asset.equipped;
                const isSelected = selectedAssetKey === asset.assetKey;

                return (
                    <div
                        key={ asset.assetKey }
                        role="button"
                        tabIndex={ 0 }
                        aria-selected={ isSelected }
                        onClick={ () => onSelectAsset(asset) }
                        onKeyDown={ event => {
                            if(event.key !== 'Enter' && event.key !== ' ') return;
                            event.preventDefault();
                            onSelectAsset(asset);
                        } }
                        style={ { contentVisibility: 'auto', containIntrinsicSize: '330px' } }
                        className={ cn(
                            'flex min-h-[330px] cursor-pointer flex-col rounded-10 bg-bg-white-0 p-3 text-left shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out',
                            'hover:bg-bg-weak-50 hover:shadow-none focus:outline-none focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
                            isSelected && 'bg-bg-weak-50 ring-2 ring-primary-base'
                        ) }
                    >
                        <AssetPreview asset={ asset } />

                        <div className="mt-3 min-h-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="truncate text-label-sm text-text-strong-950">{ asset.name }</h3>
                                    <p className="mt-0.5 truncate text-paragraph-xs text-text-sub-600">{ asset.collectionName }</p>
                                </div>
                                { isEquipped ? (
                                    <AlignBadge.Root color="green" variant="lighter" size="small">
                                        <Check className="size-3" />Aktiv
                                    </AlignBadge.Root>
                                ) : asset.owned ? (
                                    <AlignBadge.Root color="blue" variant="lighter" size="small">Besitzt du</AlignBadge.Root>
                                ) : asset.locked ? (
                                    <AlignBadge.Root color="orange" variant="lighter" size="small">
                                        <Lock className="size-3" />VIP { asset.vipRequiredTier }
                                    </AlignBadge.Root>
                                ) : null }
                            </div>

                            { asset.label && <p className="mt-2 line-clamp-2 text-paragraph-xs text-text-sub-600">{ asset.label }</p> }
                        </div>

                        <div className="mt-3 space-y-2">
                            <AssetActions
                                asset={ asset }
                                catalog={ catalog }
                                offersByName={ offersByName }
                                pendingKey={ pendingKey }
                                purchaseOffer={ purchaseOffer }
                                equipAsset={ equipAsset }
                            />
                        </div>
                    </div>
                );
            }) }
        </div>
    );
};

const AssetDetailPanel: FC<{
    asset: ShopAsset | null;
    catalog: ShopCatalog | null;
    offersByName: Map<string, IPurchasableOffer>;
    pendingKey: string | null;
    purchaseOffer: (offer: IPurchasableOffer | undefined, pending: string, extraData?: string) => void;
    equipAsset: (asset: ShopAsset) => void;
}> = ({ asset, catalog, offersByName, pendingKey, purchaseOffer, equipAsset }) => {
    if(!catalog) return null;

    if(!asset) {
        return (
            <aside className="flex min-h-[320px] items-center justify-center rounded-10 bg-bg-weak-50 p-4 text-center text-paragraph-sm text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                Kein Asset ausgewaehlt
            </aside>
        );
    }

    const equipKey = EQUIPPED_KEY[asset.assetType];
    const isEquipped = catalog.equipped[equipKey]?.assetKey === asset.assetKey || asset.equipped;

    return (
        <aside className="sticky top-0 flex h-fit min-h-[420px] min-w-0 flex-col overflow-hidden rounded-10 bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-label-xs uppercase text-text-soft-400">Vorschau</p>
                    <h3 className="mt-1 text-title-h6 text-text-strong-950">{ asset.name }</h3>
                </div>
                { isEquipped ? (
                    <AlignBadge.Root color="green" variant="lighter" size="small">
                        <Check className="size-3" />Aktiv
                    </AlignBadge.Root>
                ) : asset.owned ? (
                    <AlignBadge.Root color="blue" variant="lighter" size="small">Besitzt du</AlignBadge.Root>
                ) : asset.locked ? (
                    <AlignBadge.Root color="orange" variant="lighter" size="small">
                        <Lock className="size-3" />VIP { asset.vipRequiredTier }
                    </AlignBadge.Root>
                ) : null }
            </div>

            <AssetPreview asset={ asset } animated className="mt-4 h-44" />

            <div className="mt-4 min-h-0 flex-1 space-y-3">
                <div>
                    <p className="text-label-sm text-text-strong-950">{ asset.collectionName }</p>
                    { asset.label && <p className="mt-1 text-paragraph-xs text-text-sub-600">{ asset.label }</p> }
                </div>

                { asset.locked && (
                    <div className="rounded-lg bg-warning-lighter px-3 py-2 text-paragraph-xs text-warning-base ring-1 ring-inset ring-warning-light">
                        Benoetigt VIP { asset.vipRequiredTier }.
                    </div>
                ) }

                { !asset.owned && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-bg-weak-50 p-2 ring-1 ring-inset ring-stroke-soft-200">
                        <div>
                            <p className="text-label-xs text-text-soft-400">Taler</p>
                            <p className="text-label-sm text-text-strong-950">{ priceText(asset.finalPriceCredits) }</p>
                        </div>
                        <div>
                            <p className="text-label-xs text-text-soft-400">Diamanten</p>
                            <p className="text-label-sm text-text-strong-950">{ priceText(asset.finalPriceDiamonds) }</p>
                        </div>
                    </div>
                ) }
            </div>

            <div className="mt-4">
                <AssetActions
                    asset={ asset }
                    catalog={ catalog }
                    offersByName={ offersByName }
                    pendingKey={ pendingKey }
                    purchaseOffer={ purchaseOffer }
                    equipAsset={ equipAsset }
                />
            </div>
        </aside>
    );
};

const AssetActions: FC<{
    asset: ShopAsset;
    catalog: ShopCatalog;
    offersByName: Map<string, IPurchasableOffer>;
    pendingKey: string | null;
    purchaseOffer: (offer: IPurchasableOffer | undefined, pending: string, extraData?: string) => void;
    equipAsset: (asset: ShopAsset) => void;
}> = ({ asset, catalog, offersByName, pendingKey, purchaseOffer, equipAsset }) => {
    const creditOffer = offersByName.get(assetOfferName(asset, 'credits'));
    const diamondOffer = offersByName.get(assetOfferName(asset, 'diamonds'));
    const claimOffer = creditOffer || diamondOffer;
    const canClaim = !asset.owned && asset.monthlyClaimEligible && !asset.locked && catalog.vip.claimsRemaining > 0;
    const equipKey = EQUIPPED_KEY[asset.assetType];
    const isEquipped = catalog.equipped[equipKey]?.assetKey === asset.assetKey || asset.equipped;

    if(asset.owned) {
        return (
            <AlignButton.Root
                variant={ isEquipped ? 'neutral' : 'primary' }
                mode={ isEquipped ? 'stroke' : 'filled' }
                size="xsmall"
                className="w-full"
                disabled={ !!pendingKey || asset.locked }
                onClick={ event => {
                    event.stopPropagation();
                    equipAsset(asset);
                } }
            >
                { pendingKey === `equip:${ asset.assetKey }` && <Loader2 className="size-4 animate-spin" /> }
                { isEquipped ? 'Ablegen' : 'Ausruesten' }
            </AlignButton.Root>
        );
    }

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <BuyButton
                    icon="credits"
                    value={ asset.finalPriceCredits }
                    originalValue={ asset.priceCredits }
                    disabled={ !!pendingKey || asset.locked || !creditOffer }
                    loading={ pendingKey === `buy:${ asset.assetKey }:credits` }
                    onClick={ event => {
                        event.stopPropagation();
                        purchaseOffer(creditOffer, `buy:${ asset.assetKey }:credits`);
                    } }
                />
                <BuyButton
                    icon="diamonds"
                    value={ asset.finalPriceDiamonds }
                    originalValue={ asset.priceDiamonds }
                    disabled={ !!pendingKey || asset.locked || !diamondOffer }
                    loading={ pendingKey === `buy:${ asset.assetKey }:diamonds` }
                    onClick={ event => {
                        event.stopPropagation();
                        purchaseOffer(diamondOffer, `buy:${ asset.assetKey }:diamonds`);
                    } }
                />
            </div>

            <AlignButton.Root
                variant="neutral"
                mode="lighter"
                size="xsmall"
                className="w-full"
                disabled={ !!pendingKey || !canClaim || !claimOffer }
                onClick={ event => {
                    event.stopPropagation();
                    purchaseOffer(claimOffer, `claim:${ asset.assetKey }`, 'vip_claim');
                } }
            >
                { pendingKey === `claim:${ asset.assetKey }` && <Loader2 className="size-4 animate-spin" /> }
                VIP-Claim { catalog.vip.claimsRemaining > 0 ? `(${ catalog.vip.claimsRemaining })` : '' }
            </AlignButton.Root>
        </div>
    );
};

const BuyButton: FC<{
    icon: 'credits' | 'diamonds';
    value: number;
    originalValue: number;
    disabled: boolean;
    loading: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
}> = ({ icon, value, originalValue, disabled, loading, onClick }) => {
    const Icon = icon === 'credits' ? Coins : Gem;
    const discounted = value < originalValue;

    return (
        <AlignButton.Root variant="primary" mode="filled" size="xsmall" disabled={ disabled } onClick={ onClick } className="min-w-0">
            { loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" /> }
            <span className="truncate">{ priceText(value) }</span>
            { discounted && <span className="text-[10px] line-through opacity-70">{ priceText(originalValue) }</span> }
        </AlignButton.Root>
    );
};

const VipGrid: FC<{
    catalog: ShopCatalog | null;
    offersByName: Map<string, IPurchasableOffer>;
    pendingKey: string | null;
    purchaseOffer: (offer: IPurchasableOffer | undefined, pending: string, extraData?: string) => void;
}> = ({ catalog, offersByName, pendingKey, purchaseOffer }) => {
    if(!catalog) return null;

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            { catalog.vipOffers.map((offer: VipOffer) => {
                const creditOffer = offersByName.get(vipOfferName(offer.tier, 'credits'));
                const diamondOffer = offersByName.get(vipOfferName(offer.tier, 'diamonds'));
                const active = catalog.vip.tier >= offer.tier;

                return (
                    <div key={ offer.tier } className="flex min-h-[280px] flex-col rounded-10 bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="flex size-9 items-center justify-center rounded-10 bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                    <Crown className="size-5 text-primary-base" />
                                </span>
                                <div>
                                    <h3 className="text-label-md text-text-strong-950">{ offer.name }</h3>
                                    <p className="text-paragraph-xs text-text-sub-600">Rang { offer.rank } fuer 30 Tage</p>
                                </div>
                            </div>
                            { active && <AlignBadge.Root color="green" variant="lighter" size="small">Aktiv</AlignBadge.Root> }
                        </div>

                        <div className="mt-4 flex-1 space-y-2">
                            { offer.perks.map(perk => (
                                <div key={ perk } className="flex items-center gap-2 text-paragraph-xs text-text-sub-600">
                                    <Check className="size-3.5 shrink-0 text-success-base" />
                                    <span>{ perk }</span>
                                </div>
                            )) }
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <BuyButton
                                icon="credits"
                                value={ offer.priceCredits }
                                originalValue={ offer.priceCredits }
                                disabled={ !!pendingKey || !creditOffer }
                                loading={ pendingKey === `vip:${ offer.tier }:credits` }
                                onClick={ () => purchaseOffer(creditOffer, `vip:${ offer.tier }:credits`) }
                            />
                            <BuyButton
                                icon="diamonds"
                                value={ offer.priceDiamonds }
                                originalValue={ offer.priceDiamonds }
                                disabled={ !!pendingKey || !diamondOffer }
                                loading={ pendingKey === `vip:${ offer.tier }:diamonds` }
                                onClick={ () => purchaseOffer(diamondOffer, `vip:${ offer.tier }:diamonds`) }
                            />
                        </div>
                    </div>
                );
            }) }
        </div>
    );
};
