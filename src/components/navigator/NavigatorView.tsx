import { ConvertGlobalRoomIdMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RoomDataParser, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { Drawer as DrawerPrimitive } from 'vaul';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TryVisitRoom } from '../../api';
import { useNavigator, useRoomSessionManagerEvent } from '../../hooks';
import { DrawerClose } from '../ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorSearchResultItemView } from './views/search/NavigatorSearchResultItemView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';
import { applyGermanNavigatorLocale } from './NavigatorLocaleDE';

export const NavigatorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState(false);
    const [ isCreatorOpen, setCreatorOpen ] = useState(false);
    const [ isRoomInfoOpen, setRoomInfoOpen ] = useState(false);
    const [ isRoomLinkOpen, setRoomLinkOpen ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ needsInit, setNeedsInit ] = useState(true);
    const [ needsSearch, setNeedsSearch ] = useState(false);
    const { searchResult = null, topLevelContext = null, topLevelContexts = null, navigatorData = null } = useNavigator();
    const pendingSearch = useRef<{ value: string, code: string }>(null);

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
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

        if(searchResult)
        {
            sendSearch(searchResult.data, searchResult.code);

            return;
        }

        if(!topLevelContext) return;

        sendSearch('', topLevelContext.code);
    }, [ isReady, searchResult, topLevelContext, sendSearch ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': {
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle': {
                        if(isVisible)
                        {
                            setIsVisible(false);

                            return;
                        }

                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'toggle-room-info':
                        setRoomInfoOpen(value => !value);
                        return;
                    case 'toggle-room-link':
                        setRoomLinkOpen(value => !value);
                        return;
                    case 'goto':
                        if(parts.length <= 2) return;

                        switch(parts[2])
                        {
                            case 'home':
                                if(navigatorData.homeRoomId <= 0) return;

                                TryVisitRoom(navigatorData.homeRoomId);
                                break;
                            default: {
                                const roomId = parseInt(parts[2]);

                                TryVisitRoom(roomId);
                            }
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
    }, [ isVisible, navigatorData ]);

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

    const activityStats = useMemo(() =>
    {
        let totalUsers = 0;
        let activeRooms = 0;

        for(const room of dedupedRooms)
        {
            totalUsers += room.userCount;
            if(room.userCount > 0) activeRooms++;
        }

        return { totalUsers, activeRooms };
    }, [ dedupedRooms ]);

    const isMyRoomsTab = topLevelContext?.code === 'myworld_view';

    return (
        <>
            <DrawerPrimitive.Root
                direction="right"
                open={ isVisible }
                onOpenChange={ setIsVisible }
                modal={ false }
            >
                <DrawerPrimitive.Portal>
                    { isVisible && <div className="fixed inset-0 z-[78]" onClick={ () => setIsVisible(false) } /> }
                    <DrawerPrimitive.Content
                        className="navigator-drawer fixed right-0 top-0 bottom-0 w-[400px] z-[79] flex flex-col rounded-l-2xl border border-white/[0.09] bg-[rgba(10,10,14,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden"
                        style={ { '--initial-transform': 'calc(100%)' } as React.CSSProperties }
                    >
                    { /* ── Header: Tabs + Actions ── */ }
                    <div className="flex items-center shrink-0 border-b border-white/[0.06]" style={ { height: 44 } }>
                        <button
                            className={ cn(
                                'h-full px-4 text-[11px] font-semibold transition-colors border-b-2 -mb-px',
                                !isMyRoomsTab
                                    ? 'text-white/90 border-white/50'
                                    : 'text-white/35 border-transparent hover:text-white/60'
                            ) }
                            onClick={ () => sendSearch('', 'hotel_view') }
                        >
                            Alle Räume
                        </button>
                        <button
                            className={ cn(
                                'h-full px-4 text-[11px] font-semibold transition-colors border-b-2 -mb-px',
                                isMyRoomsTab
                                    ? 'text-white/90 border-white/50'
                                    : 'text-white/35 border-transparent hover:text-white/60'
                            ) }
                            onClick={ () => sendSearch('', 'myworld_view') }
                        >
                            Meine Räume
                        </button>
                        <div className="flex-1" />
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/35 hover:bg-white/[0.06] hover:text-white/75 transition-colors"
                            title="Raum erstellen"
                            onClick={ () => setCreatorOpen(true) }
                        >
                            <FaPlus className="text-[11px]" />
                        </button>
                        <DrawerClose className="appearance-none border-0 bg-transparent w-9 h-9 flex items-center justify-center rounded-lg text-white/25 hover:bg-white/[0.06] hover:text-white/70 transition-colors mr-1">
                            <FaTimes className="text-[11px]" />
                        </DrawerClose>
                    </div>

                    { /* ── Search ── */ }
                    <div className="px-3 pt-2 pb-2 border-b border-white/[0.04] shrink-0">
                        <NavigatorSearchView sendSearch={ sendSearch } />
                    </div>

                    { /* ── Stats ── */ }
                    { searchResult && (
                        <div className="nav-stats">
                            <span className="nav-stats-dot" />
                            <span className="nav-stats-num">{ activityStats.totalUsers }</span>
                            <span className="nav-stats-label">online</span>
                            <span className="nav-stats-sep" />
                            <span className="nav-stats-num">{ activityStats.activeRooms }</span>
                            <span className="nav-stats-label">aktive Räume</span>
                        </div>
                    ) }

                    { /* ── Room List ── */ }
                    <div className={ cn('flex-1 min-h-0 overflow-hidden relative', isLoading && 'nav-loading') }>
                        <ScrollArea className="h-full">
                            <div className="p-3 flex flex-col gap-px">
                                { dedupedRooms.map((room) =>
                                    <NavigatorSearchResultItemView key={ room.roomId } roomData={ room } />
                                ) }
                                { searchResult && dedupedRooms.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                                        <span className="text-[12px] text-white/20">Keine Räume gefunden</span>
                                    </div>
                                ) }
                            </div>
                        </ScrollArea>

                        { /* ── Room Creator Modal ── */ }
                        { isCreatorOpen && (
                            <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-6 px-3">
                                <div className="w-full rounded-2xl border border-white/[0.09] bg-[rgba(10,10,14,0.98)] overflow-hidden flex flex-col" style={ { maxHeight: '90%' } }>
                                    <div className="flex items-center justify-between px-4 shrink-0 border-b border-white/[0.06]" style={ { height: 44 } }>
                                        <span className="text-[12px] font-semibold text-white/80">Raum erstellen</span>
                                        <button
                                            className="text-white/35 hover:text-white/75 transition-colors"
                                            onClick={ () => setCreatorOpen(false) }
                                        >
                                            <FaTimes className="text-[11px]" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <NavigatorRoomCreatorView />
                                    </div>
                                </div>
                            </div>
                        ) }
                    </div>
                    </DrawerPrimitive.Content>
                </DrawerPrimitive.Portal>
            </DrawerPrimitive.Root>
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => setRoomInfoOpen(false) } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => setRoomLinkOpen(false) } /> }
            <NavigatorRoomSettingsView />
        </>
    );
}
