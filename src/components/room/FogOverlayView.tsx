import { FC, useMemo } from 'react';
import { GetConfiguration } from '../../api';
import { useRoom } from '../../hooks';

export const FogOverlayView: FC<{}> = () =>
{
    const { roomSession = null } = useRoom();

    const anonymousRoomId = useMemo(() => GetConfiguration<number>('anonymous.room.id', 0), []);

    const isActive = roomSession && anonymousRoomId > 0 && roomSession.roomId === anonymousRoomId;

    if(!isActive) return null;

    return (
        <div className="fog-overlay">
            <div className="fog-layer fog-layer-1" />
            <div className="fog-layer fog-layer-2" />
            <div className="fog-layer fog-layer-3" />
        </div>
    );
};
