import { RoomEngineEvent, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { Cigarette, Diamond, Gamepad2, Medal, Shield, ShoppingBag } from 'lucide-react';
import { GetRoomSession } from '../../api';
import {
    JailDialogId,
    useJailDialogManager,
    useJailGlobalRoomId,
    useJailPrisonerState,
    useRoomEngineEvent,
    useRoomSessionManagerEvent
} from '../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignPopover from '@/align-ui/components/ui/popover';

const RING_SIZE = 56;
const RING_RADIUS = 24;
const RING_STROKE = 3;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const FULL_DURATION_MS = 30 * 60 * 1000; // assume 30 min jails as visual ceiling

function formatRemaining(until: number): { text: string; totalMs: number } {
    if (!until) return { text: 'Permanent', totalMs: 0 };
    const remaining = Math.max(0, until - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
        text: `${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`,
        totalMs: remaining
    };
}

function sendChat(command: string): boolean {
    const session = GetRoomSession();
    if (!session) return false;
    session.sendChatMessage(command, 0);
    return true;
}

export const JailInmateFabView: FC<{}> = () => {
    const prisoner = useJailPrisonerState();
    const globalJailRoomId = useJailGlobalRoomId();
    const { openDialog } = useJailDialogManager();
    const [ currentRoomId, setCurrentRoomId ] = useState<number>(() => GetRoomSession()?.roomId ?? 0);
    const [ tick, setTick ] = useState(0);
    const [ open, setOpen ] = useState(false);

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event => {
        setCurrentRoomId(event.session?.roomId ?? 0);
    });
    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.STARTED, event => {
        setCurrentRoomId(event.session?.roomId ?? 0);
    });
    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, () => {
        setCurrentRoomId(0);
        setOpen(false);
    });
    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.NORMAL_MODE, event => {
        setCurrentRoomId(event.roomId);
    });
    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED, () => {
        setCurrentRoomId(0);
        setOpen(false);
    });

    const visible = useMemo(() => {
        if (!prisoner) return false;
        if (currentRoomId <= 0) return false;
        const until = prisoner.until ?? 0;
        if (until > 0 && until <= Date.now()) return false;
        const targetRoomId = (prisoner.jailRoomId && prisoner.jailRoomId > 0)
            ? prisoner.jailRoomId
            : globalJailRoomId;
        if (targetRoomId <= 0) return false;
        return currentRoomId === targetRoomId;
    }, [ prisoner, currentRoomId, globalJailRoomId ]);

    useEffect(() => {
        if (!visible) return;
        const id = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(id);
    }, [ visible ]);

    if (!visible) return null;

    const { text: timerText, totalMs: remainingMs } = formatRemaining(prisoner?.until ?? 0);
    const isPermanent = !prisoner?.until || prisoner.until === 0;
    const isUrgent = !isPermanent && remainingMs > 0 && remainingMs < 60_000;
    const isWarning = !isPermanent && remainingMs > 0 && remainingMs < 5 * 60_000;

    // Progress: how much of the jail has elapsed (0..1)
    const totalDuration = isPermanent
        ? FULL_DURATION_MS
        : Math.max(remainingMs + 1, (prisoner?.jailMinutes ?? 0) * 60_000 || FULL_DURATION_MS);
    const remainingFraction = isPermanent ? 1 : Math.max(0, Math.min(1, remainingMs / totalDuration));
    const dashOffset = RING_CIRC * (1 - remainingFraction);

    const ringColor = isUrgent
        ? 'stroke-error-base'
        : isWarning
            ? 'stroke-warning-base'
            : 'stroke-information-base';

    const pillColor = isUrgent
        ? 'bg-error-base text-static-white'
        : isWarning
            ? 'bg-warning-base text-static-white'
            : 'bg-bg-strong-950 text-static-white';

    const runOpen = (id: JailDialogId, cmd: string) => {
        sendChat(cmd);
        openDialog(id);
        setOpen(false);
    };

    return (
        <div className="fixed bottom-3 right-4 z-[71] pointer-events-auto flex items-center gap-2">
            <AlignPopover.Root open={ open } onOpenChange={ setOpen }>
                <AlignPopover.Trigger asChild>
                    <button
                        type="button"
                        aria-label="Bahhos County — Knast Optionen"
                        className={ `group relative flex items-center justify-center rounded-full border border-stroke-soft-200 bg-bg-white-0/95 shadow-complex backdrop-blur-md transition-all hover:scale-105 active:scale-100 ${
                            isUrgent ? 'animate-pulse' : ''
                        }` }
                        style={ { width: RING_SIZE, height: RING_SIZE } }
                    >
                        <svg
                            className="absolute inset-0 -rotate-90"
                            width={ RING_SIZE }
                            height={ RING_SIZE }
                            viewBox={ `0 0 ${ RING_SIZE } ${ RING_SIZE }` }
                            aria-hidden="true"
                        >
                            <circle
                                cx={ RING_SIZE / 2 }
                                cy={ RING_SIZE / 2 }
                                r={ RING_RADIUS }
                                strokeWidth={ RING_STROKE }
                                fill="none"
                                className="stroke-bg-soft-200"
                            />
                            <circle
                                cx={ RING_SIZE / 2 }
                                cy={ RING_SIZE / 2 }
                                r={ RING_RADIUS }
                                strokeWidth={ RING_STROKE }
                                fill="none"
                                strokeLinecap="round"
                                className={ `${ ringColor } transition-[stroke-dashoffset,stroke] duration-500 ease-out` }
                                strokeDasharray={ RING_CIRC }
                                strokeDashoffset={ isPermanent ? 0 : dashOffset }
                            />
                        </svg>
                        <Shield className={ `relative size-6 ${ isUrgent ? 'text-error-base' : 'text-text-strong-950' }` } />
                        { isUrgent && (
                            <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-error-base/40 animate-ping" />
                        ) }
                    </button>
                </AlignPopover.Trigger>
                <AlignPopover.Content
                    side="top"
                    align="end"
                    sideOffset={ 14 }
                    className="w-[260px] p-0"
                >
                    <div className="border-b border-stroke-soft-200 bg-gradient-to-br from-bg-weak-50 to-bg-white-0 p-3">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4 text-error-base" />
                            <div className="text-label-sm font-bold text-text-strong-950">Bahhos County</div>
                        </div>
                        <div className="mt-1 text-paragraph-xs text-text-sub-600">
                            Case #{ prisoner?.caseId || '-' } · { prisoner?.username || '' }
                        </div>
                        <div className="mt-1 font-mono text-label-xs tabular-nums text-text-strong-950">
                            ⏱ { timerText }
                        </div>
                        { prisoner?.reason && (
                            <div className="mt-1 line-clamp-2 text-paragraph-xs text-text-soft-400">
                                „{ prisoner.reason }"
                            </div>
                        ) }
                    </div>
                    <div className="flex flex-col gap-1 p-2">
                        <FabAction icon={ <Gamepad2 className="size-4" /> } label="Spiele" onClick={ () => runOpen('minigames', ':_jail_mini hub') } />
                        <FabAction icon={ <ShoppingBag className="size-4" /> } label="Knast-Shop" onClick={ () => runOpen('shop', ':_jail_open shop') } />
                        <FabAction icon={ <Medal className="size-4" /> } label="Mein Rang" onClick={ () => runOpen('rank', ':_jail_open rank') } />
                        <FabAction icon={ <Cigarette className="size-4" /> } label="Zigaretten" onClick={ () => runOpen('cigarettes', ':_jail_open cigarettes') } />
                        <FabAction icon={ <Diamond className="size-4" /> } label="Kaution zahlen" onClick={ () => runOpen('bail', ':_jail_open bail') } />
                    </div>
                    <div className="border-t border-stroke-soft-200 px-3 py-2 text-center text-paragraph-xs text-text-soft-400">
                        Tipp: Aufgaben im Knast verkürzen die Strafe.
                    </div>
                </AlignPopover.Content>
            </AlignPopover.Root>

            { /* Restzeit-Pill rechts neben dem FAB */ }
            <div className={ `flex items-center gap-1 rounded-full px-2.5 py-1 text-label-xs font-bold tabular-nums shadow-regular-md backdrop-blur-md ${ pillColor }` }>
                <span aria-hidden="true">⏱</span>
                <span>{ timerText }</span>
            </div>
        </div>
    );
};

const FabAction: FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <AlignButton.Root
        variant="neutral"
        mode="ghost"
        size="small"
        onClick={ onClick }
        className="w-full justify-start gap-2 px-2"
    >
        <span className="flex size-7 items-center justify-center rounded-md bg-bg-weak-50 text-text-strong-950">
            { icon }
        </span>
        <span className="flex-1 text-left text-label-sm text-text-strong-950">{ label }</span>
    </AlignButton.Root>
);
