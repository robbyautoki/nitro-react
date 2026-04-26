import { GetConfiguration } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';

export type ShopAssetType = 'nameplate' | 'avatar_decoration' | 'profile_effect';
export type ShopCurrency = 'credits' | 'diamonds';

export interface ShopAsset {
    assetKey: string;
    skuId: string;
    assetType: ShopAssetType;
    collectionId: string;
    collectionName: string;
    name: string;
    label: string | null;
    assetPath: string | null;
    staticUrl: string | null;
    animatedUrl: string | null;
    videoUrl: string | null;
    palette: string | null;
    priceCredits: number;
    priceDiamonds: number;
    finalPriceCredits: number;
    finalPriceDiamonds: number;
    vipRequiredTier: number;
    monthlyClaimEligible: boolean;
    owned: boolean;
    equipped: boolean;
    locked: boolean;
}

export interface EquippedAssets {
    nameplate: ShopAsset | null;
    avatarDecoration: ShopAsset | null;
    profileEffect: ShopAsset | null;
}

export interface VipOffer {
    tier: 1 | 2 | 3;
    name: string;
    rank: number;
    priceCredits: number;
    priceDiamonds: number;
    discountPercent: number;
    monthlyClaims: number;
    perks: string[];
}

export interface ShopCatalog {
    user: { id: number; username: string; rank: number };
    balances: { credits: number; diamonds: number };
    vip: {
        tier: number;
        subscriptionTier: number;
        endsAt: string | null;
        discountPercent: number;
        monthlyClaims: number;
        claimsUsed: number;
        claimsRemaining: number;
        yearMonth: string;
    };
    vipOffers: VipOffer[];
    assets: ShopAsset[];
    equipped: EquippedAssets;
}

type CacheEntry = {
    expiresAt: number;
    data: EquippedAssets;
};

const equippedCache = new Map<number, CacheEntry>();
const EQUIPPED_TTL = 60_000;
export const SHOP_EQUIPPED_EVENT = 'bahhos-shop-equipped-updated';

export function getCmsUrl() {
    return GetConfiguration<string>('url.prefix', 'http://localhost:3030');
}

async function parseResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.error || 'Shop-Anfrage fehlgeschlagen');
    return data as T;
}

export async function fetchShopCatalog(type?: ShopAssetType | 'vip'): Promise<ShopCatalog> {
    const params = new URLSearchParams({ action: 'catalog' });
    if(type) params.set('type', type);

    const res = await fetch(`${ getCmsUrl() }/api/shop?${ params.toString() }`, { headers: getAuthHeaders() });
    return parseResponse<ShopCatalog>(res);
}

export async function postShopAction<T = unknown>(body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${ getCmsUrl() }/api/shop`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
    });
    return parseResponse<T>(res);
}

export async function fetchEquippedAssets(userId: number, force = false): Promise<EquippedAssets> {
    if(!userId) return { nameplate: null, avatarDecoration: null, profileEffect: null };

    const cached = equippedCache.get(userId);
    if(!force && cached && cached.expiresAt > Date.now()) return cached.data;

    const res = await fetch(`${ getCmsUrl() }/api/shop?action=equipped&userId=${ encodeURIComponent(String(userId)) }`, {
        headers: getAuthHeaders()
    });
    const data = await parseResponse<{ equipped: EquippedAssets }>(res);
    equippedCache.set(userId, { data: data.equipped, expiresAt: Date.now() + EQUIPPED_TTL });
    return data.equipped;
}

export function invalidateEquippedAssets(userId?: number) {
    if(userId) equippedCache.delete(userId);
    else equippedCache.clear();
    window.dispatchEvent(new CustomEvent(SHOP_EQUIPPED_EVENT, { detail: { userId } }));
}
