import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a debounced wrapper around `fn`. Successive calls reset the timer,
 * so the underlying function only fires once after `delay` ms of silence.
 *
 * Used for live-refresh patterns (e.g. on InventoryFurniAddedEvent), where
 * many events may arrive in burst (login sync) and we only want one re-fetch.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay: number = 500): T
{
    const fnRef = useRef(fn);
    fnRef.current = fn;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() =>
    {
        return () =>
        {
            if(timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return useCallback(((...args: any[]) =>
    {
        if(timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    }) as T, [ delay ]);
}
