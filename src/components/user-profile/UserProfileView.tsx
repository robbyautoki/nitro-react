import { ExtendedProfileChangedMessageEvent, FriendlyTime, RelationshipStatusEnum, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer, RequestFriendComposer } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Pen, Heart, Smile, UserPlus, MessageCircle, DoorOpen, Star, Users, Shield, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { CreateLinkEvent, GetConfiguration, GetLocalStorage, GetRoomSession, GetSessionDataManager, GetUserProfile, SendMessageComposer, SetLocalStorage } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/reui-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PROFILE_EFFECTS, ProfileEffectData, ROLE_PRESETS } from './ProfileEffects';
import { BANNER_PRESETS, DEFAULT_BANNER_ID } from './BannerPresets';

interface KlipyGif { id: number; slug: string; title: string; file: { md: { gif: { url: string } }; sm: { webp: { url: string } } } }

const KLIPY_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_KLIPY_API_KEY) || '';

const getBannerStorageKey = (userId: number) => `nitro.profile.banner.${ userId }`;
const getEffectStorageKey = (userId: number) => `nitro.profile.effect.${ userId }`;
const getNoteStorageKey = (targetId: number) => `nitro.profile.note.${ targetId }`;

const REL_CONFIG: Record<number, { icon: typeof Heart; color: string; bg: string; label: string }> = {
    [RelationshipStatusEnum.HEART]: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Herz' },
    [RelationshipStatusEnum.SMILE]: { icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Smiley' },
    [RelationshipStatusEnum.BOBBA]: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Bobba' },
};

function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode })
{
    return (
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/40">{ children }</span>
            { action }
        </div>
    );
}

function SpriteLayer({ src, startDelay = 0 }: { src: string; startDelay?: number })
{
    const [ visible, setVisible ] = useState(startDelay === 0);

    useEffect(() =>
    {
        if(startDelay > 0)
        {
            const t = setTimeout(() => setVisible(true), startDelay);
            return () => clearTimeout(t);
        }
    }, [ startDelay ]);

    if(!visible) return null;

    return (
        <img src={ src } alt="" draggable={ false } decoding="async" className="absolute inset-0 w-full h-full object-cover" style={ { willChange: 'transform', transform: 'translateZ(0)' } } />
    );
}

function ProfileEffectRenderer({ effect }: { effect: ProfileEffectData })
{
    const sorted = useMemo(() => [ ...effect.effects ].sort((a, b) => a.zIndex - b.zIndex), [ effect ]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15] group-hover:z-[2] opacity-100 group-hover:opacity-60 transition-opacity duration-500" style={ { willChange: 'transform, opacity', transform: 'translateZ(0)' } }>
            { sorted.map((layer, i) => (
                <div key={ `${ effect.id }-${ i }` } className="absolute inset-0" style={ { zIndex: layer.zIndex } }>
                    <SpriteLayer src={ layer.src } startDelay={ layer.start } />
                </div>
            )) }
        </div>
    );
}

function getRolesFromProfile(badges: string[]): string[]
{
    const roles: string[] = [];
    if(badges.some(b => b === 'ADM' || b.startsWith('ADM'))) roles.push('admin');
    if(badges.some(b => b === 'MOD' || b.startsWith('MOD'))) roles.push('mod');
    if(badges.some(b => b === 'VIP' || b.startsWith('VIP') || b === 'HC1')) roles.push('vip');
    return roles;
}

