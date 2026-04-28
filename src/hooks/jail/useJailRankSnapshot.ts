import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useMessageEvent } from '../events';

export type JailRankThresholds = {
    rookie: number;
    regular: number;
    veteran: number;
    boss: number;
    legend: number;
};

export type JailRankSnapshot = {
    currentRank: string;
    nextRank: string;
    totalSeconds: number;
    hours: number;
    minutes: number;
    jailCountLifetime: number;
    bricksBrokenLifetime: number;
    escapesAttempted: number;
    nextThresholdSeconds: number;
    thresholds: JailRankThresholds;
};

type Listener = (state: JailRankSnapshot | null) => void;

const listeners = new Set<Listener>();
let current: JailRankSnapshot | null = null;

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

export function useJailRankSnapshot(): JailRankSnapshot | null {
    const [ state, setState ] = useState<JailRankSnapshot | null>(current);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();
        if (parser.type !== 'jail.rank.snapshot') return;
        const payload = parser.parameters?.get('payload') || '';
        const decoded = decodePayload<JailRankSnapshot>(payload);
        if (!decoded) return;
        current = decoded;
        listeners.forEach(l => l(decoded));
    });

    useEffect(() => {
        const l: Listener = next => setState(next);
        listeners.add(l);
        setState(current);
        return () => {
            listeners.delete(l);
        };
    }, []);

    return state;
}
