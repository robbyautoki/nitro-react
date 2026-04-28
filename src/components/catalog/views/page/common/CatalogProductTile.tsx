import { FC, SyntheticEvent, useMemo, useState } from 'react';
import { Award, Crown, ImageOff, Sparkles } from 'lucide-react';
import { GetCatalogProductIconUrl, IProduct, IPurchasableOffer } from '../../../../../api';

interface CatalogProductTileProps
{
    product: IProduct;
    offer?: IPurchasableOffer | null;
    /**
     * If true, render the icon centered (used by bundle grid).
     * Default false → absolute fill (default 3×3 grid tiles).
     */
    centered?: boolean;
    /**
     * If true, also show the inline kind-label (badge code / FX / HC pill)
     * underneath the fallback icon. Defaults to true.
     */
    showFallbackLabel?: boolean;
    className?: string;
}

/**
 * Phase 14.2 — single, shared product-icon tile that is used by every catalog
 * surface that needs to render an item icon (default grid, bundle grid,
 * view-product widget).
 *
 * Difference vs. before:
 *  - uses `GetCatalogProductIconUrl` so BADGE / EFFECT / HC also resolve
 *  - shows a meaningful fallback (Award + badge-code, Sparkles + "FX",
 *    Crown + "HC", or ImageOff + classname) when the URL is null OR fails
 *  - never renders an empty orange box anymore
 */
export const CatalogProductTile: FC<CatalogProductTileProps> = ({ product, offer = null, centered = false, showFallbackLabel = true, className = '' }) =>
{
    const [ failed, setFailed ] = useState(false);

    const result = useMemo(() => GetCatalogProductIconUrl(product, offer), [ product, offer ]);
    const showFallback = !result.url || failed;

    /**
     * Phase 14.3 — Floor/Wall icons come from `getFurnitureFloorIconUrl`/
     * `getFurnitureWallIconUrl`, which return canvas-blob URLs. The browser
     * happily "loads" such URLs even when the canvas is empty (sprite/SWF
     * missing on this server), so `onError` never fires. We additionally
     * check `naturalWidth/Height` after load and treat sub-4px renders as
     * "failed" → falls back to the kind-aware label.
     */
    const onLoadCheck = (e: SyntheticEvent<HTMLImageElement>) =>
    {
        const el = e.currentTarget;
        if(!el) return;
        if(el.naturalWidth < 4 || el.naturalHeight < 4) setFailed(true);
    };

    if(!showFallback && result.url)
    {
        return (
            <img
                src={ result.url }
                alt=""
                draggable={ false }
                onLoad={ onLoadCheck }
                onError={ () => setFailed(true) }
                className={ centered
                    ? `pointer-events-none object-contain ${ className }`
                    : `pointer-events-none absolute inset-0 h-full w-full object-contain ${ className }` }
                style={ { imageRendering: 'pixelated' } }
            />
        );
    }

    // ── Fallback rendering ─────────────────────────────────────────
    let Icon = ImageOff;
    let iconClass = 'text-text-soft-400/60';
    let pillBg = 'bg-bg-weak-50';
    let pillText = 'text-text-soft-400';
    let label: string | null = null;

    switch(result.kind)
    {
        case 'badge':
            Icon = Award;
            iconClass = 'text-warning-base/80';
            pillBg = 'bg-warning-lighter';
            pillText = 'text-warning-base';
            label = result.badgeCode || 'BADGE';
            break;
        case 'effect':
            Icon = Sparkles;
            iconClass = 'text-feature-base/80';
            pillBg = 'bg-feature-lighter';
            pillText = 'text-feature-base';
            label = 'FX';
            break;
        case 'club':
            Icon = Crown;
            iconClass = 'text-warning-base/80';
            pillBg = 'bg-warning-lighter';
            pillText = 'text-warning-base';
            label = 'HC';
            break;
        case 'robot':
            // Robot is rendered as avatar by the parent; nothing to show here.
            return null;
        case 'floor':
        case 'wall':
            Icon = ImageOff;
            iconClass = 'text-text-soft-400/60';
            label = result.classname || null;
            break;
        default:
            Icon = ImageOff;
            iconClass = 'text-text-soft-400/50';
            break;
    }

    const wrapper = centered
        ? `flex h-full w-full flex-col items-center justify-center gap-0.5 ${ className }`
        : `pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 ${ className }`;

    return (
        <div className={ wrapper }>
            <Icon className={ `h-5 w-5 ${ iconClass }` } />
            { showFallbackLabel && label && (
                <span
                    className={ `max-w-[90%] truncate rounded px-1 text-[9px] leading-tight ${ pillBg } ${ pillText }` }
                    title={ label }
                >
                    { label }
                </span>
            ) }
        </div>
    );
};
