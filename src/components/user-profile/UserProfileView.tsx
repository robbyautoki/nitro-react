import { ExtendedProfileChangedMessageEvent, FriendlyTime, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer, RequestFriendComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { X, Pen, Users, Trophy, Star, Calendar, MessageSquare, Home, UserPlus } from 'lucide-react';
import { CreateLinkEvent, GetLocalStorage, GetRoomSession, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer, SetLocalStorage } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BANNER_PRESETS, BannerPreset, DEFAULT_BANNER_ID } from './BannerPresets';
import { BannerPickerView } from './views/BannerPickerView';
import { RelationshipsContainerView } from './views/RelationshipsContainerView';
import { GroupsContainerView } from './views/GroupsContainerView';

const getBannerStorageKey = (userId: number) => `nitro.profile.banner.${ userId }`;

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

    const friendStatusText = (() =>
    {
        if(isOwnProfile) return 'Das bist du';
        if(userProfile.isMyFriend) return 'Freunde';
        if(requestSent || userProfile.requestSent) return 'Anfrage gesendet';
        return null;
    })();

    return (
        <DraggableWindow uniqueKey="nitro-user-profile" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[540px] bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden">
                {/* Banner */}
                <div
                    className="drag-handler relative h-32 cursor-move select-none overflow-hidden"
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

                {/* Profile Header */}
                <div className="relative px-5 pb-4">
                    <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="-mt-10 relative shrink-0 w-[90px] h-[110px] rounded-xl border-4 border-white shadow-lg bg-zinc-100 overflow-hidden cursor-pointer" onClick={ () => GetUserProfile(userProfile.id) }>
                            <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-zinc-900 truncate">{ userProfile.username }</h2>
                                { userProfile.isOnline && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Online
                                    </span>
                                ) }
                                { !userProfile.isOnline && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-500">
                                        { FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                                    </span>
                                ) }
                                { friendStatusText && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-500">
                                        { friendStatusText }
                                    </span>
                                ) }
                            </div>
                            { userProfile.motto && (
                                <p className="text-sm text-zinc-400 italic mt-0.5 truncate">&quot;{ userProfile.motto }&quot;</p>
                            ) }
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Dabei seit { userProfile.registration }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 px-5 pb-4">
                    <StatCard icon={ <Users className="w-4 h-4 text-blue-500" /> } label="Freunde" value={ userProfile.friendsCount } />
                    <StatCard icon={ <Trophy className="w-4 h-4 text-amber-500" /> } label="Erfolge" value={ userProfile.achievementPoints } />
                    <ProfileLevelStat badges={ userBadges } score={ userProfile.achievementPoints } />
                    <StatCard
                        icon={ <Calendar className="w-4 h-4 text-zinc-400" /> }
                        label="Zuletzt"
                        valueStr={ userProfile.isOnline ? 'Jetzt' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                        small
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 px-5 pb-4">
                    { canSendFriendRequest && (
                        <Button size="sm" onClick={ addFriend } className="gap-1.5">
                            <UserPlus className="w-3.5 h-3.5" />
                            Freund hinzufügen
                        </Button>
                    ) }
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }>
                        <Home className="w-3.5 h-3.5" />
                        Räume
                    </Button>
                    { !isOwnProfile && userProfile.isMyFriend && (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={ () => CreateLinkEvent(`friends/messenger/${ userProfile.username }`) }>
                            <MessageSquare className="w-3.5 h-3.5" />
                            Nachricht
                        </Button>
                    ) }
                </div>

                {/* Tabs */}
                <div className="border-t border-zinc-100">
                    <Tabs defaultValue="badges">
                        <TabsList variant="line" className="bg-transparent! border-b border-zinc-100 px-5 h-auto!">
                            <TabsTrigger value="badges" className="text-zinc-500! data-[state=active]:text-zinc-900! data-[state=active]:border-zinc-900! text-xs py-2.5">
                                Badges
                            </TabsTrigger>
                            <TabsTrigger value="relationships" className="text-zinc-500! data-[state=active]:text-zinc-900! data-[state=active]:border-zinc-900! text-xs py-2.5">
                                Beziehungen
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="text-zinc-500! data-[state=active]:text-zinc-900! data-[state=active]:border-zinc-900! text-xs py-2.5">
                                Gruppen
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="badges" className="px-5 py-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                            { userBadges && userBadges.length > 0 ? (
                                <div className="grid grid-cols-8 gap-1.5">
                                    { userBadges.map((badge) => (
                                        <div key={ badge } className="flex items-center justify-center h-10 rounded-lg bg-zinc-50 border border-zinc-100">
                                            <LayoutBadgeImageView badgeCode={ badge } />
                                        </div>
                                    )) }
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-20 text-sm text-zinc-300">
                                    Keine Badges
                                </div>
                            ) }
                        </TabsContent>

                        <TabsContent value="relationships" className="px-5 py-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                            { userRelationships
                                ? <RelationshipsContainerView relationships={ userRelationships } />
                                : <div className="flex items-center justify-center h-20 text-sm text-zinc-300">Wird geladen...</div>
                            }
                        </TabsContent>

                        <TabsContent value="groups" className="px-5 py-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                            <GroupsContainerView
                                fullWidth
                                itsMe={ isOwnProfile }
                                groups={ userProfile.groups }
                                onLeaveGroup={ onLeaveGroup }
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DraggableWindow>
    );
};

const StatCard: FC<{ icon: React.ReactNode; label: string; value?: number; valueStr?: string; small?: boolean }> = ({ icon, label, value, valueStr, small }) => (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
        { icon }
        <span className={ `font-bold text-zinc-900 ${ small ? 'text-xs' : 'text-lg' }` }>
            { valueStr ?? value?.toLocaleString('de-DE') }
        </span>
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{ label }</span>
    </div>
);

const ProfileLevelStat: FC<{ badges: string[]; score: number }> = ({ badges, score }) =>
{
    const prestige = useMemo(() => getPrestigeFromBadges(badges), [ badges ]);
    const info = useMemo(() => getPrestigeInfo(score, prestige), [ score, prestige ]);

    return (
        <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="text-lg font-bold text-zinc-900">
                { prestige > 0 && <span className="text-purple-500">P{ prestige } </span> }
                Lv.{ info.displayLevel }
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Level</span>
        </div>
    );
};
