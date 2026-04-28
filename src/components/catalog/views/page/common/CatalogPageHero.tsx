import { FC, useMemo } from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { GetConfiguration } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import {
    HERO_FRAME,
    HERO_HEADLINE,
    HERO_ICON_TILE,
    HERO_LAYOUT_PILL,
    HERO_PREMIUM_FRAME,
    HERO_TEASER,
    LAYOUT_LABELS
} from './CatalogTileTokens';

interface CatalogPageHeroProps
{
    /**
     * If true, render even when localization is empty (uses caption fallback).
     * Default: false → matches legacy CatalogPageHeaderBanner behaviour.
     */
    forceShow?: boolean;
}

/**
 * Phase 14.1 — Page-Hero rendered ABOVE the items grid on supported layouts
 * (default_3x3, single_bundle, frontpage_featured, room_bundle).
 *
 * Visual identity is shared with the CMS Mega-Editor live-preview through
 * `CatalogTileTokens.ts` so what staff edits in the CMS = what users see ingame.
 *
 * Two render modes:
 *   • "Premium" hero (large image): when `getImage(0)` looks like a promo banner
 *   • "Compact" hero: small icon-tile + caption + headline + teaser + layout-pill
 */
export const CatalogPageHero: FC<CatalogPageHeroProps> = ({ forceShow = false }) =>
{
    const { currentPage = null } = useCatalog();

    const imageUrl = useMemo(() =>
    {
        if(!currentPage?.localization) return null;
        const img = currentPage.localization.getImage(0);
        if(!img) return null;
        const imageLibUrl = GetConfiguration<string>('image.library.url', '');
        return `${ imageLibUrl }${ img }`;
    }, [ currentPage ]);

    const isPremiumBanner = useMemo(() =>
    {
        if(!imageUrl) return false;
        const lower = imageUrl.toLowerCase();
        return lower.includes('webpromo') || lower.includes('web_promo') || lower.includes('_promo') || lower.includes('lpromo') || lower.includes('largepromo');
    }, [ imageUrl ]);

    const headline = useMemo(() =>
    {
        // localization text(0) is page_text1 in DB. We treat it as headline body.
        const text = currentPage?.localization?.getText(0) || '';
        if(!text || text.length < 3) return null;
        return text;
    }, [ currentPage ]);

    const caption = useMemo(() =>
    {
        // localization text(2) typically holds the caption / page title.
        const c = currentPage?.localization?.getText?.(2);
        return c && c.length > 0 ? c : currentPage?.localization?.getText?.(0) || '';
    }, [ currentPage ]);

    if(!currentPage) return null;
    if(!forceShow && !imageUrl && !headline) return null;

    if(isPremiumBanner && imageUrl)
    {
        return (
            <div className="px-3 pt-3">
                <div className={ HERO_PREMIUM_FRAME }>
                    <img
                        src={ imageUrl }
                        alt=""
                        className="h-32 w-full object-cover"
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-strong-950/80 via-bg-strong-950/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <div className="flex-1 min-w-0">
                            { headline && (
                                <p
                                    className="text-paragraph-sm text-static-white line-clamp-2 catalog-page-text drop-shadow-sm"
                                    dangerouslySetInnerHTML={ { __html: headline } }
                                />
                            ) }
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-static-white/90 px-2.5 py-0.5 text-subheading-2xs text-text-strong-950 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-warning-base" /> Premium
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 pt-3">
            <div className={ HERO_FRAME }>
                <div className={ HERO_ICON_TILE }>
                    { imageUrl
                        ? <img src={ imageUrl } alt="" className="h-full w-full object-contain p-0.5" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } />
                        : <ImageIcon className="size-5 text-text-soft-400" /> }
                </div>
                <div className="flex-1 min-w-0">
                    <div className={ HERO_HEADLINE }>{ caption }</div>
                    { headline && (
                        <p
                            className={ `${ HERO_TEASER } catalog-page-text` }
                            dangerouslySetInnerHTML={ { __html: headline } }
                        />
                    ) }
                </div>
                <span className={ HERO_LAYOUT_PILL }>
                    { LAYOUT_LABELS[currentPage.layoutCode] || currentPage.layoutCode }
                </span>
            </div>
        </div>
    );
};
