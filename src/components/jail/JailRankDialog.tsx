import { FC, useMemo } from 'react';
import { Award, Crown, Hammer, Medal, Shield, Star, Wind } from 'lucide-react';
import { useJailRankSnapshot } from '../../hooks';
import { JailDraggableDialog } from './JailDraggableDialog';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignDivider from '@/align-ui/components/ui/divider';

type RankColor = 'gray' | 'blue' | 'orange' | 'red' | 'purple';

const RANK_INFO: Record<string, { label: string; color: RankColor; icon: typeof Shield }> = {
    rookie: { label: 'Frischling', color: 'gray', icon: Shield },
    regular: { label: 'Stammgast', color: 'blue', icon: Medal },
    veteran: { label: 'Veteran', color: 'orange', icon: Award },
    boss: { label: 'Boss', color: 'red', icon: Crown },
    legend: { label: 'Legende', color: 'purple', icon: Star }
};

function formatHours(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${ m }m`;
    return `${ h }h ${ m }m`;
}

export const JailRankDialog: FC = () => {
    const snap = useJailRankSnapshot();

    const currentInfo = RANK_INFO[snap?.currentRank ?? 'rookie'] || RANK_INFO.rookie;
    const nextInfo = snap?.nextRank ? RANK_INFO[snap.nextRank] : null;
    const CurrentIcon = currentInfo.icon;

    const progress = useMemo(() => {
        if (!snap) return { value: 0, max: 1, remaining: 0 };
        if (!snap.nextRank) return { value: 1, max: 1, remaining: 0 };
        const nextThreshold = snap.nextThresholdSeconds || 1;
        const current = snap.totalSeconds || 0;
        const previousThreshold = previousRankThreshold(snap.currentRank, snap.thresholds);
        const span = Math.max(1, nextThreshold - previousThreshold);
        const within = Math.max(0, current - previousThreshold);
        return {
            value: Math.min(span, within),
            max: span,
            remaining: Math.max(0, nextThreshold - current)
        };
    }, [ snap ]);

    return (
        <JailDraggableDialog
            id="rank"
            title="Mein Rang"
            description="Knast-Karriere & Statistik"
            icon={ Medal }
            width={ 400 }
            bodyClassName="flex flex-col gap-5"
        >
            { !snap ? (
                <div className="rounded-xl bg-bg-weak-50 p-6 text-center text-paragraph-sm text-text-sub-600">
                    Karriere-Daten werden geladen...
                </div>
            ) : (
                <>
                    { /* Hero — Rang */ }
                    <div className="rounded-xl bg-bg-weak-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                                <CurrentIcon className="size-6 text-text-sub-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-paragraph-xs uppercase tracking-wide text-text-sub-600">Aktueller Rang</div>
                                <div className="text-label-md text-text-strong-950">{ currentInfo.label }</div>
                            </div>
                            <AlignBadge.Root size="small" variant="lighter" color={ currentInfo.color }>
                                { formatHours(snap.totalSeconds) }
                            </AlignBadge.Root>
                        </div>

                        { nextInfo ? (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-paragraph-xs">
                                    <span className="text-text-sub-600">
                                        Nächster Rang: <span className="text-text-strong-950">{ nextInfo.label }</span>
                                    </span>
                                    <span className="tabular-nums text-text-sub-600">
                                        { formatHours(progress.remaining) } verbleibend
                                    </span>
                                </div>
                                <AlignProgressBar.Root value={ progress.value } max={ progress.max } color="blue" />
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg bg-feature-lighter px-3 py-2 text-center text-paragraph-sm text-feature-base">
                                Maximaler Rang erreicht — du bist eine Knast-Legende.
                            </div>
                        ) }
                    </div>

                    { /* Stat-Tiles */ }
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile icon={ Shield } label="Inhaftierungen" value={ snap.jailCountLifetime } />
                        <StatTile icon={ Hammer } label="Steine" value={ snap.bricksBrokenLifetime } />
                        <StatTile icon={ Wind } label="Fluchten" value={ snap.escapesAttempted } />
                    </div>

                    <AlignDivider.Root variant="line-text">Rang-Schwellen</AlignDivider.Root>

                    { /* Rang-Liste */ }
                    <div className="flex flex-col gap-1.5">
                        { (Object.keys(RANK_INFO) as Array<keyof typeof RANK_INFO>).map(key => {
                            const info = RANK_INFO[key];
                            const RowIcon = info.icon;
                            const threshold = (snap.thresholds as any)[key] ?? 0;
                            const isCurrent = key === snap.currentRank;
                            const reached = snap.totalSeconds >= threshold;

                            return (
                                <div
                                    key={ key }
                                    className={ `flex items-center justify-between rounded-lg px-3 py-2 text-paragraph-sm transition ${
                                        isCurrent
                                            ? 'bg-bg-weak-50 text-text-strong-950'
                                            : reached
                                                ? 'text-text-sub-600'
                                                : 'text-text-soft-400'
                                    }` }
                                >
                                    <span className="flex items-center gap-2">
                                        <RowIcon className="size-4" />
                                        <span>{ info.label }</span>
                                    </span>
                                    <span className="tabular-nums">
                                        { threshold === 0 ? 'Start' : formatHours(threshold) }
                                    </span>
                                </div>
                            );
                        }) }
                    </div>
                </>
            ) }
        </JailDraggableDialog>
    );
};

function previousRankThreshold(rank: string, t: { rookie: number; regular: number; veteran: number; boss: number; legend: number }): number {
    switch (rank) {
        case 'rookie': return 0;
        case 'regular': return t.regular;
        case 'veteran': return t.veteran;
        case 'boss': return t.boss;
        case 'legend': return t.legend;
        default: return 0;
    }
}

const StatTile: FC<{ icon: typeof Shield; label: string; value: number }> = ({ icon: Icon, label, value }) => (
    <div className="rounded-xl bg-bg-weak-50 p-4 text-center">
        <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
            <Icon className="size-4 text-text-sub-600" />
        </div>
        <div className="mt-2 text-label-md tabular-nums text-text-strong-950">{ value }</div>
        <div className="mt-0.5 text-paragraph-xs text-text-sub-600">{ label }</div>
    </div>
);
