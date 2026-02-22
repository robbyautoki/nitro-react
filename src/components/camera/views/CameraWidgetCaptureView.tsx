import { NitroRectangle, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { CameraPicture, GetRoomEngine, GetRoomSession, LocalizeText, PlaySound, SoundNames } from '../../../api';
import { Column, DraggableWindow, Flex } from '../../../common';
import { useCamera, useNotification } from '../../../hooks';
import iphoneFrameImg from '@/assets/images/room-widgets/camera-widget/iphone-frame.png';

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
    const elementRef = useRef<HTMLDivElement>();

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
            <Column center className="nitro-camera-capture" gap={ 0 }>
                <div className="iphone-camera drag-handler">
                    <div className="iphone-close" onClick={ onClose }>
                        <FaTimes className="fa-icon" />
                    </div>
                    <div className="iphone-frame-container">
                        <img
                            alt=""
                            className="iphone-frame-image"
                            src={ iphoneFrameImg }
                            draggable={ false }
                        />
                        { selectedPicture
                            ? <img alt="" className="iphone-screen-content" src={ selectedPicture.imageUrl } />
                            : <div ref={ elementRef } className="iphone-screen-content iphone-viewfinder" />
                        }
                        { selectedPicture &&
                            <div className="iphone-screen-content iphone-frame-actions">
                                <button className="btn btn-sm btn-success" title={ LocalizeText('camera.editor.button.tooltip') } onClick={ onEdit }>{ LocalizeText('camera.editor.button.text') }</button>
                                <button className="btn btn-sm btn-danger" onClick={ onDelete }>{ LocalizeText('camera.delete.button.text') }</button>
                            </div> }
                    </div>
                    <div className="iphone-shutter-area">
                        <div className="iphone-shutter-button" title={ LocalizeText('camera.take.photo.button.tooltip') } onClick={ takePicture } />
                    </div>
                </div>
                { (cameraRoll.length > 0) &&
                    <Flex gap={ 2 } justifyContent="center" className="iphone-camera-roll">
                        { cameraRoll.map((picture, index) =>
                        {
                            return <img alt="" key={ index } className={ selectedPictureIndex === index ? 'selected' : '' } src={ picture.imageUrl } onClick={ event => setSelectedPictureIndex(index) } />;
                        }) }
                    </Flex> }
            </Column>
        </DraggableWindow>
    );
}
