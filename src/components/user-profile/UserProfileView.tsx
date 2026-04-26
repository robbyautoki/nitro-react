import { ExtendedProfileChangedMessageEvent, FriendlyTime, RelationshipStatusEnum, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer, RequestFriendComposer } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Pen, Heart, Smile, UserPlus, MessageCircle, DoorOpen, Star, Users, Shield, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { CreateLinkEvent, GetLocalStorage, GetRoomSession, GetSessionDataManager, GetUserProfile, SendMessageComposer, SetLocalStorage } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { ROLE_PRESETS } from './ProfileEffects';
import { BANNER_PRESETS, DEFAULT_BANNER_ID } from './BannerPresets';
import { useEquippedAssets } from '../discord-shop/useEquippedAssets';

interface KlipyGif { id: number; slug: string; title: string; file: { md: { gif: { url: string } }; sm: { webp: { url: string } } } }

const KLIPY_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_KLIPY_API_KEY) || '';
const Tooltip = AlignTooltip.Root;
const TooltipContent = AlignTooltip.Content;
const TooltipProvider = AlignTooltip.Provider;
const TooltipTrigger = AlignTooltip.Trigger;

const getBannerStorageKey = (userId: number) => `nitro.profile.banner.${ userId }`;
const getNoteStorageKey = (targetId: number) => `nitro.profile.note.${ targetId }`;

const REL_CONFIG: Record<number, { icon: typeof Heart; color: string; bg: string; label: string }> = {
    [RelationshipStatusEnum.HEART]: { icon: Heart, color: 'text-error-base', bg: 'bg-error-lighter', label: 'Herz' },
    [RelationshipStatusEnum.SMILE]: { icon: Smile, color: 'text-warning-base', bg: 'bg-warning-lighter', label: 'Smiley' },
    [RelationshipStatusEnum.BOBBA]: { icon: Shield, color: 'text-information-base', bg: 'bg-information-lighter', label: 'Bobba' },
};

const ROLE_BADGE_COLOR: Record<string, 'gray' | 'blue' | 'orange' | 'red' | 'green' | 'yellow' | 'purple' | 'sky' | 'pink' | 'teal'> = {
    founder: 'yellow',
    admin: 'red',
    mod: 'blue',
    vip: 'purple',
    trader: 'green',
    builder: 'sky',
};

