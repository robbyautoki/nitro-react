import { ColorConverter, GetTicker, IRoomRenderingCanvas, RoomPreviewer, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';

export interface LayoutRoomPreviewerViewProps
{
    roomPreviewer: RoomPreviewer;
    height?: number;
    children?: ReactNode;
}

export const LayoutRoomPreviewerView: FC<LayoutRoomPreviewerViewProps> = props =>
{
    const { roomPreviewer = null, height = 0, children = null } = props;
    const [ renderingCanvas, setRenderingCanvas ] = useState<IRoomRenderingCanvas>(null);
    const elementRef = useRef<HTMLDivElement>();
    const canvasRef = useRef<IRoomRenderingCanvas>(null);

    const onClick = (event: MouseEvent<HTMLDivElement>) =>
    {
        if(!roomPreviewer) return;

        if(event.shiftKey) roomPreviewer.changeRoomObjectDirection();
        else roomPreviewer.changeRoomObjectState();
    }

    useEffect(() =>
    {
        if(!roomPreviewer) return;

        const update = (time: number) =>
        {
            if(!roomPreviewer || !canvasRef.current || !elementRef.current) return;
        
            roomPreviewer.updatePreviewRoomView();

            if(!canvasRef.current.canvasUpdated) return;

            elementRef.current.style.backgroundImage = `url(${ TextureUtils.generateImageUrl(canvasRef.current.master) })`;
        }

        const tryInit = (width: number) =>
        {
            if(canvasRef.current || !elementRef.current || !roomPreviewer) return;
            if(width < 10) return;

            const computed = document.defaultView.getComputedStyle(elementRef.current, null);

            let backgroundColor = computed.backgroundColor;

            try {
                backgroundColor = ColorConverter.rgbStringToHex(backgroundColor);
            } catch {
                backgroundColor = '#111114';
            }
            backgroundColor = backgroundColor.replace('#', '0x');

            roomPreviewer.backgroundColor = parseInt(backgroundColor, 16);

            roomPreviewer.getRoomCanvas(width, height);

            const canvas = roomPreviewer.getRenderingCanvas();

            canvasRef.current = canvas;
            setRenderingCanvas(canvas);

            canvas.canvasUpdated = true;
            update(-1);
        };

        if(!canvasRef.current && elementRef.current)
        {
            tryInit(elementRef.current.parentElement.clientWidth);
        }

        GetTicker().add(update);

        const resizeObserver = new ResizeObserver(() =>
        {
            if(!roomPreviewer || !elementRef.current) return;

            const width = elementRef.current.parentElement.offsetWidth;

            if(width < 10) return;

            if(!canvasRef.current)
            {
                tryInit(width);
            }
            else
            {
                roomPreviewer.modifyRoomCanvas(width, height);
                update(-1);
            }
        });
        
        resizeObserver.observe(elementRef.current);

        return () =>
        {
            resizeObserver.disconnect();

            GetTicker().remove(update);
        }

    }, [ roomPreviewer, elementRef, height ]);

    return (
        <div className="room-preview-container">
            <div ref={ elementRef } className="room-preview-image" style={ { height } } onClick={ onClick } />
            { children }
        </div>
    );
}
