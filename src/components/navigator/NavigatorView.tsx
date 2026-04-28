import { ConvertGlobalRoomIdMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RoomDataParser, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { List, Rows3 } from 'lucide-react';
import { AddEventLinkTracker, GetSessionDataManager, RemoveLinkEventTracker, SendMessageComposer, TryVisitRoom } from '../../api';
import { useNavigator, useRoomSessionManagerEvent, useSpotlight } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignSegmented from '@/align-ui/components/ui/segmented-control';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTabMenu from '@/align-ui/components/ui/tab-menu-horizontal';
import { cn } from '@/align-ui/utils/cn';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import {
    NavCloseIcon,
    NavPlusIcon,
    NavRefreshIcon,
    NavigatorScrollViewport,
    PixelIcon,
} from './views/NavigatorPrimitives';

import { NavigatorOfficialBanners } from './views/search/NavigatorOfficialBanners';
import { NavigatorResultSkeleton } from './views/search/NavigatorResultSkeleton';
import { NavigatorDensity, NavigatorSearchResultItemView } from './views/search/NavigatorSearchResultItemView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';
import { NavigatorTagChips } from './views/search/NavigatorTagChips';
import { useNavigatorPinnedRooms, useNavigatorRecentRooms } from './views/search/useNavigatorRoomLists';
import { useTrendingDelta } from './views/search/useTrendingDelta';
import { applyGermanNavigatorLocale } from './NavigatorLocaleDE';

const NAVIGATOR_AUTO_REFRESH_MS = 20_000;
const HOTEL_COUNT_REFRESH_MS = 30_000;

type TabId = 'all' | 'mine' | 'rp' | 'official';

const NAVIGATOR_TAB_STORAGE_KEY = 'nitro.navigator.tab';

const isValidTabId = (value: string | null): value is TabId =>
    value === 'all' || value === 'mine' || value === 'rp' || value === 'official';

interface OnlineCountResponse
{
    count?: number;
}

export const NavigatorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState(false);
    const [ isCreatorOpen, setCreatorOpen ] = useState(false);
    const [ isRoomInfoOpen, setRoomInfoOpen ] = useState(false);
    const [ roomSettingsRequest, setRoomSettingsRequest ] = useState(0);
    const [ isRoomLinkOpen, setRoomLinkOpen ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ needsInit, setNeedsInit ] = useState(true);
    const [ needsSearch, setNeedsSearch ] = useState(false);
    const [ density, setDensity ] = useState<NavigatorDensity>(() =>
    {
        try
        {
            const v = localStorage.getItem('nitro.navigator.density');
            return (v === 'cozy' || v === 'compact') ? v : 'compact';
        }
        catch { return 'compact'; }
    });
    const [ activeTag, setActiveTag ] = useState<string | null>(null);
    const [ hotelOnline, setHotelOnline ] = useState<number | null>(null);
    const [ currentTab, setCurrentTab ] = useState<TabId>(() =>
    {
        try
        {
            const stored = localStorage.getItem(NAVIGATOR_TAB_STORAGE_KEY);
            return isValidTabId(stored) ? stored : 'all';
        }
        catch { return 'all'; }
    });
    const { searchResult = null, topLevelContext = null, navigatorData = null } = useNavigator();
    const { isSpotlight, ids: spotlightIds } = useSpotlight();
    const { pinnedIds, togglePinned, isPinned } = useNavigatorPinnedRooms();
    const { recentIds, recordVisit } = useNavigatorRecentRooms();
    const pendingSearch = useRef<{ value: string, code: string }>(null);

    // Stabile refs für linkReceived-Callback.
    const isVisibleRef = useRef(isVisible);
    const navigatorDataRef = useRef(navigatorData);
    useEffect(() => { isVisibleRef.current = isVisible; }, [ isVisible ]);
    useEffect(() => { navigatorDataRef.current = navigatorData; }, [ navigatorData ]);

    useEffect(() =>
    {
        try { localStorage.setItem('nitro.navigator.density', density); } catch { /* noop */ }
    }, [ density ]);

    useEffect(() =>
    {
        try { localStorage.setItem(NAVIGATOR_TAB_STORAGE_KEY, currentTab); } catch { /* noop */ }
    }, [ currentTab ]);

    // Map currentTab → server search arguments
    const tabToSearchArgs = useCallback((tab: TabId): { value: string, code: string } =>
    {
        switch(tab)
        {
            case 'mine': return { value: '', code: 'myworld_view' };
            case 'rp': return { value: 'tag:rp', code: 'hotel_view' };
            case 'official': return { value: '', code: 'official_view' };
            case 'all':
            default: return { value: '', code: 'hotel_view' };
        }
    }, []);

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
        const session = event.session;
        if(session && session.roomId) recordVisit(session.roomId);
        setIsVisible(false);
        setCreatorOpen(false);
    });

    const sendSearch = useCallback((searchValue: string, contextCode: string) =>
    {
        setCreatorOpen(false);
        SendMessageComposer(new NavigatorSearchComposer(contextCode, searchValue));
        setIsLoading(true);
    }, []);

    const reloadCurrentSearch = useCallback(() =>
    {
        if(!isReady)
        {
            setNeedsSearch(true);
            return;
        }

        if(pendingSearch.current)
        {
            sendSearch(pendingSearch.current.value, pendingSearch.current.code);
            pendingSearch.current = null;
            return;
        }

        // Use the user's persisted/active tab as the source of truth
        const args = tabToSearchArgs(currentTab);
        sendSearch(args.value, args.code);
    }, [ isReady, currentTab, tabToSearchArgs, sendSearch ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(isVisibleRef.current)
                        {
                            setIsVisible(false);
                            return;
                        }
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    case 'toggle-room-info':
                        setRoomInfoOpen(value => !value);
                        return;
                    case 'open-room-info':
                        setRoomInfoOpen(true);
                        return;
                    case 'open-room-settings':
                        setRoomInfoOpen(true);
                        setRoomSettingsRequest(value => value + 1);
                        return;
                    case 'toggle-room-link':
                        setRoomLinkOpen(value => !value);
                        return;
                    case 'goto':
                        if(parts.length <= 2) return;
                        switch(parts[2])
                        {
                            case 'home':
                                if(!navigatorDataRef.current || navigatorDataRef.current.homeRoomId <= 0) return;
                                TryVisitRoom(navigatorDataRef.current.homeRoomId);
                                break;
                            default:
                                TryVisitRoom(parseInt(parts[2]));
                        }
                        return;
                    case 'create':
                        setIsVisible(true);
                        setCreatorOpen(true);
                        return;
                    case 'search':
                        if(parts.length > 2)
                        {
                            const topLevelContextCode = parts[2];
                            let searchValue = '';
                            if(parts.length > 3) searchValue = parts[3];
                            pendingSearch.current = { value: searchValue, code: topLevelContextCode };
                            setIsVisible(true);
                            setNeedsSearch(true);
                        }
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!searchResult) return;
        setIsLoading(false);
    }, [ searchResult ]);

    useEffect(() =>
    {
        if(!isVisible || !isReady || !needsSearch) return;
        reloadCurrentSearch();
        setNeedsSearch(false);
    }, [ isVisible, isReady, needsSearch, reloadCurrentSearch ]);

    useEffect(() =>
    {
        if(isReady || !topLevelContext) return;
        setIsReady(true);
    }, [ isReady, topLevelContext ]);

    useEffect(() =>
    {
        if(!isVisible || !needsInit) return;
        SendMessageComposer(new NavigatorInitComposer());
        setNeedsInit(false);
    }, [ isVisible, needsInit ]);

    useEffect(() =>
    {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string, _arg_2: boolean = false, _arg_3: string = null) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    useEffect(() =>
    {
        applyGermanNavigatorLocale();
    }, []);

    useEffect(() =>
    {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '440px' : '0px');
        return () =>
        {
            document.documentElement.style.setProperty('--drawer-width', '0px');
        };
    }, [ isVisible ]);

    // Hotel online count (inline in header)
    useEffect(() =>
    {
        if(!isVisible) return;

        let cancelled = false;
        const baseUrl = (typeof window !== 'undefined' && window.location.hostname.includes('bahhos.de'))
            ? 'https://www.bahhos.de'
            : '';
        const url = baseUrl ? `${ baseUrl }/api/online-count` : '/api/online-count';

        const fetchCount = async () =>
        {
            try
            {
                const res = await fetch(url, { credentials: 'omit' });
                if(!res.ok) return;
                const data = (await res.json()) as OnlineCountResponse;
                if(cancelled) return;
                if(typeof data.count === 'number') setHotelOnline(data.count);
            }
            catch { /* noop */ }
        };

        fetchCount();
        const interval = window.setInterval(fetchCount, HOTEL_COUNT_REFRESH_MS);

        return () =>
        {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [ isVisible ]);

    // Auto-refresh search results every 20s while drawer is visible
    useEffect(() =>
    {
        if(!isVisible || !isReady) return;
        const interval = window.setInterval(() => reloadCurrentSearch(), NAVIGATOR_AUTO_REFRESH_MS);
        return () => window.clearInterval(interval);
    }, [ isVisible, isReady, reloadCurrentSearch ]);

    const dedupedRooms = useMemo(() =>
    {
        if(!searchResult || !searchResult.results) return [];

        const seen = new Set<number>();
        const rooms: RoomDataParser[] = [];

        for(const resultList of searchResult.results)
        {
            for(const room of resultList.rooms)
            {
                if(!seen.has(room.roomId))
                {
                    seen.add(room.roomId);
                    rooms.push(room);
                }
            }
        }

        return rooms;
    }, [ searchResult ]);

    // Extract roomIds the current user has rights to from `with_rights` result list
    const rightsIds = useMemo(() =>
    {
        const ids = new Set<number>();
        if(!searchResult || !searchResult.results) return ids;
        for(const resultList of searchResult.results)
        {
            if(resultList.code !== 'with_rights') continue;
            for(const room of resultList.rooms) ids.add(room.roomId);
        }
        return ids;
    }, [ searchResult ]);

    // Apply mine-filter (own rooms + rooms with rights) on the Mine tab
    const tabFilteredRooms = useMemo(() =>
    {
        if(currentTab !== 'mine') return dedupedRooms;
        const meId = GetSessionDataManager()?.userId ?? -1;
        return dedupedRooms.filter(room => room.ownerId === meId || rightsIds.has(room.roomId));
    }, [ dedupedRooms, currentTab, rightsIds ]);

    const filteredRooms = useMemo(() =>
    {
        if(!activeTag) return tabFilteredRooms;
        const tag = activeTag.toLowerCase();
        return tabFilteredRooms.filter(room =>
        {
            if(!room.tags || room.tags.length === 0) return false;
            return room.tags.some(t => t.toLowerCase() === tag);
        });
    }, [ tabFilteredRooms, activeTag ]);

    const { deltas, trendingRooms } = useTrendingDelta(filteredRooms);

    const sectionedRooms = useMemo(() =>
    {
        const pinnedRooms: RoomDataParser[] = [];
        const recentRooms: RoomDataParser[] = [];
        const spotlightRooms: RoomDataParser[] = [];
        const activeRooms: RoomDataParser[] = [];
        const emptyRooms: RoomDataParser[] = [];
        const consumed = new Set<number>();

        const pinnedSet = new Set(pinnedIds);
        const recentSet = new Set(recentIds);

        for(const room of filteredRooms)
        {
            if(pinnedSet.has(room.roomId))
            {
                pinnedRooms.push(room);
                consumed.add(room.roomId);
            }
        }

        const recentMap = new Map<number, RoomDataParser>();
        for(const room of filteredRooms)
        {
            if(recentSet.has(room.roomId) && !consumed.has(room.roomId))
            {
                recentMap.set(room.roomId, room);
                consumed.add(room.roomId);
            }
        }
        for(const id of recentIds)
        {
            const room = recentMap.get(id);
            if(room) recentRooms.push(room);
        }

        for(const room of filteredRooms)
        {
            if(consumed.has(room.roomId)) continue;
            if(isSpotlight(room.roomId))
            {
                spotlightRooms.push(room);
                consumed.add(room.roomId);
            }
        }

        for(const room of filteredRooms)
        {
            if(consumed.has(room.roomId)) continue;
            if(room.userCount > 0) activeRooms.push(room);
            else emptyRooms.push(room);
        }

        activeRooms.sort((a, b) => b.userCount - a.userCount);

        const totalActiveUsers = activeRooms.reduce((sum, r) => sum + r.userCount, 0)
            + pinnedRooms.reduce((sum, r) => sum + r.userCount, 0)
            + recentRooms.reduce((sum, r) => sum + r.userCount, 0);

        return { pinnedRooms, recentRooms, spotlightRooms, activeRooms, emptyRooms, totalActiveUsers };
    }, [ filteredRooms, spotlightIds, pinnedIds, recentIds, isSpotlight ]);

    const totalRoomCount = sectionedRooms.pinnedRooms.length
        + sectionedRooms.recentRooms.length
        + sectionedRooms.spotlightRooms.length
        + sectionedRooms.activeRooms.length
        + sectionedRooms.emptyRooms.length;

    const handleTabClick = useCallback((tab: TabId) =>
    {
        setCurrentTab(tab);
        const args = tabToSearchArgs(tab);
        sendSearch(args.value, args.code);
    }, [ sendSearch, tabToSearchArgs ]);

    const handleTabValueChange = useCallback((value: string) =>
    {
        if(isValidTabId(value)) handleTabClick(value);
    }, [ handleTabClick ]);

    const showEmptyState = searchResult && (
        currentTab === 'official' ? filteredRooms.length === 0 : totalRoomCount === 0
    );

    const renderRows = (rooms: RoomDataParser[]) => (
        <div className="flex flex-col">
            { rooms.map(room => (
                <NavigatorSearchResultItemView
                    key={ room.roomId }
                    roomData={ room }
                    density={ density }
                    isPinned={ isPinned(room.roomId) }
                    onTogglePin={ togglePinned }
                    delta={ deltas.get(room.roomId) ?? 0 }
                />
            )) }
        </div>
    );

    return (
        <>
            <AlignDrawer.Root
                open={ isVisible }
                onOpenChange={ setIsVisible }
                modal={ false }
            >
                <AlignDrawer.Content
                    className="navigator-drawer w-[440px]"
                    onOpenAutoFocus={ event => event.preventDefault() }
                >
                    { /* Header — Title + Inline Stats + Density/Refresh/Close */ }
                    <AlignDrawer.Header className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                            <AlignDrawer.Title className="flex items-center gap-2 text-label-md text-text-strong-950">
                                Navigator
                                { totalRoomCount > 0 && (
                                    <AlignBadge.Root size="small" variant="lighter" color="gray" className="tabular-nums">
                                        { totalRoomCount }
                                    </AlignBadge.Root>
                                ) }
                            </AlignDrawer.Title>
                            <AlignDrawer.Description className="sr-only">Durchsuche und besuche Räume im Hotel</AlignDrawer.Description>

                            { /* Inline Stats */ }
                            <div className="ml-1 hidden items-center gap-1.5 text-paragraph-xs text-text-sub-600 sm:flex">
                                <AlignBadge.Root size="small" variant="lighter" color="green" className="h-4 gap-1 px-1.5 text-[10px] tabular-nums">
                                    <span className="size-1.5 rounded-full bg-success-base nav-pulse-dot" />
                                    { hotelOnline === null ? '—' : hotelOnline.toLocaleString('de-DE') }
                                </AlignBadge.Root>
                            </div>

                            <div className="ml-auto flex items-center gap-1">
                                <AlignSegmented.Root
                                    value={ density }
                                    onValueChange={ value => setDensity(value as NavigatorDensity) }
                                    aria-label="Dichte umschalten"
                                >
                                    <AlignSegmented.List className="w-auto">
                                        <AlignSegmented.Trigger value="compact" className="size-7 px-0" aria-label="Kompakt" title="Kompakt">
                                            <List className="size-3.5" />
                                        </AlignSegmented.Trigger>
                                        <AlignSegmented.Trigger value="cozy" className="size-7 px-0" aria-label="Cozy" title="Cozy">
                                            <Rows3 className="size-3.5" />
                                        </AlignSegmented.Trigger>
                                    </AlignSegmented.List>
                                </AlignSegmented.Root>
                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ reloadCurrentSearch } title="Aktualisieren">
                                    <AlignButton.Icon as={ NavRefreshIcon } className={ cn('size-3.5', isLoading && 'animate-spin') } />
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setIsVisible(false) } title="Schließen">
                                    <AlignButton.Icon as={ NavCloseIcon } className="size-4" />
                                </AlignButton.Root>
                            </div>
                        </div>
                    </AlignDrawer.Header>

                    { /* Tab Navigation */ }
                    <AlignTabMenu.Root value={ currentTab } onValueChange={ handleTabValueChange }>
                        <AlignTabMenu.List className="h-9 gap-0 border-b border-stroke-soft-200 px-5" wrapperClassName="grid">
                            <AlignTabMenu.Trigger value="all" className="flex-1 h-9 py-2">
                                <PixelIcon src="/toolbar-icons/joinroom.png" size="size-4" alt="Alle Räume" />
                                Alle Räume
                            </AlignTabMenu.Trigger>
                            <AlignTabMenu.Trigger value="mine" className="flex-1 h-9 py-2">
                                <PixelIcon src="/navigator/icons/house-small.png" size="size-4" alt="Meine" />
                                Meine
                            </AlignTabMenu.Trigger>
                            <AlignTabMenu.Trigger value="rp" className="flex-1 h-9 py-2">
                                <PixelIcon src="/navigator/icons/sign-soccer.png" size="size-4" alt="RP" />
                                RP
                            </AlignTabMenu.Trigger>
                            <AlignTabMenu.Trigger value="official" className="flex-1 h-9 py-2">
                                <PixelIcon src="/toolbar-icons/habbo.png" size="size-4" alt="Offiziell" />
                                Offiziell
                            </AlignTabMenu.Trigger>
                        </AlignTabMenu.List>
                    </AlignTabMenu.Root>

                    { /* Search */ }
                    <div className="px-5 py-2">
                        <NavigatorSearchView sendSearch={ sendSearch } />
                    </div>

                    { /* Tag-Chips — single line, horizontal scroll */ }
                    <div className="border-b border-stroke-soft-200 px-5 pb-2">
                        <NavigatorTagChips activeTag={ activeTag } onSelect={ setActiveTag } />
                    </div>

                    { /* Room List */ }
                    <AlignDrawer.Body className="p-0">
                        <TooltipPrimitive.Provider delayDuration={ 300 } skipDelayDuration={ 0 } disableHoverableContent>
                        <NavigatorScrollViewport className="h-full">
                            { isLoading && (
                                <NavigatorResultSkeleton density={ density } rows={ 10 } />
                            ) }

                            { !isLoading && showEmptyState && (
                                <NavigatorEmptyState
                                    activeTag={ activeTag }
                                    currentTab={ currentTab }
                                    hasSearchQuery={ !!(searchResult?.data) }
                                    onClearTag={ () => setActiveTag(null) }
                                    onReload={ reloadCurrentSearch }
                                />
                            ) }

                            { !isLoading && currentTab === 'official' && filteredRooms.length > 0 && (
                                <NavigatorOfficialBanners rooms={ filteredRooms } />
                            ) }

                            { !isLoading && currentTab !== 'official' && sectionedRooms.pinnedRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/sign-heart.png" size="size-3" alt="Favoriten" /> }
                                        label="Favoriten"
                                        count={ sectionedRooms.pinnedRooms.length }
                                    />
                                    { renderRows(sectionedRooms.pinnedRooms) }
                                </>
                            ) }

                            { !isLoading && currentTab !== 'official' && sectionedRooms.recentRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/chat-history.png" size="size-3" alt="Verlauf" /> }
                                        label="Zuletzt besucht"
                                        count={ sectionedRooms.recentRooms.length }
                                    />
                                    { renderRows(sectionedRooms.recentRooms) }
                                </>
                            ) }

                            { !isLoading && currentTab !== 'official' && trendingRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/sign-exclamation.png" size="size-3" alt="Trending" /> }
                                        label="Trending"
                                        count={ trendingRooms.length }
                                    />
                                    { renderRows(trendingRooms.slice(0, 6)) }
                                </>
                            ) }

                            { !isLoading && currentTab !== 'official' && sectionedRooms.spotlightRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/sign-yellow.png" size="size-3" alt="Spotlight" /> }
                                        label="Spotlight"
                                        count={ sectionedRooms.spotlightRooms.length }
                                    />
                                    { renderRows(sectionedRooms.spotlightRooms) }
                                </>
                            ) }

                            { !isLoading && currentTab !== 'official' && sectionedRooms.activeRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/small-room.png" size="size-4" alt="Aktiv" /> }
                                        label="Aktiv jetzt"
                                        count={ sectionedRooms.activeRooms.length }
                                        suffix={ `${ sectionedRooms.totalActiveUsers } online` }
                                    />
                                    { renderRows(sectionedRooms.activeRooms) }
                                </>
                            ) }

                            { !isLoading && currentTab !== 'official' && sectionedRooms.emptyRooms.length > 0 && (
                                <>
                                    <SectionDivider
                                        icon={ <PixelIcon src="/navigator/icons/room_group.png" size="size-4" alt="Weitere" /> }
                                        label="Weitere Räume"
                                        count={ sectionedRooms.emptyRooms.length }
                                    />
                                    { renderRows(sectionedRooms.emptyRooms) }
                                </>
                            ) }
                        </NavigatorScrollViewport>
                        </TooltipPrimitive.Provider>
                    </AlignDrawer.Body>

                    { /* Footer — Primary CTA */ }
                    <AlignDrawer.Footer className="border-t border-stroke-soft-200 px-5 py-2.5">
                        <AlignButton.Root type="button" variant="primary" mode="filled" size="medium" className="w-full gap-2" onClick={ () => setCreatorOpen(true) }>
                            <AlignButton.Icon as={ NavPlusIcon } className="size-4" />
                            Raum erstellen
                        </AlignButton.Root>
                    </AlignDrawer.Footer>

                    { /* Room Creator Overlay */ }
                    { isCreatorOpen && (
                        <div className="absolute inset-0 z-10 flex items-start justify-center bg-bg-white-0/90 px-3 pt-6 backdrop-blur-sm">
                            <AlignSurface.Panel className="flex h-full w-full flex-col overflow-hidden" style={ { maxHeight: '90%' } }>
                                <div className="flex h-11 shrink-0 items-center justify-between border-b border-stroke-soft-200 px-4">
                                    <span className="text-label-xs text-text-strong-950">Raum erstellen</span>
                                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setCreatorOpen(false) }>
                                        <AlignButton.Icon as={ NavCloseIcon } className="size-4" />
                                    </AlignButton.Root>
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <NavigatorRoomCreatorView />
                                </div>
                            </AlignSurface.Panel>
                        </div>
                    ) }
                </AlignDrawer.Content>
            </AlignDrawer.Root>
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => setRoomInfoOpen(false) } openSettingsRequest={ roomSettingsRequest } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => setRoomLinkOpen(false) } /> }

        </>
    );
}

