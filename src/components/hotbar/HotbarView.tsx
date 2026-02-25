import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, attemptItemPlacement } from '../../api';
import { useInventoryFurni } from '../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HotbarSlot {
    item_base_id: number | null;
    public_name: string | null;
    item_name: string | null;
    sprite_id: number | null;
}

const STORAGE_KEY = 'habbo_hotbar';
const VISIBILITY_KEY = 'habbo_hotbar_visible';
const SLOT_COUNT = 9;

function emptySlots(): HotbarSlot[] {
    return Array.from({ length: SLOT_COUNT }, () => ({ item_base_id: null, public_name: null, item_name: null, sprite_id: null }));
}

function loadSlots(): HotbarSlot[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptySlots();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return emptySlots();
        while (parsed.length < SLOT_COUNT) parsed.push({ item_base_id: null, public_name: null, item_name: null, sprite_id: null });
        return parsed.slice(0, SLOT_COUNT);
    } catch { return emptySlots(); }
}

function saveSlots(slots: HotbarSlot[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

export const HotbarView: FC = () =>
{
    const [slots, setSlots] = useState<HotbarSlot[]>(loadSlots);
    const [visible, setVisible] = useState(() => {
        const stored = localStorage.getItem(VISIBILITY_KEY);
        return stored === null ? true : stored === 'true';
    });
    const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
    const { groupItems = [] } = useInventoryFurni();

    const imageUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');

    const inventoryCounts = useMemo(() => {
        const map = new Map<number, number>();
        for (const group of groupItems) {
            map.set(group.type, group.getTotalCount());
        }
        return map;
    }, [groupItems]);

    const updateSlots = useCallback((newSlots: HotbarSlot[]) => {
        setSlots(newSlots);
        saveSlots(newSlots);
    }, []);

    const clearSlot = useCallback((index: number) => {
        const newSlots = [...slots];
        newSlots[index] = { item_base_id: null, public_name: null, item_name: null, sprite_id: null };
        updateSlots(newSlots);
    }, [slots, updateSlots]);

    const handleSlotClick = useCallback((slot: HotbarSlot, count: number) => {
        if (!slot.sprite_id) return;
        if (count > 0) {
            const group = groupItems.find(g => g.type === slot.sprite_id);
            if (group) attemptItemPlacement(group);
        } else {
            const sessionData = GetSessionDataManager();
            const furniData = sessionData.getFloorItemData(slot.sprite_id) || sessionData.getWallItemData(slot.sprite_id);
            if (furniData && furniData.purchaseOfferId > 0) {
                CreateLinkEvent(`catalog/open/offerId/${furniData.purchaseOfferId}`);
            } else {
                CreateLinkEvent('catalog/open');
            }
        }
    }, [groupItems]);

    const getFurniIcon = (itemName: string) =>
        `${imageUrl}${itemName.split('*')[0]}_icon.png`;

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            const { slot, item_base_id, public_name, item_name, sprite_id } = e.detail;
            const newSlots = [...loadSlots()];
            const targetSlot = typeof slot === 'number' && slot >= 0 ? slot : newSlots.findIndex(s => s.item_base_id === null);
            if (targetSlot < 0 || targetSlot >= SLOT_COUNT) return;
            newSlots[targetSlot] = { item_base_id, public_name, item_name, sprite_id };
            updateSlots(newSlots);
        };
        window.addEventListener('hotbar:set-slot' as any, handler);
        return () => window.removeEventListener('hotbar:set-slot' as any, handler);
    }, [updateSlots]);

    useEffect(() => {
        const handler = () => setVisible(v => {
            const next = !v;
            localStorage.setItem(VISIBILITY_KEY, String(next));
            return next;
        });
        window.addEventListener('hotbar:toggle', handler);
        return () => window.removeEventListener('hotbar:toggle', handler);
    }, []);

    if (!visible) return null;

    const hasAnyItem = slots.some(s => s.item_base_id !== null);
    if (!hasAnyItem) return null;

    return (
        <div className="flex items-center justify-center gap-1.5 py-2">
            { slots.map((slot, i) => {
                const filled = slot.item_base_id !== null;
                const count = filled && slot.sprite_id ? (inventoryCounts.get(slot.sprite_id) ?? 0) : 0;
                const hovered = hoveredSlot === i;

                return (
                    <TooltipProvider key={ i }>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={ `relative w-11 h-11 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-150
                                        ${ filled
                                            ? hovered ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/50 bg-card/80'
                                            : 'border-dashed border-border/30 bg-muted/10' }` }
                                    onMouseEnter={ () => setHoveredSlot(i) }
                                    onMouseLeave={ () => setHoveredSlot(null) }
                                    onClick={ () => filled && handleSlotClick(slot, count) }
                                >
                                    <span className="absolute top-0.5 left-1 text-[8px] font-semibold text-muted-foreground/30 pointer-events-none">{ i + 1 }</span>
                                    { filled && slot.item_name && (
                                        <img
                                            src={ getFurniIcon(slot.item_name) }
                                            alt={ slot.public_name || '' }
                                            className="w-7 h-7 object-contain"
                                            style={{ imageRendering: 'pixelated', ...(count === 0 ? { opacity: 0.3, filter: 'grayscale(100%)' } : {}) }}
                                            onError={ e => { (e.target as HTMLImageElement).style.opacity = '0.3'; } }
                                        />
                                    ) }
                                    { filled && count === 0 && <span className="absolute text-lg pointer-events-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>🛒</span> }
                                    { filled && count > 0 && <span className="absolute bottom-0 right-1 text-[8px] font-bold text-foreground/50 tabular-nums pointer-events-none">{ count }</span> }
                                    { filled && hovered && (
                                        <button
                                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center cursor-pointer"
                                            onClick={ e => { e.stopPropagation(); clearSlot(i); } }
                                        >×</button>
                                    ) }
                                </div>
                            </TooltipTrigger>
                            { filled && (
                                <TooltipContent side="top" sideOffset={ 4 }>
                                    <span className="text-xs">{ slot.public_name } ({ count > 0 ? `${count}×` : 'Im Shop kaufen' })</span>
                                </TooltipContent>
                            ) }
                        </Tooltip>
                    </TooltipProvider>
                );
            }) }
        </div>
    );
}
