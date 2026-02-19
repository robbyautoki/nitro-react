import { FC, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { GroupItem } from '../../../../api';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';
import { InventoryCategoryDialog } from './InventoryCategoryDialog';

interface InventoryCategoryBarProps
{
    groupItems: GroupItem[];
}

export const InventoryCategoryBar: FC<InventoryCategoryBarProps> = ({ groupItems }) =>
{
    const { categories, activeCategory, setActiveCategory, deleteCategory, getCategoryItemCount, reorderCategories, isLoading } = useInventoryCategories();
    const [ showDialog, setShowDialog ] = useState(false);
    const [ editingCategory, setEditingCategory ] = useState<number | null>(null);
    const [ contextMenu, setContextMenu ] = useState<{ x: number; y: number; id: number } | null>(null);
    const contextRef = useRef<HTMLDivElement>(null);

    const onChipClick = useCallback((id: number | null) =>
    {
        setActiveCategory(id);
        setContextMenu(null);
    }, [ setActiveCategory ]);

    const onContextMenu = useCallback((e: MouseEvent, id: number) =>
    {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, id });
    }, []);

    const onRename = useCallback(() =>
    {
        if(!contextMenu) return;

        setEditingCategory(contextMenu.id);
        setShowDialog(true);
        setContextMenu(null);
    }, [ contextMenu ]);

    const onDelete = useCallback(() =>
    {
        if(!contextMenu) return;

        deleteCategory(contextMenu.id);
        setContextMenu(null);
    }, [ contextMenu, deleteCategory ]);

    const onMoveLeft = useCallback(() =>
    {
        if(!contextMenu) return;

        const idx = categories.findIndex(c => c.id === contextMenu.id);

        if(idx <= 0) return;

        const ids = categories.map(c => c.id);

        [ ids[idx - 1], ids[idx] ] = [ ids[idx], ids[idx - 1] ];
        reorderCategories(ids);
        setContextMenu(null);
    }, [ contextMenu, categories, reorderCategories ]);

    const onMoveRight = useCallback(() =>
    {
        if(!contextMenu) return;

        const idx = categories.findIndex(c => c.id === contextMenu.id);

        if(idx < 0 || idx >= categories.length - 1) return;

        const ids = categories.map(c => c.id);

        [ ids[idx], ids[idx + 1] ] = [ ids[idx + 1], ids[idx] ];
        reorderCategories(ids);
        setContextMenu(null);
    }, [ contextMenu, categories, reorderCategories ]);

    // Close context menu on click outside
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

    if(isLoading)
    {
        return (
            <div className="inv-category-bar">
                { [ 1, 2, 3 ].map(i => (
                    <div key={ i } className="inv-category-chip skeleton" />
                )) }
            </div>
        );
    }

    return (
        <>
            <div className="inv-category-bar">
                <div
                    className={ 'inv-category-chip' + (activeCategory === null ? ' active' : '') }
                    onClick={ () => onChipClick(null) }
                >
                    <span className="chip-label">Alle</span>
                    <span className="chip-count">{ groupItems.length }</span>
                </div>
                { categories.map(cat =>
                {
                    const count = getCategoryItemCount(cat.id, groupItems);

                    return (
                        <div
                            key={ cat.id }
                            className={ 'inv-category-chip' + (activeCategory === cat.id ? ' active' : '') }
                            onClick={ () => onChipClick(cat.id) }
                            onContextMenu={ (e) => onContextMenu(e, cat.id) }
                        >
                            <span className="color-dot" style={{ backgroundColor: cat.color }} />
                            <span className="chip-label">{ cat.name }</span>
                            { count > 0 && <span className="chip-count">{ count }</span> }
                        </div>
                    );
                }) }
                <div
                    className="inv-category-chip inv-category-add"
                    onClick={ () => { setEditingCategory(null); setShowDialog(true); } }
                >
                    +
                </div>
            </div>
            { contextMenu && (
                <div
                    ref={ contextRef }
                    className="inv-category-context"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <div className="context-item" onClick={ onRename }>Umbenennen</div>
                    <div className="context-item" onClick={ onMoveLeft }>Nach links</div>
                    <div className="context-item" onClick={ onMoveRight }>Nach rechts</div>
                    <div className="context-item context-danger" onClick={ onDelete }>Loeschen</div>
                </div>
            ) }
            { showDialog && (
                <InventoryCategoryDialog
                    editId={ editingCategory }
                    onClose={ () => setShowDialog(false) }
                />
            ) }
        </>
    );
};
