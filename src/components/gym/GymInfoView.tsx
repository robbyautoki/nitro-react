import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { Brain, Clock, Dumbbell, Flame, Gauge, Sparkles, Target, Zap } from 'lucide-react';
import { useMessageEvent } from '../../hooks';
import { AlignGameWindow, MetricTile } from '../align-game-ui';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';

interface GymData {
    energy: number;
    gymXp: number;
    statPoints: number;
    strength: number;
    stamina: number;
    intellect: number;
    totalTicks: number;
    tickSeconds: number;
    xpPerTick: number;
    energyCost: number;
    xpPerLevel: number;
    maxStatLevel: number;
}

const StatBar: FC<{ label: string; value: number; max: number; icon: typeof Flame; color: 'orange' | 'green' | 'blue' }> = ({ label, value, max, icon: Icon, color }) => (
    <div className="space-y-2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-paragraph-sm text-text-strong-950">
                <Icon className="size-4 text-text-sub-600" />
                { label }
            </div>
            <span className="text-label-xs tabular-nums text-text-sub-600">{ value }/{ max }</span>
        </div>
        <AlignProgress.Root value={ value } max={ max } color={ color } className="h-2" />
    </div>
);

export const GymInfoView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ data, setData ] = useState<GymData | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if (parser.type !== 'gym.info') return;

        const p = parser.parameters;
        setData({
            energy: parseInt(p?.get('energy') || '0'),
            gymXp: parseInt(p?.get('gym_xp') || '0'),
            statPoints: parseInt(p?.get('stat_points') || '0'),
            strength: parseInt(p?.get('strength') || '0'),
            stamina: parseInt(p?.get('stamina') || '0'),
            intellect: parseInt(p?.get('intellect') || '0'),
            totalTicks: parseInt(p?.get('total_ticks') || '0'),
            tickSeconds: parseInt(p?.get('tick_seconds') || '180'),
            xpPerTick: parseInt(p?.get('xp_per_tick') || '6'),
            energyCost: parseInt(p?.get('energy_cost') || '2'),
            xpPerLevel: parseInt(p?.get('xp_per_level') || '100'),
            maxStatLevel: parseInt(p?.get('max_stat_level') || '10'),
        });
        setIsVisible(true);
    });

    if (!isVisible || !data) return null;

    const tickMin = Math.floor(data.tickSeconds / 60);
    const tickSec = data.tickSeconds % 60;
    const tickStr = tickSec > 0 ? `${ tickMin }:${ String(tickSec).padStart(2, '0') }` : `${ tickMin }`;
    const totalMin = data.totalTicks * 3;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const timeStr = hours > 0 ? `${ hours }h ${ mins }min` : `${ mins } Min`;
    const xpPercent = Math.round((data.gymXp / data.xpPerLevel) * 100);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-overlay backdrop-blur-[10px] pointer-events-auto" onClick={ () => setIsVisible(false) }>
            <div onClick={ event => event.stopPropagation() }>
                <AlignGameWindow
                    title="Fitness-Studio"
                    subtitle={ `Training: ${ timeStr }` }
                    icon={ <Dumbbell className="size-4" /> }
                    widthClassName="w-[460px] max-w-[94vw]"
                    onClose={ () => setIsVisible(false) }
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <MetricTile icon={ <Zap className="size-4 text-warning-base" /> } value={ data.energy } label="Energie" />
                            <MetricTile icon={ <Sparkles className="size-4 text-information-base" /> } value={ `${ data.gymXp }/${ data.xpPerLevel }` } label="XP" />
                            <MetricTile icon={ <Target className="size-4 text-success-base" /> } value={ data.statPoints } label="Punkte" />
                        </div>
                        <div className="space-y-2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3">
                            <div className="flex items-center justify-between gap-3 text-paragraph-xs text-text-sub-600">
                                <span>XP-Fortschritt</span>
                                <span className="tabular-nums">{ xpPercent }%</span>
                            </div>
                            <AlignProgress.Root value={ data.gymXp } max={ data.xpPerLevel } color="blue" className="h-2.5" />
                        </div>
                        <section className="space-y-2">
                            <div className="text-label-xs uppercase text-text-soft-400">Deine Stats</div>
                            <StatBar label="Stärke" value={ data.strength } max={ data.maxStatLevel } icon={ Flame } color="orange" />
                            <StatBar label="Ausdauer" value={ data.stamina } max={ data.maxStatLevel } icon={ Gauge } color="green" />
                            <StatBar label="Intelligenz" value={ data.intellect } max={ data.maxStatLevel } icon={ Brain } color="blue" />
                        </section>
                        <AlignDivider.Root />
                        <section className="space-y-2 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3">
                            <div className="text-label-xs uppercase text-text-soft-400">So funktioniert&apos;s</div>
                            <div className="space-y-1.5 text-paragraph-xs text-text-sub-600">
                                <p>Stelle dich auf ein <span className="font-medium text-text-strong-950">Trainingsgerät</span>.</p>
                                <p>Alle <span className="font-medium text-information-base">{ tickStr } Min</span>: <span className="font-medium text-information-base">+{ data.xpPerTick } XP</span>, <span className="font-medium text-warning-base">-{ data.energyCost } Energie</span>.</p>
                                <p>Bei <span className="font-medium text-information-base">{ data.xpPerLevel } XP</span> erhältst du einen <span className="font-medium text-success-base">Stat-Punkt</span>.</p>
                                <p>Verteile Punkte mit <span className="font-mono text-text-strong-950">:gym add strength/stamina/intellect</span>.</p>
                                <p>Maximal <span className="font-medium text-feature-base">Level { data.maxStatLevel }</span> pro Stat.</p>
                            </div>
                        </section>
                        <section className="space-y-2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3">
                            <div className="flex items-center gap-2 text-label-xs uppercase text-text-soft-400">
                                <Clock className="size-3.5" />
                                Commands
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-paragraph-xs">
                                { [
                                    [ ':gym', 'Stats anzeigen' ],
                                    [ ':gym info', 'Dieses Fenster' ],
                                    [ ':gym add strength', 'Stärke +1' ],
                                    [ ':gym add stamina', 'Ausdauer +1' ],
                                    [ ':gym add intellect', 'Intelligenz +1' ],
                                ].map(([ cmd, desc ]) => (
                                    <div key={ cmd } className="min-w-0 rounded-lg bg-bg-weak-50 px-2.5 py-2">
                                        <div className="truncate font-mono text-text-strong-950">{ cmd }</div>
                                        <div className="truncate text-text-sub-600">{ desc }</div>
                                    </div>
                                )) }
                            </div>
                        </section>
                    </div>
                </AlignGameWindow>
            </div>
        </div>
    );
};
