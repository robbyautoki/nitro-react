import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomObjectBounds, GetRoomSession, GetSessionDataManager } from '../../api';
import { useMessageEvent } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';

interface HpData {
    roomIndex: number;
    hp: number;
    maxHp: number;
    dead: boolean;
}

export const CombatHudView: FC<{}> = () =>
{
    const [ hpMap, setHpMap ] = useState<Map<number, HpData>>(new Map());
    const [ positions, setPositions ] = useState<Map<number, { x: number; y: number }>>(new Map());
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

        setHpMap(prev =>
        {
            const next = new Map(prev);
            next.set(userId, { roomIndex, hp, maxHp, dead });
            return next;
        });

        if (hp >= maxHp && !dead)
        {
            setTimeout(() =>
            {
                setHpMap(prev =>
                {
                    const current = prev.get(userId);
                    if (current && current.hp >= current.maxHp && !current.dead)
                    {
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
        return () =>
        {
            GetTicker().remove(updatePositions);
        };
    }, []);

    if (hpMap.size === 0) return null;

    return (
        <>
            { Array.from(hpMap.entries()).map(([ userId, data ]) =>
            {
                const pos = positions.get(userId);
                if (!pos) return null;

                const hpPercent = Math.max(0, Math.min((data.hp / data.maxHp) * 100, 100));
                const barColor: 'red' | 'orange' | 'green' = data.dead
                    ? 'red'
                    : hpPercent > 60
                        ? 'green'
                        : hpPercent > 30
                            ? 'orange'
                            : 'red';

                return (
                    <div key={ userId } className="fixed z-[100] pointer-events-none -translate-x-1/2" style={ { left: pos.x, top: pos.y + 6 } }>
                        <AlignSurface.Panel className={ `flex min-w-[60px] flex-col items-center gap-px rounded-lg px-1.5 py-0.5 ${ data.dead ? 'ring-error-base' : '' }` }>
                            { data.dead ? (
                                <AlignBadge.Root color="red" variant="lighter" size="small">KO</AlignBadge.Root>
                            ) : (
                                <>
                                    <AlignProgressBar.Root className="h-[5px]" value={ hpPercent } color={ barColor } />
                                    <div className="whitespace-nowrap text-[8px] font-bold text-text-strong-950">
                                        { data.hp }/{ data.maxHp }
                                    </div>
                                </>
                            ) }
                        </AlignSurface.Panel>
                    </div>
                );
            }) }
        </>
    );
};
