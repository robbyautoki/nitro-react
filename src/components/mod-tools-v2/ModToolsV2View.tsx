import {
    CallForHelpTopicData,
    ChatRecordData,
    CfhChatlogData,
    CfhChatlogEvent,
    CloseIssuesMessageComposer,
    DefaultSanctionMessageComposer,
    FriendlyTime,
    GetCfhChatlogMessageComposer,
    GetModeratorRoomInfoMessageComposer,
    GetModeratorUserInfoMessageComposer,
    GetRoomChatlogMessageComposer,
    GetRoomVisitsMessageComposer,
    GetUserChatlogMessageComposer,
    IssueMessageData,
    ModAlertMessageComposer,
    ModBanMessageComposer,
    ModerateRoomMessageComposer,
    ModeratorActionMessageComposer,
    ModeratorRoomInfoEvent,
    ModeratorUserInfoData,
    ModeratorUserInfoEvent,
    ModKickMessageComposer,
    ModMessageMessageComposer,
    ModMuteMessageComposer,
    ModTradingLockMessageComposer,
    PickIssuesMessageComposer,
    ReleaseIssuesMessageComposer,
    RoomChatlogEvent,
    RoomVisitsData,
    RoomVisitsEvent,
    UserChatlogEvent,
} from '@nitrots/nitro-renderer';
import { ComponentProps, ElementType, FC, HTMLAttributes, ReactNode, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetIssueCategoryName, GetSessionDataManager, ISelectedUser, LocalizeText, ModActionDefinition, NotificationAlertType, SendMessageComposer, TryVisitRoom } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { useMessageEvent, useModTools, useNotification } from '../../hooks';

import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignSelect from '@/align-ui/components/ui/select';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import { cn } from '@/align-ui/utils/cn';
import {
    AlertTriangle,
    Ban,
    ChevronRight,
    CircleDot,
    Clock,
    Eye,
    FileText,
    Gavel,
    Home,
    MessageSquare,
    Send,
    Shield,
    Users,
    X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface ModToolsV2ViewProps
{
    currentRoomId: number;
    selectedUser: ISelectedUser | null;
    onClose: () => void;
}

type ActivePanel = 'room' | 'chatlog' | 'user' | 'tickets' | null;
type ToolButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'success';
type ToolButtonProps = Omit<ComponentProps<typeof AlignButton.Root>, 'variant' | 'mode' | 'size'> & {
    variant?: ToolButtonVariant;
    size?: 'sm';
};

const BUTTON_VARIANTS: Record<ToolButtonVariant, Pick<ComponentProps<typeof AlignButton.Root>, 'variant' | 'mode'> & { className?: string }> = {
    default: { variant: 'primary', mode: 'filled' },
    outline: { variant: 'neutral', mode: 'stroke' },
    ghost: { variant: 'neutral', mode: 'ghost' },
    destructive: { variant: 'error', mode: 'filled' },
    secondary: { variant: 'neutral', mode: 'lighter' },
    success: {
        variant: 'neutral',
        mode: 'filled',
        className: 'bg-success-base text-static-white hover:bg-success-dark focus-visible:shadow-button-primary-focus'
    }
};

function Button({ variant = 'default', size = 'sm', className, type = 'button', ...props }: ToolButtonProps)
{
    const settings = BUTTON_VARIANTS[variant];

    return (
        <AlignButton.Root
            type={ type }
            variant={ settings.variant }
            mode={ settings.mode }
            size={ size === 'sm' ? 'xxsmall' : 'small' }
            className={ cn(settings.className, className) }
            { ...props }
        />
    );
}

function ToolPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return (
        <AlignSurface.Panel
            className={ cn('overflow-hidden rounded-xl', className) }
            { ...props }
        />
    );
}

function ScrollPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return (
        <div
            className={ cn('overflow-y-auto overscroll-contain', className) }
            { ...props }
        />
    );
}

// ═══════════════════════════════════════════════════
// MOD ACTION DEFINITIONS
// ═══════════════════════════════════════════════════

const MOD_ACTION_DEFINITIONS = [
    new ModActionDefinition(1, 'Alert', ModActionDefinition.ALERT, 1, 0),
    new ModActionDefinition(2, 'Mute 1h', ModActionDefinition.MUTE, 2, 0),
    new ModActionDefinition(3, 'Ban 18h', ModActionDefinition.BAN, 3, 0),
    new ModActionDefinition(4, 'Ban 7 Tage', ModActionDefinition.BAN, 4, 0),
    new ModActionDefinition(5, 'Ban 30 Tage (1)', ModActionDefinition.BAN, 5, 0),
    new ModActionDefinition(7, 'Ban 30 Tage (2)', ModActionDefinition.BAN, 7, 0),
    new ModActionDefinition(6, 'Ban 100 Jahre', ModActionDefinition.BAN, 6, 0),
    new ModActionDefinition(106, 'Ban Avatar 100J', ModActionDefinition.BAN, 6, 0),
    new ModActionDefinition(101, 'Kick', ModActionDefinition.KICK, 0, 0),
    new ModActionDefinition(102, 'Trade-Sperre 1W', ModActionDefinition.TRADE_LOCK, 0, 168),
    new ModActionDefinition(104, 'Trade-Sperre perm.', ModActionDefinition.TRADE_LOCK, 0, 876000),
    new ModActionDefinition(105, 'Nachricht', ModActionDefinition.MESSAGE, 0, 0),
];

