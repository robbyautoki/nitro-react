import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { useRoomSessionManagerEvent, useSeasonalTheme } from '../../hooks';
import Grainient from './Grainient';

export const HotelView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(true);
    const theme = useSeasonalTheme();

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setIsVisible(false);
                return;
            case RoomSessionEvent.ENDED:
                setIsVisible(event.openLandingView);
                return;
        }
    });

    if(!isVisible) return null;

    return (
        <div className="nitro-hotel-view" style={ { backgroundColor: '#000000' } }>
            <Grainient
                color1="#d856bf"
                color2="#0e5ea5"
                color3="#131318"
            />
        </div>
    );
}
