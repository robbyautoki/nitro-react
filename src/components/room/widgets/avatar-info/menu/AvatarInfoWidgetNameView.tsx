import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { AvatarInfoName, GetSessionDataManager } from '../../../../../api';
import { getPrestigeFromBadges } from '../../../../../api/utils/PrestigeUtils';
import { useRoom } from '../../../../../hooks';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetNameViewProps
{
    nameInfo: AvatarInfoName;
    onClose: () => void;
}

export const AvatarInfoWidgetNameView: FC<AvatarInfoWidgetNameViewProps> = props =>
{
    const { nameInfo = null, onClose = null } = props;
    const { roomSession = null } = useRoom();

    const prestige = useMemo(() =>
    {
        if(!roomSession || nameInfo.userType !== RoomObjectType.USER) return 0;

        const badges = roomSession.userDataManager.getUserBadges(nameInfo.id) ?? [];

        return getPrestigeFromBadges(badges);
    }, [ roomSession, nameInfo ]);

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'name-only' ];

        if(nameInfo.isFriend) newClassNames.push('is-friend');

        return newClassNames;
    }, [ nameInfo ]);

    return (
        <ContextMenuView objectId={ nameInfo.roomIndex } category={ nameInfo.category } userType={ nameInfo.userType } fades={ (nameInfo.id !== GetSessionDataManager().userId) } classNames={ getClassNames } onClose={ onClose }>
            <div className="text-shadow flex items-center gap-1">
                { prestige > 0 && <span>{ prestige > 2 ? `🌟×${ prestige }` : '🌟'.repeat(prestige) }</span> }
                { nameInfo.name }
                { nameInfo.level > 0 && nameInfo.userType === RoomObjectType.USER &&
                    <span className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017, #f5d442)', color: '#5a3e00', textShadow: '0 1px 0 rgba(255,255,255,0.3)', lineHeight: '14px' }}>
                        Lv. { nameInfo.level }
                    </span> }
                { nameInfo.level > 0 && nameInfo.userType === RoomObjectType.PET &&
                    <span className="opacity-75">Lv. { nameInfo.level }</span> }
            </div>
        </ContextMenuView>
    );
}
