import { ExtendedProfileChangedMessageEvent, FriendlyTime, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RequestFriendComposer, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FaPen, FaTimes } from 'react-icons/fa';
import { CreateLinkEvent, GetLocalStorage, GetRoomSession, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer, SetLocalStorage } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo } from '../../api/utils/PrestigeUtils';
import { Column, Flex, Grid, LayoutAvatarImageView, LayoutBadgeImageView, NitroCardContentView, NitroCardView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from '@/components/ui/tabs';
import { BANNER_PRESETS, BannerPreset, DEFAULT_BANNER_ID } from './BannerPresets';
import { BannerPickerView } from './views/BannerPickerView';
import { BadgesContainerView } from './views/BadgesContainerView';
import { RelationshipsContainerView } from './views/RelationshipsContainerView';
import { GroupsContainerView } from './views/GroupsContainerView';

const getBannerStorageKey = (userId: number) => `nitro.profile.banner.${ userId }`;

export const UserProfileView: FC<{}> = props =>
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
    }

    const onLeaveGroup = () =>
    {
        if(!userProfile || (userProfile.id !== GetSessionDataManager().userId)) return;

        GetUserProfile(userProfile.id);
    }

    const isOwnProfile = userProfile ? (userProfile.id === GetSessionDataManager().userId) : false;
    const canSendFriendRequest = userProfile ? (!requestSent && !isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent) : false;

    const currentBanner = useMemo(() =>
    {
        return BANNER_PRESETS.find(p => p.id === bannerId) || BANNER_PRESETS[BANNER_PRESETS.length - 1];
    }, [ bannerId ]);

    const addFriend = () =>
    {
        if(!userProfile) return;

        setRequestSent(true);
        SendMessageComposer(new RequestFriendComposer(userProfile.username));
    }

    const onBannerSelect = (preset: BannerPreset) =>
    {
        setBannerId(preset.id);
        SetLocalStorage(getBannerStorageKey(GetSessionDataManager().userId), preset.id);
        setShowBannerPicker(false);
    }

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
        <NitroCardView uniqueKey="nitro-user-profile" theme="primary-slim" className="user-profile-v2">
            <div
                className="profile-cover drag-handler"
                style={ currentBanner.gifUrl
                    ? { backgroundImage: `url(${ currentBanner.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: currentBanner.gradient }
                }
            >
                { isOwnProfile &&
                    <button className="banner-edit-btn" onClick={ () => setShowBannerPicker(!showBannerPicker) } title="Banner aendern">
                        <FaPen />
                    </button>
                }
                <button className="close-button" onClick={ onClose }>
                    <FaTimes />
                </button>
            </div>

            { showBannerPicker &&
                <BannerPickerView
                    activeBannerId={ bannerId }
                    onSelect={ onBannerSelect }
                    onClose={ () => setShowBannerPicker(false) }
                />
            }

            <div className="profile-header">
                <div className="avatar-container">
                    <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                </div>
                <div className="profile-info">
                    <div className="username">{ userProfile.username }</div>
                    <div className="profile-meta-row">
                        <div className="online-status">
                            <span className={ `status-dot ${ userProfile.isOnline ? 'online' : 'offline' }` } />
                            <span className="status-text">
                                { userProfile.isOnline ? 'Online' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                            </span>
                        </div>
                        { friendStatusText &&
                            <span className="friend-badge">{ friendStatusText }</span> }
                    </div>
                    { userProfile.motto && <div className="motto">{ userProfile.motto }</div> }
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">{ userProfile.friendsCount }</div>
                    <div className="stat-label">Freunde</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{ userProfile.achievementPoints }</div>
                    <div className="stat-label">Erfolge</div>
                </div>
                <ProfileLevelStat badges={ userBadges } score={ userProfile.achievementPoints } />
                <div className="stat-item">
                    <div className="stat-value stat-value-sm">{ userProfile.registration }</div>
                    <div className="stat-label">Dabei seit</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value stat-value-sm">
                        { userProfile.isOnline ? 'Jetzt' : FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }
                    </div>
                    <div className="stat-label">Zuletzt</div>
                </div>
            </div>

            <div className="action-buttons">
                { canSendFriendRequest &&
                    <Button variant="secondary" size="sm" onClick={ addFriend }>
                        Freund hinzufuegen
                    </Button>
                }
                <Button variant="secondary" size="sm" onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }>
                    Raeume
                </Button>
                { !isOwnProfile && userProfile.isMyFriend &&
                    <Button variant="secondary" size="sm" onClick={ () => CreateLinkEvent(`friends/messenger/${ userProfile.username }`) }>
                        Nachricht
                    </Button>
                }
            </div>

            <div className="profile-tabs">
                <Tabs defaultValue="badges">
                    <TabsListUnderline className="tabs-list">
                        <TabsTriggerUnderline value="badges">Badges</TabsTriggerUnderline>
                        <TabsTriggerUnderline value="relationships">Beziehungen</TabsTriggerUnderline>
                        <TabsTriggerUnderline value="groups">Gruppen</TabsTriggerUnderline>
                    </TabsListUnderline>

                    <TabsContent value="badges" className="tab-content">
                        <div className="badges-grid">
                            { userBadges && userBadges.length > 0 && userBadges.map((badge) => (
                                <div key={ badge } className="badge-slot">
                                    <LayoutBadgeImageView badgeCode={ badge } />
                                </div>
                            )) }
                            { (!userBadges || userBadges.length === 0) &&
                                <div className="empty-state">Keine Badges</div> }
                        </div>
                    </TabsContent>

                    <TabsContent value="relationships" className="tab-content">
                        { userRelationships &&
                            <RelationshipsContainerView relationships={ userRelationships } /> }
                    </TabsContent>

                    <TabsContent value="groups" className="tab-content">
                        <GroupsContainerView
                            fullWidth
                            itsMe={ isOwnProfile }
                            groups={ userProfile.groups }
                            onLeaveGroup={ onLeaveGroup }
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </NitroCardView>
    )
}

const ProfileLevelStat: FC<{ badges: string[]; score: number }> = ({ badges, score }) =>
{
    const prestige = useMemo(() => getPrestigeFromBadges(badges), [ badges ]);
    const info = useMemo(() => getPrestigeInfo(score, prestige), [ score, prestige ]);

    return (
        <div className="stat-item">
            <div className="stat-value">
                { prestige > 0 && <span className="text-purple-400">🌟{ prestige > 1 ? `×${ prestige }` : '' } </span> }
                Lv.{ info.displayLevel }
            </div>
            <div className="stat-label">Level</div>
        </div>
    );
}
