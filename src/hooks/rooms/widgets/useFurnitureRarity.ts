import { useEffect, useState } from 'react';
import { GetConfiguration } from '../../../api';

export interface RarityData
{
    rarityType: {
        name: string;
        displayName: string;
        colorPrimary: string;
        colorSecondary: string;
    };
    setName: string | null;
    isOg: boolean;
    circulation: number;
    tradeValue: number | null;
}

const rarityCache = new Map<number, RarityData | null>();

export const useFurnitureRarity = (typeId: number) =>
{
    const [ rarityData, setRarityData ] = useState<RarityData | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);

    useEffect(() =>
    {
        if(!typeId || typeId <= 0)
        {
            setRarityData(null);
            return;
        }

        if(rarityCache.has(typeId))
        {
            setRarityData(rarityCache.get(typeId));
            return;
        }

        let cancelled = false;

        setIsLoading(true);

        const cmsUrl = GetConfiguration<string>('url.prefix', '');

        fetch(`${ cmsUrl }/api/furniture/rarity?typeId=${ typeId }`)
            .then(res => res.json())
            .then(data =>
            {
                if(cancelled) return;

                const result = data as RarityData | null;
                rarityCache.set(typeId, result);
                setRarityData(result);
            })
            .catch(() =>
            {
                if(!cancelled) rarityCache.set(typeId, null);
            })
            .finally(() =>
            {
                if(!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [ typeId ]);

    return { rarityData, isLoading };
};
