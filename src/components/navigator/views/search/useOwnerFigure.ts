import { useEffect, useState } from 'react';

/**
 * Resolves a Bahhos user's figure (look) string by user ID. Used by the
 * Navigator owner-head avatar and similar surfaces that have only `ownerId` /
 * `ownerName` from the renderer but need to show the *real* avatar via our
 * self-hosted imager.
 *
 * - Process-local cache (Map) so we don't hammer the API for the same user
 *   while the Navigator is open.
 * - 5-min HTTP browser cache (set by the API) covers cross-tab + reloads.
 * - Single + batch endpoints supported by /api/users/figure.
 */

/**
 * Imager base URL.
 * - Production (play.bahhos.de): https://imager.bahhos.de/avatarimage
 * - Local dev (localhost):       http://localhost:8081/avatarimage
 *
 * Falls back to prod URL on the server side / unknown hosts.
 */
const getImagerBaseUrl = (): string =>
{
    if(typeof window === 'undefined') return 'https://imager.bahhos.de/avatarimage';
    const host = window.location.hostname;
    if(host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8081/avatarimage';
    return 'https://imager.bahhos.de/avatarimage';
};

const FIGURE_BY_ID = new Map<number, string | null>();
const PENDING_BY_ID = new Map<number, Promise<string | null>>();

const getApiBaseUrl = (): string =>
{
    if(typeof window === 'undefined') return '';
    return window.location.hostname.includes('bahhos.de') ? 'https://www.bahhos.de' : '';
};

async function fetchFigureById(ownerId: number): Promise<string | null>
{
    const baseUrl = getApiBaseUrl();
    const url = `${ baseUrl }/api/users/figure?id=${ ownerId }`;

    try
    {
        const res = await fetch(url, { credentials: 'omit' });
        if(!res.ok) return null;
        const data = await res.json() as { look?: string };
        return typeof data.look === 'string' && data.look.length > 0 ? data.look : null;
    }
    catch
    {
        return null;
    }
}

/** Returns the figure for `ownerId` or `null` while loading / on error. */
export function useOwnerFigure(ownerId: number | null | undefined): string | null
{
    const cached = (ownerId && ownerId > 0) ? (FIGURE_BY_ID.get(ownerId) ?? null) : null;
    const [ figure, setFigure ] = useState<string | null>(cached);

    useEffect(() =>
    {
        if(!ownerId || ownerId <= 0)
        {
            setFigure(null);
            return;
        }

        const fromCache = FIGURE_BY_ID.get(ownerId);
        if(typeof fromCache !== 'undefined')
        {
            setFigure(fromCache);
            return;
        }

        let cancelled = false;

        let pending = PENDING_BY_ID.get(ownerId);
        if(!pending)
        {
            pending = fetchFigureById(ownerId).then(look =>
            {
                FIGURE_BY_ID.set(ownerId, look);
                PENDING_BY_ID.delete(ownerId);
                return look;
            });
            PENDING_BY_ID.set(ownerId, pending);
        }

        pending.then(look =>
        {
            if(!cancelled) setFigure(look);
        });

        return () => { cancelled = true; };
    }, [ ownerId ]);

    return figure;
}

/**
 * Builds a Bahhos imager URL for the given figure.
 * @param figure  full look string, e.g. 'hr-...-...'
 * @param size    imager size token: 's' = small head (32-ish px). default 's'.
 */
export function getOwnerHeadUrl(figure: string, size: 's' | 'm' | 'l' = 's'): string
{
    const params = new URLSearchParams({
        figure,
        headonly: '1',
        size,
        direction: '2',
        head_direction: '2',
        gesture: 'sml',
        action: 'std',
        // Tight head bbox (no transparent body margin) so the sprite renders
        // crisp at small sizes without `object-cover` cropping the hair.
        crop: 'head',
        padding: '0',
    });
    return `${ getImagerBaseUrl() }?${ params.toString() }`;
}
