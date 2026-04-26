import { BadgePointLimitsEvent, ILinkEventTracker, IRoomSession, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomPreviewer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { ComponentType, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, Bot, Check, PawPrint, Plus, Sofa, X } from 'lucide-react';
import { AddEventLinkTracker, GetLocalization, GetRoomEngine, isObjectMoverRequested, LocalizeText, RemoveLinkEventTracker, setObjectMoverRequested, UnseenItemCategory } from '../../api';
import { DraggableWindow, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useInventoryFurni, useInventoryTrade, useInventoryUnseenTracker, useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { useInventoryCategories } from '../../hooks/inventory/useInventoryCategories';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { cn } from '@/align-ui/utils/cn';
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

const TAB_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    [TAB_FURNITURE]: Sofa,
    [TAB_BOTS]: Bot,
    [TAB_PETS]: PawPrint,
    [TAB_BADGES]: Award,
};

const TAB_LABELS: Record<string, string> = {
    [TAB_FURNITURE]: 'Möbel',
    [TAB_BOTS]: 'Bots',
    [TAB_PETS]: 'Haustiere',
    [TAB_BADGES]: 'Abzeichen',
};

const CAT_COLORS = [
    'hsl(var(--align-information-base))',
    'hsl(var(--align-away-base))',
    'hsl(var(--align-success-base))',
    'hsl(var(--align-feature-base))',
    'hsl(var(--align-error-base))',
    'hsl(var(--align-warning-base))',
    'hsl(var(--align-verified-base))',
    'hsl(var(--align-highlighted-base))',
];

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
    const [ newCatColor, setNewCatColor ] = useState(CAT_COLORS[0]);

    const handleCreateCategory = useCallback(() =>
    {
        if(!newCatName.trim()) return;
        createCategory(newCatName.trim(), newCatColor);
        setNewCatName('');
        setNewCatColor(CAT_COLORS[0]);
        setCreatingCategory(false);
    }, [ newCatName, newCatColor, createCategory ]);

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

    return (
        <DraggableWindow uniqueKey="inventory" handleSelector=".inv-drag-handle">
            <AlignSurface.Panel
                className="nitro-inventory relative flex flex-col overflow-hidden rounded-2xl"
                style={ { width: size.w, height: size.h } }
            >
                { /* Header */ }
                <div className="inv-drag-handle flex shrink-0 cursor-grab select-none items-center gap-2 px-3 py-2 active:cursor-grabbing">
                    <Sofa className="size-4 shrink-0 text-text-sub-600" />
                    <span className="text-label-sm font-semibold text-text-strong-950">Inventar</span>
                    <AlignBadge.Root color="gray" variant="lighter" size="small" className="ml-1 h-5">
                        { totalItems } Möbel
                    </AlignBadge.Root>
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="ml-auto size-7 px-0"
                        onClick={ onClose }
                    >
                        <X className="size-4" />
                    </AlignButton.Root>
                </div>
                <AlignDivider.Root />

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    { /* Sidebar */ }
                    <div className="flex w-[140px] shrink-0 flex-col overflow-y-auto border-r border-stroke-soft-200 bg-bg-weak-50">
                        <div className="flex flex-col gap-0.5 p-1.5">
                            { TABS.map((name, index) =>
                            {
                                const Icon = TAB_ICONS[name];
                                const unseenCount = getCount(UNSEEN_CATEGORIES[index]);
                                const isActive = currentTab === name;
                                return (
                                    <button
                                        key={ index }
                                        type="button"
                                        className={ cn(
                                            'flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-left text-paragraph-xs font-medium transition duration-200 ease-out',
                                            isActive
                                                ? 'border-l-primary-base bg-primary-alpha-10 font-semibold text-primary-base'
                                                : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950',
                                        ) }
                                        onClick={ () => setCurrentTab(name) }
                                    >
                                        <Icon className={ cn('size-3.5 shrink-0', isActive ? 'text-primary-base' : 'text-text-soft-400') } />
                                        <span className="flex-1 truncate">{ TAB_LABELS[name] }</span>
                                        { unseenCount > 0 && (
                                            <AlignBadge.Root color="red" variant="filled" size="small" className="h-4 min-w-4 px-1 text-[9px]">
                                                { unseenCount }
                                            </AlignBadge.Root>
                                        ) }
                                    </button>
                                );
                            }) }
                        </div>

                        { /* Categories (only for furniture tab) */ }
                        { currentTab === TAB_FURNITURE && categories.length > 0 && (
                            <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
                                <div className="my-1 px-1">
                                    <AlignDivider.Root />
                                </div>
                                <button
                                    type="button"
                                    className={ cn(
                                        'flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-left text-paragraph-xs font-medium transition duration-200 ease-out',
                                        activeCategory === null
                                            ? 'border-l-primary-base bg-primary-alpha-10 font-semibold text-primary-base'
                                            : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950',
                                    ) }
                                    onClick={ () => setActiveCategory(null) }
                                >
                                    <span className="size-2 shrink-0 rounded-full bg-faded-base" />
                                    <span className="flex-1 truncate">Alle</span>
                                    <span className="text-[10px] tabular-nums text-text-soft-400">{ groupItems.length }</span>
                                </button>
                                { categories.map(cat =>
                                {
                                    const isActive = activeCategory === cat.id;
                                    return (
                                        <button
                                            key={ cat.id }
                                            type="button"
                                            className={ cn(
                                                'flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-left text-paragraph-xs font-medium transition duration-200 ease-out',
                                                isActive
                                                    ? 'border-l-primary-base bg-primary-alpha-10 font-semibold text-primary-base'
                                                    : 'text-text-sub-600 hover:bg-bg-white-0 hover:text-text-strong-950',
                                            ) }
                                            onClick={ () => setActiveCategory(isActive ? null : cat.id) }
                                        >
                                            <span className="size-2 shrink-0 rounded-full" style={ { backgroundColor: cat.color } } />
                                            <span className="flex-1 truncate">{ cat.name }</span>
                                        </button>
                                    );
                                }) }
                                <div className="my-1 px-1">
                                    <AlignDivider.Root />
                                </div>
                                { creatingCategory ? (
                                    <div className="flex flex-col gap-1.5 px-1 py-1">
                                        <AlignInput.Root size="xsmall">
                                            <AlignInput.Wrapper className="h-7">
                                                <AlignInput.Input
                                                    className="h-7 text-[11px]"
                                                    placeholder="Name..."
                                                    value={ newCatName }
                                                    onChange={ e => setNewCatName(e.target.value) }
                                                    autoFocus
                                                    onKeyDown={ e =>
                                                    {
                                                        if(e.key === 'Enter') handleCreateCategory();
                                                        if(e.key === 'Escape') setCreatingCategory(false);
                                                    } }
                                                />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                        <div className="flex flex-wrap items-center gap-1">
                                            { CAT_COLORS.map(c => (
                                                <button
                                                    key={ c }
                                                    type="button"
                                                    className={ cn(
                                                        'size-3.5 rounded-full border-2 transition-transform',
                                                        newCatColor === c ? 'scale-110 border-stroke-strong-950' : 'border-transparent hover:border-stroke-sub-300',
                                                    ) }
                                                    style={ { backgroundColor: c } }
                                                    onClick={ () => setNewCatColor(c) }
                                                />
                                            )) }
                                        </div>
                                        <div className="flex gap-1">
                                            <AlignButton.Root
                                                type="button"
                                                variant="primary"
                                                mode="filled"
                                                size="xxsmall"
                                                className="h-6 flex-1 gap-1 text-[10px]"
                                                onClick={ handleCreateCategory }
                                            >
                                                <Check className="size-2.5" />
                                                OK
                                            </AlignButton.Root>
                                            <AlignButton.Root
                                                type="button"
                                                variant="neutral"
                                                mode="stroke"
                                                size="xxsmall"
                                                className="size-6 px-0"
                                                onClick={ () => setCreatingCategory(false) }
                                            >
                                                <X className="size-2.5" />
                                            </AlignButton.Root>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-left text-paragraph-xs text-text-soft-400 transition-colors hover:bg-bg-white-0 hover:text-text-sub-600"
                                        onClick={ () => setCreatingCategory(true) }
                                    >
                                        <Plus className="size-3 shrink-0" />
                                        <span className="flex-1 truncate">Erstellen</span>
                                    </button>
                                ) }
                            </div>
                        ) }
                    </div>

                    { /* Content */ }
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg-white-0">
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

                { /* Resize Handle */ }
                <div
                    className="absolute bottom-0 right-0 z-20 flex size-4 cursor-nwse-resize items-end justify-end p-0.5 text-text-soft-400 transition-colors hover:text-text-sub-600"
                    onPointerDown={ onResizeStart }
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </svg>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
