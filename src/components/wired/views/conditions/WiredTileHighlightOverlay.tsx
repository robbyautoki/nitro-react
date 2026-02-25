import { GetRoomEngine } from '../../../../api';
import { Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';

interface Props { selectedTiles: Set<string>; active: boolean; }

export const WiredTileHighlightOverlay: FC<Props> = ({ selectedTiles, active }) =>
{
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() =>
    {
        if (!active && selectedTiles.size === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () =>
        {
            const engine = GetRoomEngine();
            if (!engine) return;

            const roomId = engine.activeRoomId;
            if (roomId < 0) return;

            const renderingCanvas = engine.getRoomInstanceRenderingCanvas(roomId, 0);
            if (!renderingCanvas) return;

            const geometry = renderingCanvas.geometry;
            if (!geometry) return;

            const w = window.innerWidth;
            const h = window.innerHeight;

            if (canvas.width !== w) canvas.width = w;
            if (canvas.height !== h) canvas.height = h;
            ctx.clearRect(0, 0, w, h);

            if (selectedTiles.size === 0) return;

            const scale = renderingCanvas.scale;
            const offsetX = renderingCanvas.screenOffsetX;
            const offsetY = renderingCanvas.screenOffsetY;

            const geoScale = geometry.scale;
            const halfTileW = (geoScale / 2) * scale;
            const halfTileH = (geoScale / 4) * scale;

            selectedTiles.forEach(key =>
            {
                const [ xs, ys ] = key.split(',');
                const tx = parseInt(xs);
                const ty = parseInt(ys);
                if (isNaN(tx) || isNaN(ty)) return;

                const screenPt = geometry.getScreenPoint(new Vector3d(tx, ty, 0));
                if (!screenPt) return;

                const cx = Math.round((screenPt.x * scale) + (w / 2) + offsetX);
                const cy = Math.round((screenPt.y * scale) + (h / 2) + offsetY);

                ctx.beginPath();
                ctx.moveTo(cx, cy - halfTileH);
                ctx.lineTo(cx + halfTileW, cy);
                ctx.lineTo(cx, cy + halfTileH);
                ctx.lineTo(cx - halfTileW, cy);
                ctx.closePath();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        };

        draw();
        const interval = setInterval(draw, 200);
        return () => clearInterval(interval);
    }, [ selectedTiles, active ]);

    if (!active && selectedTiles.size === 0) return null;

    return (
        <canvas
            ref={ canvasRef }
            style={ {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 300
            } }
        />
    );
};
