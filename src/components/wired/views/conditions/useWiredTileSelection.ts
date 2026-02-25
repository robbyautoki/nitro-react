import { useCallback, useEffect, useRef, useState } from 'react';
import { GetRoomEngine } from '../../../../api';

export interface TileCoord { x: number; y: number; }

const tileKey = (x: number, y: number) => `${x},${y}`;

const _tileClickHandlers = new Set<(x: number, y: number) => void>();

(globalThis as any).__wiredTileDispatch = (x: number, y: number) => {
    _tileClickHandlers.forEach(h => h(x, y));
};

export const useWiredTileSelection = () =>
{
    const [ selectedTiles, setSelectedTiles ] = useState<Set<string>>(new Set());
    const [ isSelecting, setIsSelecting ] = useState(false);

    const startSelecting = useCallback(() =>
    {
        (globalThis as any).__wiredTileSelectionActive = true;
        setIsSelecting(true);
    }, []);

    const stopSelecting = useCallback(() =>
    {
        (globalThis as any).__wiredTileSelectionActive = false;
        setIsSelecting(false);
    }, []);

    const clearTiles = useCallback(() =>
    {
        setSelectedTiles(new Set());
    }, []);

    const setTilesFromString = useCallback((str: string) =>
    {
        if (!str || str.length === 0) { setSelectedTiles(new Set()); return; }
        const tiles = new Set<string>();
        str.split(';').forEach(pair => {
            const [x, y] = pair.split(',').map(Number);
            if (!isNaN(x) && !isNaN(y)) tiles.add(tileKey(x, y));
        });
        setSelectedTiles(tiles);
    }, []);

    const tilesToString = useCallback((): string =>
    {
        return Array.from(selectedTiles).join(';');
    }, [ selectedTiles ]);

    useEffect(() =>
    {
        if (!isSelecting) return;

        const handler = (x: number, y: number) =>
        {
            const key = tileKey(x, y);
            setSelectedTiles(prev =>
            {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            });
        };

        _tileClickHandlers.add(handler);
        return () => { _tileClickHandlers.delete(handler); };
    }, [ isSelecting ]);

    useEffect(() =>
    {
        return () => { (globalThis as any).__wiredTileSelectionActive = false; };
    }, []);

    return { selectedTiles, isSelecting, startSelecting, stopSelecting, clearTiles, setTilesFromString, tilesToString, tileCount: selectedTiles.size };
};
