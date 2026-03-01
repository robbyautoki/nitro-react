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
  expanded?: boolean;
}

function MeIcon({ name, w, h }: { name: string; w: number; h: number }) {
  return (
    <img
      src={`/toolbar-icons/${name}`}
      alt={name}
      style={{ width: w, height: h, imageRendering: 'pixelated', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

const ME_ITEMS = [
  { icon: 'me-menu/achievements.png', w: 32, h: 30, label: 'Achievements', action: () => CreateLinkEvent('achievements/toggle') },
  { icon: 'me-menu/profile.png', w: 32, h: 30, label: 'Profil', action: () => GetUserProfile(GetSessionDataManager().userId) },
  { icon: 'me-menu/my-rooms.png', w: 32, h: 30, label: 'Meine Räume', action: () => CreateLinkEvent('navigator/search/myworld_view') },
  { icon: 'me-menu/clothing.png', w: 32, h: 30, label: 'Avatar', action: () => CreateLinkEvent('avatar-editor/toggle') },
  { icon: 'me-menu/cog.png', w: 32, h: 30, label: 'Einstellungen', action: () => CreateLinkEvent('user-settings/toggle') },
];

export const ToolbarMeView: FC<ToolbarMeViewProps> = props => {
  const { useGuideTool = false, unseenAchievementCount = 0, userFigure = null, expanded = false } = props;

  useEffect(() => {
    const roomSession = GetRoomSession();
    if (!roomSession) return;
    GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
  }, []);

  const triggerContent = expanded ? (
    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors text-left">
      <MeIcon name="me-menu/profile.png" w={24} h={24} />
      <span className="text-xs font-medium">Mein Menü</span>
    </button>
  ) : (
    <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer hover:bg-accent/50 transition-colors mb-1">
      <MeIcon name="me-menu/profile.png" w={28} h={26} />
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-[200px] p-1.5">
        {(GetConfiguration('guides.enabled') && useGuideTool) && (
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL))}>
            <MeIcon name="me-menu/helper-tool.png" w={24} h={22} />
            <span className="text-xs font-medium">Helper</span>
          </button>
        )}
        {ME_ITEMS.map(item => (
          <button key={item.icon} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => item.action()}>
            <MeIcon name={item.icon} w={item.w} h={item.h} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
