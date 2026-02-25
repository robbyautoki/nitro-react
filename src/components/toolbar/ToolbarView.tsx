import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { ToolbarMeView } from './ToolbarMeView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TooltipProvider } from '@/components/ui/tooltip';


function SidebarItem({ iconClass, label, badge, onClick }: { iconClass: string; label: string; badge?: number; onClick?: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <div className={`icon ${iconClass} shrink-0`} style={{ maxWidth: 28, maxHeight: 28 }} />
      <span className="text-[8px] font-medium text-muted-foreground/60 leading-none">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute top-0.5 right-0 h-[14px] min-w-[14px] flex items-center justify-center text-[8px] px-0.5 rounded-full bg-red-500 text-white font-bold shadow-sm">{badge}</span>
      )}
    </div>
  );
}

function OnlineFriendsPopover() {
  const { onlineFriends = [], followFriend } = useFriends();
  const miniAvatars = onlineFriends.slice(0, 3);
  const extraCount = Math.max(0, onlineFriends.length - 3);
  const displayFriends = onlineFriends.slice(0, 5);

  if (onlineFriends.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          {miniAvatars.map((f) => (
            <div key={f.id} className="relative w-7 h-7 rounded-full overflow-hidden bg-accent/50 hover:ring-2 hover:ring-white/10 transition-all">
              <LayoutAvatarImageView figure={f.figure} headOnly={true} direction={2} className="!absolute -top-1" />
              <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-card" />
            </div>
          ))}
          {extraCount > 0 && (
            <span className="text-[9px] font-bold text-muted-foreground/60 bg-accent/50 rounded-full px-1.5 py-0.5">+{extraCount}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-[280px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Online-Freunde</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-border/50 text-muted-foreground">{onlineFriends.length}</Badge>
          </div>
        </div>
        <div className="p-2 space-y-0.5 max-h-[260px] overflow-y-auto">
          {displayFriends.map((f) => (
            <div key={f.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 bg-accent/50">
                <LayoutAvatarImageView figure={f.figure} headOnly={true} direction={2} className="!absolute -top-1" />
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 shrink-0 border-border/50 text-foreground/80 hover:bg-accent/50 hover:text-foreground" onClick={() => OpenMessengerChat(f.id)}>Chat</Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 shrink-0 border-border/50 text-foreground/80 hover:bg-accent/50 hover:text-foreground" onClick={() => followFriend(f)}>Besuchen</Button>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border/40">
          <button className="text-[11px] text-white/50 hover:text-foreground hover:underline" onClick={() => CreateLinkEvent('friends/toggle')}>Alle Freunde anzeigen</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const ToolbarView: FC<{ isInRoom: boolean }> = props => {
  const { isInRoom } = props;
  const [useGuideTool, setUseGuideTool] = useState(false);
  const { userFigure = null } = useSessionInfo();
  const { getFullCount = 0 } = useInventoryUnseenTracker();
  const { getTotalUnseen = 0 } = useAchievements();
  const { requests = [] } = useFriends();
  const { iconState = MessengerIconState.HIDDEN } = useMessenger();
  const isMod = GetSessionDataManager().isModerator;

  useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, event => {
    const parser = event.getParser();
    setUseGuideTool(parser.isAllowed(PerkEnum.USE_GUIDE_TOOL));
  });

  useRoomEngineEvent<NitroToolbarAnimateIconEvent>(NitroToolbarAnimateIconEvent.ANIMATE_ICON, event => {
    const animationIconToToolbar = (iconName: string, image: HTMLImageElement, x: number, y: number) => {
      const target = (document.body.getElementsByClassName(iconName)[0] as HTMLElement);
      if (!target) return;
      image.className = 'toolbar-icon-animation';
      image.style.visibility = 'visible';
      image.style.left = (x + 'px');
      image.style.top = (y + 'px');
      document.body.append(image);
      const targetBounds = target.getBoundingClientRect();
      const imageBounds = image.getBoundingClientRect();
      const left = (imageBounds.x - targetBounds.x);
      const top = (imageBounds.y - targetBounds.y);
      const squared = Math.sqrt(((left * left) + (top * top)));
      const wait = (500 - Math.abs(((((1 / squared) * 100) * 500) * 0.5)));
      const height = 20;
      const motionName = (`ToolbarBouncing[${iconName}]`);
      if (!Motions.getMotionByTag(motionName)) {
        Motions.runMotion(new Queue(new Wait((wait + 8)), new DropBounce(target, 400, 12))).tag = motionName;
      }
      const motion = new Queue(new EaseOut(new JumpBy(image, wait, ((targetBounds.x - imageBounds.x) + height), (targetBounds.y - imageBounds.y), 100, 1), 1), new Dispose(image));
      Motions.runMotion(motion);
    }
    animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="nitro-toolbar fixed left-0 top-0 h-screen z-[70] pointer-events-auto shrink-0">
        <div className="border-r border-border/40 bg-card w-16 flex flex-col items-center py-3 gap-0.5 overflow-hidden h-screen">

          <ToolbarMeView
            useGuideTool={useGuideTool}
            unseenAchievementCount={getTotalUnseen}
            userFigure={userFigure}
          />

          <div className="w-8 h-px bg-accent/50 my-1" />

          {isInRoom
            ? <SidebarItem iconClass="icon-habbo" label="Hotel View" onClick={() => VisitDesktop()} />
            : <SidebarItem iconClass="icon-house" label="Home" onClick={() => CreateLinkEvent('navigator/goto/home')} />
          }
          <SidebarItem iconClass="icon-rooms" label="Navigator" onClick={() => CreateLinkEvent('navigator/toggle')} />
          {GetConfiguration('game.center.enabled') &&
            <SidebarItem iconClass="icon-game" label="Games" onClick={() => CreateLinkEvent('games/toggle')} />}
          <SidebarItem iconClass="icon-catalog" label="Katalog" onClick={() => CreateLinkEvent('catalog/toggle')} />
          <SidebarItem iconClass="icon-inventory" label="Inventar" badge={getFullCount} onClick={() => CreateLinkEvent('inventory/toggle')} />
          {isInRoom &&
            <SidebarItem iconClass="icon-camera" label="Kamera" onClick={() => CreateLinkEvent('camera/toggle')} />}
          {isMod &&
            <SidebarItem iconClass="icon-modtools" label="Mod Tools" onClick={() => CreateLinkEvent('mod-tools/toggle')} />}

          <div className="w-8 h-px bg-accent/50 my-1" />

          <SidebarItem iconClass="icon-friendall" label="Freunde" badge={requests.length} onClick={() => CreateLinkEvent('friends/toggle')} />
          {((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
            <SidebarItem iconClass={`icon-message${iconState === MessengerIconState.UNREAD ? ' is-unseen' : ''}`} label="Messenger" onClick={() => OpenMessengerChat()} />}

          <div className="w-8 h-px bg-accent/50 my-1" />

          <OnlineFriendsPopover />
        </div>

      </div>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto flex items-end gap-2 w-[620px]">
        <div id="toolbar-chat-input-container" className="flex-1 min-w-0" />
        <div id="toolbar-room-tools-container" className="flex items-center shrink-0" />
      </div>
      <div id="toolbar-friend-bar-container" className="hidden" />
    </TooltipProvider>
  );
}
