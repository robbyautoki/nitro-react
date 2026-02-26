import { GetRoomEngine } from '../../../../api';
import { Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props
{
    selectedTiles: Set<string>;
    previewTiles: Set<string>;
    active: boolean;
}

const drawTile3D = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    halfTileW: number,
    halfTileH: number,
    thicknessPx: number,
    isPreview: boolean
) =>
{
    const topAlpha = isPreview ? 0.35 : 0.75;
    const rightAlpha = isPreview ? 0.25 : 0.65;
    const leftAlpha = isPreview ? 0.2 : 0.55;

    // Left side face (draw first — behind)
    ctx.beginPath();
    ctx.moveTo(cx - halfTileW, cy);
    ctx.lineTo(cx, cy + halfTileH);
    ctx.lineTo(cx, cy + halfTileH + thicknessPx);
    ctx.lineTo(cx - halfTileW, cy + thicknessPx);
    ctx.closePath();
    ctx.fillStyle = `rgba(180, 180, 180, ${ leftAlpha })`;
    ctx.fill();

    // Right side face
    ctx.beginPath();
    ctx.moveTo(cx + halfTileW, cy);
    ctx.lineTo(cx, cy + halfTileH);
    ctx.lineTo(cx, cy + halfTileH + thicknessPx);
    ctx.lineTo(cx + halfTileW, cy + thicknessPx);
    ctx.closePath();
    ctx.fillStyle = `rgba(220, 220, 220, ${ rightAlpha })`;
    ctx.fill();

    // Top face (draw last — on top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - halfTileH);
    ctx.lineTo(cx + halfTileW, cy);
    ctx.lineTo(cx, cy + halfTileH);
    ctx.lineTo(cx - halfTileW, cy);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${ topAlpha })`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${ isPreview ? 0.4 : 0.8 })`;
    ctx.lineWidth = 1;
    ctx.stroke();
};

export const WiredTileHighlightOverlay: FC<Props> = ({ selectedTiles, previewTiles, active }) =>
{
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() =>
    {
        if(!active && selectedTiles.size === 0 && previewTiles.size === 0) return;

        const canvas = canvasRef.current;
        if(!canvas) return;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const draw = () =>
        {
            const engine = GetRoomEngine();
            if(!engine) return;

            const roomId = engine.activeRoomId;
            if(roomId < 0) return;

            const renderingCanvas = engine.getRoomInstanceRenderingCanvas(roomId, 1);
            if(!renderingCanvas) return;

            const geometry = renderingCanvas.geometry;
            if(!geometry) return;

            const w = window.innerWidth;
            const h = window.innerHeight;

            if(canvas.width !== w) canvas.width = w;
            if(canvas.height !== h) canvas.height = h;
            ctx.clearRect(0, 0, w, h);

            if(selectedTiles.size === 0 && previewTiles.size === 0) return;

            const scale = renderingCanvas.scale;
            const offsetX = renderingCanvas.screenOffsetX;
            const offsetY = renderingCanvas.screenOffsetY;

            const geoScale = geometry.scale;
            const halfTileW = (geoScale / 2) * scale;
            const halfTileH = (geoScale / 4) * scale;

            // Calculate floor thickness in pixels
            const topRef = geometry.getScreenPoint(new Vector3d(0, 0, 0));
            const botRef = geometry.getScreenPoint(new Vector3d(0, 0, -0.25));
            const thicknessPx = (botRef && topRef)
                ? Math.round(Math.abs(botRef.y - topRef.y) * scale)
                : Math.round(8 * scale);

            // Try to get floor height map for multi-level rooms
            const wallGeo = (engine as any).getLegacyWallGeometry
                ? (engine as any).getLegacyWallGeometry(roomId)
                : null;

            const drawTileSet = (tiles: Set<string>, isPreview: boolean) =>
            {
                tiles.forEach(key =>
                {
                    const [ xs, ys ] = key.split(',');
                    const tx = parseInt(xs);
                    const ty = parseInt(ys);
                    if(isNaN(tx) || isNaN(ty)) return;

                    const tileZ = wallGeo && wallGeo.getHeight
                        ? wallGeo.getHeight(tx, ty)
                        : 0;

                    const screenPt = geometry.getScreenPoint(new Vector3d(tx, ty, tileZ));
                    if(!screenPt) return;

                    const cx = Math.round((screenPt.x * scale) + (w / 2) + offsetX);
                    const cy = Math.round((screenPt.y * scale) + (h / 2) + offsetY);

                    drawTile3D(ctx, cx, cy, halfTileW, halfTileH, thicknessPx, isPreview);
                });
            };

            // Draw confirmed tiles first, then preview on top
            drawTileSet(selectedTiles, false);
            drawTileSet(previewTiles, true);
        };

        draw();
        const interval = setInterval(draw, 200);
        return () => clearInterval(interval);
    }, [ selectedTiles, previewTiles, active ]);

    if(!active && selectedTiles.size === 0 && previewTiles.size === 0) return null;

    return createPortal(
        <canvas
            ref={ canvasRef }
            style={ {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999
            } }
        />,
        document.body
    );
};
