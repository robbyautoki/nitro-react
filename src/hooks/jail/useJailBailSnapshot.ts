import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useState } from 'react';
import { useMessageEvent } from '../events';

export type JailBailSnapshot = {
    priceDiamonds: number;
    remainingMinutes: number;
    multiplier: number;
    escalationLevel: number;
    isMostWanted: boolean;
    diamondsBalance: number;
    canAfford: boolean;
    arrests24h: number;
    arrests7d: number;
    totalArrests: number;
    error?: string;
};

export type JailBailResult = {
    ok: boolean;
    message: string;
};

type SnapshotListener = (state: JailBailSnapshot | null) => void;
type ResultListener = (result: JailBailResult) => void;

const snapshotListeners = new Set<SnapshotListener>();
const resultListeners = new Set<ResultListener>();
let current: JailBailSnapshot | null = null;

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

export function useJailBailSnapshot(): {
    snapshot: JailBailSnapshot | null;
    onResult: (cb: ResultListener) => () => void;
} {
    const [ state, setState ] = useState<JailBailSnapshot | null>(current);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        if (parser.type === 'jail.bail.snapshot') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<JailBailSnapshot>(payload);
            if (!decoded) return;
            current = decoded;
            snapshotListeners.forEach(l => l(decoded));
            return;
        }

        if (parser.type === 'jail.bail.result') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<JailBailResult>(payload);
            if (!decoded) return;
            resultListeners.forEach(l => l(decoded));
        }
    });

    useEffect(() => {
        const l: SnapshotListener = next => setState(next);
        snapshotListeners.add(l);
        setState(current);
        return () => {
            snapshotListeners.delete(l);
        };
    }, []);

    const onResult = useMemo(() => (cb: ResultListener) => {
        resultListeners.add(cb);
        return () => { resultListeners.delete(cb); };
    }, []);

    return { snapshot: state, onResult };
}
