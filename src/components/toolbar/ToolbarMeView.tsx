import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, GetUserProfile } from '../../api';
import { GuideToolEvent } from '../../events';
import { LayoutAvatarImageView } from '../../common';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ToolbarMeViewProps {
  useGuideTool: boolean;
  unseenAchievementCount: number;
  userFigure: string;
}

// 1:1 from prototype ME_ICONS — using CSS sprite icons instead of ToolbarIcon PNGs
const ME_ITEMS = [
  { iconClass: 'icon-me-achievements', label: 'Achievements', action: () => CreateLinkEvent('achievements/toggle') },
  { iconClass: 'icon-me-profile', label: 'Profil', action: () => GetUserProfile(GetSessionDataManager().userId) },
  { iconClass: 'icon-me-rooms', label: 'Meine Räume', action: () => CreateLinkEvent('navigator/search/myworld_view') },
  { iconClass: 'icon-me-clothing', label: 'Avatar', action: () => CreateLinkEvent('avatar-editor/toggle') },
  { iconClass: 'icon-me-settings', label: 'Einstellungen', action: () => CreateLinkEvent('user-settings/toggle') },
];

// 1:1 from prototype LeftSidebar Me-Menü Popover
export const ToolbarMeView: FC<ToolbarMeViewProps> = props => {
  const { useGuideTool = false, unseenAchievementCount = 0, userFigure = null } = props;

  useEffect(() => {
    const roomSession = GetRoomSession();
    if (!roomSession) return;
    GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="w-9 h-9 overflow-hidden cursor-pointer rounded-lg hover:ring-2 hover:ring-primary/20 transition-all mb-1">
          <LayoutAvatarImageView figure={userFigure} direction={2} position="absolute" />
        </div>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-[180px] p-1.5">
        {(GetConfiguration('guides.enabled') && useGuideTool) && (
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL))}>
            <div className="icon icon-me-helper-tool shrink-0" />
            <span className="text-xs font-medium">Helper</span>
          </button>
        )}
        {ME_ITEMS.map(item => (
          <button key={item.iconClass} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => item.action()}>
            <div className={`icon ${item.iconClass} shrink-0`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
