import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomObjectBounds, GetRoomSession, GetSessionDataManager } from '../../api';
import { useMessageEvent } from '../../hooks';

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
    const [positions, setPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
    const trainersRef = useRef(trainers);
    trainersRef.current = trainers;

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if (parser.type === 'gym.progress') {
            const p = parser.parameters;
            const userId = parseInt(p?.get('user_id') || '0');
            if (userId !== GetSessionDataManager().userId) return;
            setTrainers(prev => {
                const next = new Map(prev);
                next.set(userId, {
                    roomIndex: parseInt(p?.get('room_index') || '0'),
                    xp: parseInt(p?.get('xp') || '0'),
                    xpMax: parseInt(p?.get('xp_max') || '100'),
                    elapsed: parseInt(p?.get('elapsed') || '0'),
                    tickSeconds: parseInt(p?.get('tick_seconds') || '180'),
                });
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

    useEffect(() =>
    {
        const updatePositions = () =>
        {
            const current = trainersRef.current;
            if (current.size === 0) return;

            const roomSession = GetRoomSession();
            if (!roomSession) return;

            const newPositions = new Map<number, { x: number; y: number }>();
            current.forEach((data, userId) =>
            {
                const bounds = GetRoomObjectBounds(roomSession.roomId, data.roomIndex, RoomObjectCategory.UNIT, 1);
                if (bounds)
                {
                    newPositions.set(userId, {
                        x: Math.round(bounds.left + bounds.width / 2),
                        y: Math.round(bounds.top),
                    });
                }
            });
            setPositions(newPositions);
        };

        GetTicker().add(updatePositions);
        return () => { GetTicker().remove(updatePositions); };
    }, []);

    if (trainers.size === 0) return null;

    return (
        <>
            {Array.from(trainers.entries()).map(([userId, data]) => {
                const pos = positions.get(userId);
                if (!pos) return null;

                const tickPercent = Math.min((data.elapsed / data.tickSeconds) * 100, 100);

                return (
                    <div key={userId} style={{
                        position: 'fixed',
                        left: pos.x,
                        top: pos.y + 14,
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 6px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            minWidth: 70,
                        }}>
                            <div style={{
                                width: '100%', height: 6, borderRadius: 3, overflow: 'hidden',
                                background: 'rgba(255,255,255,0.15)',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${tickPercent}%`,
                                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                                    transition: 'width 9.5s linear',
                                }} />
                            </div>
                            <div style={{
                                fontSize: 9, fontWeight: 700, color: '#fff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                                whiteSpace: 'nowrap',
                            }}>
                                {data.xp}/{data.xpMax} XP
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};
