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
                    ? 'bg-red-500'
                    : hpPercent > 60
                        ? 'bg-emerald-500'
                        : hpPercent > 30
                            ? 'bg-amber-500'
                            : 'bg-red-500';

                return (
                    <div key={userId} className="fixed z-[100] pointer-events-none -translate-x-1/2" style={{ left: pos.x, top: pos.y + 6 }}>
                        <div className={ `flex flex-col items-center gap-px rounded-md px-1.5 py-0.5 min-w-[60px] border bg-card/90 backdrop-blur-sm ${ data.dead ? 'border-red-500/40' : 'border-border/40' }` }>
                            {data.dead ? (
                                <div className="text-[9px] font-bold text-red-500">KO</div>
                            ) : (
                                <>
                                    <div className="w-full h-[5px] rounded-full overflow-hidden bg-muted">
                                        <div className={ `h-full rounded-full transition-[width] duration-300 ease-out ${ barColor }` } style={{ width: `${hpPercent}%` }} />
                                    </div>
                                    <div className="text-[8px] font-bold text-foreground whitespace-nowrap">
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
