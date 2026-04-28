import { useEffect, useMemo, useState } from 'react';

export type JailDialogId = 'shop' | 'rank' | 'cigarettes' | 'bail' | 'minigames';

type DialogState = {
    open: Record<JailDialogId, boolean>;
    zIndex: Record<JailDialogId, number>;
    position: Record<JailDialogId, { x: number; y: number } | null>;
};

type Listener = (s: DialogState) => void;

const Z_BASE = 100;
const Z_STEP = 1;
let zCounter = Z_BASE;

const initial: DialogState = {
    open: { shop: false, rank: false, cigarettes: false, bail: false, minigames: false },
    zIndex: { shop: Z_BASE, rank: Z_BASE, cigarettes: Z_BASE, bail: Z_BASE, minigames: Z_BASE },
    position: { shop: null, rank: null, cigarettes: null, bail: null, minigames: null }
};

let state: DialogState = initial;
const listeners = new Set<Listener>();

function broadcast() {
    listeners.forEach(l => l(state));
}

function nextPosition(id: JailDialogId): { x: number; y: number } {
    // Cascade dialogs from a base offset, with per-dialog stagger
    const baseX = 80;
    const baseY = 60;
    const offsets: Record<JailDialogId, number> = {
        shop: 0,
        rank: 1,
        cigarettes: 2,
        bail: 3,
        minigames: 4
    };
    const step = offsets[id] ?? 0;
    return {
        x: baseX + step * 32,
        y: baseY + step * 32
    };
}

export function openJailDialog(id: JailDialogId) {
    zCounter += Z_STEP;
    state = {
        open: { ...state.open, [id]: true },
        zIndex: { ...state.zIndex, [id]: zCounter },
        position: { ...state.position, [id]: state.position[id] ?? nextPosition(id) }
    };
    broadcast();
}

export function closeJailDialog(id: JailDialogId) {
    state = {
        ...state,
        open: { ...state.open, [id]: false }
    };
    broadcast();
}

export function bringJailDialogToFront(id: JailDialogId) {
    if (!state.open[id]) return;
    zCounter += Z_STEP;
    state = {
        ...state,
        zIndex: { ...state.zIndex, [id]: zCounter }
    };
    broadcast();
}

export function setJailDialogPosition(id: JailDialogId, position: { x: number; y: number }) {
    state = {
        ...state,
        position: { ...state.position, [id]: position }
    };
    broadcast();
}

export function closeAllJailDialogs() {
    state = {
        ...state,
        open: { shop: false, rank: false, cigarettes: false, bail: false, minigames: false }
    };
    broadcast();
}

export function useJailDialogManager() {
    const [ snap, setSnap ] = useState<DialogState>(state);

    useEffect(() => {
        const l: Listener = next => setSnap(next);
        listeners.add(l);
        setSnap(state);
        return () => {
            listeners.delete(l);
        };
    }, []);

    return useMemo(() => ({
        open: snap.open,
        zIndex: snap.zIndex,
        position: snap.position,
        openDialog: openJailDialog,
        closeDialog: closeJailDialog,
        bringToFront: bringJailDialogToFront,
        setPosition: setJailDialogPosition,
        closeAll: closeAllJailDialogs
    }), [ snap ]);
}
