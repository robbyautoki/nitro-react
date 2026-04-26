import { ApplyTonerComposer, ColorConverter, RoomEngineTriggerWidgetEvent, RoomObjectHSLColorEnabledEvent, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { CanManipulateFurniture, ColorUtils, DispatchUiEvent, GetRoomEngine, RoomWidgetUpdateBackgroundColorPreviewEvent, SendMessageComposer } from '../../../../api';
import { useRoomEngineEvent } from '../../../events';
import { useFurniRemovedEvent } from '../../engine';
import { useRoom } from '../../useRoom';

const useFurnitureBackgroundColorWidgetState = () =>
{
    const [ objectId, setObjectId ] = useState(-1);
    const [ category, setCategory ] = useState(-1);
    const [ color, setColor ] = useState(0);
    const [ appliedColor, setAppliedColor ] = useState(0);
    const [ tonerState, setTonerState ] = useState(0);
    const { roomSession = null } = useRoom();

    const applyToner = () =>
    {
        const hsl = ColorConverter.rgbToHSL(color);
        const [ _, hue, saturation, lightness ] = ColorUtils.int_to_8BitVals(hsl);
        SendMessageComposer(new ApplyTonerComposer(objectId, hue, saturation, lightness));
        // Optimistic update — Server bestätigt via RoomObjectHSLColorEnabledEvent
        setAppliedColor(color);
    }

    const toggleToner = () =>
    {
        roomSession.useMultistateItem(objectId);
        // Optimistic flip — Server bestätigt via RoomObjectHSLColorEnabledEvent
        setTonerState(prev => prev === 1 ? 0 : 1);
    }

    const onClose = () =>
    {
        DispatchUiEvent(new RoomWidgetUpdateBackgroundColorPreviewEvent(RoomWidgetUpdateBackgroundColorPreviewEvent.CLEAR_PREVIEW));

        setObjectId(-1);
        setCategory(-1);
        setColor(0);
        setAppliedColor(0);
        setTonerState(0);
    }

    useRoomEngineEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_BACKGROUND_COLOR, event =>
    {
        if(!CanManipulateFurniture(roomSession, event.objectId, event.category)) return;

        const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);
        const model = roomObject.model;

        setObjectId(event.objectId);
        setCategory(event.category)

        const hue = parseInt(model.getValue<string>(RoomObjectVariable.FURNITURE_ROOM_BACKGROUND_COLOR_HUE));
        const saturation = parseInt(model.getValue<string>(RoomObjectVariable.FURNITURE_ROOM_BACKGROUND_COLOR_SATURATION));
        const light = parseInt(model.getValue<string>(RoomObjectVariable.FURNITURE_ROOM_BACKGROUND_COLOR_LIGHTNESS));

        const hsl = ColorUtils.eight_bitVals_to_int(0, hue,saturation,light);

        const rgbColor = ColorConverter.hslToRGB(hsl);
        setColor(rgbColor);
        setAppliedColor(rgbColor);
        setTonerState(roomObject.getState(0));
    });

    useRoomEngineEvent<RoomObjectHSLColorEnabledEvent>(RoomObjectHSLColorEnabledEvent.ROOM_BACKGROUND_COLOR, event =>
    {
        if(objectId === -1) return;

        const hsl = ColorUtils.eight_bitVals_to_int(0, event.hue, event.saturation, event.lightness);
        const rgbColor = ColorConverter.hslToRGB(hsl);

        setAppliedColor(rgbColor);
        setTonerState(event.enable ? 1 : 0);
    });

    useFurniRemovedEvent(((objectId !== -1) && (category !== -1)), event =>
    {
        if((event.id !== objectId) || (event.category !== category)) return;

        onClose();
    });

    useEffect(() =>
    {
        if((objectId === -1) || (category === -1)) return;

        const hls = ColorConverter.rgbToHSL(color);
        const [ _, hue, saturation, lightness ] = ColorUtils.int_to_8BitVals(hls);
        DispatchUiEvent(new RoomWidgetUpdateBackgroundColorPreviewEvent(RoomWidgetUpdateBackgroundColorPreviewEvent.PREVIEW, hue, saturation, lightness));
    }, [ objectId, category, color ]);

    return { objectId, color, setColor, applyToner, toggleToner, onClose, tonerState, appliedColor, isDirty: appliedColor !== color };
}

export const useFurnitureBackgroundColorWidget = useFurnitureBackgroundColorWidgetState;
