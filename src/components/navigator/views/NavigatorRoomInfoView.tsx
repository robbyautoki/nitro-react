import { GetCustomRoomFilterMessageComposer, NavigatorSearchComposer, RoomBannedUsersComposer, RoomDataParser, RoomMuteComposer, RoomSettingsComposer, RoomSettingsDataEvent, SaveRoomSettingsComposer, SecurityLevel, ToggleStaffPickMessageComposer, UpdateHomeRoomMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetGroupInformation, GetSessionDataManager, IRoomData, LocalizeText, ReportType, SendMessageComposer } from '../../../api';
import { DraggableWindow, DraggableWindowPosition, LayoutRoomThumbnailView, UserProfileIconView } from '../../../common';
import { RoomWidgetThumbnailEvent } from '../../../events';
import { useHelp, useMessageEvent, useNavigator } from '../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { cn } from '@/align-ui/utils/cn';
import { Home, Star, Settings, Link2, Camera, Users, Copy, Check, MessageCircle, Flag, VolumeX, Volume2, Filter, LayoutGrid, Shield, ArrowLeft, X } from 'lucide-react';
import { NavigatorPanel, NavigatorPanelStack, NavigatorScrollViewport, NavigatorTabButton, NavigatorTextInput } from './NavigatorPrimitives';
import { NavigatorRoomSettingsBasicTabView } from './room-settings/NavigatorRoomSettingsBasicTabView';
import { NavigatorRoomSettingsAccessTabView } from './room-settings/NavigatorRoomSettingsAccessTabView';
import { NavigatorRoomSettingsRightsTabView } from './room-settings/NavigatorRoomSettingsRightsTabView';
import { NavigatorRoomSettingsVipChatTabView } from './room-settings/NavigatorRoomSettingsVipChatTabView';
import { NavigatorRoomSettingsModTabView } from './room-settings/NavigatorRoomSettingsModTabView';

export class NavigatorRoomInfoViewProps
{
    onCloseClick: () => void;
    openSettingsRequest?: number;
}

type SettingsTabId = 'basic' | 'access' | 'rights' | 'chat' | 'mod';

function ActivityBar({ userCount, maxUsers }: { userCount: number; maxUsers: number })
{
    const pct = maxUsers > 0 ? Math.min(100, Math.round((userCount / maxUsers) * 100)) : 0;
    let barColor = 'bg-success-base';
    if(pct >= 90) barColor = 'bg-error-base';
    else if(pct >= 50) barColor = 'bg-warning-base';
    else if(userCount <= 0) barColor = 'bg-bg-soft-200';

    return (
        <div className="flex items-center gap-1.5 w-full">
            <MessageCircle className="size-3 shrink-0 text-text-soft-400" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-weak-50">
                <div className={ `h-full rounded-full transition-all ${ barColor }` } style={ { width: `${ Math.max(pct, 2) }%` } } />
            </div>
        </div>
    );
}

