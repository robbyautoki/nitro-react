import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, GetUserProfile } from '../../api';
import { GuideToolEvent } from '../../events';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignPopover from '@/align-ui/components/ui/popover';

interface ToolbarMeViewProps {
  useGuideTool: boolean;
  unseenAchievementCount: number;
  userFigure: string;
  children: ReactNode;
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
  const { useGuideTool = false, unseenAchievementCount = 0, userFigure = null, children } = props;

  useEffect(() => {
    const roomSession = GetRoomSession();
    if (!roomSession) return;
    GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
  }, []);

  return (
    <AlignPopover.Root>
      <AlignPopover.Trigger asChild>
        {children}
      </AlignPopover.Trigger>
      <AlignPopover.Content side="right" align="start" sideOffset={8} className="w-[200px] p-1.5">
        {(GetConfiguration('guides.enabled') && useGuideTool) && (
          <AlignButton.Root variant="neutral" mode="ghost" size="small" className="w-full justify-start px-2.5" onClick={() => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL))}>
            <MeIcon name="me-menu/helper-tool.png" w={24} h={22} />
            <span className="text-label-xs">Helper</span>
          </AlignButton.Root>
        )}
        {ME_ITEMS.map(item => (
          <AlignButton.Root key={item.icon} variant="neutral" mode="ghost" size="small" className="w-full justify-start px-2.5" onClick={() => item.action()}>
            <MeIcon name={item.icon} w={item.w} h={item.h} />
            <span className="text-label-xs">{item.label}</span>
          </AlignButton.Root>
        ))}
      </AlignPopover.Content>
    </AlignPopover.Root>
  );
};
