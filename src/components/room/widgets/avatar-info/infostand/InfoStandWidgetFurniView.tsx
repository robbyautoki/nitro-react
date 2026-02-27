import { CrackableDataType, FurnitureFloorUpdateComposer, FurnitureStackHeightComposer, GroupInformationComposer, GroupInformationEvent, NowPlayingEvent, RoomControllerLevel, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable, RoomWidgetEnumItemExtradataParameter, RoomWidgetFurniInfoUsagePolicyEnum, SetObjectDataMessageComposer, SongInfoReceivedEvent, StringDataType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaUser, FaMusic, FaUserAlt, FaUndo, FaRedo } from 'react-icons/fa';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Move, RotateCw, PackageOpen, Hand, ShoppingCart, List, Wrench, Hash } from 'lucide-react';
import { AvatarInfoFurni, CreateLinkEvent, GetGroupInformation, GetNitroInstance, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../../../api';
import { LayoutBadgeImageView, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, UserProfileIconView } from '../../../../../common';
import { useMessageEvent, useRoom, useSoundEvent } from '../../../../../hooks';
import { useFurnitureRarity } from '../../../../../hooks/rooms/widgets/useFurnitureRarity';
import { useFurnitureDurability } from '../../../../../hooks/rooms/widgets/useFurnitureDurability';

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
    'drachen_rare': 'rarity-drachen',
};

const RARITY_COLORS: Record<string, string> = {
    'og_rare': '#ff5078',
    'weekly_rare': '#10b981',
    'monthly_rare': '#8b5cf6',
    'cashshop_rare': '#f97316',
    'bonzen_rare': '#fbbf24',
    'drachen_rare': '#6366f1',
};

const ACTION_ICONS: Record<string, FC<{ className?: string }>> = {
    'move': Move,
    'rotate': RotateCw,
    'pickup': PackageOpen,
    'use': Hand,
};

