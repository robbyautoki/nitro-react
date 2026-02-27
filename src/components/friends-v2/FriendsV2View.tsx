import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { HabboSearchComposer, HabboSearchResultData, HabboSearchResultEvent, ILinkEventTracker, RemoveFriendComposer, SendRoomInviteComposer, FollowFriendMessageComposer, SetRelationshipStatusComposer } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetSessionDataManager, GetUserProfile, LocalizeText, MessengerFriend, MessengerRequest, MessengerThreadChat, OpenMessengerChat, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useFriends, useMessageEvent, useMessenger } from '../../hooks';
import { Badge } from '@/components/ui/reui-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
    Users, Search, MessageCircle, Navigation, User, X, Heart, Smile, ArrowLeft, Send, Check, UserPlus, UserMinus, DoorOpen, CheckSquare, Plus, UsersRound,
} from 'lucide-react';

function getAvatarHead(figure: string) {
    return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${encodeURIComponent(figure)}&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}

function RelIcon({ s }: { s: number }) {
    if (s === 1) return <Heart className="w-3 h-3 shrink-0" fill="#e74c3c" style={{ color: '#e74c3c' }} />;
    if (s === 2) return <Smile className="w-3 h-3 shrink-0" style={{ color: '#f39c12' }} />;
    if (s === 3) return <span className="text-[11px] font-bold shrink-0" style={{ color: '#9b59b6' }}>♣</span>;
    return null;
}

