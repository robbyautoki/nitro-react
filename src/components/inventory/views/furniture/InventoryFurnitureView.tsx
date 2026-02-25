import { IRoomSession, RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attemptItemPlacement, CreateLinkEvent, FurniCategory, GetConfiguration, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { getAuthHeaders } from '../../../../api/utils/SessionTokenManager';
import { LayoutRoomPreviewerView } from '../../../../common';
import { useInventoryFurni, useInventoryUnseenTracker } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import { FaWrench, FaTrash, FaCheckSquare, FaTimes, FaBolt, FaStore, FaArrowUp } from 'react-icons/fa';
import { InventoryDeleteDialog } from './InventoryDeleteDialog';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryFurnitureItemView } from './InventoryFurnitureItemView';
import { InventoryFurnitureSearchView } from './InventoryFurnitureSearchView';

interface InventoryFurnitureViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

const RARITY_META: Record<string, { label: string; cls: string }> = {
    legendary: { label: 'LGD', cls: 'rarity-legendary' },
    epic: { label: 'EPIC', cls: 'rarity-epic' },
    rare: { label: 'RARE', cls: 'rarity-rare' },
};

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
    const [ sortMode, setSortMode ] = useState<'name' | 'count' | 'rarity'>('name');

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
        catch(err) { console.error('[Inventory] Delete failed:', err); }
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
        catch(err) { console.error('[Inventory] Batch assign failed:', err); }
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

    // Room previewer
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

    // Durability
    useEffect(() =>
    {
        if(!selectedItem) { setDurabilityInfo(null); return; }
        const lastItem = selectedItem.getLastItem();
        if(!lastItem) return;
        let cancelled = false;
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        fetch(`${ cmsUrl }/api/furniture/durability?itemId=${ lastItem.id }`)
            .then(res => res.json())
            .then(data => { if(!cancelled && data?.durabilityRemaining !== undefined) setDurabilityInfo({ remaining: data.durabilityRemaining, status: data.status, repairCost: data.repairCost }); else if(!cancelled) setDurabilityInfo(null); })
            .catch(() => { if(!cancelled) setDurabilityInfo(null); });
        return () => { cancelled = true; };
    }, [ selectedItem ]);

    // Unseen
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
        let slots: any[] = [];
        try { slots = JSON.parse(localStorage.getItem('habbo_hotbar') || '[]'); } catch {}
        const emptyIndex = slots.findIndex((s: any) => !s || s.item_base_id === null);
        const targetSlot = emptyIndex >= 0 ? emptyIndex : undefined;
        window.dispatchEvent(new CustomEvent('hotbar:set-slot', {
            detail: { slot: targetSlot, item_base_id: data.id, public_name: data.name, item_name: data.className, sprite_id: selectedItem.type },
        }));
    }, [ selectedItem ]);

    // Inspector helpers
    const getSelectedRarity = (): string | null =>
    {
        if(!selectedItem) return null;
        const name = (selectedItem.name || '').toLowerCase();
        if(name.includes('legendary') || name.includes('ltd') || selectedItem.stuffData.uniqueNumber > 0) return null;
        return null;
    };

    const getSelectedClassname = (): string =>
    {
        if(!selectedItem) return '';
        const sessionData = GetSessionDataManager();
        const floorData = sessionData.getFloorItemData(selectedItem.type);
        const wallData = !floorData ? sessionData.getWallItemData(selectedItem.type) : null;
        return (floorData || wallData)?.className || `type-${ selectedItem.type }`;
    };

    if(!groupItems || !groupItems.length) return <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.title') } desc={ LocalizeText('inventory.empty.desc') } />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Toolbar */}
            <div className="inv-toolbar-row">
                <InventoryFurnitureSearchView groupItems={ categoryFilteredItems } setGroupItems={ setFilteredGroupItems } />
                <div className="inv-toolbar-sep" />
                { (['name', 'count', 'rarity'] as const).map(mode => (
                    <div key={ mode } className={ 'inv-sort-btn' + (sortMode === mode ? ' active' : '') } onClick={ () => setSortMode(mode) }>
                        { mode === 'name' ? 'A-Z' : mode === 'count' ? 'Menge' : 'Rarität' }
                    </div>
                )) }
                <div className="inv-toolbar-sep" />
                <div
                    className={ 'inv-multiselect-toggle' + (multiSelectMode ? ' active' : '') }
                    onClick={ () => { if(multiSelectMode) clearMultiSelect(); else setMultiSelectMode(true); } }
                >
                    <FaCheckSquare style={{ fontSize: '10px' }} />
                    <span>Multi</span>
                </div>
                <span className="inv-count">{ filteredGroupItems.length }/{ groupItems.length }</span>
            </div>

            {/* Multi toolbar */}
            { multiSelectMode && selectedGroups.size > 0 &&
                <div className="inv-multi-toolbar">
                    <span className="inv-multi-count">{ selectedGroups.size } ausgewählt</span>
                    <div className="inv-multi-actions">
                        { categories.length > 0 &&
                            <div className="inv-multi-dropdown-wrap">
                                <button className="inv-multi-btn" onClick={ () => setShowCategoryDropdown(!showCategoryDropdown) }>Kategorie</button>
                                { showCategoryDropdown &&
                                    <div className="inv-multi-dropdown">
                                        { categories.map(cat => (
                                            <div key={ cat.id } className="inv-multi-dropdown-item" onClick={ () => handleBatchAssign(cat.id) }>
                                                <span className="color-dot" style={{ backgroundColor: cat.color, width: 6, height: 6, borderRadius: '50%' }} />
                                                { cat.name }
                                            </div>
                                        )) }
                                    </div> }
                            </div> }
                        <button className="inv-multi-btn danger" onClick={ () => setShowBatchDeleteDialog(true) }>
                            <FaTrash style={{ fontSize: 9, marginRight: 3 }} />Löschen
                        </button>
                        <button className="inv-multi-btn ghost" onClick={ clearMultiSelect }>Abbrechen</button>
                    </div>
                </div> }

            {/* Item Grid */}
            <div className="inv-items-scroll">
                <div className="inv-items-wrap">
                    { filteredGroupItems.length > 0
                        ? filteredGroupItems.map((item, index) =>
                            <InventoryFurnitureItemView
                                key={ index }
                                groupItem={ item }
                                multiSelectMode={ multiSelectMode }
                                isMultiSelected={ selectedGroups.has(item) }
                                onMultiToggle={ toggleMultiSelect }
                            />)
                        : <div className="inv-empty">
                            <span className="inv-empty-icon">📦</span>
                            <span className="inv-empty-text">Keine Möbel gefunden</span>
                        </div>
                    }
                </div>
            </div>

            {/* Inspector Panel */}
            { !multiSelectMode && selectedItem &&
                <div className="inv-inspector">
                    <div className="inv-inspector-frame">
                        <div className="inv-inspector-detail">
                            <div className="inv-inspector-preview">
                                <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 72 } />
                                { selectedItem.stuffData.uniqueNumber > 0 &&
                                    <span className="inv-tile-ltd" style={{ borderRadius: '0 0 0 4px' }}>LTD</span> }
                            </div>
                            <div className="inv-inspector-info">
                                <div className="inv-inspector-title-row">
                                    <span className="inv-inspector-name">{ selectedItem.name }</span>
                                    <span className="inv-inspector-count-label">{ selectedItem.getUnlockedCount() }×</span>
                                    <button className="inv-inspector-close" onClick={ () => setSelectedItem(null) }>
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="inv-inspector-meta">
                                    <span className="inv-inspector-code">{ getSelectedClassname() }</span>
                                    { selectedItem.stuffData.uniqueNumber > 0 &&
                                        <span className="inv-inspector-ltd">#{ selectedItem.stuffData.uniqueNumber }/{ selectedItem.stuffData.uniqueSeries }</span> }
                                </div>
                                <div className="inv-inspector-meta">
                                    <span className="inv-inspector-pill">{ selectedItem.isWallItem ? 'Wand' : 'Boden' }</span>
                                </div>
                                { durabilityInfo &&
                                    <div className="inv-durability">
                                        <FaWrench className="inv-durability-icon" style={{ color: durabilityInfo.remaining < 30 ? '#ef4444' : 'rgba(0,0,0,0.25)' }} />
                                        <div className="inv-durability-bar">
                                            <div className="inv-durability-fill" style={{
                                                width: `${ durabilityInfo.remaining }%`,
                                                background: durabilityInfo.remaining < 30 ? '#ef4444'
                                                    : durabilityInfo.remaining < 60 ? '#eab308'
                                                    : '#22c55e',
                                            }} />
                                        </div>
                                        <span className="inv-durability-text" style={{
                                            color: durabilityInfo.remaining < 30 ? '#ef4444'
                                                : durabilityInfo.remaining < 60 ? '#d97706'
                                                : '#16a34a',
                                        }}>
                                            { durabilityInfo.remaining }%
                                        </span>
                                    </div> }
                            </div>
                        </div>
                        <div className="inv-inspector-actions">
                            { !!roomSession && (!durabilityInfo || durabilityInfo.status !== 'broken') &&
                                <button className="inv-action-btn primary" onClick={ () => attemptItemPlacement(selectedItem) }>
                                    <FaArrowUp className="action-icon" /> Platzieren
                                </button> }
                            <button className="inv-action-btn" onClick={ addToHotbar }>
                                <FaBolt className="action-icon" /> Hotbar
                            </button>
                            { selectedItem.isSellable &&
                                <button className="inv-action-btn" onClick={ () => CreateLinkEvent(`marketplace/sell/${ selectedItem.type }`) }>
                                    <FaStore className="action-icon" /> Markt
                                </button> }
                            { durabilityInfo && durabilityInfo.remaining < 30 &&
                                <button className="inv-action-btn warning" onClick={ () => CreateLinkEvent('workshop/toggle') }>
                                    <FaWrench className="action-icon" /> Reparieren
                                </button> }
                            <div className="inv-action-spacer" />
                            { selectedItem.getUnlockedCount() > 0 &&
                                <button className="inv-action-btn danger" onClick={ () => {
                                    setDeleteTarget({ groupItem: selectedItem, maxCount: selectedItem.getUnlockedCount() });
                                    setShowDeleteDialog(true);
                                } }>
                                    <FaTrash className="action-icon" />
                                </button> }
                        </div>
                    </div>
                </div> }

            {/* Delete dialogs */}
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
        </div>
    );
}
