import { MouseEventType, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { Dispatch, FC, PropsWithChildren, SetStateAction, useEffect, useRef } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, GetUserProfile } from '../../api';
import { GuideToolEvent } from '../../events';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarMeViewProps
{
    useGuideTool: boolean;
    unseenAchievementCount: number;
    setMeExpanded: Dispatch<SetStateAction<boolean>>;
}

export const ToolbarMeView: FC<PropsWithChildren<ToolbarMeViewProps>> = props =>
{
    const { useGuideTool = false, unseenAchievementCount = 0, setMeExpanded = null, children = null, ...rest } = props;
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const roomSession = GetRoomSession();

        if(!roomSession) return;

        GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
    }, []);

    useEffect(() =>
    {
        const onClick = (event: MouseEvent) => setMeExpanded(false);

        document.addEventListener('click', onClick);

        return () => document.removeEventListener(MouseEventType.MOUSE_CLICK, onClick);
    }, [ setMeExpanded ]);

    return (
        <div
            ref={ elementRef }
            className="nitro-toolbar-me z-[75] flex items-center gap-2.5 p-3 texture-panel backdrop-blur-2xl rounded-2xl pointer-events-auto"
        >
            { (GetConfiguration('guides.enabled') && useGuideTool) &&
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="navigation-item icon icon-me-helper-tool relative p-1 rounded-lg cursor-pointer" onClick={ event => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL)) } />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                        Helper
                    </TooltipContent>
                </Tooltip> }
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="navigation-item icon icon-me-achievements relative p-1 rounded-lg cursor-pointer" onClick={ event => CreateLinkEvent('achievements/toggle') }>
                        { (unseenAchievementCount > 0) &&
                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 rounded-full">
                                { unseenAchievementCount }
                            </Badge> }
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                    Achievements
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="navigation-item icon icon-me-profile relative p-1 rounded-lg cursor-pointer" onClick={ event => GetUserProfile(GetSessionDataManager().userId) } />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                    Profile
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="navigation-item icon icon-me-rooms relative p-1 rounded-lg cursor-pointer" onClick={ event => CreateLinkEvent('navigator/search/myworld_view') } />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                    My Rooms
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="navigation-item icon icon-me-clothing relative p-1 rounded-lg cursor-pointer" onClick={ event => CreateLinkEvent('avatar-editor/toggle') } />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                    Avatar
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="navigation-item icon icon-me-settings relative p-1 rounded-lg cursor-pointer" onClick={ event => CreateLinkEvent('user-settings/toggle') } />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/80 text-white text-xs shadow-sm backdrop-blur-sm">
                    Settings
                </TooltipContent>
            </Tooltip>
            { children }
        </div>
    );
}
