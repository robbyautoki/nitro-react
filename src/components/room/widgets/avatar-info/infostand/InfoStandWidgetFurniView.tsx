import { CrackableDataType, FurnitureFloorUpdateComposer, FurnitureStackHeightComposer, GroupInformationComposer, GroupInformationEvent, NowPlayingEvent, RoomControllerLevel, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable, RoomWidgetEnumItemExtradataParameter, RoomWidgetFurniInfoUsagePolicyEnum, SetObjectDataMessageComposer, SongInfoReceivedEvent, StringDataType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaTimes, FaUser, FaMusic, FaUserAlt, FaShoppingCart, FaListUl, FaWrench, FaUndo, FaRedo } from 'react-icons/fa';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AvatarInfoFurni, CreateLinkEvent, GetGroupInformation, GetNitroInstance, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../../../api';
import { Base, Button, Column, Flex, LayoutBadgeImageView, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, Text, UserProfileIconView } from '../../../../../common';
import { useMessageEvent, useRoom, useSoundEvent } from '../../../../../hooks';
import { useFurnitureRarity } from '../../../../../hooks/rooms/widgets/useFurnitureRarity';

interface InfoStandWidgetFurniViewProps
{
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

const PICKUP_MODE_NONE: number = 0;
const PICKUP_MODE_EJECT: number = 1;
const PICKUP_MODE_FULL: number = 2;

const RARITY_CSS_MAP: Record<string, string> = {
    'og_rare': 'rarity-og',
    'weekly_rare': 'rarity-weekly',
    'monthly_rare': 'rarity-monthly',
    'cashshop_rare': 'rarity-cashshop',
    'bonzen_rare': 'rarity-bonzen',
};

const SEAL_CSS_MAP: Record<string, string> = {
    'og_rare': 'seal-og',
    'weekly_rare': 'seal-weekly',
    'monthly_rare': 'seal-monthly',
    'cashshop_rare': 'seal-cashshop',
    'bonzen_rare': 'seal-bonzen',
};

export const InfoStandWidgetFurniView: FC<InfoStandWidgetFurniViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const { roomSession = null } = useRoom();
    const { rarityData } = useFurnitureRarity(avatarInfo?.typeId ?? 0);

    const [ pickupMode, setPickupMode ] = useState(0);
    const [ canMove, setCanMove ] = useState(false);
    const [ canRotate, setCanRotate ] = useState(false);
    const [ canUse, setCanUse ] = useState(false);
    const [ furniKeys, setFurniKeys ] = useState<string[]>([]);
    const [ furniValues, setFurniValues ] = useState<string[]>([]);
    const [ customKeys, setCustomKeys ] = useState<string[]>([]);
    const [ customValues, setCustomValues ] = useState<string[]>([]);
    const [ isEditorOpen, setIsEditorOpen ] = useState(false);
    const [ livePos, setLivePos ] = useState({ x: 0, y: 0, z: 0 });
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

    const isLtd = avatarInfo?.stuffData?.isUnique ?? false;
    const isRarity = !!rarityData;

    const panelClass = useMemo(() =>
    {
        if(rarityData) return RARITY_CSS_MAP[rarityData.rarityType.name] || '';
        if(isLtd) return 'rarity-ltd';
        return '';
    }, [ rarityData, isLtd ]);

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

    useEffect(() =>
    {
        if(!isEditorOpen || !roomSession || !avatarInfo || avatarInfo.isWallItem) return;

        const refresh = () =>
        {
            const obj = GetRoomEngine().getRoomObject(roomSession.roomId, avatarInfo.id, RoomObjectCategory.FLOOR);

            if(obj)
            {
                const loc = obj.getLocation();

                setLivePos({ x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.round(loc.z * 100) / 100 });
            }
        };

        refresh();
        const interval = setInterval(refresh, 300);

        return () => clearInterval(interval);
    }, [ isEditorOpen, roomSession, avatarInfo ]);

