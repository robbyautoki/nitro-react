import { useCallback, useEffect, useState } from 'react';

/**
 * Persistente Pinned-Rooms (Favoriten) via localStorage.
 * Gespeichert wird nur die roomId — Metadaten kommen bei der nächsten Suche aus dem Server.
 */
const PINNED_KEY = 'nitro.navigator.pinnedRooms';
const RECENT_KEY = 'nitro.navigator.recentRooms';
const RECENT_MAX = 8;

function readSet(key: string): number[]
{
    try
    {
        const raw = localStorage.getItem(key);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)) return [];
        return parsed.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    }
    catch
    {
        return [];
    }
}

function writeSet(key: string, ids: number[]): void
{
    try { localStorage.setItem(key, JSON.stringify(ids)); }
    catch { /* noop */ }
}

export const useNavigatorPinnedRooms = () =>
{
    const [ pinnedIds, setPinnedIds ] = useState<number[]>(() => readSet(PINNED_KEY));

    useEffect(() => writeSet(PINNED_KEY, pinnedIds), [ pinnedIds ]);

    const togglePinned = useCallback((roomId: number) =>
    {
        setPinnedIds(prev =>
        {
            if(prev.includes(roomId)) return prev.filter(id => id !== roomId);
            return [ roomId, ...prev ].slice(0, 32);
        });
    }, []);

    const isPinned = useCallback((roomId: number) => pinnedIds.includes(roomId), [ pinnedIds ]);

    return { pinnedIds, togglePinned, isPinned };
};

export const useNavigatorRecentRooms = () =>
{
    const [ recentIds, setRecentIds ] = useState<number[]>(() => readSet(RECENT_KEY));

    useEffect(() => writeSet(RECENT_KEY, recentIds), [ recentIds ]);

    const recordVisit = useCallback((roomId: number) =>
    {
        if(!Number.isFinite(roomId) || roomId <= 0) return;
        setRecentIds(prev =>
        {
            const filtered = prev.filter(id => id !== roomId);
            return [ roomId, ...filtered ].slice(0, RECENT_MAX);
        });
    }, []);

    const clearRecents = useCallback(() => setRecentIds([]), []);

    return { recentIds, recordVisit, clearRecents };
};
