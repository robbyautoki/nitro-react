import { RelationshipStatusEnum, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomSessionFavoriteGroupUpdateEvent, RoomSessionUserBadgesEvent, RoomSessionUserFigureUpdateEvent, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, FocusEvent, KeyboardEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Heart, Smile, Shield, X, Pen } from 'lucide-react';
import { AvatarInfoUser, CloneObject, GetConfiguration, GetGroupInformation, GetLocalStorage, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer, SetLocalStorage } from '../../../../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../../../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../../common';
import { useMessageEvent, useRoom, useRoomSessionManagerEvent } from '../../../../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
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
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1] opacity-60" style={ { willChange: 'transform, opacity', transform: 'translateZ(0)' } }>
            { sorted.map((layer, i) => (
                <div key={ `${ effect.id }-${ i }` } className="absolute inset-0" style={ { zIndex: layer.zIndex } }>
                    <SpriteLayer src={ layer.src } startDelay={ layer.start } />
                </div>
            )) }
        </div>
    );
}

function getRolesFromBadges(badges: string[]): string[]
{
    const roles: string[] = [];
    if(badges.some(b => b === 'ADM' || b.startsWith('ADM'))) roles.push('admin');
    if(badges.some(b => b === 'MOD' || b.startsWith('MOD'))) roles.push('mod');
    if(badges.some(b => b === 'VIP' || b.startsWith('VIP') || b === 'HC1')) roles.push('vip');
    return roles;
}

