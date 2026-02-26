import { Vector3d } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetNitroInstance, GetRoomEngine, WiredSelectionVisualizer } from '../../../../api';

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

// Build a screen-to-tile converter using the room geometry's inverse isometric projection
const buildScreenToTile = (): ((clientX: number, clientY: number) => { x: number; y: number } | null) | null =>
{
    const engine = GetRoomEngine();
    if(!engine) return null;

    const roomId = engine.activeRoomId;
    if(roomId < 0) return null;

    const rc = engine.getRoomInstanceRenderingCanvas(roomId, 0);
    if(!rc) return null;

    const geo = rc.geometry;
    if(!geo) return null;

    const scale = rc.scale;
    const offX = rc.screenOffsetX;
    const offY = rc.screenOffsetY;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Compute basis vectors from the geometry
    const origin = geo.getScreenPoint(new Vector3d(0, 0, 0));
    const xRef = geo.getScreenPoint(new Vector3d(1, 0, 0));
    const yRef = geo.getScreenPoint(new Vector3d(0, 1, 0));
    if(!origin || !xRef || !yRef) return null;

    const xBasisX = xRef.x - origin.x;
    const xBasisY = xRef.y - origin.y;
    const yBasisX = yRef.x - origin.x;
    const yBasisY = yRef.y - origin.y;
    const det = xBasisX * yBasisY - xBasisY * yBasisX;
    if(Math.abs(det) < 0.001) return null;

    return (clientX: number, clientY: number) =>
    {
        // Browser coords → rendering canvas coords (unscaled)
        const canvasX = (clientX - w / 2 - offX) / scale;
        const canvasY = (clientY - h / 2 - offY) / scale;

        // Relative to origin
        const dx = canvasX - origin.x;
        const dy = canvasY - origin.y;

        // Inverse isometric projection (2x2 matrix inversion)
        const tx = (dx * yBasisY - dy * yBasisX) / det;
        const ty = (dy * xBasisX - dx * xBasisY) / det;

        return { x: Math.floor(tx), y: Math.floor(ty) };
    };
};

export const useWiredTileSelection = () =>
{
    const [ rect, setRect ] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [ isSelecting, setIsSelecting ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const dragAnchorRef = useRef<{ x: number; y: number } | null>(null);
    const dragEndRef = useRef<{ x: number; y: number } | null>(null);
    const converterRef = useRef<((clientX: number, clientY: number) => { x: number; y: number } | null) | null>(null);
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
        converterRef.current = null;
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

    // Document-level drag handlers (bypasses Nitro engine entirely)
    useEffect(() =>
    {
        if(!isSelecting) return;

        const gameCanvas = GetNitroInstance()?.application?.renderer?.view as HTMLCanvasElement;

        const onMouseDown = (e: MouseEvent) =>
        {
            // Only react to clicks on the game canvas
            if(e.target !== gameCanvas) return;

            const converter = buildScreenToTile();
            if(!converter) return;

            const tile = converter(e.clientX, e.clientY);
            if(!tile) return;

            dragAnchorRef.current = tile;
            dragEndRef.current = tile;
            converterRef.current = converter;
            setIsDragging(true);
            setPreviewTiles(rectToTiles(tile.x, tile.y, tile.x, tile.y));
        };

        const onMouseMove = (e: MouseEvent) =>
        {
            if(!dragAnchorRef.current || !converterRef.current) return;

            const tile = converterRef.current(e.clientX, e.clientY);
            if(!tile) return;

            dragEndRef.current = tile;
            const anchor = dragAnchorRef.current;
            setPreviewTiles(rectToTiles(anchor.x, anchor.y, tile.x, tile.y));
        };

        const onMouseUp = () =>
        {
            if(!dragAnchorRef.current) return;

            const end = dragEndRef.current || dragAnchorRef.current;
            const anchor = dragAnchorRef.current;
            setRect({ x1: anchor.x, y1: anchor.y, x2: end.x, y2: end.y });
            setPreviewTiles(new Set());
            setIsDragging(false);
            dragAnchorRef.current = null;
            dragEndRef.current = null;
            converterRef.current = null;
        };

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
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
