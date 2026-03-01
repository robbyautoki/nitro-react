import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Volume2, Mic, MicOff, Headphones, PhoneOff, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo, getOwnPrestige } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { useInventoryBadges } from '../../hooks/inventory';
import { MePanelView } from './MePanelView';
import { VoiceChannelView } from '../room/VoiceChannelView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

function ToolbarIcon({ name, w, h }: { name: string; w: number; h: number }) {
  return (
    <img
      src={`/toolbar-icons/${name}`}
      alt={name}
      style={{ width: w, height: h, imageRendering: 'pixelated', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive';
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  dataBadge?: string;
}

function SidebarItem({ icon, label, badge, badgeVariant = 'default', active, expanded, onClick, dataBadge }: SidebarItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            data-badge={dataBadge}
            className={cn(
              'group relative flex items-center gap-3 w-full rounded-xl transition-colors hover:bg-accent/50',
              expanded ? 'px-3 py-2.5' : 'px-3 py-3 justify-center',
              active && 'bg-accent'
            )}
          >
            <div className="shrink-0 flex items-center justify-center" style={{ minWidth: 40, minHeight: 40 }}>
              {icon}
            </div>
            {expanded && (
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
            )}
            {badge != null && badge > 0 && (
              <Badge variant={badgeVariant} className={cn(expanded ? '' : 'absolute -top-1 -right-1')}>
                {badge}
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

function OnlineFriendItem({ name, figure, onChat, onFollow }: { name: string; figure: string; onChat: () => void; onFollow: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
      <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 bg-accent/50">
        <LayoutAvatarImageView figure={figure} headOnly={true} direction={2} className="!absolute -top-1" />
        <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-card" />
      </div>
      <span className="text-xs font-medium flex-1 truncate">{name}</span>
      <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5 shrink-0 border-border/50" onClick={(e) => { e.stopPropagation(); onChat(); }}>Chat</Button>
      <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5 shrink-0 border-border/50" onClick={(e) => { e.stopPropagation(); onFollow(); }}>Go</Button>
    </div>
  );
}

export const ToolbarView: FC<{ isInRoom: boolean }> = props => {
  const { isInRoom } = props;
  const [expanded, setExpanded] = useState(false);
  const [mePanelOpen, setMePanelOpen] = useState(false);
  const [useGuideTool, setUseGuideTool] = useState(false);
  const { userFigure = null } = useSessionInfo();
  const { getFullCount = 0 } = useInventoryUnseenTracker();
  const { getTotalUnseen = 0 } = useAchievements();
  const { achievementScore = 0 } = useAchievements();
  const { requests = [], onlineFriends = [], followFriend } = useFriends();
  const { iconState = MessengerIconState.HIDDEN } = useMessenger();
  const { badgeCodes = [] } = useInventoryBadges();
  const isMod = GetSessionDataManager().isModerator;
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const userName = GetSessionDataManager().userName || 'User';
  const localPrestige = useMemo(() => getOwnPrestige(), []);
  const badgePrestige = useMemo(() => getPrestigeFromBadges(badgeCodes), [badgeCodes]);
  const prestige = Math.max(localPrestige, badgePrestige);
  const prestigeInfo = useMemo(() => getPrestigeInfo(achievementScore, prestige), [achievementScore, prestige]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('nitro.theme', next ? 'dark' : 'light');
    setIsDark(next);
  }, [isDark]);

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
    };
    animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
  });

  // Sidebar width for external consumers (PurseView)
  const sidebarWidth = expanded ? 280 : 80;

  // Publish sidebar width via CSS custom property
  const updateCssVar = useCallback((exp: boolean) => {
    document.documentElement.style.setProperty('--sidebar-width', exp ? '280px' : '80px');
  }, []);

  const handleToggleExpand = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    updateCssVar(next);
  }, [expanded, updateCssVar]);

  // Set initial CSS var
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '80px');
  }, []);

  const displayFriends = onlineFriends.slice(0, 5);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="nitro-toolbar fixed left-0 top-0 h-screen z-[70] pointer-events-auto shrink-0">
        <div
          className={cn(
            'border-r border-border/40 bg-card flex flex-col items-center py-2 gap-0 overflow-y-auto overflow-x-hidden h-screen pt-[64px]',
            'transition-all duration-300 ease-out',
            expanded ? 'w-[280px]' : 'w-[80px]'
          )}
        >
          {/* Avatar Section — Expand/Collapse Toggle */}
          <div
            onClick={handleToggleExpand}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors shrink-0 w-full"
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-accent/30">
              <LayoutAvatarImageView figure={userFigure} direction={2} className="!absolute top-0 left-1/2" style={{ transform: 'translateX(-50%) scale(0.6)', transformOrigin: 'top center' }} />
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {prestige > 0 && `P${prestige} `}Lvl {prestigeInfo.displayLevel} {prestigeInfo.isMaxLevel ? '' : `\u2022 ${prestigeInfo.currentXP}/${prestigeInfo.nextLevelXP} XP`}
                </p>
              </div>
            )}
          </div>

          {/* Me-Panel Trigger */}
          <div className="w-full px-2 mb-1">
            <SidebarItem
              icon={<ToolbarIcon name="me-menu/profile.png" w={expanded ? 24 : 28} h={expanded ? 24 : 26} />}
              label="Mein Menü"
              expanded={expanded}
              active={mePanelOpen}
              onClick={() => setMePanelOpen(prev => !prev)}
            />
          </div>

          <Separator className="opacity-50 mx-4" />

          {/* Navigation Items */}
          <div className="p-2 space-y-1 shrink-0 w-full">
            {isInRoom
              ? <SidebarItem icon={<ToolbarIcon name="habbo.png" w={40} h={34} />} label="Hotel View" expanded={expanded} onClick={() => VisitDesktop()} />
              : <SidebarItem icon={<ToolbarIcon name="house.png" w={32} h={30} />} label="Home" expanded={expanded} onClick={() => CreateLinkEvent('navigator/goto/home')} />
            }
            <SidebarItem icon={<ToolbarIcon name="rooms.png" w={44} h={30} />} label="Navigator" expanded={expanded} onClick={() => CreateLinkEvent('navigator/toggle')} />
            {GetConfiguration('game.center.enabled') && (
              <SidebarItem icon={<ToolbarIcon name="game.png" w={34} h={34} />} label="Games" expanded={expanded} onClick={() => CreateLinkEvent('games/toggle')} />
            )}
            <SidebarItem icon={<ToolbarIcon name="catalog.png" w={37} h={36} />} label="Katalog" expanded={expanded} onClick={() => CreateLinkEvent('catalog/toggle')} />
            <SidebarItem
              icon={<ToolbarIcon name="inventory.png" w={44} h={41} />}
              label="Inventar"
              badge={getFullCount}
              expanded={expanded}
              onClick={() => CreateLinkEvent('inventory/toggle')}
              dataBadge="inventory"
            />
            {isInRoom && (
              <SidebarItem icon={<ToolbarIcon name="camera.png" w={37} h={36} />} label="Kamera" expanded={expanded} onClick={() => CreateLinkEvent('camera/toggle')} />
            )}
            {isMod && (
              <SidebarItem icon={<ToolbarIcon name="modtools.png" w={30} h={30} />} label="Mod Tools" expanded={expanded} onClick={() => CreateLinkEvent('mod-tools/toggle')} />
            )}
          </div>

          <Separator className="opacity-50 mx-4 my-1" />

          {/* Social Items */}
          <div className="p-2 space-y-1 shrink-0 w-full">
            <SidebarItem
              icon={<ToolbarIcon name="friend_all.png" w={32} h={33} />}
              label="Freunde"
              badge={requests.length}
              badgeVariant="destructive"
              expanded={expanded}
              onClick={() => CreateLinkEvent('friends/toggle')}
              dataBadge="friends"
            />
            {(iconState === MessengerIconState.SHOW || iconState === MessengerIconState.UNREAD) && (
              <SidebarItem
                icon={<ToolbarIcon name="message.png" w={30} h={30} />}
                label="Messenger"
                badge={iconState === MessengerIconState.UNREAD ? 1 : undefined}
                badgeVariant="destructive"
                expanded={expanded}
                onClick={() => OpenMessengerChat()}
                dataBadge="messenger"
              />
            )}
          </div>

          <Separator className="opacity-50 mx-4 my-1" />

          {/* Online Friends (only when expanded) */}
          {expanded && onlineFriends.length > 0 && (
            <div className="px-3 mt-1 shrink-0 w-full">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Online-Freunde ({onlineFriends.length})
              </p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {displayFriends.map((f) => (
                  <OnlineFriendItem
                    key={f.id}
                    name={f.name}
                    figure={f.figure}
                    onChat={() => OpenMessengerChat(f.id)}
                    onFollow={() => followFriend(f)}
                  />
                ))}
                {onlineFriends.length > 5 && (
                  <button className="text-[11px] text-muted-foreground hover:text-foreground hover:underline px-2 py-1" onClick={() => CreateLinkEvent('friends/toggle')}>
                    Alle anzeigen ({onlineFriends.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collapsed: mini friend avatars */}
          {!expanded && onlineFriends.length > 0 && (
            <div className="flex flex-col items-center gap-1 mt-1">
              {onlineFriends.slice(0, 3).map((f) => (
                <div key={f.id} className="relative w-7 h-7 rounded-full overflow-hidden bg-accent/50 cursor-pointer hover:ring-2 hover:ring-white/10 transition-all" onClick={() => OpenMessengerChat(f.id)}>
                  <LayoutAvatarImageView figure={f.figure} headOnly={true} direction={2} className="!absolute -top-1" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-card" />
                </div>
              ))}
              {onlineFriends.length > 3 && (
                <span className="text-[9px] font-bold text-muted-foreground/60 bg-accent/50 rounded-full px-1.5 py-0.5 cursor-pointer" onClick={() => CreateLinkEvent('friends/toggle')}>+{onlineFriends.length - 3}</span>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: Voice Chat + Dark Mode */}
          <div className="p-2 space-y-1 shrink-0 w-full">
            {isInRoom && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'group relative flex items-center gap-3 w-full rounded-xl py-2.5 transition-colors hover:bg-accent/50',
                      expanded ? 'px-3' : 'px-3 justify-center'
                    )}
                  >
                    <div className="shrink-0 flex items-center justify-center" style={{ minWidth: 40, minHeight: 40 }}>
                      <Volume2 className="size-6 text-muted-foreground/60" />
                    </div>
                    {expanded && (
                      <span className="text-sm font-medium flex-1 text-left">Voice Chat</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="end" sideOffset={16} className="w-[260px] p-0 border-none bg-transparent shadow-none">
                  <VoiceChannelView />
                </PopoverContent>
              </Popover>
            )}

            <SidebarItem
              icon={<ToolbarIcon name="me-menu/cog.png" w={32} h={30} />}
              label={isDark ? 'Light Mode' : 'Dark Mode'}
              active={false}
              expanded={expanded}
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>

      <MePanelView open={mePanelOpen} onClose={() => setMePanelOpen(false)} useGuideTool={useGuideTool} />

      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto w-[550px]">
        <div id="toolbar-chat-input-container" />
      </div>
      <div id="toolbar-friend-bar-container" className="hidden" />
    </TooltipProvider>
  );
};
