import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Button, Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const GRID_SIZE = 11;
const HALF = Math.floor(GRID_SIZE / 2);
const TILE_W = 20;
const TILE_H = 10;

const SOURCE_LABELS = [
    'Den auslösenden User nehmen',
    'Den auslösenden Gegenstand nehmen',
    'Ausgewähltes Möbel nehmen',
    'Möbel aus Signal nehmen',
    'User aus Signal nehmen',
    'Den angeklickten User nehmen'
];

const enum DrawMode { ADD, REMOVE, CLEAR }

const isoToScreen = (gx: number, gy: number, cx: number, cy: number): [number, number] =>
{
    const sx = cx + (gx - gy) * (TILE_W / 2);
    const sy = cy + (gx + gy) * (TILE_H / 2);
    return [ sx, sy ];
};

const screenToIso = (sx: number, sy: number, cx: number, cy: number): [number, number] =>
{
    const dx = sx - cx;
    const dy = sy - cy;
    const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
    const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
    return [ Math.floor(gx), Math.floor(gy) ];
};

const drawDiamond = (ctx: CanvasRenderingContext2D, sx: number, sy: number, fill: string, stroke: string) =>
{
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.5;
    ctx.stroke();
};

export const WiredSelectorNeighborhoodView: FC<{ title: string }> = ({ title }) =>
{
    const [ selectedOffsets, setSelectedOffsets ] = useState<Set<string>>(new Set());
    const [ sourceType, setSourceType ] = useState(0);
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const [ drawMode, setDrawMode ] = useState<DrawMode>(DrawMode.ADD);
    const [ hoverTile, setHoverTile ] = useState<[number, number] | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    const { trigger = null, setIntParams = null, setStringParam = null, setFurniIds = null, setAllowsFurni = null } = useWired();

    const canvasW = GRID_SIZE * TILE_W + TILE_W;
    const canvasH = GRID_SIZE * TILE_H + TILE_H + 4;
    const centerX = canvasW / 2;
    const centerY = TILE_H + 2;

    const offsetKey = (dx: number, dy: number) => `${ dx },${ dy }`;

    const isValidGridPos = (gx: number, gy: number) => gx >= -HALF && gx <= HALF && gy >= -HALF && gy <= HALF;
    const isCenter = (gx: number, gy: number) => gx === 0 && gy === 0;

    const renderCanvas = useCallback(() =>
    {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.clearRect(0, 0, canvasW, canvasH);

        for(let gy = -HALF; gy <= HALF; gy++)
        {
            for(let gx = -HALF; gx <= HALF; gx++)
            {
                const [ sx, sy ] = isoToScreen(gx, gy, centerX, centerY);
                const key = offsetKey(gx, gy);
                const center = isCenter(gx, gy);
                const selected = selectedOffsets.has(key);
                const hovered = hoverTile && hoverTile[0] === gx && hoverTile[1] === gy;

                let fill: string;
                let stroke: string;

                if(center)
                {
                    fill = '#ffffff';
                    stroke = '#888888';
                }
                else if(selected)
                {
                    fill = hovered ? '#5599ff' : '#3377dd';
                    stroke = '#2255aa';
                }
                else
                {
                    fill = hovered ? '#555555' : '#333344';
                    stroke = '#444455';
                }

                drawDiamond(ctx, sx, sy, fill, stroke);
            }
        }
    }, [ selectedOffsets, hoverTile, canvasW, canvasH, centerX, centerY ]);

    useEffect(() => { renderCanvas(); }, [ renderCanvas ]);

    const handleCanvasEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>, click: boolean) =>
    {
        const canvas = canvasRef.current;
        if(!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);

        const [ gx, gy ] = screenToIso(mx, my, centerX, centerY);

        if(!isValidGridPos(gx, gy) || isCenter(gx, gy))
        {
            setHoverTile(null);
            return;
        }

        setHoverTile([ gx, gy ]);

        if(click || isDrawingRef.current)
        {
            const key = offsetKey(gx, gy);
            setSelectedOffsets(prev =>
            {
                const next = new Set(prev);
                if(drawMode === DrawMode.ADD)
                {
                    next.add(key);
                }
                else if(drawMode === DrawMode.REMOVE)
                {
                    next.delete(key);
                }
                return next;
            });
        }
    }, [ drawMode, centerX, centerY ]);

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) =>
    {
        isDrawingRef.current = true;
        handleCanvasEvent(e, true);
    }, [ handleCanvasEvent ]);

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) =>
    {
        handleCanvasEvent(e, false);
    }, [ handleCanvasEvent ]);

    const onMouseUp = useCallback(() => { isDrawingRef.current = false; }, []);
    const onMouseLeave = useCallback(() => { isDrawingRef.current = false; setHoverTile(null); }, []);

    const clearAll = useCallback(() => setSelectedOffsets(new Set()), []);

    const requiresFurni = sourceType === 2 ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    useEffect(() =>
    {
        if(setAllowsFurni) setAllowsFurni(requiresFurni);
    }, [ sourceType, setAllowsFurni, requiresFurni ]);

    const save = () =>
    {
        const offStr = Array.from(selectedOffsets).join(';');
        setStringParam(offStr);
        setIntParams([ sourceType, filterExisting ? 1 : 0, invert ? 1 : 0 ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const str = trigger.stringData || '';
        if(str.length > 0)
        {
            const set = new Set<string>();
            str.split(';').forEach(pair =>
            {
                const parts = pair.split(',');
                if(parts.length === 2)
                {
                    const dx = parseInt(parts[0]);
                    const dy = parseInt(parts[1]);
                    if(!isNaN(dx) && !isNaN(dy) && isValidGridPos(dx, dy) && !isCenter(dx, dy))
                    {
                        set.add(offsetKey(dx, dy));
                    }
                }
            });
            setSelectedOffsets(set);
        }
        else
        {
            setSelectedOffsets(new Set());
        }

        const p = trigger.intData || [];
        if(p.length >= 3)
        {
            setSourceType(p[0]);
            setFilterExisting(p[1] === 1);
            setInvert(p[2] === 1);
        }
        else if(p.length >= 2)
        {
            setFilterExisting(p[0] === 1);
            setInvert(p[1] === 1);
        }
    }, [ trigger ]);

    const cycleSrc = (dir: number) =>
    {
        setSourceType(prev => ((prev + dir + SOURCE_LABELS.length) % SOURCE_LABELS.length));
    };

    return (
        <WiredConditionBaseView requiresFurni={ requiresFurni } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold small>Zeichenmodus</Text>
                <Flex gap={ 1 }>
                    <Button variant={ drawMode === DrawMode.ADD ? 'success' : 'secondary' } onClick={ () => setDrawMode(DrawMode.ADD) } style={ { minWidth: 28, padding: '2px 6px', fontSize: 14 } }>
                        ✏️+
                    </Button>
                    <Button variant={ drawMode === DrawMode.REMOVE ? 'danger' : 'secondary' } onClick={ () => setDrawMode(DrawMode.REMOVE) } style={ { minWidth: 28, padding: '2px 6px', fontSize: 14 } }>
                        ✏️✕
                    </Button>
                    <Button variant="secondary" onClick={ clearAll } style={ { minWidth: 28, padding: '2px 6px', fontSize: 14 } }>
                        🔄
                    </Button>
                </Flex>
            </Column>
            <Column gap={ 1 }>
                <Text bold small>Benachbarte Fliesen auswählen</Text>
                <div style={ { background: '#1a1a2e', borderRadius: 4, padding: 4, display: 'flex', justifyContent: 'center' } }>
                    <canvas
                        ref={ canvasRef }
                        width={ canvasW }
                        height={ canvasH }
                        style={ { cursor: 'crosshair', imageRendering: 'pixelated' } }
                        onMouseDown={ onMouseDown }
                        onMouseMove={ onMouseMove }
                        onMouseUp={ onMouseUp }
                        onMouseLeave={ onMouseLeave }
                    />
                </div>
                <Flex justifyContent="center" gap={ 2 }>
                    <Text small className="text-muted">x: { hoverTile ? hoverTile[0] : 0 }</Text>
                    <Text small className="text-muted">y: { hoverTile ? hoverTile[1] : 0 }</Text>
                </Flex>
            </Column>
            <Column gap={ 1 }>
                <Text bold small>Selektor-Optionen:</Text>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" checked={ filterExisting } onChange={ e => setFilterExisting(e.target.checked) } />
                    <Text small>Vorhandene Auswahl filtern</Text>
                </Flex>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                    <Text small>Umkehren</Text>
                </Flex>
            </Column>
            <Column gap={ 1 }>
                <Text bold small>In der Nähe von:</Text>
                <Flex alignItems="center" gap={ 1 }>
                    <Button variant="secondary" onClick={ () => cycleSrc(-1) } style={ { padding: '2px 8px' } }>◀</Button>
                    <Text small style={ { flex: 1, textAlign: 'center' } }>{ SOURCE_LABELS[sourceType] }</Text>
                    <Button variant="secondary" onClick={ () => cycleSrc(1) } style={ { padding: '2px 8px' } }>▶</Button>
                </Flex>
            </Column>
        </WiredConditionBaseView>
    );
};
