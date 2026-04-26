import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomObjectBounds, GetRoomSession, GetSessionDataManager } from '../../api';
import { useMessageEvent } from '../../hooks';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';

interface TrainerProgress {
    roomIndex: number;
    xp: number;
    xpMax: number;
    elapsed: number;
    tickSeconds: number;
}

export const GymProgressView: FC<{}> = () =>
{
    const [ trainers, setTrainers ] = useState<Map<number, TrainerProgress>>(new Map());
    const [ positions, setPositions ] = useState<Map<number, { x: number; y: number }>>(new Map());
    const trainersRef = useRef(trainers);
    trainersRef.current = trainers;

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if (parser.type === 'gym.progress')
        {
            const p = parser.parameters;
            const userId = parseInt(p?.get('user_id') || '0');
            if (userId !== GetSessionDataManager().userId) return;
            setTrainers(prev =>
            {
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

        if (parser.type === 'gym.progress.stop')
        {
            const userId = parseInt(parser.parameters?.get('user_id') || '0');
            setTrainers(prev =>
            {
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
        return () =>
        {
            GetTicker().remove(updatePositions);
        };
    }, []);

    if (trainers.size === 0) return null;

    return (
        <>
            { Array.from(trainers.entries()).map(([ userId, data ]) =>
            {
                const pos = positions.get(userId);
                if (!pos) return null;

                const tickPercent = Math.min((data.elapsed / data.tickSeconds) * 100, 100);

                return (
                    <div key={ userId } className="fixed z-[100] pointer-events-none -translate-x-1/2" style={ { left: pos.x, top: pos.y + 14 } }>
                        <AlignSurface.Panel className="flex min-w-[70px] flex-col items-center gap-0.5 rounded-lg px-1.5 py-1">
                            <AlignProgressBar.Root className="h-1.5" value={ tickPercent } color="blue" />
                            <div className="whitespace-nowrap text-[9px] font-bold text-text-strong-950">
                                { data.xp }/{ data.xpMax } XP
                            </div>
                        </AlignSurface.Panel>
                    </div>
                );
            }) }
        </>
    );
};
