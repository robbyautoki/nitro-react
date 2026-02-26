import { NitroPoint } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { DispatchMouseEvent, DispatchTouchEvent, GetNitroInstance, GetRoomEngine } from '../../api';
import { Base } from '../../common';
import { useRoom } from '../../hooks';
import { RoomSpectatorView } from './spectator/RoomSpectatorView';
import { RoomWidgetsView } from './widgets/RoomWidgetsView';
import { FogOverlayView } from './FogOverlayView';

const ZOOM_FACTOR = 1.08;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const LERP_SPEED = 0.18;
const LERP_THRESHOLD = 0.003;

export const RoomView: FC<{}> = props =>
{
    const { roomSession = null } = useRoom();
    const elementRef = useRef<HTMLDivElement>();
    const roomSessionRef = useRef(roomSession);
    const targetScaleRef = useRef(1);
    const cursorRef = useRef<NitroPoint>(new NitroPoint());
    const rafRef = useRef<number>(null);
    const animatingRef = useRef(false);

    useEffect(() => { roomSessionRef.current = roomSession; }, [roomSession]);

    useEffect(() =>
    {
        const canvas = GetNitroInstance().application.renderer.view;

        if(!canvas) return;

        canvas.onclick = event => DispatchMouseEvent(event);
        canvas.onmousemove = event => DispatchMouseEvent(event);
        canvas.onmousedown = event => DispatchMouseEvent(event);
        canvas.onmouseup = event => DispatchMouseEvent(event);

        canvas.ontouchstart = event => DispatchTouchEvent(event);
        canvas.ontouchmove = event => DispatchTouchEvent(event);
        canvas.ontouchend = event => DispatchTouchEvent(event);
        canvas.ontouchcancel = event => DispatchTouchEvent(event);

        const animate = () =>
        {
            const session = roomSessionRef.current;
            if(!session) { animatingRef.current = false; return; }

            const roomId = session.roomId;
            const current = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomId, 1);
            const target = targetScaleRef.current;
            const diff = target - current;

            if(Math.abs(diff) < LERP_THRESHOLD)
            {
                GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomId, 1, target, cursorRef.current);
                animatingRef.current = false;
                return;
            }

            const newScale = current + diff * LERP_SPEED;
            GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomId, 1, newScale, cursorRef.current);
            rafRef.current = requestAnimationFrame(animate);
        };

        const handleWheel = (event: WheelEvent) =>
        {
            if(!(event.ctrlKey || event.metaKey)) return;

            event.preventDefault();

            const session = roomSessionRef.current;
            if(!session) return;

            const roomId = session.roomId;

            if(!animatingRef.current)
            {
                targetScaleRef.current = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomId, 1);
            }

            if(event.deltaY < 0) targetScaleRef.current *= ZOOM_FACTOR;
            else targetScaleRef.current /= ZOOM_FACTOR;

            targetScaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScaleRef.current));
            cursorRef.current = new NitroPoint(event.clientX, event.clientY);

            if(!animatingRef.current)
            {
                animatingRef.current = true;
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });

        const element = elementRef.current;

        if(!element) return;

        element.appendChild(canvas);

        return () =>
        {
            canvas.removeEventListener('wheel', handleWheel);
            if(rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <Base fit innerRef={ elementRef } className={ (!roomSession && 'hidden') }>
            { roomSession &&
                <>
                    <RoomWidgetsView />
                    <FogOverlayView />
                    { roomSession.isSpectator && <RoomSpectatorView /> }
                </> }
        </Base>
    );
}
