import { GetNitroInstance, GetRoomEngine } from '../../../../api';
import { Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props
{
    selectedTiles: Set<string>;
    previewTiles: Set<string>;
    active: boolean;
}

const tileKey = (x: number, y: number) => `${ x },${ y }`;

const drawTile3D = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    halfTileW: number,
    halfTileH: number,
    thicknessPx: number,
    isPreview: boolean,
    showLeftFace: boolean,
    showRightFace: boolean
) =>
{
    const topAlpha = isPreview ? 0.30 : 0.50;

    // Left side face — only at bottom-left edge of selection
    if(showLeftFace)
    {
        ctx.beginPath();
        ctx.moveTo(cx - halfTileW, cy);
        ctx.lineTo(cx, cy + halfTileH);
        ctx.lineTo(cx, cy + halfTileH + thicknessPx);
        ctx.lineTo(cx - halfTileW, cy + thicknessPx);
        ctx.closePath();
        ctx.fillStyle = `rgba(180, 180, 180, ${ isPreview ? 0.25 : 0.45 })`;
        ctx.fill();
    }

    // Right side face — only at bottom-right edge of selection
    if(showRightFace)
    {
        ctx.beginPath();
        ctx.moveTo(cx + halfTileW, cy);
        ctx.lineTo(cx, cy + halfTileH);
        ctx.lineTo(cx, cy + halfTileH + thicknessPx);
        ctx.lineTo(cx + halfTileW, cy + thicknessPx);
        ctx.closePath();
        ctx.fillStyle = `rgba(220, 220, 220, ${ isPreview ? 0.30 : 0.55 })`;
        ctx.fill();
    }

    // Top face (draw last — on top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - halfTileH);
    ctx.lineTo(cx + halfTileW, cy);
    ctx.lineTo(cx, cy + halfTileH);
    ctx.lineTo(cx - halfTileW, cy);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${ topAlpha })`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${ isPreview ? 0.3 : 0.5 })`;
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

            // Clip drawing to the game canvas area (don't draw over sidebar/topbar)
            const gameCanvas = GetNitroInstance()?.application?.renderer?.view as HTMLCanvasElement;
            if(gameCanvas)
            {
                const canvasRect = gameCanvas.getBoundingClientRect();
                ctx.save();
                ctx.beginPath();
                ctx.rect(canvasRect.left, canvasRect.top, canvasRect.width, canvasRect.height);
                ctx.clip();
            }

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

                    // Skip tiles that don't exist in the room layout (void/black areas)
                    if(wallGeo && wallGeo.isRoomTile && !wallGeo.isRoomTile(tx, ty)) return;

                    const tileZ = wallGeo && wallGeo.getHeight
                        ? wallGeo.getHeight(tx, ty)
                        : 0;

                    // Skip wall/door tiles with negative heights
                    if(tileZ < 0) return;

                    const screenPt = geometry.getScreenPoint(new Vector3d(tx, ty, tileZ));
                    if(!screenPt) return;

                    const cx = Math.round((screenPt.x * scale) + (w / 2) + offsetX);
                    const cy = Math.round((screenPt.y * scale) + (h / 2) + offsetY);

                    // Edge detection: only show side faces at selection boundary
                    const showLeftFace = !tiles.has(tileKey(tx, ty + 1));
                    const showRightFace = !tiles.has(tileKey(tx + 1, ty));

                    drawTile3D(ctx, cx, cy, halfTileW, halfTileH, thicknessPx, isPreview, showLeftFace, showRightFace);
                });
            };

            // Draw confirmed tiles first, then preview on top
            drawTileSet(selectedTiles, false);
            drawTileSet(previewTiles, true);

            // Restore clip state
            if(gameCanvas) ctx.restore();
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
                zIndex: 150,
                mixBlendMode: 'soft-light'
            } }
        />,
        document.body
    );
};