export const InfoStandWidgetFurniView: FC<InfoStandWidgetFurniViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const { roomSession = null } = useRoom();
    const { rarityData } = useFurnitureRarity(avatarInfo?.typeId ?? 0);
    const { durabilityData } = useFurnitureDurability(avatarInfo?.id ?? 0);

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
    const rarityColor = rarityData ? RARITY_COLORS[rarityData.rarityType.name] : isLtd ? '#06b6d4' : undefined;

    const panelClass = useMemo(() =>
    {
        if(rarityData) return RARITY_CSS_MAP[rarityData.rarityType.name] || '';
        if(isLtd) return 'rarity-ltd';
        return '';
    }, [ rarityData, isLtd ]);

    const filterId = useMemo(() => `swirl-${Math.random().toString(36).slice(2, 8)}`, []);

    // ─── Sound events ───

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

    // ─── Setup effect ───

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

        if(avatarInfo.isAnyRoomController) canSeeFurniId = true;

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
                if(playlist) furniSongId = playlist.nowPlayingSongId;
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

    // ─── Callbacks ───

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
            data = (data + (furniKeys[i] + '=' + furniValues[i] + '\t'));
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
                    GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_PICKUP);
                else
                    GetRoomEngine().processRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_EJECT);
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

    // ─── Live position tracker for editor ───

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

    // ─── Action buttons config ───

    const actionButtons: { label: string; action: string }[] = [];

    if(canMove) actionButtons.push({ label: LocalizeText('infostand.button.move'), action: 'move' });
    if(canRotate) actionButtons.push({ label: LocalizeText('infostand.button.rotate'), action: 'rotate' });
    if(pickupMode !== PICKUP_MODE_NONE) actionButtons.push({ label: LocalizeText((pickupMode === PICKUP_MODE_EJECT) ? 'infostand.button.eject' : 'infostand.button.pickup'), action: 'pickup' });
    if(canUse) actionButtons.push({ label: LocalizeText('infostand.button.use'), action: 'use' });
    if(furniKeys.length > 0 && furniValues.length > 0 && furniKeys.length === furniValues.length) actionButtons.push({ label: LocalizeText('save'), action: 'save_branding_configuration' });
    if(customKeys.length > 0 && customValues.length > 0 && customKeys.length === customValues.length) actionButtons.push({ label: LocalizeText('save'), action: 'save_custom_variables' });

    // ─── Durability bar color ───

    const durColor = durabilityData
        ? durabilityData.status === 'broken' ? 'bg-muted-foreground/30'
            : durabilityData.durabilityRemaining > 50 ? 'bg-emerald-500'
            : durabilityData.durabilityRemaining > 25 ? 'bg-amber-500'
            : 'bg-red-500'
        : '';

    const durTextColor = durabilityData
        ? durabilityData.status === 'broken' ? 'text-muted-foreground'
            : durabilityData.durabilityRemaining > 50 ? 'text-emerald-400'
            : durabilityData.durabilityRemaining > 25 ? 'text-amber-400'
            : 'text-red-400'
        : '';

    // ═══════════════════════════════════════════════
    // SHARED CONTENT BLOCKS
    // ═══════════════════════════════════════════════

    const infoContent = (
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {/* Owner */}
            <div className="flex items-center gap-1.5">
                <FaUser className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
                <UserProfileIconView userId={ avatarInfo.ownerId } />
                <span className="text-[11px] text-foreground/90 truncate">{ avatarInfo.ownerName }</span>
            </div>

            {/* Position */}
            { !avatarInfo.isWallItem && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
                        X:{ isEditorOpen ? livePos.x : avatarInfo.posX } Y:{ isEditorOpen ? livePos.y : avatarInfo.posY } H:{ (isEditorOpen ? livePos.z : avatarInfo.posZ).toFixed(2) }
                    </span>
                    { canMove && (
                        <button
                            aria-label="Position bearbeiten"
                            className={ `p-0.5 rounded transition-all ${ isEditorOpen ? 'text-primary rotate-90' : 'text-muted-foreground/25 hover:text-foreground/70' }` }
                            onClick={ () => setIsEditorOpen(prev => !prev) }
                        >
                            <Wrench className="w-2.5 h-2.5" />
                        </button>
                    ) }
                </div>
            ) }

            {/* Rarity: Circulation */}
            { isRarity && rarityData.circulation > 0 && (
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground/50">Umlauf: { rarityData.circulation.toLocaleString('de-DE') } Stk.</span>
                </div>
            ) }

            {/* Rarity: Trade Value */}
            { isRarity && rarityData.tradeValue !== null && rarityData.tradeValue > 0 && (
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium tabular-nums" style={ rarityColor ? { color: rarityColor } : undefined }>
                        Wert: { rarityData.tradeValue.toLocaleString('de-DE') } Credits
                    </span>
                </div>
            ) }

            {/* Durability */}
            { durabilityData && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                    <div className="flex items-center gap-1">
                        <Wrench className="w-2.5 h-2.5 text-muted-foreground/30" />
                        <span className={ `text-[10px] tabular-nums ${ durTextColor }` }>Haltbarkeit: { durabilityData.durabilityRemaining }%</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
                        <div className={ `h-full rounded-full transition-all ${ durColor }` } style={ { width: `${ Math.max(durabilityData.durabilityRemaining, 2) }%` } } />
                    </div>
                    { durabilityData.status === 'broken' && (
                        <span className="text-[10px] text-destructive font-medium">ZERBROCHEN - Repariere in der Werkstatt!</span>
                    ) }
                </div>
            ) }

            {/* Music */}
            { (isJukeBox || isSongDisk) && (
                <>
                    { songId === -1 && (
                        <div className="flex items-center gap-1.5">
                            <FaMusic className="w-2.5 h-2.5 text-muted-foreground/30" />
                            <span className="text-[11px] text-muted-foreground/70">{ LocalizeText('infostand.jukebox.text.not.playing') }</span>
                        </div>
                    ) }
                    { !!songName.length && (
                        <div className="flex items-center gap-1.5">
                            <FaMusic className="w-2.5 h-2.5 text-muted-foreground/30" />
                            <span className="text-[11px] text-foreground/80 truncate">{ songName }</span>
                        </div>
                    ) }
                    { !!songCreator.length && (
                        <div className="flex items-center gap-1.5">
                            <FaUserAlt className="w-2.5 h-2.5 text-muted-foreground/30" />
                            <span className="text-[11px] text-muted-foreground/70 truncate">{ songCreator }</span>
                        </div>
                    ) }
                </>
            ) }

            {/* Crackable */}
            { isCrackable && (
                <span className="text-[10px] text-muted-foreground/50">
                    { LocalizeText('infostand.crackable_furni.hits_remaining', [ 'hits', 'target' ], [ crackableHits.toString(), crackableTarget.toString() ]) }
                </span>
            ) }

            {/* Group */}
            { avatarInfo.groupId > 0 && (
                <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                    <LayoutBadgeImageView badgeCode={ getGroupBadgeCode() } isGroup={ true } />
                    <span className="text-[11px] text-foreground/70 underline">{ groupName }</span>
                </button>
            ) }

            {/* Furni ID (admin only) */}
            { godMode && canSeeFurniId && (
                <div className="flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5 text-muted-foreground/20" />
                    <span className="text-[9px] font-mono text-muted-foreground/30 tabular-nums">ID: { avatarInfo.id }</span>
                </div>
            ) }

            {/* Branding config (god mode) */}
            { godMode && (furniKeys.length > 0) && (
                <div className="flex flex-col gap-1 mt-1">
                    { furniKeys.map((key, index) => (
                        <div key={ index } className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground/40 w-16 text-right shrink-0 truncate">{ key }</span>
                            <input type="text" className="flex-1 h-5 px-1.5 text-[10px] rounded border border-border/30 bg-transparent text-foreground outline-none focus:border-ring/50" value={ furniValues[index] } onChange={ e => onFurniSettingChange(index, e.target.value) } />
                        </div>
                    )) }
                </div>
            ) }

            {/* Custom variables */}
            { (customKeys.length > 0) && (
                <div className="flex flex-col gap-1 mt-1">
                    { customKeys.map((key, index) => (
                        <div key={ index } className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground/40 w-16 text-right shrink-0 truncate">{ key }</span>
                            <input type="text" className="flex-1 h-5 px-1.5 text-[10px] rounded border border-border/30 bg-transparent text-foreground outline-none focus:border-ring/50" value={ customValues[index] } onChange={ e => onCustomVariableChange(index, e.target.value) } />
                        </div>
                    )) }
                </div>
            ) }
        </div>
    );

    // ─── Position Editor ───

    const editorContent = isEditorOpen && canMove && !avatarInfo.isWallItem && (
        <div className="furni-editor">
            <div className="editor-row">
                <div className="editor-section">
                    <span className="editor-label">Position</span>
                    <div className="diamond-grid">
                        <button className="diamond-btn nw" aria-label="Nach oben bewegen" onClick={ () => handleMoveDirection(0, -1) }><ChevronUp size={ 14 } /></button>
                        <button className="diamond-btn ne" aria-label="Nach rechts bewegen" onClick={ () => handleMoveDirection(1, 0) }><ChevronRight size={ 14 } /></button>
                        <button className="diamond-btn sw" aria-label="Nach links bewegen" onClick={ () => handleMoveDirection(-1, 0) }><ChevronLeft size={ 14 } /></button>
                        <button className="diamond-btn se" aria-label="Nach unten bewegen" onClick={ () => handleMoveDirection(0, 1) }><ChevronDown size={ 14 } /></button>
                    </div>
                    <span className="editor-label" style={ { marginTop: '6px' } }>Drehen</span>
                    <div className="rotate-controls">
                        <button className="rotate-btn" aria-label="Links drehen" onClick={ () => handleRotate(false) }><FaUndo /></button>
                        <button className="rotate-btn" aria-label="Rechts drehen" onClick={ () => handleRotate(true) }><FaRedo /></button>
                    </div>
                </div>
                <div className="editor-section">
                    <span className="editor-label">Höhe</span>
                    <div className="height-display">{ livePos.z.toFixed(2) }</div>
                    <div className="height-grid">
                        { [ 1, 0.1, 0.01 ].map(d => (
                            <button key={ `+${d}` } className="height-btn plus" onClick={ () => handleHeightChange(d) }>+{ d }</button>
                        )) }
                        { [ 1, 0.1, 0.01 ].map(d => (
                            <button key={ `-${d}` } className="height-btn minus" onClick={ () => handleHeightChange(-d) }>-{ d }</button>
                        )) }
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Action Buttons ───

    const actionsContent = actionButtons.length > 0 && (
        <div className="flex items-stretch divide-x divide-border/20 border-t border-border/20">
            { actionButtons.map((btn, i) =>
            {
                const IconComp = ACTION_ICONS[btn.action];
                return (
                    <button
                        key={ i }
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                        onClick={ () => processButtonAction(btn.action) }
                        aria-label={ btn.label }
                    >
                        { IconComp && <IconComp className="w-3.5 h-3.5" /> }
                        <span>{ btn.label }</span>
                    </button>
                );
            }) }
        </div>
    );

    // ─── Quick Links ───

    const linksContent = (avatarInfo.purchaseOfferId > 0 || isRarity) && (
        <div className="flex items-stretch divide-x divide-border/20 border-t border-border/20">
            { avatarInfo.purchaseOfferId > 0 && (
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors" onClick={ () => processButtonAction('buy_one') } aria-label="Kaufen">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Kaufen</span>
                </button>
            ) }
            { isRarity && (
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors" onClick={ () => CreateLinkEvent('pricelist/toggle') } aria-label="Preisliste">
                    <List className="w-3 h-3" />
                    <span>Preisliste</span>
                </button>
            ) }
        </div>
    );

    // ═══════════════════════════════════════════════
    // ELECTRIC CARD (Rarity / LTD)
    // ═══════════════════════════════════════════════

    if(isRarity || isLtd)
    {
        return (
            <div className="flex flex-col items-end">
                <div className={ `ec-wrap furni-compact ${ panelClass }` }>
                    <svg className="ec-filters" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <defs>
                            <filter id={ filterId } colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                                    <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>
                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                                    <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>
                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2" />
                                <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
                                    <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>
                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2" />
                                <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
                                    <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>
                                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
                                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
                            </filter>
                        </defs>
                    </svg>

                    <div className="ec-backdrop">
                        <div className="ec-border">
                            <div className="ec-main" style={ { filter: `url(#${ filterId })` } } />
                        </div>
                        <div className="ec-glow-1" />
                        <div className="ec-glow-2" />
                    </div>
                    <div className="ec-bg-glow" />

                    <div className="ec-content">
                        {/* Preview Zone */}
                        <div className="ec-top">
                            <div className="ec-badge">
                                { rarityData?.rarityType.displayName || 'LTD' }
                            </div>

                            { isLtd &&
                                <LayoutLimitedEditionCompactPlateView
                                    uniqueNumber={ avatarInfo.stuffData.uniqueNumber }
                                    uniqueSeries={ avatarInfo.stuffData.uniqueSeries } /> }

                            { avatarInfo.image && avatarInfo.image.src.length &&
                                <div className="furni-image-wrap">
                                    <img src={ avatarInfo.image.src } alt={ avatarInfo.name } />
                                </div> }

                            <p className="ec-title">{ avatarInfo.name }</p>
                            { avatarInfo.description &&
                                <p className="ec-desc">{ avatarInfo.description }</p> }

                            { isRarity && rarityData.setName && (
                                <span className="furni-seal seal-set" style={ { marginTop: '8px' } }>{ rarityData.setName }</span>
                            ) }
                            { isRarity && rarityData.isOg && (
                                <span className="furni-seal seal-og" style={ { marginTop: '4px' } }>OG</span>
                            ) }
                        </div>

                        <hr className="ec-divider" />

                        {/* Info Zone */}
                        <div className="ec-bottom">
                            { infoContent }
                        </div>

                        { editorContent }
                        { actionsContent }
                        { linksContent }
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // NORMAL CARD (non-rarity)
    // ═══════════════════════════════════════════════

    return (
        <div className="flex flex-col items-end">
            <div className="relative w-[280px] rounded-xl border border-border/40 bg-card text-card-foreground shadow-xl overflow-hidden furni-compact">
                {/* Preview Zone */}
                <div className="relative flex items-center justify-center min-h-[80px] px-4 py-5 bg-muted/30 border-b border-border/20">
                    { (!isLtd && avatarInfo.stuffData.rarityLevel > -1) && (
                        <div className="absolute left-2 top-2">
                            <LayoutRarityLevelView level={ avatarInfo.stuffData.rarityLevel } />
                        </div>
                    ) }
                    { avatarInfo.image && avatarInfo.image.src.length && (
                        <div className="furni-image-wrap">
                            <img src={ avatarInfo.image.src } alt={ avatarInfo.name } />
                        </div>
                    ) }
                </div>

                {/* Name + Description */}
                <div className="px-3 py-2.5 border-b border-border/10">
                    <p className="text-[14px] font-bold leading-tight">{ avatarInfo.name }</p>
                    { avatarInfo.description && (
                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-0.5 break-words">{ avatarInfo.description }</p>
                    ) }
                </div>

                {/* Info Zone */}
                { infoContent }

                {/* Editor */}
                { editorContent }

                {/* Actions */}
                { actionsContent }

                {/* Links */}
                { linksContent }
            </div>
        </div>
    );
}
