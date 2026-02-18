import { CrackableDataType, GroupInformationComposer, GroupInformationEvent, NowPlayingEvent, RoomControllerLevel, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable, RoomWidgetEnumItemExtradataParameter, RoomWidgetFurniInfoUsagePolicyEnum, SetObjectDataMessageComposer, SongInfoReceivedEvent, StringDataType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes, FaUser, FaAlignLeft, FaMusic, FaUserAlt } from 'react-icons/fa';
import { AvatarInfoFurni, CreateLinkEvent, GetGroupInformation, GetNitroInstance, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../../../api';
import { Base, Button, Column, Flex, LayoutBadgeImageView, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, Text, UserProfileIconView } from '../../../../../common';
import { useMessageEvent, useRoom, useSoundEvent } from '../../../../../hooks';

interface InfoStandWidgetFurniViewProps
{
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

const PICKUP_MODE_NONE: number = 0;
const PICKUP_MODE_EJECT: number = 1;
const PICKUP_MODE_FULL: number = 2;

export const InfoStandWidgetFurniView: FC<InfoStandWidgetFurniViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const { roomSession = null } = useRoom();
    
    const [ pickupMode, setPickupMode ] = useState(0);
    const [ canMove, setCanMove ] = useState(false);
    const [ canRotate, setCanRotate ] = useState(false);
    const [ canUse, setCanUse ] = useState(false);
    const [ furniKeys, setFurniKeys ] = useState<string[]>([]);
    const [ furniValues, setFurniValues ] = useState<string[]>([]);
    const [ customKeys, setCustomKeys ] = useState<string[]>([]);
    const [ customValues, setCustomValues ] = useState<string[]>([]);
    const [ isCrackable, setIsCrackable ] = useState(false);
    const [ crackableHits, setCrackableHits ] = useState(0);
    const [ crackableTarget, setCrackableTarget ] = useState(0);
    const [ godMode, setGodMode ] = useState(false);
    const [ canSeeFurniId, setCanSeeFurniId ] = useState(false);
    const [ groupName, setGroupName ] = useState<string>(null);
    const [ isJukeBox, setIsJukeBox ] = useState<boolean>(false);
    const [ isSongDisk, setIsSongDisk ] = useState<boolean>(false);
    const [ songId, setSongId ] = useState<number>(-1);
    const [ songName, setSongName ] = useState<string>('');
    const [ songCreator, setSongCreator ] = useState<string>('');

    useSoundEvent<NowPlayingEvent>(NowPlayingEvent.NPE_SONG_CHANGED, event =>
    {
        setSongId(event.id);
    }, (isJukeBox || isSongDisk));

    useSoundEvent<NowPlayingEvent>(SongInfoReceivedEvent.SIR_TRAX_SONG_INFO_RECEIVED, event =>
    {
        if(event.id !== songId) return;
        
        const songInfo = GetNitroInstance().soundManager.musicController.getSongInfo(event.id);

        if(!songInfo) return;

        setSongName(songInfo.name);
        setSongCreator(songInfo.creator);
    }, (isJukeBox || isSongDisk));

    useEffect(() =>
    {
        let pickupMode = PICKUP_MODE_NONE;
        let canMove = false;
        let canRotate = false;
        let canUse = false;
        let furniKeyss: string[] = [];
        let furniValuess: string[] = [];
        let customKeyss: string[] = [];
        let customValuess: string[] = [];
        let isCrackable = false;
        let crackableHits = 0;
        let crackableTarget = 0;
        let godMode = false;
        let canSeeFurniId = false;
        let furniIsJukebox = false;
        let furniIsSongDisk = false;
        let furniSongId = -1;
        
        const isValidController = (avatarInfo.roomControllerLevel >= RoomControllerLevel.GUEST);

        if(isValidController || avatarInfo.isOwner || avatarInfo.isRoomOwner || avatarInfo.isAnyRoomController)
        {
            canMove = true;
            canRotate = !avatarInfo.isWallItem;

            if(avatarInfo.roomControllerLevel >= RoomControllerLevel.MODERATOR) godMode = true;
        }

        if(avatarInfo.isAnyRoomController)
        {
            canSeeFurniId = true;
        }
        
        if((((avatarInfo.usagePolicy === RoomWidgetFurniInfoUsagePolicyEnum.EVERYBODY) || ((avatarInfo.usagePolicy === RoomWidgetFurniInfoUsagePolicyEnum.CONTROLLER) && isValidController)) || ((avatarInfo.extraParam === RoomWidgetEnumItemExtradataParameter.JUKEBOX) && isValidController)) || ((avatarInfo.extraParam === RoomWidgetEnumItemExtradataParameter.USABLE_PRODUCT) && isValidController)) canUse = true;

        if(avatarInfo.extraParam)
        {
            if(avatarInfo.extraParam === RoomWidgetEnumItemExtradataParameter.CRACKABLE_FURNI)
            {
                const stuffData = (avatarInfo.stuffData as CrackableDataType);

                canUse = true;
                isCrackable = true;
                crackableHits = stuffData.hits;
                crackableTarget = stuffData.target;
            }

            else if(avatarInfo.extraParam === RoomWidgetEnumItemExtradataParameter.JUKEBOX)
            {
                const playlist = GetNitroInstance().soundManager.musicController.getRoomItemPlaylist();

                if(playlist)
                {
                    furniSongId = playlist.nowPlayingSongId;
                }

                furniIsJukebox = true;
            }

            else if(avatarInfo.extraParam.indexOf(RoomWidgetEnumItemExtradataParameter.SONGDISK) === 0)
            {
                furniSongId = parseInt(avatarInfo.extraParam.substr(RoomWidgetEnumItemExtradataParameter.SONGDISK.length));
                
                furniIsSongDisk = true;
            }

            if(godMode)
            {
                const extraParam = avatarInfo.extraParam.substr(RoomWidgetEnumItemExtradataParameter.BRANDING_OPTIONS.length);

                if(extraParam)
                {
                    const parts = extraParam.split('\t');

                    for(const part of parts)
                    {
                        const value = part.split('=');

                        if(value && (value.length === 2))
                        {
                            furniKeyss.push(value[0]);
                            furniValuess.push(value[1]);
                        }
                    }
                }
            }
        }

        if(godMode)
        {
            const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, avatarInfo.id, (avatarInfo.isWallItem) ? RoomObjectCategory.WALL : RoomObjectCategory.FLOOR);

            if(roomObject)
            {
                const customVariables = roomObject.model.getValue<string[]>(RoomObjectVariable.FURNITURE_CUSTOM_VARIABLES);
                const furnitureData = roomObject.model.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);

                if(customVariables && customVariables.length)
                {
                    for(const customVariable of customVariables)
                    {
                        customKeyss.push(customVariable);
                        customValuess.push((furnitureData[customVariable]) || '');
                    }
                }
            }
        }

        if(avatarInfo.isOwner || avatarInfo.isAnyRoomController) pickupMode = PICKUP_MODE_FULL;

        else if(avatarInfo.isRoomOwner || (avatarInfo.roomControllerLevel >= RoomControllerLevel.GUILD_ADMIN)) pickupMode = PICKUP_MODE_EJECT;

        if(avatarInfo.isStickie) pickupMode = PICKUP_MODE_NONE;

        setPickupMode(pickupMode);
        setCanMove(canMove);
        setCanRotate(canRotate);
        setCanUse(canUse);
        setFurniKeys(furniKeyss);
        setFurniValues(furniValuess);
        setCustomKeys(customKeyss);
        setCustomValues(customValuess);
        setIsCrackable(isCrackable);
        setCrackableHits(crackableHits);
        setCrackableTarget(crackableTarget);
        setGodMode(godMode);
        setCanSeeFurniId(canSeeFurniId);
        setGroupName(null);
        setIsJukeBox(furniIsJukebox);
        setIsSongDisk(furniIsSongDisk);
        setSongId(furniSongId);
        
        if(avatarInfo.groupId) SendMessageComposer(new GroupInformationComposer(avatarInfo.groupId, false));
    }, [ roomSession, avatarInfo ]);

    useMessageEvent<GroupInformationEvent>(GroupInformationEvent, event =>
    {
        const parser = event.getParser();

        if(!avatarInfo || avatarInfo.groupId !== parser.id || parser.flag) return;

        if(groupName) setGroupName(null);

        setGroupName(parser.title);
    });

    useEffect(() =>
    {
        const songInfo = GetNitroInstance().soundManager.musicController.getSongInfo(songId);

        setSongName(songInfo?.name ?? '');
        setSongCreator(songInfo?.creator ?? '');
    }, [ songId ]);

    const onFurniSettingChange = useCallback((index: number, value: string) =>
    {
        const clone = Array.from(furniValues);

        clone[index] = value;

        setFurniValues(clone);
    }, [ furniValues ]);

    const onCustomVariableChange = useCallback((index: number, value: string) =>
    {
        const clone = Array.from(customValues);

        clone[index] = value;

        setCustomValues(clone);
    }, [ customValues ]);

    const getFurniSettingsAsString = useCallback(() =>
    {
        if(furniKeys.length === 0 || furniValues.length === 0) return '';

        let data = '';

        let i = 0;

        while(i < furniKeys.length)
        {
            const key = furniKeys[i];
            const value = furniValues[i];

            data = (data + (key + '=' + value + '\t'));

            i++;
        }

        return data;
    }, [ furniKeys, furniValues ]);

    const processButtonAction = useCallback((action: string) =>
    {
        if(!action || (action === '')) return;

        let objectData: string = null;

        switch(action)
        {
            case 'buy_one':
                CreateLinkEvent(`catalog/open/offerId/${ avatarInfo.purchaseOfferId }`);
                return;
            case 'move':
                GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_MOVE);
                break;
            case 'rotate':
                GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
                break;
            case 'pickup':
                if(pickupMode === PICKUP_MODE_FULL)
                {
                    GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_PICKUP);
                }
                else
                {
                    GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_EJECT);
                }
                break;
            case 'use':
                GetRoomEngine().useRoomObject(avatarInfo.id, avatarInfo.category);
                break;
            case 'save_branding_configuration': {
                const mapData = new Map<string, string>();
                const dataParts = getFurniSettingsAsString().split('\t');

                if(dataParts)
                {
                    for(const part of dataParts)
                    {
                        const [ key, value ] = part.split('=', 2);
                        
                        mapData.set(key, value);
                    }
                }

                GetRoomEngine().modifyRoomObjectDataWithMap(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_SAVE_STUFF_DATA, mapData);
                break;
            }
            case 'save_custom_variables': {
                const map = new Map();

                for(let i = 0; i < customKeys.length; i++)
                {
                    const key = customKeys[i];
                    const value = customValues[i];

                    if((key && key.length) && (value && value.length)) map.set(key, value);
                }

                SendMessageComposer(new SetObjectDataMessageComposer(avatarInfo.id, map));
                break;
            }
        }
    }, [ avatarInfo, pickupMode, customKeys, customValues, getFurniSettingsAsString ]);

    const getGroupBadgeCode = useCallback(() =>
    {
        const stringDataType = (avatarInfo.stuffData as StringDataType);

        if(!stringDataType || !(stringDataType instanceof StringDataType)) return null;

        return stringDataType.getValue(2);
    }, [ avatarInfo ]);

    if(!avatarInfo) return null;

    const actionButtons: { label: string; action: string }[] = [];

    if(canMove) actionButtons.push({ label: LocalizeText('infostand.button.move'), action: 'move' });
    if(canRotate) actionButtons.push({ label: LocalizeText('infostand.button.rotate'), action: 'rotate' });
    if(pickupMode !== PICKUP_MODE_NONE) actionButtons.push({ label: LocalizeText((pickupMode === PICKUP_MODE_EJECT) ? 'infostand.button.eject' : 'infostand.button.pickup'), action: 'pickup' });
    if(canUse) actionButtons.push({ label: LocalizeText('infostand.button.use'), action: 'use' });
    if(furniKeys.length > 0 && furniValues.length > 0 && furniKeys.length === furniValues.length) actionButtons.push({ label: LocalizeText('save'), action: 'save_branding_configuration' });
    if(customKeys.length > 0 && customValues.length > 0 && customKeys.length === customValues.length) actionButtons.push({ label: LocalizeText('save'), action: 'save_custom_variables' });

    return (
        <Column gap={ 0 } alignItems="end">
            <Column className="nitro-infostand furni-compact rounded" overflow="visible">
                <Flex position="relative" justifyContent="center" alignItems="center" className="furni-preview">
                    <FaTimes className="cursor-pointer furni-close" onClick={ onClose } />
                    { avatarInfo.stuffData.isUnique &&
                        <div className="absolute left-1 top-1">
                            <LayoutLimitedEditionCompactPlateView uniqueNumber={ avatarInfo.stuffData.uniqueNumber } uniqueSeries={ avatarInfo.stuffData.uniqueSeries } />
                        </div> }
                    { (avatarInfo.stuffData.rarityLevel > -1) &&
                        <div className="absolute left-1 top-1">
                            <LayoutRarityLevelView level={ avatarInfo.stuffData.rarityLevel } />
                        </div> }
                    { avatarInfo.image && avatarInfo.image.src.length &&
                        <img src={ avatarInfo.image.src } alt="" /> }
                </Flex>
                <Column className="furni-info" gap={ 0 }>
                    <Text variant="white" className="furni-name">{ avatarInfo.name }</Text>
                    { avatarInfo.description &&
                        <Text variant="white" className="furni-desc">{ avatarInfo.description }</Text> }
                    <Flex alignItems="center" gap={ 1 } className="furni-meta">
                        <FaUser className="furni-meta-icon" />
                        <UserProfileIconView userId={ avatarInfo.ownerId } />
                        <Text variant="white" small wrap>{ avatarInfo.ownerName }</Text>
                        { (avatarInfo.purchaseOfferId > 0) &&
                            <Text variant="white" small underline pointer className="ml-auto" onClick={ event => processButtonAction('buy_one') }>
                                { LocalizeText('infostand.button.buy') }
                            </Text> }
                    </Flex>
                    { (isJukeBox || isSongDisk) &&
                        <>
                            { (songId === -1) &&
                                <Flex alignItems="center" gap={ 1 } className="furni-meta">
                                    <FaMusic className="furni-meta-icon" />
                                    <Text variant="white" small wrap>{ LocalizeText('infostand.jukebox.text.not.playing') }</Text>
                                </Flex> }
                            { !!songName.length &&
                                <Flex alignItems="center" gap={ 1 } className="furni-meta">
                                    <FaMusic className="furni-meta-icon" />
                                    <Text variant="white" small wrap>{ songName }</Text>
                                </Flex> }
                            { !!songCreator.length &&
                                <Flex alignItems="center" gap={ 1 } className="furni-meta">
                                    <FaUserAlt className="furni-meta-icon" />
                                    <Text variant="white" small wrap>{ songCreator }</Text>
                                </Flex> }
                        </> }
                    { isCrackable &&
                        <Text variant="white" small wrap className="furni-meta-text">
                            { LocalizeText('infostand.crackable_furni.hits_remaining', [ 'hits', 'target' ], [ crackableHits.toString(), crackableTarget.toString() ]) }
                        </Text> }
                    { avatarInfo.groupId > 0 &&
                        <Flex pointer alignItems="center" gap={ 1 } className="furni-meta" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                            <LayoutBadgeImageView badgeCode={ getGroupBadgeCode() } isGroup={ true } />
                            <Text variant="white" small underline>{ groupName }</Text>
                        </Flex> }
                    { godMode && canSeeFurniId &&
                        <Text small wrap variant="white" className="furni-id">ID: { avatarInfo.id }</Text> }
                    { godMode && (furniKeys.length > 0) &&
                        <Column gap={ 1 } className="furni-meta">
                            { furniKeys.map((key, index) =>
                            {
                                return (
                                    <Flex key={ index } alignItems="center" gap={ 1 }>
                                        <Text small wrap align="end" variant="white" className="col-4">{ key }</Text>
                                        <input type="text" className="form-control form-control-sm" value={ furniValues[index] } onChange={ event => onFurniSettingChange(index, event.target.value) }/>
                                    </Flex>);
                            }) }
                        </Column> }
                    { (customKeys.length > 0) &&
                        <Column gap={ 1 } className="furni-meta">
                            { customKeys.map((key, index) =>
                            {
                                return (
                                    <Flex key={ index } alignItems="center" gap={ 1 }>
                                        <Text small wrap align="end" variant="white" className="col-4">{ key }</Text>
                                        <input type="text" className="form-control form-control-sm" value={ customValues[index] } onChange={ event => onCustomVariableChange(index, event.target.value) }/>
                                    </Flex>);
                            }) }
                        </Column> }
                </Column>
                { actionButtons.length > 0 &&
                    <Flex alignItems="stretch" className="furni-actions">
                        { actionButtons.map((btn, i) =>
                        {
                            return (
                                <Flex key={ i } grow justifyContent="center" alignItems="center" pointer className="furni-action" onClick={ () => processButtonAction(btn.action) }>
                                    { btn.label }
                                </Flex>
                            );
                        }) }
                    </Flex> }
            </Column>
        </Column>
    );
}
