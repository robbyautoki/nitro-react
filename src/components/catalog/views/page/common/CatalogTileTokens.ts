/**
 * Catalog Tile Tokens — shared visual tokens for catalog page rendering.
 *
 * MIRROR FILE: cms/components/admin/catalog/catalog-tile-tokens.ts
 * Both files MUST stay byte-identical (apart from module-style export). When
 * editing, update BOTH files. The CMS Mega-Editor live-preview consumes these
 * tokens so its preview matches the actual ingame look.
 *
 * Phase 14.1 — single source of truth for:
 *   - Hero zone (caption + headline + teaser + special image + layout-pill)
 *   - Default 3×3 tile look (Card + hover + selected + badges)
 *   - Frontpage-Featured / SingleBundle accent surfaces
 *
 * Pure Tailwind classes — works in both Nitro (Tailwind 3) and CMS (Tailwind 4).
 */

// ─── Hero ──────────────────────────────────────────────────────
export const HERO_FRAME =
    'flex items-start gap-3 rounded-2xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200';

export const HERO_ICON_TILE =
    'flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 overflow-hidden';

export const HERO_HEADLINE =
    'text-label-md text-text-strong-950 font-semibold';

export const HERO_TEASER =
    'mt-0.5 line-clamp-2 text-paragraph-xs text-text-sub-600';

export const HERO_LAYOUT_PILL =
    'shrink-0 rounded-full bg-bg-white-0 px-2 py-0.5 text-subheading-2xs text-text-soft-400 shadow-regular-xs ring-1 ring-stroke-soft-200';

export const HERO_PREMIUM_FRAME =
    'relative overflow-hidden rounded-2xl ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs';

// ─── Tiles (3×3 grid + bundle slots) ───────────────────────────
export const TILE_BASE =
    'group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-transparent p-1 transition-colors duration-100';

export const TILE_HOVER = 'hover:bg-bg-weak-50';

export const TILE_SELECTED =
    'bg-primary-alpha-10 ring-1 ring-inset ring-primary-base';

export const TILE_MULTI_SELECTED =
    'bg-success-lighter ring-1 ring-inset ring-success-base';

export const TILE_SOLD_OUT = 'opacity-40 grayscale';

export const TILE_LABEL =
    'truncate text-paragraph-xs text-text-strong-950';

export const TILE_PRICE_ROW =
    'flex items-center gap-1.5 text-paragraph-xs font-semibold text-text-strong-950';

// ─── Badges (corner overlays) ──────────────────────────────────
export const BADGE_HC =
    'inline-flex items-center gap-1 rounded-full bg-warning-lighter px-2 py-0.5 text-subheading-2xs text-warning-base ring-1 ring-inset ring-warning-base/20';

export const BADGE_VIP =
    'inline-flex items-center gap-1 rounded-full bg-feature-lighter px-2 py-0.5 text-subheading-2xs text-feature-base ring-1 ring-inset ring-feature-base/20';

export const BADGE_LIMITED =
    'absolute -right-1 -top-1 rounded-full bg-warning-base px-1.5 py-0.5 text-subheading-2xs font-bold text-static-white shadow-regular-xs';

export const BADGE_AMOUNT =
    'absolute bottom-0.5 right-0.5 rounded bg-bg-strong-950/70 px-1 py-0.5 text-subheading-2xs font-bold text-static-white';

// ─── Bundle / Featured accent surfaces ─────────────────────────
export const BUNDLE_ACCENT_BAR =
    'flex items-center justify-between rounded-xl bg-warning-base px-3 py-2 text-label-sm font-bold text-static-white shadow-regular-xs';

export const FEATURED_HERO_CARD =
    'relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-bg-weak-50 p-3 text-left ring-1 ring-inset ring-stroke-soft-200 transition-all hover:bg-bg-white-0';

export const FEATURED_HERO_BADGE =
    'absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-warning-lighter px-2 py-0.5 text-subheading-2xs font-bold text-warning-base ring-1 ring-inset ring-warning-base/20';

// ─── Layout label dictionary (deutsch) ────────────────────────
export const LAYOUT_LABELS: Record<string, string> = {
    default_3x3: '3×3 Standard',
    frontpage_featured: 'Featured-Hero',
    frontpage: 'Frontpage',
    single_bundle: 'Bundle',
    room_bundle: 'Raum-Bundle',
    vip_buy: 'VIP-Verkauf',
    club_buy: 'HC-Verkauf',
    club_gift: 'HC-Geschenk',
    info_loyalty: 'Loyalität',
    info_pets: 'Haustiere-Info',
    info_rentables: 'Mieten-Info',
    info_duckets: 'Duckets-Info',
    productpage1: 'Produktseite',
    badge_display: 'Abzeichen',
    trophies: 'Trophäen',
    spaces: 'Räume',
    spaces_new: 'Räume (Neu)',
    recycler: 'Recycler',
    marketplace: 'Marktplatz',
    bots: 'Bots',
    pets: 'Haustiere',
    pets2: 'Haustiere (2)',
    pets3: 'Haustiere (3)',
    soundmachine: 'Soundmaschine',
    guilds: 'Gilden',
    guild_furni: 'Gilden-Möbel',
    guild_forum: 'Gilden-Forum',
    roomads: 'Raum-Werbung',
    plasto: 'Plasto',
    collectibles: 'Sammlerstücke',
    petcustomization: 'Pet-Customization',
};
