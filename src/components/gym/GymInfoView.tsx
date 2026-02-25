import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Frame, FramePanel } from '../ui/frame';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Dumbbell, X } from 'lucide-react';

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
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{emoji} {label}</span>
            <span className={ `text-xs font-bold ${color}` }>{value}/{max}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={ `h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}` }
                style={{ width: `${(value / max) * 100}%` }} />
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
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[460px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b">
                                <div className="flex items-center gap-2">
                                    <Dumbbell className="size-4 text-emerald-500" />
                                    <span className="text-sm font-semibold">Fitness-Studio</span>
                                </div>
                                <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setIsVisible(false)}>
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-auto">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center p-3 rounded-lg border">
                                        <span className="text-lg">⚡</span>
                                        <span className="text-sm font-bold text-orange-500">{data.energy}</span>
                                        <span className="text-[10px] text-muted-foreground">Energie</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 rounded-lg border">
                                        <span className="text-lg">✨</span>
                                        <span className="text-sm font-bold text-cyan-500">{data.gymXp}/{data.xpPerLevel}</span>
                                        <span className="text-[10px] text-muted-foreground">XP</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 rounded-lg border">
                                        <span className="text-lg">🎯</span>
                                        <span className="text-sm font-bold text-emerald-500">{data.statPoints}</span>
                                        <span className="text-[10px] text-muted-foreground">Punkte</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">XP-Fortschritt</span>
                                        <span className="text-[10px] text-muted-foreground">{Math.round((data.gymXp / data.xpPerLevel) * 100)}%</span>
                                    </div>
                                    <Progress value={(data.gymXp / data.xpPerLevel) * 100} className="h-3" />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="text-xs font-semibold text-muted-foreground">Deine Stats</div>
                                    <StatBar label="Stärke" value={data.strength} max={data.maxStatLevel} color="text-orange-500" emoji="🔥" />
                                    <StatBar label="Ausdauer" value={data.stamina} max={data.maxStatLevel} color="text-emerald-500" emoji="🏃" />
                                    <StatBar label="Intelligenz" value={data.intellect} max={data.maxStatLevel} color="text-purple-500" emoji="🧠" />
                                </div>

                                <Separator />

                                <div className="space-y-2 p-3 rounded-lg border">
                                    <div className="text-xs font-semibold text-muted-foreground">So funktioniert's</div>
                                    <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                                        <p>🏋️ Stelle dich auf ein <span className="text-foreground font-medium">Trainingsgerät</span></p>
                                        <p>⏱️ Alle <span className="font-medium text-cyan-500">{tickStr} Min</span> → <span className="font-medium text-cyan-500">+{data.xpPerTick} XP</span>, <span className="font-medium text-orange-500">-{data.energyCost} Energie</span></p>
                                        <p>⬆️ Bei <span className="font-medium text-cyan-500">{data.xpPerLevel} XP</span> → <span className="font-medium text-emerald-500">Stat-Punkt</span></p>
                                        <p>📊 Verteile mit <span className="font-mono text-foreground">:gym add strength/stamina/intellect</span></p>
                                        <p>🔝 Max <span className="font-medium text-purple-500">Level {data.maxStatLevel}</span> pro Stat</p>
                                    </div>
                                </div>

                                <div className="space-y-2 p-3 rounded-lg border">
                                    <div className="text-xs font-semibold text-muted-foreground">Commands</div>
                                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                        {[
                                            [':gym', 'Stats anzeigen'],
                                            [':gym info', 'Dieses Fenster'],
                                            [':gym add strength', 'Stärke +1'],
                                            [':gym add stamina', 'Ausdauer +1'],
                                            [':gym add intellect', 'Intelligenz +1'],
                                        ].map(([cmd, desc]) => (
                                            <div key={cmd} className="flex items-center gap-1.5">
                                                <span className="font-mono text-foreground shrink-0">{cmd}</span>
                                                <span className="text-muted-foreground">— {desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center text-[10px] text-muted-foreground">
                                    Trainingszeit: {timeStr}
                                </div>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        </div>
    );
};
