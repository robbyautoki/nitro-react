import { ComponentType, FC, HTMLAttributes, InputHTMLAttributes, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HabboSearchComposer, HabboSearchResultData, HabboSearchResultEvent, ILinkEventTracker, RemoveFriendComposer, SendRoomInviteComposer } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetSessionDataManager, GetUserProfile, MessengerFriend, MessengerRequest, MessengerThreadChat, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { useFriends, useMessageEvent, useMessenger } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { cn } from '@/align-ui/utils/cn';
import { AlignGameConfirm } from '../align-game-ui';
import {
    Users, Search, MessageCircle, Navigation, User, X, Heart, Smile, ArrowLeft, Send, Check, UserPlus, UserMinus, DoorOpen, CheckSquare, UsersRound,
} from 'lucide-react';

type ViewType = 'list' | 'chat' | 'invite';
type FriendsTab = 'online' | 'offline' | 'requests' | 'search';

const Tooltip = AlignTooltip.Root;
const TooltipContent = AlignTooltip.Content;
const TooltipProvider = AlignTooltip.Provider;
const TooltipTrigger = AlignTooltip.Trigger;
const RELATIONSHIP_STATUSES = [ 1, 2, 3, 0 ] as const;

function getAvatarHead(figure: string)
{
    return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${ encodeURIComponent(figure) }&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}

function ScrollViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return <div className={ cn('overflow-y-auto', className) } { ...props } />;
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement>
{
    icon?: ComponentType<{ className?: string }>;
    rootClassName?: string;
    wrapperClassName?: string;
}

function TextInput({ icon: Icon, rootClassName, wrapperClassName, className, ...props }: TextInputProps)
{
    return (
        <AlignInput.Root size="xsmall" className={ rootClassName }>
            <AlignInput.Wrapper className={ cn('h-8', wrapperClassName) }>
                { Icon && <AlignInput.Icon as={ Icon } className="size-3.5" /> }
                <AlignInput.Input className={ cn('h-8 text-paragraph-xs', className) } { ...props } />
            </AlignInput.Wrapper>
        </AlignInput.Root>
    );
}

interface AvatarHeadProps
{
    figure: string;
    alt: string;
    className?: string;
    containerClassName?: string;
    online?: boolean;
}

