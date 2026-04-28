import { FC, useEffect, useMemo, useState } from 'react';
import {
    Cigarette, Flag, Footprints, Gamepad2, Hammer, Lock, Play,
    RotateCcw, Square, Timer, X as XIcon
} from 'lucide-react';
import { GetRoomSession } from '../../api';
import { useJailMinigameState } from '../../hooks';
import { JailDraggableDialog } from './JailDraggableDialog';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';

function sendChat(command: string): boolean {
    const session = GetRoomSession();
    if (!session) return false;
    session.sendChatMessage(command, 0);
    return true;
}

function formatMs(ms: number): string {
    if (ms <= 0) return '0s';
    const total = Math.ceil(ms / 1000);
    if (total < 60) return `${ total }s`;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${ m }m ${ s }s`;
}

type Tab = 'brick' | 'race' | 'pick';

export const JailMinigamesDialog: FC = () => {
    const { states, onResult } = useJailMinigameState();
    const [ tab, setTab ] = useState<Tab>('brick');
    const [ feedback, setFeedback ] = useState<{ ok: boolean; message: string } | null>(null);

    useEffect(() => {
        const off = onResult(result => {
            setFeedback(result);
            window.setTimeout(() => setFeedback(null), 3500);
        });
        return off;
    }, [ onResult ]);

    return (
        <JailDraggableDialog
            id="minigames"
            title="Knast-Spiele"
            description="Verkürze deine Strafe & verdiene Zigaretten"
            icon={ Gamepad2 }
            width={ 460 }
            bodyClassName="flex flex-col gap-4"
        >
            { /* Tabs */ }
            <div className="flex items-center gap-1 rounded-10 bg-bg-weak-50 p-1">
                <TabButton active={ tab === 'brick' } onClick={ () => setTab('brick') } icon={ Hammer }>
                    Stein
                </TabButton>
                <TabButton active={ tab === 'race' } onClick={ () => setTab('race') } icon={ Footprints }>
                    Hofgang
                </TabButton>
                <TabButton active={ tab === 'pick' } onClick={ () => setTab('pick') } icon={ Lock }>
                    Lockpick
                </TabButton>
            </div>

            { feedback && (
                <div className={ `rounded-lg px-3 py-2 text-paragraph-xs ${
                    feedback.ok
                        ? 'bg-success-lighter text-success-base'
                        : 'bg-error-lighter text-error-base'
                }` }>
                    { feedback.message }
                </div>
            ) }

            <div>
                { tab === 'brick' && <BrickPanel state={ states.brick } /> }
                { tab === 'race' && <RacePanel state={ states.race } /> }
                { tab === 'pick' && <LockpickPanel state={ states.pick } /> }
            </div>
        </JailDraggableDialog>
    );
};

const TabButton: FC<{ active: boolean; onClick: () => void; icon?: typeof Hammer; children: React.ReactNode }> = ({ active, onClick, icon: Icon, children }) => (
    <button
        type="button"
        onClick={ onClick }
        className={ `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-label-sm transition ${
            active
                ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs'
                : 'text-text-sub-600 hover:text-text-strong-950'
        }` }
    >
        { Icon && <Icon className="size-4" /> }
        <span>{ children }</span>
    </button>
);

// ──────────────────────────────────────────────────────────────
// HERO Card — geteilt zwischen allen drei Spielen
// ──────────────────────────────────────────────────────────────
const GameHero: FC<{
    icon: typeof Hammer;
    title: string;
    description: string;
    rewardLabel: string;
}> = ({ icon: Icon, title, description, rewardLabel }) => (
    <div className="rounded-xl bg-bg-weak-50 p-5">
        <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                <Icon className="size-6 text-text-sub-600" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-label-md text-text-strong-950">{ title }</div>
                <div className="mt-0.5 text-paragraph-sm text-text-sub-600">{ description }</div>
            </div>
            <AlignBadge.Root size="small" variant="lighter" color="orange">
                <AlignBadge.Icon as={ Cigarette } className="size-3" />
                { rewardLabel }
            </AlignBadge.Root>
        </div>
    </div>
);

const HintBlock: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-lg bg-information-lighter px-3 py-2 text-paragraph-xs text-information-base">
        { children }
    </div>
);

// ──────────────────────────────────────────────────────────────
// BRICK BREAKER
// ──────────────────────────────────────────────────────────────
const BrickPanel: FC<{ state: ReturnType<typeof useJailMinigameState>['states']['brick'] }> = ({ state }) => {
    const clicks = state?.clicks ?? 0;
    const target = state?.target ?? 50;
    const completed = state?.completedThisCase ?? 0;

    useEffect(() => {
        sendChat(':_jail_mini hub');
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <GameHero
                icon={ Hammer }
                title="Stein klopfen"
                description={ `Klick ${ target } Mal auf den Steinblock im Arbeitsbereich.` }
                rewardLabel="+3"
            />

            <div className="rounded-xl bg-bg-weak-50 p-4">
                <div className="flex items-center justify-between text-paragraph-xs">
                    <span className="text-text-sub-600">Fortschritt</span>
                    <span className="tabular-nums text-text-strong-950">{ clicks } / { target }</span>
                </div>
                <div className="mt-2">
                    <AlignProgressBar.Root value={ clicks } max={ target } color="blue" />
                </div>
            </div>

            <AlignButton.Root
                variant="primary"
                mode="filled"
                size="medium"
                className="w-full"
                onClick={ () => sendChat(':_jail_mini brick_click') }
            >
                <AlignButton.Icon as={ Hammer } className="size-4" />
                Klopfen ({ clicks }/{ target })
            </AlignButton.Root>

            <div className="flex items-center justify-between gap-2">
                <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    size="xsmall"
                    onClick={ () => sendChat(':_jail_mini brick_reset') }
                    disabled={ clicks === 0 }
                >
                    <AlignButton.Icon as={ RotateCcw } className="size-3.5" />
                    Zurücksetzen
                </AlignButton.Root>
                <span className="text-paragraph-xs text-text-sub-600">
                    Diese Inhaftierung: <span className="text-text-strong-950">{ completed }</span> Steine
                </span>
            </div>

            <HintBlock>
                Tipp: Das gleiche Spiel kann auch durch Klick auf einen echten Stein-Block im Knast-Arbeitsbereich ausgelöst werden.
            </HintBlock>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────
// YARD RACE
// ──────────────────────────────────────────────────────────────
const RacePanel: FC<{ state: ReturnType<typeof useJailMinigameState>['states']['race'] }> = ({ state }) => {
    const running = state?.running ?? false;
    const checkpoints = state?.checkpoints ?? 0;
    const target = state?.target ?? 4;
    const requiredSeconds = state?.requiredSeconds ?? 60;
    const completed = state?.completedThisCase ?? 0;
    const cdRemain = state?.cooldownRemainingMs ?? 0;
    const onCooldown = cdRemain > 0;

    const [ remainingMs, setRemainingMs ] = useState(state?.remainingMs ?? requiredSeconds * 1000);

    useEffect(() => {
        sendChat(':_jail_mini hub');
    }, []);

    useEffect(() => {
        if (!running) {
            setRemainingMs(state?.remainingMs ?? requiredSeconds * 1000);
            return;
        }
        const start = Date.now();
        const baseRemain = state?.remainingMs ?? requiredSeconds * 1000;
        const id = setInterval(() => {
            const elapsed = Date.now() - start;
            setRemainingMs(Math.max(0, baseRemain - elapsed));
        }, 200);
        return () => clearInterval(id);
    }, [ running, state?.remainingMs, requiredSeconds ]);

    const timePct = Math.max(0, Math.min(100, Math.round((remainingMs / (requiredSeconds * 1000)) * 100)));

    return (
        <div className="flex flex-col gap-4">
            <GameHero
                icon={ Footprints }
                title="Hofgang-Lauf"
                description={ `${ target } Checkpoints in unter ${ requiredSeconds }s ablaufen.` }
                rewardLabel="+2"
            />

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-bg-weak-50 p-4">
                    <div className="flex items-center justify-between text-paragraph-xs">
                        <span className="flex items-center gap-1 text-text-sub-600">
                            <Flag className="size-3.5" />Checkpoints
                        </span>
                        <span className="tabular-nums text-text-strong-950">{ checkpoints }/{ target }</span>
                    </div>
                    <div className="mt-2">
                        <AlignProgressBar.Root value={ checkpoints } max={ target } color="blue" />
                    </div>
                </div>
                <div className="rounded-xl bg-bg-weak-50 p-4">
                    <div className="flex items-center justify-between text-paragraph-xs">
                        <span className="flex items-center gap-1 text-text-sub-600">
                            <Timer className="size-3.5" />Zeit
                        </span>
                        <span className={ `tabular-nums ${ remainingMs < 10_000 ? 'text-error-base' : 'text-text-strong-950' }` }>
                            { Math.ceil(remainingMs / 1000) }s
                        </span>
                    </div>
                    <div className="mt-2">
                        <AlignProgressBar.Root value={ timePct } max={ 100 } color={ remainingMs < 10_000 ? 'red' : 'blue' } />
                    </div>
                </div>
            </div>

            { !running ? (
                <AlignButton.Root
                    variant="primary"
                    mode="filled"
                    size="medium"
                    className="w-full"
                    disabled={ onCooldown }
                    onClick={ () => sendChat(':_jail_mini race_start') }
                >
                    <AlignButton.Icon as={ Play } className="size-4" />
                    { onCooldown ? `Cooldown ${ formatMs(cdRemain) }` : 'Lauf starten' }
                </AlignButton.Root>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <AlignButton.Root
                        variant="primary"
                        mode="filled"
                        size="medium"
                        onClick={ () => sendChat(':_jail_mini race_checkpoint') }
                    >
                        <AlignButton.Icon as={ Flag } className="size-4" />
                        Checkpoint
                    </AlignButton.Root>
                    <AlignButton.Root
                        variant="error"
                        mode="stroke"
                        size="medium"
                        onClick={ () => sendChat(':_jail_mini race_cancel') }
                    >
                        <AlignButton.Icon as={ Square } className="size-4" />
                        Abbrechen
                    </AlignButton.Root>
                </div>
            ) }

            <div className="text-right text-paragraph-xs text-text-sub-600">
                Diese Inhaftierung: <span className="text-text-strong-950">{ completed }</span> Läufe
            </div>

            <HintBlock>
                Tipp: Im echten Knast-Hof zählen Steps auf Checkpoint-Tiles automatisch — solange du im Hof-Bereich bleibst.
            </HintBlock>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────
// LOCKPICK MASTER
// ──────────────────────────────────────────────────────────────
const LockpickPanel: FC<{ state: ReturnType<typeof useJailMinigameState>['states']['pick'] }> = ({ state }) => {
    const running = state?.running ?? false;
    const length = state?.length ?? 5;
    const attemptsLeft = state?.attemptsLeft ?? 0;
    const maxAttempts = state?.maxAttempts ?? 3;
    const completed = state?.completedThisCase ?? 0;
    const cdRemain = state?.cooldownRemainingMs ?? 0;
    const lastFeedback = state?.lastCorrectPositions;
    const onCooldown = cdRemain > 0;

    const [ guess, setGuess ] = useState<number[]>([]);

    useEffect(() => {
        sendChat(':_jail_mini hub');
    }, []);

    useEffect(() => {
        if (!running) setGuess([]);
    }, [ running, state?.attemptsLeft ]);

    const slots = useMemo(() => Array.from({ length }, (_, i) => guess[i] ?? null), [ guess, length ]);
    const ready = guess.length === length && guess.every(n => n !== null && n !== undefined);

    const pressDigit = (d: number) => {
        if (!running) return;
        if (guess.length >= length) return;
        setGuess(g => [ ...g, d ]);
    };

    const popDigit = () => {
        if (guess.length === 0) return;
        setGuess(g => g.slice(0, -1));
    };

    const submit = () => {
        if (!ready) return;
        sendChat(`:_jail_mini pick_submit ${ guess.join(',') }`);
        setGuess([]);
    };

    return (
        <div className="flex flex-col gap-4">
            <GameHero
                icon={ Lock }
                title="Schloss knacken"
                description={ `Errate die ${ length }-stellige Zahlensequenz (Ziffern 1-9).` }
                rewardLabel="+5"
            />

            { /* Slots */ }
            <div className="rounded-xl bg-bg-weak-50 p-4">
                <div className="flex justify-center gap-2">
                    { slots.map((digit, i) => (
                        <div
                            key={ i }
                            className={ `flex size-11 items-center justify-center rounded-lg ring-1 ring-inset text-title-h6 tabular-nums transition ${
                                digit !== null
                                    ? 'bg-bg-white-0 ring-stroke-strong-950 text-text-strong-950'
                                    : 'bg-bg-white-0 ring-stroke-soft-200 text-text-soft-400'
                            }` }
                        >
                            { digit !== null ? digit : '·' }
                        </div>
                    )) }
                </div>

                <div className="mt-4 flex items-center justify-between text-paragraph-xs">
                    <div className="text-text-sub-600">
                        Versuche: <span className="tabular-nums text-text-strong-950">{ attemptsLeft }/{ maxAttempts }</span>
                    </div>
                    { lastFeedback !== undefined && (
                        <AlignBadge.Root size="small" variant="lighter" color={ lastFeedback >= length - 1 ? 'green' : 'orange' }>
                            { lastFeedback } richtig platziert
                        </AlignBadge.Root>
                    ) }
                </div>
            </div>

            { running && (
                <>
                    { /* Keypad */ }
                    <div className="grid grid-cols-3 gap-1.5">
                        { [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map(d => (
                            <button
                                key={ d }
                                type="button"
                                onClick={ () => pressDigit(d) }
                                disabled={ guess.length >= length }
                                className="h-11 rounded-lg ring-1 ring-inset ring-stroke-soft-200 bg-bg-white-0 text-label-md text-text-strong-950 tabular-nums transition hover:bg-bg-weak-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                            >
                                { d }
                            </button>
                        )) }
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <AlignButton.Root
                            variant="neutral"
                            mode="stroke"
                            size="small"
                            onClick={ popDigit }
                            disabled={ guess.length === 0 }
                        >
                            <AlignButton.Icon as={ XIcon } className="size-3.5" />
                            Löschen
                        </AlignButton.Root>
                        <AlignButton.Root
                            variant="primary"
                            mode="filled"
                            size="small"
                            className="col-span-2"
                            onClick={ submit }
                            disabled={ !ready }
                        >
                            Sequenz prüfen
                        </AlignButton.Root>
                    </div>

                    <div className="text-right">
                        <AlignButton.Root
                            variant="error"
                            mode="ghost"
                            size="xxsmall"
                            onClick={ () => sendChat(':_jail_mini pick_cancel') }
                        >
                            Abbrechen
                        </AlignButton.Root>
                    </div>
                </>
            ) }

            { !running && (
                <>
                    <AlignButton.Root
                        variant="primary"
                        mode="filled"
                        size="medium"
                        className="w-full"
                        disabled={ onCooldown }
                        onClick={ () => sendChat(':_jail_mini pick_start') }
                    >
                        <AlignButton.Icon as={ Lock } className="size-4" />
                        { onCooldown ? `Schloss verriegelt — ${ formatMs(cdRemain) }` : 'Lockpick starten' }
                    </AlignButton.Root>
                    <div className="text-right text-paragraph-xs text-text-sub-600">
                        Diese Inhaftierung: <span className="text-text-strong-950">{ completed }</span> Schlösser
                    </div>
                </>
            ) }

            <HintBlock>
                Bei richtiger Position einer Ziffer leuchtet das Feedback. Du hast { maxAttempts } Versuche pro Schloss.
            </HintBlock>
        </div>
    );
};