export const NavigatorRoomInfoView: FC<NavigatorRoomInfoViewProps> = props =>
{
    const { onCloseClick = null, openSettingsRequest = 0 } = props;
    const [ view, setView ] = useState<'info' | 'settings'>('info');
    const [ isRoomPicked, setIsRoomPicked ] = useState(false);
    const [ isRoomMuted, setIsRoomMuted ] = useState(false);
    const [ showLink, setShowLink ] = useState(false);
    const [ linkCopied, setLinkCopied ] = useState(false);
    const [ settingsTab, setSettingsTab ] = useState<SettingsTabId>('basic');
    const [ roomSettingsData, setRoomSettingsData ] = useState<IRoomData>(null);
    const handledOpenSettingsRequest = useRef(0);
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

    // Room Settings Data Event
    useMessageEvent<RoomSettingsDataEvent>(RoomSettingsDataEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        const data = parser.data;

        setRoomSettingsData({
            roomId: data.roomId,
            roomName: data.name,
            roomDescription: data.description,
            categoryId: data.categoryId,
            userCount: data.maximumVisitorsLimit,
            tags: data.tags,
            tradeState: data.tradeMode,
            allowWalkthrough: data.allowWalkThrough,
            lockState: data.doorMode,
            password: null,
            allowPets: data.allowPets,
            allowPetsEat: data.allowFoodConsume,
            hideWalls: data.hideWalls,
            wallThickness: data.wallThickness,
            floorThickness: data.floorThickness,
            chatSettings: {
                mode: data.chatSettings.mode,
                weight: data.chatSettings.weight,
                speed: data.chatSettings.speed,
                distance: data.chatSettings.distance,
                protection: data.chatSettings.protection
            },
            moderationSettings: {
                allowMute: data.roomModerationSettings.allowMute,
                allowKick: data.roomModerationSettings.allowKick,
                allowBan: data.roomModerationSettings.allowBan
            }
        });

        SendMessageComposer(new RoomBannedUsersComposer(data.roomId));
    });

    useEffect(() =>
    {
        if(!openSettingsRequest || (openSettingsRequest === handledOpenSettingsRequest.current)) return;
        if(!navigatorData?.enteredGuestRoom) return;

        handledOpenSettingsRequest.current = openSettingsRequest;
        setSettingsTab('basic');
        setView('settings');
        SendMessageComposer(new RoomSettingsComposer(navigatorData.enteredGuestRoom.roomId));
    }, [ openSettingsRequest, navigatorData ]);

    const handleSettingsChange = useCallback((field: string, value: string | number | boolean | string[]) =>
    {
        setRoomSettingsData(prevValue =>
        {
            if(!prevValue) return prevValue;

            const newValue = { ...prevValue };

            switch(field)
            {
                case 'name': newValue.roomName = String(value); break;
                case 'description': newValue.roomDescription = String(value); break;
                case 'category': newValue.categoryId = Number(value); break;
                case 'max_visitors': newValue.userCount = Number(value); break;
                case 'trade_state': newValue.tradeState = Number(value); break;
                case 'tags': newValue.tags = value as Array<string>; break;
                case 'allow_walkthrough': newValue.allowWalkthrough = Boolean(value); break;
                case 'allow_pets': newValue.allowPets = Boolean(value); break;
                case 'allow_pets_eat': newValue.allowPetsEat = Boolean(value); break;
                case 'hide_walls': newValue.hideWalls = Boolean(value); break;
                case 'wall_thickness': newValue.wallThickness = Number(value); break;
                case 'floor_thickness': newValue.floorThickness = Number(value); break;
                case 'lock_state': newValue.lockState = Number(value); break;
                case 'password':
                    newValue.lockState = RoomDataParser.PASSWORD_STATE;
                    newValue.password = String(value);
                    break;
                case 'moderation_mute': newValue.moderationSettings.allowMute = Number(value); break;
                case 'moderation_kick': newValue.moderationSettings.allowKick = Number(value); break;
                case 'moderation_ban': newValue.moderationSettings.allowBan = Number(value); break;
                case 'bubble_mode': newValue.chatSettings.mode = Number(value); break;
                case 'chat_weight': newValue.chatSettings.weight = Number(value); break;
                case 'bubble_speed': newValue.chatSettings.speed = Number(value); break;
                case 'flood_protection': newValue.chatSettings.protection = Number(value); break;
                case 'chat_distance': newValue.chatSettings.distance = Number(value); break;
            }

            SendMessageComposer(
                new SaveRoomSettingsComposer(
                    newValue.roomId, newValue.roomName, newValue.roomDescription,
                    newValue.lockState, newValue.password, newValue.userCount,
                    newValue.categoryId, newValue.tags.length, newValue.tags,
                    newValue.tradeState, newValue.allowPets, newValue.allowPetsEat,
                    newValue.allowWalkthrough, newValue.hideWalls, newValue.wallThickness,
                    newValue.floorThickness, newValue.moderationSettings.allowMute,
                    newValue.moderationSettings.allowKick, newValue.moderationSettings.allowBan,
                    newValue.chatSettings.mode, newValue.chatSettings.weight,
                    newValue.chatSettings.speed, newValue.chatSettings.distance,
                    newValue.chatSettings.protection
                ));

            return newValue;
        });
    }, []);

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
                setSettingsTab('basic');
                setView('settings');
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
                setView('info');
                setSettingsTab('basic');
                setRoomSettingsData(null);
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

    const handleSettingsClose = useCallback(() =>
    {
        setView('info');
        setSettingsTab('basic');
        setRoomSettingsData(null);
    }, []);

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
    const occupancyColor: 'red' | 'orange' | 'gray' | 'green' = room.userCount >= room.maxUsers * 0.9 ? 'red' : room.userCount >= room.maxUsers * 0.5 ? 'orange' : room.userCount <= 0 ? 'gray' : 'green';
    const settingsTabs: { id: SettingsTabId; label: string }[] = [
        { id: 'basic', label: 'Allgemein' },
        { id: 'access', label: 'Zugang' },
        { id: 'rights', label: 'Rechte' },
        { id: 'chat', label: 'Chat & VIP' },
        { id: 'mod', label: 'Moderation' },
    ];

    return (
        <AlignTooltip.Provider delayDuration={ 200 }>
            <DraggableWindow uniqueKey="room-info" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
                <AlignSurface.Panel className={ cn('nitro-room-info flex flex-col overflow-hidden', view === 'settings' && 'nitro-room-info--settings') }>
                    <div className="drag-handler flex shrink-0 cursor-grab select-none items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0 px-3 py-2 active:cursor-grabbing">
                        <span className="text-label-sm text-text-strong-950">
                            { view === 'info' ? 'Rauminformationen' : 'Raumeinstellungen' }
                        </span>
                        <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => processAction('close') }>
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    </div>
                    <NavigatorScrollViewport className="max-h-[500px] p-2.5">
                        { view === 'info' ? (
                            <NavigatorPanelStack>
                                <NavigatorPanel>
                                    <div className="flex gap-3">
                                        <div className="relative shrink-0">
                                            <div className="h-[110px] w-[110px] overflow-hidden rounded-lg border border-stroke-soft-200">
                                                <LayoutRoomThumbnailView roomId={ room.roomId } customUrl={ room.officialRoomPicRef }>
                                                    { hasPermission('settings') && (
                                                        <AlignTooltip.Root>
                                                            <AlignTooltip.Trigger asChild>
                                                                <AlignButton.Root
                                                                    type="button"
                                                                    variant="neutral"
                                                                    mode="lighter"
                                                                    size="xxsmall"
                                                                    className="absolute left-1.5 top-1.5 size-6 p-0 bg-bg-white-0/90"
                                                                    onClick={ () => processAction('open_room_thumbnail_camera') }
                                                                >
                                                                    <AlignButton.Icon as={ Camera } className="size-3" />
                                                                </AlignButton.Root>
                                                            </AlignTooltip.Trigger>
                                                            <AlignTooltip.Content side="bottom" size="xsmall">Thumbnail ändern</AlignTooltip.Content>
                                                        </AlignTooltip.Root>
                                                    ) }
                                                </LayoutRoomThumbnailView>
                                            </div>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <AlignTooltip.Root>
                                                        <AlignTooltip.Trigger asChild>
                                                            <button type="button" onClick={ () => processAction('set_home_room') } className="shrink-0">
                                                                <Home className={ cn('size-3.5 transition-colors', isHome ? 'fill-warning-base text-warning-base' : 'text-text-soft-400 hover:text-text-sub-600') } />
                                                            </button>
                                                        </AlignTooltip.Trigger>
                                                        <AlignTooltip.Content side="bottom" size="xsmall">
                                                            { isHome ? 'Heimraum entfernen' : 'Als Heimraum setzen' }
                                                        </AlignTooltip.Content>
                                                    </AlignTooltip.Root>
                                                    <span className="truncate text-label-sm text-text-strong-950">{ room.roomName }</span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    { hasPermission('settings') && (
                                                        <AlignTooltip.Root>
                                                            <AlignTooltip.Trigger asChild>
                                                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => processAction('open_room_settings') }>
                                                                    <AlignButton.Icon as={ Settings } className="size-3.5" />
                                                                </AlignButton.Root>
                                                            </AlignTooltip.Trigger>
                                                            <AlignTooltip.Content side="bottom" size="xsmall">Raumeinstellungen</AlignTooltip.Content>
                                                        </AlignTooltip.Root>
                                                    ) }
                                                    <AlignTooltip.Root>
                                                        <AlignTooltip.Trigger asChild>
                                                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setShowLink(prev => !prev) }>
                                                                <AlignButton.Icon as={ Link2 } className="size-3.5" />
                                                            </AlignButton.Root>
                                                        </AlignTooltip.Trigger>
                                                        <AlignTooltip.Content side="bottom" size="xsmall">Raum-Link</AlignTooltip.Content>
                                                    </AlignTooltip.Root>
                                                </div>
                                            </div>
                                            { room.showOwner && (
                                                <div className="flex items-center gap-1 text-subheading-2xs">
                                                    <span className="text-text-sub-600">Besitzer:</span>
                                                    <UserProfileIconView userId={ room.ownerId } />
                                                    <span className="font-medium text-text-strong-950">{ room.ownerName }</span>
                                                </div>
                                            ) }
                                            <div className="flex items-center gap-1 text-subheading-2xs">
                                                <span className="text-text-sub-600">Bewertung:</span>
                                                <Star className="size-3 fill-warning-base text-warning-base" />
                                                <span className="font-medium text-text-strong-950">{ navigatorData.currentRoomRating }</span>
                                            </div>
                                            { room.tags.length > 0 && (
                                                <div className="mt-0.5 flex flex-wrap gap-1">
                                                    { room.tags.map(tag => (
                                                        <AlignBadge.Root key={ tag } color="gray" variant="stroke" size="small" className="cursor-pointer text-[10px]" onClick={ () => processAction('navigator_search_tag', tag) }>
                                                            #{ tag }
                                                        </AlignBadge.Root>
                                                    )) }
                                                </div>
                                            ) }
                                            { room.description && (
                                                <NavigatorScrollViewport className="mt-0.5 max-h-[40px]">
                                                    <p className="text-paragraph-xs leading-relaxed text-text-sub-600">{ room.description }</p>
                                                </NavigatorScrollViewport>
                                            ) }
                                            { room.habboGroupId > 0 && (
                                                <button
                                                    type="button"
                                                    className="mt-0.5 flex items-center gap-1 text-subheading-2xs text-primary-base transition-colors hover:text-primary-darker hover:underline"
                                                    onClick={ () => processAction('open_group_info') }
                                                >
                                                    <Shield className="size-3" />
                                                    { LocalizeText('navigator.guildbase', [ 'groupName' ], [ room.groupName ]) }
                                                </button>
                                            ) }
                                        </div>
                                    </div>
                                </NavigatorPanel>
                                { showLink && (
                                    <NavigatorPanel>
                                        <div className="flex items-center gap-2">
                                            <NavigatorTextInput readOnly value={ roomLink } rootClassName="flex-1" className="font-mono" onClick={ e => (e.target as HTMLInputElement).select() } />
                                            <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xsmall" className="size-8 shrink-0 p-0" onClick={ handleCopyLink }>
                                                <AlignButton.Icon as={ linkCopied ? Check : Copy } className={ cn('size-3.5', linkCopied && 'text-success-base') } />
                                            </AlignButton.Root>
                                        </div>
                                    </NavigatorPanel>
                                ) }
                                <NavigatorPanel>
                                    <div className="flex flex-col gap-1">
                                        { hasPermission('staff_pick') && (
                                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full justify-center" onClick={ () => processAction('toggle_pick') }>
                                                <AlignButton.Icon as={ Star } className={ cn('size-3.5', isRoomPicked && 'fill-warning-base text-warning-base') } />
                                                { isRoomPicked ? 'Staff-Pick entfernen' : 'Als Staff-Pick markieren' }
                                            </AlignButton.Root>
                                        ) }
                                        <AlignButton.Root type="button" variant="error" mode="ghost" size="xsmall" className="w-full justify-center" onClick={ () => processAction('report_room') }>
                                            <AlignButton.Icon as={ Flag } className="size-3.5" />
                                            Diesen Raum melden
                                        </AlignButton.Root>
                                        { hasPermission('settings') && (
                                            <>
                                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full justify-center" onClick={ () => processAction('toggle_mute') }>
                                                    { isRoomMuted
                                                        ? <><AlignButton.Icon as={ Volume2 } className="size-3.5" />Stummschaltung aufheben</>
                                                        : <><AlignButton.Icon as={ VolumeX } className="size-3.5" />Alle stumm schalten</>
                                                    }
                                                </AlignButton.Root>
                                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full justify-center" onClick={ () => processAction('room_filter') }>
                                                    <AlignButton.Icon as={ Filter } className="size-3.5" />
                                                    Raumfilter
                                                </AlignButton.Root>
                                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full justify-center" onClick={ () => processAction('open_floorplan_editor') }>
                                                    <AlignButton.Icon as={ LayoutGrid } className="size-3.5" />
                                                    Open Floor Plan Editor
                                                </AlignButton.Root>
                                            </>
                                        ) }
                                    </div>
                                </NavigatorPanel>
                                <NavigatorPanel className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="size-3.5 text-text-sub-600" />
                                            <span className="text-subheading-2xs text-text-sub-600">
                                                { room.userCount }/{ room.maxUsers } Besucher
                                            </span>
                                        </div>
                                        <AlignBadge.Root color={ occupancyColor } variant="light" size="small">
                                            { room.userCount <= 0 ? 'Leer' : room.userCount >= room.maxUsers ? 'Voll' : 'Offen' }
                                        </AlignBadge.Root>
                                    </div>
                                    <ActivityBar userCount={ room.userCount } maxUsers={ room.maxUsers } />
                                </NavigatorPanel>
                            </NavigatorPanelStack>
                        ) : (
                            <div className="flex w-full flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setView('info') }>
                                        <AlignButton.Icon as={ ArrowLeft } className="size-4" />
                                    </AlignButton.Root>
                                    <span className="text-label-sm text-text-strong-950">Raumeinstellungen</span>
                                </div>
                                { roomSettingsData ? (
                                    <div className="w-full">
                                        <NavigatorPanel className="mb-2 p-1.5">
                                            <div className="flex w-full gap-1 overflow-x-auto">
                                                { settingsTabs.map(tab => (
                                                    <NavigatorTabButton key={ tab.id } active={ settingsTab === tab.id } onClick={ () => setSettingsTab(tab.id) }>
                                                        { tab.label }
                                                    </NavigatorTabButton>
                                                )) }
                                            </div>
                                        </NavigatorPanel>
                                        { settingsTab === 'basic' && <NavigatorRoomSettingsBasicTabView roomData={ roomSettingsData } handleChange={ handleSettingsChange } onClose={ handleSettingsClose } /> }
                                        { settingsTab === 'access' && <NavigatorRoomSettingsAccessTabView roomData={ roomSettingsData } handleChange={ handleSettingsChange } /> }
                                        { settingsTab === 'rights' && <NavigatorRoomSettingsRightsTabView roomData={ roomSettingsData } handleChange={ handleSettingsChange } /> }
                                        { settingsTab === 'chat' && <NavigatorRoomSettingsVipChatTabView roomData={ roomSettingsData } handleChange={ handleSettingsChange } /> }
                                        { settingsTab === 'mod' && <NavigatorRoomSettingsModTabView roomData={ roomSettingsData } handleChange={ handleSettingsChange } /> }
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="text-paragraph-xs text-text-sub-600">Lade Einstellungen...</span>
                                    </div>
                                ) }
                            </div>
                        ) }
                    </NavigatorScrollViewport>
                </AlignSurface.Panel>
            </DraggableWindow>
        </AlignTooltip.Provider>
    );
};
