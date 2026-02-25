import { ExtendedProfileChangedMessageEvent, FriendlyTime, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer, RequestFriendComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { X, Pen, Calendar, Coins, Diamond, Trophy, Gem, Home, Share2, UserPlus, MessageSquare } from 'lucide-react';
import { CreateLinkEvent, GetLocalStorage, GetRoomSession, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer, SetLocalStorage } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/reui-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BANNER_PRESETS, BannerPreset, DEFAULT_BANNER_ID } from './BannerPresets';
import { BannerPickerView } from './views/BannerPickerView';
import { RelationshipsContainerView } from './views/RelationshipsContainerView';
import { GroupsContainerView } from './views/GroupsContainerView';

const getBannerStorageKey = (userId: number) => `nitro.profile.banner.${ userId }`;

const statIcons = {
    coins: Coins,
    diamond: Diamond,
    gem: Gem,
    trophy: Trophy,
};

const statColors = {
    coins: 'text-yellow-500',
    diamond: 'text-sky-500',
    gem: 'text-emerald-500',
    trophy: 'text-amber-500',
};

export const UserProfileView: FC<{}> = () =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ userRelationships, setUserRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const [ requestSent, setRequestSent ] = useState(false);
    const [ bannerId, setBannerId ] = useState<string>(DEFAULT_BANNER_ID);
    const [ showBannerPicker, setShowBannerPicker ] = useState(false);

    const onClose = () =>
    {
        setUserProfile(null);
        setUserBadges([]);
        setUserRelationships(null);
        setShowBannerPicker(false);
    };

    const onLeaveGroup = () =>
    {
        if(!userProfile || (userProfile.id !== GetSessionDataManager().userId)) return;
        GetUserProfile(userProfile.id);
    };

    const isOwnProfile = userProfile ? (userProfile.id === GetSessionDataManager().userId) : false;
    const canSendFriendRequest = userProfile ? (!requestSent && !isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent) : false;

    const currentBanner = useMemo(() =>
        BANNER_PRESETS.find(p => p.id === bannerId) || BANNER_PRESETS[BANNER_PRESETS.length - 1],
    [ bannerId ]);

    const addFriend = () =>
    {
        if(!userProfile) return;
        setRequestSent(true);
        SendMessageComposer(new RequestFriendComposer(userProfile.username));
    };

    const onBannerSelect = (preset: BannerPreset) =>
    {
        setBannerId(preset.id);
        SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), preset.id);
        setShowBannerPicker(false);
    };

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

    const prestige = getPrestigeFromBadges(userBadges);
    const levelInfo = getPrestigeInfo(userProfile.achievementPoints, prestige);

    const friendStatusText = (() =>
    {
        if(isOwnProfile) return 'Das bist du';
        if(userProfile.isMyFriend) return 'Freunde';
        if(requestSent || userProfile.requestSent) return 'Anfrage gesendet';
        return null;
    })();

    const stats: { label: string; value: string; icon: keyof typeof statIcons }[] = [
        { label: 'Freunde', value: userProfile.friendsCount.toLocaleString('de-DE'), icon: 'coins' },
        { label: 'Erfolge', value: userProfile.achievementPoints.toLocaleString('de-DE'), icon: 'trophy' },
        { label: 'Diamanten', value: (prestige > 0 ? `P${ prestige } ` : '') + `Lv.${ levelInfo.displayLevel }`, icon: 'diamond' },
        { label: 'Zuletzt', value: userProfile.isOnline ? 'Jetzt online' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2), icon: 'gem' },
    ];

    return (
        <DraggableWindow uniqueKey="nitro-user-profile" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className={ cn('w-[540px] space-y-4') }>
                {/* ── Main Profile Card (1:1 v2 structure) ── */}
                <Card className="overflow-hidden pt-0">
                    {/* Banner — v2: h-32 bg-gradient, here: animated GIF support */}
                    <div
                        className="drag-handler relative h-32 cursor-move select-none sm:h-40"
                        style={ currentBanner.gifUrl
                            ? { backgroundImage: `url(${ currentBanner.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: currentBanner.gradient }
                        }
                    >
                        { isOwnProfile && (
                            <button
                                className="absolute top-2.5 left-2.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm text-white/70 hover:bg-black/50 hover:text-white transition-all"
                                onClick={ () => setShowBannerPicker(!showBannerPicker) }
                                onMouseDown={ e => e.stopPropagation() }
                                title="Banner ändern"
                            >
                                <Pen className="w-3 h-3" />
                            </button>
                        ) }
                        <button
                            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm text-white/70 hover:bg-black/50 hover:text-white transition-all"
                            onClick={ onClose }
                            onMouseDown={ e => e.stopPropagation() }
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Banner Picker */}
                    { showBannerPicker && (
                        <BannerPickerView
                            activeBannerId={ bannerId }
                            onSelect={ onBannerSelect }
                            onClose={ () => setShowBannerPicker(false) }
                        />
                    ) }

                    {/* v2: CardContent className="relative pb-6" */}
                    <CardContent className="relative pb-6">
                        {/* v2: flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                            {/* v2: Avatar className="-mt-12 size-32 border-4 border-card shadow-lg sm:-mt-16 sm:size-40" */}
                            <div
                                className="-mt-12 size-32 shrink-0 rounded-full border-4 border-card shadow-lg overflow-hidden bg-muted cursor-pointer sm:-mt-16 sm:size-40"
                                onClick={ () => GetUserProfile(userProfile.id) }
                            >
                                <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                            </div>

                            {/* v2: flex-1 space-y-1 */}
                            <div className="flex-1 space-y-1">
                                {/* v2: flex items-center gap-2 */}
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold">{ userProfile.username }</h1>
                                    <Badge variant="secondary" size="sm">Spieler</Badge>
                                    { userProfile.isOnline && (
                                        <Badge variant="success" size="sm">Online</Badge>
                                    ) }
                                    { friendStatusText && friendStatusText !== 'Das bist du' && (
                                        <Badge variant="info-light" size="sm">{ friendStatusText }</Badge>
                                    ) }
                                </div>
                                {/* v2: text-muted-foreground italic */}
                                { userProfile.motto && (
                                    <p className="text-muted-foreground italic">
                                        &quot;{ userProfile.motto }&quot;
                                    </p>
                                ) }
                                {/* v2: flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-3.5" />
                                        Mitglied seit { userProfile.registration }
                                    </span>
                                </div>
                            </div>

                            {/* v2: flex gap-2 (buttons right-aligned) */}
                            <div className="flex gap-2 shrink-0">
                                { canSendFriendRequest && (
                                    <Button size="sm" onClick={ addFriend }>
                                        <UserPlus className="mr-2 size-4" />
                                        Freund
                                    </Button>
                                ) }
                                <Button variant="outline" size="sm" onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }>
                                    <Home className="mr-2 size-4" />
                                    Räume
                                </Button>
                                { !isOwnProfile && userProfile.isMyFriend && (
                                    <Button variant="outline" size="sm" onClick={ () => CreateLinkEvent(`friends/messenger/${ userProfile.username }`) }>
                                        <MessageSquare className="mr-2 size-4" />
                                        Nachricht
                                    </Button>
                                ) }
                            </div>
                        </div>

                        {/* v2: Badges inline — mt-4 flex items-center gap-3 border-t pt-4 */}
                        { userBadges && userBadges.length > 0 && (
                            <div className="mt-4 flex items-center gap-3 border-t pt-4">
                                <span className="text-xs font-medium text-muted-foreground">Badges</span>
                                <div className="flex gap-2">
                                    { userBadges.map((badge) => (
                                        <LayoutBadgeImageView key={ badge } badgeCode={ badge } />
                                    )) }
                                </div>
                            </div>
                        ) }
                    </CardContent>
                </Card>

                {/* ── Stats Cards Grid (1:1 v2 structure) ── */}
                <div className="grid gap-3 grid-cols-4">
                    { stats.map((stat) =>
                    {
                        const Icon = statIcons[stat.icon];
                        const color = statColors[stat.icon];

                        return (
                            <Card key={ stat.label }>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        { stat.label }
                                    </CardTitle>
                                    <Icon className={ cn('size-4', color) } />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{ stat.value }</div>
                                </CardContent>
                            </Card>
                        );
                    }) }
                </div>

                {/* ── Tabs (In-Game addition: Beziehungen + Gruppen) ── */}
                <Card>
                    <Tabs defaultValue="relationships">
                        <TabsList variant="line" className="bg-transparent! border-b px-6 h-auto!">
                            <TabsTrigger value="relationships" className="text-xs py-2.5">
                                Beziehungen
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="text-xs py-2.5">
                                Gruppen
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="relationships" className="px-6 py-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                            { userRelationships
                                ? <RelationshipsContainerView relationships={ userRelationships } />
                                : <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">Wird geladen...</div>
                            }
                        </TabsContent>

                        <TabsContent value="groups" className="px-6 py-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                            <GroupsContainerView
                                fullWidth
                                itsMe={ isOwnProfile }
                                groups={ userProfile.groups }
                                onLeaveGroup={ onLeaveGroup }
                            />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </DraggableWindow>
    );
};
