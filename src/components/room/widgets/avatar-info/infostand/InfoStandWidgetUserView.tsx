import { RelationshipStatusEnum, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomSessionFavoriteGroupUpdateEvent, RoomSessionUserBadgesEvent, RoomSessionUserFigureUpdateEvent, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, FocusEvent, KeyboardEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Heart, Smile, Shield, X, Pen, Star, Users, Calendar, Hand } from 'lucide-react';
import { AvatarInfoUser, CloneObject, GetConfiguration, GetGroupInformation, GetLocalStorage, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../../../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../../common';
import { useMessageEvent, useRoom, useRoomSessionManagerEvent } from '../../../../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/reui-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PROFILE_EFFECTS, ProfileEffectData, ROLE_PRESETS } from '../../../../user-profile/ProfileEffects';

const DEFAULT_EFFECT_ID = 'sakura-dreams';
const EFFECT_STORAGE_KEY = 'nitro.infostand.effect';

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
        <img src={ src } alt="" draggable={ false } decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" style={ { willChange: 'transform', transform: 'translateZ(0)' } } />
    );
}

function ProfileEffectRenderer({ effect }: { effect: ProfileEffectData })
{
    const sorted = useMemo(() => [ ...effect.effects ].sort((a, b) => a.zIndex - b.zIndex), [ effect ]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1] opacity-100 group-hover:opacity-20 transition-opacity duration-500" style={ { willChange: 'transform, opacity', transform: 'translateZ(0)' } }>
            { sorted.map((layer, i) => (
                <div key={ `${ effect.id }-${ i }` } className="absolute inset-0" style={ { zIndex: layer.zIndex } }>
                    <SpriteLayer src={ layer.src } startDelay={ layer.start } />
                </div>
            )) }
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode })
{
    return <div className="text-[10px] uppercase tracking-wider font-semibold text-white/25 mb-1.5">{ children }</div>;
}

function getRolesFromBadges(badges: string[]): string[]
{
    const roles: string[] = [];
    if(badges.some(b => b === 'ADM' || b.startsWith('ADM'))) roles.push('admin');
    if(badges.some(b => b === 'MOD' || b.startsWith('MOD'))) roles.push('mod');
    if(badges.some(b => b === 'VIP' || b.startsWith('VIP') || b === 'HC1')) roles.push('vip');
    return roles;
}

