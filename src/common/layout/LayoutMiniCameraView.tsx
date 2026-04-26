import { NitroRectangle, NitroRenderTexture } from '@nitrots/nitro-renderer';
import { FC, useRef } from 'react';
import { GetRoomEngine, LocalizeText, PlaySound, SoundNames } from '../../api';
import { DraggableWindow } from '../draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';

interface LayoutMiniCameraViewProps
{
    roomId: number;
    textureReceiver: (texture: NitroRenderTexture) => void;
    onClose: () => void;
}

export const LayoutMiniCameraView: FC<LayoutMiniCameraViewProps> = props =>
{
    const { roomId = -1, textureReceiver = null, onClose = null } = props;
    const elementRef = useRef<HTMLDivElement>();

    const getCameraBounds = () =>
    {
        if(!elementRef || !elementRef.current) return null;

        const frameBounds = elementRef.current.getBoundingClientRect();

        return new NitroRectangle(Math.floor(frameBounds.x), Math.floor(frameBounds.y), Math.floor(frameBounds.width), Math.floor(frameBounds.height));
    };

    const takePicture = () =>
    {
        PlaySound(SoundNames.CAMERA_SHUTTER);
        textureReceiver(GetRoomEngine().createTextureFromRoom(roomId, 1, getCameraBounds()));
    };

    return (
        <DraggableWindow handleSelector=".nitro-room-thumbnail-camera">
            <div className="nitro-room-thumbnail-camera">
                <div ref={ elementRef } className="camera-frame" />
                <div className="camera-actions">
                    <AlignButton.Root
                        type="button"
                        variant="error"
                        mode="filled"
                        size="xxsmall"
                        className="min-w-0 flex-1 px-1 text-paragraph-xs"
                        onClick={ onClose }
                    >
                        <span className="truncate">{ LocalizeText('cancel') }</span>
                    </AlignButton.Root>
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="filled"
                        size="xxsmall"
                        className="min-w-0 flex-1 bg-success-base px-1 text-paragraph-xs text-static-white hover:bg-success-dark focus-visible:shadow-button-primary-focus"
                        onClick={ takePicture }
                    >
                        <span className="truncate">{ LocalizeText('navigator.thumbeditor.save') }</span>
                    </AlignButton.Root>
                </div>
            </div>
        </DraggableWindow>
    );
};
