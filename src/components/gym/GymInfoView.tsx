import { FC, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';

const WHITE60 = 'rgba(255,255,255,0.6)';
const WHITE40 = 'rgba(255,255,255,0.4)';
const BG_CARD = 'rgba(0,0,0,0.2)';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const ORANGE = '#fb923c';
const PURPLE = '#a855f7';
const CYAN = '#06b6d4';

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

const StatBar: FC<{ label: string; value: number; max: number; color: string; emoji: string }> = ({ label, value, max, color, emoji }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">{emoji} {label}</span>
            <span className="text-xs font-bold" style={{ color }}>{value}/{max}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(value / max) * 100}%`, background: color }} />
        </div>
    </div>
);

export const GymInfoView: FC<{}> = () =>
{
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<GymData | null>(null);

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
    const tickStr = tickSec > 0 ? `${tickMin}:${String(tickSec).padStart(2, '0')}` : `${tickMin}`;
    const totalMin = data.totalTicks * 3;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins} Min`;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsVisible(false)} />

            <div className="relative w-[460px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-cyan-500/[0.08] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">💪</span>
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Fitness-Studio</span>
                        </div>
                        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={() => setIsVisible(false)}>
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto px-5 pb-5 pt-4 flex flex-col gap-4">

                        {/* Energie + XP */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center p-3 rounded-xl border border-white/[0.06]" style={{ background: BG_CARD }}>
                                <span className="text-lg">⚡</span>
                                <span className="text-sm font-bold" style={{ color: ORANGE }}>{data.energy}</span>
                                <span className="text-[10px]" style={{ color: WHITE40 }}>Energie</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl border border-white/[0.06]" style={{ background: BG_CARD }}>
                                <span className="text-lg">✨</span>
                                <span className="text-sm font-bold" style={{ color: CYAN }}>{data.gymXp}/{data.xpPerLevel}</span>
                                <span className="text-[10px]" style={{ color: WHITE40 }}>XP</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl border border-white/[0.06]" style={{ background: BG_CARD }}>
                                <span className="text-lg">🎯</span>
                                <span className="text-sm font-bold" style={{ color: GREEN }}>{data.statPoints}</span>
                                <span className="text-[10px]" style={{ color: WHITE40 }}>Punkte</span>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-white/50">XP-Fortschritt</span>
                                <span className="text-[10px]" style={{ color: WHITE40 }}>{Math.round((data.gymXp / data.xpPerLevel) * 100)}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(data.gymXp / data.xpPerLevel) * 100}%`, background: `linear-gradient(90deg, ${CYAN}, ${BLUE})` }} />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col gap-2.5">
                            <div className="text-xs font-semibold text-white/50">Deine Stats</div>
                            <StatBar label="Stärke" value={data.strength} max={data.maxStatLevel} color={ORANGE} emoji="🔥" />
                            <StatBar label="Ausdauer" value={data.stamina} max={data.maxStatLevel} color={GREEN} emoji="🏃" />
                            <StatBar label="Intelligenz" value={data.intellect} max={data.maxStatLevel} color={PURPLE} emoji="🧠" />
                        </div>

                        {/* How it works */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06]" style={{ background: BG_CARD }}>
                            <div className="text-xs font-semibold text-white/70">So funktioniert's</div>
                            <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed" style={{ color: WHITE60 }}>
                                <p>🏋️ Stelle dich auf ein <span className="text-white/90 font-medium">Trainingsgerät</span> (Laufband, Trampolin oder Crosstrainer)</p>
                                <p>⏱️ Alle <span className="font-medium" style={{ color: CYAN }}>{tickStr} Min</span> bekommst du <span className="font-medium" style={{ color: CYAN }}>+{data.xpPerTick} XP</span> und verlierst <span className="font-medium" style={{ color: ORANGE }}>-{data.energyCost} Energie</span></p>
                                <p>⬆️ Bei <span className="font-medium" style={{ color: CYAN }}>{data.xpPerLevel} XP</span> erhältst du einen <span className="font-medium" style={{ color: GREEN }}>Stat-Punkt</span></p>
                                <p>📊 Verteile Punkte mit <span className="font-mono text-white/80">:gym add strength/stamina/intellect</span></p>
                                <p>🔝 Jeder Stat kann maximal <span className="font-medium" style={{ color: PURPLE }}>Level {data.maxStatLevel}</span> erreichen</p>
                            </div>
                        </div>

                        {/* Commands */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06]" style={{ background: BG_CARD }}>
                            <div className="text-xs font-semibold text-white/70">Commands</div>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                {[
                                    [':gym', 'Stats anzeigen'],
                                    [':gym info', 'Dieses Fenster'],
                                    [':gym add strength', 'Stärke +1'],
                                    [':gym add stamina', 'Ausdauer +1'],
                                    [':gym add intellect', 'Intelligenz +1'],
                                ].map(([cmd, desc]) => (
                                    <div key={cmd} className="flex items-center gap-1.5">
                                        <span className="font-mono text-white/80 shrink-0">{cmd}</span>
                                        <span style={{ color: WHITE40 }}>— {desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-[10px]" style={{ color: WHITE40 }}>
                            Trainingszeit: {timeStr}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
