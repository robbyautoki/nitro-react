import { RoomDataParser } from '@nitrots/nitro-renderer';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Tracks the delta of `userCount` per room across multiple refreshes.
 * Returns a Map<roomId, delta> where delta is the change since the last refresh.
 */
export const useTrendingDelta = (rooms: RoomDataParser[]) =>
{
    const previousRef = useRef<Map<number, number>>(new Map());
    const [ deltas, setDeltas ] = useState<Map<number, number>>(new Map());

    useEffect(() =>
    {
        const next = new Map<number, number>();
        const newDeltas = new Map<number, number>();

        for(const room of rooms)
        {
            const prev = previousRef.current.get(room.roomId);
            if(typeof prev === 'number')
            {
                const diff = room.userCount - prev;
                if(diff !== 0) newDeltas.set(room.roomId, diff);
            }
            next.set(room.roomId, room.userCount);
        }

        previousRef.current = next;
        setDeltas(newDeltas);

        // Auto-clear deltas after a short while to avoid permanent green/red ↑↓
        const timer = window.setTimeout(() => setDeltas(new Map()), 4000);
        return () => window.clearTimeout(timer);
    }, [ rooms ]);

    const trendingRooms = useMemo(() =>
    {
        const ids = new Set<number>();
        deltas.forEach((value, key) => { if(value > 0) ids.add(key); });
        return rooms.filter(r => ids.has(r.roomId)).sort((a, b) => (deltas.get(b.roomId) ?? 0) - (deltas.get(a.roomId) ?? 0));
    }, [ rooms, deltas ]);

    return { deltas, trendingRooms };
};
