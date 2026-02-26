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

// Only need move + end handlers (tiles don't fire MOUSE_DOWN, only MOUSE_MOVE + CLICK)
const _dragMoveHandlers = new Set<(x: number, y: number) => void>();
const _dragEndHandlers = new Set<(x: number, y: number) => void>();

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
    const mouseIsDownRef = useRef(false);
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
        mouseIsDownRef.current = false;
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

        // Track mouse button state at browser level
        // (Floor tiles only fire MOUSE_MOVE + CLICK, not MOUSE_DOWN)
        const onDocMouseDown = () =>
        {
            mouseIsDownRef.current = true;
        };

        const onDocMouseUp = () =>
        {
            mouseIsDownRef.current = false;
        };

        const onDragMove = (x: number, y: number) =>
        {
            if(dragFinalizedRef.current) return;

            if(mouseIsDownRef.current && !dragAnchorRef.current)
            {
                // First MOUSE_MOVE with button pressed → start drag
                dragAnchorRef.current = { x, y };
                dragEndRef.current = { x, y };
                dragFinalizedRef.current = false;
                setIsDragging(true);
                setPreviewTiles(rectToTiles(x, y, x, y));
            }
            else if(dragAnchorRef.current)
            {
                // Continue drag → update preview
                dragEndRef.current = { x, y };
                const anchor = dragAnchorRef.current;
                setPreviewTiles(rectToTiles(anchor.x, anchor.y, x, y));
            }
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
            if(dragAnchorRef.current)
            {
                // Normal drag end → finalize rectangle
                finalizeDrag(x, y);
            }
            else
            {
                // Click without drag → select single tile
                setRect({ x1: x, y1: y, x2: x, y2: y });
            }
        };

        // Safety-net: finalize drag on global mouseup
        const onMouseUp = () =>
        {
            mouseIsDownRef.current = false;

            if(!dragEndRef.current || dragFinalizedRef.current) return;

            finalizeDrag(dragEndRef.current.x, dragEndRef.current.y);
        };

        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('mouseup', onDocMouseUp, true);
        _dragMoveHandlers.add(onDragMove);
        _dragEndHandlers.add(onDragEnd);
        document.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('mouseup', onDocMouseUp, true);
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
