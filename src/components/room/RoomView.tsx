import { FC, useEffect, useRef } from 'react';
import { DispatchMouseEvent, DispatchTouchEvent, GetNitroInstance, GetRoomEngine } from '../../api';
import { Base } from '../../common';
import { useRoom } from '../../hooks';
import { RoomSpectatorView } from './spectator/RoomSpectatorView';
import { RoomWidgetsView } from './widgets/RoomWidgetsView';
import { FogOverlayView } from './FogOverlayView';

const ZOOM_FACTOR = 1.05;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

export const RoomView: FC<{}> = props =>
{
    const { roomSession = null } = useRoom();
    const elementRef = useRef<HTMLDivElement>();
    const roomSessionRef = useRef(roomSession);

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

        const handleWheel = (event: WheelEvent) =>
        {
            if(!(event.ctrlKey || event.metaKey)) return;

            event.preventDefault();

            const session = roomSessionRef.current;
            if(!session) return;

            const roomId = session.roomId;
            let scale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomId, 1);

            if(event.deltaY < 0) scale *= ZOOM_FACTOR;
            else scale /= ZOOM_FACTOR;

            scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

            GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomId, 1, scale);
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });

        const element = elementRef.current;

        if(!element) return;

        element.appendChild(canvas);

        return () => canvas.removeEventListener('wheel', handleWheel);
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
