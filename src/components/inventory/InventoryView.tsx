import { BadgePointLimitsEvent, ILinkEventTracker, IRoomSession, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomPreviewer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaBox, FaRobot, FaPaw, FaMedal, FaPlus, FaCheck } from 'react-icons/fa';
import { AddEventLinkTracker, GetConfiguration, GetLocalization, GetRoomEngine, isObjectMoverRequested, LocalizeText, RemoveLinkEventTracker, setObjectMoverRequested, UnseenItemCategory } from '../../api';
import { DraggableWindow, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useInventoryFurni, useInventoryTrade, useInventoryUnseenTracker, useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { useInventoryCategories } from '../../hooks/inventory/useInventoryCategories';
import { InventoryBadgeView } from './views/badge/InventoryBadgeView';
import { InventoryBotView } from './views/bot/InventoryBotView';
import { InventoryFurnitureView } from './views/furniture/InventoryFurnitureView';
import { InventoryTradeView } from './views/furniture/InventoryTradeView';
import { InventoryPetView } from './views/pet/InventoryPetView';

const TAB_FURNITURE: string = 'inventory.furni';
const TAB_BOTS: string = 'inventory.bots';
const TAB_PETS: string = 'inventory.furni.tab.pets';
const TAB_BADGES: string = 'inventory.badges';
const TABS = [ TAB_FURNITURE, TAB_BOTS, TAB_PETS, TAB_BADGES ];
const UNSEEN_CATEGORIES = [ UnseenItemCategory.FURNI, UnseenItemCategory.BOT, UnseenItemCategory.PET, UnseenItemCategory.BADGE ];

const TAB_ICONS: Record<string, FC<any>> = {
    [TAB_FURNITURE]: FaBox,
    [TAB_BOTS]: FaRobot,
    [TAB_PETS]: FaPaw,
    [TAB_BADGES]: FaMedal,
};

const TAB_LABELS: Record<string, string> = {
    [TAB_FURNITURE]: 'Möbel',
    [TAB_BOTS]: 'Bots',
    [TAB_PETS]: 'Haustiere',
    [TAB_BADGES]: 'Abzeichen',
};

export const InventoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>(TABS[0]);
    const [ roomSession, setRoomSession ] = useState<IRoomSession>(null);
    const [ roomPreviewer, setRoomPreviewer ] = useState<RoomPreviewer>(null);
    const { isTrading = false, stopTrading = null } = useInventoryTrade();
    const { getCount = null } = useInventoryUnseenTracker();
    const { groupItems = [] } = useInventoryFurni();
    const { categories, activeCategory, setActiveCategory, createCategory } = useInventoryCategories();

    const totalItems = useMemo(() => groupItems.reduce((s, g) => s + g.getUnlockedCount(), 0), [ groupItems ]);

    // Resize
    const MIN_W = 500, MIN_H = 400, MAX_W = 900, MAX_H = 700;
    const [ size, setSize ] = useState({ w: 620, h: 520 });
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    useEffect(() =>
    {
        const onMove = (e: PointerEvent) =>
        {
            if(!resizeRef.current) return;
            const dw = e.clientX - resizeRef.current.startX;
            const dh = e.clientY - resizeRef.current.startY;
            setSize({
                w: Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.startW + dw)),
                h: Math.min(MAX_H, Math.max(MIN_H, resizeRef.current.startH + dh)),
            });
        };
        const onUp = () => { resizeRef.current = null; };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, []);

    const onResizeStart = useCallback((e: React.PointerEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    }, [ size ]);

    // Category create inline
    const [ creatingCategory, setCreatingCategory ] = useState(false);
    const [ newCatName, setNewCatName ] = useState('');
    const CAT_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ef4444', '#f97316', '#06b6d4', '#ec4899'];
    const [ newCatColor, setNewCatColor ] = useState(CAT_COLORS[0]);

    const handleCreateCategory = useCallback(() =>
    {
        if(!newCatName.trim()) return;
        createCategory(newCatName.trim(), newCatColor);
        setNewCatName('');
        setNewCatColor(CAT_COLORS[0]);
        setCreatingCategory(false);
    }, [ newCatName, newCatColor, createCategory ]);

    const ASSETS_URL = GetConfiguration<string>('asset.url', 'http://localhost:8080');

    // Hotbar
    interface HotbarSlot { item_base_id: number | null; public_name: string | null; item_name: string | null; sprite_id: number | null; }
    const EMPTY_SLOT: HotbarSlot = { item_base_id: null, public_name: null, item_name: null, sprite_id: null };

    const [ hotbarSlots, setHotbarSlots ] = useState<HotbarSlot[]>(() =>
    {
        try { const stored = JSON.parse(localStorage.getItem('habbo_hotbar') || '[]'); return Array.from({ length: 9 }, (_, i) => stored[i] || { ...EMPTY_SLOT }); }
        catch { return Array.from({ length: 9 }, () => ({ ...EMPTY_SLOT })); }
    });
    const [ hotbarHovered, setHotbarHovered ] = useState<number | null>(null);

    const saveHotbar = useCallback((slots: HotbarSlot[]) =>
    {
        setHotbarSlots(slots);
        localStorage.setItem('habbo_hotbar', JSON.stringify(slots));
    }, []);

    const removeHotbarSlot = useCallback((index: number) =>
    {
        const next = [ ...hotbarSlots ];
        next[index] = { ...EMPTY_SLOT };
        saveHotbar(next);
    }, [ hotbarSlots, saveHotbar ]);

    // Listen for hotbar:set-slot events from InventoryFurnitureView
    useEffect(() =>
    {
        const handler = (e: CustomEvent) =>
        {
            const { slot, ...data } = e.detail;
            const next = [ ...hotbarSlots ];
            const targetSlot = slot !== undefined ? slot : next.findIndex(s => !s || s.item_base_id === null);
            if(targetSlot >= 0 && targetSlot < 9)
            {
                next[targetSlot] = data;
                saveHotbar(next);
            }
        };
        window.addEventListener('hotbar:set-slot', handler as EventListener);
        return () => window.removeEventListener('hotbar:set-slot', handler as EventListener);
    }, [ hotbarSlots, saveHotbar ]);

    const getFurniIcon = (cn: string) => `${ ASSETS_URL }/c_images/${ cn.split('*')[0] }_icon.png`;

    const onClose = () =>
    {
        if(isTrading) stopTrading();
        setIsVisible(false);
    }

    useRoomEngineEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event =>
    {
        if(!isObjectMoverRequested()) return;
        setObjectMoverRequested(false);
        if(!event.placedInRoom) setIsVisible(true);
    });

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED
    ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setRoomSession(event.session);
                return;
            case RoomSessionEvent.ENDED:
                setRoomSession(null);
                setIsVisible(false);
                return;
        }
    });

    useMessageEvent<BadgePointLimitsEvent>(BadgePointLimitsEvent, event =>
    {
        const parser = event.getParser();
        for(const data of parser.data) GetLocalization().setBadgePointLimit(data.badgeId, data.limit);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(prev => !prev); return;
                }
            },
            eventUrlPrefix: 'inventory/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setRoomPreviewer(new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER));
        return () =>
        {
            setRoomPreviewer(prev => { prev.dispose(); return null; });
        }
    }, []);

    useEffect(() =>
    {
        if(!isVisible && isTrading) setIsVisible(true);
    }, [ isVisible, isTrading ]);

    if(!isVisible) return null;

    if(isTrading)
    {
        return (
            <NitroCardView uniqueKey={ 'inventory' } className="nitro-inventory" theme="primary-slim">
                <NitroCardHeaderView headerText={ LocalizeText('inventory.title') } onCloseClick={ onClose } />
                <NitroCardContentView>
                    <InventoryTradeView cancelTrade={ onClose } />
                </NitroCardContentView>
            </NitroCardView>
        );
    }

    const getCatCount = (catId: number) => groupItems.filter(g =>
    {
        const key = g.stuffData.uniqueNumber > 0 ? -(g.getLastItem()?.id || 0) : g.type;
        return true; // simplified — category filtering is in useInventoryCategories
    }).length;

    return (
        <DraggableWindow uniqueKey="inventory" handleSelector=".inv-title-bar">
            <div className="nitro-inventory inv-container" style={{ width: size.w, height: size.h }}>
                {/* Title bar */}
                <div className="inv-title-bar drag-handler">
                    <div className="inv-title-left">
                        <FaBox className="inv-title-icon" />
                        <span className="inv-title-text">Inventar</span>
                        <span className="inv-title-count">{ totalItems } Möbel</span>
                    </div>
                    <button className="inv-title-close" onClick={ onClose }>
                        <FaTimes />
                    </button>
                </div>

                <div className="inv-main">
                    {/* Sidebar */}
                    <div className="inv-sidebar">
                        <div className="inv-sidebar-section">
                            { TABS.map((name, index) =>
                            {
                                const Icon = TAB_ICONS[name];
                                const unseenCount = getCount(UNSEEN_CATEGORIES[index]);
                                return (
                                    <div key={ index } className={ 'inv-sidebar-item' + (currentTab === name ? ' active' : '') } onClick={ () => setCurrentTab(name) }>
                                        <Icon className="inv-sidebar-icon" />
                                        <span className="inv-sidebar-label">{ TAB_LABELS[name] }</span>
                                        { unseenCount > 0 && <span className="inv-sidebar-badge">{ unseenCount }</span> }
                                    </div>
                                );
                            }) }
                        </div>

                        {/* Categories (only for furniture tab) */}
                        { currentTab === TAB_FURNITURE && categories.length > 0 && (
                            <div className="inv-sidebar-categories">
                                <div className="inv-sidebar-divider" />
                                <div className={ 'inv-sidebar-item' + (activeCategory === null ? ' active' : '') } onClick={ () => setActiveCategory(null) }>
                                    <span className="inv-cat-dot" style={{ background: '#6b7280' }} />
                                    <span className="inv-sidebar-label">Alle</span>
                                    <span className="inv-sidebar-count">{ groupItems.length }</span>
                                </div>
                                { categories.map(cat => (
                                    <div key={ cat.id } className={ 'inv-sidebar-item' + (activeCategory === cat.id ? ' active' : '') } onClick={ () => setActiveCategory(activeCategory === cat.id ? null : cat.id) }>
                                        <span className="inv-cat-dot" style={{ background: cat.color }} />
                                        <span className="inv-sidebar-label">{ cat.name }</span>
                                    </div>
                                )) }
                                <div className="inv-sidebar-divider" />
                                { creatingCategory ? (
                                    <div className="inv-create-form">
                                        <input
                                            className="inv-create-input"
                                            placeholder="Name..."
                                            value={ newCatName }
                                            onChange={ e => setNewCatName(e.target.value) }
                                            autoFocus
                                            onKeyDown={ e => { if(e.key === 'Enter') handleCreateCategory(); if(e.key === 'Escape') setCreatingCategory(false); } }
                                        />
                                        <div className="inv-create-colors">
                                            { CAT_COLORS.map(c => (
                                                <button
                                                    key={ c }
                                                    className={ 'inv-color-swatch' + (newCatColor === c ? ' active' : '') }
                                                    style={{ backgroundColor: c }}
                                                    onClick={ () => setNewCatColor(c) }
                                                />
                                            )) }
                                        </div>
                                        <div className="inv-create-actions">
                                            <button className="inv-create-ok" onClick={ handleCreateCategory }>
                                                <FaCheck style={{ fontSize: 8 }} /> OK
                                            </button>
                                            <button className="inv-create-cancel" onClick={ () => setCreatingCategory(false) }>
                                                <FaTimes style={{ fontSize: 8 }} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="inv-sidebar-item inv-sidebar-create" onClick={ () => setCreatingCategory(true) }>
                                        <FaPlus style={{ fontSize: 10, opacity: 0.4 }} />
                                        <span className="inv-sidebar-label">Erstellen</span>
                                    </div>
                                ) }
                            </div>
                        ) }
                    </div>

                    {/* Content */}
                    <div className="inv-content">
                        { currentTab === TAB_FURNITURE &&
                            <InventoryFurnitureView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                        { currentTab === TAB_BOTS &&
                            <InventoryBotView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                        { currentTab === TAB_PETS &&
                            <InventoryPetView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                        { currentTab === TAB_BADGES &&
                            <InventoryBadgeView /> }
                    </div>
                </div>

                {/* Hotbar */}
                <div className="inv-hotbar">
                    { hotbarSlots.map((slot, i) =>
                    {
                        const filled = slot && slot.item_base_id !== null;
                        return (
                            <div
                                key={ i }
                                className={ 'inv-hotbar-slot' + (filled ? ' filled' : ' empty') }
                                onMouseEnter={ () => setHotbarHovered(i) }
                                onMouseLeave={ () => setHotbarHovered(null) }
                                title={ filled ? `${ slot.public_name }` : `Slot ${ i + 1 }` }
                            >
                                <span className="inv-hotbar-number">{ i + 1 }</span>
                                { filled && slot.item_name && (
                                    <img
                                        className="inv-hotbar-icon"
                                        src={ getFurniIcon(slot.item_name) }
                                        alt=""
                                        onError={ e => { (e.target as HTMLImageElement).style.opacity = '0.2'; } }
                                    />
                                ) }
                                { filled && hotbarHovered === i && (
                                    <button className="inv-hotbar-remove" onClick={ e => { e.stopPropagation(); removeHotbarSlot(i); } }>×</button>
                                ) }
                            </div>
                        );
                    }) }
                </div>

                {/* Resize Handle */}
                <div className="inv-resize-handle" onPointerDown={ onResizeStart }>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </svg>
                </div>
            </div>
        </DraggableWindow>
    );
}
