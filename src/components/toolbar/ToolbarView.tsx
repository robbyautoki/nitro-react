import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { Bell, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useNotificationCenter, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { ToolbarMeView } from './ToolbarMeView';
import { ToolbarSpotlightPill } from './ToolbarSpotlightPill';
import { VoiceChannelView } from '../room/VoiceChannelView';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignPopover from '@/align-ui/components/ui/popover';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';

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

const getCmsUrl = (): string => {
  if (typeof window === 'undefined') return 'https://www.bahhos.de';
  return window.location.hostname === 'localhost' ? 'http://localhost:3030' : 'https://www.bahhos.de';
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive';
  active?: boolean;
  onClick?: () => void;
  dataBadge?: string;
}

function SidebarItem({ icon, label, badge, badgeVariant = 'default', active, onClick, dataBadge }: SidebarItemProps) {
  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <AlignButton.Root
            onClick={onClick}
            data-badge={dataBadge}
            variant="neutral"
            mode={active ? 'lighter' : 'ghost'}
            size="medium"
            className={cn(
              'nitro-toolbar-item group relative w-full h-[52px] min-h-[52px] rounded-16 text-text-sub-600',
              'justify-center px-2',
              active && 'is-active'
            )}
          >
            <div className="shrink-0 flex size-12 items-center justify-center">
              {icon}
            </div>
            {badge != null && badge > 0 && (
              <AlignBadge.Root
                color={badgeVariant === 'destructive' ? 'red' : 'green'}
                variant="filled"
                size="small"
                className="absolute -top-1 -right-1"
              >
                {badge}
              </AlignBadge.Root>
            )}
          </AlignButton.Root>
        </AlignTooltip.Trigger>
        <AlignTooltip.Content side="right">{label}</AlignTooltip.Content>
      </AlignTooltip.Root>
    </AlignTooltip.Provider>
  );
}

