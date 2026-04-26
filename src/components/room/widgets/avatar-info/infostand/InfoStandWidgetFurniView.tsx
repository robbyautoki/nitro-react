import { CrackableDataType, FurnitureFloorUpdateComposer, FurnitureStackHeightComposer, GroupInformationComposer, GroupInformationEvent, NowPlayingEvent, RoomControllerLevel, RoomObjectCategory, RoomObjectOperationType, RoomWidgetEnumItemExtradataParameter, RoomWidgetFurniInfoUsagePolicyEnum, SetObjectDataMessageComposer, SongInfoReceivedEvent, StringDataType } from '@nitrots/nitro-renderer';
import { FC, PointerEvent, ReactNode, useCallback, useEffect, useRef, useState, WheelEvent } from 'react';
import { BadgeInfo, Boxes, ChevronsLeftRight, Disc3, Gem, Hand, Hash, List, MapPin, Move, PackageOpen, RotateCw, Save, ShoppingCart, Sparkles, UserRound, Wrench, X } from 'lucide-react';
import { AvatarInfoFurni, CreateLinkEvent, GetGroupInformation, GetNitroInstance, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../../../api';
import { LayoutBadgeImageView, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, UserProfileIconView } from '../../../../../common';
import { useMessageEvent, useRoom, useSoundEvent } from '../../../../../hooks';
import { useFurnitureRarity } from '../../../../../hooks/rooms/widgets/useFurnitureRarity';
import { useFurnitureDurability } from '../../../../../hooks/rooms/widgets/useFurnitureDurability';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';

const Tooltip = AlignTooltip.Root;
const TooltipContent = AlignTooltip.Content;
const TooltipProvider = AlignTooltip.Provider;
const TooltipTrigger = AlignTooltip.Trigger;

interface InfoStandWidgetFurniViewProps
{
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

const PICKUP_MODE_NONE: number = 0;
const PICKUP_MODE_EJECT: number = 1;
const PICKUP_MODE_FULL: number = 2;

type AlignBadgeColor = NonNullable<AlignBadge.BadgeRootProps['color']>;
type ProgressColor = 'blue' | 'red' | 'orange' | 'green';

const RARITY_BADGE_COLORS: Record<string, AlignBadgeColor> = {
    'og_rare': 'red',
    'weekly_rare': 'teal',
    'monthly_rare': 'purple',
    'cashshop_rare': 'orange',
    'bonzen_rare': 'yellow',
    'drachen_rare': 'blue',
};

const ACTION_ICONS: Record<string, FC<{ className?: string }>> = {
    'move': Move,
    'rotate': RotateCw,
    'pickup': PackageOpen,
    'use': Hand,
    'save_branding_configuration': Save,
    'save_custom_variables': Save,
};

const STEP_OPTIONS = [ 1, 0.1, 0.01 ] as const;

function SectionHeader({ children }: { children: ReactNode })
{
    return <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ children }</div>;
}

const ScrubField: FC<{
    label: string;
    value: number;
    onIncrement: (delta: number) => void;
    step?: number;
    decimals?: number;
    ariaLabel: string;
    icon?: FC<{ className?: string }>;
}> = ({ label, value, onIncrement, step = 1, decimals = 0, ariaLabel, icon: Icon }) =>
{
    const scrubRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const accRef = useRef(0);

    const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) =>
    {
        event.preventDefault();
        startXRef.current = event.clientX;
        accRef.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.cursor = 'ew-resize';
    }, []);

    const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) =>
    {
        if(!event.currentTarget.hasPointerCapture(event.pointerId)) return;

        const deltaX = event.clientX - startXRef.current;
        const sensitivity = event.shiftKey ? 5 : event.altKey ? 50 : 15;
        const ticks = Math.trunc(deltaX / sensitivity);

        if(ticks === accRef.current) return;

        const delta = ticks - accRef.current;
        accRef.current = ticks;
        onIncrement(delta * step);
    }, [ onIncrement, step ]);

    const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) =>
    {
        if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        event.currentTarget.style.cursor = '';
    }, []);

    const onWheel = useCallback((event: WheelEvent<HTMLDivElement>) =>
    {
        event.stopPropagation();
        onIncrement(event.deltaY < 0 ? step : -step);
    }, [ onIncrement, step ]);

    return (
        <div className="nitro-infostand-control-layer flex h-8 items-center overflow-hidden rounded-lg bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50" role="group" aria-label={ ariaLabel }>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        ref={ scrubRef }
                        className="flex h-full shrink-0 cursor-ew-resize select-none items-center gap-1.5 px-2 text-subheading-2xs uppercase tracking-normal text-text-soft-400 transition hover:text-text-sub-600"
                        onPointerDown={ onPointerDown }
                        onPointerMove={ onPointerMove }
                        onPointerUp={ onPointerUp }
                    >
                        { Icon && <Icon className="size-3" /> }
                        <span>{ label }</span>
                        <ChevronsLeftRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" size="xsmall">Ziehen zum Aendern · Shift schneller · Alt feiner</TooltipContent>
            </Tooltip>
            <AlignButton.Root
                type="button"
                variant="neutral"
                mode="ghost"
                size="xxsmall"
                className="h-full w-7 rounded-none px-0 text-text-soft-400"
                onClick={ () => onIncrement(-step) }
                aria-label={ `${ label } verringern` }
            >
                ‹
            </AlignButton.Root>
            <div className="flex-1 text-center font-mono text-label-xs tabular-nums text-text-strong-950" onWheel={ onWheel }>
                { decimals > 0 ? value.toFixed(decimals) : value }
            </div>
            <AlignButton.Root
                type="button"
                variant="neutral"
                mode="ghost"
                size="xxsmall"
                className="h-full w-7 rounded-none px-0 text-text-soft-400"
                onClick={ () => onIncrement(step) }
                aria-label={ `${ label } erhöhen` }
            >
                ›
            </AlignButton.Root>
        </div>
    );
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
    const [ heightStep, setHeightStep ] = useState<number>(0.1);

    const isLtd = avatarInfo?.stuffData?.isUnique ?? false;
    const isRarity = !!rarityData;



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
        if(!avatarInfo) return;

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

    const durabilityProgressColor: ProgressColor = durabilityData
        ? durabilityData.status === 'broken' ? 'red'
            : durabilityData.durabilityRemaining > 50 ? 'green'
            : durabilityData.durabilityRemaining > 25 ? 'orange'
            : 'red'
        : 'blue';

    const infoContent = (
        <div className="space-y-3 px-3 pb-3">
            <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <SectionHeader>Details</SectionHeader>
                    { godMode && canSeeFurniId && (
                        <AlignBadge.Root color="gray" variant="lighter" size="small">
                            <AlignBadge.Icon as={ Hash } className="size-3" />#{ avatarInfo.id }
                        </AlignBadge.Root>
                    ) }
                </div>

                <div className="space-y-2">
                    <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <UserProfileIconView userId={ avatarInfo.ownerId } />
                        <div className="min-w-0">
                            <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Besitzer</div>
                            <div className="truncate text-label-xs text-text-strong-950">{ avatarInfo.ownerName }</div>
                        </div>
                    </div>

                    { !avatarInfo.isWallItem && (
                        <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            <MapPin className="size-3.5 shrink-0 text-text-soft-400" />
                            <div className="min-w-0 flex-1">
                                <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Position</div>
                                <div className="truncate font-mono text-label-xs tabular-nums text-text-strong-950">
                                    X:{ isEditorOpen ? livePos.x : avatarInfo.posX } Y:{ isEditorOpen ? livePos.y : avatarInfo.posY } H:{ (isEditorOpen ? livePos.z : avatarInfo.posZ).toFixed(2) }
                                </div>
                            </div>
                            { canMove && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlignButton.Root
                                            type="button"
                                            variant="neutral"
                                            mode={ isEditorOpen ? 'lighter' : 'ghost' }
                                            size="xxsmall"
                                            className={ `size-7 p-0 ${ isEditorOpen ? 'rotate-90 text-primary-base' : '' }` }
                                            onClick={ () => setIsEditorOpen(prev => !prev) }
                                            aria-label="Position bearbeiten"
                                        >
                                            <AlignButton.Icon as={ Wrench } className="size-4" />
                                        </AlignButton.Root>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" size="xsmall">Position bearbeiten</TooltipContent>
                                </Tooltip>
                            ) }
                        </div>
                    ) }

                    { avatarInfo.groupId > 0 && (
                        <button className="nitro-infostand-control-layer flex w-full items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-left shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50" onClick={ () => GetGroupInformation(avatarInfo.groupId) }>
                            <div className="nitro-infostand-subtle-layer flex size-7 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50">
                                <LayoutBadgeImageView badgeCode={ getGroupBadgeCode() } isGroup={ true } />
                            </div>
                            <div className="min-w-0">
                                <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Gruppe</div>
                                <div className="truncate text-label-xs text-text-strong-950">{ groupName }</div>
                            </div>
                        </button>
                    ) }
                </div>
            </div>

            { rarityData && (rarityData.circulation > 0 || (rarityData.tradeValue !== null && rarityData.tradeValue > 0) || rarityData.setName) && (
                <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <SectionHeader>Rare</SectionHeader>
                        <AlignBadge.Root color={ RARITY_BADGE_COLORS[rarityData.rarityType.name] ?? 'gray' } variant="lighter" size="small">
                            <AlignBadge.Icon as={ Gem } className="size-3" />{ rarityData.rarityType.displayName }
                        </AlignBadge.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        { rarityData.circulation > 0 && (
                            <div className="nitro-infostand-control-layer rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Umlauf</div>
                                <div className="truncate text-label-xs text-text-strong-950">{ rarityData.circulation.toLocaleString('de-DE') } Stk.</div>
                            </div>
                        ) }
                        { (rarityData.tradeValue ?? 0) > 0 && (
                            <div className="nitro-infostand-control-layer rounded-xl bg-bg-white-0 px-2.5 py-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <div className="text-subheading-2xs uppercase tracking-normal text-text-soft-400">Wert</div>
                                <div className="truncate text-label-xs text-text-strong-950">{ (rarityData.tradeValue ?? 0).toLocaleString('de-DE') } Cr.</div>
                            </div>
                        ) }
                    </div>
                    { rarityData.setName && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            <Boxes className="size-3.5 shrink-0 text-text-soft-400" />
                            <span className="truncate">{ rarityData.setName }</span>
                        </div>
                    ) }
                </div>
            ) }

            { durabilityData && (
                <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <SectionHeader>Haltbarkeit</SectionHeader>
                        <span className="font-mono text-label-xs tabular-nums text-text-soft-400">{ durabilityData.durabilityRemaining }%</span>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <AlignProgressBar.Root value={ durabilityData.durabilityRemaining } color={ durabilityProgressColor } className="h-1.5" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="xsmall">
                            { durabilityData.status === 'broken' ? 'Zerbrochen - 0%' : `Haltbarkeit: ${ durabilityData.durabilityRemaining }%` }
                        </TooltipContent>
                    </Tooltip>
                    { durabilityData.status === 'broken' && (
                        <div className="mt-2 text-paragraph-xs text-error-base">Zerbrochen - Werkstatt</div>
                    ) }
                </div>
            ) }

            { (isJukeBox || isSongDisk || isCrackable) && (
                <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                    <SectionHeader>Status</SectionHeader>
                    <div className="mt-2 space-y-2">
                        { (isJukeBox || isSongDisk) && songId === -1 && (
                            <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <Disc3 className="size-3.5 shrink-0 text-text-soft-400" />
                                <span className="truncate text-text-sub-600">{ LocalizeText('infostand.jukebox.text.not.playing') }</span>
                            </div>
                        ) }
                        { !!songName.length && (
                            <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <Disc3 className="size-3.5 shrink-0 text-text-soft-400" />
                                <span className="truncate text-text-strong-950">{ songName }</span>
                            </div>
                        ) }
                        { !!songCreator.length && (
                            <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <UserRound className="size-3.5 shrink-0 text-text-soft-400" />
                                <span className="truncate text-text-sub-600">{ songCreator }</span>
                            </div>
                        ) }
                        { isCrackable && (
                            <div className="nitro-infostand-control-layer flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <Sparkles className="size-3.5 shrink-0 text-text-soft-400" />
                                <span className="truncate text-text-sub-600">
                                    { LocalizeText('infostand.crackable_furni.hits_remaining', [ 'hits', 'target' ], [ crackableHits.toString(), crackableTarget.toString() ]) }
                                </span>
                            </div>
                        ) }
                    </div>
                </div>
            ) }

            { godMode && (furniKeys.length > 0) && (
                <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                    <SectionHeader>Branding</SectionHeader>
                    <div className="mt-2 space-y-2">
                        { furniKeys.map((key, index) => (
                            <div key={ index } className="flex items-center gap-2">
                                <span className="w-20 shrink-0 truncate text-right text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ key }</span>
                                <AlignInput.Root size="xsmall">
                                    <AlignInput.Wrapper className="h-8">
                                        <AlignInput.Input value={ furniValues[index] } onChange={ event => onFurniSettingChange(index, event.target.value) } className="h-8 text-paragraph-xs" />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>
                        )) }
                    </div>
                </div>
            ) }

            { customKeys.length > 0 && (
                <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                    <SectionHeader>Variablen</SectionHeader>
                    <div className="mt-2 space-y-2">
                        { customKeys.map((key, index) => (
                            <div key={ index } className="flex items-center gap-2">
                                <span className="w-20 shrink-0 truncate text-right text-subheading-2xs uppercase tracking-normal text-text-soft-400">{ key }</span>
                                <AlignInput.Root size="xsmall">
                                    <AlignInput.Wrapper className="h-8">
                                        <AlignInput.Input value={ customValues[index] } onChange={ event => onCustomVariableChange(index, event.target.value) } className="h-8 text-paragraph-xs" />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>
                        )) }
                    </div>
                </div>
            ) }
        </div>
    );

    const editorContent = isEditorOpen && canMove && !avatarInfo.isWallItem && (
        <div className="px-3 pb-3">
            <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <SectionHeader>Position bearbeiten</SectionHeader>
                    <AlignBadge.Root color="blue" variant="lighter" size="small">Live</AlignBadge.Root>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <ScrubField label="X" value={ livePos.x } onIncrement={ (d) => handleMoveDirection(d, 0) } step={ 1 } ariaLabel="X-Position" />
                    <ScrubField label="Y" value={ livePos.y } onIncrement={ (d) => handleMoveDirection(0, d) } step={ 1 } ariaLabel="Y-Position" />
                </div>
                <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                    <ScrubField label="Z" value={ livePos.z } onIncrement={ (d) => handleHeightChange(d) } step={ heightStep } decimals={ 2 } ariaLabel="Höhe" />
                    <div className="flex items-center gap-1">
                        { STEP_OPTIONS.map(s => (
                            <Tooltip key={ s }>
                                <TooltipTrigger asChild>
                                    <AlignButton.Root
                                        type="button"
                                        variant={ heightStep === s ? 'primary' : 'neutral' }
                                        mode={ heightStep === s ? 'lighter' : 'ghost' }
                                        size="xxsmall"
                                        className="h-7 px-2 font-mono text-[10px]"
                                        onClick={ () => setHeightStep(s) }
                                    >
                                        { s }
                                    </AlignButton.Root>
                                </TooltipTrigger>
                                <TooltipContent side="top" size="xsmall">Schritt { s }</TooltipContent>
                            </Tooltip>
                        )) }
                    </div>
                </div>
                <div className="nitro-infostand-control-layer mt-2 flex h-8 items-center overflow-hidden rounded-lg bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="h-full flex-1 rounded-none px-0" onClick={ () => handleRotate(false) } aria-label="Links drehen">
                                <AlignButton.Icon as={ RotateCw } className="size-3.5 -scale-x-100" />
                            </AlignButton.Root>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="xsmall">Links drehen</TooltipContent>
                    </Tooltip>
                    <AlignDivider.Root className="h-4 w-px" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="h-full flex-1 rounded-none px-0" onClick={ () => handleRotate(true) } aria-label="Rechts drehen">
                                <AlignButton.Icon as={ RotateCw } className="size-3.5" />
                            </AlignButton.Root>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="xsmall">Rechts drehen</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    const hasLinks = avatarInfo.purchaseOfferId > 0 || isRarity;

    const actionsContent = (actionButtons.length > 0 || hasLinks) && (
        <div className="px-3 pb-3">
            <div className="nitro-infostand-card-layer flex items-center gap-1 rounded-2xl bg-bg-weak-50 p-2">
                { actionButtons.map((btn, index) =>
                {
                    const IconComp = ACTION_ICONS[btn.action] ?? BadgeInfo;

                    return (
                        <Tooltip key={ `${ btn.action }-${ index }` }>
                            <TooltipTrigger asChild>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="ghost"
                                    size="small"
                                    className="h-10 flex-1 px-0"
                                    onClick={ () => processButtonAction(btn.action) }
                                    aria-label={ btn.label }
                                >
                                    <AlignButton.Icon as={ IconComp } className="size-4" />
                                </AlignButton.Root>
                            </TooltipTrigger>
                            <TooltipContent side="top" size="xsmall">{ btn.label }</TooltipContent>
                        </Tooltip>
                    );
                }) }

                { hasLinks && actionButtons.length > 0 && <AlignDivider.Root className="mx-1 h-5 w-px" /> }

                { avatarInfo.purchaseOfferId > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="small" className="h-10 flex-1 px-0" onClick={ () => processButtonAction('buy_one') } aria-label="Kaufen">
                                <AlignButton.Icon as={ ShoppingCart } className="size-4" />
                            </AlignButton.Root>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="xsmall">Kaufen</TooltipContent>
                    </Tooltip>
                ) }
                { isRarity && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="small" className="h-10 flex-1 px-0" onClick={ () => CreateLinkEvent('pricelist/toggle') } aria-label="Preisliste">
                                <AlignButton.Icon as={ List } className="size-4" />
                            </AlignButton.Root>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="xsmall">Preisliste</TooltipContent>
                    </Tooltip>
                ) }
            </div>
        </div>
    );

    const isSpecial = isRarity || isLtd;
    const rarityLabel = rarityData?.rarityType.displayName || (isLtd ? 'LTD' : null);
    const specialBadgeColor: AlignBadgeColor = rarityData ? (RARITY_BADGE_COLORS[rarityData.rarityType.name] ?? 'gray') : isLtd ? 'sky' : 'gray';

    return (
        <TooltipProvider delayDuration={ 200 }>
            <AlignSurface.Panel className="group nitro-infostand nitro-furni-infostand-align relative !h-auto !min-w-[320px] !max-w-[320px] max-h-[620px] overflow-hidden !rounded-20 !border-0 !bg-bg-white-0 !text-text-strong-950">
                <div className="nitro-infostand-layer flex items-center gap-3 bg-bg-white-0 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 text-text-sub-600">
                        <PackageOpen className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-label-md text-text-strong-950">Möbel</div>
                        <div className="mt-0.5 truncate text-paragraph-xs text-text-sub-600">{ avatarInfo.isWallItem ? 'Wanditem' : 'Bodenitem' }</div>
                    </div>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onClose ?? undefined } aria-label="Schliessen">
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>

                <AlignDivider.Root />

                <div className="nitro-infostand-layer max-h-[560px] min-h-0 overflow-y-auto bg-bg-white-0">
                    <div className="p-3">
                        <div className="nitro-infostand-card-layer rounded-2xl bg-bg-weak-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <SectionHeader>Vorschau</SectionHeader>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        { isSpecial && rarityLabel && (
                                            <AlignBadge.Root color={ specialBadgeColor } variant="lighter" size="small">
                                                <AlignBadge.Icon as={ isLtd ? Sparkles : Gem } className="size-3" />{ rarityLabel }
                                            </AlignBadge.Root>
                                        ) }
                                        { isRarity && rarityData.isOg && (
                                            <AlignBadge.Root color="red" variant="lighter" size="small">OG</AlignBadge.Root>
                                        ) }
                                    </div>
                                </div>
                                { isLtd && (
                                    <LayoutLimitedEditionCompactPlateView
                                        uniqueNumber={ avatarInfo.stuffData.uniqueNumber }
                                        uniqueSeries={ avatarInfo.stuffData.uniqueSeries } />
                                ) }
                                { !isSpecial && avatarInfo.stuffData.rarityLevel > -1 && (
                                    <LayoutRarityLevelView level={ avatarInfo.stuffData.rarityLevel } />
                                ) }
                            </div>

                            <div className="nitro-furni-preview-image mt-3 flex min-h-[132px] items-center justify-center rounded-2xl bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                { avatarInfo.image?.src?.length ? (
                                    <img src={ avatarInfo.image.src } alt={ avatarInfo.name } className="max-h-[112px] max-w-full object-contain" draggable={ false } />
                                ) : (
                                    <PackageOpen className="size-10 text-text-soft-400" />
                                ) }
                            </div>
                        </div>

                        <div className="nitro-infostand-card-layer mt-3 rounded-2xl bg-bg-weak-50 p-3">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                    <BadgeInfo className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="break-words text-label-md text-text-strong-950">{ avatarInfo.name }</div>
                                    { avatarInfo.description && (
                                        <div className="mt-1 break-words text-paragraph-sm text-text-sub-600">{ avatarInfo.description }</div>
                                    ) }
                                </div>
                            </div>
                        </div>
                    </div>

                    { infoContent }
                    { editorContent }
                    { actionsContent }
                </div>
            </AlignSurface.Panel>
        </TooltipProvider>
    );
}
