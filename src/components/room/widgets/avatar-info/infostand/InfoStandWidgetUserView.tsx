import { RelationshipStatusEnum, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomSessionFavoriteGroupUpdateEvent, RoomSessionUserBadgesEvent, RoomSessionUserFigureUpdateEvent, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, FocusEvent, KeyboardEvent, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Heart, Smile, Shield, X, Pen, Star, Users, Calendar, Hand } from 'lucide-react';
import { AvatarInfoUser, CloneObject, GetConfiguration, GetGroupInformation, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../../../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../../common';
import { useMessageEvent, useRoom, useRoomSessionManagerEvent } from '../../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { resolveProfileEffect, ROLE_PRESETS } from '../../../../user-profile/ProfileEffects';
import { ProfileEffectOverlay } from '../../../../user-profile/ProfileEffectRenderer';
import { useEquippedAssets } from '../../../../discord-shop/useEquippedAssets';

const Tooltip = AlignTooltip.Root;
const TooltipContent = AlignTooltip.Content;
const TooltipProvider = AlignTooltip.Provider;
const TooltipTrigger = AlignTooltip.Trigger;

function SectionHeader({ children }: { children: React.ReactNode })
{
    return <div className="mb-1.5 text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ children }</div>;
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

    const roles = useMemo(() => getRolesFromBadges(avatarInfo?.badges || []), [ avatarInfo?.badges ]);
    const prestige = useMemo(() => getPrestigeFromBadges(avatarInfo?.badges || []), [ avatarInfo?.badges ]);
    const levelInfo = avatarInfo ? getPrestigeInfo(avatarInfo.achievementScore, prestige) : null;
    const isOwnUser = avatarInfo?.type === AvatarInfoUser.OWN_USER;
    const equippedAssets = useEquippedAssets(avatarInfo?.webID ?? 0, !!avatarInfo?.webID);
    const nameplateUrl = equippedAssets.nameplate?.staticUrl || null;
    const decorationUrl = equippedAssets.avatarDecoration?.animatedUrl || equippedAssets.avatarDecoration?.staticUrl || null;
    const activeEffect = useMemo(() => resolveProfileEffect(equippedAssets.profileEffect), [ equippedAssets.profileEffect ]);

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

    const visibleBadges = avatarInfo.badges.slice(0, 3);
    const remainingBadges = Math.max(0, avatarInfo.badges.length - visibleBadges.length);

    return (
        <TooltipProvider delayDuration={ 200 }>
            <AlignSurface.Panel className={ `group nitro-infostand nitro-user-infostand-align relative !h-auto !min-w-[328px] !max-w-[328px] !max-h-none overflow-hidden !rounded-20 !border-0 !bg-bg-white-0 !text-text-strong-950 ${ activeEffect ? 'nitro-infostand-has-profile-effect' : '' }` }>
                <ProfileEffectOverlay
                    key={ activeEffect?.key ?? 'no-infostand-profile-effect' }
                    resolution={ activeEffect }
                    fit="contain"
                    className="nitro-profile-effect-overlay z-[30] opacity-100"
                />
                <div className="nitro-infostand-layer relative z-10 flex items-center gap-3 bg-bg-white-0 px-4 py-3">
                    <button className="min-w-0 flex-1 truncate text-left text-label-md text-text-strong-950 hover:underline" onClick={ () => GetUserProfile(avatarInfo.webID) }>
                        { avatarInfo.name }
                    </button>
                    <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>

                <AlignDivider.Root />

                <div className="nitro-infostand-layer relative z-10 bg-bg-white-0 p-2.5">
                    <div className="space-y-2.5">
                        <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-2.5">
                            <div className="flex gap-3">
                                <button className="nitro-infostand-control-layer relative flex h-[104px] w-[82px] shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50" onClick={ () => GetUserProfile(avatarInfo.webID) }>
                                    <LayoutAvatarImageView figure={ avatarInfo.figure } direction={ 4 } style={ { minHeight: 100 } } />
                                    { decorationUrl && <img src={ decorationUrl } alt="" className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain" draggable={ false } /> }
                                </button>

                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <AlignBadge.Root color="green" variant="lighter" size="small">
                                            <AlignBadge.Dot />Im Raum
                                        </AlignBadge.Root>
                                        { isOwnUser && <AlignBadge.Root color="gray" variant="lighter" size="small">Du</AlignBadge.Root> }
                                        { roles.map(r =>
                                        {
                                            const cfg = ROLE_PRESETS[r];
                                            if(!cfg) return null;
                                            return (
                                                <AlignBadge.Root key={ r } color={ ROLE_BADGE_COLOR[r] ?? 'gray' } variant="lighter" size="small">
                                                    { cfg.label }
                                                </AlignBadge.Root>
                                            );
                                        }) }
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="nitro-infostand-control-layer rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                            <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">ID</div>
                                            <div className="truncate font-mono text-label-xs text-text-strong-950">#{ avatarInfo.webID }</div>
                                        </div>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="nitro-infostand-control-layer flex min-h-[48px] items-center justify-center rounded-xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                                    { visibleBadges.length > 0 ? (
                                                        <LayoutBadgeImageView badgeCode={ visibleBadges[0] } showInfo={ true } />
                                                    ) : (
                                                        <span className="text-paragraph-xs text-text-soft-400">Badge</span>
                                                    ) }
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent size="xsmall">{ visibleBadges[0] || 'Kein Badge gesetzt' }</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    { avatarInfo.groupId > 0 ? (
                                        <button className="nitro-infostand-control-layer flex w-full items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-left shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                                            <div className="nitro-infostand-subtle-layer flex size-7 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50">
                                                <LayoutBadgeImageView badgeCode={ avatarInfo.groupBadgeId } isGroup showInfo={ true } customTitle={ avatarInfo.groupName } />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Gruppe</div>
                                                <div className="truncate text-label-xs text-text-strong-950">{ avatarInfo.groupName }</div>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="nitro-infostand-control-layer rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                            <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Badges</div>
                                            <div className="truncate text-label-xs text-text-strong-950">{ avatarInfo.badges.length || 0 } sichtbar{ remainingBadges > 0 ? `, +${ remainingBadges }` : '' }</div>
                                        </div>
                                    ) }
                                </div>
                            </div>

                            { nameplateUrl && (
                                <button className="nitro-infostand-control-layer mt-3 flex w-full items-center justify-center rounded-xl bg-bg-white-0 px-3 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50" onClick={ () => GetUserProfile(avatarInfo.webID) }>
                                    <img src={ nameplateUrl } alt="" className="h-8 max-w-full object-contain" draggable={ false } />
                                </button>
                            ) }

                            <div className="nitro-infostand-control-layer mt-3 rounded-xl bg-bg-white-0 px-3 py-2.5 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                { isOwnUser ? (
                                    <div className="flex items-center gap-2">
                                        <Pen className="size-4 shrink-0 text-text-soft-400" />
                                        { !isEditingMotto ? (
                                            <button className="min-w-0 flex-1 truncate text-left text-paragraph-sm italic text-text-sub-600" onClick={ () => setIsEditingMotto(true) }>{ motto || 'Motto setzen...' }</button>
                                        ) : (
                                            <AlignInput.Root size="xsmall" className="flex-1">
                                                <AlignInput.Wrapper className="h-8">
                                                    <AlignInput.Input
                                                        type="text"
                                                        className="h-8 text-paragraph-sm"
                                                        maxLength={ GetConfiguration<number>('motto.max.length', 38) }
                                                        value={ motto }
                                                        onChange={ e => setMotto(e.target.value) }
                                                        onBlur={ onMottoBlur }
                                                        onKeyDown={ onMottoKeyDown }
                                                        autoFocus
                                                    />
                                                </AlignInput.Wrapper>
                                            </AlignInput.Root>
                                        ) }
                                    </div>
                                ) : (
                                    <p className="truncate text-paragraph-sm italic text-text-sub-600">{ motto || '...' }</p>
                                ) }
                            </div>
                        </div>

                        <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <SectionHeader>Stats</SectionHeader>
                                <div className="flex flex-wrap justify-end gap-1">
                                    { levelInfo && (
                                        <AlignBadge.Root color="blue" variant="lighter" size="small">
                                            { prestige > 0 && `P${ prestige } ` }Lv.{ levelInfo.displayLevel }
                                        </AlignBadge.Root>
                                    ) }
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <AlignBadge.Root color="yellow" variant="lighter" size="small">
                                    <AlignBadge.Icon as={ Star } className="size-3" />{ avatarInfo.achievementScore }
                                </AlignBadge.Root>
                                { levelInfo && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-1 items-center gap-2">
                                                <AlignProgressBar.Root value={ Math.round(levelInfo.progress * 100) } color="green" className="h-1.5" />
                                                <span className="w-8 text-right text-paragraph-xs text-text-soft-400">{ Math.round(levelInfo.progress * 100) }%</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent size="xsmall">{ Math.round(levelInfo.progress * 100) }% zum naechsten Level</TooltipContent>
                                    </Tooltip>
                                ) }
                            </div>

                            <AlignDivider.Root className="my-3" />

                            <div className="space-y-2">
                                <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <Calendar className="size-3.5 shrink-0 text-text-soft-400" />
                                    <span className="text-text-sub-600">Erfolgspunkte</span>
                                    <span className="ml-auto tabular-nums text-label-xs text-text-strong-950">{ avatarInfo.achievementScore }</span>
                                </div>
                                { avatarInfo.groupId > 0 && (
                                    <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                        <Users className="size-3.5 shrink-0 text-text-soft-400" />
                                        <span className="text-text-sub-600">Gruppe</span>
                                        <button className="ml-auto max-w-[140px] truncate text-label-xs text-text-strong-950 hover:underline" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>{ avatarInfo.groupName }</button>
                                    </div>
                                ) }
                                { (avatarInfo.carryItem > 0) && (
                                    <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                        <Hand className="size-3.5 shrink-0 text-text-soft-400" />
                                        <span className="text-text-sub-600">Hält</span>
                                        <span className="ml-auto text-label-xs text-text-strong-950">{ LocalizeText('handitem' + avatarInfo.carryItem) }</span>
                                    </div>
                                ) }
                            </div>
                        </div>

                        <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-2.5">
                            <SectionHeader>Beziehungen</SectionHeader>
                            <div className="space-y-1">
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
                                        <div key={ type } className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-bg-white-0">
                                            <div className={ `flex size-8 shrink-0 items-center justify-center rounded-full ${ c.bg }` }>
                                                <Icon className={ `size-4 ${ c.color }` } />
                                            </div>
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
                                            { hasData && info.randomFriendFigure && (
                                                <button className="nitro-infostand-control-layer relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200" onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }>
                                                    <LayoutAvatarImageView figure={ info.randomFriendFigure } headOnly direction={ 2 } className="!absolute -left-1 -top-1" />
                                                </button>
                                            ) }
                                        </div>
                                    );
                                }) }
                            </div>
                        </div>
                    </div>
                </div>
            </AlignSurface.Panel>
        </TooltipProvider>
    );
};
