import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomObjectBounds, GetRoomSession, GetSessionDataManager } from '../../api';
import { useMessageEvent } from '../../hooks';

interface HpData {
    roomIndex: number;
    hp: number;
    maxHp: number;
    dead: boolean;
}

export const CombatHudView: FC<{}> = () =>
{
    const [hpMap, setHpMap] = useState<Map<number, HpData>>(new Map());
    const [positions, setPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
    const hpMapRef = useRef(hpMap);
    hpMapRef.current = hpMap;

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if (parser.type !== 'combat.hp') return;

        const p = parser.parameters;
        const userId = parseInt(p?.get('user_id') || '0');

        // Only show own HP bar
        if (userId !== GetSessionDataManager().userId) return;

        const hp = parseInt(p?.get('hp') || '0');
        const maxHp = parseInt(p?.get('max_hp') || '100');
        const dead = p?.get('dead') === '1';
        const roomIndex = parseInt(p?.get('room_index') || '0');

        setHpMap(prev => {
            const next = new Map(prev);
            next.set(userId, { roomIndex, hp, maxHp, dead });
            return next;
        });

        // Auto-hide after 15s if full HP and not dead
        if (hp >= maxHp && !dead) {
            setTimeout(() => {
                setHpMap(prev => {
                    const current = prev.get(userId);
                    if (current && current.hp >= current.maxHp && !current.dead) {
                        const next = new Map(prev);
                        next.delete(userId);
                        return next;
                    }
                    return prev;
                });
            }, 15000);
        }
    });

    useEffect(() =>
    {
        const updatePositions = () =>
        {
            const current = hpMapRef.current;
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

    if (hpMap.size === 0) return null;

    return (
        <>
            {Array.from(hpMap.entries()).map(([userId, data]) => {
                const pos = positions.get(userId);
                if (!pos) return null;

                const hpPercent = Math.max(0, Math.min((data.hp / data.maxHp) * 100, 100));
                const barColor = data.dead
                    ? '#ef4444'
                    : hpPercent > 60
                        ? '#22c55e'
                        : hpPercent > 30
                            ? '#facc15'
                            : '#ef4444';

                return (
                    <div key={userId} style={{
                        position: 'fixed',
                        left: pos.x,
                        top: pos.y + 6,
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                            background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '2px 5px',
                            border: `1px solid ${data.dead ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
                            minWidth: 60,
                        }}>
                            {data.dead ? (
                                <div style={{
                                    fontSize: 9, fontWeight: 700, color: '#ef4444',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                                }}>
                                    KO
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        width: '100%', height: 5, borderRadius: 3, overflow: 'hidden',
                                        background: 'rgba(255,255,255,0.15)',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            width: `${hpPercent}%`,
                                            background: barColor,
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                    <div style={{
                                        fontSize: 8, fontWeight: 700, color: '#fff',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {data.hp}/{data.maxHp}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
};
