import { FC, ReactNode, useMemo } from 'react';
import { NotificationAlertType, NotificationBubbleType } from '../../api';
import { useNotification } from '../../hooks';
import { GetAlertLayout } from './views/alert-layouts/GetAlertLayout';
import { GetBubbleLayout } from './views/bubble-layouts/GetBubbleLayout';
import { GetConfirmLayout } from './views/confirm-layouts/GetConfirmLayout';

const MAX_VISIBLE_BUBBLES = 3;

export const NotificationCenterView: FC<{}> = props =>
{
    const { alerts = [], bubbleAlerts = [], confirms = [], closeAlert = null, closeBubbleAlert = null, closeConfirm = null } = useNotification();

    const getAlerts = useMemo(() =>
    {
        if(!alerts || !alerts.length) return null;

        const elements: ReactNode[] = [];

        for(const alert of alerts)
        {
            if(alert.alertType === NotificationAlertType.MOTD) continue;

            const element = GetAlertLayout(alert, () => closeAlert(alert));

            elements.push(element);
        }

        return elements.length ? elements : null;
    }, [ alerts, closeAlert ]);

    const getMotdAlerts = useMemo(() =>
    {
        if(!alerts || !alerts.length) return null;

        const elements: ReactNode[] = [];

        for(const alert of alerts)
        {
            if(alert.alertType !== NotificationAlertType.MOTD) continue;

            const element = GetAlertLayout(alert, () => closeAlert(alert));

            elements.push(element);
        }

        return elements.length ? elements : null;
    }, [ alerts, closeAlert ]);

    const getBubbleAlerts = useMemo(() =>
    {
        if(!bubbleAlerts || !bubbleAlerts.length) return null;

        // CLUBGIFT immer zuerst, max MAX_VISIBLE_BUBBLES sichtbar
        const sorted = [ ...bubbleAlerts ].sort((a, b) =>
        {
            const aClub = a.notificationType === NotificationBubbleType.CLUBGIFT ? -1 : 0;
            const bClub = b.notificationType === NotificationBubbleType.CLUBGIFT ? -1 : 0;
            return aClub - bClub;
        });

        const visible = sorted.slice(0, MAX_VISIBLE_BUBBLES);
        const elements: ReactNode[] = visible.map(alert => GetBubbleLayout(alert, () => closeBubbleAlert(alert)));

        return elements;
    }, [ bubbleAlerts, closeBubbleAlert ]);

    const getConfirms = useMemo(() =>
    {
        if(!confirms || !confirms.length) return null;

        const elements: ReactNode[] = [];

        for(const confirm of confirms)
        {
            const element = GetConfirmLayout(confirm, () => closeConfirm(confirm));

            elements.push(element);
        }

        return elements;
    }, [ confirms, closeConfirm ]);

    return (
        <>
            <div className="nitro-toast-stack pointer-events-none">
                { getBubbleAlerts }
            </div>
            { getMotdAlerts &&
                <div className="nitro-motd-toast-stack">
                    { getMotdAlerts }
                </div>
            }
            { getConfirms }
            { getAlerts }
        </>
    );
}