const REL_CONFIG: Record<number, { icon: typeof Heart; color: string; bg: string; label: string }> = {
    [RelationshipStatusEnum.HEART]: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Herz' },
    [RelationshipStatusEnum.SMILE]: { icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Smiley' },
    [RelationshipStatusEnum.BOBBA]: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Bobba' },
};

interface InfoStandWidgetUserViewProps
{
    avatarInfo: AvatarInfoUser;
    setAvatarInfo: Dispatch<SetStateAction<AvatarInfoUser>>;
    onClose: () => void;
}

export const InfoStandWidgetUserView: FC<InfoStandWidgetUserViewProps> = props =>
{
    const { avatarInfo = null, setAvatarInfo = null, onClose = null } = props;
    const [ motto, setMotto ] = useState<string>(null);
    const [ isEditingMotto, setIsEditingMotto ] = useState(false);
    const [ relationships, setRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const { roomSession = null } = useRoom();

    const [ effectId ] = useState<string | null>(() =>
    {
        const stored = GetLocalStorage<string>(EFFECT_STORAGE_KEY);
        return stored || DEFAULT_EFFECT_ID;
    });

    const activeEffect = PROFILE_EFFECTS.find(e => e.id === effectId);
    const roles = useMemo(() => getRolesFromBadges(avatarInfo?.badges || []), [ avatarInfo?.badges ]);
    const prestige = useMemo(() => getPrestigeFromBadges(avatarInfo?.badges || []), [ avatarInfo?.badges ]);
    const levelInfo = avatarInfo ? getPrestigeInfo(avatarInfo.achievementScore, prestige) : null;
    const isOwnUser = avatarInfo?.type === AvatarInfoUser.OWN_USER;

    const saveMotto = (motto: string) =>
    {
        if(!isEditingMotto || (motto.length > GetConfiguration<number>('motto.max.length', 38))) return;
        roomSession.sendMottoMessage(motto);
        setIsEditingMotto(false);
    };

    const onMottoBlur = (event: FocusEvent<HTMLInputElement>) => saveMotto(event.target.value);

    const onMottoKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        event.stopPropagation();
        if(event.key === 'Enter') saveMotto((event.target as HTMLInputElement).value);
    };

    useRoomSessionManagerEvent<RoomSessionUserBadgesEvent>(RoomSessionUserBadgesEvent.RSUBE_BADGES, event =>
    {
        if(!avatarInfo || (avatarInfo.webID !== event.userId)) return;
        const oldBadges = avatarInfo.badges.join('');
        if(oldBadges === event.badges.join('')) return;
        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);
            newValue.badges = event.badges;
            return newValue;
        });
    });

    useRoomSessionManagerEvent<RoomSessionUserFigureUpdateEvent>(RoomSessionUserFigureUpdateEvent.USER_FIGURE, event =>
    {
        if(!avatarInfo || (avatarInfo.roomIndex !== event.roomIndex)) return;
        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);
            newValue.figure = event.figure;
            newValue.motto = event.customInfo;
            newValue.achievementScore = event.activityPoints;
            return newValue;
        });
    });

    useRoomSessionManagerEvent<RoomSessionFavoriteGroupUpdateEvent>(RoomSessionFavoriteGroupUpdateEvent.FAVOURITE_GROUP_UPDATE, event =>
    {
        if(!avatarInfo || (avatarInfo.roomIndex !== event.roomIndex)) return;
        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);
            const clearGroup = ((event.status === -1) || (event.habboGroupId <= 0));
            newValue.groupId = clearGroup ? -1 : event.habboGroupId;
            newValue.groupName = clearGroup ? null : event.habboGroupName;
            newValue.groupBadgeId = clearGroup ? null : GetSessionDataManager().getGroupBadge(event.habboGroupId);
            return newValue;
        });
    });

    useMessageEvent<RelationshipStatusInfoEvent>(RelationshipStatusInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!avatarInfo || (avatarInfo.webID !== parser.userId)) return;
        setRelationships(parser);
    });

    useEffect(() =>
    {
        setIsEditingMotto(false);
        setMotto(avatarInfo.motto);
        SendMessageComposer(new UserRelationshipsComposer(avatarInfo.webID));
        return () =>
        {
            setIsEditingMotto(false);
            setMotto(null);
            setRelationships(null);
        };
    }, [ avatarInfo ]);

    if(!avatarInfo) return null;

    return (
        <TooltipProvider delayDuration={ 200 }>
            <div className="group nitro-infostand relative rounded-xl overflow-hidden flex flex-col">

                {/* ── Header ── */}
                <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <button className="shrink-0 hover:opacity-80 transition-opacity" onClick={ () => GetUserProfile(avatarInfo.webID) }>
                            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                                <LayoutAvatarImageView figure={ avatarInfo.figure } headOnly direction={ 2 } className="!absolute -top-1" />
                            </div>
                        </button>
                        <div className="min-w-0">
                            <span className="text-[13px] font-bold truncate text-white block leading-tight">{ avatarInfo.name }</span>
                            <span className="text-[9px] text-white/25 font-mono">#{ avatarInfo.webID }</span>
                        </div>
                        { roles.length > 0 && (
                            <div className="flex gap-1 shrink-0">
                                { roles.map(r =>
                                {
                                    const cfg = ROLE_PRESETS[r];
                                    if(!cfg) return null;
                                    return (
                                        <span key={ r } className={ `inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${ cfg.bg } ${ cfg.border } ${ cfg.color }` }>
                                            { cfg.label }
                                        </span>
                                    );
                                }) }
                            </div>
                        ) }
                    </div>
                    <button className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" onClick={ onClose }>
                        <X className="w-3 h-3 text-white/40" />
                    </button>
                </div>

                <div className="relative z-10 h-px shrink-0" style={ { background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' } } />

                {/* ── Scrollable Content ── */}
                <ScrollArea className="flex-1 min-h-0 relative z-10">
                    <div className="px-3 py-2 space-y-2.5">

                        {/* ── Avatar + Badge Grid ── */}
                        <div className="flex gap-2.5">
                            <div className="shrink-0 w-[80px] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:ring-1 hover:ring-white/10 transition-all" style={ { background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' } } onClick={ () => GetUserProfile(avatarInfo.webID) }>
                                <LayoutAvatarImageView figure={ avatarInfo.figure } direction={ 4 } style={ { minHeight: 100 } } />
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-1 content-start">
                                { avatarInfo.badges.slice(0, 5).map((badge, i) => (
                                    <Tooltip key={ badge + i }><TooltipTrigger asChild>
                                        <div className="w-full aspect-square rounded-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-default" style={ { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } }>
                                            <LayoutBadgeImageView badgeCode={ badge } showInfo={ true } />
                                        </div>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">{ badge }</TooltipContent></Tooltip>
                                )) }
                                { avatarInfo.groupId > 0 && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <div className="w-full aspect-square rounded-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer" style={ { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } } onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                                            <LayoutBadgeImageView badgeCode={ avatarInfo.groupBadgeId } isGroup showInfo={ true } customTitle={ avatarInfo.groupName } />
                                        </div>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">{ avatarInfo.groupName }</TooltipContent></Tooltip>
                                ) }
                                { avatarInfo.groupId <= 0 && avatarInfo.badges.length <= 5 && (
                                    <div className="w-full aspect-square rounded-md" style={ { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' } } />
                                ) }
                            </div>
                        </div>

                        {/* ── Motto ── */}
                        <div className="rounded-lg p-2.5" style={ { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } }>
                            { isOwnUser ? (
                                <div className="flex items-center gap-1.5">
                                    <Pen className="w-2.5 h-2.5 text-white/20 shrink-0" />
                                    { !isEditingMotto ? (
                                        <p className="text-[11px] text-white/50 leading-relaxed truncate cursor-pointer flex-1 italic" onClick={ () => setIsEditingMotto(true) }>{ motto || 'Motto setzen...' }</p>
                                    ) : (
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent text-[11px] text-white/80 outline-none border-none p-0"
                                            maxLength={ GetConfiguration<number>('motto.max.length', 38) }
                                            value={ motto }
                                            onChange={ e => setMotto(e.target.value) }
                                            onBlur={ onMottoBlur }
                                            onKeyDown={ onMottoKeyDown }
                                            autoFocus
                                        />
                                    ) }
                                </div>
                            ) : (
                                <p className="text-[11px] text-white/50 leading-relaxed italic">{ motto || '...' }</p>
                            ) }
                        </div>

                        {/* ── Stats ── */}
                        <div className="rounded-lg p-2.5 space-y-2" style={ { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } }>
                            <SectionHeader>Stats</SectionHeader>

                            <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-[9px] h-[18px] px-1.5 gap-1 font-semibold bg-white/5 border-white/8 text-white/60 hover:bg-white/10">
                                    <Star className="w-2.5 h-2.5" />{ avatarInfo.achievementScore }
                                </Badge>
                                { levelInfo && (
                                    <Tooltip><TooltipTrigger asChild>
                                        <div className="inline-flex items-center gap-1">
                                            <Badge variant="secondary" className="text-[9px] h-[18px] px-1.5 gap-1 font-semibold bg-white/5 border-white/8 text-white/60">
                                                { prestige > 0 && `P${ prestige } ` }Lv.{ levelInfo.displayLevel }
                                            </Badge>
                                            <div className="w-10 h-1 rounded-full bg-white/10 overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all" style={ { width: `${ levelInfo.progress * 100 }%` } } />
                                            </div>
                                        </div>
                                    </TooltipTrigger><TooltipContent className="text-[10px]">{ Math.round(levelInfo.progress * 100) }% zum naechsten Level</TooltipContent></Tooltip>
                                ) }
                                { isOwnUser && (
                                    <Badge variant="outline" className="text-[9px] h-[18px] px-1.5 font-medium text-white/30 border-white/10">Du</Badge>
                                ) }
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <Calendar className="w-3 h-3 text-white/20 shrink-0" />
                                    <span className="text-white/35">Erfolgspunkte</span>
                                    <span className="text-white/70 font-semibold ml-auto tabular-nums">{ avatarInfo.achievementScore }</span>
                                </div>
                                { avatarInfo.groupId > 0 && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <Users className="w-3 h-3 text-white/20 shrink-0" />
                                        <span className="text-white/35">Gruppe</span>
                                        <span className="text-white/60 font-medium ml-auto truncate max-w-[120px] cursor-pointer hover:text-white/80" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>{ avatarInfo.groupName }</span>
                                    </div>
                                ) }
                                { (avatarInfo.carryItem > 0) && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <Hand className="w-3 h-3 text-white/20 shrink-0" />
                                        <span className="text-white/35">Hält</span>
                                        <span className="text-white/60 font-medium ml-auto">{ LocalizeText('handitem' + avatarInfo.carryItem) }</span>
                                    </div>
                                ) }
                            </div>
                        </div>

                        {/* ── Beziehungen ── */}
                        <div className="rounded-lg p-2.5 space-y-1.5" style={ { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } }>
                            <SectionHeader>Beziehungen</SectionHeader>
                            { [ RelationshipStatusEnum.HEART, RelationshipStatusEnum.SMILE, RelationshipStatusEnum.BOBBA ].map(type =>
                            {
                                const c = REL_CONFIG[type];
                                if(!c) return null;
                                const Icon = c.icon;
                                const info = relationships?.relationshipStatusMap?.hasKey(type)
                                    ? relationships.relationshipStatusMap.getValue(type)
                                    : null;
                                const hasData = info && info.friendCount > 0;

                                return (
                                    <div key={ type } className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5 transition-colors" style={ { border: '1px solid rgba(255,255,255,0.04)' } }>
                                        <div className={ `w-6 h-6 rounded-full ${ c.bg } flex items-center justify-center shrink-0` }>
                                            <Icon className={ `w-3 h-3 ${ c.color }` } />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            { hasData ? (
                                                <span className="text-[11px] font-medium text-white/70 cursor-pointer hover:underline truncate block" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                                    { info.randomFriendName }
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-white/15">—</span>
                                            ) }
                                        </div>
                                        { hasData && info.friendCount > 1 && <span className="text-[9px] text-white/25">+{ info.friendCount - 1 }</span> }
                                        { hasData && info.randomFriendFigure && (
                                            <div className="relative w-7 h-7 rounded-full shrink-0 overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                                <LayoutAvatarImageView figure={ info.randomFriendFigure } headOnly direction={ 2 } className="!absolute -top-1" />
                                            </div>
                                        ) }
                                    </div>
                                );
                            }) }
                        </div>

                    </div>
                </ScrollArea>

                {/* ── Discord Effect Overlay ── */}
                { activeEffect && <ProfileEffectRenderer key={ activeEffect.id } effect={ activeEffect } /> }
            </div>
        </TooltipProvider>
    );
};
