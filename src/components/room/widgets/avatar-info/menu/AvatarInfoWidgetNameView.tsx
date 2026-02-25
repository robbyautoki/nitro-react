import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { AvatarInfoName, GetSessionDataManager } from '../../../../../api';
import { getPrestigeFromBadges } from '../../../../../api/utils/PrestigeUtils';
import { useRoom } from '../../../../../hooks';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

const DEFAULT_NAMEPLATE_URL = 'https://cdn.discordapp.com/assets/content/7bb8e28111f5b9f6f142c9a9dc7b70336e74afca0ab9de4c035b35caf4305709';
const DEFAULT_DECO_URL = 'https://cdn.discordapp.com/assets/content/9fd289ab5082a14f189b0333d38ef32082a97502ac6e72a09ace2a13a7b47724';

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
        if(nameInfo.userType === RoomObjectType.USER && nameInfo.figure) newClassNames.push('has-nameplate');

        return newClassNames;
    }, [ nameInfo ]);

    const avatarHeadUrl = useMemo(() =>
    {
        if(!nameInfo.figure || nameInfo.userType !== RoomObjectType.USER) return '';

        const fig = nameInfo.figure.replace(/ /g, '.');

        return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${ encodeURIComponent(fig) }&headonly=1&direction=3&head_direction=3&size=l&gesture=sml`;
    }, [ nameInfo ]);

    const isUser = nameInfo.userType === RoomObjectType.USER;

    if(isUser && nameInfo.figure)
    {
        return (
            <ContextMenuView objectId={ nameInfo.roomIndex } category={ nameInfo.category } userType={ nameInfo.userType } fades={ (nameInfo.id !== GetSessionDataManager().userId) } classNames={ getClassNames } onClose={ onClose }>
                <div className="nameplate-banner" style={{ backgroundImage: `url(${ DEFAULT_NAMEPLATE_URL })` }}>
                    <div className="nameplate-avatar">
                        <img src={ avatarHeadUrl } alt="" className="nameplate-head" draggable={ false } />
                        <img src={ DEFAULT_DECO_URL } alt="" className="nameplate-deco" draggable={ false } />
                    </div>
                    <div className="nameplate-info">
                        <div className="nameplate-name">
                            { prestige > 0 && <span>{ prestige > 2 ? `🌟×${ prestige }` : '🌟'.repeat(prestige) }</span> }
                            { nameInfo.name }
                        </div>
                        { nameInfo.level > 0 &&
                            <span className="nameplate-level">Lv. { nameInfo.level }</span> }
                    </div>
                </div>
            </ContextMenuView>
        );
    }

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
