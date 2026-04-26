import { NitroRectangle, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react';
import { CameraPicture, GetRoomEngine, GetRoomSession, LocalizeText, PlaySound, SoundNames } from '../../../api';
import { DraggableWindow } from '../../../common';
import { useCamera, useNotification } from '../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';

export interface CameraWidgetCaptureViewProps
{
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const CAMERA_ROLL_LIMIT: number = 5;

export const CameraWidgetCaptureView: FC<CameraWidgetCaptureViewProps> = props =>
{
    const { onClose = null, onEdit = null, onDelete = null } = props;
    const { cameraRoll = null, setCameraRoll = null, selectedPictureIndex = -1, setSelectedPictureIndex = null } = useCamera();
    const { simpleAlert = null } = useNotification();
    const elementRef = useRef<HTMLDivElement>(null);

    const selectedPicture = ((selectedPictureIndex > -1) ? cameraRoll[selectedPictureIndex] : null);

    const getCameraBounds = () =>
    {
        if(!elementRef || !elementRef.current) return null;

        const frameBounds = elementRef.current.getBoundingClientRect();
        
        return new NitroRectangle(Math.floor(frameBounds.x), Math.floor(frameBounds.y), Math.floor(frameBounds.width), Math.floor(frameBounds.height));
    }

    const takePicture = () =>
    {
        if(selectedPictureIndex > -1)
        {
            setSelectedPictureIndex(-1);
            return;
        }

        const texture = GetRoomEngine().createTextureFromRoom(GetRoomSession().roomId, 1, getCameraBounds());

        const clone = [ ...cameraRoll ];

        if(clone.length >= CAMERA_ROLL_LIMIT)
        {
            simpleAlert(LocalizeText('camera.full.body'));
            clone.pop();
        }

        PlaySound(SoundNames.CAMERA_SHUTTER);
        clone.push(new CameraPicture(texture, TextureUtils.generateImageUrl(texture)));

        setCameraRoll(clone);
    }

    return (
        <DraggableWindow uniqueKey="nitro-camera-capture">
            <AlignSurface.Panel className="nitro-camera-window nitro-camera-capture">
                <div className="nitro-camera-header drag-handler">
                    <div className="nitro-camera-title">
                        <div className="nitro-camera-title-icon">
                            <Camera className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-label-sm text-text-strong-950">Kamera</div>
                            <div className="truncate text-paragraph-xs text-text-sub-600">{ cameraRoll.length }/{ CAMERA_ROLL_LIMIT } Fotos</div>
                        </div>
                    </div>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="nitro-camera-body">
                    <div className="nitro-camera-viewfinder-wrap">
                        { selectedPicture
                            ? <img alt="" className="nitro-camera-viewfinder-image" src={ selectedPicture.imageUrl } />
                            : <div ref={ elementRef } className="nitro-camera-viewfinder" />
                        }
                        <div className="nitro-camera-focus-grid" />
                        { selectedPicture &&
                            <div className="nitro-camera-frame-actions">
                                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" title={ LocalizeText('camera.editor.button.tooltip') } onClick={ onEdit }>
                                    <AlignButton.Icon as={ Sparkles } className="size-4" />
                                    { LocalizeText('camera.editor.button.text') }
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="error" mode="lighter" size="small" onClick={ onDelete }>
                                    <AlignButton.Icon as={ Trash2 } className="size-4" />
                                    { LocalizeText('camera.delete.button.text') }
                                </AlignButton.Root>
                            </div> }
                    </div>
                    <div className="nitro-camera-footer">
                        <div className="nitro-camera-shutter-row">
                            <button className="nitro-camera-shutter" title={ LocalizeText('camera.take.photo.button.tooltip') } onClick={ takePicture }>
                                <span />
                            </button>
                        </div>
                        { (cameraRoll.length > 0) &&
                            <div className="nitro-camera-roll">
                                <AlignBadge.Root variant="lighter" color="gray" size="small">
                                    <AlignBadge.Icon as={ ImageIcon } className="size-3" />
                                    Film
                                </AlignBadge.Root>
                                <div className="nitro-camera-roll-items">
                                    { cameraRoll.map((picture, index) =>
                                    {
                                        return <button type="button" key={ index } className={ selectedPictureIndex === index ? 'selected' : '' } onClick={ event => setSelectedPictureIndex(index) }><img alt="" src={ picture.imageUrl } /></button>;
                                    }) }
                                </div>
                            </div> }
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
