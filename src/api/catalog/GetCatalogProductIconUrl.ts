import { GetConfiguration, GetRoomEngine, GetSessionDataManager } from '../nitro';
import { GetPixelEffectIcon, GetSubscriptionProductIcon } from './CatalogUtilities';
import { IProduct } from './IProduct';
import { IPurchasableOffer } from './IPurchasableOffer';
import { ProductTypeEnum } from './ProductTypeEnum';

/**
 * Phase 14.2 — central catalog product icon resolver.
 *
 * Mirrors `Product.getIconUrl()` but additionally classifies the product
 * (`kind`) so callers can render a meaningful inline-fallback when the
 * resolved URL is null OR fails to load (no orange "mystery box" tiles).
 *
 * Used by:
 *   - CatalogProductTile (default 3×3 grid, bundle slots, view-product widget)
 *
 * Returns `{ url, kind, badgeCode?, classname? }`.
 */
export type CatalogProductKind =
    | 'floor'
    | 'wall'
    | 'badge'
    | 'effect'
    | 'club'
    | 'robot'
    | 'unknown';

export interface CatalogIconResult
{
    url: string | null;
    kind: CatalogProductKind;
    badgeCode?: string;
    classname?: string;
    extraParam?: string;
}

export function GetCatalogProductIconUrl(product: IProduct, offer: IPurchasableOffer | null = null): CatalogIconResult
{
    if(!product)
    {
        return { url: null, kind: 'unknown' };
    }

    const productType = (product.productType || '').toLowerCase();
    const className = product.furnitureData?.className || undefined;
    const extraParam = product.extraParam;

    switch(productType)
    {
        case ProductTypeEnum.FLOOR:
            return {
                url: GetRoomEngine().getFurnitureFloorIconUrl(product.productClassId) || null,
                kind: 'floor',
                classname: className,
                extraParam
            };

        case ProductTypeEnum.WALL:
        {
            // Replicates legacy Product.getIconUrl WALL branch (th_floor_*, th_wall_*, th_landscape_*)
            if(offer && product.furnitureData)
            {
                let iconName = '';

                switch(product.furnitureData.className)
                {
                    case 'floor':
                        iconName = [ 'th', product.furnitureData.className, offer.product.extraParam ].join('_');
                        break;
                    case 'wallpaper':
                        iconName = [ 'th', 'wall', offer.product.extraParam ].join('_');
                        break;
                    case 'landscape':
                        iconName = [ 'th', product.furnitureData.className, (offer.product.extraParam || '').replace('.', '_'), '001' ].join('_');
                        break;
                }

                if(iconName !== '')
                {
                    const assetUrl = GetConfiguration<string>('catalog.asset.url');
                    return { url: `${ assetUrl }/${ iconName }.png`, kind: 'wall', classname: className, extraParam };
                }
            }

            return {
                url: GetRoomEngine().getFurnitureWallIconUrl(product.productClassId, extraParam) || null,
                kind: 'wall',
                classname: className,
                extraParam
            };
        }

        case ProductTypeEnum.BADGE:
        {
            const badgeCode = extraParam || '';
            let url: string | null = null;
            try
            {
                url = badgeCode ? GetSessionDataManager().getBadgeUrl(badgeCode) || null : null;
            }
            catch
            {
                url = null;
            }
            return { url, kind: 'badge', badgeCode, extraParam };
        }

        case ProductTypeEnum.EFFECT:
        {
            const url = GetPixelEffectIcon(product.productClassId) || null;
            return { url: url && url.length > 0 ? url : null, kind: 'effect', extraParam };
        }

        case ProductTypeEnum.HABBO_CLUB:
        {
            const url = GetSubscriptionProductIcon(product.productClassId) || null;
            return { url: url && url.length > 0 ? url : null, kind: 'club', extraParam };
        }

        case ProductTypeEnum.ROBOT:
            // Avatar is rendered separately via LayoutAvatarImageView in the tile.
            return { url: null, kind: 'robot', extraParam };

        default:
            return { url: null, kind: 'unknown', classname: className, extraParam };
    }
}
