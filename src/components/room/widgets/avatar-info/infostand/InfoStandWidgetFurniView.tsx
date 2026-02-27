import { CrackableDataType, FurnitureFloorUpdateComposer, FurnitureStackHeightComposer, GroupInformationComposer, GroupInformationEvent, NowPlayingEvent, RoomControllerLevel, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable, RoomWidgetEnumItemExtradataParameter, RoomWidgetFurniInfoUsagePolicyEnum, SetObjectDataMessageComposer, SongInfoReceivedEvent, StringDataType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaMusic, FaUserAlt } from 'react-icons/fa';
import { Move, RotateCw, PackageOpen, Hand, ShoppingCart, List, Wrench, ChevronsLeftRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../ui/tooltip';
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

const RARITY_COLORS: Record<string, string> = {
    'og_rare': '#bf2d3e',
    'weekly_rare': '#2a8f7a',
    'monthly_rare': '#6d3fc0',
    'cashshop_rare': '#c47e1a',
    'bonzen_rare': '#b8962a',
    'drachen_rare': '#4040b8',
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
    const rarityColor = rarityData ? RARITY_COLORS[rarityData.rarityType.name] : isLtd ? '#7c93a8' : undefined;



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
        ? durabilityData.status === 'broken' ? 'bg-muted-foreground/20'
            : durabilityData.durabilityRemaining > 50 ? 'bg-foreground/20'
            : durabilityData.durabilityRemaining > 25 ? 'bg-foreground/15'
            : 'bg-destructive/40'
        : '';

    // ═══════════════════════════════════════════════
    // SHARED CONTENT BLOCKS
    // ═══════════════════════════════════════════════

    const infoContent = (
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {/* Owner */}
            <div className="flex items-center gap-1.5">
                <UserProfileIconView userId={ avatarInfo.ownerId } />
                <span className="text-[11px] text-foreground/90 truncate cursor-pointer hover:underline">{ avatarInfo.ownerName }</span>
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
                            className={ `p-0.5 rounded transition-all cursor-pointer ${ isEditorOpen ? 'text-primary rotate-90' : 'text-muted-foreground/25 hover:text-foreground/70' }` }
                            onClick={ () => setIsEditorOpen(prev => !prev) }
                        >
                            <Wrench className="w-2.5 h-2.5" />
                        </button>
                    ) }
                </div>
            ) }

            {/* Rarity: Circulation + Trade Value */}
            { isRarity && (rarityData.circulation > 0 || (rarityData.tradeValue !== null && rarityData.tradeValue > 0)) && (
                <span className="text-[10px] text-muted-foreground">
                    { rarityData.circulation > 0 ? `${ rarityData.circulation.toLocaleString('de-DE') } Stk.` : '' }
                    { rarityData.circulation > 0 && rarityData.tradeValue > 0 ? ' · ' : '' }
                    { rarityData.tradeValue > 0 ? `${ rarityData.tradeValue.toLocaleString('de-DE') } Cr.` : '' }
                </span>
            ) }

            {/* Durability */}
            { durabilityData && (
                <div className="flex flex-col gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-default">
                                <div className="flex-1 h-[3px] rounded-full bg-muted/30 overflow-hidden">
                                    <div className={ `h-full rounded-full transition-all ${ durColor }` } style={ { width: `${ Math.max(durabilityData.durabilityRemaining, 2) }%` } } />
                                </div>
                                <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">{ durabilityData.durabilityRemaining }%</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            { durabilityData.status === 'broken' ? 'Zerbrochen — 0%' : `Haltbarkeit: ${ durabilityData.durabilityRemaining }%` }
                        </TooltipContent>
                    </Tooltip>
                    { durabilityData.status === 'broken' && (
                        <span className="text-[9px] text-destructive font-medium">Zerbrochen — Werkstatt</span>
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
                <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                    <LayoutBadgeImageView badgeCode={ getGroupBadgeCode() } isGroup={ true } />
                    <span className="text-[11px] text-foreground/70 underline">{ groupName }</span>
                </button>
            ) }

            {/* Furni ID (admin only) */}
            { godMode && canSeeFurniId && (
                <span className="text-[9px] font-mono text-muted-foreground/30 tabular-nums">#{ avatarInfo.id }</span>
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

    // ─── Scrub Input Component ───

    const ScrubField: FC<{
        label: string;
        value: number;
        onIncrement: (delta: number) => void;
        step?: number;
        decimals?: number;
        ariaLabel: string;
        icon?: FC<{ className?: string }>;
    }> = useCallback(({ label, value, onIncrement, step = 1, decimals = 0, ariaLabel, icon: Icon }) =>
    {
        const scrubRef = useRef<HTMLDivElement>(null);
        const startXRef = useRef(0);
        const accRef = useRef(0);

        const onPointerDown = useCallback((e: React.PointerEvent) =>
        {
            e.preventDefault();
            startXRef.current = e.clientX;
            accRef.current = 0;
            const el = e.currentTarget as HTMLElement;
            el.setPointerCapture(e.pointerId);
            el.style.cursor = 'ew-resize';
        }, []);

        const onPointerMove = useCallback((e: React.PointerEvent) =>
        {
            if(!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const dx = e.clientX - startXRef.current;
            const sensitivity = e.shiftKey ? 5 : e.altKey ? 50 : 15;
            const ticks = Math.trunc(dx / sensitivity);
            if(ticks !== accRef.current)
            {
                const delta = ticks - accRef.current;
                accRef.current = ticks;
                onIncrement(delta * step);
            }
        }, [ onIncrement, step ]);

        const onPointerUp = useCallback((e: React.PointerEvent) =>
        {
            const el = e.currentTarget as HTMLElement;
            if(el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
            el.style.cursor = '';
        }, []);

        const onWheel = useCallback((e: React.WheelEvent) =>
        {
            e.stopPropagation();
            const delta = e.deltaY < 0 ? step : -step;
            onIncrement(delta);
        }, [ onIncrement, step ]);

        return (
            <div className="flex items-center h-7 rounded-md border border-border/30 bg-accent/5 overflow-hidden group hover:border-border/60 transition-colors" role="group" aria-label={ ariaLabel }>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            ref={ scrubRef }
                            className="flex items-center gap-1 px-2 select-none cursor-ew-resize shrink-0 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors"
                            onPointerDown={ onPointerDown }
                            onPointerMove={ onPointerMove }
                            onPointerUp={ onPointerUp }
                        >
                            { Icon && <Icon className="w-2.5 h-2.5" /> }
                            <span>{ label }</span>
                            <ChevronsLeftRight className="w-2 h-2 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Ziehen zum Ändern · Shift = schneller · Alt = feiner</TooltipContent>
                </Tooltip>
                <button
                    className="w-5 h-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/20 transition-colors text-[10px] cursor-pointer"
                    onClick={ () => onIncrement(-step) }
                    aria-label={ `${label} verringern` }
                >
                    ‹
                </button>
                <div
                    className="flex-1 text-center text-[11px] font-mono font-semibold tabular-nums text-foreground/90"
                    onWheel={ onWheel }
                >
                    { decimals > 0 ? value.toFixed(decimals) : value }
                </div>
                <button
                    className="w-5 h-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/20 transition-colors text-[10px] cursor-pointer"
                    onClick={ () => onIncrement(step) }
                    aria-label={ `${label} erhöhen` }
                >
                    ›
                </button>
            </div>
        );
    }, []);

    // ─── Step size state ───

    const [ heightStep, setHeightStep ] = useState<number>(0.1);
    const STEP_OPTIONS = [ 1, 0.1, 0.01 ] as const;

    // ─── Position Editor ───

    const editorContent = isEditorOpen && canMove && !avatarInfo.isWallItem && (
        <div className="border-t border-border/20 animate-[editorSlideIn_0.2s_ease-out]">
            <div className="px-3 py-2 flex flex-col gap-1">
                <div className="grid grid-cols-2 gap-1">
                    <ScrubField label="X" value={ livePos.x } onIncrement={ (d) => handleMoveDirection(d, 0) } step={ 1 } ariaLabel="X-Position" />
                    <ScrubField label="Y" value={ livePos.y } onIncrement={ (d) => handleMoveDirection(0, d) } step={ 1 } ariaLabel="Y-Position" />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
                    <ScrubField label="Z" value={ livePos.z } onIncrement={ (d) => handleHeightChange(d) } step={ heightStep } decimals={ 2 } ariaLabel="Höhe" />
                    <div className="flex items-center gap-px">
                        { STEP_OPTIONS.map(s => (
                            <Tooltip key={ s }>
                                <TooltipTrigger asChild>
                                    <button
                                        className={ `px-1 py-1 text-[8px] font-mono transition-colors rounded cursor-pointer ${
                                            heightStep === s ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'
                                        }` }
                                        onClick={ () => setHeightStep(s) }
                                    >
                                        { s }
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Schritt { s }</TooltipContent>
                            </Tooltip>
                        )) }
                    </div>
                </div>
                <div className="flex items-center h-7 rounded-md border border-border/30 overflow-hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex-1 h-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-purple-500/10 transition-colors cursor-pointer" onClick={ () => handleRotate(false) } aria-label="Links drehen">
                                <RotateCw className="w-3 h-3 -scale-x-100" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Links drehen</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-3 bg-border/30" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex-1 h-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-purple-500/10 transition-colors cursor-pointer" onClick={ () => handleRotate(true) } aria-label="Rechts drehen">
                                <RotateCw className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Rechts drehen</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    // ─── Action Buttons ───

    const hasLinks = avatarInfo.purchaseOfferId > 0 || isRarity;

    const actionsContent = (actionButtons.length > 0 || hasLinks) && (
        <div className="flex items-center border-t border-border/20 px-2 py-1.5 gap-0.5">
            { actionButtons.map((btn, i) =>
            {
                const IconComp = ACTION_ICONS[btn.action];
                return (
                    <Tooltip key={ i }>
                        <TooltipTrigger asChild>
                            <button
                                className="flex-1 flex items-center justify-center h-7 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/30 transition-colors cursor-pointer"
                                onClick={ () => processButtonAction(btn.action) }
                                aria-label={ btn.label }
                            >
                                { IconComp && <IconComp className="w-3.5 h-3.5" /> }
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{ btn.label }</TooltipContent>
                    </Tooltip>
                );
            }) }
            { hasLinks && actionButtons.length > 0 && <div className="w-px h-4 bg-border/20 mx-0.5" /> }
            { avatarInfo.purchaseOfferId > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="flex-1 flex items-center justify-center h-7 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/30 transition-colors cursor-pointer" onClick={ () => processButtonAction('buy_one') } aria-label="Kaufen">
                            <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Kaufen</TooltipContent>
                </Tooltip>
            ) }
            { isRarity && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="flex-1 flex items-center justify-center h-7 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/30 transition-colors cursor-pointer" onClick={ () => CreateLinkEvent('pricelist/toggle') } aria-label="Preisliste">
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Preisliste</TooltipContent>
                </Tooltip>
            ) }
        </div>
    );

    const linksContent = null;

    // ═══════════════════════════════════════════════
    // UNIFIED CARD (Normal + Rare + LTD)
    // ═══════════════════════════════════════════════

    const isSpecial = isRarity || isLtd;
    const rarityLabel = rarityData?.rarityType.displayName || (isLtd ? 'LTD' : null);

    return (
        <TooltipProvider delayDuration={ 300 }>
        <div className="flex flex-col items-end">
            <div
                className="relative w-[280px] rounded-xl border bg-card text-card-foreground shadow-xl overflow-hidden furni-compact group"
                style={ isSpecial && rarityColor ? { borderColor: `${ rarityColor }25` } : undefined }
            >
                {/* Preview Zone */}
                <div className="relative flex items-center justify-center min-h-[80px] px-4 py-5 bg-muted/30 border-b border-border/20 overflow-hidden">
                    {/* Rarity atmosphere gradient */}
                    { isSpecial && rarityColor && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none"
                            style={ { background: `radial-gradient(ellipse at 50% 40%, ${ rarityColor }12 0%, transparent 70%)` } }
                        />
                    ) }

                    {/* Shimmer line */}
                    { isSpecial && rarityColor && (
                        <div
                            className="absolute top-0 left-0 right-0 h-[3px] z-10 pointer-events-none group-hover:opacity-100 transition-opacity duration-300"
                            style={ {
                                backgroundImage: `linear-gradient(90deg, transparent 0%, ${ rarityColor }50 30%, ${ rarityColor }cc 50%, ${ rarityColor }50 70%, transparent 100%)`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmerSlide 6s ease-in-out infinite',
                                filter: 'blur(0.5px)',
                                opacity: 0.7,
                            } }
                        />
                    ) }

                    {/* Frosted rarity badge */}
                    { isSpecial && rarityLabel && (
                        <span
                            className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
                            style={ { backdropFilter: 'blur(4px)', background: 'var(--color-card, rgba(255,255,255,0.7))', border: '1px solid rgba(128,128,128,0.15)' } }
                        >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={ { backgroundColor: rarityColor } } />
                            { rarityLabel }
                        </span>
                    ) }

                    {/* OG badge */}
                    { isRarity && rarityData.isOg && (
                        <span
                            className="absolute top-2.5 right-2.5 z-20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-muted-foreground"
                            style={ { backdropFilter: 'blur(4px)', background: 'var(--color-card, rgba(255,255,255,0.7))', border: '1px solid rgba(128,128,128,0.15)' } }
                        >OG</span>
                    ) }

                    {/* Rarity level (non-rare, non-ltd) */}
                    { !isSpecial && avatarInfo.stuffData.rarityLevel > -1 && (
                        <div className="absolute left-2 top-2">
                            <LayoutRarityLevelView level={ avatarInfo.stuffData.rarityLevel } />
                        </div>
                    ) }

                    {/* LTD plate */}
                    { isLtd && (
                        <div className="absolute top-2.5 right-2.5 z-20">
                            <LayoutLimitedEditionCompactPlateView
                                uniqueNumber={ avatarInfo.stuffData.uniqueNumber }
                                uniqueSeries={ avatarInfo.stuffData.uniqueSeries } />
                        </div>
                    ) }

                    { avatarInfo.image && avatarInfo.image.src.length && (
                        <div className="furni-image-wrap relative z-[1]">
                            <img
                                src={ avatarInfo.image.src }
                                alt={ avatarInfo.name }
                                style={ isSpecial && rarityColor ? { filter: `drop-shadow(0 2px 8px ${ rarityColor }30)` } : undefined }
                            />
                        </div>
                    ) }
                </div>

                {/* Name + Description + Set */}
                <div className="px-3 py-2.5 border-b border-border/10">
                    <p className="text-[14px] font-bold leading-tight">{ avatarInfo.name }</p>
                    { avatarInfo.description && (
                        <p className="text-[12px] text-muted-foreground/60 leading-relaxed mt-0.5 break-words">{ avatarInfo.description }</p>
                    ) }
                    { isRarity && rarityData.setName && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground border border-border/30">{ rarityData.setName }</span>
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
        </TooltipProvider>
    );
}
