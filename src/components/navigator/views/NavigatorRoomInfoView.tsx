import { GetCustomRoomFilterMessageComposer, NavigatorSearchComposer, RoomMuteComposer, RoomSettingsComposer, SecurityLevel, ToggleStaffPickMessageComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetGroupInformation, GetSessionDataManager, LocalizeText, ReportType, SendMessageComposer } from '../../../api';
import { LayoutBadgeImageView, LayoutRoomThumbnailView, UserProfileIconView } from '../../../common';
import { RoomWidgetThumbnailEvent } from '../../../events';
import { DraggableWindow, DraggableWindowPosition } from '../../../common';
import { useHelp, useNavigator } from '../../../hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/reui-badge';
import { Input } from '@/components/ui/input';
import { Frame, FramePanel } from '@/components/ui/frame';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, Star, Settings, Link2, Camera, Users, Copy, Check, MessageCircle, Flag, VolumeX, Volume2, Filter, LayoutGrid, Shield, X } from 'lucide-react';

export class NavigatorRoomInfoViewProps
{
    onCloseClick: () => void;
}

function ActivityBar({ userCount, maxUsers }: { userCount: number; maxUsers: number })
{
    const pct = maxUsers > 0 ? Math.min(100, Math.round((userCount / maxUsers) * 100)) : 0;
    let barColor = 'bg-emerald-500';
    if(pct >= 90) barColor = 'bg-red-500';
    else if(pct >= 50) barColor = 'bg-amber-500';
    else if(userCount <= 0) barColor = 'bg-muted-foreground/20';

    return (
        <div className="flex items-center gap-1.5 w-full">
            <MessageCircle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className={ `h-full rounded-full transition-all ${ barColor }` } style={ { width: `${ Math.max(pct, 2) }%` } } />
            </div>
        </div>
    );
}

