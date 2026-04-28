import { FC } from 'react';
import { useWinToasts } from '../../hooks';

/**
 * Renderless Komponente — initialisiert den geteilten Win-Toast-State.
 * Das eigentliche Rendering passiert in `NotificationCenterView` im
 * Unified-Stack rechts oben.
 */
export const WinNotification: FC<{}> = () =>
{
    useWinToasts();
    return null;
};