function AvatarHead({ figure, alt, className, containerClassName, online }: AvatarHeadProps)
{
    return (
        <div className={ cn('relative shrink-0', containerClassName) }>
            <img
                src={ getAvatarHead(figure) }
                alt={ alt }
                className={ cn('rounded-full border border-stroke-soft-200 bg-bg-weak-50', className) }
                style={ { imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center top' } }
                draggable={ false }
            />
            { online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-bg-white-0 bg-success-base" /> }
        </div>
    );
}

function EmptyState({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string })
{
    return (
        <div className={ cn('flex flex-col items-center justify-center py-12 text-text-sub-600', className) }>
            <div className="mb-2 text-text-soft-400">{ icon }</div>
            <p className="text-paragraph-xs">{ children }</p>
        </div>
    );
}

function RelIcon({ s, className }: { s: number; className?: string })
{
    if(s === 1) return <Heart className={ cn('size-3 shrink-0 fill-current text-error-base', className) } />;
    if(s === 2) return <Smile className={ cn('size-3 shrink-0 text-warning-base', className) } />;
    if(s === 3) return <span className={ cn('shrink-0 text-[11px] font-bold leading-none text-feature-base', className) }>♣</span>;
    return null;
}

function FriendItem({ friend, selectMode, selected, hasUnread, onSelect, onClick, onRelChange }: {
    friend: MessengerFriend; selectMode: boolean; selected: boolean; hasUnread: boolean;
    onSelect: (id: number) => void; onClick: (id: number) => void; onRelChange: (id: number, status: number) => void;
})
{
    const [ relOpen, setRelOpen ] = useState(false);

    return (
        <div
            onClick={ () => selectMode ? onSelect(friend.id) : onClick(friend.id) }
            className={ cn(
                'group flex cursor-pointer items-center gap-2.5 border-l-2 px-3 py-2 transition duration-200 ease-out',
                selected ? 'border-primary-base bg-primary-alpha-10' : 'border-transparent hover:bg-bg-weak-50',
                !friend.online && 'opacity-60',
            ) }
        >
            { selectMode && (
                <div onClick={ event => event.stopPropagation() }>
                    <AlignCheckbox.Root checked={ selected } onCheckedChange={ () => onSelect(friend.id) } className="size-4" />
                </div>
            ) }
            <AvatarHead figure={ friend.figure } alt={ friend.name } className="size-9" online={ friend.online } />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label-xs text-text-strong-950">{ friend.name }</span>
                    { !relOpen && friend.relationshipStatus > 0 && <RelIcon s={ friend.relationshipStatus } /> }
                    { !relOpen ? (
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="size-5 px-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={ event =>
                            {
                                event.stopPropagation(); setRelOpen(true);
                            } }
                        >
                            <Heart className="size-3 text-text-soft-400" />
                        </AlignButton.Root>
                    ) : (
                        <div className="ml-0.5 flex items-center gap-0.5" onClick={ event => event.stopPropagation() }>
                            { RELATIONSHIP_STATUSES.map(status => (
                                <AlignButton.Root
                                    key={ status }
                                    type="button"
                                    variant="neutral"
                                    mode={ friend.relationshipStatus === status ? 'lighter' : 'ghost' }
                                    size="xxsmall"
                                    className="size-6 px-0"
                                    onClick={ () =>
                                    {
                                        onRelChange(friend.id, status); setRelOpen(false);
                                    } }
                                >
                                    { status === 0 ? <X className="size-3 text-text-sub-600" /> : <RelIcon s={ status } /> }
                                </AlignButton.Root>
                            )) }
                        </div>
                    ) }
                </div>
                <p className="truncate text-[10px] text-text-sub-600">{ friend.online ? (friend.motto || '') : (friend.lastAccess || 'Offline') }</p>
            </div>
            { hasUnread && !selectMode && <span className="size-2.5 shrink-0 rounded-full bg-primary-base" /> }
        </div>
    );
}

function ChatBubble({ message, isOwn, figure }: { message: MessengerThreadChat; isOwn: boolean; figure: string })
{
    const time = message.date ? message.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

    if(message.type === MessengerThreadChat.SECURITY_NOTIFICATION || message.type === MessengerThreadChat.STATUS_NOTIFICATION)
    {
        return (
            <div className="flex justify-center py-1">
                <span className="rounded-full bg-bg-weak-50 px-3 py-1 text-[10px] text-text-soft-400">{ message.message }</span>
            </div>
        );
    }

    if(message.type === MessengerThreadChat.ROOM_INVITE)
    {
        return (
            <div className={ cn('flex gap-2', isOwn && 'flex-row-reverse') }>
                <AvatarHead figure={ figure } alt="" className="size-7" containerClassName="mt-0.5" />
                <div className={ cn('max-w-[75%] rounded-xl border border-warning-light bg-warning-lighter px-3 py-1.5', isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm') }>
                    <p className="mb-0.5 text-[10px] font-medium text-warning-base">Raum-Einladung</p>
                    <p className="break-words text-paragraph-xs text-text-strong-950">{ message.message }</p>
                    <p className="mt-0.5 text-[9px] text-text-soft-400">{ time }</p>
                </div>
            </div>
        );
    }

    return (
        <div className={ cn('flex gap-2', isOwn && 'flex-row-reverse') }>
            <AvatarHead figure={ figure } alt="" className="size-7" containerClassName="mt-0.5" />
            <div className={ cn('max-w-[75%] rounded-xl px-3 py-1.5', isOwn ? 'rounded-tr-sm bg-primary-base text-static-white' : 'rounded-tl-sm bg-bg-weak-50 text-text-strong-950') }>
                <p className="break-words text-paragraph-xs">{ message.message }</p>
                <p className={ cn('mt-0.5 text-[9px]', isOwn ? 'text-static-white/70' : 'text-text-soft-400') }>{ time }</p>
            </div>
        </div>
    );
}

export const FriendsV2View: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ selectedIds, setSelectedIds ] = useState<number[]>([]);
    const [ selectMode, setSelectMode ] = useState(false);
    const [ search, setSearch ] = useState('');
    const [ tab, setTab ] = useState<FriendsTab>('online');
    const [ view, setView ] = useState<ViewType>('list');
    const [ messageText, setMessageText ] = useState('');
    const [ showRemoveConfirm, setShowRemoveConfirm ] = useState(false);
    const [ inviteMessage, setInviteMessage ] = useState('');
    const [ userSearch, setUserSearch ] = useState('');
    const [ friendResults, setFriendResults ] = useState<HabboSearchResultData[] | null>(null);
    const [ otherResults, setOtherResults ] = useState<HabboSearchResultData[] | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { friends, onlineFriends = [], offlineFriends = [], requests = [], requestResponse, requestFriend, canRequestFriend, followFriend, updateRelationship } = useFriends();
    const { visibleThreads = [], activeThread = null, getMessageThread, setActiveThreadId, closeThread, sendMessage } = useMessenger();

    const myUserId = GetSessionDataManager().userId;
    const myFigure = GetSessionDataManager().figure;

    const filteredList = useMemo(() =>
    {
        const list = tab === 'online' ? onlineFriends : offlineFriends;
        if(!search) return list;
        const q = search.toLowerCase();
        return list.filter((f) => f.name.toLowerCase().includes(q));
    }, [ tab, onlineFriends, offlineFriends, search ]);

    const totalUnread = useMemo(() => visibleThreads.reduce((s, t) => s + t.unreadCount, 0), [ visibleThreads ]);
    const unreadByFriend = useMemo(() =>
    {
        const m = new Map<number, number>();
        for(const t of visibleThreads)
        {
            if(t.unreadCount > 0 && t.participant) m.set(t.participant.id, t.unreadCount);
        }
        return m;
    }, [ visibleThreads ]);

    const selectedFriendNames = useMemo(() =>
    {
        return selectedIds.map(id =>
        {
            const f = friends.find(fr => fr.id === id);
            return f?.name;
        }).filter(Boolean) as string[];
    }, [ selectedIds, friends ]);

    useEffect(() =>
    {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ activeThread ]);

    useMessageEvent<HabboSearchResultEvent>(HabboSearchResultEvent, event =>
    {
        const parser = event.getParser();
        setFriendResults(parser.friends);
        setOtherResults(parser.others);
    });

    useEffect(() =>
    {
        if(!userSearch || !userSearch.length)
        {
            setFriendResults(null);
            setOtherResults(null);
            return;
        }

        const timeout = setTimeout(() =>
        {
            if(!userSearch || !userSearch.length) return;
            SendMessageComposer(new HabboSearchComposer(userSearch));
        }, 500);

        return () => clearTimeout(timeout);
    }, [ userSearch ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                switch(parts[1])
                {
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
                        if(parts.length < 4) return;
                        requestFriend(parseInt(parts[2]), parts[3]);
                        return;
                }
            },
            eventUrlPrefix: 'friends/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ requestFriend ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                if(parts[1] === 'open' || parts[1] === 'toggle')
                {
                    setIsVisible(true);
                    if(visibleThreads.length > 0)
                    {
                        setActiveThreadId(visibleThreads[0].threadId);
                        setView('chat');
                    }
                    return;
                }
                const odFriendId = parseInt(parts[1]);
                if(!isNaN(odFriendId) && odFriendId > 0)
                {
                    const thread = getMessageThread(odFriendId);
                    if(thread)
                    {
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
    }, [ getMessageThread, setActiveThreadId, visibleThreads ]);

    useEffect(() =>
    {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '432px' : '0px');
        return () =>
        {
            document.documentElement.style.setProperty('--drawer-width', '0px');
        };
    }, [ isVisible ]);

    const toggleSelect = useCallback((id: number) =>
    {
        setSelectedIds((p) => p.includes(id) ? p.filter(x => x !== id) : [ ...p, id ]);
    }, []);

    const openDmChat = useCallback((friendId: number) =>
    {
        const thread = getMessageThread(friendId);
        if(thread)
        {
            setActiveThreadId(thread.threadId);
            setView('chat');
        }
    }, [ getMessageThread, setActiveThreadId ]);

    const handleSendMessage = useCallback(() =>
    {
        if(!messageText.trim() || !activeThread) return;
        sendMessage(activeThread, myUserId, messageText.trim());
        setMessageText('');
    }, [ messageText, activeThread, sendMessage, myUserId ]);

    const handleAcceptRequest = useCallback((req: MessengerRequest) =>
    {
        requestResponse(req.id, true);
    }, [ requestResponse ]);

    const handleRejectRequest = useCallback((req: MessengerRequest) =>
    {
        requestResponse(req.id, false);
    }, [ requestResponse ]);

    const handleRejectAll = useCallback(() =>
    {
        requestResponse(-1, false);
    }, [ requestResponse ]);

    const handleRemoveFriends = useCallback(() =>
    {
        if(selectedIds.length === 0) return;
        SendMessageComposer(new RemoveFriendComposer(...selectedIds));
        setSelectedIds([]);
        setSelectMode(false);
        setShowRemoveConfirm(false);
    }, [ selectedIds ]);

    const handleRelChange = useCallback((id: number, status: number) =>
    {
        const friend = friends.find(f => f.id === id);
        if(friend) updateRelationship(friend, status);
    }, [ friends, updateRelationship ]);

    const handleSendRoomInvite = useCallback(() =>
    {
        if(!selectedIds.length || !inviteMessage.trim() || inviteMessage.length > 255) return;
        SendMessageComposer(new SendRoomInviteComposer(inviteMessage.trim(), selectedIds));
        setView('list');
        setSelectMode(false);
        setSelectedIds([]);
        setInviteMessage('');
    }, [ selectedIds, inviteMessage ]);

    const exitSelectMode = useCallback(() =>
    {
        setSelectMode(false);
        setSelectedIds([]);
    }, []);

    const TABS = [
        { id: 'online' as const, label: 'Online', count: onlineFriends.length },
        { id: 'offline' as const, label: 'Offline', count: offlineFriends.length },
        { id: 'requests' as const, label: 'Anfragen', count: requests.length },
        { id: 'search' as const, label: 'Suche', count: null },
    ];

    return (
        <TooltipProvider delayDuration={ 200 }>
            <AlignDrawer.Root
                open={ isVisible }
                onOpenChange={ (o) =>
                {
                    setIsVisible(o); if(!o)
                    {
                        setView('list'); setSelectMode(false); setSelectedIds([]);
                    }
                } }
                modal={ false }
            >
                <AlignDrawer.Content
                    className="w-[420px]"
                    onOpenAutoFocus={ event => event.preventDefault() }
                >
                        <AlignDrawer.Title className="sr-only">Freunde</AlignDrawer.Title>
                        <AlignDrawer.Description className="sr-only">Freunde, Nachrichten und Anfragen</AlignDrawer.Description>
                        { view === 'list' && (<>
                            <div className="shrink-0 px-4 pb-2 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Users className="size-5 shrink-0 text-text-sub-600" />
                                        <h2 className="text-label-md text-text-strong-950">Freunde</h2>
                                        <AlignBadge.Root color="green" variant="lighter" size="small">{ onlineFriends.length } online</AlignBadge.Root>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        { totalUnread > 0 && !selectMode && (
                                            <AlignButton.Root
                                                type="button"
                                                variant="primary"
                                                mode="lighter"
                                                size="xxsmall"
                                                className="h-7 gap-1 text-[10px]"
                                                onClick={ () =>
                                                {
                                                    const t = visibleThreads.find(t => t.unreadCount > 0);
                                                    if(t)
                                                    {
                                                        setActiveThreadId(t.threadId);
                                                        setView('chat');
                                                    }
                                                } }
                                            >
                                                <MessageCircle className="size-3" />
                                                { totalUnread }
                                            </AlignButton.Root>
                                        ) }
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlignButton.Root
                                                    type="button"
                                                    variant={ selectMode ? 'primary' : 'neutral' }
                                                    mode={ selectMode ? 'filled' : 'ghost' }
                                                    size="xxsmall"
                                                    className="size-7 px-0"
                                                    onClick={ () => selectMode ? exitSelectMode() : setSelectMode(true) }
                                                >
                                                    <CheckSquare className="size-3.5" />
                                                </AlignButton.Root>
                                            </TooltipTrigger>
                                            <TooltipContent size="xsmall">{ selectMode ? 'Auswahl beenden' : 'Auswählen' }</TooltipContent>
                                        </Tooltip>
                                        <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 px-0" onClick={ () => setIsVisible(false) }>
                                            <X className="size-4" />
                                        </AlignButton.Root>
                                    </div>
                                </div>
                                { tab !== 'search' && (
                                    <TextInput
                                        icon={ Search }
                                        placeholder="Freunde suchen..."
                                        value={ search }
                                        onChange={ (e) => setSearch(e.target.value) }
                                        rootClassName="mb-2"
                                    />
                                ) }
                                <div className="flex gap-1">
                                    { TABS.map((t) =>
                                    {
                                        const isActive = tab === t.id;
                                        return (
                                            <AlignButton.Root
                                                key={ t.id }
                                                type="button"
                                                variant={ isActive ? 'primary' : 'neutral' }
                                                mode={ isActive ? 'filled' : 'ghost' }
                                                size="xxsmall"
                                                className="h-8 flex-1 px-1 text-[11px]"
                                                onClick={ () =>
                                                {
                                                    setTab(t.id); setSearch(''); setUserSearch('');
                                                } }
                                            >
                                                { t.label }{ t.count !== null ? ` (${ t.count })` : '' }
                                            </AlignButton.Root>
                                        );
                                    }) }
                                </div>
                            </div>
                            <AlignDivider.Root />
                            <ScrollViewport className="min-h-0 flex-1">
                                { tab === 'search' ? (
                                    <div className="flex flex-col gap-2 p-3">
                                        <TextInput
                                            icon={ Search }
                                            placeholder="Nutzer suchen..."
                                            value={ userSearch }
                                            onChange={ (e) => setUserSearch(e.target.value) }
                                            maxLength={ 50 }
                                        />
                                        <div className="divide-y divide-stroke-soft-200">
                                            { friendResults && friendResults.length > 0 && (<>
                                                <p className="py-1.5 text-[10px] font-semibold text-text-sub-600">Freunde ({ friendResults.length })</p>
                                                { friendResults.map(r => (
                                                    <div key={ r.avatarId } className="flex items-center gap-2.5 py-2">
                                                        <AvatarHead figure={ r.avatarFigure } alt={ r.avatarName } className="size-9" online={ r.isAvatarOnline } />
                                                        <div className="min-w-0 flex-1">
                                                            <span className="block truncate text-label-xs text-text-strong-950">{ r.avatarName }</span>
                                                            <span className="text-[10px] text-text-sub-600">{ r.isAvatarOnline ? 'Online' : 'Offline' }</span>
                                                        </div>
                                                        { r.isAvatarOnline && (
                                                            <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="h-6 gap-1 text-[10px]" onClick={ () => openDmChat(r.avatarId) }>
                                                                <MessageCircle className="size-3" />
                                                                Chat
                                                            </AlignButton.Root>
                                                        ) }
                                                    </div>
                                                )) }
                                            </>) }
                                            { otherResults && otherResults.length > 0 && (<>
                                                <p className="py-1.5 text-[10px] font-semibold text-text-sub-600">Andere Nutzer ({ otherResults.length })</p>
                                                { otherResults.map(r => (
                                                    <div key={ r.avatarId } className="flex items-center gap-2.5 py-2">
                                                        <AvatarHead figure={ r.avatarFigure } alt={ r.avatarName } className="size-9" />
                                                        <div className="min-w-0 flex-1">
                                                            <span className="block truncate text-label-xs text-text-strong-950">{ r.avatarName }</span>
                                                            <span className="text-[10px] text-text-sub-600">{ r.isAvatarOnline ? 'Online' : 'Offline' }</span>
                                                        </div>
                                                        { canRequestFriend(r.avatarId)
                                                            ? (
                                                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="h-6 gap-1 text-[10px]" onClick={ () => requestFriend(r.avatarId, r.avatarName) }>
                                                                    <UserPlus className="size-3" />
                                                                    Hinzufügen
                                                                </AlignButton.Root>
                                                            )
                                                            : <AlignBadge.Root color="gray" variant="lighter" size="small">Freund</AlignBadge.Root> }
                                                    </div>
                                                )) }
                                            </>) }
                                            { userSearch && friendResults && otherResults && friendResults.length === 0 && otherResults.length === 0 && (
                                                <EmptyState icon={ <Search className="size-6" /> } className="py-8">Keine Nutzer gefunden</EmptyState>
                                            ) }
                                        </div>
                                    </div>
                                ) : tab === 'requests' ? (
                                    <div>
                                        { requests.length === 0 ? (
                                            <EmptyState icon={ <UserPlus className="size-8" /> }>Keine Anfragen</EmptyState>
                                        ) : (<>
                                            <div className="divide-y divide-stroke-soft-200">{ requests.map((r) => (
                                                <div key={ r.id } className="flex items-center gap-2.5 px-3 py-2">
                                                    <AvatarHead figure={ r.figureString } alt={ r.name } className="size-9" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block truncate text-label-xs text-text-strong-950">{ r.name }</span>
                                                        <span className="text-[10px] text-text-sub-600">Möchte dein Freund sein</span>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <AlignButton.Root type="button" variant="primary" mode="lighter" size="xxsmall" className="size-6 px-0" onClick={ () => handleAcceptRequest(r) }>
                                                            <Check className="size-3" />
                                                        </AlignButton.Root>
                                                        <AlignButton.Root type="button" variant="error" mode="lighter" size="xxsmall" className="size-6 px-0" onClick={ () => handleRejectRequest(r) }>
                                                            <X className="size-3" />
                                                        </AlignButton.Root>
                                                    </div>
                                                </div>
                                            )) }</div>
                                            <div className="px-3 py-2">
                                                <AlignButton.Root type="button" variant="error" mode="stroke" size="xxsmall" className="h-7 w-full text-[10px]" onClick={ handleRejectAll }>
                                                    Alle ablehnen
                                                </AlignButton.Root>
                                            </div>
                                        </>) }
                                    </div>
                                ) : (
                                    <div>
                                        { filteredList.length === 0 ? (
                                            <EmptyState icon={ <Users className="size-8" /> }>
                                                { search ? 'Nichts gefunden' : tab === 'online' ? 'Keine Freunde online' : 'Keine Offline-Freunde' }
                                            </EmptyState>
                                        ) : (
                                            <div className="divide-y divide-stroke-soft-200">
                                                { filteredList.map((f) => (
                                                    <FriendItem
                                                        key={ f.id }
                                                        friend={ f }
                                                        selectMode={ selectMode }
                                                        selected={ selectedIds.includes(f.id) }
                                                        hasUnread={ unreadByFriend.has(f.id) }
                                                        onSelect={ toggleSelect }
                                                        onClick={ (id) => openDmChat(id) }
                                                        onRelChange={ handleRelChange }
                                                    />
                                                )) }
                                            </div>
                                        ) }
                                    </div>
                                ) }
                            </ScrollViewport>
                            { selectMode && selectedIds.length > 0 && (<>
                                <AlignDivider.Root />
                                <div className="flex shrink-0 items-center gap-2 px-3 py-2">
                                    <span className="text-[10px] text-text-sub-600">{ selectedIds.length } ausgewählt</span>
                                    <div className="ml-auto flex gap-1">
                                        <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () =>
                                        {
                                            setView('invite'); setInviteMessage('');
                                        } }>
                                            <DoorOpen className="size-3" />
                                            Einladen
                                        </AlignButton.Root>
                                        <AlignButton.Root type="button" variant="error" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => setShowRemoveConfirm(true) }>
                                            <UserMinus className="size-3" />
                                            Entfernen
                                        </AlignButton.Root>
                                    </div>
                                </div>
                            </>) }
                        </>) }
                        { view === 'chat' && (<>
                            <div className="shrink-0 border-b border-stroke-soft-200 px-3 pb-2 pt-3">
                                <div className="flex items-center gap-2">
                                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 px-0" onClick={ () =>
                                    {
                                        setView('list'); setActiveThreadId(-1);
                                    } }>
                                        <ArrowLeft className="size-4" />
                                    </AlignButton.Root>
                                    { activeThread && activeThread.participant && (<>
                                        <AvatarHead figure={ activeThread.participant.figure } alt={ activeThread.participant.name } className="size-8" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate text-label-xs text-text-strong-950">{ activeThread.participant.name }</span>
                                                { activeThread.participant.online && <span className="size-2 rounded-full bg-success-base" /> }
                                            </div>
                                            <p className="truncate text-[10px] text-text-sub-600">{ activeThread.participant.motto || '' }</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            { activeThread.participant.followingAllowed && activeThread.participant.online && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 px-0" onClick={ () => followFriend(activeThread.participant) }>
                                                            <Navigation className="size-3.5" />
                                                        </AlignButton.Root>
                                                    </TooltipTrigger>
                                                    <TooltipContent size="xsmall">Folgen</TooltipContent>
                                                </Tooltip>
                                            ) }
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 px-0" onClick={ () => GetUserProfile(activeThread.participant.id) }>
                                                        <User className="size-3.5" />
                                                    </AlignButton.Root>
                                                </TooltipTrigger>
                                                <TooltipContent size="xsmall">Profil</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </>) }
                                </div>
                                <div className="mt-2 flex items-center gap-1.5 border-t border-stroke-soft-200 pt-2">
                                    { visibleThreads.map((t) =>
                                    {
                                        const isActive = activeThread && t.threadId === activeThread.threadId;
                                        return (
                                            <Tooltip key={ t.threadId }>
                                                <TooltipTrigger asChild>
                                                    <div className={ cn('group/thread relative shrink-0', isActive ? 'rounded-full ring-2 ring-primary-base' : 'opacity-60 transition-opacity hover:opacity-100') }>
                                                        <button type="button" onClick={ () =>
                                                        {
                                                            setActiveThreadId(t.threadId);
                                                        } }>
                                                            { t.participant && t.participant.figure
                                                                ? <AvatarHead figure={ t.participant.figure } alt={ t.participant.name } className="size-9" />
                                                                : <div className="flex size-9 items-center justify-center rounded-full border border-stroke-soft-200 bg-bg-weak-50"><UsersRound className="size-4 text-text-sub-600" /></div> }
                                                        </button>
                                                        <button type="button" onClick={ (e) =>
                                                        {
                                                            e.stopPropagation(); closeThread(t.threadId);
                                                        } } className="absolute -right-0.5 -top-0.5 hidden size-4 items-center justify-center rounded-full border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 shadow-regular-xs group-hover/thread:flex">
                                                            <X className="size-2.5" />
                                                        </button>
                                                        { t.unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-error-base px-0.5 text-[7px] font-bold text-static-white">{ t.unreadCount }</span> }
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent size="xsmall">{ t.participant?.name || 'Chat' }</TooltipContent>
                                            </Tooltip>
                                        );
                                    }) }
                                </div>
                            </div>
                            <ScrollViewport className="min-h-0 flex-1">
                                <div className="flex flex-col gap-2 p-3">
                                    { activeThread && activeThread.groups.length > 0 ? activeThread.groups.map((group, gi) =>
                                        group.chats.map((chat, ci) =>
                                        {
                                            const isOwn = chat.senderId === myUserId;
                                            let figure = myFigure;
                                            if(!isOwn && activeThread.participant) figure = activeThread.participant.figure;
                                            return <ChatBubble key={ `${ gi }-${ ci }` } message={ chat } isOwn={ isOwn } figure={ figure } />;
                                        })
                                    ) : <EmptyState icon={ <MessageCircle className="size-8" /> }>Noch keine Nachrichten</EmptyState> }
                                    <div ref={ chatEndRef } />
                                </div>
                            </ScrollViewport>
                            <div className="shrink-0 border-t border-stroke-soft-200 p-3">
                                <div className="flex gap-2">
                                    <TextInput
                                        placeholder="Nachricht..."
                                        value={ messageText }
                                        onChange={ (e) => setMessageText(e.target.value) }
                                        onKeyDown={ (e) => e.key === 'Enter' && handleSendMessage() }
                                        wrapperClassName="h-9"
                                        className="h-9"
                                        maxLength={ 255 }
                                    />
                                    <AlignButton.Root type="button" variant="primary" mode="filled" size="small" className="size-9 shrink-0 px-0" disabled={ !messageText.trim() } onClick={ handleSendMessage }>
                                        <Send className="size-4" />
                                    </AlignButton.Root>
                                </div>
                            </div>
                        </>) }
                        { view === 'invite' && (<>
                            <div className="shrink-0 border-b border-stroke-soft-200 px-3 pb-2 pt-3">
                                <div className="flex items-center gap-2">
                                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 px-0" onClick={ () => setView('list') }>
                                        <ArrowLeft className="size-4" />
                                    </AlignButton.Root>
                                    <DoorOpen className="size-4 text-text-sub-600" />
                                    <span className="text-label-xs text-text-strong-950">Raum-Einladung</span>
                                </div>
                            </div>
                            <ScrollViewport className="min-h-0 flex-1">
                                <div className="flex flex-col gap-4 p-4">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-medium text-text-sub-600">Eingeladen ({ selectedIds.length })</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            { selectedIds.map((id) =>
                                            {
                                                const f = friends.find(fr => fr.id === id);
                                                if(!f) return null;
                                                return (
                                                    <div key={ id } className="flex items-center gap-1.5 rounded-full border border-stroke-soft-200 bg-bg-weak-50 py-0.5 pl-1 pr-2">
                                                        <AvatarHead figure={ f.figure } alt={ f.name } className="size-5 border-0" />
                                                        <span className="text-[11px] text-text-strong-950">{ f.name }</span>
                                                        <button type="button" onClick={ () => setSelectedIds((p) => p.filter(x => x !== id)) } className="text-text-soft-400 transition-colors hover:text-text-strong-950">
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                );
                                            }) }
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-medium text-text-sub-600">Nachricht</label>
                                        <TextInput
                                            placeholder="Kommt in meinen Raum!"
                                            value={ inviteMessage }
                                            onChange={ (e) => setInviteMessage(e.target.value) }
                                            wrapperClassName="h-9"
                                            className="h-9"
                                            maxLength={ 255 }
                                        />
                                    </div>
                                </div>
                            </ScrollViewport>
                            <div className="flex shrink-0 gap-2 border-t border-stroke-soft-200 p-3">
                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" className="h-9 flex-1 text-paragraph-xs" onClick={ () => setView('list') }>
                                    Abbrechen
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" className="h-9 flex-1 gap-1 text-paragraph-xs" disabled={ !inviteMessage.trim() || selectedIds.length === 0 } onClick={ handleSendRoomInvite }>
                                    <Send className="size-3.5" />
                                    Einladen
                                </AlignButton.Root>
                            </div>
                        </>) }
                </AlignDrawer.Content>
            </AlignDrawer.Root>
            <AlignGameConfirm
                open={ showRemoveConfirm }
                title="Freunde entfernen?"
                description={ <>Möchtest du <span className="font-medium text-text-strong-950">{ selectedFriendNames.join(', ') }</span> wirklich entfernen?</> }
                confirmLabel="Entfernen"
                destructive
                onConfirm={ handleRemoveFriends }
                onCancel={ () => setShowRemoveConfirm(false) }
            />
        </TooltipProvider>
    );
};
