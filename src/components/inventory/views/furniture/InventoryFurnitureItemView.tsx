import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { attemptItemPlacement, GetSessionDataManager, GroupItem } from '../../../../api';
import { useInventoryFurni } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import { FaWrench } from 'react-icons/fa';

interface InventoryFurnitureItemViewProps
{
    groupItem: GroupItem;
    multiSelectMode?: boolean;
    isMultiSelected?: boolean;
    onMultiToggle?: (group: GroupItem) => void;
}

export const InventoryFurnitureItemView: FC<InventoryFurnitureItemViewProps> = props =>
{
    const { groupItem = null, multiSelectMode = false, isMultiSelected = false, onMultiToggle = null } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const [ showTooltip, setShowTooltip ] = useState(false);
    const [ contextMenu, setContextMenu ] = useState<{ x: number; y: number } | null>(null);
    const { selectedItem = null, setSelectedItem = null } = useInventoryFurni();
    const { categories, getItemCategories, toggleAssignment } = useInventoryCategories();
    const contextRef = useRef<HTMLDivElement>(null);
    const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(null);

    const isActive = !multiSelectMode && groupItem === selectedItem;
    const count = groupItem.getUnlockedCount();
    const isLtd = groupItem.stuffData.uniqueNumber > 0;
    const ltdItemId = isLtd ? (groupItem.getLastItem()?.id || 0) : 0;
    const assignmentKey = isLtd && ltdItemId > 0 ? -ltdItemId : groupItem.type;

    const sessionData = GetSessionDataManager();
    const floorData = sessionData.getFloorItemData(groupItem.type);
    const wallData = !floorData ? sessionData.getWallItemData(groupItem.type) : null;
    const furniData = floorData || wallData;
    const className = furniData?.className || '';
    const isWall = groupItem.isWallItem;

    const onMouseEvent = (event: MouseEvent) =>
    {
        if(multiSelectMode)
        {
            if(event.type === MouseEventType.MOUSE_DOWN && onMultiToggle) onMultiToggle(groupItem);
            return;
        }
        switch(event.type)
        {
            case MouseEventType.MOUSE_DOWN:
                setSelectedItem(groupItem);
                setMouseDown(true);
                return;
            case MouseEventType.MOUSE_UP:
                setMouseDown(false);
                return;
            case MouseEventType.ROLL_OUT:
                if(!isMouseDown || !(groupItem === selectedItem)) return;
                attemptItemPlacement(groupItem);
                return;
            case 'dblclick':
                attemptItemPlacement(groupItem);
                return;
        }
    }

    const onHoverEnter = useCallback(() =>
    {
        tooltipTimer.current = setTimeout(() => setShowTooltip(true), 350);
    }, []);

    const onHoverLeave = useCallback(() =>
    {
        if(tooltipTimer.current) clearTimeout(tooltipTimer.current);
        setShowTooltip(false);
    }, []);

    const onContextMenu = useCallback((e: MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        if(!categories.length) return;
        setSelectedItem(groupItem);
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, [ categories, groupItem, setSelectedItem ]);

    const onToggleCategory = useCallback((categoryId: number) =>
    {
        toggleAssignment(assignmentKey, categoryId);
    }, [ assignmentKey, toggleAssignment ]);

    useEffect(() =>
    {
        if(!contextMenu) return;
        const handleClick = (e: globalThis.MouseEvent) =>
        {
            if(contextRef.current && !contextRef.current.contains(e.target as Node)) setContextMenu(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ contextMenu ]);

    useEffect(() => () => { if(tooltipTimer.current) clearTimeout(tooltipTimer.current); }, []);

    const itemCategories = getItemCategories(assignmentKey);

    let tileClass = 'inv-tile';
    if(isActive) tileClass += ' active';
    if(multiSelectMode && isMultiSelected) tileClass += ' multi-selected';
    if(!count) tileClass += ' dimmed';
    if(groupItem.hasUnseenItems) tileClass += ' unseen';

    return (
        <>
            <div
                className={ tileClass }
                onMouseDown={ onMouseEvent }
                onMouseUp={ onMouseEvent }
                onMouseOut={ e => { onMouseEvent(e); onHoverLeave(); } }
                onMouseEnter={ onHoverEnter }
                onDoubleClick={ onMouseEvent }
                onContextMenu={ multiSelectMode ? undefined : onContextMenu }
            >
                <img
                    className="inv-tile-img"
                    src={ groupItem.iconUrl }
                    alt=""
                    onError={ e => { (e.target as HTMLImageElement).style.opacity = '0.2'; } }
                />

                { multiSelectMode &&
                    <div className={ 'inv-tile-check' + (isMultiSelected ? ' checked' : '') }>
                        { isMultiSelected && '✓' }
                    </div> }

                { isLtd &&
                    <span className="inv-tile-ltd">{ groupItem.stuffData.uniqueNumber }</span> }

                { count > 1 &&
                    <span className="inv-tile-count">{ count }</span> }

                {/* Tooltip */}
                { showTooltip && !contextMenu &&
                    <div className="inv-tooltip">
                        <div className="inv-tooltip-name">{ groupItem.name }</div>
                        <div className="inv-tooltip-classname">{ className }</div>
                        <div className="inv-tooltip-meta">
                            <span>{ count }×</span>
                            <span>·</span>
                            <span>{ isWall ? 'Wand' : `${ (floorData as any)?.customParams?.split(',')[0] || '1' }×${ (floorData as any)?.customParams?.split(',')[1] || '1' }` }</span>
                        </div>
                        { isLtd && <div className="inv-tooltip-ltd">LTD #{ groupItem.stuffData.uniqueNumber }/{ groupItem.stuffData.uniqueSeries }</div> }
                    </div> }
            </div>

            { contextMenu && categories.length > 0 && (
                <div
                    ref={ contextRef }
                    className="inv-category-context"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <div className="context-header">Kategorie</div>
                    { categories.map(cat => (
                        <div
                            key={ cat.id }
                            className="context-item"
                            onClick={ () => onToggleCategory(cat.id) }
                        >
                            <span className="color-dot" style={{ backgroundColor: cat.color }} />
                            <span>{ cat.name }</span>
                            { itemCategories.includes(cat.id) && <span className="context-check">&#10003;</span> }
                        </div>
                    )) }
                </div>
            ) }
        </>
    );
}
