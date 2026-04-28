import { IRoomSession, RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, CheckSquare, Package, Plus, Store, Tag, Trash2, Wrench, X } from 'lucide-react';
import { attemptItemPlacement, CreateLinkEvent, FurniCategory, GetConfiguration, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { getAuthHeaders } from '../../../../api/utils/SessionTokenManager';
import { LayoutRoomPreviewerView } from '../../../../common';
import { useInventoryFurni, useInventoryUnseenTracker } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { cn } from '@/align-ui/utils/cn';
import { InventoryDeleteDialog } from './InventoryDeleteDialog';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryFurnitureItemView } from './InventoryFurnitureItemView';
import { InventoryFurnitureSearchView } from './InventoryFurnitureSearchView';

interface InventoryFurnitureViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

const SORT_OPTIONS = [
    { id: 'recent' as const, label: 'Neueste' },
    { id: 'name' as const, label: 'A-Z' },
    { id: 'count' as const, label: 'Menge' },
    { id: 'rarity' as const, label: 'Rarität' },
];

export const InventoryFurnitureView: FC<InventoryFurnitureViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);
    const { groupItems = [], selectedItem = null, setSelectedItem = null, setGroupItems = null, activate = null, deactivate = null } = useInventoryFurni();
    const { resetItems = null } = useInventoryUnseenTracker();
    const { activeCategory, filterByCategory, categories, assignItem, toggleAssignment, getItemCategories } = useInventoryCategories();

    const [ durabilityInfo, setDurabilityInfo ] = useState<{ remaining: number; status: string; repairCost: number } | null>(null);
    const [ multiSelectMode, setMultiSelectMode ] = useState(false);
    const [ selectedGroups, setSelectedGroups ] = useState<Set<GroupItem>>(new Set());
    const [ showDeleteDialog, setShowDeleteDialog ] = useState(false);
    const [ deleteTarget, setDeleteTarget ] = useState<{ groupItem: GroupItem; maxCount: number } | null>(null);
    const [ showBatchDeleteDialog, setShowBatchDeleteDialog ] = useState(false);
    const [ showCategoryDropdown, setShowCategoryDropdown ] = useState(false);
    const [ showInspectorCatPicker, setShowInspectorCatPicker ] = useState(false);
    const [ sortMode, setSortMode ] = useState<'recent' | 'name' | 'count' | 'rarity'>('recent');

    const categoryFilteredItems = filterByCategory(groupItems, activeCategory);

    const sortedItems = useMemo(() =>
    {
        const items = [ ...filteredGroupItems ];
        switch(sortMode)
        {
            case 'recent':
                return items;
            case 'count':
                return items.sort((a, b) => b.getUnlockedCount() - a.getUnlockedCount());
            case 'rarity':
                return items.sort((a, b) =>
                {
                    const aScore = a.stuffData.uniqueNumber > 0 ? 1000 + a.stuffData.uniqueNumber : 0;
                    const bScore = b.stuffData.uniqueNumber > 0 ? 1000 + b.stuffData.uniqueNumber : 0;
                    return bScore - aScore;
                });
            default:
                return items.sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [ filteredGroupItems, sortMode ]);

    const inspectorData = useMemo(() =>
    {
        if(!selectedItem) return null;
        const sessionData = GetSessionDataManager();
        const floorData = sessionData.getFloorItemData(selectedItem.type);
        const wallData = !floorData ? sessionData.getWallItemData(selectedItem.type) : null;
        const furniData = floorData || wallData;
        const className = furniData?.className || `type-${ selectedItem.type }`;
        const isWall = selectedItem.isWallItem;
        const isLtd = selectedItem.stuffData.uniqueNumber > 0;
        const assignmentKey = isLtd ? -(selectedItem.getLastItem()?.id || 0) : selectedItem.type;
        return { className, isWall, isLtd, furniData, assignmentKey };
    }, [ selectedItem ]);

    const toggleMultiSelect = useCallback((group: GroupItem) =>
    {
        setSelectedGroups(prev =>
        {
            const next = new Set(prev);
            if(next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    }, []);

    const clearMultiSelect = useCallback(() =>
    {
        setMultiSelectMode(false);
        setSelectedGroups(new Set());
        setShowCategoryDropdown(false);
    }, []);

    const handleDeleteItems = useCallback(async (itemIds: number[]) =>
    {
        if(!itemIds.length) return;
        try
        {
            const cmsUrl = GetConfiguration<string>('url.prefix', '');
            const response = await fetch(`${ cmsUrl }/api/inventory/items`, {
                method: 'DELETE',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify({ itemIds }),
            });
            if(!response.ok) return;
            const data = await response.json();
            if(data.deletedIds?.length)
            {
                setGroupItems(prev =>
                {
                    const deletedSet = new Set(data.deletedIds as number[]);
                    const updated: GroupItem[] = [];
                    for(const group of prev)
                    {
                        const remaining = group.items.filter(item => !deletedSet.has(item.id));
                        if(remaining.length > 0)
                        {
                            group.items.length = 0;
                            group.items.push(...remaining);
                            updated.push(group);
                        }
                    }
                    return [ ...updated ];
                });
                if(selectedItem)
                {
                    const stillExists = selectedItem.items.some(item => !data.deletedIds.includes(item.id));
                    if(!stillExists) setSelectedItem(null);
                }
            }
        }
        catch(err)
        {
            console.error('[Inventory] Delete failed:', err);
        }
    }, [ selectedItem, setSelectedItem, setGroupItems ]);

    const handleBatchAssign = useCallback(async (categoryId: number) =>
    {
        if(!selectedGroups.size) return;
        const types = Array.from(new Set(Array.from(selectedGroups).map(g => g.type)));
        try
        {
            const cmsUrl = GetConfiguration<string>('url.prefix', '');
            await fetch(`${ cmsUrl }/api/inventory-categories/${ categoryId }/assignments/batch`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemTypes: types }),
            });
            for(const type of types) assignItem(type, categoryId);
        }
        catch(err)
        {
            console.error('[Inventory] Batch assign failed:', err);
        }
        setShowCategoryDropdown(false);
    }, [ selectedGroups, assignItem ]);

    const confirmBatchDelete = useCallback(() =>
    {
        const allItemIds: number[] = [];
        for(const group of selectedGroups) allItemIds.push(...group.items.map(item => item.id));
        if(allItemIds.length) handleDeleteItems(allItemIds);
        clearMultiSelect();
        setShowBatchDeleteDialog(false);
    }, [ selectedGroups, handleDeleteItems, clearMultiSelect ]);

    const batchDeleteItemCount = Array.from(selectedGroups).reduce((sum, g) => sum + g.items.length, 0);

    const durabilityColor: 'red' | 'orange' | 'green' = durabilityInfo
        ? durabilityInfo.remaining < 30 ? 'red' : durabilityInfo.remaining < 60 ? 'orange' : 'green'
        : 'green';
    const durabilityToneClass = durabilityInfo
        ? durabilityInfo.remaining < 30 ? 'text-error-base' : durabilityInfo.remaining < 60 ? 'text-warning-base' : 'text-success-base'
        : 'text-text-soft-400';

    useEffect(() =>
    {
        if(!selectedItem || !roomPreviewer) return;
        const furnitureItem = selectedItem.getLastItem();
        if(!furnitureItem) return;
        const roomEngine = GetRoomEngine();
        let wallType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE);
        let floorType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE);
        let landscapeType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE);
        wallType = (wallType && wallType.length) ? wallType : '101';
        floorType = (floorType && floorType.length) ? floorType : '101';
        landscapeType = (landscapeType && landscapeType.length) ? landscapeType : '1.1';
        roomPreviewer.reset(false);
        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);
        if((furnitureItem.category === FurniCategory.WALL_PAPER) || (furnitureItem.category === FurniCategory.FLOOR) || (furnitureItem.category === FurniCategory.LANDSCAPE))
        {
            floorType = ((furnitureItem.category === FurniCategory.FLOOR) ? selectedItem.stuffData.getLegacyString() : floorType);
            wallType = ((furnitureItem.category === FurniCategory.WALL_PAPER) ? selectedItem.stuffData.getLegacyString() : wallType);
            landscapeType = ((furnitureItem.category === FurniCategory.LANDSCAPE) ? selectedItem.stuffData.getLegacyString() : landscapeType);
            roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
            if(furnitureItem.category === FurniCategory.LANDSCAPE)
            {
                const data = GetSessionDataManager().getWallItemDataByName('window_double_default');
                if(data) roomPreviewer.addWallItemIntoRoom(data.id, new Vector3d(90, 0, 0), data.customParams);
            }
        }
        else
        {
            if(selectedItem.isWallItem) roomPreviewer.addWallItemIntoRoom(selectedItem.type, new Vector3d(90), furnitureItem.stuffData.getLegacyString());
            else roomPreviewer.addFurnitureIntoRoom(selectedItem.type, new Vector3d(90), selectedItem.stuffData, (furnitureItem.extra.toString()));
        }
    }, [ roomPreviewer, selectedItem ]);

    useEffect(() =>
    {
        if(!selectedItem)
        {
            setDurabilityInfo(null); return;
        }
        const lastItem = selectedItem.getLastItem();
        if(!lastItem) return;
        let cancelled = false;
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        fetch(`${ cmsUrl }/api/furniture/durability?itemId=${ lastItem.id }`)
            .then(res => res.json())
            .then(data =>
            {
                if(!cancelled && data?.durabilityRemaining !== undefined) setDurabilityInfo({ remaining: data.durabilityRemaining, status: data.status, repairCost: data.repairCost }); else if(!cancelled) setDurabilityInfo(null);
            })
            .catch(() =>
            {
                if(!cancelled) setDurabilityInfo(null);
            });
        return () =>
        {
            cancelled = true;
        };
    }, [ selectedItem ]);

    useEffect(() =>
    {
        if(!selectedItem || !selectedItem.hasUnseenItems) return;
        resetItems(UnseenItemCategory.FURNI, selectedItem.items.map(item => item.id));
        selectedItem.hasUnseenItems = false;
    }, [ selectedItem, resetItems ]);

    useEffect(() =>
    {
        if(!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    useEffect(() =>
    {
        setShowInspectorCatPicker(false);
    }, [ selectedItem ]);

    if(!groupItems || !groupItems.length) return <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.title') } desc={ LocalizeText('inventory.empty.desc') } icon={ Package } showImage />;

    const selectedAssignmentKey = inspectorData?.assignmentKey ?? 0;
    const selectedItemCategories = inspectorData ? getItemCategories(selectedAssignmentKey) : [];
    const assignedCats = categories.filter(c => selectedItemCategories.includes(c.id));
    const unassignedCats = categories.filter(c => !selectedItemCategories.includes(c.id));

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            { /* Toolbar */ }
            <div className="flex shrink-0 items-center gap-1.5 border-b border-stroke-soft-200 bg-bg-weak-50 px-2 py-1.5">
                <InventoryFurnitureSearchView groupItems={ categoryFilteredItems } setGroupItems={ setFilteredGroupItems } />
                <div className="flex items-center gap-0.5">
                    { SORT_OPTIONS.map(opt => (
                        <AlignButton.Root
                            key={ opt.id }
                            type="button"
                            variant={ sortMode === opt.id ? 'primary' : 'neutral' }
                            mode={ sortMode === opt.id ? 'lighter' : 'ghost' }
                            size="xxsmall"
                            className="h-7 px-2 text-[10px]"
                            onClick={ () => setSortMode(opt.id) }
                        >
                            { opt.label }
                        </AlignButton.Root>
                    )) }
                </div>
                <AlignButton.Root
                    type="button"
                    variant={ multiSelectMode ? 'primary' : 'neutral' }
                    mode={ multiSelectMode ? 'lighter' : 'stroke' }
                    size="xxsmall"
                    className="h-7 gap-1 text-[10px]"
                    onClick={ () =>
                    {
                        if(multiSelectMode) clearMultiSelect(); else setMultiSelectMode(true);
                    } }
                >
                    <CheckSquare className="size-3" />
                    Multi
                </AlignButton.Root>
                <AlignBadge.Root color="gray" variant="lighter" size="small" className="ml-auto h-6">
                    { sortedItems.length }/{ groupItems.length }
                </AlignBadge.Root>
            </div>
            { /* Multi toolbar */ }
            { multiSelectMode && selectedGroups.size > 0 && (
                <div className="relative flex shrink-0 items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-primary-base">
                    <AlignBadge.Root color="blue" variant="lighter" size="small">
                        { selectedGroups.size } ausgewählt
                    </AlignBadge.Root>
                    <div className="flex items-center gap-1.5">
                        { categories.length > 0 && (
                            <div className="relative">
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    className="h-7 gap-1 text-[10px]"
                                    onClick={ () => setShowCategoryDropdown(!showCategoryDropdown) }
                                >
                                    <Tag className="size-3" />
                                    Kategorie
                                </AlignButton.Root>
                                { showCategoryDropdown && (
                                    <div className="absolute bottom-full left-0 z-50 mb-1 min-w-[160px] overflow-hidden rounded-xl bg-bg-white-0 py-1 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
                                        { categories.map(cat => (
                                            <button
                                                key={ cat.id }
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-1.5 text-paragraph-xs text-text-sub-600 transition-colors hover:bg-bg-weak-50"
                                                onClick={ () => handleBatchAssign(cat.id) }
                                            >
                                                <span className="size-2 shrink-0 rounded-full" style={ { backgroundColor: cat.color } } />
                                                { cat.name }
                                            </button>
                                        )) }
                                    </div>
                                ) }
                            </div>
                        ) }
                        <AlignButton.Root
                            type="button"
                            variant="error"
                            mode="filled"
                            size="xxsmall"
                            className="h-7 gap-1 text-[10px]"
                            onClick={ () => setShowBatchDeleteDialog(true) }
                        >
                            <Trash2 className="size-3" />
                            Löschen
                        </AlignButton.Root>
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="h-7 text-[10px]"
                            onClick={ clearMultiSelect }
                        >
                            Abbrechen
                        </AlignButton.Root>
                    </div>
                </div>
            ) }
            { /* Item Grid */ }
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-white-0">
                <div className="flex flex-wrap p-px">
                    { sortedItems.length > 0
                        ? sortedItems.map((item, index) =>
                            <InventoryFurnitureItemView
                                key={ index }
                                groupItem={ item }
                                multiSelectMode={ multiSelectMode }
                                isMultiSelected={ selectedGroups.has(item) }
                                onMultiToggle={ toggleMultiSelect }
                            />)
                        : (
                            <InventoryCategoryEmptyView
                                title="Keine Möbel gefunden"
                                desc="Passe deine Suche oder Filter an"
                                icon={ Package }
                                className="w-full"
                            />
                        )
                    }
                </div>
            </div>
            { /* Inspector Panel */ }
            { !multiSelectMode && selectedItem && inspectorData && (
                <div className="shrink-0 border-t border-stroke-soft-200 bg-bg-weak-50 p-2">
                    <div className="overflow-hidden rounded-xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <div className="flex gap-3 p-3">
                            <div className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 72 } />
                                { inspectorData.isLtd && (
                                    <span className="absolute right-0 top-0 rounded-bl-md bg-warning-base px-1.5 text-[8px] font-bold text-static-white">LTD</span>
                                ) }
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="truncate text-label-sm font-semibold text-text-strong-950">{ selectedItem.name }</span>
                                    <span className="text-label-md font-bold tabular-nums text-text-soft-400">{ selectedItem.getUnlockedCount() }×</span>
                                    <AlignButton.Root
                                        type="button"
                                        variant="neutral"
                                        mode="ghost"
                                        size="xxsmall"
                                        className="ml-auto size-6 shrink-0 px-0"
                                        onClick={ () => setSelectedItem(null) }
                                    >
                                        <X className="size-3.5" />
                                    </AlignButton.Root>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="rounded bg-bg-weak-50 px-1.5 py-0.5 font-mono text-[9px] text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">{ inspectorData.className }</span>
                                    { inspectorData.isLtd && (
                                        <AlignBadge.Root color="orange" variant="lighter" size="small" className="h-4 px-1.5 text-[9px]">
                                            #{ selectedItem.stuffData.uniqueNumber }/{ selectedItem.stuffData.uniqueSeries }
                                        </AlignBadge.Root>
                                    ) }
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                    <AlignBadge.Root color="gray" variant="lighter" size="small" className="h-4 px-1.5 text-[9px]">
                                        { inspectorData.isWall ? 'Wand' : 'Boden' }
                                    </AlignBadge.Root>
                                    { !inspectorData.isWall && inspectorData.furniData && (
                                        <AlignBadge.Root color="gray" variant="lighter" size="small" className="h-4 px-1.5 text-[9px]">
                                            { (inspectorData.furniData as any).dimX || 1 }×{ (inspectorData.furniData as any).dimY || 1 }
                                        </AlignBadge.Root>
                                    ) }
                                </div>
                                { /* Category Chips */ }
                                <div className="flex items-center gap-1 flex-wrap">
                                    { assignedCats.map(cat => (
                                        <span
                                            key={ cat.id }
                                            className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 py-0.5 pl-1.5 pr-1 text-[9px] text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200"
                                        >
                                            <span className="size-1.5 rounded-full" style={ { backgroundColor: cat.color } } />
                                            { cat.name }
                                            <button
                                                type="button"
                                                className="flex size-3 items-center justify-center rounded-full text-text-soft-400 transition-colors hover:bg-error-lighter hover:text-error-base"
                                                onClick={ () => toggleAssignment(selectedAssignmentKey, cat.id) }
                                            >
                                                <X className="size-2" />
                                            </button>
                                        </span>
                                    )) }
                                    { unassignedCats.length > 0 && (
                                        <div className="relative inline-flex">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-stroke-soft-200 px-1.5 py-0.5 text-text-soft-400 transition-colors hover:border-stroke-sub-300 hover:text-text-sub-600"
                                                onClick={ () => setShowInspectorCatPicker(!showInspectorCatPicker) }
                                            >
                                                <Plus className="size-2" />
                                                <Tag className="size-2" />
                                            </button>
                                            { showInspectorCatPicker && (
                                                <div className="absolute bottom-full left-0 z-50 mb-1 min-w-[140px] overflow-hidden rounded-xl bg-bg-white-0 py-1 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
                                                    { unassignedCats.map(cat => (
                                                        <button
                                                            key={ cat.id }
                                                            type="button"
                                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-paragraph-xs text-text-sub-600 transition-colors hover:bg-bg-weak-50"
                                                            onClick={ () =>
                                                            {
                                                                toggleAssignment(selectedAssignmentKey, cat.id); setShowInspectorCatPicker(false);
                                                            } }
                                                        >
                                                            <span className="size-2 shrink-0 rounded-full" style={ { backgroundColor: cat.color } } />
                                                            { cat.name }
                                                        </button>
                                                    )) }
                                                </div>
                                            ) }
                                        </div>
                                    ) }
                                </div>
                                { durabilityInfo && (
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <Wrench className={ cn('size-3 shrink-0', durabilityToneClass) } />
                                        <AlignProgress.Root value={ durabilityInfo.remaining } max={ 100 } color={ durabilityColor } className="flex-1" />
                                        <span className={ cn('shrink-0 text-[10px] font-semibold tabular-nums', durabilityToneClass) }>
                                            { durabilityInfo.remaining }%
                                        </span>
                                    </div>
                                ) }
                            </div>
                        </div>
                        <AlignDivider.Root />
                        <div className="flex items-center gap-1.5 px-3 py-2">
                            { !!roomSession && (!durabilityInfo || durabilityInfo.status !== 'broken') && (
                                <FancyButton.Root
                                    type="button"
                                    variant="primary"
                                    size="xsmall"
                                    className="h-7 gap-1.5 px-2.5 text-[11px]"
                                    onClick={ () => attemptItemPlacement(selectedItem) }
                                >
                                    <FancyButton.Icon as={ ArrowUp } className="size-3.5" />
                                    Platzieren
                                </FancyButton.Root>
                            ) }
                            { selectedItem.isSellable && (
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    className="h-7 gap-1.5 text-[11px]"
                                    onClick={ () => CreateLinkEvent(`marketplace/sell/${ selectedItem.type }`) }
                                >
                                    <Store className="size-3.5" />
                                    Markt
                                </AlignButton.Root>
                            ) }
                            { durabilityInfo && durabilityInfo.remaining < 30 && (
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    className="h-7 gap-1.5 text-[11px] text-warning-base ring-warning-base"
                                    onClick={ () => CreateLinkEvent('workshop/toggle') }
                                >
                                    <Wrench className="size-3.5" />
                                    Reparieren
                                </AlignButton.Root>
                            ) }
                            <div className="flex-1" />
                            { selectedItem.getUnlockedCount() > 0 && (
                                <AlignButton.Root
                                    type="button"
                                    variant="error"
                                    mode="lighter"
                                    size="xxsmall"
                                    className="size-7 shrink-0 px-0"
                                    onClick={ () =>
                                    {
                                        setDeleteTarget({ groupItem: selectedItem, maxCount: selectedItem.getUnlockedCount() });
                                        setShowDeleteDialog(true);
                                    } }
                                >
                                    <Trash2 className="size-3.5" />
                                </AlignButton.Root>
                            ) }
                        </div>
                    </div>
                </div>
            ) }
            { /* Delete dialogs */ }
            { showDeleteDialog && deleteTarget && (
                <InventoryDeleteDialog
                    groupItem={ deleteTarget.groupItem }
                    maxCount={ deleteTarget.maxCount }
                    onConfirm={ (itemIds) =>
                    {
                        handleDeleteItems(itemIds); setShowDeleteDialog(false); setDeleteTarget(null);
                    } }
                    onClose={ () =>
                    {
                        setShowDeleteDialog(false); setDeleteTarget(null);
                    } }
                />
            ) }
            { showBatchDeleteDialog && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={ () => setShowBatchDeleteDialog(false) }>
                    <div className="w-[300px] overflow-hidden rounded-20 border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 shadow-regular-md" onClick={ e => e.stopPropagation() }>
                        <div className="flex items-center gap-2 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-3 text-label-sm">
                            <Trash2 className="size-3.5 text-error-base" />
                            <span>Möbel löschen</span>
                        </div>
                        <div className="p-4">
                            <div className="text-paragraph-xs text-text-sub-600">
                                { batchDeleteItemCount } Möbelstück(e) aus { selectedGroups.size } Auswahl unwiderruflich löschen?
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-stroke-soft-200 px-4 py-3">
                            <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" onClick={ () => setShowBatchDeleteDialog(false) }>Abbrechen</AlignButton.Root>
                            <AlignButton.Root type="button" variant="error" mode="filled" size="xxsmall" onClick={ confirmBatchDelete }>Löschen</AlignButton.Root>
                        </div>
                    </div>
                </div>,
                document.body
            ) }
        </div>
    );
}
