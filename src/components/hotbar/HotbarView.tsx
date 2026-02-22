import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, attemptItemPlacement } from '../../api';
import { useInventoryFurni } from '../../hooks';

interface HotbarSlot {
    item_base_id: number | null;
    public_name: string | null;
    item_name: string | null;
    sprite_id: number | null;
}

const STORAGE_KEY = 'habbo_hotbar';
const VISIBILITY_KEY = 'habbo_hotbar_visible';
const SLOT_COUNT = 9;
const BAR_WIDTH = 520;
const GAP = 3;
const SLOT_SIZE = Math.floor((BAR_WIDTH - (SLOT_COUNT - 1) * GAP) / SLOT_COUNT);

function emptySlots(): HotbarSlot[] {
    return Array.from({ length: SLOT_COUNT }, () => ({ item_base_id: null, public_name: null, item_name: null, sprite_id: null }));
}

function loadSlots(): HotbarSlot[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptySlots();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return emptySlots();
        // Migrate from old 8-slot to 9-slot
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

    // Map sprite_id → inventory count
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
            // 0 items → open catalog for this item
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: GAP, width: BAR_WIDTH, margin: '0 auto 4px auto' }}>
            {slots.map((slot, i) => {
                const hovered = hoveredSlot === i;
                const filled = slot.item_base_id !== null;
                const count = filled && slot.sprite_id ? (inventoryCounts.get(slot.sprite_id) ?? 0) : 0;

                return (
                    <div
                        key={i}
                        style={{
                            width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 6,
                            background: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                            border: hovered ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative', transition: 'background 0.15s, border-color 0.15s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={() => setHoveredSlot(i)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={() => filled && handleSlotClick(slot, count)}
                        title={filled ? (count > 0 ? `${slot.public_name} (${count}x)` : `${slot.public_name} – Im Shop kaufen`) : `Slot ${i + 1} (leer)`}
                    >
                        <span style={{ position: 'absolute', top: 1, left: 3, fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, pointerEvents: 'none' }}>
                            {i + 1}
                        </span>
                        {filled && slot.item_name && (
                            <img
                                src={getFurniIcon(slot.item_name)}
                                alt={slot.public_name || ''}
                                style={{
                                    width: 34, height: 34, objectFit: 'contain', imageRendering: 'pixelated',
                                    ...(count === 0 ? { opacity: 0.3, filter: 'grayscale(100%)' } : {}),
                                }}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                            />
                        )}
                        {filled && count === 0 && (
                            <span style={{
                                position: 'absolute', fontSize: 18, pointerEvents: 'none',
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                            }}>
                                🛒
                            </span>
                        )}
                        {filled && count > 0 && (
                            <span style={{
                                position: 'absolute', bottom: 1, right: 3,
                                fontSize: 10, fontWeight: 700,
                                color: 'rgba(255,255,255,0.8)',
                                pointerEvents: 'none',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}>
                                {count}
                            </span>
                        )}
                        {filled && hovered && (
                            <button
                                style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: 14, height: 14, borderRadius: 9999,
                                    background: 'rgba(220,38,38,0.8)', color: '#fff',
                                    fontSize: 9, fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', border: 'none', lineHeight: 1, padding: 0,
                                }}
                                onClick={(e) => { e.stopPropagation(); clearSlot(i); }}
                            >×</button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