export const NavigatorRoomInfoView: FC<NavigatorRoomInfoViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const [ isRoomPicked, setIsRoomPicked ] = useState(false);
    const [ isRoomMuted, setIsRoomMuted ] = useState(false);
    const [ showLink, setShowLink ] = useState(false);
    const [ linkCopied, setLinkCopied ] = useState(false);
    const { report = null } = useHelp();
    const { navigatorData = null } = useNavigator();

    const hasPermission = (permission: string) =>
    {
        switch(permission)
        {
            case 'settings':
                return (GetSessionDataManager().userId === navigatorData.enteredGuestRoom.ownerId || GetSessionDataManager().isModerator);
            case 'staff_pick':
                return GetSessionDataManager().securityLevel >= SecurityLevel.COMMUNITY;
            default: return false;
        }
    }

    const processAction = useCallback((action: string, value?: string) =>
    {
        if(!navigatorData || !navigatorData.enteredGuestRoom) return;

        switch(action)
        {
            case 'set_home_room': {
                let newRoomId = -1;
                if(navigatorData.homeRoomId !== navigatorData.enteredGuestRoom.roomId) newRoomId = navigatorData.enteredGuestRoom.roomId;
                if(newRoomId > 0) SendMessageComposer(new UpdateHomeRoomMessageComposer(newRoomId));
                return;
            }
            case 'navigator_search_tag':
                CreateLinkEvent(`navigator/search/${ value }`);
                SendMessageComposer(new NavigatorSearchComposer('hotel_view', `tag:${ value }`));
                return;
            case 'open_room_thumbnail_camera':
                DispatchUiEvent(new RoomWidgetThumbnailEvent(RoomWidgetThumbnailEvent.TOGGLE_THUMBNAIL));
                return;
            case 'open_group_info':
                GetGroupInformation(navigatorData.enteredGuestRoom.habboGroupId);
                return;
            case 'open_room_settings':
                SendMessageComposer(new RoomSettingsComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'toggle_pick':
                setIsRoomPicked(v => !v);
                SendMessageComposer(new ToggleStaffPickMessageComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'toggle_mute':
                setIsRoomMuted(v => !v);
                SendMessageComposer(new RoomMuteComposer());
                return;
            case 'room_filter':
                SendMessageComposer(new GetCustomRoomFilterMessageComposer(navigatorData.enteredGuestRoom.roomId));
                return;
            case 'open_floorplan_editor':
                CreateLinkEvent('floor-editor/toggle');
                return;
            case 'report_room':
                report(ReportType.ROOM, { roomId: navigatorData.enteredGuestRoom.roomId, roomName: navigatorData.enteredGuestRoom.roomName });
                return;
            case 'close':
                onCloseClick();
                return;
        }
    }, [ navigatorData, onCloseClick, report ]);

    const handleCopyLink = useCallback(() =>
    {
        if(!navigatorData?.enteredGuestRoom) return;
        const link = `https://play.bahhos.de/room/${ navigatorData.enteredGuestRoom.roomId }`;
        navigator.clipboard.writeText(link).then(() =>
        {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    }, [ navigatorData ]);

    useEffect(() =>
    {
        if(!navigatorData) return;
        setIsRoomPicked(navigatorData.currentRoomIsStaffPick);
        if(navigatorData.enteredGuestRoom) setIsRoomMuted(navigatorData.enteredGuestRoom.allInRoomMuted);
    }, [ navigatorData ]);

    if(!navigatorData?.enteredGuestRoom) return null;

    const room = navigatorData.enteredGuestRoom;
    const isHome = navigatorData.homeRoomId === room.roomId;
    const roomLink = `https://play.bahhos.de/room/${ room.roomId }`;

    return (
        <TooltipProvider delayDuration={ 200 }>
            <DraggableWindow uniqueKey="room-info" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
                <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col" style={ { width: 420 } }>
                    {/* Title Bar */}
                    <div className="drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                        <span className="text-[13px] font-semibold">Rauminformationen</span>
                        <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onClick={ () => processAction('close') }>
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 overflow-auto max-h-[500px]">
                        <Frame stacked spacing="sm" className="w-full">
                            {/* Panel 1: Room Info */}
                            <FramePanel>
                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    <div className="relative shrink-0">
                                        <div className="w-[110px] h-[110px] rounded-lg overflow-hidden border border-border/30">
                                            <LayoutRoomThumbnailView roomId={ room.roomId } customUrl={ room.officialRoomPicRef }>
                                                { hasPermission('settings') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/40 hover:bg-black/60 transition-colors"
                                                                onClick={ () => processAction('open_room_thumbnail_camera') }
                                                            >
                                                                <Camera className="w-3 h-3 text-white/70" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="text-xs">Thumbnail ändern</TooltipContent>
                                                    </Tooltip>
                                                ) }
                                            </LayoutRoomThumbnailView>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        {/* Row 1: Home + Name + Actions */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button onClick={ () => processAction('set_home_room') } className="shrink-0">
                                                            <Home className={ `w-3.5 h-3.5 transition-colors ${ isHome ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40 hover:text-muted-foreground' }` } />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs">
                                                        { isHome ? 'Heimraum entfernen' : 'Als Heimraum setzen' }
                                                    </TooltipContent>
                                                </Tooltip>
                                                <span className="text-sm font-semibold truncate">{ room.roomName }</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                { hasPermission('settings') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="p-1 rounded-md hover:bg-muted transition-colors" onClick={ () => processAction('open_room_settings') }>
                                                                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="text-xs">Raumeinstellungen</TooltipContent>
                                                    </Tooltip>
                                                ) }
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="p-1 rounded-md hover:bg-muted transition-colors" onClick={ () => setShowLink(prev => !prev) }>
                                                            <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs">Raum-Link</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {/* Row 2: Owner */}
                                        { room.showOwner && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[11px] text-muted-foreground">Besitzer:</span>
                                                <UserProfileIconView userId={ room.ownerId } />
                                                <span className="text-[11px] font-medium">{ room.ownerName }</span>
                                            </div>
                                        ) }

                                        {/* Row 3: Rating */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-muted-foreground">Bewertung:</span>
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-[11px] font-medium">{ navigatorData.currentRoomRating }</span>
                                        </div>

                                        {/* Tags */}
                                        { room.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                { room.tags.map(tag => (
                                                    <Badge
                                                        key={ tag }
                                                        variant="outline"
                                                        size="xs"
                                                        className="text-[10px] cursor-pointer hover:bg-muted"
                                                        onClick={ () => processAction('navigator_search_tag', tag) }
                                                    >
                                                        #{ tag }
                                                    </Badge>
                                                )) }
                                            </div>
                                        ) }

                                        {/* Description */}
                                        { room.description && (
                                            <ScrollArea className="max-h-[40px] mt-0.5">
                                                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{ room.description }</p>
                                            </ScrollArea>
                                        ) }

                                        {/* Group */}
                                        { room.habboGroupId > 0 && (
                                            <button
                                                className="flex items-center gap-1 mt-0.5 text-[11px] text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                                                onClick={ () => processAction('open_group_info') }
                                            >
                                                <Shield className="w-3 h-3" />
                                                { LocalizeText('navigator.guildbase', [ 'groupName' ], [ room.groupName ]) }
                                            </button>
                                        ) }
                                    </div>
                                </div>
                            </FramePanel>

                            {/* Panel 2: Link (Expandable) */}
                            { showLink && (
                                <FramePanel>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={ roomLink }
                                            className="h-7 text-xs font-mono bg-muted/30"
                                            onClick={ e => (e.target as HTMLInputElement).select() }
                                        />
                                        <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={ handleCopyLink }>
                                            { linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" /> }
                                        </Button>
                                    </div>
                                </FramePanel>
                            ) }

                            {/* Panel 3: Actions */}
                            <FramePanel>
                                <div className="flex flex-col gap-0.5">
                                    { hasPermission('staff_pick') && (
                                        <Button variant="ghost" size="sm" className="w-full justify-center h-8 text-xs" onClick={ () => processAction('toggle_pick') }>
                                            <Star className={ `w-3.5 h-3.5 mr-1.5 ${ isRoomPicked ? 'text-amber-400 fill-amber-400' : '' }` } />
                                            { isRoomPicked ? 'Staff-Pick entfernen' : 'Als Staff-Pick markieren' }
                                        </Button>
                                    ) }
                                    <Button variant="ghost" size="sm" className="w-full justify-center h-8 text-xs text-destructive hover:text-destructive" onClick={ () => processAction('report_room') }>
                                        <Flag className="w-3.5 h-3.5 mr-1.5" />
                                        Diesen Raum melden
                                    </Button>
                                    { hasPermission('settings') && (
                                        <>
                                            <Button variant="ghost" size="sm" className="w-full justify-center h-8 text-xs" onClick={ () => processAction('toggle_mute') }>
                                                { isRoomMuted
                                                    ? <><Volume2 className="w-3.5 h-3.5 mr-1.5" />Stummschaltung aufheben</>
                                                    : <><VolumeX className="w-3.5 h-3.5 mr-1.5" />Alle stumm schalten</>
                                                }
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full justify-center h-8 text-xs" onClick={ () => processAction('room_filter') }>
                                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                                Raumfilter
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full justify-center h-8 text-xs" onClick={ () => processAction('open_floorplan_editor') }>
                                                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                                                Open Floor Plan Editor
                                            </Button>
                                        </>
                                    ) }
                                </div>
                            </FramePanel>

                            {/* Panel 4: Room Stats */}
                            <FramePanel>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-[11px] text-muted-foreground">
                                            { room.userCount }/{ room.maxUsers } Besucher
                                        </span>
                                    </div>
                                    <Badge
                                        variant={ room.userCount >= room.maxUsers * 0.9 ? 'destructive-light' : room.userCount >= room.maxUsers * 0.5 ? 'warning-light' : 'success-light' }
                                        size="xs"
                                    >
                                        { room.userCount <= 0 ? 'Leer' : room.userCount >= room.maxUsers ? 'Voll' : 'Offen' }
                                    </Badge>
                                </div>
                                <ActivityBar userCount={ room.userCount } maxUsers={ room.maxUsers } />
                            </FramePanel>
                        </Frame>
                    </div>
                </div>
            </DraggableWindow>
        </TooltipProvider>
    );
};
