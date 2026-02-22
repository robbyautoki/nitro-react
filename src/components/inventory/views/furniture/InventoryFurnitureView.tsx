import { IRoomSession, RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attemptItemPlacement, CreateLinkEvent, DispatchUiEvent, FurniCategory, GetConfiguration, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, LayoutRoomPreviewerView } from '../../../../common';
import { CatalogPostMarketplaceOfferEvent } from '../../../../events';
import { useInventoryFurni, useInventoryUnseenTracker } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import { FaWrench, FaTrash, FaCheckSquare } from 'react-icons/fa';
import { InventoryDeleteDialog } from './InventoryDeleteDialog';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryCategoryBar } from './InventoryCategoryBar';
import { InventoryFurnitureItemView } from './InventoryFurnitureItemView';
import { InventoryFurnitureSearchView } from './InventoryFurnitureSearchView';

interface InventoryFurnitureViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

const attemptPlaceMarketplaceOffer = (groupItem: GroupItem) =>
{
    const item = groupItem.getLastItem();

    if(!item) return false;

    if(!item.sellable) return false;

    DispatchUiEvent(new CatalogPostMarketplaceOfferEvent(item));
}

export const InventoryFurnitureView: FC<InventoryFurnitureViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);
    const { groupItems = [], selectedItem = null, setSelectedItem = null, setGroupItems = null, activate = null, deactivate = null } = useInventoryFurni();
    const { resetItems = null } = useInventoryUnseenTracker();
    const { activeCategory, filterByCategory, categories, assignItem } = useInventoryCategories();

    const [ durabilityInfo, setDurabilityInfo ] = useState<{ remaining: number; status: string; repairCost: number } | null>(null);
    const [ multiSelectMode, setMultiSelectMode ] = useState(false);
    const [ selectedGroups, setSelectedGroups ] = useState<Set<GroupItem>>(new Set());
    const [ showDeleteDialog, setShowDeleteDialog ] = useState(false);
    const [ deleteTarget, setDeleteTarget ] = useState<{ groupItem: GroupItem; maxCount: number } | null>(null);
    const [ showCategoryDropdown, setShowCategoryDropdown ] = useState(false);
    const [ showBatchDeleteDialog, setShowBatchDeleteDialog ] = useState(false);

    const categoryFilteredItems = filterByCategory(groupItems, activeCategory);

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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Habbo-User-Id': String(GetSessionDataManager().userId),
                },
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

            for(const type of types)
            {
                assignItem(type, categoryId);
            }
        }
        catch(err)
        {
            console.error('[Inventory] Batch assign failed:', err);
        }

        setShowCategoryDropdown(false);
    }, [ selectedGroups, assignItem ]);

    const handleBatchDelete = useCallback(() =>
    {
        setShowBatchDeleteDialog(true);
    }, []);

    const confirmBatchDelete = useCallback(() =>
    {
        const allItemIds: number[] = [];

        for(const group of selectedGroups)
        {
            allItemIds.push(...group.items.map(item => item.id));
        }

        if(allItemIds.length) handleDeleteItems(allItemIds);

        clearMultiSelect();
        setShowBatchDeleteDialog(false);
    }, [ selectedGroups, handleDeleteItems, clearMultiSelect ]);

    const batchDeleteItemCount = Array.from(selectedGroups).reduce((sum, g) => sum + g.items.length, 0);

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
            if(selectedItem.isWallItem)
            {
                roomPreviewer.addWallItemIntoRoom(selectedItem.type, new Vector3d(90), furnitureItem.stuffData.getLegacyString());
            }
            else
            {
                roomPreviewer.addFurnitureIntoRoom(selectedItem.type, new Vector3d(90), selectedItem.stuffData, (furnitureItem.extra.toString()));
            }
        }
    }, [ roomPreviewer, selectedItem ]);

    useEffect(() =>
    {
        if(!selectedItem)
        {
            setDurabilityInfo(null);
            return;
        }

        const lastItem = selectedItem.getLastItem();
        if(!lastItem) return;

        let cancelled = false;
        const cmsUrl = GetConfiguration<string>('url.prefix', '');

        fetch(`${ cmsUrl }/api/furniture/durability?itemId=${ lastItem.id }`)
            .then(res => res.json())
            .then(data =>
            {
                if(cancelled) return;
                if(data && data.durabilityRemaining !== undefined)
                {
                    setDurabilityInfo({ remaining: data.durabilityRemaining, status: data.status, repairCost: data.repairCost });
                }
                else
                {
                    setDurabilityInfo(null);
                }
            })
            .catch(() => { if(!cancelled) setDurabilityInfo(null); });

        return () => { cancelled = true; };
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

    const addToHotbar = useCallback(() =>
    {
        if(!selectedItem) return;

        const sessionData = GetSessionDataManager();
        const floorData = sessionData.getFloorItemData(selectedItem.type);
        const wallData = !floorData ? sessionData.getWallItemData(selectedItem.type) : null;
        const data = floorData || wallData;

        if(!data) return;

        // Read current hotbar from localStorage to find first empty slot
        let slots: any[] = [];
        try { slots = JSON.parse(localStorage.getItem('habbo_hotbar') || '[]'); } catch {}
        const emptyIndex = slots.findIndex((s: any) => !s || s.item_base_id === null);
        const targetSlot = emptyIndex >= 0 ? emptyIndex : undefined;

        window.dispatchEvent(new CustomEvent('hotbar:set-slot', {
            detail: {
                slot: targetSlot,
                item_base_id: data.id,
                public_name: data.name,
                item_name: data.className,
                sprite_id: selectedItem.type,
            },
        }));
    }, [selectedItem]);

    if(!groupItems || !groupItems.length) return <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.title') } desc={ LocalizeText('inventory.empty.desc') } />;

    return (
        <Column grow gap={ 0 } style={{ minHeight: 0 }}>
            <div className="inv-toolbar-row">
                <InventoryFurnitureSearchView groupItems={ categoryFilteredItems } setGroupItems={ setFilteredGroupItems } />
                <div
                    className={ 'inv-multiselect-toggle' + (multiSelectMode ? ' active' : '') }
                    onClick={ () => { if(multiSelectMode) clearMultiSelect(); else setMultiSelectMode(true); } }
                    title="Mehrfachauswahl"
                >
                    <FaCheckSquare style={{ fontSize: '14px' }} />
                </div>
            </div>
            <InventoryCategoryBar groupItems={ groupItems } />
            <div className="inv-items-grid mt-2">
                <AutoGrid columnCount={ 7 }>
                    { filteredGroupItems && (filteredGroupItems.length > 0) && filteredGroupItems.map((item, index) =>
                        <InventoryFurnitureItemView
                            key={ index }
                            groupItem={ item }
                            multiSelectMode={ multiSelectMode }
                            isMultiSelected={ selectedGroups.has(item) }
                            onMultiToggle={ toggleMultiSelect }
                        />) }
                </AutoGrid>
            </div>
            { multiSelectMode && selectedGroups.size > 0 &&
                <div className="inv-multi-toolbar">
                    <span className="inv-multi-count">{ selectedGroups.size } ausgewählt</span>
                    <div className="inv-multi-actions">
                        { categories.length > 0 && selectedGroups.size > 0 &&
                            <div className="inv-multi-dropdown-wrap">
                                <Button size="sm" onClick={ () => setShowCategoryDropdown(!showCategoryDropdown) }>
                                    Kategorie zuweisen
                                </Button>
                                { showCategoryDropdown &&
                                    <div className="inv-multi-dropdown">
                                        { categories.map(cat => (
                                            <div key={ cat.id } className="inv-multi-dropdown-item" onClick={ () => handleBatchAssign(cat.id) }>
                                                <span className="color-dot" style={{ backgroundColor: cat.color }} />
                                                { cat.name }
                                            </div>
                                        )) }
                                    </div> }
                            </div> }
                        <Button variant="danger" size="sm" onClick={ handleBatchDelete }>
                            <FaTrash style={{ marginRight: '4px' }} /> Löschen
                        </Button>
                        <Button size="sm" onClick={ clearMultiSelect }>
                            Abbrechen
                        </Button>
                    </div>
                </div> }
            { !multiSelectMode && selectedItem &&
                <div className="inv-footer">
                    <div className="inv-footer-preview-large">
                        <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 110 } />
                    </div>
                    <div className="inv-footer-info">
                        <div className="inv-footer-name">{ selectedItem.name }</div>
                        <div className="inv-footer-count">{ selectedItem.getUnlockedCount() } Stk.</div>
                        { durabilityInfo &&
                            <div style={ { marginBottom: '4px' } }>
                                <div style={ { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' } }>
                                    <FaWrench style={ { fontSize: '10px', color: durabilityInfo.status === 'broken' ? '#ef4444' : '#9ca3af' } } />
                                    <span style={ { fontSize: '11px', color: durabilityInfo.status === 'broken' ? '#ef4444' : '#d1d5db' } }>
                                        { durabilityInfo.status === 'broken' ? 'Zerbrochen!' : `${ durabilityInfo.remaining }%` }
                                    </span>
                                </div>
                                <div style={ { width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' } }>
                                    <div style={ {
                                        width: `${ durabilityInfo.remaining }%`,
                                        height: '100%',
                                        borderRadius: '2px',
                                        background: durabilityInfo.status === 'broken' ? '#6b7280'
                                            : durabilityInfo.remaining > 50 ? '#22c55e'
                                            : durabilityInfo.remaining > 25 ? '#eab308'
                                            : '#ef4444',
                                    } } />
                                </div>
                            </div> }
                        <div className="inv-footer-actions">
                            { !!roomSession && (!durabilityInfo || durabilityInfo.status !== 'broken') &&
                                <Button variant="success" size="sm" onClick={ event => attemptItemPlacement(selectedItem) }>
                                    { LocalizeText('inventory.furni.placetoroom') }
                                </Button> }
                            { durabilityInfo && durabilityInfo.status === 'broken' &&
                                <Button variant="warning" size="sm" onClick={ () => CreateLinkEvent('workshop/toggle') }>
                                    Reparieren
                                </Button> }
                            <Button size="sm" onClick={ addToHotbar } title="Zur Schnellleiste hinzufügen">
                                ⚡ Hotbar
                            </Button>
                            { selectedItem.isSellable &&
                                <Button size="sm" onClick={ event => attemptPlaceMarketplaceOffer(selectedItem) }>
                                    { LocalizeText('inventory.marketplace.sell') }
                                </Button> }
                            { selectedItem.getUnlockedCount() > 0 &&
                                <Button variant="danger" size="sm" onClick={ () => {
                                    setDeleteTarget({ groupItem: selectedItem, maxCount: selectedItem.getUnlockedCount() });
                                    setShowDeleteDialog(true);
                                } }>
                                    <FaTrash />
                                </Button> }
                        </div>
                    </div>
                </div> }
            { showDeleteDialog && deleteTarget &&
                <InventoryDeleteDialog
                    groupItem={ deleteTarget.groupItem }
                    maxCount={ deleteTarget.maxCount }
                    onConfirm={ (itemIds) => { handleDeleteItems(itemIds); setShowDeleteDialog(false); setDeleteTarget(null); } }
                    onClose={ () => { setShowDeleteDialog(false); setDeleteTarget(null); } }
                /> }
            { showBatchDeleteDialog && createPortal(
                <div className="inv-delete-overlay" onClick={ () => setShowBatchDeleteDialog(false) }>
                    <div className="inv-delete-dialog" onClick={ e => e.stopPropagation() }>
                        <div className="inv-delete-header">
                            <FaTrash style={{ color: '#ef4444' }} />
                            <span>Möbel löschen</span>
                        </div>
                        <div className="inv-delete-body">
                            <div className="inv-delete-label">
                                { batchDeleteItemCount } Möbelstück(e) aus { selectedGroups.size } Auswahl unwiderruflich löschen?
                            </div>
                        </div>
                        <div className="inv-delete-footer">
                            <button className="inv-delete-cancel" onClick={ () => setShowBatchDeleteDialog(false) }>Abbrechen</button>
                            <button className="inv-delete-confirm" onClick={ confirmBatchDelete }>Löschen</button>
                        </div>
                    </div>
                </div>,
                document.body
            ) }
        </Column>
    );
}