// ═══════════════════════════════════════════════════
// PANEL HEADER
// ═══════════════════════════════════════════════════

function PanelHeader({ icon: Icon, title, right }: { icon: ElementType; title: ReactNode; right?: ReactNode })
{
    return (
        <div className="flex items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0 px-3.5 py-2">
            <span className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong-950">
                <Icon className="size-3.5 text-text-soft-400" /> { title }
            </span>
            { right }
        </div>
    );
}

// ═══════════════════════════════════════════════════
// ROOM TOOL PANEL
// ═══════════════════════════════════════════════════

const RoomToolPanel: FC<{ roomId: number }> = ({ roomId }) =>
{
    const [ name, setName ] = useState<string>(null);
    const [ ownerName, setOwnerName ] = useState<string>(null);
    const [ ownerInRoom, setOwnerInRoom ] = useState(false);
    const [ usersInRoom, setUsersInRoom ] = useState(0);
    const [ kickUsers, setKickUsers ] = useState(false);
    const [ lockRoom, setLockRoom ] = useState(false);
    const [ changeRoomName, setChangeRoomName ] = useState(false);
    const [ message, setMessage ] = useState('');

    useMessageEvent<ModeratorRoomInfoEvent>(ModeratorRoomInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!parser || parser.data.flatId !== roomId) return;

        setName(parser.data.room.name);
        setOwnerName(parser.data.ownerName);
        setOwnerInRoom(parser.data.ownerInRoom);
        setUsersInRoom(parser.data.userCount);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetModeratorRoomInfoMessageComposer(roomId));
    }, [ roomId ]);

    const handleAction = (action: 'warn' | 'alert') =>
    {
        if(message.trim().length === 0) return;

        const actionType = action === 'warn'
            ? ModeratorActionMessageComposer.ACTION_MESSAGE
            : ModeratorActionMessageComposer.ACTION_ALERT;

        SendMessageComposer(new ModeratorActionMessageComposer(actionType, message, ''));
        SendMessageComposer(new ModerateRoomMessageComposer(roomId, lockRoom ? 1 : 0, changeRoomName ? 1 : 0, kickUsers ? 1 : 0));
    };

    return (
        <ToolPanel>
            <PanelHeader icon={ Home } title={ `Room Info: ${ name || '...' }` } />
            <div className="space-y-2.5 px-3.5 py-2.5">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div className="space-y-1">
                        { ([
                            [ 'Raumbesitzer', ownerName || '...', true ],
                            [ 'User im Raum', String(usersInRoom), false ],
                            [ 'Besitzer anwesend', ownerInRoom ? 'Ja' : 'Nein', false ],
                        ] as const).map(([ label, val, isLink ]) => (
                            <div key={ label } className="flex justify-between text-paragraph-xs">
                                <span className="text-text-sub-600">{ label }</span>
                                <span className={ cn('font-medium text-text-strong-950', isLink && 'cursor-pointer text-primary-base hover:underline') }>{ val }</span>
                            </div>
                        )) }
                    </div>
                    <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={ () => TryVisitRoom(roomId) }>
                            <Eye className="size-3" />Besuchen
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={ () => CreateLinkEvent(`mod-tools/toggle-room-chatlog/${ roomId }`) }>
                            <MessageSquare className="size-3" />Chatlog
                        </Button>
                    </div>
                </div>
                <div className="space-y-1.5 rounded-lg bg-bg-weak-50 p-2 ring-1 ring-inset ring-stroke-soft-200">
                    { ([
                        [ kickUsers, setKickUsers, 'kick', 'Alle User kicken' ],
                        [ lockRoom, setLockRoom, 'lock', 'Türklingel aktivieren' ],
                        [ changeRoomName, setChangeRoomName, 'name', 'Raumname ändern' ],
                    ] as const).map(([ val, setter, id, label ]) => (
                        <div key={ id } className="flex items-center gap-2">
                            <AlignCheckbox.Root id={ id } checked={ val as boolean } onCheckedChange={ v => (setter as (v: boolean) => void)(!!v) } />
                            <label htmlFor={ id } className="cursor-pointer text-paragraph-xs text-text-strong-950">{ label }</label>
                        </div>
                    )) }
                </div>
                <AlignTextarea.Root simple placeholder="Nachricht an die User im Raum..." value={ message } onChange={ e => setMessage(e.target.value) } className="min-h-[50px] text-paragraph-xs" />
                <div className="flex gap-1.5">
                    <Button size="sm" variant="destructive" className="h-7 gap-1 text-[11px]" onClick={ () => handleAction('warn') }>
                        <AlertTriangle className="size-3" />Verwarnung
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={ () => handleAction('alert') }>
                        <Send className="size-3" />Nur Hinweis
                    </Button>
                </div>
            </div>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// CHATLOG PANEL
// ═══════════════════════════════════════════════════

const ChatlogPanel: FC<{ roomId: number }> = ({ roomId }) =>
{
    const [ roomChatlog, setRoomChatlog ] = useState<ChatRecordData>(null);
    const { openRoomInfo } = useModTools();

    useMessageEvent<RoomChatlogEvent>(RoomChatlogEvent, event =>
    {
        const parser = event.getParser();
        if(!parser || parser.data.roomId !== roomId) return;
        setRoomChatlog(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomChatlogMessageComposer(roomId));
    }, [ roomId ]);

    const entries = useMemo(() =>
    {
        if(!roomChatlog) return [];
        return roomChatlog.chatlog.map(c => ({
            time: c.timestamp,
            user: c.userName,
            userId: c.userId,
            message: c.message,
            highlighted: c.hasHighlighting,
        }));
    }, [ roomChatlog ]);

    return (
        <ToolPanel>
            <PanelHeader icon={ MessageSquare } title={ `Chatlog: ${ roomChatlog?.roomName || '...' }` } right={
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px]" onClick={ () => TryVisitRoom(roomId) }>
                        <Eye className="size-2.5" />Besuchen
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px]" onClick={ () => openRoomInfo(roomId) }>
                        <Shield className="size-2.5" />Room Tools
                    </Button>
                </div>
            } />
            <ScrollPanel className="h-[240px]">
                <div className="grid grid-cols-[56px_70px_1fr] border-b border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-1 text-[11px] font-semibold text-text-sub-600">
                    <span>Zeit</span><span>User</span><span>Nachricht</span>
                </div>
                { entries.map((e, i) => (
                    <div key={ i } className={ cn('grid grid-cols-[56px_70px_1fr] border-b border-stroke-soft-200 px-3.5 py-1 text-[11px]', e.highlighted ? 'bg-error-lighter' : i % 2 === 0 ? 'bg-bg-weak-50' : '') }>
                        <span className="tabular-nums text-text-sub-600">{ e.time }</span>
                        <span className="cursor-pointer truncate font-medium text-primary-base hover:underline" onClick={ () => CreateLinkEvent(`mod-tools/open-user-info/${ e.userId }`) }>{ e.user }</span>
                        <span className="break-all text-text-strong-950">{ e.message }</span>
                    </div>
                )) }
                { entries.length === 0 && <div className="py-4 text-center text-[11px] text-text-sub-600">Keine Chatlog-Einträge</div> }
            </ScrollPanel>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// USER TOOL PANEL
// ═══════════════════════════════════════════════════

type UserSub = 'msg' | 'action' | 'visits' | 'chatlog' | null;

const UserToolPanel: FC<{ userId: number; username: string }> = ({ userId, username }) =>
{
    const [ userInfo, setUserInfo ] = useState<ModeratorUserInfoData>(null);
    const [ sub, setSub ] = useState<UserSub>(null);
    const toggleSub = (v: UserSub) => setSub(p => p === v ? null : v);

    useMessageEvent<ModeratorUserInfoEvent>(ModeratorUserInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!parser || parser.data.userId !== userId) return;
        setUserInfo(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetModeratorUserInfoMessageComposer(userId));
    }, [ userId ]);

    const userProps: [string, string][] = useMemo(() =>
    {
        if(!userInfo) return [ [ 'Username', username ] ];

        return [
            [ 'Username', userInfo.userName ],
            [ 'CFH Meldungen', String(userInfo.cfhCount) ],
            [ 'Missbr. CFH', String(userInfo.abusiveCfhCount) ],
            [ 'Verwarnungen', String(userInfo.cautionCount) ],
            [ 'Bans', String(userInfo.banCount) ],
            [ 'Letzte Sanktion', userInfo.lastSanctionTime || '-' ],
            [ 'Trade-Sperren', String(userInfo.tradingLockCount) ],
            [ 'Trade-Ablauf', userInfo.tradingExpiryDate || '-' ],
            [ 'Letzter Login', FriendlyTime.format(userInfo.minutesSinceLastLogin * 60, '.ago', 2) ],
            [ 'Letzter Kauf', userInfo.lastPurchaseDate || '-' ],
            [ 'E-Mail', userInfo.primaryEmailAddress || '-' ],
            [ 'IP-Bans', String(userInfo.identityRelatedBanCount) ],
            [ 'Registriert', FriendlyTime.format(userInfo.registrationAgeInMinutes * 60, '.ago', 2) ],
            [ 'Klassifizierung', userInfo.userClassification || '-' ],
        ];
    }, [ userInfo, username ]);

    return (
        <div className="space-y-2">
            <ToolPanel>
                <PanelHeader icon={ Users } title={ `User: ${ userInfo?.userName || username }` } right={
                    userInfo ? (
                        userInfo.online
                            ? <AlignBadge.Root variant="filled" color="green" size="small" className="h-5 text-[10px]">Online</AlignBadge.Root>
                            : <AlignBadge.Root variant="light" color="gray" size="small" className="h-5 text-[10px]">Offline</AlignBadge.Root>
                    ) : null
                } />
                <div className="grid grid-cols-[1fr_auto]">
                    <div>
                        { userProps.map(([ label, val ], i) => (
                            <div key={ label } className={ cn('flex justify-between px-3.5 py-0.5 text-[11px]', i % 2 === 0 && 'bg-bg-weak-50') }>
                                <span className="text-text-sub-600">{ label }</span>
                                <span className="font-medium tabular-nums text-text-strong-950">
                                    { val }
                                    { label === 'Username' && userInfo?.online && <span className="ml-1 inline-block size-1.5 rounded-full bg-success-base" /> }
                                </span>
                            </div>
                        )) }
                    </div>
                    <div className="flex flex-col gap-1 border-l border-stroke-soft-200 p-2">
                        <Button size="sm" variant={ sub === 'chatlog' ? 'default' : 'outline' } className="h-6 justify-start gap-1 px-2 text-[10px]" onClick={ () => toggleSub('chatlog') }>
                            <MessageSquare className="size-2.5" />Room Chat
                        </Button>
                        <Button size="sm" variant={ sub === 'msg' ? 'default' : 'outline' } className="h-6 justify-start gap-1 px-2 text-[10px]" onClick={ () => toggleSub('msg') }>
                            <Send className="size-2.5" />Nachricht
                        </Button>
                        <Button size="sm" variant={ sub === 'visits' ? 'default' : 'outline' } className="h-6 justify-start gap-1 px-2 text-[10px]" onClick={ () => toggleSub('visits') }>
                            <Clock className="size-2.5" />Besuche
                        </Button>
                        <Button size="sm" variant={ sub === 'action' ? 'default' : 'outline' } className="h-6 justify-start gap-1 px-2 text-[10px]" onClick={ () => toggleSub('action') }>
                            <Gavel className="size-2.5" />Mod Action
                        </Button>
                    </div>
                </div>
            </ToolPanel>
            { sub === 'msg' && <SendMessagePanel userId={ userId } username={ userInfo?.userName || username } /> }
            { sub === 'chatlog' && <UserChatlogPanel userId={ userId } /> }
            { sub === 'visits' && <RoomVisitsPanel userId={ userId } username={ userInfo?.userName || username } /> }
            { sub === 'action' && <ModActionPanel userId={ userId } username={ userInfo?.userName || username } /> }
        </div>
    );
};

