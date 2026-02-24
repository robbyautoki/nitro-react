import { MouseEventType, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, GetUserProfile } from '../../api';
import { GuideToolEvent } from '../../events';
import { LayoutAvatarImageView } from '../../common';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ToolbarMeViewProps
{
    useGuideTool: boolean;
    unseenAchievementCount: number;
    userFigure: string;
}

const ME_ITEMS = [
    { iconClass: 'icon-me-achievements', label: 'Achievements', action: () => CreateLinkEvent('achievements/toggle'), hasBadge: true },
    { iconClass: 'icon-me-profile', label: 'Profil', action: () => GetUserProfile(GetSessionDataManager().userId), hasBadge: false },
    { iconClass: 'icon-me-rooms', label: 'Meine Räume', action: () => CreateLinkEvent('navigator/search/myworld_view'), hasBadge: false },
    { iconClass: 'icon-me-clothing', label: 'Avatar', action: () => CreateLinkEvent('avatar-editor/toggle'), hasBadge: false },
    { iconClass: 'icon-me-settings', label: 'Einstellungen', action: () => CreateLinkEvent('user-settings/toggle'), hasBadge: false },
];

export const ToolbarMeView: FC<ToolbarMeViewProps> = props =>
{
    const { useGuideTool = false, unseenAchievementCount = 0, userFigure = null } = props;

    useEffect(() =>
    {
        const roomSession = GetRoomSession();
        if(!roomSession) return;
        GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="relative w-9 h-9 overflow-hidden cursor-pointer rounded-lg hover:ring-2 hover:ring-white/20 transition-all">
                    <LayoutAvatarImageView figure={ userFigure } direction={ 2 } position="absolute" />
                    { (unseenAchievementCount > 0) && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-[14px] min-w-[14px] flex items-center justify-center text-[8px] px-0.5 rounded-full z-10">
                            { unseenAchievementCount }
                        </Badge>
                    ) }
                </div>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" sideOffset={ 8 } className="w-[180px] p-1.5 bg-black/90 border-white/[0.08] backdrop-blur-xl">
                { (GetConfiguration('guides.enabled') && useGuideTool) && (
                    <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/[0.08] transition-colors" onClick={ () => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL)) }>
                        <div className="icon icon-me-helper-tool shrink-0" />
                        <span className="text-xs font-medium text-white/80">Helper</span>
                    </button>
                ) }
                { ME_ITEMS.map(item => (
                    <button key={ item.iconClass } className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/[0.08] transition-colors" onClick={ () => item.action() }>
                        <div className={ `icon ${ item.iconClass } shrink-0` } />
                        <span className="text-xs font-medium text-white/80">{ item.label }</span>
                        { item.hasBadge && unseenAchievementCount > 0 && (
                            <Badge variant="destructive" className="ml-auto h-4 min-w-[16px] text-[9px] px-1 rounded-full">
                                { unseenAchievementCount }
                            </Badge>
                        ) }
                    </button>
                )) }
            </PopoverContent>
        </Popover>
    );
}
