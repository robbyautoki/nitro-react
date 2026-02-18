import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, Wait } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, MessengerIconState, OpenMessengerChat, VisitDesktop } from '../../api';
import { LayoutAvatarImageView, TransitionAnimation, TransitionAnimationTypes } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { ToolbarMeView } from './ToolbarMeView';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TextGif } from '@/components/ui/text-gif';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Store } from 'lucide-react';

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    const [ isMeExpanded, setMeExpanded ] = useState(false);
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
            { /* Left sidebar - Icons vertikal, frei schwebend */ }
            { /* Logo oben links */ }
            <div className="fixed top-2 left-4 z-[60] pointer-events-none">
                <TextGif gifUrl="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmx6a3BzZ3pwajN0bnphZGlpcHI2ajA1cWpzaHBkbHJ0anVjeGcyeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wQHDnQmXZlpVuuPqey/giphy.gif" text="bahhos" size="lg" weight="bold" />
            </div>
            <div className="nitro-toolbar fixed left-4 top-1/2 -translate-y-1/2 z-[70] pointer-events-auto flex flex-col items-center gap-4 py-3 px-2 texture-panel backdrop-blur-xl rounded-2xl">
                { /* Avatar + Me Menu */ }
                <div className="relative">
                    <div className="absolute left-full ml-2 top-0 pointer-events-none">
                        <TransitionAnimation type={ TransitionAnimationTypes.FADE_IN } inProp={ isMeExpanded } timeout={ 300 }>
                            <ToolbarMeView useGuideTool={ useGuideTool } unseenAchievementCount={ getTotalUnseen } setMeExpanded={ setMeExpanded } />
                        </TransitionAnimation>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={ cn(
                                    'navigation-item item-avatar relative w-[50px] h-[45px] overflow-hidden flex items-center justify-center cursor-pointer',
                                    isMeExpanded && 'opacity-80'
                                ) }
                                onClick={ event => setMeExpanded(!isMeExpanded) }
                            >
                                <LayoutAvatarImageView figure={ userFigure } direction={ 2 } position="absolute" />
                                { (getTotalUnseen > 0) &&
                                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 rounded-full z-10">
                                        { getTotalUnseen }
                                    </Badge> }
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Me
                        </TooltipContent>
                    </Tooltip>
                </div>
                { /* Navigation icons */ }
                { isInRoom &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="navigation-item icon icon-habbo relative shrink-0 cursor-pointer" onClick={ event => VisitDesktop() } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Hotel View
                        </TooltipContent>
                    </Tooltip> }
                { !isInRoom &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="navigation-item icon icon-house relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('navigator/goto/home') } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Home Room
                        </TooltipContent>
                    </Tooltip> }
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item icon icon-rooms relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('navigator/toggle') } />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Navigator
                    </TooltipContent>
                </Tooltip>
                { GetConfiguration('game.center.enabled') &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="navigation-item icon icon-game relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('games/toggle') } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Games
                        </TooltipContent>
                    </Tooltip> }
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item icon icon-catalog relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('catalog/toggle') } />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Catalog
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item relative shrink-0 cursor-pointer flex items-center justify-center w-[38px] h-[36px]" onClick={ event => CreateLinkEvent('marketplace/toggle') }>
                            <Store className="size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" strokeWidth={ 2.5 } />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Marketplace
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item icon icon-inventory relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('inventory/toggle') }>
                            { (getFullCount > 0) &&
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 rounded-full z-10">
                                    { getFullCount }
                                </Badge> }
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Inventory
                    </TooltipContent>
                </Tooltip>
                { isInRoom &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="navigation-item icon icon-camera relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('camera/toggle') } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Camera
                        </TooltipContent>
                    </Tooltip> }
                { isMod &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="navigation-item icon icon-modtools relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('mod-tools/toggle') } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Mod Tools
                        </TooltipContent>
                    </Tooltip> }
                { /* Trenner */ }
                <div className="w-6 h-px bg-white/20" />
                { /* Social icons */ }
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item icon icon-friendall relative shrink-0 cursor-pointer" onClick={ event => CreateLinkEvent('friends/toggle') }>
                            { (requests.length > 0) &&
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 rounded-full z-10">
                                    { requests.length }
                                </Badge> }
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Friends
                    </TooltipContent>
                </Tooltip>
                { ((iconState === MessengerIconState.SHOW) || (iconState === MessengerIconState.UNREAD)) &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={ cn('navigation-item icon icon-message relative shrink-0 cursor-pointer', (iconState === MessengerIconState.UNREAD) && 'is-unseen') } onClick={ event => OpenMessengerChat() } />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                            Messenger
                        </TooltipContent>
                    </Tooltip> }
            </div>
            { /* Bottom center - Nur Chat Input */ }
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto w-[520px]" id="toolbar-chat-input-container" />
            { /* Hidden friend bar container so portal doesn't crash */ }
            <div id="toolbar-friend-bar-container" className="hidden" />
        </TooltipProvider>
    );
}
