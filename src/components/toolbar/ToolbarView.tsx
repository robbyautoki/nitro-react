import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { ToolbarMeView } from './ToolbarMeView';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItemProps
{
    iconClass: string;
    label: string;
    badge?: number;
    onClick: () => void;
}

const SidebarItem: FC<SidebarItemProps> = ({ iconClass, label, badge, onClick }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-white/[0.08] transition-colors" onClick={ onClick }>
                <div className={ `icon ${ iconClass } shrink-0` } />
                <span className="text-[8px] font-medium text-white/40 leading-none">{ label }</span>
                { (badge != null && badge > 0) && (
                    <Badge variant="destructive" className="absolute top-0 right-0 h-[14px] min-w-[14px] flex items-center justify-center text-[8px] px-0.5 rounded-full z-10">
                        { badge }
                    </Badge>
                ) }
            </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
            { label }
        </TooltipContent>
    </Tooltip>
);

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    const [ useGuideTool, setUseGuideTool ] = useState(false);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const isMod = GetSessionDataManager().isModerator;

    useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, event =>
    {
        const parser = event.getParser();
        setUseGuideTool(parser.isAllowed(PerkEnum.USE_GUIDE_TOOL));
    });

    useRoomEngineEvent<NitroToolbarAnimateIconEvent>(NitroToolbarAnimateIconEvent.ANIMATE_ICON, event =>
    {
        const animationIconToToolbar = (iconName: string, image: HTMLImageElement, x: number, y: number) =>
        {
            const target = (document.body.getElementsByClassName(iconName)[0] as HTMLElement);
            if(!target) return;

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
            const motionName = (`ToolbarBouncing[${ iconName }]`);

            if(!Motions.getMotionByTag(motionName))
            {
                Motions.runMotion(new Queue(new Wait((wait + 8)), new DropBounce(target, 400, 12))).tag = motionName;
            }

            const motion = new Queue(new EaseOut(new JumpBy(image, wait, ((targetBounds.x - imageBounds.x) + height), (targetBounds.y - imageBounds.y), 100, 1), 1), new Dispose(image));
            Motions.runMotion(motion);
        }

        animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
    });

    return (
        <TooltipProvider delayDuration={ 400 }>
            <div className="nitro-toolbar fixed left-0 top-0 h-full w-16 z-[70] pointer-events-auto flex flex-col items-center py-3 gap-0.5 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl overflow-y-auto">
                {/* Avatar + Me Menu */}
                <ToolbarMeView
                    useGuideTool={ useGuideTool }
                    unseenAchievementCount={ getTotalUnseen }
                    userFigure={ userFigure }
                />

                <div className="w-8 h-px bg-white/[0.1] my-1" />

                {/* Nav Icons */}
                { isInRoom
                    ? <SidebarItem iconClass="icon-habbo" label="Hotel" onClick={ () => VisitDesktop() } />
                    : <SidebarItem iconClass="icon-house" label="Home" onClick={ () => CreateLinkEvent('navigator/goto/home') } />
                }
                <SidebarItem iconClass="icon-rooms" label="Rooms" onClick={ () => CreateLinkEvent('navigator/toggle') } />
                { GetConfiguration('game.center.enabled') &&
                    <SidebarItem iconClass="icon-game" label="Games" onClick={ () => CreateLinkEvent('games/toggle') } /> }
                <SidebarItem iconClass="icon-catalog" label="Katalog" onClick={ () => CreateLinkEvent('catalog/toggle') } />
                <SidebarItem iconClass="icon-inventory" label="Inventar" badge={ getFullCount } onClick={ () => CreateLinkEvent('inventory/toggle') } />
                { isInRoom &&
                    <SidebarItem iconClass="icon-camera" label="Kamera" onClick={ () => CreateLinkEvent('camera/toggle') } /> }
                { isMod &&
                    <SidebarItem iconClass="icon-modtools" label="Mod" onClick={ () => CreateLinkEvent('mod-tools/toggle') } /> }

                <div className="w-8 h-px bg-white/[0.1] my-1" />

                {/* Social Icons */}
                <SidebarItem iconClass="icon-friendall" label="Freunde" badge={ requests.length } onClick={ () => CreateLinkEvent('friends/toggle') } />
                { ((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
                    <SidebarItem iconClass={ `icon-message${ iconState === MessengerIconState.UNREAD ? ' is-unseen' : '' }` } label="Chat" onClick={ () => OpenMessengerChat() } /> }
            </div>

            {/* Bottom center - Chat Input + Room Tools */}
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto flex items-end gap-2 w-[620px]">
                <div id="toolbar-chat-input-container" className="flex-1 min-w-0" />
                <div id="toolbar-room-tools-container" className="flex items-center shrink-0" />
            </div>
            <div id="toolbar-friend-bar-container" className="hidden" />
        </TooltipProvider>
    );
}
