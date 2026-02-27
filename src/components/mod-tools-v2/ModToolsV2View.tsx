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
import { FC, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetIssueCategoryName, GetSessionDataManager, ISelectedUser, LocalizeText, ModActionDefinition, NotificationAlertType, SendMessageComposer, TryVisitRoom } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common';
import { useMessageEvent, useModTools, useNotification } from '../../hooks';

import { Badge } from '@/components/ui/reui-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Frame, FramePanel } from '@/components/ui/frame';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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

function PanelHeader({ icon: Icon, title, right }: { icon: React.ElementType; title: string; right?: React.ReactNode })
{
    return (
        <div className="flex items-center justify-between px-3.5 py-2 border-b">
            <span className="text-xs font-semibold flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" /> {title}
            </span>
            {right}
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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={Home} title={`Room Info: ${name || '...'}`} />
                <div className="px-3.5 py-2.5 space-y-2.5">
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-1">
                            {([
                                ['Raumbesitzer', ownerName || '...', true],
                                ['User im Raum', String(usersInRoom), false],
                                ['Besitzer anwesend', ownerInRoom ? 'Ja' : 'Nein', false],
                            ] as const).map(([ label, val, isLink ]) => (
                                <div key={label} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className={`font-medium ${isLink ? 'text-primary cursor-pointer hover:underline' : ''}`}>{val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => TryVisitRoom(roomId)}>
                                <Eye className="size-3" />Besuchen
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => CreateLinkEvent(`mod-tools/toggle-room-chatlog/${roomId}`)}>
                                <MessageSquare className="size-3" />Chatlog
                            </Button>
                        </div>
                    </div>

                    <div className="rounded border bg-muted/30 p-2 space-y-1.5">
                        {([
                            [kickUsers, setKickUsers, 'kick', 'Alle User kicken'],
                            [lockRoom, setLockRoom, 'lock', 'Türklingel aktivieren'],
                            [changeRoomName, setChangeRoomName, 'name', 'Raumname ändern'],
                        ] as const).map(([ val, setter, id, label ]) => (
                            <div key={id} className="flex items-center gap-2">
                                <Checkbox id={id} checked={val as boolean} onCheckedChange={(v) => (setter as (v: boolean) => void)(!!v)} />
                                <label htmlFor={id} className="text-xs cursor-pointer">{label}</label>
                            </div>
                        ))}
                    </div>

                    <Textarea placeholder="Nachricht an die User im Raum..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[50px] text-xs" />

                    <div className="flex gap-1.5">
                        <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => handleAction('warn')}>
                            <AlertTriangle className="size-3" />Verwarnung
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleAction('alert')}>
                            <Send className="size-3" />Nur Hinweis
                        </Button>
                    </div>
                </div>
            </FramePanel>
        </Frame>
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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={MessageSquare} title={`Chatlog: ${roomChatlog?.roomName || '...'}`} right={
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => TryVisitRoom(roomId)}>
                            <Eye className="size-2.5" />Besuchen
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => openRoomInfo(roomId)}>
                            <Shield className="size-2.5" />Room Tools
                        </Button>
                    </div>
                } />
                <ScrollArea className="h-[240px]">
                    <div className="grid grid-cols-[56px_70px_1fr] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
                        <span>Zeit</span><span>User</span><span>Nachricht</span>
                    </div>
                    {entries.map((e, i) => (
                        <div key={i} className={`grid grid-cols-[56px_70px_1fr] text-[11px] px-3.5 py-1 border-b border-border/30 ${e.highlighted ? 'bg-red-500/8' : i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                            <span className="text-muted-foreground tabular-nums">{e.time}</span>
                            <span className="font-medium text-primary cursor-pointer hover:underline truncate" onClick={() => CreateLinkEvent(`mod-tools/open-user-info/${e.userId}`)}>{e.user}</span>
                            <span className="break-all">{e.message}</span>
                        </div>
                    ))}
                    {entries.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Keine Chatlog-Einträge</div>}
                </ScrollArea>
            </FramePanel>
        </Frame>
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
        if(!userInfo) return [['Username', username]];

        return [
            ['Username', userInfo.userName],
            ['CFH Meldungen', String(userInfo.cfhCount)],
            ['Missbr. CFH', String(userInfo.abusiveCfhCount)],
            ['Verwarnungen', String(userInfo.cautionCount)],
            ['Bans', String(userInfo.banCount)],
            ['Letzte Sanktion', userInfo.lastSanctionTime || '-'],
            ['Trade-Sperren', String(userInfo.tradingLockCount)],
            ['Trade-Ablauf', userInfo.tradingExpiryDate || '-'],
            ['Letzter Login', FriendlyTime.format(userInfo.minutesSinceLastLogin * 60, '.ago', 2)],
            ['Letzter Kauf', userInfo.lastPurchaseDate || '-'],
            ['E-Mail', userInfo.primaryEmailAddress || '-'],
            ['IP-Bans', String(userInfo.identityRelatedBanCount)],
            ['Registriert', FriendlyTime.format(userInfo.registrationAgeInMinutes * 60, '.ago', 2)],
            ['Klassifizierung', userInfo.userClassification || '-'],
        ];
    }, [ userInfo, username ]);

    return (
        <div className="space-y-2">
            <Frame>
                <FramePanel className="p-0!">
                    <PanelHeader icon={Users} title={`User: ${userInfo?.userName || username}`} right={
                        userInfo ? (
                            userInfo.online
                                ? <Badge variant="default" size="sm" className="bg-green-600 text-white text-[10px] h-5">Online</Badge>
                                : <Badge variant="secondary" size="sm" className="text-[10px] h-5">Offline</Badge>
                        ) : null
                    } />
                    <div className="grid grid-cols-[1fr_auto]">
                        <div>
                            {userProps.map(([ label, val ], i) => (
                                <div key={label} className={`flex justify-between px-3.5 py-0.5 text-[11px] ${i % 2 === 0 ? 'bg-muted/15' : ''}`}>
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-medium tabular-nums">
                                        {val}
                                        {label === 'Username' && userInfo?.online && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-1 p-2 border-l">
                            <Button size="sm" variant={sub === 'chatlog' ? 'default' : 'outline'} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub('chatlog')}>
                                <MessageSquare className="size-2.5" />Room Chat
                            </Button>
                            <Button size="sm" variant={sub === 'msg' ? 'default' : 'outline'} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub('msg')}>
                                <Send className="size-2.5" />Nachricht
                            </Button>
                            <Button size="sm" variant={sub === 'visits' ? 'default' : 'outline'} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub('visits')}>
                                <Clock className="size-2.5" />Besuche
                            </Button>
                            <Button size="sm" variant={sub === 'action' ? 'default' : 'outline'} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub('action')}>
                                <Gavel className="size-2.5" />Mod Action
                            </Button>
                        </div>
                    </div>
                </FramePanel>
            </Frame>

            {sub === 'msg' && <SendMessagePanel userId={userId} username={userInfo?.userName || username} />}
            {sub === 'chatlog' && <UserChatlogPanel userId={userId} />}
            {sub === 'visits' && <RoomVisitsPanel userId={userId} username={userInfo?.userName || username} />}
            {sub === 'action' && <ModActionPanel userId={userId} username={userInfo?.userName || username} />}
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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={Send} title={`Nachricht an: ${username}`} />
                <div className="px-3.5 py-2.5 space-y-2">
                    <Textarea placeholder="Nachricht eingeben..." value={msg} onChange={e => setMsg(e.target.value)} className="min-h-[50px] text-xs" />
                    <Button size="sm" className="w-full h-7 text-[11px] gap-1" onClick={sendMessage}><Send className="size-3" />Senden</Button>
                </div>
            </FramePanel>
        </Frame>
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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={MessageSquare} title={`User Chatlog: ${chatUsername || '...'}`} />
                <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-[56px_70px_1fr] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
                        <span>Zeit</span><span>User</span><span>Nachricht</span>
                    </div>
                    {allEntries.map((e, i) =>
                    {
                        if(e.isRoom)
                        {
                            return (
                                <div key={`room-${i}`} className="flex items-center justify-between px-3.5 py-1 bg-muted/30 text-[11px] border-b">
                                    <span className="font-semibold">{e.roomName}</span>
                                    <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 text-primary" onClick={() => TryVisitRoom(e.roomId)}>Besuchen</Button>
                                </div>
                            );
                        }

                        return (
                            <div key={`msg-${i}`} className={`grid grid-cols-[56px_70px_1fr] text-[11px] px-3.5 py-1 border-b border-border/30 ${e.highlighted ? 'bg-red-500/8' : ''}`}>
                                <span className="text-muted-foreground tabular-nums">{e.time}</span>
                                <span className="font-medium text-primary cursor-pointer hover:underline truncate" onClick={() => CreateLinkEvent(`mod-tools/open-user-info/${e.userId}`)}>{e.user}</span>
                                <span className="break-all">{e.message}</span>
                            </div>
                        );
                    })}
                    {allEntries.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Keine Einträge</div>}
                </ScrollArea>
            </FramePanel>
        </Frame>
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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={Clock} title={`Besuche: ${username}`} />
                <div>
                    <div className="grid grid-cols-[44px_1fr_60px] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
                        <span>Zeit</span><span>Raum</span><span></span>
                    </div>
                    {rooms.map((v, i) => (
                        <div key={i} className={`grid grid-cols-[44px_1fr_60px] text-[11px] px-3.5 py-1 items-center border-b border-border/30 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                            <span className="text-muted-foreground tabular-nums">{String(v.enterHour).padStart(2, '0')}:{String(v.enterMinute).padStart(2, '0')}</span>
                            <span className="truncate">{v.roomName}</span>
                            <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 text-primary" onClick={() => TryVisitRoom(v.roomId)}>Besuchen</Button>
                        </div>
                    ))}
                    {rooms.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Keine Besuche</div>}
                </div>
            </FramePanel>
        </Frame>
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
        const messageOrDefault = (msg.trim().length === 0) ? LocalizeText(`help.cfh.topic.${category.id}`) : msg;

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

        const messageOrDefault = (msg.trim().length === 0) ? LocalizeText(`help.cfh.topic.${category.id}`) : msg;

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
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={Gavel} title={`Mod Action: ${username}`} />
                <div className="px-3.5 py-2.5 space-y-2">
                    <Select value={selectedTopic > -1 ? String(selectedTopic) : undefined} onValueChange={v => setSelectedTopic(Number(v))}>
                        <SelectTrigger className="w-full text-xs h-8">
                            <SelectValue placeholder="CFH Thema" />
                        </SelectTrigger>
                        <SelectContent>
                            {topics.map((t, i) => <SelectItem key={i} value={String(i)} className="text-xs">{LocalizeText('help.cfh.topic.' + t.id)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedAction > -1 ? String(selectedAction) : undefined} onValueChange={v => setSelectedAction(Number(v))}>
                        <SelectTrigger className="w-full text-xs h-8">
                            <SelectValue placeholder="Sanktionstyp" />
                        </SelectTrigger>
                        <SelectContent>
                            {MOD_ACTION_DEFINITIONS.map((s, i) => <SelectItem key={i} value={String(i)} className="text-xs">{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Optionale Nachricht (überschreibt Standard)</p>
                        <Textarea placeholder="Nachricht..." value={msg} onChange={e => setMsg(e.target.value)} className="min-h-[40px] text-xs" />
                    </div>
                    <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] gap-1" onClick={sendDefaultSanction}>
                            <Gavel className="size-3" />Default
                        </Button>
                        <Button size="sm" className="flex-1 h-7 text-[11px] gap-1 bg-green-600 hover:bg-green-700" onClick={sendSanction}>
                            <Ban className="size-3" />Ausführen
                        </Button>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
};

// ═══════════════════════════════════════════════════
// TICKETS PANEL
// ═══════════════════════════════════════════════════

const TicketsPanel: FC<{}> = () =>
{
    const [ selectedIssueId, setSelectedIssueId ] = useState<number | null>(null);
    const { tickets = [], openUserInfo } = useModTools();

    const openIssues = tickets.filter(t => t.state === IssueMessageData.STATE_OPEN);
    const myIssues = tickets.filter(t => t.state === IssueMessageData.STATE_PICKED && t.pickerUserId === GetSessionDataManager().userId);
    const pickedIssues = tickets.filter(t => t.state === IssueMessageData.STATE_PICKED);

    const selectedTicket = tickets.find(t => t.issueId === selectedIssueId);

    if(selectedTicket) return <IssueDetailPanel ticket={selectedTicket} onBack={() => setSelectedIssueId(null)} onOpenUser={openUserInfo} />;

    return (
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={AlertTriangle} title="Tickets" />
                <Tabs defaultValue="open">
                    <TabsList className="w-full rounded-none border-b bg-transparent h-8 px-3">
                        <TabsTrigger value="open" className="text-[11px] h-6 gap-1">Offen <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{openIssues.length}</Badge></TabsTrigger>
                        <TabsTrigger value="my" className="text-[11px] h-6 gap-1">Meine <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{myIssues.length}</Badge></TabsTrigger>
                        <TabsTrigger value="picked" className="text-[11px] h-6 gap-1">Aufgenommen <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{pickedIssues.length}</Badge></TabsTrigger>
                    </TabsList>
                    <TabsContent value="open"><TicketList tickets={openIssues} onSelect={setSelectedIssueId} showPick /></TabsContent>
                    <TabsContent value="my"><TicketList tickets={myIssues} onSelect={setSelectedIssueId} /></TabsContent>
                    <TabsContent value="picked"><TicketList tickets={pickedIssues} onSelect={setSelectedIssueId} /></TabsContent>
                </Tabs>
            </FramePanel>
        </Frame>
    );
};

const TicketList: FC<{ tickets: IssueMessageData[]; onSelect: (id: number) => void; showPick?: boolean }> = ({ tickets, onSelect, showPick }) =>
{
    return (
        <div>
            <div className="grid grid-cols-[32px_70px_70px_1fr] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
                <span>Typ</span><span>Spieler</span><span>Alter</span><span></span>
            </div>
            {tickets.map(t => (
                <div key={t.issueId} onClick={() => onSelect(t.issueId)} className="grid grid-cols-[32px_70px_70px_1fr] text-[11px] px-3.5 py-1 items-center border-b border-border/30 hover:bg-muted/20 cursor-pointer">
                    <span className="tabular-nums">{t.categoryId}</span>
                    <span className="font-medium text-primary truncate">{t.reportedUserName}</span>
                    <span className="text-muted-foreground">{Math.floor(t.issueAgeInMilliseconds / 60000)}m</span>
                    <div className="flex justify-end">
                        {showPick ? (
                            <Button size="sm" className="h-5 text-[10px] px-2 bg-green-600 hover:bg-green-700" onClick={e => { e.stopPropagation(); SendMessageComposer(new PickIssuesMessageComposer([ t.issueId ], false, 0, 'pick issue button')); }}>Annehmen</Button>
                        ) : (
                            <ChevronRight className="size-3 text-muted-foreground" />
                        )}
                    </div>
                </div>
            ))}
            {tickets.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Keine Issues</div>}
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
            <Frame>
                <FramePanel className="p-0!">
                    <PanelHeader icon={MessageSquare} title={`CFH Chatlog — #${ticket.issueId}`} right={
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setShowChat(false)}><X className="size-2.5 mr-1" />Zurück</Button>
                    } />
                    <ScrollArea className="h-[160px]">
                        {entries.map((e, i) => (
                            <div key={i} className={`grid grid-cols-[56px_70px_1fr] text-[11px] px-3.5 py-1 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                                <span className="text-muted-foreground tabular-nums">{e.timestamp}</span>
                                <span className="font-medium text-primary">{e.userName}</span>
                                <span className="break-all">{e.message}</span>
                            </div>
                        ))}
                        {entries.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Lade Chatlog...</div>}
                    </ScrollArea>
                </FramePanel>
            </Frame>
        );
    }

    const rows: [string, string, (() => void) | null][] = [
        ['Quelle', GetIssueCategoryName(ticket.categoryId), null],
        ['Kategorie', LocalizeText('help.cfh.topic.' + ticket.reportedCategoryId), null],
        ['Beschreibung', ticket.message, null],
        ['Melder', ticket.reporterUserName, () => onOpenUser(ticket.reporterUserId)],
        ['Gemeldeter User', ticket.reportedUserName, () => onOpenUser(ticket.reportedUserId)],
    ];

    return (
        <Frame>
            <FramePanel className="p-0!">
                <PanelHeader icon={FileText} title={`Issue #${ticket.issueId}`} right={
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={onBack}><X className="size-2.5 mr-1" />Zurück</Button>
                } />
                <div className="grid grid-cols-[1fr_auto]">
                    <div>
                        {rows.map(([ label, val, onClick ], i) => (
                            <div key={label} className={`flex justify-between px-3.5 py-1 text-[11px] ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span
                                    className={`${onClick ? 'text-primary font-medium cursor-pointer hover:underline' : ''} text-right max-w-[200px]`}
                                    onClick={onClick || undefined}
                                >{val}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1 p-2 border-l">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={loadChatlog}><MessageSquare className="size-2.5" />Chatlog</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={() => { SendMessageComposer(new CloseIssuesMessageComposer([ ticket.issueId ], CloseIssuesMessageComposer.RESOLUTION_USELESS)); onBack(); }}>
                            <X className="size-2.5" />Nutzlos
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 text-[10px] gap-1 px-2" onClick={() => { SendMessageComposer(new CloseIssuesMessageComposer([ ticket.issueId ], CloseIssuesMessageComposer.RESOLUTION_ABUSIVE)); onBack(); }}>
                            <Ban className="size-2.5" />Missbr.
                        </Button>
                        <Button size="sm" className="h-6 text-[10px] gap-1 px-2 bg-green-600 hover:bg-green-700" onClick={() => { SendMessageComposer(new CloseIssuesMessageComposer([ ticket.issueId ], CloseIssuesMessageComposer.RESOLUTION_RESOLVED)); onBack(); }}>
                            <CircleDot className="size-2.5" />Gelöst
                        </Button>
                        <Button size="sm" variant="secondary" className="h-6 text-[10px] gap-1 px-2" onClick={() => { SendMessageComposer(new ReleaseIssuesMessageComposer([ ticket.issueId ])); onBack(); }}>
                            <FileText className="size-2.5" />Freigeben
                        </Button>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
};

// ═══════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════

export const ModToolsV2View: FC<ModToolsV2ViewProps> = ({ currentRoomId, selectedUser, onClose }) =>
{
    const [ active, setActive ] = useState<ActivePanel>(null);
    const toggle = (p: ActivePanel) => setActive(v => v === p ? null : p);

    return (
        <DraggableWindow uniqueKey="mod-tools" handleSelector=".drag-handler" windowPosition={DraggableWindowPosition.TOP_LEFT}>
            <div className="nitro-mod-tools-v2">
                <div className="space-y-2">
                    <Frame>
                        <FramePanel className="p-0!">
                            <div className="drag-handler cursor-grab active:cursor-grabbing select-none">
                                <PanelHeader icon={Shield} title="Mod Tools" right={
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onClose}>
                                        <X className="size-3.5" />
                                    </Button>
                                } />
                            </div>
                        <div className="p-2 space-y-1">
                            {([
                                ['room', Home, 'Room Tool', currentRoomId <= 0],
                                ['chatlog', MessageSquare, 'Chatlog Tool', currentRoomId <= 0],
                                ['user', Users, `User: ${selectedUser?.username || '-'}`, !selectedUser],
                                ['tickets', AlertTriangle, 'Report Tool', false],
                            ] as const).map(([ key, Icon, label, disabled ]) => (
                                <button
                                    key={key}
                                    onClick={() => !disabled && toggle(key as ActivePanel)}
                                    disabled={disabled as boolean}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${active === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                >
                                    <Icon className="size-3.5" /> {label}
                                </button>
                            ))}
                        </div>
                    </FramePanel>
                </Frame>

                    {active === 'room' && currentRoomId > 0 && <RoomToolPanel roomId={currentRoomId} />}
                    {active === 'chatlog' && currentRoomId > 0 && <ChatlogPanel roomId={currentRoomId} />}
                    {active === 'user' && selectedUser && <UserToolPanel userId={selectedUser.userId} username={selectedUser.username} />}
                    {active === 'tickets' && <TicketsPanel />}
                </div>
            </div>
        </DraggableWindow>
    );
};
