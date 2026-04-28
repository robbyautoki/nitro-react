// ─── Catalog Tile Grid — global compact look ────────────────────────────────
// Single source of truth for every tile-style grid in the catalog (default
// pages, bundles, color-grouping, pets, virtualised lists, color/badge
// pickers). Adjust here, all grids follow.

// Main grid for furni/bundle tiles. minmax(56px, 1fr) → tiles are at minimum
// 56px wide and stretch to fill the row evenly.
export const CATALOG_GRID_CLASSES =
    'grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1';

// Container around the grid: soft surface, no extra ring (the main panel
// already provides the frame).
export const CATALOG_GRID_CONTAINER_CLASSES =
    'rounded-xl bg-bg-weak-50/40 p-2';

// Smaller picker grid used inside the product detail view (color picker,
// badge picker). Slightly tighter than the main grid.
export const CATALOG_PICKER_GRID_CLASSES =
    'grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1';
