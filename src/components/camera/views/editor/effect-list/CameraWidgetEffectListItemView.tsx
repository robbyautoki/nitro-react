import { IRoomCameraWidgetEffect } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { Lock, Palette, X } from 'lucide-react';
import { LocalizeText } from '../../../../../api';

export interface CameraWidgetEffectListItemViewProps
{
    effect: IRoomCameraWidgetEffect;
    thumbnailUrl: string;
    isActive: boolean;
    isLocked: boolean;
    selectEffect: () => void;
    removeEffect: () => void;
}

export const CameraWidgetEffectListItemView: FC<CameraWidgetEffectListItemViewProps> = props =>
{
    const { effect = null, thumbnailUrl = null, isActive = false, isLocked = false, selectEffect = null, removeEffect = null } = props;

    return (
        <button type="button" className={ `nitro-camera-effect-item${ isActive ? ' active' : '' }${ isLocked ? ' locked' : '' }` } title={ LocalizeText(!isLocked ? (`camera.effect.name.${ effect.name }`) : `camera.effect.required.level ${ effect.minLevel }`) } onClick={ event => (!isActive && !isLocked && selectEffect()) }>
            { isActive &&
                <span className="remove-effect" onClick={ event => { event.stopPropagation(); removeEffect(); } }>
                    <X className="size-3" />
                </span> }
            { !isLocked && (thumbnailUrl && thumbnailUrl.length > 0) &&
                <div className="effect-thumbnail-image">
                    <img alt="" src={ thumbnailUrl } />
                </div> }
            { !isLocked && (!thumbnailUrl || !thumbnailUrl.length) &&
                <span className="nitro-camera-effect-fallback">
                    <Palette className="size-4" />
                    <span>{ LocalizeText('camera.effect.name.' + effect.name) }</span>
                </span> }
            { isLocked &&
                <span className="nitro-camera-effect-lock">
                    <Lock className="size-4" />
                    { effect.minLevel }
                </span> }
        </button>
    );
}
