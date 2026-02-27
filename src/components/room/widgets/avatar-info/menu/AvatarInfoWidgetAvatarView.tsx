import { RoomControllerLevel, RoomObjectCategory, RoomObjectVariable, RoomUnitGiveHandItemComposer, SetRelationshipStatusComposer, TradingOpenComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Clock, Crown, Eye, EyeOff, Flag, Handshake, Heart, Shield, Star, UserPlus, UserRoundSearch, Volume2 } from 'lucide-react';
import { AvatarInfoUser, CreateLinkEvent, DispatchUiEvent, GetOwnRoomObject, GetSessionDataManager, GetUserProfile, LocalizeText, MessengerFriend, ReportType, RoomWidgetUpdateChatInputContentEvent, SendMessageComposer } from '../../../../../api';
import { Base } from '../../../../../common';
import { useFriends, useHelp, useRoom, useSessionInfo } from '../../../../../hooks';
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

    const MI = 'group w-full flex items-center gap-2 px-3 py-[6px] text-[12px] font-medium text-white/80 hover:bg-white/10 cursor-pointer transition-all duration-75 rounded-[3px]';
    const IC = 'size-3.5 shrink-0 text-white/45 group-hover:text-white/75 transition-colors';
    const AR = 'size-3 text-white/30 group-hover:text-white/50 transition-colors ml-auto';
    const DANGER = 'group w-full flex items-center gap-2 px-3 py-[6px] text-[12px] font-medium text-red-400 hover:bg-red-500/10 cursor-pointer transition-all duration-75 rounded-[3px]';
    const WARNING = 'group w-full flex items-center gap-2 px-3 py-[6px] text-[12px] font-medium text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-all duration-75 rounded-[3px]';
    const BACK = `${ MI } text-white/50`;

    return (
        <ContextMenuView objectId={ avatarInfo.roomIndex } category={ RoomObjectCategory.UNIT } userType={ avatarInfo.userType } onClose={ onClose } collapsable={ true }>
            {/* Header */}
            <button onClick={ () => GetUserProfile(avatarInfo.webID) } className="w-full px-3 py-2 text-center border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors rounded-t-[3px]">
                <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[13px] font-bold text-white/90">{ avatarInfo.name }</span>
                    { relationshipDisplay && <span style={{ fontSize: '12px', color: relationshipDisplay.color }}>{ relationshipDisplay.icon }</span> }
                </div>
                { timeInRoom && <p className="text-[10px] text-white/40 mt-0.5 flex items-center justify-center gap-1"><Clock className="size-2.5" />{ timeInRoom }</p> }
            </button>

            { (mode === MODE_NORMAL) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    { canRequestFriend(avatarInfo.webID) &&
                        <button className={ MI } onClick={ () => processAction('friend') }>
                            <UserPlus className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.friend') }</span>
                        </button> }
                    <button className={ MI } onClick={ () => processAction('trade') }>
                        <ArrowLeftRight className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.trade') }</span>
                    </button>
                    <button className={ MI } onClick={ () => processAction('whisper') }>
                        <Volume2 className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.whisper') }</span>
                    </button>
                    { (userRespectRemaining > 0) &&
                        <button className={ MI } onClick={ () => processAction('respect') }>
                            <Star className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.respect', [ 'count' ], [ userRespectRemaining.toString() ]) }</span>
                        </button> }
                    { isFriend && friend?.followingAllowed &&
                        <button className={ MI } onClick={ () => processAction('follow') }>
                            <UserRoundSearch className={ IC } />
                            <span className="flex-1 text-left truncate">Folgen</span>
                        </button> }
                    { isFriend &&
                        <button className={ MI } onClick={ () => processAction('relationship') }>
                            <Heart className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.link.relationship') }</span>
                            <ChevronRight className={ AR } />
                        </button> }
                    { !avatarInfo.isIgnored &&
                        <button className={ MI } onClick={ () => processAction('ignore') }>
                            <EyeOff className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.ignore') }</span>
                        </button> }
                    { avatarInfo.isIgnored &&
                        <button className={ MI } onClick={ () => processAction('unignore') }>
                            <Eye className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.unignore') }</span>
                        </button> }
                    { canGiveHandItem &&
                        <button className={ MI } onClick={ () => processAction('pass_hand_item') }>
                            <Handshake className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('avatar.widget.pass_hand_item') }</span>
                        </button> }
                    <button className={ DANGER } onClick={ () => processAction('report') }>
                        <Flag className="size-3.5 shrink-0 text-red-400/70 group-hover:text-red-400 transition-colors" />
                        <span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.report') }</span>
                    </button>
                    { moderateMenuHasContent &&
                        <button className={ WARNING } onClick={ () => processAction('moderate') }>
                            <Shield className="size-3.5 shrink-0 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.link.moderate') }</span>
                            <ChevronRight className="size-3 text-amber-400/30 group-hover:text-amber-400/60 transition-colors ml-auto" />
                        </button> }
                    { avatarInfo.isAmbassador &&
                        <button className={ WARNING } onClick={ () => processAction('ambassador') }>
                            <Crown className="size-3.5 shrink-0 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                            <span className="flex-1 text-left truncate">{ LocalizeText('infostand.link.ambassador') }</span>
                            <ChevronRight className="size-3 text-amber-400/30 group-hover:text-amber-400/60 transition-colors ml-auto" />
                        </button> }
                </div> }

            { (mode === MODE_MODERATE) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    <button className={ MI } onClick={ () => processAction('kick') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.kick') }</span></button>
                    <button className={ MI } onClick={ () => processAction('mute') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute') }</span><ChevronRight className={ AR } /></button>
                    <button className={ MI } onClick={ () => processAction('ban') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.ban') }</span><ChevronRight className={ AR } /></button>
                    { isShowGiveRights && <button className={ MI } onClick={ () => processAction('give_rights') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.giverights') }</span></button> }
                    { isShowRemoveRights && <button className={ MI } onClick={ () => processAction('remove_rights') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.removerights') }</span></button> }
                    <button className={ BACK } onClick={ () => processAction('back') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }

            { (mode === MODE_MODERATE_BAN) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    <button className={ MI } onClick={ () => processAction('ban_hour') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.ban_hour') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ban_day') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.ban_day') }</span></button>
                    <button className={ MI } onClick={ () => processAction('perm_ban') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.perm_ban') }</span></button>
                    <button className={ BACK } onClick={ () => processAction('back_moderate') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }

            { (mode === MODE_MODERATE_MUTE) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    <button className={ MI } onClick={ () => processAction('mute_2min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_2min') }</span></button>
                    <button className={ MI } onClick={ () => processAction('mute_5min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_5min') }</span></button>
                    <button className={ MI } onClick={ () => processAction('mute_10min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_10min') }</span></button>
                    <button className={ BACK } onClick={ () => processAction('back_moderate') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }

            { (mode === MODE_AMBASSADOR) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    <button className={ MI } onClick={ () => processAction('ambassador_alert') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.alert') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ambassador_kick') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.kick') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ambassador_mute') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute') }</span><ChevronRight className={ AR } /></button>
                    <button className={ BACK } onClick={ () => processAction('back') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }

            { (mode === MODE_AMBASSADOR_MUTE) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    <button className={ MI } onClick={ () => processAction('ambassador_mute_2min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_2min') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ambassador_mute_10min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_10min') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ambassador_mute_60min') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_60min') }</span></button>
                    <button className={ MI } onClick={ () => processAction('ambassador_mute_18hr') }><span className="flex-1 text-left truncate">{ LocalizeText('infostand.button.mute_18hour') }</span></button>
                    <button className={ BACK } onClick={ () => processAction('back_ambassador') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }

            { (mode === MODE_RELATIONSHIP) &&
                <div className="p-1 space-y-0.5">
                    <div className="grid grid-cols-3 gap-1">
                        <button onClick={ () => processAction('rship_heart') } className="h-8 rounded bg-white/5 hover:bg-rose-500/15 hover:text-rose-400 text-white/80 cursor-pointer transition-all flex items-center justify-center">
                            <Base pointer className="nitro-friends-spritesheet icon-heart" />
                        </button>
                        <button onClick={ () => processAction('rship_smile') } className="h-8 rounded bg-white/5 hover:bg-amber-500/15 hover:text-amber-400 text-white/80 cursor-pointer transition-all flex items-center justify-center">
                            <Base pointer className="nitro-friends-spritesheet icon-smile" />
                        </button>
                        <button onClick={ () => processAction('rship_bobba') } className="h-8 rounded bg-white/5 hover:bg-violet-500/15 hover:text-violet-400 text-white/80 cursor-pointer transition-all flex items-center justify-center">
                            <Base pointer className="nitro-friends-spritesheet icon-bobba" />
                        </button>
                    </div>
                    <button className={ MI } onClick={ () => processAction('rship_none') }><span className="flex-1 text-left truncate">{ LocalizeText('avatar.widget.clear_relationship') }</span></button>
                    <button className={ BACK } onClick={ () => processAction('back') }><ChevronLeft className="size-3 text-white/30" /><span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span></button>
                </div> }
        </ContextMenuView>
    );
}