export const UserProfileView: FC<{}> = () =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ userRelationships, setUserRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const [ requestSent, setRequestSent ] = useState(false);
    const [ bannerId, setBannerId ] = useState<string>(DEFAULT_BANNER_ID);
    const [ showBannerPicker, setShowBannerPicker ] = useState(false);
    const [ effectId, setEffectId ] = useState<string | null>(null);
    const [ expandedGroupId, setExpandedGroupId ] = useState<number | null>(null);
    const [ note, setNote ] = useState('');
    const [ editingNote, setEditingNote ] = useState(false);
    const noteRef = useRef<HTMLTextAreaElement>(null);

    const [ gifQuery, setGifQuery ] = useState('');
    const [ gifResults, setGifResults ] = useState<KlipyGif[]>([]);
    const [ gifLoading, setGifLoading ] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    const onClose = () =>
    {
        setUserProfile(null);
        setUserBadges([]);
        setUserRelationships(null);
        setShowBannerPicker(false);
        setExpandedGroupId(null);
        setEditingNote(false);
    };

    const isOwnProfile = userProfile ? (userProfile.id === GetSessionDataManager().userId) : false;
    const canSendFriendRequest = userProfile ? (!requestSent && !isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent) : false;

    const currentBanner = useMemo(() =>
        BANNER_PRESETS.find(p => p.id === bannerId) || BANNER_PRESETS[BANNER_PRESETS.length - 1],
    [ bannerId ]);

    const resolvedBannerUrl = currentBanner.gifUrl ?? null;
    const activeEffect = PROFILE_EFFECTS.find(e => e.id === effectId);
    const cardBg = activeEffect ? 'bg-muted/30' : 'bg-muted/15';
    const cardBgLight = activeEffect ? 'bg-muted/20' : 'bg-muted/10';

    const prestige = getPrestigeFromBadges(userBadges);
    const levelInfo = userProfile ? getPrestigeInfo(userProfile.achievementPoints, prestige) : null;

    const roles = useMemo(() => getRolesFromProfile(userBadges), [ userBadges ]);
    const featuredBadges = useMemo(() => userBadges.slice(0, 2), [ userBadges ]);

    const favGroup = userProfile?.groups?.find(g => g.favourite) ?? null;

    const addFriend = () =>
    {
        if(!userProfile) return;
        setRequestSent(true);
        SendMessageComposer(new RequestFriendComposer(userProfile.username));
    };

    const onBannerSelect = (gifUrl: string | null) =>
    {
        if(gifUrl)
        {
            const found = BANNER_PRESETS.find(p => p.gifUrl === gifUrl);
            if(found)
            {
                setBannerId(found.id);
                SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), found.id);
            }
        }
        else
        {
            setBannerId(DEFAULT_BANNER_ID);
            SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), DEFAULT_BANNER_ID);
        }
        setShowBannerPicker(false);
    };

    const fetchGifs = useCallback(async (query: string) =>
    {
        if(!KLIPY_KEY) return;
        setGifLoading(true);
        try
        {
            const endpoint = query.trim()
                ? `https://api.klipy.com/api/v1/${ KLIPY_KEY }/gifs/search?q=${ encodeURIComponent(query) }&per_page=12&customer_id=banner-picker&locale=de&format_filter=gif,webp`
                : `https://api.klipy.com/api/v1/${ KLIPY_KEY }/gifs/trending?per_page=12&customer_id=banner-picker&locale=de&format_filter=gif,webp`;
            const res = await fetch(endpoint);
            const json = await res.json();
            if(json.result && json.data?.data) setGifResults(json.data.data);
        }
        catch { /* ignore */ }
        finally { setGifLoading(false); }
    }, []);

    useEffect(() =>
    {
        if(showBannerPicker) fetchGifs('');
    }, [ showBannerPicker, fetchGifs ]);

    useEffect(() =>
    {
        if(!showBannerPicker) return;
        if(debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchGifs(gifQuery), 300);
        return () => { if(debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ gifQuery, showBannerPicker, fetchGifs ]);

    useEffect(() =>
    {
        if(editingNote && noteRef.current) noteRef.current.focus();
    }, [ editingNote ]);

    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();
        if(!userProfile || (parser.userId !== userProfile.id)) return;
        setUserBadges(parser.badges);
    });

    useMessageEvent<RelationshipStatusInfoEvent>(RelationshipStatusInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!userProfile || (parser.userId !== userProfile.id)) return;
        setUserRelationships(parser);
    });

    useMessageEvent<UserProfileEvent>(UserProfileEvent, event =>
    {
        const parser = event.getParser();
        let isSameProfile = false;

        setUserProfile(prevValue =>
        {
            if(prevValue && prevValue.id) isSameProfile = (prevValue.id === parser.id);
            return parser;
        });

        if(!isSameProfile)
        {
            setUserBadges([]);
            setUserRelationships(null);
            setShowBannerPicker(false);
            setExpandedGroupId(null);
            setEditingNote(false);
            setGifQuery('');

            const storedNote = GetLocalStorage<string>(getNoteStorageKey(parser.id));
            setNote(storedNote || '');
        }

        setRequestSent(parser.requestSent);
        SendMessageComposer(new UserCurrentBadgesComposer(parser.id));
        SendMessageComposer(new UserRelationshipsComposer(parser.id));
    });

    useMessageEvent<ExtendedProfileChangedMessageEvent>(ExtendedProfileChangedMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.userId != userProfile?.id) return;
        GetUserProfile(parser.userId);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!userProfile) return;
        if(event.category !== RoomObjectCategory.UNIT) return;
        const userData = GetRoomSession().userDataManager.getUserDataByIndex(event.objectId);
        if(userData.type !== RoomObjectType.USER) return;
        GetUserProfile(userData.webID);
    });

    useEffect(() =>
    {
        if(userProfile) setRequestSent(userProfile.requestSent);
    }, [ userProfile ]);

    useEffect(() =>
    {
        const stored = GetLocalStorage<string>(getBannerStorageKey(GetSessionDataManager().userId));
        if(stored) setBannerId(stored);
        else setBannerId(DEFAULT_BANNER_ID);

        const storedEffect = GetLocalStorage<string>(getEffectStorageKey(GetSessionDataManager().userId));
        if(storedEffect) setEffectId(storedEffect);
    }, []);

    if(!userProfile) return null;

    const friendStatusText = (() =>
    {
        if(isOwnProfile) return 'Das bist du';
        if(userProfile.isMyFriend) return 'Freunde';
        if(requestSent || userProfile.requestSent) return 'Anfrage gesendet';
        return null;
    })();

    const saveNote = () =>
    {
        setEditingNote(false);
        SetLocalStorage(getNoteStorageKey(userProfile.id), note);
    };

    const setAndSaveEffect = (id: string | null) =>
    {
        setEffectId(id);
        SetLocalStorage(getEffectStorageKey(GetSessionDataManager().userId), id);
    };

    return (
        <DraggableWindow uniqueKey="nitro-user-profile" windowPosition={ DraggableWindowPosition.CENTER }>
            <TooltipProvider delayDuration={ 200 }>
                <div className="group w-[480px] h-[680px] flex flex-col rounded-xl border border-border/60 shadow-2xl overflow-hidden bg-card">

                    {/* ── Banner ── */}
                    <div
                        className="drag-handler shrink-0 relative h-[120px] cursor-grab active:cursor-grabbing select-none"
                        style={ resolvedBannerUrl
                            ? { backgroundImage: `url(${ resolvedBannerUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: currentBanner.gradient }
                        }
                    >
                        { isOwnProfile && (
                            <Tooltip><TooltipTrigger asChild>
                                <button
                                    onClick={ () => setShowBannerPicker(!showBannerPicker) }
                                    className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all"
                                    onMouseDown={ e => e.stopPropagation() }
                                >
                                    <Pen className="w-3 h-3" />
                                </button>
                            </TooltipTrigger><TooltipContent className="text-[10px]">Banner ändern</TooltipContent></Tooltip>
                        ) }
                        <button
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all"
                            onClick={ onClose }
                            onMouseDown={ e => e.stopPropagation() }
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* ── Banner Picker (KLIPY GIF Search) ── */}
                    { showBannerPicker && (
                        <div className="shrink-0 border-b border-border/20 bg-muted/5 relative z-10">
                            <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={ gifQuery }
                                    onChange={ e => setGifQuery(e.target.value) }
                                    placeholder="Banner suchen..."
                                    className="flex-1 h-7 rounded-md bg-muted/20 border border-border/20 px-2.5 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    onMouseDown={ e => e.stopPropagation() }
                                />
                                <button
                                    onClick={ () => onBannerSelect(null) }
                                    className="shrink-0 h-7 px-2 rounded-md bg-muted/20 border border-border/20 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors"
                                    onMouseDown={ e => e.stopPropagation() }
                                >
                                    Standard
                                </button>
                            </div>
                            <div className="px-3 pb-2.5 grid grid-cols-4 gap-1.5 max-h-[120px] overflow-y-auto scrollbar-none">
                                { gifLoading && gifResults.length === 0 && (
                                    <div className="col-span-4 py-4 text-center text-[10px] text-muted-foreground/40">Laden...</div>
                                ) }
                                { !KLIPY_KEY && BANNER_PRESETS.map(preset => (
                                    <button
                                        key={ preset.id }
                                        onClick={ () => { setBannerId(preset.id); SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), preset.id); setShowBannerPicker(false); } }
                                        className={ `aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer ${ bannerId === preset.id ? 'border-primary/60' : 'border-transparent hover:border-primary/40' }` }
                                        style={ preset.gifUrl ? { backgroundImage: `url(${ preset.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: preset.gradient } }
                                        onMouseDown={ e => e.stopPropagation() }
                                    />
                                )) }
                                { KLIPY_KEY && gifResults.map(gif => (
                                    <button
                                        key={ gif.id }
                                        onClick={ () => { onBannerSelect(gif.file.md.gif.url); } }
                                        className="aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary/60 transition-all cursor-pointer"
                                        onMouseDown={ e => e.stopPropagation() }
                                    >
                                        <img src={ gif.file.sm.webp.url } alt={ gif.title } className="w-full h-full object-cover" loading="lazy" draggable={ false } />
                                    </button>
                                )) }
                            </div>
                            { KLIPY_KEY && <div className="px-3 pb-1.5 text-[9px] text-muted-foreground/30 text-right">Powered by KLIPY</div> }
                        </div>
                    ) }

                    {/* ── Avatar + Actions ── */}
                    <div className="shrink-0 relative z-10 px-5">
                        <div className="flex items-end justify-between -mt-[52px]">
                            <div className="relative">
                                <div className="w-[104px] h-[104px] rounded-full ring-[5px] overflow-hidden ring-card bg-card cursor-pointer" onClick={ () => GetUserProfile(userProfile.id) }>
                                    <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                                </div>
                                <div className={ `absolute bottom-1 right-1 w-5 h-5 rounded-full ring-[3px] ring-card ${ userProfile.isOnline ? 'bg-green-500' : 'bg-muted-foreground/40' }` } />
                            </div>
                            <div className="flex items-center gap-1.5 pb-2">
                                { canSendFriendRequest && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={ addFriend }><UserPlus className="w-3.5 h-3.5" /></Button>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">Freund hinzufügen</TooltipContent></Tooltip>
                                ) }
                                { !isOwnProfile && (requestSent || userProfile.requestSent) && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" disabled><UserPlus className="w-3.5 h-3.5" /></Button>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">Anfrage gesendet</TooltipContent></Tooltip>
                                ) }
                                { !isOwnProfile && userProfile.isMyFriend && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={ () => CreateLinkEvent(`friends/messenger/${ userProfile.username }`) }><MessageCircle className="w-3.5 h-3.5" /></Button>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">Nachricht</TooltipContent></Tooltip>
                                ) }
                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }><DoorOpen className="w-3.5 h-3.5" /></Button>
                                </TooltipTrigger><TooltipContent className="text-[10px]">Räume</TooltipContent></Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Info + Roles + Featured Badges ── */}
                    <div className="shrink-0 relative z-10 px-5 pt-2 pb-3 flex gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold tracking-tight">{ userProfile.username }</span>
                                <span className="text-sm text-muted-foreground/40 font-mono">#{ userProfile.id }</span>
                                { favGroup && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <div className="w-5 h-5 shrink-0">
                                            <LayoutBadgeImageView badgeCode={ favGroup.badgeCode } isGroup />
                                        </div>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">{ favGroup.groupName }</TooltipContent></Tooltip>
                                ) }
                            </div>
                            { userProfile.motto && <p className="text-[12px] text-muted-foreground/50 italic mt-0.5">{ userProfile.motto }</p> }
                            { roles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    { roles.map(r =>
                                    {
                                        const cfg = ROLE_PRESETS[r];
                                        if(!cfg) return null;
                                        return (
                                            <span key={ r } className={ `inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ cfg.bg } ${ cfg.border } ${ cfg.color }` }>
                                                { cfg.label }
                                            </span>
                                        );
                                    }) }
                                </div>
                            ) }
                        </div>

                        { featuredBadges.length > 0 && (
                            <div className="shrink-0 grid grid-cols-2 gap-1.5 self-start">
                                { featuredBadges.map(badge => (
                                    <Tooltip key={ badge }><TooltipTrigger asChild>
                                        <div className={ `w-12 h-12 rounded-lg ${ cardBg } border border-border/15 flex items-center justify-center hover:bg-muted/30 hover:border-border/30 transition-all cursor-default` }>
                                            <LayoutBadgeImageView badgeCode={ badge } />
                                        </div>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">{ badge }</TooltipContent></Tooltip>
                                )) }
                            </div>
                        ) }
                    </div>

                    {/* ── Scrollable Content ── */}
                    <ScrollArea className="flex-1 min-h-0 relative z-10">
                        <div className="px-5 pb-5 space-y-4">

                            {/* ── Über mich ── */}
                            <div className={ `rounded-lg ${ cardBg } border border-border/15 p-3.5` }>
                                <SectionHeader>Über mich</SectionHeader>
                                { userProfile.motto && <p className="text-[12px] text-muted-foreground/70 leading-relaxed">{ userProfile.motto }</p> }

                                <Separator className="my-3 bg-border/20" />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                                        <span className="text-muted-foreground/50">Bahhos-Mitglied seit</span>
                                        <span className="text-muted-foreground/80 font-medium ml-auto">{ userProfile.registration }</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                            <span className={ `w-2 h-2 rounded-full ${ userProfile.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30' }` } />
                                        </div>
                                        <span className="text-muted-foreground/50">Status</span>
                                        <span className="text-muted-foreground/80 font-medium ml-auto">
                                            { userProfile.isOnline ? 'Online' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                                        </span>
                                    </div>
                                </div>

                                <Separator className="my-3 bg-border/20" />

                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium"><Users className="w-3 h-3" />{ userProfile.friendsCount } Freunde</Badge>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium"><Star className="w-3 h-3" />{ userProfile.achievementPoints } Erfolge</Badge>
                                    { levelInfo && (
                                        <Tooltip><TooltipTrigger asChild>
                                            <div className="inline-flex items-center gap-1.5">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium">
                                                    { prestige > 0 && `P${ prestige } ` }Lv.{ levelInfo.displayLevel }
                                                </Badge>
                                                <div className="w-12"><Progress value={ levelInfo.progress * 100 } className="h-1" /></div>
                                            </div>
                                        </TooltipTrigger><TooltipContent className="text-[10px]">Level { levelInfo.displayLevel } — { Math.round(levelInfo.progress * 100) }% zum nächsten</TooltipContent></Tooltip>
                                    ) }
                                    <div className="flex-1" />
                                    { isOwnProfile && <Badge variant="outline" className="text-[10px] h-5 px-2 text-muted-foreground/50">Das bist du</Badge> }
                                    { !isOwnProfile && userProfile.isMyFriend && <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 text-green-500/70 border-green-500/20"><Heart className="w-2.5 h-2.5 fill-current" />Freunde</Badge> }
                                    { !isOwnProfile && !userProfile.isMyFriend && (requestSent || userProfile.requestSent) && <Badge variant="outline" className="text-[10px] h-5 px-2 text-muted-foreground/40">Anfrage gesendet</Badge> }
                                </div>
                            </div>

                            {/* ── Notiz (nur fremdes Profil) ── */}
                            { !isOwnProfile && (
                                <div>
                                    <SectionHeader action={
                                        <button onClick={ () => setEditingNote(true) } className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                                            <Pen className="w-3 h-3" />
                                        </button>
                                    }>Notiz</SectionHeader>
                                    { editingNote ? (
                                        <textarea
                                            ref={ noteRef }
                                            value={ note }
                                            onChange={ e => setNote(e.target.value) }
                                            onBlur={ saveNote }
                                            onKeyDown={ e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); } } }
                                            placeholder="Klicke um eine Notiz hinzuzufügen..."
                                            className={ `w-full rounded-md ${ cardBgLight } border border-border/20 px-3 py-2 text-[11px] text-muted-foreground/70 placeholder:text-muted-foreground/25 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[60px]` }
                                            rows={ 3 }
                                        />
                                    ) : (
                                        <button onClick={ () => setEditingNote(true) } className={ `w-full text-left rounded-md ${ cardBgLight } border border-border/10 px-3 py-2 hover:bg-muted/20 transition-colors min-h-[36px]` }>
                                            <span className={ `text-[11px] ${ note ? 'text-muted-foreground/60' : 'text-muted-foreground/25 italic' }` }>
                                                { note || 'Klicke um eine Notiz hinzuzufügen...' }
                                            </span>
                                        </button>
                                    ) }
                                </div>
                            ) }

                            {/* ── Badges ── */}
                            <div>
                                <SectionHeader>Badges</SectionHeader>
                                { userBadges && userBadges.length > 0 ? (
                                    <div className="grid grid-cols-8 gap-1">
                                        { userBadges.map(badge => (
                                            <Tooltip key={ badge }><TooltipTrigger asChild>
                                                <div className={ `aspect-square rounded-md ${ cardBg } border border-border/15 flex items-center justify-center hover:bg-muted/40 hover:border-border/30 transition-all cursor-default` }>
                                                    <LayoutBadgeImageView badgeCode={ badge } />
                                                </div>
                                            </TooltipTrigger><TooltipContent className="text-[10px]">{ badge }</TooltipContent></Tooltip>
                                        )) }
                                    </div>
                                ) : (
                                    <div className={ `rounded-lg ${ cardBgLight } border border-border/10 py-5 text-center text-[11px] text-muted-foreground/30` }>Keine Badges</div>
                                ) }
                            </div>

                            {/* ── Beziehungen ── */}
                            <div>
                                <SectionHeader>Beziehungen</SectionHeader>
                                <div className="space-y-1">
                                    { [ RelationshipStatusEnum.HEART, RelationshipStatusEnum.SMILE, RelationshipStatusEnum.BOBBA ].map(type =>
                                    {
                                        const c = REL_CONFIG[type];
                                        const Icon = c.icon;
                                        const info = userRelationships?.relationshipStatusMap?.hasKey(type)
                                            ? userRelationships.relationshipStatusMap.getValue(type)
                                            : null;
                                        const hasData = info && info.friendCount > 0;

                                        return (
                                            <div key={ type } className={ `flex items-center gap-2.5 rounded-md ${ cardBgLight } border border-border/10 px-2.5 py-2 hover:bg-muted/20 transition-colors` }>
                                                <div className={ `w-7 h-7 rounded-full ${ c.bg } flex items-center justify-center shrink-0` }><Icon className={ `w-3.5 h-3.5 ${ c.color }` } /></div>
                                                <div className="flex-1 min-w-0">
                                                    { hasData ? (
                                                        <span
                                                            className="text-[12px] font-medium cursor-pointer hover:underline"
                                                            onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }
                                                        >
                                                            { info.randomFriendName }
                                                        </span>
                                                    ) : (
                                                        <span className="text-[12px] font-medium text-muted-foreground/30">Noch niemand</span>
                                                    ) }
                                                    { hasData && info.friendCount > 1 && <span className="text-[10px] text-muted-foreground/30 ml-1.5">+{ info.friendCount - 1 }</span> }
                                                </div>
                                                { hasData && info.randomFriendFigure && (
                                                    <div className="w-6 h-6 rounded-full border border-border/20 bg-muted/20 shrink-0 overflow-hidden cursor-pointer" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                                        <LayoutAvatarImageView figure={ info.randomFriendFigure } headOnly direction={ 4 } />
                                                    </div>
                                                ) }
                                            </div>
                                        );
                                    }) }
                                </div>
                            </div>

                            {/* ── Gruppen ── */}
                            <div>
                                <SectionHeader>Gruppen</SectionHeader>
                                { userProfile.groups && userProfile.groups.length > 0 ? (
                                    <div className="space-y-1.5">
                                        { userProfile.groups.map(g => (
                                            <div key={ g.groupId }>
                                                <button
                                                    onClick={ () => setExpandedGroupId(expandedGroupId === g.groupId ? null : g.groupId) }
                                                    className={ `w-full flex items-center gap-2.5 rounded-md ${ cardBgLight } border border-border/10 px-2.5 py-2 hover:bg-muted/20 transition-colors text-left` }
                                                >
                                                    <div className="w-8 h-8 shrink-0">
                                                        <LayoutBadgeImageView badgeCode={ g.badgeCode } isGroup />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[12px] font-medium truncate">{ g.groupName }</span>
                                                            { g.favourite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" /> }
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={ `w-3.5 h-3.5 text-muted-foreground/30 shrink-0 transition-transform ${ expandedGroupId === g.groupId ? 'rotate-90' : '' }` } />
                                                </button>
                                                { expandedGroupId === g.groupId && (
                                                    <div className="ml-[42px] mt-1 rounded-md bg-muted/5 border border-border/10 px-3 py-2.5">
                                                        <p className="text-[11px] text-muted-foreground/50 leading-relaxed">Gruppe anzeigen</p>
                                                    </div>
                                                ) }
                                            </div>
                                        )) }
                                    </div>
                                ) : (
                                    <div className={ `rounded-lg ${ cardBgLight } border border-border/10 py-5 text-center text-[11px] text-muted-foreground/30 flex flex-col items-center gap-1.5` }>
                                        <Users className="w-5 h-5" />Keine Gruppen
                                    </div>
                                ) }
                            </div>

                        </div>
                    </ScrollArea>

                    {/* ── Profile Effect Overlay ── */}
                    { activeEffect && <ProfileEffectRenderer key={ activeEffect.id } effect={ activeEffect } /> }
                </div>

                {/* ── Effect Picker (only for own profile) ── */}
                { isOwnProfile && (
                    <div className="mt-2 rounded-xl border border-border/40 bg-card/90 backdrop-blur-md px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                            <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0"><Sparkles className="w-3 h-3 inline -mt-0.5" /> Effekt</span>
                            <Tooltip><TooltipTrigger asChild>
                                <button
                                    onClick={ () => setAndSaveEffect(null) }
                                    className={ `shrink-0 w-8 h-8 rounded-md border-2 transition-all flex items-center justify-center ${ !effectId ? 'border-primary ring-1 ring-primary/30' : 'border-border/30 hover:border-border/60' } bg-muted/20` }
                                >
                                    <X className="w-3 h-3 text-muted-foreground/50" />
                                </button>
                            </TooltipTrigger><TooltipContent className="text-[10px]">Kein Effekt</TooltipContent></Tooltip>
                            { PROFILE_EFFECTS.map(pe => (
                                <Tooltip key={ pe.id }><TooltipTrigger asChild>
                                    <button
                                        onClick={ () => setAndSaveEffect(pe.id) }
                                        className={ `shrink-0 w-8 h-8 rounded-md overflow-hidden border-2 transition-all ${ effectId === pe.id ? 'border-purple-500 ring-1 ring-purple-500/30 scale-110' : 'border-transparent hover:border-border/60' }` }
                                    >
                                        <img src={ pe.thumbnailSrc } alt={ pe.title } className="w-full h-full object-cover" draggable={ false } />
                                    </button>
                                </TooltipTrigger><TooltipContent className="text-[10px]">{ pe.title }</TooltipContent></Tooltip>
                            )) }
                        </div>
                    </div>
                ) }
            </TooltipProvider>
        </DraggableWindow>
    );
};
