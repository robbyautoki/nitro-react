import { NotificationAlertItem, NotificationAlertType } from '../../../../api';
import { NitroSystemAlertView } from './NitroSystemAlertView';
import { NotificationDefaultAlertView } from './NotificationDefaultAlertView';
import { NotificationEventAlertView } from './NotificationEventAlertView';
import { NotificationMotdAlertView } from './NotificationMotdAlertView';
import { NotificationSeachAlertView } from './NotificationSearchAlertView';
import { NotificationStaffOnlineAlertView } from './NotificationStaffOnlineAlertView';

/**
 * Hotel-Event (`:event`) wird in `useNotification` mit `alertType = "hotel.event"`
 * konstruiert (inkl. parsed USERNAME / MESSAGE / ROOMID / ROOMNAME / LOOK aus
 * den Server-Parametern). Hier nur der Routing-Switch.
 */
export const GetAlertLayout = (item: NotificationAlertItem, onClose: () => void) =>
{
    if(!item) return null;

    const props = { key: item.id, item, onClose };

    switch(item.alertType)
    {
        case NotificationAlertType.NITRO:
            return <NitroSystemAlertView { ...props } />
        case NotificationAlertType.MOTD:
            return <NotificationMotdAlertView { ...props } />
        case NotificationAlertType.SEARCH:
            return <NotificationSeachAlertView { ...props } />
        case NotificationAlertType.STAFF_ONLINE:
            return <NotificationStaffOnlineAlertView { ...props } />
        case 'hotel.event':
            return <NotificationEventAlertView { ...props } />
        default:
            return <NotificationDefaultAlertView { ...props } />
    }
}
