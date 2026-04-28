import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { useMessageEvent } from '../events';

interface SpotlightState
{
    ids: Set<number>;
    expires: Map<number, number>;
}

const useSpotlightState = () =>
{
    const [ state, setState ] = useState<SpotlightState>({ ids: new Set(), expires: new Map() });

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.type !== 'spotlight.list') return;
        try
        {
            const payload = parser.parameters?.get('payload') || '';
            const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
            const data = JSON.parse(new TextDecoder().decode(bytes)) as {
                roomIds: number[];
                expires?: Record<string, number>;
                updatedAt?: number;
            };

            const ids = new Set(Array.isArray(data.roomIds) ? data.roomIds : []);
            const expires = new Map<number, number>();

            if(data.expires && typeof data.expires === 'object')
            {
                for(const [ key, val ] of Object.entries(data.expires))
                {
                    const rid = Number(key);
                    const exp = Number(val);
                    if(Number.isFinite(rid) && Number.isFinite(exp)) expires.set(rid, exp);
                }
            }

            setState({ ids, expires });
        }
        catch { /* noop */ }
    });

    return {
        isSpotlight: (id: number) => state.ids.has(id),
        getExpiresAt: (id: number): number | null => state.expires.get(id) ?? null,
        ids: state.ids,
        expires: state.expires,
    };
};

export const useSpotlight = () => useBetween(useSpotlightState);
