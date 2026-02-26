import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WiredSelectionVisualizer } from '../../../../api';

const tileKey = (x: number, y: number) => `${ x },${ y }`;

const rectToTiles = (x1: number, y1: number, x2: number, y2: number): Set<string> =>
{
    const tiles = new Set<string>();
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for(let x = minX; x <= maxX; x++)
    {
        for(let y = minY; y <= maxY; y++)
        {
            tiles.add(tileKey(x, y));
        }
    }

    return tiles;
};

// Drag event handler sets
const _dragStartHandlers = new Set<(x: number, y: number) => void>();
const _dragMoveHandlers = new Set<(x: number, y: number) => void>();
const _dragEndHandlers = new Set<(x: number, y: number) => void>();

(globalThis as any).__wiredTileDragStart = (x: number, y: number) =>
{
    _dragStartHandlers.forEach(h => h(x, y));
};

(globalThis as any).__wiredTileDragMove = (x: number, y: number) =>
{
    _dragMoveHandlers.forEach(h => h(x, y));
};

(globalThis as any).__wiredTileDragEnd = (x: number, y: number) =>
{
    _dragEndHandlers.forEach(h => h(x, y));
};

export const useWiredTileSelection = () =>
{
    const [ rect, setRect ] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [ isSelecting, setIsSelecting ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const dragAnchorRef = useRef<{ x: number; y: number } | null>(null);
    const dragEndRef = useRef<{ x: number; y: number } | null>(null);
    const dragFinalizedRef = useRef(false);
    const [ previewTiles, setPreviewTiles ] = useState<Set<string>>(new Set());

    const selectedTiles = useMemo(() =>
    {
        if(!rect) return new Set<string>();

        return rectToTiles(rect.x1, rect.y1, rect.x2, rect.y2);
    }, [ rect ]);

    const startSelecting = useCallback(() =>
    {
        (globalThis as any).__wiredTileSelectionActive = true;
        WiredSelectionVisualizer.applyAreaSelectionTransparency();
        setIsSelecting(true);
    }, []);

    const stopSelecting = useCallback(() =>
    {
        (globalThis as any).__wiredTileSelectionActive = false;
        WiredSelectionVisualizer.clearAreaSelectionTransparency();
        setIsSelecting(false);
        setIsDragging(false);
        setPreviewTiles(new Set());
        dragAnchorRef.current = null;
        dragEndRef.current = null;
    }, []);

    const clearTiles = useCallback(() =>
    {
        setRect(null);
        setPreviewTiles(new Set());
        dragAnchorRef.current = null;
        dragEndRef.current = null;
        setIsDragging(false);
    }, []);

    const setTilesFromString = useCallback((str: string) =>
    {
        if(!str || str.length === 0)
        {
            setRect(null);
            return;
        }

        // Parse tiles and compute bounding rectangle
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasValid = false;

        str.split(';').forEach(pair =>
        {
            const [ x, y ] = pair.split(',').map(Number);

            if(!isNaN(x) && !isNaN(y))
            {
                if(x < minX) minX = x;
                if(x > maxX) maxX = x;
                if(y < minY) minY = y;
                if(y > maxY) maxY = y;
                hasValid = true;
            }
        });

        if(hasValid)
        {
            setRect({ x1: minX, y1: minY, x2: maxX, y2: maxY });
        }
        else
        {
            setRect(null);
        }
    }, []);

    const tilesToString = useCallback((): string =>
    {
        return Array.from(selectedTiles).join(';');
    }, [ selectedTiles ]);

    // Register drag handlers when selecting
    useEffect(() =>
    {
        if(!isSelecting) return;

        const onDragStart = (x: number, y: number) =>
        {
            dragAnchorRef.current = { x, y };
            dragEndRef.current = { x, y };
            dragFinalizedRef.current = false;
            setIsDragging(true);
            setPreviewTiles(rectToTiles(x, y, x, y));
        };

        const onDragMove = (x: number, y: number) =>
        {
            if(!dragAnchorRef.current || dragFinalizedRef.current) return;

            dragEndRef.current = { x, y };
            const anchor = dragAnchorRef.current;
            setPreviewTiles(rectToTiles(anchor.x, anchor.y, x, y));
        };

        const finalizeDrag = (endX: number, endY: number) =>
        {
            if(!dragAnchorRef.current || dragFinalizedRef.current) return;

            dragFinalizedRef.current = true;
            const anchor = dragAnchorRef.current;
            setRect({ x1: anchor.x, y1: anchor.y, x2: endX, y2: endY });
            setPreviewTiles(new Set());
            setIsDragging(false);
            dragAnchorRef.current = null;
            dragEndRef.current = null;
        };

        const onDragEnd = (x: number, y: number) =>
        {
            finalizeDrag(x, y);
        };

        // Safety-net: finalize drag on global mouseup
        const onMouseUp = () =>
        {
            if(!dragEndRef.current) return;

            finalizeDrag(dragEndRef.current.x, dragEndRef.current.y);
        };

        _dragStartHandlers.add(onDragStart);
        _dragMoveHandlers.add(onDragMove);
        _dragEndHandlers.add(onDragEnd);
        document.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            _dragStartHandlers.delete(onDragStart);
            _dragMoveHandlers.delete(onDragMove);
            _dragEndHandlers.delete(onDragEnd);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [ isSelecting ]);

    // Cleanup on unmount
    useEffect(() =>
    {
        return () =>
        {
            (globalThis as any).__wiredTileSelectionActive = false;
            WiredSelectionVisualizer.clearAreaSelectionTransparency();
        };
    }, []);

    return {
        selectedTiles,
        previewTiles,
        isSelecting,
        isDragging,
        startSelecting,
        stopSelecting,
        clearTiles,
        setTilesFromString,
        tilesToString,
        tileCount: selectedTiles.size
    };
};
