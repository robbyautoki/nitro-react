import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { attemptItemPlacement, GroupItem } from '../../../../api';
import { LayoutGridItem } from '../../../../common';
import { useInventoryFurni } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';

interface InventoryFurnitureItemViewProps
{
    groupItem: GroupItem;
    multiSelectMode?: boolean;
    isMultiSelected?: boolean;
    onMultiToggle?: (type: number) => void;
}

export const InventoryFurnitureItemView: FC<InventoryFurnitureItemViewProps> = props =>
{
    const { groupItem = null, multiSelectMode = false, isMultiSelected = false, onMultiToggle = null, ...rest } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const [ contextMenu, setContextMenu ] = useState<{ x: number; y: number } | null>(null);
    const { selectedItem = null, setSelectedItem = null } = useInventoryFurni();
    const { categories, getItemCategories, toggleAssignment } = useInventoryCategories();
    const contextRef = useRef<HTMLDivElement>(null);

    const onMouseEvent = (event: MouseEvent) =>
    {
        if(multiSelectMode)
        {
            if(event.type === MouseEventType.MOUSE_DOWN && onMultiToggle)
            {
                onMultiToggle(groupItem.type);
            }

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
        toggleAssignment(groupItem.type, categoryId);
    }, [ groupItem, toggleAssignment ]);

    useEffect(() =>
    {
        if(!contextMenu) return;

        const handleClick = (e: globalThis.MouseEvent) =>
        {
            if(contextRef.current && !contextRef.current.contains(e.target as Node))
            {
                setContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClick);

        return () => document.removeEventListener('mousedown', handleClick);
    }, [ contextMenu ]);

    const count = groupItem.getUnlockedCount();
    const itemCategories = getItemCategories(groupItem.type);

    return (
        <>
            <LayoutGridItem
                className={ (!count ? 'opacity-0-5 ' : '') + (multiSelectMode && isMultiSelected ? 'inv-multi-selected ' : '') }
                itemImage={ groupItem.iconUrl }
                itemCount={ groupItem.getUnlockedCount() }
                itemActive={ multiSelectMode ? isMultiSelected : (groupItem === selectedItem) }
                itemUniqueNumber={ groupItem.stuffData.uniqueNumber }
                itemUnseen={ groupItem.hasUnseenItems }
                onMouseDown={ onMouseEvent }
                onMouseUp={ onMouseEvent }
                onMouseOut={ onMouseEvent }
                onDoubleClick={ onMouseEvent }
                onContextMenu={ multiSelectMode ? undefined : onContextMenu }
                { ...rest }
            >
                { multiSelectMode &&
                    <div className={ 'inv-multi-check' + (isMultiSelected ? ' checked' : '') }>
                        { isMultiSelected && '✓' }
                    </div> }
            </LayoutGridItem>
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
