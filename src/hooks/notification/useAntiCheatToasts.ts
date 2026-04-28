import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { useMessageEvent } from '../events';

export type AntiCheatLevel = 'warn' | 'critical';

export interface AntiCheatToast
{
    id: number;
    event: string;
    level: AntiCheatLevel;
    minutes?: number;
}

const ANTI_CHEAT_TTL = 6000;

const useAntiCheatToastsState = () =>
{
    const [ toasts, setToasts ] = useState<AntiCheatToast[]>([]);

    const dismiss = useCallback((id: number) =>
    {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() =>
    {
        if(toasts.length === 0) return;
        const timers = toasts.map(t => setTimeout(() =>
        {
            setToasts(curr => curr.filter(x => x.id !== t.id));
        }, ANTI_CHEAT_TTL));
        return () => { timers.forEach(clearTimeout); };
    }, [ toasts ]);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.type === 'jail.anticheat.warn')
        {
            const eventName = parser.parameters?.get('event') || 'unbekannt';
            setToasts(curr => [
                ...curr,
                { id: Date.now(), event: eventName, level: 'warn' }
            ]);
        }
        else if(parser.type === 'jail.anticheat.extended')
        {
            const eventName = parser.parameters?.get('event') || 'unbekannt';
            const minutes = parseInt(parser.parameters?.get('minutes') || '0', 10);
            setToasts(curr => [
                ...curr,
                { id: Date.now(), event: eventName, level: 'critical', minutes }
            ]);
        }
    });

    return { toasts, dismiss };
};

/**
 * Geteilter Anti-Cheat-Toast-State. Wird in `NotificationCenterView` gemountet,
 * sodass alle Anti-Cheat-Toasts im Unified-Stack erscheinen.
 */
export const useAntiCheatToasts = () => useBetween(useAntiCheatToastsState);
