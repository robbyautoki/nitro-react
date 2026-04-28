import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useMessageEvent } from '../events';

export type JailCigaretteTransaction = {
    amount: number;
    reason: string;
    timestamp: number;
};

export type JailCigaretteSnapshot = {
    balance: number;
    earnedLifetime: number;
    spentLifetime: number;
    recent: JailCigaretteTransaction[];
};

type Listener = (state: JailCigaretteSnapshot | null) => void;

const listeners = new Set<Listener>();
let current: JailCigaretteSnapshot | null = null;

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

export function useJailCigaretteSnapshot(): JailCigaretteSnapshot | null {
    const [ state, setState ] = useState<JailCigaretteSnapshot | null>(current);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();
        if (parser.type !== 'jail.cigarette.snapshot') return;
        const payload = parser.parameters?.get('payload') || '';
        const decoded = decodePayload<JailCigaretteSnapshot>(payload);
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
