import { useEffect, useState } from 'react';
import { GetConfiguration } from '../api';

export interface SeasonalTheme
{
    name: string;
    type: string;
    bgColor: string;
    particleColors: string[];
    particleCount: number;
    particleSpeed: number;
    bgImageUrl: string | null;
    overlayImageUrl: string | null;
    accentColor: string;
    accentGlow: string | null;
}

const DEFAULT_THEME: SeasonalTheme = {
    name: 'Standard',
    type: 'default',
    bgColor: '#000000',
    particleColors: ['#ffffff'],
    particleCount: 200,
    particleSpeed: 0.1,
    bgImageUrl: null,
    overlayImageUrl: null,
    accentColor: '#ffffff',
    accentGlow: null,
};

let cachedTheme: SeasonalTheme | null = null;

export const useSeasonalTheme = (): SeasonalTheme =>
{
    const [ theme, setTheme ] = useState<SeasonalTheme>(cachedTheme || DEFAULT_THEME);

    useEffect(() =>
    {
        if(cachedTheme) return;

        const fetchTheme = async () =>
        {
            try
            {
                const cmsUrl = GetConfiguration<string>('url.prefix', '');
                const response = await fetch(`${ cmsUrl }/api/theme`);

                if(!response.ok) return;

                const data = await response.json();
                cachedTheme = data;
                setTheme(data);

                document.documentElement.style.setProperty('--theme-accent', data.accentColor);
                document.documentElement.style.setProperty('--theme-bg', data.bgColor);

                if(data.accentGlow)
                {
                    document.documentElement.style.setProperty('--theme-glow', data.accentGlow);
                }
            }
            catch
            {
                // Fallback to default
            }
        };

        fetchTheme();
    }, []);

    return theme;
};