function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode })
{
    return (
        <div className="flex items-center justify-between mb-2">
            <span className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ children }</span>
            { action }
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
    const equippedAssets = useEquippedAssets(userProfile?.id ?? 0, !!userProfile?.id);
    const nameplateUrl = equippedAssets.nameplate?.staticUrl || null;
    const decorationUrl = equippedAssets.avatarDecoration?.animatedUrl || equippedAssets.avatarDecoration?.staticUrl || null;

    const currentBanner = useMemo(() =>
        BANNER_PRESETS.find(p => p.id === bannerId) || BANNER_PRESETS[BANNER_PRESETS.length - 1],
    [ bannerId ]);

    const resolvedBannerUrl = currentBanner.gifUrl ?? null;
    const prestige = getPrestigeFromBadges(userBadges);
    const levelInfo = userProfile ? getPrestigeInfo(userProfile.achievementPoints, prestige) : null;

    const roles = useMemo(() => getRolesFromProfile(userBadges), [ userBadges ]);
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
    }, []);

    if(!userProfile) return null;

    const saveNote = () =>
    {
        setEditingNote(false);
        SetLocalStorage(getNoteStorageKey(userProfile.id), note);
    };

    const visibleProfileBadges = userBadges.slice(0, 8);
    const remainingProfileBadges = Math.max(0, userBadges.length - visibleProfileBadges.length);
    const visibleGroups = userProfile.groups?.slice(0, 3) ?? [];
    const remainingGroups = Math.max(0, (userProfile.groups?.length ?? 0) - visibleGroups.length);
    const levelPercent = levelInfo ? Math.round(levelInfo.progress * 100) : 0;
    const statusText = userProfile.isOnline ? 'Online' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2);

    return (
        <DraggableWindow uniqueKey="nitro-user-profile" windowPosition={ DraggableWindowPosition.CENTER }>
            <TooltipProvider delayDuration={ 200 }>
                <AlignSurface.Panel className="group nitro-user-profile relative w-[720px] max-w-[calc(100vw-32px)] overflow-hidden">
                    <div
                        className="drag-handler relative h-24 cursor-grab select-none active:cursor-grabbing"
                        style={ resolvedBannerUrl
                            ? { backgroundImage: `url(${ resolvedBannerUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: currentBanner.gradient }
                        }
                    >
                        { isOwnProfile && (
                            <Tooltip><TooltipTrigger asChild>
                                <AlignButton.Root
                                    variant="neutral"
                                    mode="lighter"
                                    size="xxsmall"
                                    onClick={ () => setShowBannerPicker(!showBannerPicker) }
                                    className="absolute left-3 top-3 z-20 size-8 rounded-full p-0 backdrop-blur-sm"
                                    onMouseDown={ e => e.stopPropagation() }
                                >
                                    <AlignButton.Icon as={ Pen } className="size-3.5" />
                                </AlignButton.Root>
                            </TooltipTrigger><TooltipContent size="xsmall">Banner ändern</TooltipContent></Tooltip>
                        ) }
                        <AlignButton.Root
                            variant="neutral"
                            mode="lighter"
                            size="xxsmall"
                            className="absolute right-3 top-3 z-20 size-8 rounded-full p-0 backdrop-blur-sm"
                            onClick={ onClose }
                            onMouseDown={ e => e.stopPropagation() }
                        >
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>

                        { showBannerPicker && (
                            <div className="absolute left-3 right-3 top-12 z-30 rounded-2xl bg-bg-white-0 p-3 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200" onMouseDown={ e => e.stopPropagation() }>
                                <div className="flex items-center gap-2">
                                    <AlignInput.Root size="xsmall" className="flex-1">
                                        <AlignInput.Wrapper className="h-7">
                                            <AlignInput.Input
                                                type="text"
                                                value={ gifQuery }
                                                onChange={ e => setGifQuery(e.target.value) }
                                                placeholder="Banner suchen..."
                                                className="h-7 text-paragraph-xs"
                                            />
                                        </AlignInput.Wrapper>
                                    </AlignInput.Root>
                                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" onClick={ () => onBannerSelect(null) }>
                                        Standard
                                    </AlignButton.Root>
                                </div>
                                <div className="mt-2 grid grid-cols-4 gap-1.5">
                                    { gifLoading && gifResults.length === 0 && (
                                        <div className="col-span-4 py-3 text-center text-paragraph-xs text-text-soft-400">Laden...</div>
                                    ) }
                                    { !KLIPY_KEY && BANNER_PRESETS.slice(0, 8).map(preset => (
                                        <button
                                            key={ preset.id }
                                            onClick={ () => { setBannerId(preset.id); SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), preset.id); setShowBannerPicker(false); } }
                                            className={ `aspect-video overflow-hidden rounded-lg ring-1 ring-inset transition ${ bannerId === preset.id ? 'ring-primary-base' : 'ring-stroke-soft-200 hover:ring-primary-base' }` }
                                            style={ preset.gifUrl ? { backgroundImage: `url(${ preset.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: preset.gradient } }
                                        />
                                    )) }
                                    { KLIPY_KEY && gifResults.slice(0, 8).map(gif => (
                                        <button
                                            key={ gif.id }
                                            onClick={ () => { onBannerSelect(gif.file.md.gif.url); } }
                                            className="aspect-video overflow-hidden rounded-lg ring-1 ring-inset ring-stroke-soft-200 transition hover:ring-primary-base"
                                        >
                                            <img src={ gif.file.sm.webp.url } alt={ gif.title } className="h-full w-full object-cover" loading="lazy" draggable={ false } />
                                        </button>
                                    )) }
                                </div>
                                { KLIPY_KEY && <div className="mt-1 text-right text-subheading-2xs text-text-soft-400">Powered by KLIPY</div> }
                            </div>
                        ) }
                    </div>

                    <div className="grid grid-cols-1 gap-4 bg-bg-weak-50 p-4 pt-0 md:grid-cols-[250px_minmax(0,1fr)]">
                        <div className="relative z-10 -mt-10 rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            <div className="flex items-end gap-3">
                                <button className="relative flex size-24 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-md ring-4 ring-bg-white-0" onClick={ () => GetUserProfile(userProfile.id) }>
                                    <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                                    { decorationUrl && <img src={ decorationUrl } alt="" className="pointer-events-none absolute -inset-3 z-10 h-[120px] w-[120px] object-contain" draggable={ false } /> }
                                    <span className={ `absolute bottom-2 right-2 z-20 size-3 rounded-full ring-2 ring-bg-white-0 ${ userProfile.isOnline ? 'bg-success-base' : 'bg-faded-base' }` } />
                                </button>
                                <div className="min-w-0 flex-1 pb-1">
                                    <div className="truncate text-label-lg text-text-strong-950">{ userProfile.username }</div>
                                    <div className="font-mono text-paragraph-xs text-text-soft-400">#{ userProfile.id }</div>
                                </div>
                            </div>

                            { nameplateUrl && (
                                <button className="mt-3 flex w-full justify-center rounded-xl bg-bg-weak-50 px-3 py-2 ring-1 ring-inset ring-stroke-soft-200" onClick={ () => GetUserProfile(userProfile.id) }>
                                    <img src={ nameplateUrl } alt="" className="h-8 max-w-full object-contain" draggable={ false } />
                                </button>
                            ) }

                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <AlignBadge.Root color={ userProfile.isOnline ? 'green' : 'gray' } variant="lighter" size="small">
                                    <AlignBadge.Dot />{ statusText }
                                </AlignBadge.Root>
                                { isOwnProfile && <AlignBadge.Root color="gray" variant="lighter" size="small">Du</AlignBadge.Root> }
                                { !isOwnProfile && userProfile.isMyFriend && <AlignBadge.Root color="green" variant="lighter" size="small"><AlignBadge.Icon as={ Heart } className="size-3 fill-current" />Freunde</AlignBadge.Root> }
                                { !isOwnProfile && !userProfile.isMyFriend && (requestSent || userProfile.requestSent) && <AlignBadge.Root color="gray" variant="stroke" size="small">Anfrage gesendet</AlignBadge.Root> }
                                { favGroup && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <span className="inline-flex size-6 items-center justify-center rounded-md bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            <LayoutBadgeImageView badgeCode={ favGroup.badgeCode } isGroup />
                                        </span>
                                    </TooltipTrigger><TooltipContent size="xsmall">{ favGroup.groupName }</TooltipContent></Tooltip>
                                ) }
                                { roles.map(r =>
                                {
                                    const cfg = ROLE_PRESETS[r];
                                    if(!cfg) return null;
                                    return <AlignBadge.Root key={ r } color={ ROLE_BADGE_COLOR[r] ?? 'gray' } variant="lighter" size="small">{ cfg.label }</AlignBadge.Root>;
                                }) }
                            </div>

                            <div className="mt-3 rounded-xl bg-bg-weak-50 px-3 py-2 ring-1 ring-inset ring-stroke-soft-200">
                                <p className="line-clamp-2 text-paragraph-xs italic text-text-sub-600">{ userProfile.motto || '...' }</p>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5">
                                { canSendFriendRequest && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="size-8 rounded-full p-0" onClick={ addFriend }><AlignButton.Icon as={ UserPlus } className="size-3.5" /></AlignButton.Root>
                                    </TooltipTrigger><TooltipContent size="xsmall">Freund hinzufügen</TooltipContent></Tooltip>
                                ) }
                                { !isOwnProfile && (requestSent || userProfile.requestSent) && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="size-8 rounded-full p-0" disabled><AlignButton.Icon as={ UserPlus } className="size-3.5" /></AlignButton.Root>
                                    </TooltipTrigger><TooltipContent size="xsmall">Anfrage gesendet</TooltipContent></Tooltip>
                                ) }
                                { !isOwnProfile && userProfile.isMyFriend && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="size-8 rounded-full p-0" onClick={ () => CreateLinkEvent(`friends/messenger/${ userProfile.username }`) }><AlignButton.Icon as={ MessageCircle } className="size-3.5" /></AlignButton.Root>
                                    </TooltipTrigger><TooltipContent size="xsmall">Nachricht</TooltipContent></Tooltip>
                                ) }
                                <Tooltip><TooltipTrigger asChild>
                                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="size-8 rounded-full p-0" onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }><AlignButton.Icon as={ DoorOpen } className="size-3.5" /></AlignButton.Root>
                                </TooltipTrigger><TooltipContent size="xsmall">Räume</TooltipContent></Tooltip>
                            </div>
                        </div>

                        <div className="min-w-0 space-y-3 pt-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <SectionHeader>Über mich</SectionHeader>
                                    <div className="space-y-2 text-paragraph-xs">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3.5 shrink-0 text-text-soft-400" />
                                            <span className="text-text-sub-600">Mitglied seit</span>
                                            <span className="ml-auto text-label-xs text-text-strong-950">{ userProfile.registration }</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={ `size-2 shrink-0 rounded-full ${ userProfile.isOnline ? 'bg-success-base' : 'bg-faded-base' }` } />
                                            <span className="text-text-sub-600">Status</span>
                                            <span className="ml-auto text-label-xs text-text-strong-950">{ statusText }</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <SectionHeader>Stats</SectionHeader>
                                    <div className="flex flex-wrap gap-1.5">
                                        <AlignBadge.Root color="gray" variant="lighter" size="small"><AlignBadge.Icon as={ Users } className="size-3" />{ userProfile.friendsCount } Freunde</AlignBadge.Root>
                                        <AlignBadge.Root color="yellow" variant="lighter" size="small"><AlignBadge.Icon as={ Star } className="size-3" />{ userProfile.achievementPoints } Erfolge</AlignBadge.Root>
                                        { levelInfo && <AlignBadge.Root color="blue" variant="lighter" size="small">{ prestige > 0 && `P${ prestige } ` }Lv.{ levelInfo.displayLevel }</AlignBadge.Root> }
                                    </div>
                                    { levelInfo && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <AlignProgressBar.Root value={ levelPercent } color="green" className="h-1.5" />
                                            <span className="w-8 text-right text-paragraph-xs tabular-nums text-text-soft-400">{ levelPercent }%</span>
                                        </div>
                                    ) }
                                </div>
                            </div>

                            { !isOwnProfile && (
                                <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <SectionHeader action={
                                        <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setEditingNote(true) }>
                                            <AlignButton.Icon as={ Pen } className="size-3" />
                                        </AlignButton.Root>
                                    }>Notiz</SectionHeader>
                                    { editingNote ? (
                                        <AlignTextarea.Root
                                            ref={ noteRef }
                                            value={ note }
                                            onChange={ e => setNote(e.target.value) }
                                            onBlur={ saveNote }
                                            onKeyDown={ e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); } } }
                                            placeholder="Klicke um eine Notiz hinzuzufügen..."
                                            containerClassName="bg-bg-weak-50"
                                            rows={ 2 }
                                        />
                                    ) : (
                                        <button onClick={ () => setEditingNote(true) } className="min-h-9 w-full rounded-xl bg-bg-weak-50 px-3 py-2 text-left ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-white-0">
                                            <span className={ `line-clamp-2 text-paragraph-xs ${ note ? 'text-text-sub-600' : 'italic text-text-soft-400' }` }>
                                                { note || 'Klicke um eine Notiz hinzuzufügen...' }
                                            </span>
                                        </button>
                                    ) }
                                </div>
                            ) }

                            <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <SectionHeader action={ remainingProfileBadges > 0 && <span className="text-paragraph-xs text-text-soft-400">+{ remainingProfileBadges }</span> }>Badges</SectionHeader>
                                { userBadges && userBadges.length > 0 ? (
                                    <div className="grid grid-cols-8 gap-1.5">
                                        { visibleProfileBadges.map(badge => (
                                            <Tooltip key={ badge }><TooltipTrigger asChild>
                                                <div className="flex aspect-square items-center justify-center rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-white-0">
                                                    <LayoutBadgeImageView badgeCode={ badge } />
                                                </div>
                                            </TooltipTrigger><TooltipContent size="xsmall">{ badge }</TooltipContent></Tooltip>
                                        )) }
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-bg-weak-50 py-4 text-center text-paragraph-xs text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200">Keine Badges</div>
                                ) }
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <SectionHeader>Beziehungen</SectionHeader>
                                    <div className="space-y-1.5">
                                        { [ RelationshipStatusEnum.HEART, RelationshipStatusEnum.SMILE, RelationshipStatusEnum.BOBBA ].map(type =>
                                        {
                                            const c = REL_CONFIG[type];
                                            const Icon = c.icon;
                                            const info = userRelationships?.relationshipStatusMap?.hasKey(type)
                                                ? userRelationships.relationshipStatusMap.getValue(type)
                                                : null;
                                            const hasData = info && info.friendCount > 0;

                                            return (
                                                <div key={ type } className="flex items-center gap-2 rounded-xl bg-bg-weak-50 px-2 py-1.5 ring-1 ring-inset ring-stroke-soft-200">
                                                    <div className={ `flex size-7 shrink-0 items-center justify-center rounded-full ${ c.bg }` }><Icon className={ `size-3.5 ${ c.color }` } /></div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ c.label }</div>
                                                        { hasData ? (
                                                            <button className="block max-w-full truncate text-left text-label-xs text-text-strong-950 hover:underline" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                                                { info.randomFriendName }
                                                            </button>
                                                        ) : (
                                                            <span className="text-paragraph-xs text-text-soft-400">Nicht gesetzt</span>
                                                        ) }
                                                    </div>
                                                    { hasData && info.friendCount > 1 && <AlignBadge.Root color="gray" variant="lighter" size="small">+{ info.friendCount - 1 }</AlignBadge.Root> }
                                                </div>
                                            );
                                        }) }
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <SectionHeader action={ remainingGroups > 0 && <span className="text-paragraph-xs text-text-soft-400">+{ remainingGroups }</span> }>Gruppen</SectionHeader>
                                    { visibleGroups.length > 0 ? (
                                        <div className="space-y-1.5">
                                            { visibleGroups.map(g => (
                                                <button
                                                    key={ g.groupId }
                                                    onClick={ () => setExpandedGroupId(expandedGroupId === g.groupId ? null : g.groupId) }
                                                    className={ `flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left ring-1 ring-inset transition ${ expandedGroupId === g.groupId ? 'bg-primary-alpha-10 ring-primary-base' : 'bg-bg-weak-50 ring-stroke-soft-200 hover:bg-bg-white-0' }` }
                                                >
                                                    <span className="flex size-8 shrink-0 items-center justify-center">
                                                        <LayoutBadgeImageView badgeCode={ g.badgeCode } isGroup />
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-label-xs text-text-strong-950">{ g.groupName }</span>
                                                    { g.favourite && <Star className="size-3 shrink-0 fill-warning-base text-warning-base" /> }
                                                    <ChevronRight className={ `size-3.5 shrink-0 text-text-soft-400 transition-transform ${ expandedGroupId === g.groupId ? 'rotate-90' : '' }` } />
                                                </button>
                                            )) }
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-bg-weak-50 py-4 text-paragraph-xs text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200">
                                            <Users className="size-4" />Keine Gruppen
                                        </div>
                                    ) }
                                </div>
                            </div>

                        </div>
                    </div>

                    { isOwnProfile && (
                        <div className="border-t border-stroke-soft-200 bg-bg-white-0 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex shrink-0 items-center gap-1 text-subheading-2xs font-medium text-text-sub-600"><Sparkles className="size-3" />Shop-Assets</span>
                                <div className="min-w-0 flex-1 truncate text-paragraph-xs text-text-sub-600">
                                    { equippedAssets.profileEffect?.name || equippedAssets.nameplate?.name || equippedAssets.avatarDecoration?.name || 'Keine Shop-Assets ausgerüstet' }
                                </div>
                                <AlignButton.Root variant="primary" mode="lighter" size="xxsmall" onClick={ () => CreateLinkEvent('catalog/open/discord_effects') }>
                                    Katalog öffnen
                                </AlignButton.Root>
                            </div>
                        </div>
                    ) }
                </AlignSurface.Panel>

            </TooltipProvider>
        </DraggableWindow>
    );
};
