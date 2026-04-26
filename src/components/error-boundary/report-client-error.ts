// Best-effort error logging to CMS.
// Endpoint: POST /api/client-errors  (CORS-enabled)
// Fail-soft: never throws, never blocks the UI.

interface ClientErrorPayload
{
    kind: 'react' | 'window' | 'unhandledrejection';
    message: string;
    stack?: string | null;
    componentStack?: string | null;
    url?: string | null;
    userAgent?: string | null;
}

const ENDPOINT = (() =>
{
    if(typeof window === 'undefined') return null;
    const host = window.location.hostname;
    if(host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3030/api/client-errors';
    return 'https://www.bahhos.de/api/client-errors';
})();

const RECENT_KEYS = new Set<string>();
const RECENT_LIMIT = 10;

function dedupeKey(p: ClientErrorPayload): string
{
    return `${ p.kind }:${ p.message }`.slice(0, 200);
}

export function reportClientError(payload: Omit<ClientErrorPayload, 'url' | 'userAgent'>): void
{
    if(!ENDPOINT) return;

    try
    {
        const enriched: ClientErrorPayload = {
            ...payload,
            url: typeof window !== 'undefined' ? window.location.href : null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        };

        const key = dedupeKey(enriched);
        if(RECENT_KEYS.has(key)) return;
        RECENT_KEYS.add(key);
        if(RECENT_KEYS.size > RECENT_LIMIT)
        {
            // drop oldest (Set keeps insertion order)
            const first = RECENT_KEYS.values().next().value;
            if(first !== undefined) RECENT_KEYS.delete(first);
        }

        const body = JSON.stringify(enriched);

        // sendBeacon ist optimal: feuert auch beim Unload, blockiert nicht
        if(typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function')
        {
            const blob = new Blob([ body ], { type: 'application/json' });
            navigator.sendBeacon(ENDPOINT, blob);
            return;
        }

        // Fallback: fetch keepalive
        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
            credentials: 'omit',
        }).catch(() => {});
    }
    catch
    {
        // never throw from a logger
    }
}
