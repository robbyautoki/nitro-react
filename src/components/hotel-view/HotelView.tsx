import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { useRoomSessionManagerEvent, useSeasonalTheme } from '../../hooks';

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
        <div className="nitro-hotel-view">
            <picture className="nitro-hotel-view__bg" aria-hidden="true">
                <source srcSet="/hotel-bg@2x.webp" type="image/webp" media="(min-width: 1920px)" />
                <source srcSet="/hotel-bg.webp" type="image/webp" />
                <img src="/hotel-bg.jpg" alt="" loading="eager" decoding="async" />
            </picture>
            <div className="nitro-hotel-view__top-glow" aria-hidden="true" />
            <div className="nitro-hotel-view__vignette" aria-hidden="true" />
            <div className="nitro-hotel-view__grain" aria-hidden="true" />
        </div>
    );
}