// ── Section Divider — sticky compact (22px) ───────────────────────────────────
interface SectionDividerProps
{
    icon?: React.ReactNode;
    label: string;
    count?: number;
    suffix?: string;
}

const SectionDivider: FC<SectionDividerProps> = ({ icon, label, count, suffix }) => (
    <div className="sticky top-0 z-10 flex h-6 items-center gap-1.5 border-y border-stroke-soft-200 bg-bg-weak-50/95 px-5 text-[10px] font-semibold uppercase tracking-wider text-text-soft-400 backdrop-blur-sm">
        { icon }
        <span>{ label }</span>
        { typeof count === 'number' && (
            <span className="tabular-nums normal-case font-mono">· { count }</span>
        ) }
        { suffix && (
            <span className="ml-auto tabular-nums normal-case">{ suffix }</span>
        ) }
    </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────
interface NavigatorEmptyStateProps
{
    activeTag: string | null;
    currentTab: TabId;
    hasSearchQuery: boolean;
    onClearTag: () => void;
    onReload: () => void;
}

const NavigatorEmptyState: FC<NavigatorEmptyStateProps> = ({ activeTag, currentTab, hasSearchQuery, onClearTag, onReload }) =>
{
    let title = 'Keine Räume gefunden';
    let hint = 'Versuche es mit einer anderen Suche oder schau später wieder vorbei.';

    if(activeTag)
    {
        title = `Keine Räume mit #${ activeTag }`;
        hint = 'Versuche einen anderen Tag oder zeige alle Räume.';
    }
    else if(currentTab === 'mine')
    {
        title = 'Du hast noch keine Räume';
        hint = 'Erstelle deinen ersten Raum mit dem Button unten.';
    }
    else if(currentTab === 'rp')
    {
        title = 'Keine RP-Räume aktiv';
        hint = 'Aktuell läuft kein Roleplay — schau es dir später nochmal an.';
    }
    else if(currentTab === 'official')
    {
        title = 'Keine offiziellen Räume';
        hint = 'Aktuell sind keine offiziellen Räume verfügbar.';
    }
    else if(hasSearchQuery)
    {
        hint = 'Tipp: Suche nach einem Raumnamen, Owner oder Tag.';
    }

    // Tab-spezifische Empty-States nutzen das Habbo-Pixel info.png Icon.
    // Bei aktiver Suche bleibt das generische Search-Icon.
    const useInfoIcon = !hasSearchQuery && (currentTab === 'mine' || currentTab === 'rp' || currentTab === 'official');

    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="relative inline-flex size-14 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-bg-weak-50" />
                { useInfoIcon
                    ? <img src="/navigator/icons/info.png" alt="" className="relative size-6" style={ { imageRendering: 'pixelated' } } />
                    : <img src="/navigator/icons/zoom-more.png" alt="" className="relative size-6" style={ { imageRendering: 'pixelated' } } />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-label-md text-text-strong-950">{ title }</span>
                <span className="text-paragraph-xs text-text-soft-400">{ hint }</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
                { activeTag && (
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" onClick={ onClearTag }>
                        Tag entfernen
                    </AlignButton.Root>
                ) }
                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" onClick={ onReload }>
                    <AlignButton.Icon as={ NavRefreshIcon } />
                    Aktualisieren
                </AlignButton.Root>
            </div>
        </div>
    );
};
