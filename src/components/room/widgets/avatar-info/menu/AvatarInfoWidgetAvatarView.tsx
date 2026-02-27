import { RoomControllerLevel, RoomObjectCategory, RoomObjectVariable, RoomUnitGiveHandItemComposer, SetRelationshipStatusComposer, TradingOpenComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ArrowLeftRight, Crown, Eye, EyeOff, Flag, Handshake, Heart, Shield, Star, UserPlus, UserRoundSearch, Volume2 } from 'lucide-react';
import { AvatarInfoUser, CreateLinkEvent, DispatchUiEvent, GetOwnRoomObject, GetSessionDataManager, GetUserProfile, LocalizeText, MessengerFriend, ReportType, RoomWidgetUpdateChatInputContentEvent, SendMessageComposer } from '../../../../../api';
import { Base, Flex } from '../../../../../common';
import { useFriends, useHelp, useRoom, useSessionInfo } from '../../../../../hooks';
import { ContextMenuHeaderView } from '../../context-menu/ContextMenuHeaderView';
import { ContextMenuListItemView } from '../../context-menu/ContextMenuListItemView';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

const RELATIONSHIP_DISPLAY: Record<number, { icon: string; color: string }> = {
    [MessengerFriend.RELATIONSHIP_HEART]: { icon: '♥', color: '#f87171' },
    [MessengerFriend.RELATIONSHIP_SMILE]: { icon: '☺', color: '#fbbf24' },
    [MessengerFriend.RELATIONSHIP_BOBBA]: { icon: '👊', color: '#a78bfa' },
};

const roomJoinTimes = new Map<number, number>();

interface AvatarInfoWidgetAvatarViewProps
{
    avatarInfo: AvatarInfoUser;
    onClose: () => void;
}

const MODE_NORMAL = 0;
const MODE_MODERATE = 1;
const MODE_MODERATE_BAN = 2;
const MODE_MODERATE_MUTE = 3;
const MODE_AMBASSADOR = 4;
const MODE_AMBASSADOR_MUTE = 5;
const MODE_RELATIONSHIP = 6;

