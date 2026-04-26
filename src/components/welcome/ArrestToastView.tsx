import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageEvent, TopbarBannerStack } from '../../hooks';
import { cn } from '@/lib/utils';
import { BadgeCheck, ChevronDown, Clock3, Gavel, ShieldAlert } from 'lucide-react';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';

const JAIL_COLLAPSED_KEY = 'bahhos.jail.collapsed';

type JailTaskState = {
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

type PrisonerState = {
    caseId: number;
    username: string;
    reason: string;
    status: string;
    jailMinutes: number;
    until: number;
    reducedSeconds: number;
    tasks: JailTaskState[];
};

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

function formatRemaining(until: number) {
    if(!until) return 'Permanent';
    const remaining = Math.max(0, until - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`;
}

function readCollapsed() {
    try {
        const stored = localStorage.getItem(JAIL_COLLAPSED_KEY);
        if(stored === null) return true; // default collapsed
        return stored !== '0';
    } catch {
        return true;
    }
}

function writeCollapsed(value: boolean) {
    try { localStorage.setItem(JAIL_COLLAPSED_KEY, value ? '1' : '0'); } catch {}
}

function TaskRow({ task }: { task: JailTaskState }) {
    const complete = task.completedCount >= task.maxPerCase;
    const max = Math.max(1, task.requiredSeconds);
    const value = Math.min(max, task.progressSeconds);

    return (
        <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="truncate text-label-sm text-text-strong-950">{ task.label }</div>
                    <div className="mt-0.5 text-paragraph-xs text-text-sub-600">
                        { complete
                            ? 'Abgeschlossen'
                            : task.cooldownRemainingSeconds > 0
                                ? `Cooldown ${ task.cooldownRemainingSeconds }s`
                                : `${ task.zoneType } · -${ task.reductionSeconds }s` }
                    </div>
                </div>
                <AlignBadge.Root color={ complete ? 'green' : 'gray' } variant="lighter" size="small">
                    { task.completedCount }/{ task.maxPerCase }
                </AlignBadge.Root>
            </div>
            <AlignProgress.Root
                value={ value }
                max={ max }
                color={ complete ? 'green' : 'orange' }
                className="mt-2"
            />
        </div>
    );
}

// Layout-free arrest toast — positioned by TopbarBannerStackView
function ArrestCard({ message, reason, isClosing }: { message: string; reason: string; isClosing: boolean }) {
    return (
        <div className={ cn('w-[min(420px,calc(100vw-32px))] pointer-events-none transition-all duration-300', isClosing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0') }>
            <AlignSurface.Panel className="overflow-hidden rounded-20 px-4 py-3 shadow-regular-md">
                <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-lighter text-error-base">
                        <ShieldAlert className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-label-sm text-text-strong-950">{ message }</div>
                        <div className="mt-1 text-paragraph-xs text-text-sub-600">
                            { reason ? <>Grund: <span className="font-medium text-text-strong-950">{ reason }</span></> : 'Bleib stehen, bis die Verhaftung abgeschlossen ist.' }
                        </div>
                    </div>
                </div>
            </AlignSurface.Panel>
        </div>
    );
}

// Layout-free prisoner card — positioned by TopbarBannerStackView
function PrisonerCard({ prisoner, timerText, taskSummary, onHide }: { prisoner: PrisonerState; timerText: string; taskSummary: string; onHide: () => void }) {
    const [ collapsed, setCollapsed ] = useState<boolean>(() => readCollapsed());

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            writeCollapsed(next);
            return next;
        });
    };

    const activeTask = useMemo(() => {
        if(!prisoner.tasks?.length) return null;
        const inProgress = prisoner.tasks.find(t => t.completedCount < t.maxPerCase && t.progressSeconds > 0);
        if(inProgress) return inProgress;
        return prisoner.tasks.find(t => t.completedCount < t.maxPerCase) || prisoner.tasks[0] || null;
    }, [ prisoner.tasks ]);

    const hasTasks = (prisoner.tasks?.length ?? 0) > 0;

    return (
        <div className="w-[min(520px,calc(100vw-32px))] pointer-events-auto">
            <AlignSurface.Panel className="overflow-hidden rounded-20 shadow-regular-md">
                {/* Header — clickable for toggle */}
                <button
                    type="button"
                    onClick={ toggleCollapsed }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition duration-200 ease-out hover:bg-bg-weak-50 focus:outline-none focus-visible:bg-bg-weak-50"
                    aria-expanded={ !collapsed }
                >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-lighter text-warning-base">
                        <Gavel className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-label-sm text-text-strong-950">Inhaftiert</span>
                            <AlignBadge.Root color="orange" variant="lighter" size="small">{ prisoner.status }</AlignBadge.Root>
                        </div>
                        <div className="mt-0.5 truncate text-paragraph-xs text-text-sub-600">
                            { prisoner.reason ? <>Grund: <span className="font-medium text-text-strong-950">{ prisoner.reason }</span></> : 'Kein Grund angegeben' }
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-label-sm tabular-nums text-text-strong-950">
                            <Clock3 className="size-4 text-text-sub-600" />
                            { timerText }
                        </div>
                        <div className="mt-0.5 text-paragraph-xs text-text-soft-400">{ taskSummary }</div>
                    </div>
                    <ChevronDown className={ cn('size-5 shrink-0 text-text-soft-400 transition-transform duration-200 ease-out', !collapsed && 'rotate-180') } />
                </button>

                {/* Collapsed: Active Task Mini Progress */}
                { collapsed && activeTask && (
                    <>
                        <AlignDivider.Root />
                        <div className="px-4 py-3">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="truncate text-label-xs text-text-strong-950">{ activeTask.label }</span>
                                <span className="shrink-0 text-paragraph-xs tabular-nums text-text-sub-600">
                                    { activeTask.completedCount }/{ activeTask.maxPerCase }
                                </span>
                            </div>
                            <AlignProgress.Root
                                value={ Math.min(Math.max(1, activeTask.requiredSeconds), activeTask.progressSeconds) }
                                max={ Math.max(1, activeTask.requiredSeconds) }
                                color={ activeTask.completedCount >= activeTask.maxPerCase ? 'green' : 'orange' }
                            />
                        </div>
                    </>
                ) }

                {/* Expanded: Task Divider-Liste */}
                { !collapsed && hasTasks && (
                    <>
                        <AlignDivider.Root />
                        <div className="divide-y divide-stroke-soft-200">
                            { prisoner.tasks.map(task => <TaskRow key={ task.key } task={ task } />) }
                        </div>
                    </>
                ) }

                {/* Expanded: Reduced-Hint */}
                { !collapsed && prisoner.reducedSeconds > 0 && (
                    <>
                        <AlignDivider.Root />
                        <div className="flex items-center gap-2 px-4 py-3 text-paragraph-xs text-success-dark">
                            <BadgeCheck className="size-4 shrink-0 text-success-base" />
                            Durch Aufgaben bereits { prisoner.reducedSeconds } Sekunden reduziert.
                        </div>
                    </>
                ) }

                {/* Expanded: Footer */}
                { !collapsed && (
                    <>
                        <AlignDivider.Root />
                        <div className="flex justify-end px-4 py-2">
                            <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" onClick={ onHide }>
                                Ausblenden
                            </AlignButton.Root>
                        </div>
                    </>
                ) }
            </AlignSurface.Panel>
        </div>
    );
}

export const ArrestToastView: FC<{}> = () => {
    const [ arrestVisible, setArrestVisible ] = useState(false);
    const [ arrestFading, setArrestFading ] = useState(false);
    const [ arrestMessage, setArrestMessage ] = useState('');
    const [ reasonText, setReasonText ] = useState('');

    const [ prisoner, setPrisoner ] = useState<PrisonerState | null>(null);
    const [ timerText, setTimerText ] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        switch(parser.type) {
            case 'jail.arrest': {
                const msg = parser.parameters?.get('message') || 'Du wirst verhaftet!';
                const reason = parser.parameters?.get('reason') || '';
                setArrestMessage(msg);
                setReasonText(reason);
                setArrestFading(false);
                setArrestVisible(true);
                break;
            }
            case 'jail.arrest.end': {
                setArrestFading(true);
                setTimeout(() => setArrestVisible(false), 450);
                break;
            }
            case 'jail.timer': {
                const until = parseInt(parser.parameters?.get('until') || '0', 10);
                const reason = parser.parameters?.get('reason') || '';
                if(reason) setReasonText(reason);
                setPrisoner(previous => ({
                    caseId: previous?.caseId || 0,
                    username: previous?.username || '',
                    reason,
                    status: previous?.status || 'active',
                    jailMinutes: previous?.jailMinutes || 0,
                    until,
                    reducedSeconds: previous?.reducedSeconds || 0,
                    tasks: previous?.tasks || [],
                }));
                break;
            }
            case 'jail.prisoner.state': {
                const payload = parser.parameters?.get('payload') || '';
                const decoded = decodePayload<PrisonerState>(payload);
                if(decoded) {
                    setReasonText(decoded.reason || '');
                    setPrisoner(decoded);
                }
                break;
            }
            case 'jail.timer.end': {
                setPrisoner(null);
                setTimerText('');
                break;
            }
        }
    });

    useEffect(() => {
        if(!prisoner) {
            if(timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const updateTimer = () => setTimerText(formatRemaining(prisoner.until));
        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if(timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [ prisoner ]);

    const taskSummary = useMemo(() => {
        if(!prisoner?.tasks?.length) return 'Keine Aufgaben aktiv';
        const done = prisoner.tasks.reduce((sum, task) => sum + Math.min(task.completedCount, task.maxPerCase), 0);
        const max = prisoner.tasks.reduce((sum, task) => sum + task.maxPerCase, 0);
        return `${ done }/${ max } Aufgaben`;
    }, [ prisoner ]);

    // Push arrest toast into central topbar stack
    useEffect(() => {
        if(!arrestVisible) {
            TopbarBannerStack.remove('jail-arrest');
            return;
        }

        TopbarBannerStack.push({
            id: 'jail-arrest',
            kind: 'arrest',
            priority: 5,
            content: <ArrestCard message={ arrestMessage } reason={ reasonText } isClosing={ arrestFading } />
        });
    }, [ arrestVisible, arrestFading, arrestMessage, reasonText ]);

    // Push prisoner status card into central topbar stack
    useEffect(() => {
        if(!prisoner) {
            TopbarBannerStack.remove('jail-prisoner');
            return;
        }

        TopbarBannerStack.push({
            id: 'jail-prisoner',
            kind: 'jail-timer',
            priority: 10,
            content: (
                <PrisonerCard
                    prisoner={ prisoner }
                    timerText={ timerText }
                    taskSummary={ taskSummary }
                    onHide={ () => setPrisoner(null) }
                />
            )
        });
    }, [ prisoner, timerText, taskSummary ]);

    // Cleanup on unmount
    useEffect(() => () => {
        TopbarBannerStack.remove('jail-arrest');
        TopbarBannerStack.remove('jail-prisoner');
    }, []);

    return null;
};
