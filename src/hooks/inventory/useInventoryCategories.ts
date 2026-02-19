import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { GetSessionDataManager, GroupItem } from '../../api';
import { FurniCategory } from '../../api/inventory/FurniCategory';
import { CategoryApi, ServerCategoryData } from '../../api/inventory/CategoryApi';

export interface InventoryCategory
{
    id: number;
    name: string;
    color: string;
    autoFilter: string | null;
    order: number;
}

const matchesAutoFilter = (item: GroupItem, filter: string): boolean =>
{
    switch(filter)
    {
        case 'wall':
            return item.isWallItem;
        case 'floor':
            return !item.isWallItem;
        case 'wired':
        {
            if(item.isWallItem) return false;

            const furniData = GetSessionDataManager().getFloorItemData(item.type);

            if(!furniData) return false;

            const className = furniData.className || '';

            return className.startsWith('wf_act_')
                || className.startsWith('wf_cnd_')
                || className.startsWith('wf_trg_');
        }
        case 'wallpaper':
            return item.category === FurniCategory.WALL_PAPER;
        case 'poster':
            return item.category === FurniCategory.POSTER;
        case 'trophy':
            return item.category === FurniCategory.TROPHY;
        case 'guild':
            return item.category === FurniCategory.GUILD_FURNI;
        case 'rare':
            return item.category === FurniCategory.CREDIT_FURNI;
        default:
            return false;
    }
};

interface InventoryCategoryData
{
    categories: InventoryCategory[];
    assignments: Record<number, number[]>;
}

const COLORS = [ '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899' ];
const EMPTY_DATA: InventoryCategoryData = { categories: [], assignments: {} };