export const AvatarInfoWidgetAvatarView: FC<AvatarInfoWidgetAvatarViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const [ mode, setMode ] = useState(MODE_NORMAL);
    const { canRequestFriend = null, getFriend = null, followFriend = null } = useFriends();
    const { report = null } = useHelp();
    const { roomSession = null } = useRoom();
    const { userRespectRemaining = 0, respectUser = null } = useSessionInfo();

    const friend = useMemo(() => getFriend?.(avatarInfo?.webID), [ getFriend, avatarInfo?.webID ]);
    const isFriend = useMemo(() => !canRequestFriend?.(avatarInfo?.webID), [ canRequestFriend, avatarInfo?.webID ]);

    const relationshipDisplay = useMemo(() =>
    {
        if(!friend || friend.relationshipStatus <= 0) return null;
        return RELATIONSHIP_DISPLAY[friend.relationshipStatus] || null;
    }, [ friend ]);

    const [ timeInRoom, setTimeInRoom ] = useState('');

    useEffect(() =>
    {
        if(!avatarInfo) return;

        if(!roomJoinTimes.has(avatarInfo.roomIndex)) roomJoinTimes.set(avatarInfo.roomIndex, Date.now());

        const update = () =>
        {
            const joined = roomJoinTimes.get(avatarInfo.roomIndex);
            if(!joined) return;

            const diffMs = Date.now() - joined;
            const mins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(mins / 60);
            const remainMins = mins % 60;

            if(hrs > 0) setTimeInRoom(`Seit ${hrs}h ${remainMins}min im Raum`);
            else if(mins > 0) setTimeInRoom(`Seit ${mins}min im Raum`);
            else setTimeInRoom('Gerade angekommen');
        };

        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, [ avatarInfo ]);

    const isShowGiveRights = useMemo(() =>
    {
        return (avatarInfo.amIOwner && (avatarInfo.targetRoomControllerLevel < RoomControllerLevel.GUEST) && !avatarInfo.isGuildRoom);
    }, [ avatarInfo ]);

    const isShowRemoveRights = useMemo(() =>
    {
        return (avatarInfo.amIOwner && (avatarInfo.targetRoomControllerLevel === RoomControllerLevel.GUEST) && !avatarInfo.isGuildRoom);
    }, [ avatarInfo ]);

    const moderateMenuHasContent = useMemo(() =>
    {
        return (avatarInfo.canBeKicked || avatarInfo.canBeBanned || avatarInfo.canBeMuted || isShowGiveRights || isShowRemoveRights);
    }, [ isShowGiveRights, isShowRemoveRights, avatarInfo ]);

    const canGiveHandItem = useMemo(() =>
    {
        let flag = false;

        const roomObject = GetOwnRoomObject();

        if(roomObject)
        {
            const carryId = roomObject.model.getValue<number>(RoomObjectVariable.FIGURE_CARRY_OBJECT);

            if((carryId > 0) && (carryId < 999999)) flag = true;
        }

        return flag;
    }, []);

    const processAction = (name: string) =>
    {
        let hideMenu = true;

        if(name)
        {
            switch(name)
            {
                case 'moderate':
                    hideMenu = false;
                    setMode(MODE_MODERATE);
                    break;
                case 'ban':
                    hideMenu = false;
                    setMode(MODE_MODERATE_BAN);
                    break;
                case 'mute':
                    hideMenu = false;
                    setMode(MODE_MODERATE_MUTE);
                    break;
                case 'ambassador':
                    hideMenu = false;
                    setMode(MODE_AMBASSADOR);
                    break;
                case 'ambassador_mute':
                    hideMenu = false;
                    setMode(MODE_AMBASSADOR_MUTE);
                    break;
                case 'back_moderate':
                    hideMenu = false;
                    setMode(MODE_MODERATE);
                    break;
                case 'back_ambassador':
                    hideMenu = false;
                    setMode(MODE_AMBASSADOR);
                    break;
                case 'back':
                    hideMenu = false;
                    setMode(MODE_NORMAL);
                    break;
                case 'whisper':
                    DispatchUiEvent(new RoomWidgetUpdateChatInputContentEvent(RoomWidgetUpdateChatInputContentEvent.WHISPER, avatarInfo.name));
                    break;
                case 'friend':
                    CreateLinkEvent(`friends/request/${ avatarInfo.webID }/${ avatarInfo.name }`);
                    break;
                case 'relationship':
                    hideMenu = false;
                    setMode(MODE_RELATIONSHIP);
                    break;
                case 'respect': {
                    respectUser(avatarInfo.webID);

                    if((userRespectRemaining - 1) >= 1) hideMenu = false;
                    break;
                }
                case 'ignore':
                    GetSessionDataManager().ignoreUser(avatarInfo.name);
                    break;
                case 'unignore':
                    GetSessionDataManager().unignoreUser(avatarInfo.name);
                    break;
                case 'kick':
                    roomSession.sendKickMessage(avatarInfo.webID);
                    break;
                case 'ban_hour':
                    roomSession.sendBanMessage(avatarInfo.webID, 'RWUAM_BAN_USER_HOUR');
                    break;
                case 'ban_day':
                    roomSession.sendBanMessage(avatarInfo.webID, 'RWUAM_BAN_USER_DAY');
                    break;
                case 'perm_ban':
                    roomSession.sendBanMessage(avatarInfo.webID, 'RWUAM_BAN_USER_PERM');
                    break;
                case 'mute_2min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 2);
                    break;
                case 'mute_5min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 5);
                    break;
                case 'mute_10min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 10);
                    break;
                case 'give_rights':
                    roomSession.sendGiveRightsMessage(avatarInfo.webID);
                    break;
                case 'remove_rights':
                    roomSession.sendTakeRightsMessage(avatarInfo.webID);
                    break;
                case 'trade':
                    SendMessageComposer(new TradingOpenComposer(avatarInfo.roomIndex));
                    break;
                case 'report':
                    report(ReportType.BULLY, { reportedUserId: avatarInfo.webID });
                    break;
                case 'follow':
                    if(friend) followFriend(friend);
                    break;
                case 'pass_hand_item':
                    SendMessageComposer(new RoomUnitGiveHandItemComposer(avatarInfo.webID));
                    break;
                case 'ambassador_alert':
                    roomSession.sendAmbassadorAlertMessage(avatarInfo.webID);
                    break;
                case 'ambassador_kick':
                    roomSession.sendKickMessage(avatarInfo.webID);
                    break;
                case 'ambassador_mute_2min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 2);
                    break;
                case 'ambassador_mute_10min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 10);
                    break;
                case 'ambassador_mute_60min':
                    roomSession.sendMuteMessage(avatarInfo.webID, 60);
                    break;
                case 'ambassador_mute_18hour':
                    roomSession.sendMuteMessage(avatarInfo.webID, 1080);
                    break;
                case 'rship_heart':
                    SendMessageComposer(new SetRelationshipStatusComposer(avatarInfo.webID, MessengerFriend.RELATIONSHIP_HEART));
                    break;
                case 'rship_smile':
                    SendMessageComposer(new SetRelationshipStatusComposer(avatarInfo.webID, MessengerFriend.RELATIONSHIP_SMILE));
                    break;
                case 'rship_bobba':
                    SendMessageComposer(new SetRelationshipStatusComposer(avatarInfo.webID, MessengerFriend.RELATIONSHIP_BOBBA));
                    break;
                case 'rship_none':
                    SendMessageComposer(new SetRelationshipStatusComposer(avatarInfo.webID, MessengerFriend.RELATIONSHIP_NONE));
                    break;
            }
        }

        if(hideMenu) onClose();
    }

    useEffect(() =>
    {
        setMode(MODE_NORMAL);
    }, [ avatarInfo ]);

    return (
        <ContextMenuView objectId={ avatarInfo.roomIndex } category={ RoomObjectCategory.UNIT } userType={ avatarInfo.userType } onClose={ onClose } collapsable={ true }>
            <ContextMenuHeaderView
                className="cursor-pointer"
                onClick={ event => GetUserProfile(avatarInfo.webID) }
                subtitle={ timeInRoom || undefined }
                relationshipIcon={ relationshipDisplay?.icon }
                relationshipColor={ relationshipDisplay?.color }
            >
                { avatarInfo.name }
            </ContextMenuHeaderView>
            { (mode === MODE_NORMAL) &&
                <>
                    { canRequestFriend(avatarInfo.webID) &&
                        <ContextMenuListItemView onClick={ event => processAction('friend') }>
                            <UserPlus className="menu-icon" />
                            { LocalizeText('infostand.button.friend') }
                        </ContextMenuListItemView> }
                    <ContextMenuListItemView onClick={ event => processAction('trade') }>
                        <ArrowLeftRight className="menu-icon" />
                        { LocalizeText('infostand.button.trade') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('whisper') }>
                        <Volume2 className="menu-icon" />
                        { LocalizeText('infostand.button.whisper') }
                    </ContextMenuListItemView>
                    { (userRespectRemaining > 0) &&
                        <ContextMenuListItemView onClick={ event => processAction('respect') }>
                            <Star className="menu-icon" />
                            { LocalizeText('infostand.button.respect', [ 'count' ], [ userRespectRemaining.toString() ]) }
                        </ContextMenuListItemView> }
                    { isFriend && friend?.followingAllowed &&
                        <ContextMenuListItemView onClick={ event => processAction('follow') }>
                            <UserRoundSearch className="menu-icon" />
                            Folgen
                        </ContextMenuListItemView> }
                    { isFriend &&
                        <ContextMenuListItemView onClick={ event => processAction('relationship') }>
                            <Heart className="menu-icon" />
                            { LocalizeText('infostand.link.relationship') }
                            <FaChevronRight className="right fa-icon" />
                        </ContextMenuListItemView> }
                    { !avatarInfo.isIgnored &&
                        <ContextMenuListItemView onClick={ event => processAction('ignore') }>
                            <EyeOff className="menu-icon" />
                            { LocalizeText('infostand.button.ignore') }
                        </ContextMenuListItemView> }
                    { avatarInfo.isIgnored &&
                        <ContextMenuListItemView onClick={ event => processAction('unignore') }>
                            <Eye className="menu-icon" />
                            { LocalizeText('infostand.button.unignore') }
                        </ContextMenuListItemView> }
                    { canGiveHandItem &&
                        <ContextMenuListItemView onClick={ event => processAction('pass_hand_item') }>
                            <Handshake className="menu-icon" />
                            { LocalizeText('avatar.widget.pass_hand_item') }
                        </ContextMenuListItemView> }
                    <ContextMenuListItemView classNames={ [ 'menu-item-danger' ] } onClick={ event => processAction('report') }>
                        <Flag className="menu-icon" />
                        { LocalizeText('infostand.button.report') }
                    </ContextMenuListItemView>
                    { moderateMenuHasContent &&
                        <ContextMenuListItemView classNames={ [ 'menu-item-warning' ] } onClick={ event => processAction('moderate') }>
                            <Shield className="menu-icon" />
                            { LocalizeText('infostand.link.moderate') }
                            <FaChevronRight className="right fa-icon" />
                        </ContextMenuListItemView> }
                    { avatarInfo.isAmbassador &&
                        <ContextMenuListItemView classNames={ [ 'menu-item-warning' ] } onClick={ event => processAction('ambassador') }>
                            <Crown className="menu-icon" />
                            { LocalizeText('infostand.link.ambassador') }
                            <FaChevronRight className="right fa-icon" />
                        </ContextMenuListItemView> }
                </> }
            { (mode === MODE_MODERATE) &&
                <>
                    <ContextMenuListItemView onClick={ event => processAction('kick') }>
                        { LocalizeText('infostand.button.kick') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('mute') }>
                        <FaChevronRight className="right fa-icon" />
                        { LocalizeText('infostand.button.mute') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ban') }>
                        <FaChevronRight className="right fa-icon" />
                        { LocalizeText('infostand.button.ban') }
                    </ContextMenuListItemView>
                    { isShowGiveRights &&
                        <ContextMenuListItemView onClick={ event => processAction('give_rights') }>
                            { LocalizeText('infostand.button.giverights') }
                        </ContextMenuListItemView> }
                    { isShowRemoveRights &&
                        <ContextMenuListItemView onClick={ event => processAction('remove_rights') }>
                            { LocalizeText('infostand.button.removerights') }
                        </ContextMenuListItemView> }
                    <ContextMenuListItemView onClick={ event => processAction('back') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
            { (mode === MODE_MODERATE_BAN) &&
                <>
                    <ContextMenuListItemView onClick={ event => processAction('ban_hour') }>
                        { LocalizeText('infostand.button.ban_hour') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ban_day') }>
                        { LocalizeText('infostand.button.ban_day') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('perm_ban') }>
                        { LocalizeText('infostand.button.perm_ban') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('back_moderate') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
            { (mode === MODE_MODERATE_MUTE) &&
                <>
                    <ContextMenuListItemView onClick={ event => processAction('mute_2min') }>
                        { LocalizeText('infostand.button.mute_2min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('mute_5min') }>
                        { LocalizeText('infostand.button.mute_5min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('mute_10min') }>
                        { LocalizeText('infostand.button.mute_10min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('back_moderate') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
            { (mode === MODE_AMBASSADOR) &&
                <>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_alert') }>
                        { LocalizeText('infostand.button.alert') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_kick') }>
                        { LocalizeText('infostand.button.kick') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_mute') }>
                        { LocalizeText('infostand.button.mute') }
                        <FaChevronRight className="right fa-icon" />
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('back') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
            { (mode === MODE_AMBASSADOR_MUTE) &&
                <>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_mute_2min') }>
                        { LocalizeText('infostand.button.mute_2min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_mute_10min') }>
                        { LocalizeText('infostand.button.mute_10min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_mute_60min') }>
                        { LocalizeText('infostand.button.mute_60min') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('ambassador_mute_18hr') }>
                        { LocalizeText('infostand.button.mute_18hour') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('back_ambassador') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
            { (mode === MODE_RELATIONSHIP) &&
                <>
                    <Flex className="menu-list-split-3">
                        <ContextMenuListItemView onClick={ event => processAction('rship_heart') }>
                            <Base pointer className="nitro-friends-spritesheet icon-heart" />
                        </ContextMenuListItemView>
                        <ContextMenuListItemView onClick={ event => processAction('rship_smile') }>
                            <Base pointer className="nitro-friends-spritesheet icon-smile" />
                        </ContextMenuListItemView>
                        <ContextMenuListItemView onClick={ event => processAction('rship_bobba') }>
                            <Base pointer className="nitro-friends-spritesheet icon-bobba" />
                        </ContextMenuListItemView>
                    </Flex>
                    <ContextMenuListItemView onClick={ event => processAction('rship_none') }>
                        { LocalizeText('avatar.widget.clear_relationship') }
                    </ContextMenuListItemView>
                    <ContextMenuListItemView onClick={ event => processAction('back') }>
                        <FaChevronLeft className="left fa-icon" />
                        { LocalizeText('generic.back') }
                    </ContextMenuListItemView>
                </> }
        </ContextMenuView>
    );
}
