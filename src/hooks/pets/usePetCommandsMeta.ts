// =============================================================================
// usePetCommandsMeta — geteilter Cache für pet_commands_data
// =============================================================================
// Holt EINMAL pro Session (max. 1h Cache) die statischen Pet-Command-Metadaten
// vom CMS (`/api/pets/commands-meta`) und stellt sie allen Komponenten via
// `useBetween` zur Verfügung. Das Train-Panel zeigt damit:
//   • required_level (Lock-Gate)
//   • reward_xp (XP-Belohnung)
//   • cost_happyness / cost_energy (zukünftig optional)
//
// Performance: Single-Flight (parallele Aufrufe teilen denselben Promise).
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfiguration } from '../../api';

export interface PetCommandMeta
{
    commandId: number;
    text: string;
    requiredLevel: number;
    rewardXp: number;
    costHappiness: number;
    costEnergy: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

const getCmsUrl = () => GetConfiguration<string>('url.prefix', 'http://localhost:3030');

let cachedAt = 0;
let cachedData: PetCommandMeta[] | null = null;
let inflight: Promise<PetCommandMeta[]> | null = null;

const fetchCommandsMeta = async (): Promise<PetCommandMeta[]> =>
{
    const now = Date.now();

    if(cachedData && (now - cachedAt) < CACHE_TTL_MS) return cachedData;
    if(inflight) return inflight;

    inflight = (async () =>
    {
        try
        {
            const res = await fetch(`${ getCmsUrl() }/api/pets/commands-meta`, {
                method: 'GET',
                credentials: 'include'
            });

            if(!res.ok) throw new Error(`HTTP ${ res.status }`);

            const body = await res.json() as { commands: PetCommandMeta[] };
            cachedData = Array.isArray(body?.commands) ? body.commands : [];
            cachedAt = Date.now();
            return cachedData;
        }
        finally
        {
            inflight = null;
        }
    })();

    return inflight;
};

const usePetCommandsMetaState = () =>
{
    const [ commands, setCommands ] = useState<PetCommandMeta[] | null>(cachedData);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);

    const load = useCallback(async () =>
    {
        if(commands && (Date.now() - cachedAt) < CACHE_TTL_MS) return;
        setIsLoading(true);
        setError(null);
        try
        {
            const data = await fetchCommandsMeta();
            setCommands(data);
        }
        catch(e: any)
        {
            setError(e?.message ?? 'Pet-Befehlsdaten konnten nicht geladen werden');
        }
        finally
        {
            setIsLoading(false);
        }
    }, [ commands ]);

    useEffect(() => { load(); }, [ load ]);

    return { commands, isLoading, error, reload: load };
};

export const usePetCommandsMeta = () => useBetween(usePetCommandsMetaState);

/**
 * Convenience: Map-Lookup. Nutzt den Snapshot aus dem geteilten Hook und
 * liefert ein effizientes Lookup-Objekt {commandId → meta}.
 */
export const buildCommandMetaMap = (commands: PetCommandMeta[] | null): Record<number, PetCommandMeta> =>
{
    const map: Record<number, PetCommandMeta> = {};
    if(!commands) return map;
    for(const c of commands) map[c.commandId] = c;
    return map;
};