export const ToolbarView: FC<{ isInRoom: boolean }> = props => {
  const { isInRoom } = props;
  const [useGuideTool, setUseGuideTool] = useState(false);
  const { userFigure = null } = useSessionInfo();
  const { getFullCount = 0 } = useInventoryUnseenTracker();
  const { getTotalUnseen = 0 } = useAchievements();
  const { requests = [], onlineFriends = [] } = useFriends();
  const { iconState = MessengerIconState.HIDDEN } = useMessenger();
  const { unreadCount = 0 } = useNotificationCenter();
  const isMod = GetSessionDataManager().isModerator;
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('nitro.theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('nitro.theme') : null;
    if (saved === 'dark') document.documentElement.classList.add('dark');
    else if (saved === 'light') document.documentElement.classList.remove('dark');
  }, []);

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

  const handleHomeClick = useCallback(() => {
    if (isInRoom) {
      VisitDesktop();
      return;
    }

    CreateLinkEvent('navigator/goto/home');
  }, [isInRoom]);

  const handleCmsClick = useCallback(() => {
    window.location.href = getCmsUrl();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '84px');
    document.documentElement.style.setProperty('--topbar-center-offset', '42px');
    document.documentElement.style.setProperty('--topbar-height', '60px');
    if (!document.documentElement.style.getPropertyValue('--drawer-open')) {
      document.documentElement.style.setProperty('--drawer-open', '0');
    }
  }, []);

  return (
    <AlignTooltip.Provider delayDuration={200}>
      {/* Spotlight-Pill — links neben Toolbar (über Avatar), nur sichtbar wenn aktueller Raum spotlighted */}
      <div className="fixed left-3 top-[40px] z-[71] pointer-events-none flex w-[68px] items-center justify-center">
        <ToolbarSpotlightPill />
      </div>
      <div className="nitro-toolbar fixed left-3 top-[72px] z-[70] pointer-events-auto shrink-0">
          <div
            className={cn(
            'nitro-toolbar-float relative flex max-h-[calc(100vh-96px)] flex-col items-center overflow-y-auto overflow-x-hidden rounded-[24px] py-3 text-text-strong-950',
            'transition-all duration-300 ease-out',
            'w-[68px]'
          )}
        >
          {/* Avatar Section — Kopf groß, gleichzeitig Me-Menü-Trigger */}
          <ToolbarMeView
            useGuideTool={useGuideTool}
            unseenAchievementCount={getTotalUnseen}
            userFigure={userFigure}
          >
            <button
              type="button"
              aria-label="Mein Menü"
              className={cn(
                'nitro-toolbar-avatar group relative mx-auto mb-2 mt-1 flex h-[72px] w-[72px]',
                'shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent border-0 p-0',
                'cursor-pointer transition-transform duration-200',
                'hover:scale-105 active:scale-100',
                'focus:outline-none focus-visible:outline-none'
              )}
            >
              <LayoutAvatarImageView
                figure={userFigure}
                direction={2}
                headOnly={true}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center 4px',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                  transform: 'scale(2.4)',
                  transformOrigin: 'center 30%',
                }}
              />
            </button>
          </ToolbarMeView>

          <AlignDivider.Root className="mx-4 my-3 w-[calc(100%-2rem)]" />

          {/* Navigation Items */}
          <div className="px-2 space-y-2 shrink-0 w-full">
            <SidebarItem icon={<ToolbarIcon name="house.png" w={32} h={30} />} label="Start" onClick={handleHomeClick} />
            <SidebarItem icon={<ToolbarIcon name="rooms.png" w={44} h={30} />} label="Navigator" onClick={() => CreateLinkEvent('navigator/toggle')} />
            {GetConfiguration('game.center.enabled') && (
              <SidebarItem icon={<ToolbarIcon name="game.png" w={44} h={25} />} label="Games" onClick={() => CreateLinkEvent('games/toggle')} />
            )}
            <SidebarItem icon={<ToolbarIcon name="catalog.png" w={37} h={37} />} label="Katalog" onClick={() => CreateLinkEvent('catalog/toggle')} />
            <SidebarItem
              icon={<ToolbarIcon name="inventory.png" w={44} h={41} />}
              label="Inventar"
              badge={getFullCount}
              onClick={() => CreateLinkEvent('inventory/toggle')}
              dataBadge="inventory"
            />
            {isInRoom && (
              <SidebarItem icon={<ToolbarIcon name="camera.png" w={38} h={45} />} label="Kamera" onClick={() => CreateLinkEvent('camera/toggle')} />
            )}
            {isMod && (
              <SidebarItem icon={<ToolbarIcon name="modtools.png" w={29} h={34} />} label="Mod Tools" onClick={() => CreateLinkEvent('mod-tools/toggle')} />
            )}
          </div>

          <AlignDivider.Root className="mx-4 my-3 w-[calc(100%-2rem)]" />

          {/* Social Items */}
          <div className="px-2 space-y-2 shrink-0 w-full">
            <SidebarItem
              icon={<ToolbarIcon name="friend_all.png" w={32} h={33} />}
              label="Freunde"
              badge={requests.length}
              badgeVariant="destructive"
              onClick={() => CreateLinkEvent('friends/toggle')}
              dataBadge="friends"
            />
            {(iconState === MessengerIconState.SHOW || iconState === MessengerIconState.UNREAD) && (
              <SidebarItem
                icon={<ToolbarIcon name="message.png" w={26} h={31} />}
                label="Messenger"
                badge={iconState === MessengerIconState.UNREAD ? 1 : undefined}
                badgeVariant="destructive"
                onClick={() => OpenMessengerChat()}
                dataBadge="messenger"
              />
            )}
            <SidebarItem
              icon={<Bell className="size-6 text-current" />}
              label="Benachrichtigungen"
              badge={unreadCount}
              badgeVariant="destructive"
              onClick={() => CreateLinkEvent('notifications/toggle')}
              dataBadge="notifications"
            />
          </div>

          <AlignDivider.Root className="mx-4 my-3 w-[calc(100%-2rem)]" />

          {onlineFriends.length > 0 && (
            <div className="flex flex-col items-center gap-2 mt-1">
              {onlineFriends.slice(0, 3).map((f) => (
                <div key={f.id} className="relative w-7 h-7 rounded-full overflow-hidden bg-bg-weak-50 cursor-pointer hover:ring-2 hover:ring-primary-base/20 transition-all" onClick={() => OpenMessengerChat(f.id)}>
                  <LayoutAvatarImageView
                    figure={f.figure}
                    headOnly
                    direction={2}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      backgroundSize: 'contain',
                      backgroundPosition: 'center 2px',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      transform: 'scale(1.3)',
                      transformOrigin: 'center 30%',
                    }}
                  />
                  <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success-base border border-card" />
                </div>
              ))}
              {onlineFriends.length > 3 && (
                <span className="text-subheading-2xs text-text-sub-600 bg-bg-weak-50 rounded-full px-1.5 py-0.5 cursor-pointer" onClick={() => CreateLinkEvent('friends/toggle')}>+{onlineFriends.length - 3}</span>
              )}
            </div>
          )}

          {/* Bottom: Voice Chat + Hub + Dark Mode */}
          <div className="px-2 space-y-2 shrink-0 w-full">
            {isInRoom && (
              <AlignPopover.Root>
                <AlignPopover.Trigger asChild>
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="medium"
                    className="nitro-toolbar-item group relative h-[52px] min-h-[52px] w-full justify-center rounded-16 px-2 text-text-sub-600"
                  >
                    <div className="shrink-0 flex size-12 items-center justify-center">
                      <Volume2 className="size-6 text-current" />
                    </div>
                  </AlignButton.Root>
                </AlignPopover.Trigger>
                <AlignPopover.Content side="right" align="end" sideOffset={16} showArrow={false} unstyled className="w-[260px] p-0 border-none bg-transparent shadow-none">
                  <VoiceChannelView />
                </AlignPopover.Content>
              </AlignPopover.Root>
            )}

            <SidebarItem
              icon={<ToolbarIcon name="habbo.png" w={32} h={32} />}
              label="Zurück zum Hub"
              onClick={handleCmsClick}
            />

            <SidebarItem
              icon={<ToolbarIcon name="me-menu/cog.png" w={28} h={34} />}
              label={isDark ? 'Light Mode' : 'Dark Mode'}
              active={false}
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto w-[550px]">
        <div id="toolbar-chat-input-container" />
      </div>
      <div id="toolbar-friend-bar-container" className="hidden" />
    </AlignTooltip.Provider>
  );
};
