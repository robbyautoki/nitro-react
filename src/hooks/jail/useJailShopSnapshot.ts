import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useState } from 'react';
import { useMessageEvent } from '../events';

export type JailShopItem = {
    key: string;
    name: string;
    description: string;
    price: number;
    minRank: string;
    cooldownSeconds: number;
    icon: string;
    category: string;
};

export type JailShopOwned = {
    key: string;
    quantity: number;
    purchasedAt: number;
};

export type JailShopSnapshot = {
    items: JailShopItem[];
    owned: JailShopOwned[];
    balance: number;
    currentRank: string;
    caseId: number;
    dailyBonusAvailable: boolean;
    cooldownRemaining: Record<string, number>;
    canAfford: Record<string, boolean>;
    rankOk: Record<string, boolean>;
};

export type JailShopResult = {
    ok: boolean;
    message: string;
};

type SnapshotListener = (state: JailShopSnapshot | null) => void;
type ResultListener = (result: JailShopResult) => void;

const snapshotListeners = new Set<SnapshotListener>();
const resultListeners = new Set<ResultListener>();
let currentSnapshot: JailShopSnapshot | null = null;

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

export function useJailShopSnapshot(): {
    snapshot: JailShopSnapshot | null;
    onResult: (cb: ResultListener) => () => void;
} {
    const [ snapshot, setSnapshot ] = useState<JailShopSnapshot | null>(currentSnapshot);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        if (parser.type === 'jail.shop.snapshot') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<JailShopSnapshot>(payload);
            if (!decoded) return;
            currentSnapshot = decoded;
            snapshotListeners.forEach(l => l(decoded));
            return;
        }

        if (parser.type === 'jail.shop.result') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<JailShopResult>(payload);
            if (!decoded) return;
            resultListeners.forEach(l => l(decoded));
        }
    });

    useEffect(() => {
        const l: SnapshotListener = next => setSnapshot(next);
        snapshotListeners.add(l);
        setSnapshot(currentSnapshot);
        return () => {
            snapshotListeners.delete(l);
        };
    }, []);

    const onResult = useMemo(() => (cb: ResultListener) => {
        resultListeners.add(cb);
        return () => { resultListeners.delete(cb); };
    }, []);

    return { snapshot, onResult };
}
