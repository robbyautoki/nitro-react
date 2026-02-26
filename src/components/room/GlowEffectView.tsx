import { FC, useEffect } from 'react';
import { GlowEffectManager } from '../../api/glow';
import type { GlowType } from '../../api/glow';

export const GlowEffectView: FC<{}> = () =>
{
    useEffect(() =>
    {
        const handler = (e: Event) =>
        {
            const { action, furniId, color, type } = (e as CustomEvent).detail;

            switch(action)
            {
                case 'add':
                    GlowEffectManager.apply(furniId, (type || 'neon') as GlowType, color);
                    break;
                case 'remove':
                    GlowEffectManager.remove(furniId);
                    break;
                case 'clear':
                    GlowEffectManager.clearAll();
                    break;
            }
        };

        window.addEventListener('glow_effect', handler);

        return () =>
        {
            GlowEffectManager.clearAll();
            window.removeEventListener('glow_effect', handler);
        };
    }, []);

    return null;
};
