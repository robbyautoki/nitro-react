import { MouseEventType } from '@nitrots/nitro-renderer';
import { ComponentProps, FC, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Check } from 'lucide-react';
import { attemptItemPlacement, GetSessionDataManager, GroupItem } from '../../../../api';
import { useInventoryFurni } from '../../../../hooks';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import { cn } from '@/align-ui/utils/cn';

interface InventoryFurnitureItemViewProps
{
    groupItem: GroupItem;
    multiSelectMode?: boolean;
    isMultiSelected?: boolean;
    onMultiToggle?: (group: GroupItem) => void;
}

type RarityColor = ComponentProps<typeof AlignBadge.Root>['color'];

export const InventoryFurnitureItemView: FC<InventoryFurnitureItemViewProps> = props =>
{
    const { groupItem = null, multiSelectMode = false, isMultiSelected = false, onMultiToggle = null } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const [ imgError, setImgError ] = useState(false);
    const [ contextMenu, setContextMenu ] = useState<{ x: number; y: number } | null>(null);
    const { selectedItem = null, setSelectedItem = null } = useInventoryFurni();
    const { categories, getItemCategories, toggleAssignment } = useInventoryCategories();
    const contextRef = useRef<HTMLDivElement>(null);

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

    // Rarity detection
    const getRarity = (): { label: string; color: RarityColor } | null =>
    {
        if(isLtd) return { label: 'LGD', color: 'orange' };
        const cn = className.toLowerCase();
        const name = groupItem.name.toLowerCase();
        if(cn.includes('rare_') || name.includes('rare') || name.includes('selten'))
            return { label: 'RARE', color: 'blue' };
        if(cn.includes('epic_') || name.includes('epic'))
            return { label: 'EPIC', color: 'purple' };
        return null;
    };
    const rarity = getRarity();

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

    const itemCategories = getItemCategories(assignmentKey);
    const sizeLabel = !isWall && (floorData as any)
        ? `${ (floorData as any)?.customParams?.split(',')[0] || '1' }×${ (floorData as any)?.customParams?.split(',')[1] || '1' }`
        : 'Wand';

    return (
        <>
            <AlignTooltip.Provider delayDuration={ 350 }>
                <AlignTooltip.Root>
                    <AlignTooltip.Trigger asChild>
                        <div
                            className={ cn(
                                'group relative -m-px flex size-[52px] cursor-pointer select-none items-center justify-center border bg-bg-white-0 transition duration-200 ease-out',
                                'border-stroke-soft-200 hover:bg-bg-weak-50',
                                isActive && 'z-[2] border-primary-base bg-primary-alpha-10 ring-1 ring-inset ring-primary-base',
                                multiSelectMode && isMultiSelected && 'z-[2] border-information-base bg-information-lighter ring-1 ring-inset ring-information-base',
                                !count && 'opacity-50',
                            ) }
                            onMouseDown={ onMouseEvent }
                            onMouseUp={ onMouseEvent }
                            onMouseOut={ onMouseEvent }
                            onDoubleClick={ onMouseEvent }
                            onContextMenu={ multiSelectMode ? undefined : onContextMenu }
                        >
                            { !imgError ? (
                                <img
                                    className="pointer-events-none size-9 object-contain"
                                    style={ { imageRendering: 'pixelated' } }
                                    src={ groupItem.iconUrl }
                                    alt=""
                                    onError={ () => setImgError(true) }
                                />
                            ) : (
                                <Box className="size-4 text-text-soft-400" />
                            ) }
                            { groupItem.hasUnseenItems && (
                                <span className="absolute left-1 top-1 z-[3] size-1.5 rounded-full bg-information-base" />
                            ) }
                            { multiSelectMode && (
                                <span
                                    className={ cn(
                                        'absolute left-1 top-1 z-[3] flex size-3.5 items-center justify-center rounded border-[1.5px] bg-bg-white-0',
                                        isMultiSelected ? 'border-information-base bg-information-base' : 'border-stroke-soft-200',
                                    ) }
                                >
                                    { isMultiSelected && <Check className="size-2.5 text-static-white" strokeWidth={ 3 } /> }
                                </span>
                            ) }
                            { isLtd && (
                                <AlignBadge.Root
                                    color="orange"
                                    variant="filled"
                                    size="small"
                                    square
                                    className="absolute right-0.5 top-0.5 h-3.5 px-1 text-[7px]"
                                >
                                    { groupItem.stuffData.uniqueNumber }
                                </AlignBadge.Root>
                            ) }
                            { count > 1 && (
                                <AlignBadge.Root
                                    color="gray"
                                    variant="lighter"
                                    size="small"
                                    square
                                    className="absolute bottom-0.5 right-0.5 h-3.5 px-1 text-[9px] font-bold"
                                >
                                    { count }
                                </AlignBadge.Root>
                            ) }
                            { rarity && (
                                <AlignBadge.Root
                                    color={ rarity.color }
                                    variant="lighter"
                                    size="small"
                                    square
                                    className="absolute bottom-0.5 left-0.5 h-3 px-1 text-[7px] font-bold uppercase tracking-wider"
                                >
                                    { rarity.label }
                                </AlignBadge.Root>
                            ) }
                        </div>
                    </AlignTooltip.Trigger>
                    { !contextMenu && (
                        <AlignTooltip.Content size="small" variant="dark" className="max-w-[220px]">
                            <div className="flex flex-col gap-0.5">
                                <span className="truncate font-semibold">{ groupItem.name }</span>
                                { className && <span className="truncate font-mono text-[9px] opacity-60">{ className }</span> }
                                <div className="flex items-center gap-1 text-[10px] opacity-70">
                                    <span>{ count }×</span>
                                    <span>·</span>
                                    <span>{ sizeLabel }</span>
                                </div>
                                { isLtd && <span className="text-[10px] font-semibold text-warning-light">LTD #{ groupItem.stuffData.uniqueNumber }/{ groupItem.stuffData.uniqueSeries }</span> }
                            </div>
                        </AlignTooltip.Content>
                    ) }
                </AlignTooltip.Root>
            </AlignTooltip.Provider>
            { contextMenu && categories.length > 0 && (
                <div
                    ref={ contextRef }
                    className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-xl bg-bg-white-0 py-1 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200"
                    style={ { left: contextMenu.x, top: contextMenu.y } }
                >
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-soft-400">
                        Kategorie
                    </div>
                    { categories.map(cat => (
                        <button
                            key={ cat.id }
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-paragraph-xs text-text-sub-600 transition-colors hover:bg-bg-weak-50"
                            onClick={ () => onToggleCategory(cat.id) }
                        >
                            <span className="size-2 shrink-0 rounded-full" style={ { backgroundColor: cat.color } } />
                            <span className="flex-1 text-left">{ cat.name }</span>
                            { itemCategories.includes(cat.id) && <Check className="size-3 text-success-base" /> }
                        </button>
                    )) }
                </div>
            ) }
        </>
    );
}
