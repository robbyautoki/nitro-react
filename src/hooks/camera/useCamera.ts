import { InitCameraMessageEvent, IRoomCameraWidgetEffect, RequestCameraConfigurationComposer, RoomCameraWidgetManagerEvent } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { CameraPicture, GetRoomCameraWidgetManager, SendMessageComposer } from '../../api';
import { useCameraEvent, useMessageEvent } from '../events';

const useCameraState = () =>
{
    const [ availableEffects, setAvailableEffects ] = useState<IRoomCameraWidgetEffect[]>([]);
    const [ cameraRoll, setCameraRoll ] = useState<CameraPicture[]>([]);
    const [ selectedPictureIndex, setSelectedPictureIndex ] = useState(-1);
    const [ myLevel, setMyLevel ] = useState(10);
    const [ price, setPrice ] = useState<{ credits: number, duckets: number, publishDucketPrice: number }>(null);

    const syncAvailableEffects = useCallback(() =>
    {
        setAvailableEffects(Array.from(GetRoomCameraWidgetManager().effects.values()));
    }, []);

    useCameraEvent<RoomCameraWidgetManagerEvent>(RoomCameraWidgetManagerEvent.INITIALIZED, event =>
    {
        syncAvailableEffects();
    });

    useMessageEvent<InitCameraMessageEvent>(InitCameraMessageEvent, event =>
    {
        const parser = event.getParser();
        
        setPrice({ credits: parser.creditPrice, duckets: parser.ducketPrice, publishDucketPrice: parser.publishDucketPrice });
    });

    useEffect(() =>
    {
        const manager = GetRoomCameraWidgetManager();

        if(!manager.isLoaded)
        {
            manager.init();
        }
        else
        {
            syncAvailableEffects();
        }

        SendMessageComposer(new RequestCameraConfigurationComposer());
    }, [ syncAvailableEffects ]);

    return { availableEffects, cameraRoll, setCameraRoll, selectedPictureIndex, setSelectedPictureIndex, myLevel, price };
}

export const useCamera = () => useBetween(useCameraState);
