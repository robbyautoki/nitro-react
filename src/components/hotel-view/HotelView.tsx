import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { useRoomSessionManagerEvent, useSeasonalTheme } from '../../hooks';
import { Particles } from './Particles';

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
        <div className="nitro-hotel-view" style={ { backgroundColor: theme.bgColor } }>
            { theme.bgImageUrl &&
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={ { backgroundImage: `url('${ theme.bgImageUrl }')` } }
                /> }
            <Particles
                particleColors={ theme.particleColors }
                particleCount={ theme.particleCount }
                particleSpread={ 10 }
                speed={ theme.particleSpeed }
                particleBaseSize={ 100 }
                moveParticlesOnHover
                alphaParticles={ false }
                disableRotation={ false }
                className="particles-bg"
            />
            { theme.overlayImageUrl &&
                <div
                    className="absolute inset-0 bg-repeat pointer-events-none opacity-20 z-[1]"
                    style={ { backgroundImage: `url('${ theme.overlayImageUrl }')` } }
                /> }
        </div>
    );
}
