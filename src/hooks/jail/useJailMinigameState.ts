import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useState } from 'react';
import { useMessageEvent } from '../events';

export type BrickState = {
    game: 'brick_breaker';
    clicks: number;
    target: number;
    cooldownMs: number;
    completedThisCase: number;
};

export type RaceState = {
    game: 'yard_race';
    running: boolean;
    checkpoints: number;
    target: number;
    requiredSeconds: number;
    remainingMs: number;
    cooldownRemainingMs: number;
    completedThisCase: number;
};

export type LockpickState = {
    game: 'lockpick_master';
    running: boolean;
    length: number;
    attemptsLeft: number;
    maxAttempts: number;
    cooldownRemainingMs: number;
    lastCorrectPositions?: number;
    completedThisCase: number;
};

export type MinigameStates = {
    brick: BrickState | null;
    race: RaceState | null;
    pick: LockpickState | null;
};

export type MinigameResult = {
    ok: boolean;
    message: string;
};

type StateListener = (s: MinigameStates) => void;
type ResultListener = (r: MinigameResult) => void;

const stateListeners = new Set<StateListener>();
const resultListeners = new Set<ResultListener>();

let current: MinigameStates = { brick: null, race: null, pick: null };

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

function broadcast() {
    stateListeners.forEach(l => l(current));
}

export function useJailMinigameState(): {
    states: MinigameStates;
    onResult: (cb: ResultListener) => () => void;
} {
    const [ snap, setSnap ] = useState<MinigameStates>(current);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        if (parser.type === 'jail.minigame.state') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<{ game: string } & any>(payload);
            if (!decoded) return;

            switch (decoded.game) {
                case 'brick_breaker':
                    current = { ...current, brick: decoded as BrickState };
                    break;
                case 'yard_race':
                    current = { ...current, race: decoded as RaceState };
                    break;
                case 'lockpick_master':
                    current = { ...current, pick: decoded as LockpickState };
                    break;
            }
            broadcast();
            return;
        }

        if (parser.type === 'jail.minigame.result') {
            const payload = parser.parameters?.get('payload') || '';
            const decoded = decodePayload<MinigameResult>(payload);
            if (!decoded) return;
            resultListeners.forEach(l => l(decoded));
        }
    });

    useEffect(() => {
        const l: StateListener = next => setSnap(next);
        stateListeners.add(l);
        setSnap(current);
        return () => {
            stateListeners.delete(l);
        };
    }, []);

    const onResult = useMemo(() => (cb: ResultListener) => {
        resultListeners.add(cb);
        return () => { resultListeners.delete(cb); };
    }, []);

    return { states: snap, onResult };
}