// ═══════════════════════════════════════════════════
// SEND MESSAGE SUB-PANEL
// ═══════════════════════════════════════════════════

const SendMessagePanel: FC<{ userId: number; username: string }> = ({ userId, username }) =>
{
    const [ msg, setMsg ] = useState('');
    const { simpleAlert } = useNotification();

    const sendMessage = () =>
    {
        if(msg.trim().length === 0)
        {
            simpleAlert('Bitte schreibe eine Nachricht.', null, null, null, 'Fehler', null);
            return;
        }

        SendMessageComposer(new ModMessageMessageComposer(userId, msg, -999));
        setMsg('');
    };

    return (
        <ToolPanel>
            <PanelHeader icon={ Send } title={ `Nachricht an: ${ username }` } />
            <div className="space-y-2 px-3.5 py-2.5">
                <AlignTextarea.Root simple placeholder="Nachricht eingeben..." value={ msg } onChange={ e => setMsg(e.target.value) } className="min-h-[50px] text-paragraph-xs" />
                <Button size="sm" className="h-7 w-full gap-1 text-[11px]" onClick={ sendMessage }><Send className="size-3" />Senden</Button>
            </div>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// USER CHATLOG SUB-PANEL
// ═══════════════════════════════════════════════════

const UserChatlogPanel: FC<{ userId: number }> = ({ userId }) =>
{
    const [ chatRecords, setChatRecords ] = useState<ChatRecordData[]>(null);
    const [ chatUsername, setChatUsername ] = useState<string>(null);

    useMessageEvent<UserChatlogEvent>(UserChatlogEvent, event =>
    {
        const parser = event.getParser();
        if(!parser || parser.data.userId !== userId) return;
        setChatUsername(parser.data.username);
        setChatRecords(parser.data.roomChatlogs);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetUserChatlogMessageComposer(userId));
    }, [ userId ]);

    const allEntries = useMemo(() =>
    {
        if(!chatRecords) return [];
        const results: { isRoom: boolean; roomName?: string; roomId?: number; time?: string; user?: string; userId?: number; message?: string; highlighted?: boolean }[] = [];

        chatRecords.forEach(record =>
        {
            results.push({ isRoom: true, roomName: record.roomName, roomId: record.roomId });
            record.chatlog.forEach(c =>
            {
                results.push({ isRoom: false, time: c.timestamp, user: c.userName, userId: c.userId, message: c.message, highlighted: c.hasHighlighting });
            });
        });

        return results;
    }, [ chatRecords ]);

    return (
        <ToolPanel>
            <PanelHeader icon={ MessageSquare } title={ `User Chatlog: ${ chatUsername || '...' }` } />
            <ScrollPanel className="h-[200px]">
                <div className="grid grid-cols-[56px_70px_1fr] border-b border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-1 text-[11px] font-semibold text-text-sub-600">
                    <span>Zeit</span><span>User</span><span>Nachricht</span>
                </div>
                { allEntries.map((e, i) =>
                {
                    if(e.isRoom)
                    {
                        return (
                            <div key={ `room-${ i }` } className="flex items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-1 text-[11px]">
                                <span className="font-semibold text-text-strong-950">{ e.roomName }</span>
                                <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-primary-base" onClick={ () => TryVisitRoom(e.roomId) }>Besuchen</Button>
                            </div>
                        );
                    }

                    return (
                        <div key={ `msg-${ i }` } className={ cn('grid grid-cols-[56px_70px_1fr] border-b border-stroke-soft-200 px-3.5 py-1 text-[11px]', e.highlighted && 'bg-error-lighter') }>
                            <span className="tabular-nums text-text-sub-600">{ e.time }</span>
                            <span className="cursor-pointer truncate font-medium text-primary-base hover:underline" onClick={ () => CreateLinkEvent(`mod-tools/open-user-info/${ e.userId }`) }>{ e.user }</span>
                            <span className="break-all text-text-strong-950">{ e.message }</span>
                        </div>
                    );
                }) }
                { allEntries.length === 0 && <div className="py-4 text-center text-[11px] text-text-sub-600">Keine Einträge</div> }
            </ScrollPanel>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// ROOM VISITS SUB-PANEL
// ═══════════════════════════════════════════════════

const RoomVisitsPanel: FC<{ userId: number; username: string }> = ({ userId, username }) =>
{
    const [ visitData, setVisitData ] = useState<RoomVisitsData>(null);

    useMessageEvent<RoomVisitsEvent>(RoomVisitsEvent, event =>
    {
        const parser = event.getParser();
        if(parser.data.userId !== userId) return;
        setVisitData(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomVisitsMessageComposer(userId));
    }, [ userId ]);

    const rooms = visitData?.rooms ?? [];

    return (
        <ToolPanel>
            <PanelHeader icon={ Clock } title={ `Besuche: ${ username }` } />
            <div>
                <div className="grid grid-cols-[44px_1fr_60px] border-b border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-1 text-[11px] font-semibold text-text-sub-600">
                    <span>Zeit</span><span>Raum</span><span></span>
                </div>
                { rooms.map((v, i) => (
                    <div key={ i } className={ cn('grid grid-cols-[44px_1fr_60px] items-center border-b border-stroke-soft-200 px-3.5 py-1 text-[11px]', i % 2 === 0 && 'bg-bg-weak-50') }>
                        <span className="tabular-nums text-text-sub-600">{ String(v.enterHour).padStart(2, '0') }:{ String(v.enterMinute).padStart(2, '0') }</span>
                        <span className="truncate text-text-strong-950">{ v.roomName }</span>
                        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-primary-base" onClick={ () => TryVisitRoom(v.roomId) }>Besuchen</Button>
                    </div>
                )) }
                { rooms.length === 0 && <div className="py-4 text-center text-[11px] text-text-sub-600">Keine Besuche</div> }
            </div>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// MOD ACTION SUB-PANEL
// ═══════════════════════════════════════════════════

const ModActionPanel: FC<{ userId: number; username: string }> = ({ userId, username }) =>
{
    const [ selectedTopic, setSelectedTopic ] = useState(-1);
    const [ selectedAction, setSelectedAction ] = useState(-1);
    const [ msg, setMsg ] = useState('');
    const { cfhCategories = null, settings = null } = useModTools();
    const { simpleAlert } = useNotification();

    const topics = useMemo(() =>
    {
        const values: CallForHelpTopicData[] = [];
        if(cfhCategories?.length)
        {
            for(const category of cfhCategories)
            {
                for(const topic of category.topics) values.push(topic);
            }
        }
        return values;
    }, [ cfhCategories ]);

    const sendAlert = (message: string) => simpleAlert(message, NotificationAlertType.DEFAULT, null, null, 'Fehler');

    const sendDefaultSanction = () =>
    {
        if(selectedTopic === -1) return sendAlert('Bitte wähle ein CFH-Thema');

        const category = topics[selectedTopic];
        const messageOrDefault = (msg.trim().length === 0) ? LocalizeText(`help.cfh.topic.${ category.id }`) : msg;

        SendMessageComposer(new DefaultSanctionMessageComposer(userId, selectedTopic, messageOrDefault));
    };

    const sendSanction = () =>
    {
        if(selectedTopic === -1 || selectedAction === -1) return sendAlert('Bitte wähle CFH-Thema und Sanktion');

        const category = topics[selectedTopic];
        const sanction = MOD_ACTION_DEFINITIONS[selectedAction];

        if(!settings?.cfhPermission) return sendAlert('Keine Berechtigung');
        if(!category) return sendAlert('Ungültiges CFH-Thema');
        if(!sanction) return sendAlert('Ungültige Sanktion');

        const messageOrDefault = (msg.trim().length === 0) ? LocalizeText(`help.cfh.topic.${ category.id }`) : msg;

        switch(sanction.actionType)
        {
            case ModActionDefinition.ALERT:
                if(!settings.alertPermission) return sendAlert('Keine Berechtigung');
                SendMessageComposer(new ModAlertMessageComposer(userId, messageOrDefault, category.id));
                break;
            case ModActionDefinition.MUTE:
                SendMessageComposer(new ModMuteMessageComposer(userId, messageOrDefault, category.id));
                break;
            case ModActionDefinition.BAN:
                if(!settings.banPermission) return sendAlert('Keine Berechtigung');
                SendMessageComposer(new ModBanMessageComposer(userId, messageOrDefault, category.id, selectedAction, (sanction.actionId === 106)));
                break;
            case ModActionDefinition.KICK:
                if(!settings.kickPermission) return sendAlert('Keine Berechtigung');
                SendMessageComposer(new ModKickMessageComposer(userId, messageOrDefault, category.id));
                break;
            case ModActionDefinition.TRADE_LOCK:
                SendMessageComposer(new ModTradingLockMessageComposer(userId, messageOrDefault, (sanction.actionLengthHours * 60), category.id));
                break;
            case ModActionDefinition.MESSAGE:
                if(msg.trim().length === 0) return sendAlert('Bitte schreibe eine Nachricht');
                SendMessageComposer(new ModMessageMessageComposer(userId, msg, category.id));
                break;
        }
    };

    return (
        <ToolPanel>
            <PanelHeader icon={ Gavel } title={ `Mod Action: ${ username }` } />
            <div className="space-y-2 px-3.5 py-2.5">
                <AlignSelect.Root size="xsmall" value={ selectedTopic > -1 ? String(selectedTopic) : undefined } onValueChange={ v => setSelectedTopic(Number(v)) }>
                    <AlignSelect.Trigger className="w-full text-paragraph-xs">
                        <AlignSelect.Value placeholder="CFH Thema" />
                    </AlignSelect.Trigger>
                    <AlignSelect.Content>
                        { topics.map((t, i) => <AlignSelect.Item key={ i } value={ String(i) } className="text-paragraph-xs">{ LocalizeText('help.cfh.topic.' + t.id) }</AlignSelect.Item>) }
                    </AlignSelect.Content>
                </AlignSelect.Root>
                <AlignSelect.Root size="xsmall" value={ selectedAction > -1 ? String(selectedAction) : undefined } onValueChange={ v => setSelectedAction(Number(v)) }>
                    <AlignSelect.Trigger className="w-full text-paragraph-xs">
                        <AlignSelect.Value placeholder="Sanktionstyp" />
                    </AlignSelect.Trigger>
                    <AlignSelect.Content>
                        { MOD_ACTION_DEFINITIONS.map((s, i) => <AlignSelect.Item key={ i } value={ String(i) } className="text-paragraph-xs">{ s.name }</AlignSelect.Item>) }
                    </AlignSelect.Content>
                </AlignSelect.Root>
                <div>
                    <p className="mb-1 text-[10px] text-text-sub-600">Optionale Nachricht (überschreibt Standard)</p>
                    <AlignTextarea.Root simple placeholder="Nachricht..." value={ msg } onChange={ e => setMsg(e.target.value) } className="min-h-[40px] text-paragraph-xs" />
                </div>
                <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-[11px]" onClick={ sendDefaultSanction }>
                        <Gavel className="size-3" />Default
                    </Button>
                    <Button size="sm" variant="success" className="h-7 flex-1 gap-1 text-[11px]" onClick={ sendSanction }>
                        <Ban className="size-3" />Ausführen
                    </Button>
                </div>
            </div>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// TICKETS PANEL
// ═══════════════════════════════════════════════════

const TicketsPanel: FC<{}> = () =>
{
    const [ selectedIssueId, setSelectedIssueId ] = useState<number | null>(null);
    const [ activeTab, setActiveTab ] = useState<'open' | 'my' | 'picked'>('open');
    const { tickets = [], openUserInfo } = useModTools();

    const openIssues = tickets.filter(t => t.state === IssueMessageData.STATE_OPEN);
    const myIssues = tickets.filter(t => t.state === IssueMessageData.STATE_PICKED && t.pickerUserId === GetSessionDataManager().userId);
    const pickedIssues = tickets.filter(t => t.state === IssueMessageData.STATE_PICKED);
    const ticketTabs = [
        { key: 'open' as const, label: 'Offen', count: openIssues.length },
        { key: 'my' as const, label: 'Meine', count: myIssues.length },
        { key: 'picked' as const, label: 'Aufgenommen', count: pickedIssues.length },
    ];

    const selectedTicket = tickets.find(t => t.issueId === selectedIssueId);

    if(selectedTicket) return <IssueDetailPanel ticket={ selectedTicket } onBack={ () => setSelectedIssueId(null) } onOpenUser={ openUserInfo } />;

    return (
        <ToolPanel>
            <PanelHeader icon={ AlertTriangle } title="Tickets" />
            <div className="flex w-full gap-1 border-b border-stroke-soft-200 bg-bg-white-0 px-3 py-1">
                { ticketTabs.map(tab => (
                    <Button
                        key={ tab.key }
                        size="sm"
                        variant={ activeTab === tab.key ? 'default' : 'ghost' }
                        className="h-6 gap-1 px-2 text-[11px]"
                        onClick={ () => setActiveTab(tab.key) }
                    >
                        { tab.label }
                        <AlignBadge.Root variant="light" color="gray" size="small" className="ml-0.5 h-4 px-1.5 text-[9px]">
                            { tab.count }
                        </AlignBadge.Root>
                    </Button>
                )) }
            </div>
            { activeTab === 'open' && <TicketList tickets={ openIssues } onSelect={ setSelectedIssueId } showPick /> }
            { activeTab === 'my' && <TicketList tickets={ myIssues } onSelect={ setSelectedIssueId } /> }
            { activeTab === 'picked' && <TicketList tickets={ pickedIssues } onSelect={ setSelectedIssueId } /> }
        </ToolPanel>
    );
};

const TicketList: FC<{ tickets: IssueMessageData[]; onSelect: (id: number) => void; showPick?: boolean }> = ({ tickets, onSelect, showPick }) =>
{
    return (
        <div>
            <div className="grid grid-cols-[32px_70px_70px_1fr] border-b border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-1 text-[11px] font-semibold text-text-sub-600">
                <span>Typ</span><span>Spieler</span><span>Alter</span><span></span>
            </div>
            { tickets.map(t => (
                <div key={ t.issueId } onClick={ () => onSelect(t.issueId) } className="grid cursor-pointer grid-cols-[32px_70px_70px_1fr] items-center border-b border-stroke-soft-200 px-3.5 py-1 text-[11px] hover:bg-bg-weak-50">
                    <span className="tabular-nums text-text-strong-950">{ t.categoryId }</span>
                    <span className="truncate font-medium text-primary-base">{ t.reportedUserName }</span>
                    <span className="text-text-sub-600">{ Math.floor(t.issueAgeInMilliseconds / 60000) }m</span>
                    <div className="flex justify-end">
                        { showPick ? (
                            <Button size="sm" variant="success" className="h-5 px-2 text-[10px]" onClick={ event =>
                            {
                                event.stopPropagation();
                                SendMessageComposer(new PickIssuesMessageComposer([ t.issueId ], false, 0, 'pick issue button'));
                            } }>Annehmen</Button>
                        ) : (
                            <ChevronRight className="size-3 text-text-soft-400" />
                        ) }
                    </div>
                </div>
            )) }
            { tickets.length === 0 && <div className="py-4 text-center text-[11px] text-text-sub-600">Keine Issues</div> }
        </div>
    );
};

// ═══════════════════════════════════════════════════
// ISSUE DETAIL PANEL
// ═══════════════════════════════════════════════════

const IssueDetailPanel: FC<{ ticket: IssueMessageData; onBack: () => void; onOpenUser: (userId: number) => void }> = ({ ticket, onBack, onOpenUser }) =>
{
    const [ showChat, setShowChat ] = useState(false);
    const [ cfhChatlog, setCfhChatlog ] = useState<CfhChatlogData>(null);

    useMessageEvent<CfhChatlogEvent>(CfhChatlogEvent, event =>
    {
        const parser = event.getParser();
        if(!parser || parser.data.issueId !== ticket.issueId) return;
        setCfhChatlog(parser.data);
    });

    const loadChatlog = () =>
    {
        SendMessageComposer(new GetCfhChatlogMessageComposer(ticket.issueId));
        setShowChat(true);
    };

    if(showChat)
    {
        const entries = cfhChatlog?.chatRecord?.chatlog ?? [];
        return (
            <ToolPanel>
                <PanelHeader icon={ MessageSquare } title={ `CFH Chatlog — #${ ticket.issueId }` } right={
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={ () => setShowChat(false) }><X className="mr-1 size-2.5" />Zurück</Button>
                } />
                <ScrollPanel className="h-[160px]">
                    { entries.map((e, i) => (
                        <div key={ i } className={ cn('grid grid-cols-[56px_70px_1fr] px-3.5 py-1 text-[11px]', i % 2 === 0 && 'bg-bg-weak-50') }>
                            <span className="tabular-nums text-text-sub-600">{ e.timestamp }</span>
                            <span className="font-medium text-primary-base">{ e.userName }</span>
                            <span className="break-all text-text-strong-950">{ e.message }</span>
                        </div>
                    )) }
                    { entries.length === 0 && <div className="py-4 text-center text-[11px] text-text-sub-600">Lade Chatlog...</div> }
                </ScrollPanel>
            </ToolPanel>
        );
    }

    const rows: [string, string, (() => void) | null][] = [
        [ 'Quelle', GetIssueCategoryName(ticket.categoryId), null ],
        [ 'Kategorie', LocalizeText('help.cfh.topic.' + ticket.reportedCategoryId), null ],
        [ 'Beschreibung', ticket.message, null ],
        [ 'Melder', ticket.reporterUserName, () => onOpenUser(ticket.reporterUserId) ],
        [ 'Gemeldeter User', ticket.reportedUserName, () => onOpenUser(ticket.reportedUserId) ],
    ];
    const closeIssue = (resolution: number) =>
    {
        SendMessageComposer(new CloseIssuesMessageComposer([ ticket.issueId ], resolution));
        onBack();
    };
    const releaseIssue = () =>
    {
        SendMessageComposer(new ReleaseIssuesMessageComposer([ ticket.issueId ]));
        onBack();
    };

    return (
        <ToolPanel>
            <PanelHeader icon={ FileText } title={ `Issue #${ ticket.issueId }` } right={
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={ onBack }><X className="mr-1 size-2.5" />Zurück</Button>
            } />
            <div className="grid grid-cols-[1fr_auto]">
                <div>
                    { rows.map(([ label, val, onClick ], i) => (
                        <div key={ label } className={ cn('flex justify-between px-3.5 py-1 text-[11px]', i % 2 === 0 && 'bg-bg-weak-50') }>
                            <span className="font-medium text-text-sub-600">{ label }</span>
                            <span
                                className={ cn('max-w-[200px] text-right text-text-strong-950', onClick && 'cursor-pointer font-medium text-primary-base hover:underline') }
                                onClick={ onClick || undefined }
                            >{ val }</span>
                        </div>
                    )) }
                </div>
                <div className="flex flex-col gap-1 border-l border-stroke-soft-200 p-2">
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[10px]" onClick={ loadChatlog }><MessageSquare className="size-2.5" />Chatlog</Button>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[10px]" onClick={ () => closeIssue(CloseIssuesMessageComposer.RESOLUTION_USELESS) }>
                        <X className="size-2.5" />Nutzlos
                    </Button>
                    <Button size="sm" variant="destructive" className="h-6 gap-1 px-2 text-[10px]" onClick={ () => closeIssue(CloseIssuesMessageComposer.RESOLUTION_ABUSIVE) }>
                        <Ban className="size-2.5" />Missbr.
                    </Button>
                    <Button size="sm" variant="success" className="h-6 gap-1 px-2 text-[10px]" onClick={ () => closeIssue(CloseIssuesMessageComposer.RESOLUTION_RESOLVED) }>
                        <CircleDot className="size-2.5" />Gelöst
                    </Button>
                    <Button size="sm" variant="secondary" className="h-6 gap-1 px-2 text-[10px]" onClick={ releaseIssue }>
                        <FileText className="size-2.5" />Freigeben
                    </Button>
                </div>
            </div>
        </ToolPanel>
    );
};

// ═══════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════

export const ModToolsV2View: FC<ModToolsV2ViewProps> = ({ currentRoomId, selectedUser, onClose }) =>
{
    const [ active, setActive ] = useState<ActivePanel>(null);
    const toggle = (p: ActivePanel | 'jail') =>
    {
        if (p === 'jail')
        {
            CreateLinkEvent('jail/toggle');
            return;
        }
        setActive(v => v === p ? null : p);
    };

    return (
        <DraggableWindow uniqueKey="mod-tools" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <div className="nitro-mod-tools-v2">
                <div className="space-y-2">
                    <ToolPanel>
                        <div className="drag-handler cursor-grab select-none active:cursor-grabbing">
                            <PanelHeader icon={ Shield } title="Mod Tools" right={
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={ onClose }>
                                    <X className="size-3.5" />
                                </Button>
                            } />
                        </div>
                        <div className="p-2 space-y-1">
                            { ([
                                [ 'room', Home, 'Room Tool', currentRoomId <= 0 ],
                                [ 'chatlog', MessageSquare, 'Chatlog Tool', currentRoomId <= 0 ],
                                [ 'user', Users, `User: ${ selectedUser?.username || '-' }`, !selectedUser ],
                                [ 'tickets', AlertTriangle, 'Report Tool', false ],
                                [ 'jail', Gavel, 'Jail Control', false ],
                            ] as const).map(([ key, Icon, label, disabled ]) => (
                                <Button
                                    key={ key }
                                    variant={ active === key ? 'default' : 'ghost' }
                                    size="sm"
                                    onClick={ () => toggle(key as ActivePanel | 'jail') }
                                    disabled={ disabled as boolean }
                                    className="h-auto w-full justify-start gap-2 px-3 py-1.5 text-paragraph-xs font-medium"
                                >
                                    <Icon className="size-3.5" /> { label }
                                </Button>
                            )) }
                        </div>
                    </ToolPanel>
                    { active === 'room' && currentRoomId > 0 && <RoomToolPanel roomId={ currentRoomId } /> }
                    { active === 'chatlog' && currentRoomId > 0 && <ChatlogPanel roomId={ currentRoomId } /> }
                    { active === 'user' && selectedUser && <UserToolPanel userId={ selectedUser.userId } username={ selectedUser.username } /> }
                    { active === 'tickets' && <TicketsPanel /> }
                </div>
            </div>
        </DraggableWindow>
    );
};