const useInventoryCategoriesState = () =>
{
    const [ data, setData ] = useState<InventoryCategoryData>(EMPTY_DATA);
    const [ activeCategory, setActiveCategory ] = useState<number | null>(null);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ error, setError ] = useState<string | null>(null);
    const loadedRef = useRef(false);

    // Initial load from server
    useEffect(() =>
    {
        if(loadedRef.current) return;

        loadedRef.current = true;

        CategoryApi.load()
            .then((serverData: ServerCategoryData) =>
            {
                setData({
                    categories: serverData.categories.map(c => ({
                        ...c,
                        autoFilter: c.autoFilter || null,
                    })),
                    assignments: serverData.assignments,
                });
                setError(null);
            })
            .catch((err: Error) =>
            {
                console.error('[InventoryCategories] Load failed:', err);
                setError(err.message);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const reload = useCallback(() =>
    {
        setIsLoading(true);

        CategoryApi.load()
            .then((serverData: ServerCategoryData) =>
            {
                setData({
                    categories: serverData.categories.map(c => ({
                        ...c,
                        autoFilter: c.autoFilter || null,
                    })),
                    assignments: serverData.assignments,
                });
                setError(null);
            })
            .catch((err: Error) =>
            {
                console.error('[InventoryCategories] Reload failed:', err);
                setError(err.message);
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Optimistic create
    const createCategory = useCallback((name: string, color?: string, autoFilter?: string | null) =>
    {
        const chosenColor = color || COLORS[data.categories.length % COLORS.length];
        const chosenFilter = autoFilter || null;
        const tempId = -Date.now();
        const tempCat: InventoryCategory = {
            id: tempId,
            name,
            color: chosenColor,
            autoFilter: chosenFilter,
            order: data.categories.length,
        };

        setData(prev => ({
            ...prev,
            categories: [ ...prev.categories, tempCat ],
        }));

        CategoryApi.create(name, chosenColor, chosenFilter)
            .then((created) =>
            {
                setData(prev => ({
                    ...prev,
                    categories: prev.categories.map(c =>
                        c.id === tempId ? { ...c, id: created.id } : c
                    ),
                }));
            })
            .catch((err: Error) =>
            {
                console.error('[InventoryCategories] Create failed:', err);
                setData(prev => ({
                    ...prev,
                    categories: prev.categories.filter(c => c.id !== tempId),
                }));
            });
    }, [ data ]);

    // Optimistic rename
    const renameCategory = useCallback((id: number, name: string) =>
    {
        const prev = data.categories.find(c => c.id === id);

        if(!prev) return;

        setData(d => ({
            ...d,
            categories: d.categories.map(c => c.id === id ? { ...c, name } : c),
        }));

        CategoryApi.update(id, { name }).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Rename failed:', err);
            setData(d => ({
                ...d,
                categories: d.categories.map(c => c.id === id ? { ...c, name: prev.name } : c),
            }));
        });
    }, [ data ]);

    // Optimistic delete
    const deleteCategory = useCallback((id: number) =>
    {
        const prevCategories = data.categories;
        const prevAssignments = { ...data.assignments };

        const newAssignments = { ...data.assignments };

        for(const key in newAssignments)
        {
            newAssignments[key] = newAssignments[key].filter(cid => cid !== id);

            if(!newAssignments[key].length) delete newAssignments[key];
        }

        setData({
            categories: data.categories.filter(c => c.id !== id),
            assignments: newAssignments,
        });

        if(activeCategory === id) setActiveCategory(null);

        CategoryApi.remove(id).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Delete failed:', err);
            setData({ categories: prevCategories, assignments: prevAssignments });
        });
    }, [ data, activeCategory ]);

    // Optimistic color change
    const setCategoryColor = useCallback((id: number, color: string) =>
    {
        const prev = data.categories.find(c => c.id === id);

        if(!prev) return;

        setData(d => ({
            ...d,
            categories: d.categories.map(c => c.id === id ? { ...c, color } : c),
        }));

        CategoryApi.update(id, { color }).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Color change failed:', err);
            setData(d => ({
                ...d,
                categories: d.categories.map(c => c.id === id ? { ...c, color: prev.color } : c),
            }));
        });
    }, [ data ]);

    // Optimistic assign
    const assignItem = useCallback((itemType: number, categoryId: number) =>
    {
        const current = data.assignments[itemType] || [];

        if(current.includes(categoryId)) return;

        setData(prev =>
        {
            const newAssignments = { ...prev.assignments };

            newAssignments[itemType] = [ ...(newAssignments[itemType] || []), categoryId ];

            return { ...prev, assignments: newAssignments };
        });

        CategoryApi.assign(categoryId, itemType).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Assign failed:', err);
            setData(prev =>
            {
                const newAssignments = { ...prev.assignments };

                newAssignments[itemType] = (newAssignments[itemType] || []).filter(cid => cid !== categoryId);

                if(!newAssignments[itemType]?.length) delete newAssignments[itemType];

                return { ...prev, assignments: newAssignments };
            });
        });
    }, [ data ]);

    // Optimistic unassign
    const unassignItem = useCallback((itemType: number, categoryId: number) =>
    {
        const current = data.assignments[itemType];

        if(!current || !current.includes(categoryId)) return;

        setData(prev =>
        {
            const newAssignments = { ...prev.assignments };

            newAssignments[itemType] = (newAssignments[itemType] || []).filter(cid => cid !== categoryId);

            if(!newAssignments[itemType]?.length) delete newAssignments[itemType];

            return { ...prev, assignments: newAssignments };
        });

        CategoryApi.unassign(categoryId, itemType).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Unassign failed:', err);
            setData(prev =>
            {
                const newAssignments = { ...prev.assignments };

                newAssignments[itemType] = [ ...(newAssignments[itemType] || []), categoryId ];

                return { ...prev, assignments: newAssignments };
            });
        });
    }, [ data ]);

    const toggleAssignment = useCallback((itemType: number, categoryId: number) =>
    {
        const current = data.assignments[itemType] || [];

        if(current.includes(categoryId)) unassignItem(itemType, categoryId);
        else assignItem(itemType, categoryId);
    }, [ data, assignItem, unassignItem ]);

    const getItemCategories = useCallback((itemType: number): number[] =>
    {
        return data.assignments[itemType] || [];
    }, [ data ]);

    const filterByCategory = useCallback((groupItems: GroupItem[], categoryId: number | null): GroupItem[] =>
    {
        if(!categoryId) return groupItems;

        const category = data.categories.find(c => c.id === categoryId);

        if(!category) return groupItems;

        return groupItems.filter(item =>
        {
            const cats = data.assignments[item.type];

            if(cats && cats.includes(categoryId)) return true;

            if(category.autoFilter) return matchesAutoFilter(item, category.autoFilter);

            return false;
        });
    }, [ data ]);

    const getCategoryItemCount = useCallback((categoryId: number, groupItems: GroupItem[]): number =>
    {
        const category = data.categories.find(c => c.id === categoryId);

        if(!category) return 0;

        return groupItems.filter(item =>
        {
            const cats = data.assignments[item.type];

            if(cats && cats.includes(categoryId)) return true;

            if(category.autoFilter) return matchesAutoFilter(item, category.autoFilter);

            return false;
        }).length;
    }, [ data ]);

    // Optimistic reorder
    const reorderCategories = useCallback((orderedIds: number[]) =>
    {
        const prevCategories = [ ...data.categories ];

        setData(prev =>
        {
            const reordered = orderedIds
                .map((id, index) =>
                {
                    const cat = prev.categories.find(c => c.id === id);

                    return cat ? { ...cat, order: index } : null;
                })
                .filter(Boolean) as InventoryCategory[];

            return { ...prev, categories: reordered };
        });

        CategoryApi.reorder(orderedIds).catch((err: Error) =>
        {
            console.error('[InventoryCategories] Reorder failed:', err);
            setData(prev => ({ ...prev, categories: prevCategories }));
        });
    }, [ data ]);

    return {
        categories: data.categories,
        assignments: data.assignments,
        activeCategory,
        setActiveCategory,
        isLoading,
        error,
        createCategory,
        renameCategory,
        deleteCategory,
        setCategoryColor,
        assignItem,
        unassignItem,
        toggleAssignment,
        getItemCategories,
        filterByCategory,
        getCategoryItemCount,
        reorderCategories,
        reload,
        COLORS,
    };
};

export const useInventoryCategories = () => useBetween(useInventoryCategoriesState);