const REL_CONFIG: Record<number, { icon: typeof Heart; color: string; label: string }> = {
    [RelationshipStatusEnum.HEART]: { icon: Heart, color: 'text-red-400', label: 'Herz' },
    [RelationshipStatusEnum.SMILE]: { icon: Smile, color: 'text-yellow-400', label: 'Smiley' },
    [RelationshipStatusEnum.BOBBA]: { icon: Shield, color: 'text-blue-400', label: 'Bobba' },
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
            <div className="nitro-infostand relative rounded-xl overflow-hidden">

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <button className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" onClick={ () => GetUserProfile(avatarInfo.webID) }>
                            <div className="w-5 h-5 rounded-full overflow-hidden">
                                <LayoutAvatarImageView figure={ avatarInfo.figure } headOnly direction={ 2 } />
                            </div>
                        </button>
                        <span className="text-[13px] font-semibold truncate text-white">{ avatarInfo.name }</span>
                    </div>
                    <button className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" onClick={ onClose }>
                        <X className="w-3 h-3 text-white/50" />
                    </button>
                </div>

                <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                {/* Body: Avatar + Badges */}
                <div className="relative z-10 flex gap-2 px-3 py-2">
                    <div className="shrink-0 w-[68px] rounded-md overflow-hidden flex items-center justify-center cursor-pointer" style={ { background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.03))' } } onClick={ () => GetUserProfile(avatarInfo.webID) }>
                        <LayoutAvatarImageView figure={ avatarInfo.figure } direction={ 4 } style={ { minHeight: 90 } } />
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-1 content-start">
                        { avatarInfo.badges.slice(0, 5).map((badge, i) => (
                            <Tooltip key={ badge + i }><TooltipTrigger asChild>
                                <div className="w-full aspect-square rounded-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-default" style={ { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' } }>
                                    <LayoutBadgeImageView badgeCode={ badge } showInfo={ true } />
                                </div>
                            </TooltipTrigger><TooltipContent className="text-[10px]">{ badge }</TooltipContent></Tooltip>
                        )) }
                        { avatarInfo.groupId > 0 && (
                            <Tooltip><TooltipTrigger asChild>
                                <div className="w-full aspect-square rounded-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer" style={ { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' } } onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                                    <LayoutBadgeImageView badgeCode={ avatarInfo.groupBadgeId } isGroup showInfo={ true } customTitle={ avatarInfo.groupName } />
                                </div>
                            </TooltipTrigger><TooltipContent className="text-[10px]">{ avatarInfo.groupName }</TooltipContent></Tooltip>
                        ) }
                        { avatarInfo.groupId <= 0 && avatarInfo.badges.length <= 5 && (
                            <div className="w-full aspect-square rounded-md" style={ { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' } } />
                        ) }
                    </div>
                </div>

                <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                {/* Motto */}
                <div className="relative z-10 px-3 py-1.5">
                    <div className="rounded-md px-2 py-1.5" style={ { background: 'rgba(255,255,255,0.05)' } }>
                        { avatarInfo.type === AvatarInfoUser.OWN_USER ? (
                            <div className="flex items-center gap-1.5">
                                <Pen className="w-2.5 h-2.5 text-white/30 shrink-0" />
                                { !isEditingMotto ? (
                                    <p className="text-[11px] text-white/60 leading-relaxed truncate cursor-pointer flex-1" onClick={ () => setIsEditingMotto(true) }>{ motto || '...' }</p>
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
                            <p className="text-[11px] text-white/60 leading-relaxed truncate">{ motto || '...' }</p>
                        ) }
                    </div>
                </div>

                <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                {/* Achievement Score + Level */}
                <div className="relative z-10 px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40">Erfolgspunkte</span>
                        <span className="text-[11px] font-semibold text-white/80">{ avatarInfo.achievementScore }</span>
                    </div>
                    { levelInfo && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40">
                                { prestige > 0 && `P${ prestige } ` }Lv.{ levelInfo.displayLevel }
                            </span>
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all" style={ { width: `${ levelInfo.progress * 100 }%` } } />
                            </div>
                        </div>
                    ) }
                    { roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                            { roles.map(r =>
                            {
                                const cfg = ROLE_PRESETS[r];
                                if(!cfg) return null;
                                return (
                                    <span key={ r } className={ `inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${ cfg.bg } ${ cfg.border } ${ cfg.color }` }>
                                        { cfg.label }
                                    </span>
                                );
                            }) }
                        </div>
                    ) }
                    { (avatarInfo.carryItem > 0) && (
                        <div className="text-[10px] text-white/40 pt-0.5">
                            { LocalizeText('infostand.text.handitem', [ 'item' ], [ LocalizeText('handitem' + avatarInfo.carryItem) ]) }
                        </div>
                    ) }
                </div>

                <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                {/* Relationships */}
                { relationships && relationships.relationshipStatusMap.length > 0 && (
                    <div className="relative z-10 px-3 py-2 space-y-1">
                        { [ RelationshipStatusEnum.HEART, RelationshipStatusEnum.SMILE, RelationshipStatusEnum.BOBBA ].map(type =>
                        {
                            const c = REL_CONFIG[type];
                            if(!c) return null;
                            const Icon = c.icon;
                            const info = relationships.relationshipStatusMap.hasKey(type)
                                ? relationships.relationshipStatusMap.getValue(type)
                                : null;
                            const hasData = info && info.friendCount > 0;

                            return (
                                <div key={ type } className="flex items-center gap-2">
                                    <Icon className={ `w-3 h-3 shrink-0 ${ c.color }` } />
                                    <span className={ `text-[11px] flex-1 truncate ${ hasData ? 'text-white/70 cursor-pointer hover:underline' : 'text-white/20' }` } onClick={ () => hasData && info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                        { hasData ? info.randomFriendName : '—' }
                                    </span>
                                    { hasData && info.friendCount > 1 && <span className="text-[9px] text-white/30">+{ info.friendCount - 1 }</span> }
                                    { hasData && info.randomFriendFigure && (
                                        <div className="w-4 h-4 rounded-full shrink-0 overflow-hidden cursor-pointer" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                            <LayoutAvatarImageView figure={ info.randomFriendFigure } headOnly direction={ 2 } />
                                        </div>
                                    ) }
                                </div>
                            );
                        }) }
                    </div>
                ) }

                {/* Discord Effect Overlay */}
                { activeEffect && <ProfileEffectRenderer key={ activeEffect.id } effect={ activeEffect } /> }
            </div>
        </TooltipProvider>
    );
};
