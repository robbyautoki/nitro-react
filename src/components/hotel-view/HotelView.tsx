import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { useRoomSessionManagerEvent } from '../../hooks';
import { Particles } from './Particles';

export const HotelView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(true);

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
            <Particles
                particleColors={ ['#ffffff'] }
                particleCount={ 200 }
                particleSpread={ 10 }
                speed={ 0.1 }
                particleBaseSize={ 100 }
                moveParticlesOnHover
                alphaParticles={ false }
                disableRotation={ false }
                className="particles-bg"
            />
        </div>
    );
}