    const handleMoveDirection = useCallback((deltaX: number, deltaY: number) =>
    {
        if(!canMove || !roomSession) return;

        const obj = GetRoomEngine().getRoomObject(roomSession.roomId, avatarInfo.id, RoomObjectCategory.FLOOR);

        if(!obj) return;

        const loc = obj.getLocation();
        const dir = Math.trunc((obj.getDirection().x % 360) / 45);

        SendMessageComposer(new FurnitureFloorUpdateComposer(avatarInfo.id, Math.floor(loc.x) + deltaX, Math.floor(loc.y) + deltaY, dir));
    }, [ avatarInfo, canMove, roomSession ]);

    const handleRotate = useCallback((positive: boolean) =>
    {
        if(!canRotate) return;

        GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, positive ? RoomObjectOperationType.OBJECT_ROTATE_POSITIVE : RoomObjectOperationType.OBJECT_ROTATE_NEGATIVE);
    }, [ avatarInfo, canRotate ]);

    const handleHeightChange = useCallback((delta: number) =>
    {
        if(!canMove || !roomSession) return;

        const obj = GetRoomEngine().getRoomObject(roomSession.roomId, avatarInfo.id, RoomObjectCategory.FLOOR);

        if(!obj) return;

        const newH = Math.max(0, Math.min(40, Math.round((obj.getLocation().z + delta) * 100) / 100));

        SendMessageComposer(new FurnitureStackHeightComposer(avatarInfo.id, ~~(newH * 100)));
    }, [ avatarInfo, canMove, roomSession ]);

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
            <Column className={ `nitro-infostand furni-compact rounded ${ panelClass }` } overflow="visible">
                { /* Preview area */ }
                <Flex position="relative" justifyContent="center" alignItems="center" className="furni-preview">
                    <FaTimes className="cursor-pointer furni-close" onClick={ onClose } />
                    { /* LTD plate */ }
                    { isLtd &&
                        <div className="absolute left-1 top-1">
                            <LayoutLimitedEditionCompactPlateView uniqueNumber={ avatarInfo.stuffData.uniqueNumber } uniqueSeries={ avatarInfo.stuffData.uniqueSeries } />
                        </div> }
                    { /* Rarity level badge (non-LTD) */ }
                    { (!isLtd && avatarInfo.stuffData.rarityLevel > -1) &&
                        <div className="absolute left-1 top-1">
                            <LayoutRarityLevelView level={ avatarInfo.stuffData.rarityLevel } />
                        </div> }
                    { /* Rarity seal badge */ }
                    { isRarity &&
                        <div className="absolute right-8 top-2">
                            <span className={ `furni-seal ${ SEAL_CSS_MAP[rarityData.rarityType.name] || '' }` }>
                                { rarityData.rarityType.displayName }
                            </span>
                        </div> }
                    { avatarInfo.image && avatarInfo.image.src.length &&
                        <img src={ avatarInfo.image.src } alt="" /> }
                </Flex>

                { /* Info area */ }
                <Column className="furni-info" gap={ 0 }>
                    { /* Name */ }
                    <Text variant="white" className="furni-name" style={ isRarity ? { color: rarityData.rarityType.colorPrimary } : undefined }>
                        { avatarInfo.name }
                    </Text>
                    { avatarInfo.description &&
                        <Text variant="white" className="furni-desc">{ avatarInfo.description }</Text> }

                    { /* Set name seal */ }
                    { isRarity && rarityData.setName &&
                        <Flex className="pb-1">
                            <span className="furni-seal seal-set">{ rarityData.setName }</span>
                        </Flex> }

                    { /* OG seal */ }
                    { isRarity && rarityData.isOg &&
                        <Flex className="pb-1">
                            <span className="furni-seal seal-og">OG</span>
                        </Flex> }

                    { /* Owner */ }
                    <Flex alignItems="center" gap={ 1 } className="furni-meta">
                        <FaUser className="furni-meta-icon" />
                        <UserProfileIconView userId={ avatarInfo.ownerId } />
                        <Text variant="white" small wrap>{ avatarInfo.ownerName }</Text>
                    </Flex>

                    { /* Coordinates & height + editor toggle */ }
                    { !avatarInfo.isWallItem &&
                        <div className="furni-coords">
                            <span>X: { isEditorOpen ? livePos.x : avatarInfo.posX }</span>
                            <span>Y: { isEditorOpen ? livePos.y : avatarInfo.posY }</span>
                            <span>H: { (isEditorOpen ? livePos.z : avatarInfo.posZ).toFixed(2) }</span>
                            { canMove &&
                                <FaWrench className={ `furni-edit-toggle ${ isEditorOpen ? 'active' : '' }` } onClick={ () => setIsEditorOpen(prev => !prev) } /> }
                        </div> }

                    { /* Circulation (rarity only) */ }
                    { isRarity && rarityData.circulation > 0 &&
                        <Flex alignItems="center" gap={ 1 } className="furni-meta">
                            <Text variant="white" small style={ { color: 'rgba(255,255,255,0.45)', fontSize: '10px' } }>
                                Umlauf: { rarityData.circulation.toLocaleString() } Stk.
                            </Text>
                        </Flex> }

                    { /* Trade value (if available) */ }
                    { isRarity && rarityData.tradeValue !== null && rarityData.tradeValue > 0 &&
                        <Flex alignItems="center" gap={ 1 } className="furni-meta">
                            <Text variant="white" small style={ { color: 'rgba(255,255,255,0.45)', fontSize: '10px' } }>
                                Wert: { rarityData.tradeValue.toLocaleString() } Credits
                            </Text>
                        </Flex> }

                    { /* Jukebox / Songdisk */ }
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

                { /* Furniture Editor Panel */ }
                { isEditorOpen && canMove && !avatarInfo.isWallItem &&
                    <div className="furni-editor">
                        <div className="editor-row">
                            { /* Position (diamond arrows) */ }
                            <div className="editor-section">
                                <span className="editor-label">Position</span>
                                <div className="diamond-grid">
                                    <div className="diamond-btn nw" onClick={ () => handleMoveDirection(0, -1) }><ChevronUp size={ 14 } /></div>
                                    <div className="diamond-btn ne" onClick={ () => handleMoveDirection(1, 0) }><ChevronRight size={ 14 } /></div>
                                    <div className="diamond-btn sw" onClick={ () => handleMoveDirection(-1, 0) }><ChevronLeft size={ 14 } /></div>
                                    <div className="diamond-btn se" onClick={ () => handleMoveDirection(0, 1) }><ChevronDown size={ 14 } /></div>
                                </div>
                                <span className="editor-label" style={ { marginTop: '6px' } }>Drehen</span>
                                <div className="rotate-controls">
                                    <div className="rotate-btn" onClick={ () => handleRotate(false) }><FaUndo /></div>
                                    <div className="rotate-btn" onClick={ () => handleRotate(true) }><FaRedo /></div>
                                </div>
                            </div>
                            { /* Height controls */ }
                            <div className="editor-section">
                                <span className="editor-label">Höhe</span>
                                <div className="height-display">{ livePos.z.toFixed(2) }</div>
                                <div className="height-grid">
                                    <div className="height-btn plus" onClick={ () => handleHeightChange(1) }>+1</div>
                                    <div className="height-btn plus" onClick={ () => handleHeightChange(0.1) }>+0.1</div>
                                    <div className="height-btn plus" onClick={ () => handleHeightChange(0.01) }>+0.01</div>
                                    <div className="height-btn minus" onClick={ () => handleHeightChange(-1) }>-1</div>
                                    <div className="height-btn minus" onClick={ () => handleHeightChange(-0.1) }>-0.1</div>
                                    <div className="height-btn minus" onClick={ () => handleHeightChange(-0.01) }>-0.01</div>
                                </div>
                            </div>
                        </div>
                    </div> }

                { /* Action buttons */ }
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

                { /* Bottom links: catalog + price list */ }
                { (avatarInfo.purchaseOfferId > 0 || isRarity) &&
                    <div className="furni-links">
                        { avatarInfo.purchaseOfferId > 0 &&
                            <div className="furni-link" onClick={ () => processButtonAction('buy_one') }>
                                <FaShoppingCart className="link-icon" />
                                <span>Kaufen</span>
                            </div> }
                        { isRarity &&
                            <div className="furni-link" onClick={ () => CreateLinkEvent('pricelist/toggle') }>
                                <FaListUl className="link-icon" />
                                <span>Preisliste</span>
                            </div> }
                    </div> }
            </Column>
        </Column>
    );
}
