import { useEffect, useState } from 'react';
import { GetConfiguration } from '../../../api';

export interface DurabilityData
{
    itemId: number;
    durabilityRemaining: number;
    status: string;
    maxDays: number;
    graceDays: number;
    graceExpiresAt: string | null;
    itemName: string;
    tradeValue: number;
    repairCost: number;
}

const durabilityCache = new Map<number, DurabilityData | null>();

export const useFurnitureDurability = (itemId: number) =>
{
    const [ durabilityData, setDurabilityData ] = useState<DurabilityData | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);

    useEffect(() =>
    {
        if(!itemId || itemId <= 0)
        {
            setDurabilityData(null);
            return;
        }

        if(durabilityCache.has(itemId))
        {
            setDurabilityData(durabilityCache.get(itemId));
            return;
        }

        let cancelled = false;

        setIsLoading(true);

        const cmsUrl = GetConfiguration<string>('url.prefix', '');

        fetch(`${ cmsUrl }/api/furniture/durability?itemId=${ itemId }`)
            .then(res => res.json())
            .then(data =>
            {
                if(cancelled) return;

                const result = data as DurabilityData | null;
                durabilityCache.set(itemId, result);
                setDurabilityData(result);
            })
            .catch(() =>
            {
                if(!cancelled) durabilityCache.set(itemId, null);
            })
            .finally(() =>
            {
                if(!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [ itemId ]);

    return { durabilityData, isLoading };
};
