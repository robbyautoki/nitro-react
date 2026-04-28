import { FC, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NotificationAlertType } from '../../api';
import { useAntiCheatToasts, useNotification, useWinToasts } from '../../hooks';
import { AntiCheatToastItem } from '../jail/AntiCheatToastItem';
import { WinToastItem } from '../win/WinToastItem';
import { GetAlertLayout } from './views/alert-layouts/GetAlertLayout';
import { GetBubbleLayout } from './views/bubble-layouts/GetBubbleLayout';
import { GetConfirmLayout } from './views/confirm-layouts/GetConfirmLayout';

/**
 * Phase 11.6 — Unified Toast-Stack.
 *
 * EIN Container `.nitro-toast-stack-unified` rechts oben hält ALLE Toasts:
 * Anti-Cheat, MOTD/Siren/Mugshot (über `NotificationMotdAlertView`),
 * Staff-Online (`NotificationStaffOnlineAlertView`), Win-Broadcasts und
 * Bubble-Notifications (Achievements, Friends, Pets, ...). Optik bleibt
 * unverändert wie vor Phase 11.5 — nur das Layout ist jetzt ein einziger
 * Flex-Column mit `gap: 12px` und `max-height` der Float Bar respektiert.
 *
 * Modal-Alerts (Connection-Error, Hotel-Closing, Confirm-Dialoge) rendern
 * weiterhin als Modal außerhalb des Toast-Stacks.
 */
export const NotificationCenterView: FC<{}> = props =>
{
    const {
        alerts = [],
        bubbleAlerts = [],
        confirms = [],
        closeAlert = null,
        closeBubbleAlert = null,
        closeConfirm = null
    } = useNotification();

    const { toasts: winToasts } = useWinToasts();
    const { toasts: antiCheatToasts } = useAntiCheatToasts();

    // Modale Alerts (Default, Nitro, Search) — KEINE MOTD/STAFF_ONLINE
    const getModalAlerts = useMemo(() =>
    {
        if(!alerts || !alerts.length) return null;

        const elements: ReactNode[] = [];

        for(const alert of alerts)
        {
            if(alert.alertType === NotificationAlertType.MOTD) continue;
            if(alert.alertType === NotificationAlertType.STAFF_ONLINE) continue;

            const element = GetAlertLayout(alert, () => closeAlert(alert));
            elements.push(element);
        }

        return elements.length ? elements : null;
    }, [ alerts, closeAlert ]);

    // Default/Alert/Moderation-Alerts → Vignette-Backdrop einblenden.
    // MOTD, Staff-Online, Nitro, Search lösen die Vignette NICHT aus.
    const hasDefaultAlert = useMemo(() =>
    {
        if(!alerts || !alerts.length) return false;
        return alerts.some(a =>
            a.alertType !== NotificationAlertType.MOTD &&
            a.alertType !== NotificationAlertType.STAFF_ONLINE &&
            a.alertType !== NotificationAlertType.NITRO &&
            a.alertType !== NotificationAlertType.SEARCH
        );
    }, [ alerts ]);

    // MOTD-Toasts (inkl. jail.siren / jail.mugshot — alle laufen als MOTD-Type)
    const getMotdToasts = useMemo(() =>
    {
        if(!alerts || !alerts.length) return null;

        const elements: ReactNode[] = [];

        for(const alert of alerts)
        {
            if(alert.alertType !== NotificationAlertType.MOTD) continue;
            const element = GetAlertLayout(alert, () => closeAlert(alert));
            elements.push(element);
        }

        return elements;
    }, [ alerts, closeAlert ]);

    // Staff-Online Toasts (eigener Alert-Type, eigene Render-Komponente)
    const getStaffOnlineToasts = useMemo(() =>
    {
        if(!alerts || !alerts.length) return null;

        const elements: ReactNode[] = [];

        for(const alert of alerts)
        {
            if(alert.alertType !== NotificationAlertType.STAFF_ONLINE) continue;
            const element = GetAlertLayout(alert, () => closeAlert(alert));
            elements.push(element);
        }

        return elements;
    }, [ alerts, closeAlert ]);

    // Bubble-Toasts (Achievements, Friends, Pets, Respect, ...)
    const getBubbleToasts = useMemo(() =>
    {
        if(!bubbleAlerts || !bubbleAlerts.length) return null;

        const elements: ReactNode[] = [];

        for(const bubble of bubbleAlerts)
        {
            const element = GetBubbleLayout(bubble, () => closeBubbleAlert(bubble));
            elements.push(element);
        }

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

    const hasAnyToast = (
        (antiCheatToasts && antiCheatToasts.length) ||
        (getMotdToasts && (getMotdToasts as ReactNode[]).length) ||
        (getStaffOnlineToasts && (getStaffOnlineToasts as ReactNode[]).length) ||
        (winToasts && winToasts.length) ||
        (getBubbleToasts && (getBubbleToasts as ReactNode[]).length)
    );

    return (
        <>
            { hasAnyToast && (
                <div className="nitro-toast-stack-unified">
                    { /* Reihenfolge: Anti-Cheat (höchste Prio) → MOTD/Siren/Mugshot → Staff → Win → Bubbles */ }
                    { antiCheatToasts.map(t => <AntiCheatToastItem key={ `ac-${ t.id }` } toast={ t } />) }
                    { getMotdToasts }
                    { getStaffOnlineToasts }
                    { winToasts.map(t => <WinToastItem key={ `win-${ t.id }` } toast={ t } />) }
                    { getBubbleToasts }
                </div>
            ) }
            { hasDefaultAlert && (() => {
                const target = document.getElementById('draggable-windows-container') || document.body;
                return createPortal(
                    <div className="nitro-default-alert-backdrop" aria-hidden="true" />,
                    target
                );
            })() }
            { getConfirms }
            { getModalAlerts }
        </>
    );
}
