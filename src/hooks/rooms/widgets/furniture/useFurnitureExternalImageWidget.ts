import { RoomEngineTriggerWidgetEvent, RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { GetRoomEngine, GetSessionDataManager, IPhotoData } from '../../../../api';
import { useRoomEngineEvent } from '../../../events';
import { useFurniRemovedEvent } from '../../engine';
import { useRoom } from '../../useRoom';

const useFurnitureExternalImageWidgetState = () =>
{
    const [ objectId, setObjectId ] = useState(-1);
    const [ category, setCategory ] = useState(-1);
    const [ currentPhotoIndex, setCurrentPhotoIndex ] = useState(-1);
    const [ currentPhotos, setCurrentPhotos ] = useState<IPhotoData[]>([]);
    const { roomSession = null } = useRoom();

    const isExternalImageObject = (type: string) =>
    {
        const itemData = GetSessionDataManager().getWallItemData(type as any) as any;

        return !!(itemData?.isExternalImage || type?.startsWith('external_image'));
    }

    const parsePhotoData = (data: string): IPhotoData | null =>
    {
        if(!data) return null;

        try
        {
            const parsed = JSON.parse(data) as IPhotoData;

            return parsed?.w ? parsed : null;
        }
        catch
        {
            return null;
        }
    }

    const onClose = () =>
    {
        setObjectId(-1);
        setCategory(-1);
        setCurrentPhotoIndex(-1);
        setCurrentPhotos([]);
    }

    useRoomEngineEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_EXTERNAL_IMAGE, event =>
    {
        const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);
        const roomTotalImages = GetRoomEngine().getRoomObjects(roomSession?.roomId ?? event.roomId, RoomObjectCategory.WALL) || [];

        if(!roomObject) return;

        const datas: IPhotoData[] = [];

        roomTotalImages.forEach(object =>
        {
            if(!isExternalImageObject(object.type)) return null;

            const data = object.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA);
            const jsonData = parsePhotoData(data);

            if(!jsonData) return null;
            datas.push(jsonData);
        });

        const roomObjectPhotoData = parsePhotoData(roomObject.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA));

        if(!datas.length && roomObjectPhotoData) datas.push(roomObjectPhotoData);

        setObjectId(event.objectId);
        setCategory(event.category);
        setCurrentPhotos(datas);

        setCurrentPhotoIndex(prevValue =>
        {
            let index = 0;

            if(roomObjectPhotoData)
            {
                index = datas.findIndex(data => (data.u === roomObjectPhotoData.u))
            }

            if(index < 0) index = 0;

            return index;
        });
    });

    useFurniRemovedEvent(((objectId !== -1) && (category !== -1)), event =>
    {
        if((event.id !== objectId) || (event.category !== category)) return;

        onClose();
    });

    return { objectId, currentPhotoIndex, currentPhotos, onClose };
}

export const useFurnitureExternalImageWidget = useFurnitureExternalImageWidgetState;
