import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useState } from 'react';
import { useMessageEvent } from '../events';
import { closeAllJailDialogs } from './useJailDialogManager';

export type JailTaskState = {
    key: string;
    label: string;
    description: string;
    zoneType: string;
    requiredSeconds: number;
    progressSeconds: number;
    completedCount: number;
    maxPerCase: number;
    reductionSeconds: number;
    cooldownRemainingSeconds: number;
};

export type JailPrisonerState = {
    caseId: number;
    username: string;
    reason: string;
    status: string;
    jailMinutes: number;
    until: number;
    reducedSeconds: number;
    jailRoomId: number;
    tasks: JailTaskState[];
};

type Listener = (state: JailPrisonerState | null) => void;
type ConfigListener = (jailRoomId: number) => void;

const listeners = new Set<Listener>();
const configListeners = new Set<ConfigListener>();
let currentState: JailPrisonerState | null = null;
let globalJailRoomId = 0;

const STALE_GRACE_MS = 5_000;

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

function isStale(state: JailPrisonerState | null): boolean {
    if (!state) return false;
    if (!state.until) return false; // permanent — never stale
    return state.until + STALE_GRACE_MS < Date.now();
}

function setState(next: JailPrisonerState | null) {
    const wasActive = currentState !== null;
    if (isStale(next)) {
        currentState = null;
    } else {
        currentState = next;
    }
    if (wasActive && currentState === null) {
        // Inmate just got released — auto-close all jail dialogs as a safety net
        // independent of which channel (timer.end, prisoner.state, stale-check) triggered it.
        closeAllJailDialogs();
    }
    listeners.forEach(l => l(currentState));
}

function setGlobalJailRoomId(id: number) {
    globalJailRoomId = id;
    configListeners.forEach(l => l(id));
}

/**
 * Shared global hook — subscribes ONCE to NotificationDialogMessageEvent
 * for jail.prisoner.state / jail.timer / jail.timer.end / jail.config and
 * broadcasts the current PrisonerState plus globalJailRoomId to all hook
 * consumers.
 */
export function useJailPrisonerState(): JailPrisonerState | null {
    const [ state, setLocal ] = useState<JailPrisonerState | null>(currentState);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        switch (parser.type) {
            case 'jail.prisoner.state': {
                const payload = parser.parameters?.get('payload') || '';
                const decoded = decodePayload<JailPrisonerState>(payload);
                if (!decoded) break;
                if (decoded.jailRoomId && decoded.jailRoomId > 0) {
                    setGlobalJailRoomId(decoded.jailRoomId);
                }
                // Status nicht aktiv (z.B. released, bailed) → alle Dialoge zu.
                if (decoded.status && decoded.status !== 'active') {
                    setState(null);
                    closeAllJailDialogs();
                    break;
                }
                setState(decoded);
                break;
            }
            case 'jail.timer': {
                const until = parseInt(parser.parameters?.get('until') || '0', 10);
                const reason = parser.parameters?.get('reason') || '';
                if (currentState) {
                    setState({ ...currentState, until, reason: reason || currentState.reason });
                } else {
                    setState({
                        caseId: 0,
                        username: '',
                        reason,
                        status: 'active',
                        jailMinutes: 0,
                        until,
                        reducedSeconds: 0,
                        // Preserve last known global jailRoomId so the FAB stays
                        // visible even if the server only sends a timer-fallback
                        // after a reconnect.
                        jailRoomId: globalJailRoomId,
                        tasks: []
                    });
                }
                break;
            }
            case 'jail.timer.end': {
                setState(null);
                closeAllJailDialogs();
                break;
            }
            case 'jail.config': {
                const id = parseInt(parser.parameters?.get('jailRoomId') || '0', 10);
                if (id > 0) setGlobalJailRoomId(id);
                break;
            }
        }
    });

    useEffect(() => {
        const l: Listener = next => setLocal(next);
        listeners.add(l);
        // Mount-time stale cleanup: drop any state whose timer is already over.
        if (isStale(currentState)) {
            currentState = null;
            closeAllJailDialogs();
        }
        setLocal(currentState);
        return () => {
            listeners.delete(l);
        };
    }, []);

    return useMemo(() => state, [ state ]);
}

/**
 * Returns the last known global jailRoomId, even when the user is not currently
 * jailed. Used by the FAB to fall back to a global value if a `jail.timer`
 * payload didn't carry a per-prisoner jailRoomId.
 */
export function useJailGlobalRoomId(): number {
    const [ id, setId ] = useState<number>(globalJailRoomId);
    useEffect(() => {
        const l: ConfigListener = next => setId(next);
        configListeners.add(l);
        setId(globalJailRoomId);
        return () => {
            configListeners.delete(l);
        };
    }, []);
    return id;
}
