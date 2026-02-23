import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useCallback, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';
import { ObjectLocationView } from '../room/widgets/object-location/ObjectLocationView';

interface TrainerProgress {
    roomIndex: number;
    xp: number;
    xpMax: number;
    elapsed: number;
    tickSeconds: number;
}

export const GymProgressView: FC<{}> = () =>
{
    const [trainers, setTrainers] = useState<Map<number, TrainerProgress>>(new Map());

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if (parser.type === 'gym.progress') {
            console.log('[GymProgress] Received gym.progress event', Object.fromEntries(parser.parameters || []));
            const p = parser.parameters;
            const userId = parseInt(p?.get('user_id') || '0');
            const data: TrainerProgress = {
                roomIndex: parseInt(p?.get('room_index') || '0'),
                xp: parseInt(p?.get('xp') || '0'),
                xpMax: parseInt(p?.get('xp_max') || '100'),
                elapsed: parseInt(p?.get('elapsed') || '0'),
                tickSeconds: parseInt(p?.get('tick_seconds') || '180'),
            };
            setTrainers(prev => {
                const next = new Map(prev);
                next.set(userId, data);
                return next;
            });
        }

        if (parser.type === 'gym.progress.stop') {
            const userId = parseInt(parser.parameters?.get('user_id') || '0');
            setTrainers(prev => {
                const next = new Map(prev);
                next.delete(userId);
                return next;
            });
        }
    });

    console.log('[GymProgress] Render, trainers:', trainers.size);
    if (trainers.size === 0) return null;

    return (
        <>
            {Array.from(trainers.entries()).map(([userId, data]) => {
                const tickPercent = Math.min((data.elapsed / data.tickSeconds) * 100, 100);
                const xpPercent = Math.min((data.xp / data.xpMax) * 100, 100);

                return (
                    <ObjectLocationView
                        key={userId}
                        objectId={data.roomIndex}
                        category={RoomObjectCategory.UNIT}
                        style={{ pointerEvents: 'none', transform: 'translateY(14px)', zIndex: 100 }}
                    >
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            width: 72, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 5px',
                        }}>
                            {/* Tick progress bar */}
                            <div style={{
                                width: '100%', height: 6, borderRadius: 3, overflow: 'hidden',
                                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${tickPercent}%`,
                                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                                    transition: 'width 9.5s linear',
                                }} />
                            </div>
                            {/* XP text */}
                            <div style={{
                                fontSize: 9, fontWeight: 700, lineHeight: 1,
                                color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                            }}>
                                {data.xp}/{data.xpMax} XP
                            </div>
                        </div>
                    </ObjectLocationView>
                );
            })}
        </>
    );
};
