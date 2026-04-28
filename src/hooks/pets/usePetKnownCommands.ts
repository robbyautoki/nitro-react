// =============================================================================
// usePetKnownCommands — pet_known_commands für ein Pet vom CMS holen
// =============================================================================
// Lädt die persistent gelernten Vanilla-Commands für eine petId vom
// CMS (`/api/pets/[petId]/known-commands`). Wird im Train-Panel mit Vanilla
// `enabledCommands[]` zu `mastered = enabledCommands ∪ knownCommandIds`
// kombiniert.
//
// Cache: 30s pro petId (User trainiert i. d. R. mehrere Tricks hintereinander,
// Re-Fetch nach Klick wäre zu aggressiv). `refresh()` zwingt einen sofortigen
// Re-Fetch — das Panel ruft das nach erfolgreichem Trainings-Klick.
//
// Performance: lokaler Map-Cache pro petId (kein useBetween-Sharing — jedes
// geöffnete Panel will für sein Pet aktuelle Daten). Single-Flight pro petId.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { GetConfiguration } from '../../api';

const CACHE_TTL_MS = 30_000;

const getCmsUrl = () => GetConfiguration<string>('url.prefix', 'http://localhost:3030');

interface CacheEntry {
    commandIds: number[];
    fetchedAt: number;
}

const cache = new Map<number, CacheEntry>();
const inflight = new Map<number, Promise<number[]>>();

const fetchKnownCommands = async (petId: number): Promise<number[]> =>
{
    const now = Date.now();
    const cached = cache.get(petId);
    if(cached && (now - cached.fetchedAt) < CACHE_TTL_MS) return cached.commandIds;

    const existing = inflight.get(petId);
    if(existing) return existing;

    const promise = (async () =>
    {
        try
        {
            const res = await fetch(`${ getCmsUrl() }/api/pets/${ petId }/known-commands`, {
                method: 'GET',
                credentials: 'include'
            });
            if(!res.ok) throw new Error(`HTTP ${ res.status }`);
            const body = await res.json() as { commandIds: number[] };
            const ids = Array.isArray(body?.commandIds) ? body.commandIds : [];
            cache.set(petId, { commandIds: ids, fetchedAt: Date.now() });
            return ids;
        }
        finally
        {
            inflight.delete(petId);
        }
    })();

    inflight.set(petId, promise);
    return promise;
};

export interface UsePetKnownCommandsResult
{
    knownCommandIds: number[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const usePetKnownCommands = (petId: number | null): UsePetKnownCommandsResult =>
{
    const [ knownCommandIds, setKnownCommandIds ] = useState<number[]>(petId ? cache.get(petId)?.commandIds ?? [] : []);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const lastPetIdRef = useRef<number | null>(null);

    const load = useCallback(async (force = false) =>
    {
        if(!petId) { setKnownCommandIds([]); return; }
        if(force) cache.delete(petId);
        setIsLoading(true);
        setError(null);
        try
        {
            const ids = await fetchKnownCommands(petId);
            setKnownCommandIds(ids);
        }
        catch(e: any)
        {
            setError(e?.message ?? 'Pet-Trainings-Daten konnten nicht geladen werden');
            setKnownCommandIds([]);
        }
        finally
        {
            setIsLoading(false);
        }
    }, [ petId ]);

    useEffect(() =>
    {
        if(!petId) { setKnownCommandIds([]); return; }
        if(lastPetIdRef.current !== petId)
        {
            lastPetIdRef.current = petId;
            load();
        }
    }, [ petId, load ]);

    const refresh = useCallback(async () => { await load(true); }, [ load ]);

    return { knownCommandIds, isLoading, error, refresh };
};