function FriendItem({ friend, selectMode, selected, hasUnread, onSelect, onClick, onRelChange }: {
    friend: MessengerFriend; selectMode: boolean; selected: boolean; hasUnread: boolean;
    onSelect: (id: number) => void; onClick: (id: number) => void; onRelChange: (id: number, status: number) => void;
}) {
    const [relOpen, setRelOpen] = useState(false);
    return (
        <div onClick={() => selectMode ? onSelect(friend.id) : onClick(friend.id)}
            className={`group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${selected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-accent/50 border-l-2 border-transparent'} ${!friend.online ? 'opacity-60' : ''}`}>
            {selectMode && <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-border/60'}`}>{selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}</div>}
            <div className="relative shrink-0">
                <img src={getAvatarHead(friend.figure)} alt={friend.name} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />
                {friend.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold truncate">{friend.name}</span>
                    {!relOpen && friend.relationshipStatus > 0 && <RelIcon s={friend.relationshipStatus} />}
                    {!relOpen ? (
                        <button onClick={(e) => { e.stopPropagation(); setRelOpen(true); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"><Heart className="w-2.5 h-2.5 text-muted-foreground/50" /></button>
                    ) : (
                        <div className="flex items-center gap-0.5 ml-0.5" onClick={(e) => e.stopPropagation()}>
                            {[{ s: 1, el: <Heart className="w-3 h-3" fill="#e74c3c" style={{ color: '#e74c3c' }} /> }, { s: 2, el: <Smile className="w-3 h-3" style={{ color: '#f39c12' }} /> }, { s: 3, el: <span className="text-[10px] font-bold" style={{ color: '#9b59b6' }}>♣</span> }, { s: 0, el: <X className="w-3 h-3 text-muted-foreground" /> }].map((o) => (
                                <button key={o.s} onClick={() => { onRelChange(friend.id, o.s); setRelOpen(false); }} className={`p-0.5 rounded hover:bg-accent transition-colors ${friend.relationshipStatus === o.s ? 'bg-accent' : ''}`}>{o.el}</button>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{friend.online ? (friend.motto || '') : (friend.lastAccess || 'Offline')}</p>
            </div>
            {hasUnread && !selectMode && <span className="w-2.5 h-2.5 rounded-full bg-foreground shrink-0" />}
        </div>
    );
}

function ChatBubble({ message, isOwn, figure }: { message: MessengerThreadChat; isOwn: boolean; figure: string }) {
    const time = message.date ? message.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

    if (message.type === MessengerThreadChat.SECURITY_NOTIFICATION || message.type === MessengerThreadChat.STATUS_NOTIFICATION) {
        return (
            <div className="flex justify-center py-1">
                <span className="text-[10px] text-muted-foreground/50 bg-muted/20 px-3 py-1 rounded-full">{message.message}</span>
            </div>
        );
    }

    if (message.type === MessengerThreadChat.ROOM_INVITE) {
        return (
            <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <img src={getAvatarHead(figure)} alt="" className="w-7 h-7 rounded-full border border-border/30 bg-muted/20 shrink-0 mt-0.5" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />
                <div className={`max-w-[75%] rounded-xl px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                    <p className="text-[10px] text-amber-400 font-medium mb-0.5">Raum-Einladung</p>
                    <p className="text-[12px] break-words">{message.message}</p>
                    <p className="text-[9px] mt-0.5 text-muted-foreground/60">{time}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <img src={getAvatarHead(figure)} alt="" className="w-7 h-7 rounded-full border border-border/30 bg-muted/20 shrink-0 mt-0.5" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />
            <div className={`max-w-[75%] rounded-xl px-3 py-1.5 ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                <p className="text-[12px] break-words">{message.message}</p>
                <p className={`text-[9px] mt-0.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>{time}</p>
            </div>
        </div>
    );
}

type ViewType = 'list' | 'chat' | 'invite';

export const FriendsV2View: FC<{}> = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectMode, setSelectMode] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'online' | 'offline' | 'requests' | 'search'>('online');
    const [view, setView] = useState<ViewType>('list');
    const [messageText, setMessageText] = useState('');
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [inviteMessage, setInviteMessage] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [friendResults, setFriendResults] = useState<HabboSearchResultData[]>(null);
    const [otherResults, setOtherResults] = useState<HabboSearchResultData[]>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { friends, onlineFriends = [], offlineFriends = [], requests = [], requestResponse, requestFriend, canRequestFriend, followFriend, updateRelationship } = useFriends();
    const { visibleThreads = [], activeThread = null, getMessageThread, setActiveThreadId, closeThread, sendMessage } = useMessenger();

    const myUserId = GetSessionDataManager().userId;
    const myFigure = GetSessionDataManager().figure;

    const filteredList = useMemo(() => {
        const list = tab === 'online' ? onlineFriends : offlineFriends;
        if (!search) return list;
        const q = search.toLowerCase();
        return list.filter((f) => f.name.toLowerCase().includes(q));
    }, [tab, onlineFriends, offlineFriends, search]);

    const totalUnread = useMemo(() => visibleThreads.reduce((s, t) => s + t.unreadCount, 0), [visibleThreads]);
    const unreadByFriend = useMemo(() => {
        const m = new Map<number, number>();
        for (const t of visibleThreads) {
            if (t.unreadCount > 0 && t.participant) m.set(t.participant.id, t.unreadCount);
        }
        return m;
    }, [visibleThreads]);

    const selectedFriendNames = useMemo(() => {
        return selectedIds.map(id => {
            const f = friends.find(fr => fr.id === id);
            return f?.name;
        }).filter(Boolean) as string[];
    }, [selectedIds, friends]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread]);

    useMessageEvent<HabboSearchResultEvent>(HabboSearchResultEvent, event => {
        const parser = event.getParser();
        setFriendResults(parser.friends);
        setOtherResults(parser.others);
    });

    useEffect(() => {
        if (!userSearch || !userSearch.length) { setFriendResults(null); setOtherResults(null); return; }
        const timeout = setTimeout(() => {
            if (!userSearch || !userSearch.length) return;
            SendMessageComposer(new HabboSearchComposer(userSearch));
        }, 500);
        return () => clearTimeout(timeout);
    }, [userSearch]);

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');
                if (parts.length < 2) return;
                switch (parts[1]) {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                    case 'request':
                        if (parts.length < 4) return;
                        requestFriend(parseInt(parts[2]), parts[3]);
                        return;
                }
            },
            eventUrlPrefix: 'friends/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [requestFriend]);

    // Also listen for friends-messenger events to open chat in drawer
    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');
                if (parts.length < 2) return;
                if (parts[1] === 'open' || parts[1] === 'toggle') {
                    setIsVisible(true);
                    if (visibleThreads.length > 0) {
                        setActiveThreadId(visibleThreads[0].threadId);
                        setView('chat');
                    }
                    return;
                }
                const odFriendId = parseInt(parts[1]);
                if (!isNaN(odFriendId) && odFriendId > 0) {
                    const thread = getMessageThread(odFriendId);
                    if (thread) {
                        setActiveThreadId(thread.threadId);
                        setIsVisible(true);
                        setView('chat');
                    }
                }
            },
            eventUrlPrefix: 'friends-messenger/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [getMessageThread, setActiveThreadId, visibleThreads]);

    useEffect(() => {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '420px' : '0px');
        return () => { document.documentElement.style.setProperty('--drawer-width', '0px'); };
    }, [isVisible]);

    const toggleSelect = useCallback((id: number) => { setSelectedIds((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }, []);

    const openDmChat = useCallback((friendId: number) => {
        const thread = getMessageThread(friendId);
        if (thread) {
            setActiveThreadId(thread.threadId);
            setView('chat');
        }
    }, [getMessageThread, setActiveThreadId]);

    const handleSendMessage = useCallback(() => {
        if (!messageText.trim() || !activeThread) return;
        sendMessage(activeThread, myUserId, messageText.trim());
        setMessageText('');
    }, [messageText, activeThread, sendMessage, myUserId]);

    const handleAcceptRequest = useCallback((req: MessengerRequest) => {
        requestResponse(req.id, true);
    }, [requestResponse]);

    const handleRejectRequest = useCallback((req: MessengerRequest) => {
        requestResponse(req.id, false);
    }, [requestResponse]);

    const handleRejectAll = useCallback(() => {
        requestResponse(-1, false);
    }, [requestResponse]);

    const handleRemoveFriends = useCallback(() => {
        if (selectedIds.length === 0) return;
        SendMessageComposer(new RemoveFriendComposer(...selectedIds));
        setSelectedIds([]);
        setSelectMode(false);
        setShowRemoveConfirm(false);
    }, [selectedIds]);

    const handleRelChange = useCallback((id: number, status: number) => {
        const friend = friends.find(f => f.id === id);
        if (friend) updateRelationship(friend, status);
    }, [friends, updateRelationship]);

    const handleSendRoomInvite = useCallback(() => {
        if (!selectedIds.length || !inviteMessage.trim() || inviteMessage.length > 255) return;
        SendMessageComposer(new SendRoomInviteComposer(inviteMessage.trim(), selectedIds));
        setView('list');
        setSelectMode(false);
        setSelectedIds([]);
        setInviteMessage('');
    }, [selectedIds, inviteMessage]);

    const exitSelectMode = useCallback(() => { setSelectMode(false); setSelectedIds([]); }, []);

    const TABS = [
        { id: 'online' as const, label: 'Online', count: onlineFriends.length },
        { id: 'offline' as const, label: 'Offline', count: offlineFriends.length },
        { id: 'requests' as const, label: 'Anfragen', count: requests.length },
        { id: 'search' as const, label: 'Suche', count: null },
    ];

    return (
        <TooltipProvider delayDuration={200}>
            <DrawerPrimitive.Root
                direction="right"
                open={isVisible}
                onOpenChange={(o) => { setIsVisible(o); if (!o) { setView('list'); setSelectMode(false); setSelectedIds([]); } }}
                modal={false}
            >
                <DrawerPrimitive.Portal>
                    {isVisible && <div className="fixed inset-0 z-[78]" onClick={() => setIsVisible(false)} />}
                    <DrawerPrimitive.Content
                        className="fixed right-0 top-[60px] bottom-0 w-[420px] z-[79] flex flex-col overflow-hidden bg-background border-l border-border/40 shadow-xl"
                        style={{ '--initial-transform': 'calc(100%)' } as React.CSSProperties}
                    >
                        {/* ═══ VIEW: LIST ═══ */}
                        {view === 'list' && (<>
                            <div className="shrink-0 px-4 pt-4 pb-2">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2"><Users className="w-5 h-5" /><h2 className="text-base font-bold">Freunde</h2><Badge variant="secondary" className="text-[10px] h-5">{onlineFriends.length} online</Badge></div>
                                    <div className="flex items-center gap-1">
                                        {totalUnread > 0 && !selectMode && <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { const t = visibleThreads.find(t => t.unreadCount > 0); if (t) { setActiveThreadId(t.threadId); setView('chat'); } }}><MessageCircle className="w-3 h-3" />{totalUnread}</Button>}
                                        <Tooltip><TooltipTrigger asChild><Button variant={selectMode ? 'default' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}><CheckSquare className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent className="text-[10px]">{selectMode ? 'Auswahl beenden' : 'Auswählen'}</TooltipContent></Tooltip>
                                        <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent/50 text-muted-foreground/50 transition-colors" onClick={() => setIsVisible(false)}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {tab !== 'search' && <div className="relative mb-2"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" /><Input placeholder="Freunde suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[12px]" /></div>}
                                <div className="flex gap-1">
                                    {TABS.map((t) => (<button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setUserSearch(''); }} className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}>{t.label}{t.count !== null ? ` (${t.count})` : ''}</button>))}
                                </div>
                            </div>
                            <Separator />
                            <ScrollArea className="flex-1 min-h-0">
                                {tab === 'search' ? (
                                    <div className="p-3 flex flex-col gap-2">
                                        <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" /><Input placeholder="Nutzer suchen..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-8 h-8 text-[12px]" maxLength={50} /></div>
                                        <div className="divide-y divide-border/20">
                                            {friendResults && friendResults.length > 0 && (<>
                                                <p className="text-[10px] font-semibold text-muted-foreground py-1.5">Freunde ({friendResults.length})</p>
                                                {friendResults.map(r => (
                                                    <div key={r.avatarId} className="flex items-center gap-2.5 py-2">
                                                        <div className="relative shrink-0"><img src={getAvatarHead(r.avatarFigure)} alt={r.avatarName} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />{r.isAvatarOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />}</div>
                                                        <div className="flex-1 min-w-0"><span className="text-[12px] font-semibold block truncate">{r.avatarName}</span><span className="text-[10px] text-muted-foreground">{r.isAvatarOnline ? 'Online' : 'Offline'}</span></div>
                                                        {r.isAvatarOnline && <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => openDmChat(r.avatarId)}><MessageCircle className="w-3 h-3" />Chat</Button>}
                                                    </div>
                                                ))}
                                            </>)}
                                            {otherResults && otherResults.length > 0 && (<>
                                                <p className="text-[10px] font-semibold text-muted-foreground py-1.5">Andere Nutzer ({otherResults.length})</p>
                                                {otherResults.map(r => (
                                                    <div key={r.avatarId} className="flex items-center gap-2.5 py-2">
                                                        <div className="relative shrink-0"><img src={getAvatarHead(r.avatarFigure)} alt={r.avatarName} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} /></div>
                                                        <div className="flex-1 min-w-0"><span className="text-[12px] font-semibold block truncate">{r.avatarName}</span><span className="text-[10px] text-muted-foreground">{r.isAvatarOnline ? 'Online' : 'Offline'}</span></div>
                                                        {canRequestFriend(r.avatarId)
                                                            ? <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => requestFriend(r.avatarId, r.avatarName)}><UserPlus className="w-3 h-3" />Hinzufügen</Button>
                                                            : <Badge variant="secondary" className="text-[9px] h-5">Freund</Badge>}
                                                    </div>
                                                ))}
                                            </>)}
                                            {userSearch && friendResults && otherResults && friendResults.length === 0 && otherResults.length === 0 && (
                                                <div className="flex flex-col items-center py-8 text-muted-foreground"><Search className="w-6 h-6 opacity-20 mb-1" /><p className="text-[11px]">Keine Nutzer gefunden</p></div>
                                            )}
                                        </div>
                                    </div>
                                ) : tab === 'requests' ? (
                                    <div>
                                        {requests.length === 0 ? <div className="flex flex-col items-center py-12 text-muted-foreground"><UserPlus className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">Keine Anfragen</p></div> : (<>
                                            <div className="divide-y divide-border/30">{requests.map((r) => (
                                                <div key={r.id} className="flex items-center gap-2.5 px-3 py-2">
                                                    <img src={getAvatarHead(r.figureString)} alt={r.name} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20 shrink-0" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />
                                                    <div className="flex-1 min-w-0"><span className="text-[12px] font-semibold truncate block">{r.name}</span><span className="text-[10px] text-muted-foreground">Möchte dein Freund sein</span></div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button variant="outline" size="icon" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleAcceptRequest(r)}><Check className="w-3 h-3" /></Button>
                                                        <Button variant="outline" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10" onClick={() => handleRejectRequest(r)}><X className="w-3 h-3" /></Button>
                                                    </div>
                                                </div>
                                            ))}</div>
                                            <div className="px-3 py-2"><Button variant="outline" size="sm" className="w-full h-7 text-[10px] text-red-400" onClick={handleRejectAll}>Alle ablehnen</Button></div>
                                        </>)}
                                    </div>
                                ) : (
                                    <div>{filteredList.length === 0 ? <div className="flex flex-col items-center py-12 text-muted-foreground"><Users className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">{search ? 'Nichts gefunden' : tab === 'online' ? 'Keine Freunde online' : 'Keine Offline-Freunde'}</p></div> : (
                                        <div className="divide-y divide-border/20">{filteredList.map((f) => <FriendItem key={f.id} friend={f} selectMode={selectMode} selected={selectedIds.includes(f.id)} hasUnread={unreadByFriend.has(f.id)} onSelect={toggleSelect} onClick={(id) => openDmChat(id)} onRelChange={handleRelChange} />)}</div>
                                    )}</div>
                                )}
                            </ScrollArea>
                            {selectMode && selectedIds.length > 0 && (<><Separator /><div className="shrink-0 px-3 py-2 flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{selectedIds.length} ausgewählt</span><div className="ml-auto flex gap-1"><Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { setView('invite'); setInviteMessage(''); }}><DoorOpen className="w-3 h-3" />Einladen</Button><Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-red-400" onClick={() => setShowRemoveConfirm(true)}><UserMinus className="w-3 h-3" />Entfernen</Button></div></div></>)}
                        </>)}

                        {/* ═══ VIEW: CHAT ═══ */}
                        {view === 'chat' && (<>
                            <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setView('list'); setActiveThreadId(-1); }} className="p-1 rounded hover:bg-accent transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                                    {activeThread && activeThread.participant && (<>
                                        <img src={getAvatarHead(activeThread.participant.figure)} alt={activeThread.participant.name} className="w-8 h-8 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5"><span className="text-[13px] font-bold">{activeThread.participant.name}</span>{activeThread.participant.online && <span className="w-2 h-2 rounded-full bg-emerald-500" />}</div>
                                            <p className="text-[10px] text-muted-foreground truncate">{activeThread.participant.motto || ''}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {activeThread.participant.followingAllowed && activeThread.participant.online && <Tooltip><TooltipTrigger asChild><button className="p-1.5 rounded hover:bg-accent" onClick={() => followFriend(activeThread.participant)}><Navigation className="w-3.5 h-3.5 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Folgen</TooltipContent></Tooltip>}
                                            <Tooltip><TooltipTrigger asChild><button className="p-1.5 rounded hover:bg-accent" onClick={() => GetUserProfile(activeThread.participant.id)}><User className="w-3.5 h-3.5 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Profil</TooltipContent></Tooltip>
                                        </div>
                                    </>)}
                                </div>
                                {/* Thread tabs */}
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                                    {visibleThreads.map((t) => {
                                        const isActive = activeThread && t.threadId === activeThread.threadId;
                                        return (
                                            <Tooltip key={t.threadId}><TooltipTrigger asChild>
                                                <div className={`relative shrink-0 group/thread ${isActive ? 'ring-2 ring-primary rounded-full' : 'opacity-60 hover:opacity-100'}`}>
                                                    <button onClick={() => { setActiveThreadId(t.threadId); }}>
                                                        {t.participant && t.participant.figure ? <img src={getAvatarHead(t.participant.figure)} alt={t.participant.name} className="w-9 h-9 rounded-full border border-border/30 bg-muted/20" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} /> : <div className="w-9 h-9 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center"><UsersRound className="w-4 h-4 text-muted-foreground" /></div>}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); closeThread(t.threadId); }} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border/40 items-center justify-center hidden group-hover/thread:flex"><X className="w-2.5 h-2.5" /></button>
                                                    {t.unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-[12px] rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center px-0.5">{t.unreadCount}</span>}
                                                </div>
                                            </TooltipTrigger><TooltipContent className="text-[10px]">{t.participant?.name || 'Chat'}</TooltipContent></Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="flex flex-col gap-2 p-3">
                                    {activeThread && activeThread.groups.length > 0 ? activeThread.groups.map((group, gi) =>
                                        group.chats.map((chat, ci) => {
                                            const isOwn = chat.senderId === myUserId;
                                            let figure = myFigure;
                                            if (!isOwn && activeThread.participant) figure = activeThread.participant.figure;
                                            return <ChatBubble key={`${gi}-${ci}`} message={chat} isOwn={isOwn} figure={figure} />;
                                        })
                                    ) : <div className="flex flex-col items-center py-12 text-muted-foreground"><MessageCircle className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">Noch keine Nachrichten</p></div>}
                                    <div ref={chatEndRef} />
                                </div>
                            </ScrollArea>
                            <div className="shrink-0 p-3 border-t border-border/30"><div className="flex gap-2"><Input placeholder="Nachricht..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="text-[12px] h-9" maxLength={255} /><Button size="icon" className="h-9 w-9 shrink-0" disabled={!messageText.trim()} onClick={handleSendMessage}><Send className="w-4 h-4" /></Button></div></div>
                        </>)}

                        {/* ═══ VIEW: INVITE ═══ */}
                        {view === 'invite' && (<>
                            <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30"><div className="flex items-center gap-2"><button onClick={() => setView('list')} className="p-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" /></button><DoorOpen className="w-4 h-4" /><span className="text-[13px] font-bold">Raum-Einladung</span></div></div>
                            <ScrollArea className="flex-1 min-h-0"><div className="p-4 flex flex-col gap-4">
                                <div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Eingeladen ({selectedIds.length})</label><div className="flex flex-wrap gap-1.5">{selectedIds.map((id) => { const f = friends.find(fr => fr.id === id); if (!f) return null; return (<div key={id} className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-muted/30 border border-border/30"><img src={getAvatarHead(f.figure)} alt={f.name} className="w-5 h-5 rounded-full" style={{ imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' }} draggable={false} /><span className="text-[11px]">{f.name}</span><button onClick={() => setSelectedIds((p) => p.filter(x => x !== id))}><X className="w-3 h-3 text-muted-foreground/50 hover:text-foreground" /></button></div>); })}</div></div>
                                <div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Nachricht</label><Input placeholder="Kommt in meinen Raum!" value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} className="text-[12px] h-9" maxLength={255} /></div>
                            </div></ScrollArea>
                            <div className="shrink-0 p-3 border-t border-border/30 flex gap-2"><Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={() => setView('list')}>Abbrechen</Button><Button className="flex-1 h-9 text-[12px] gap-1" disabled={!inviteMessage.trim() || selectedIds.length === 0} onClick={handleSendRoomInvite}><Send className="w-3.5 h-3.5" />Einladen</Button></div>
                        </>)}
                    </DrawerPrimitive.Content>
                </DrawerPrimitive.Portal>
            </DrawerPrimitive.Root>

            <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Freunde entfernen?</AlertDialogTitle><AlertDialogDescription>Möchtest du <span className="font-semibold text-foreground">{selectedFriendNames.join(', ')}</span> wirklich entfernen?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleRemoveFriends}>Entfernen</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </TooltipProvider>
    );
};
