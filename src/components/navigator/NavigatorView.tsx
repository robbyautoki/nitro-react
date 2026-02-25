import { ConvertGlobalRoomIdMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RoomDataParser, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Compass, Plus, Search, X } from 'lucide-react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TryVisitRoom } from '../../api';
import { useNavigator, useRoomSessionManagerEvent } from '../../hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Frame, FramePanel } from '@/components/ui/frame';
import { cn } from '@/lib/utils';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorSearchResultItemView } from './views/search/NavigatorSearchResultItemView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';
import { applyGermanNavigatorLocale } from './NavigatorLocaleDE';

type TabId = 'all' | 'mine' | 'rp';

function StatsBar({ totalUsers, activeRooms, totalRooms }: { totalUsers: number; activeRooms: number; totalRooms: number })
{
    return (
        <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-bold tabular-nums">{ totalUsers }</span>
                <span className="text-[11px] text-muted-foreground/50">online</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tabular-nums">{ activeRooms }</span>
                <span className="text-[11px] text-muted-foreground/50">aktive Räume</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tabular-nums">{ totalRooms }</span>
                <span className="text-[11px] text-muted-foreground/50">gesamt</span>
            </div>
        </div>
    );
}

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
    const [ activeTab, setActiveTab ] = useState<TabId>('all');
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
                    case 'show':
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(isVisible)
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

    useEffect(() => { applyGermanNavigatorLocale(); }, []);

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

        return { totalUsers, activeRooms, totalRooms: dedupedRooms.length };
    }, [ dedupedRooms ]);

    const handleTabClick = useCallback((tab: TabId) =>
    {
        setActiveTab(tab);

        switch(tab)
        {
            case 'all':
                sendSearch('', 'hotel_view');
                break;
            case 'mine':
                sendSearch('', 'myworld_view');
                break;
            case 'rp':
                sendSearch('tag:rp', 'hotel_view');
                break;
        }
    }, [ sendSearch ]);

    const isMyRoomsTab = topLevelContext?.code === 'myworld_view';
    const isRpTab = topLevelContext?.code === 'hotel_view' && searchResult?.data === 'tag:rp';

    const currentTab: TabId = isMyRoomsTab ? 'mine' : isRpTab ? 'rp' : 'all';

    const tabs: { id: TabId; label: string; count?: number }[] = [
        { id: 'all', label: 'Alle Räume', count: !isMyRoomsTab && !isRpTab ? dedupedRooms.length : undefined },
        { id: 'mine', label: 'Meine', count: isMyRoomsTab ? dedupedRooms.length : undefined },
        { id: 'rp', label: 'RP', count: isRpTab ? dedupedRooms.length : undefined },
    ];

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
                        className="navigator-drawer fixed right-0 top-0 bottom-0 w-[440px] z-[79] flex flex-col overflow-hidden bg-background border-l border-border/40 shadow-xl"
                        style={ { '--initial-transform': 'calc(100%)' } as React.CSSProperties }
                    >
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-base font-semibold">
                                        <Compass className="w-4 h-4 text-muted-foreground" />
                                        Navigator
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Durchsuche und besuche Räume im Hotel</p>
                                </div>
                                <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent/50 text-muted-foreground/50 transition-colors" onClick={ () => setIsVisible(false) }>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Main Frame */}
                        <div className="flex-1 min-h-0 flex flex-col px-3 pb-3 gap-3">
                            <Frame variant="default" spacing="sm" stacked className="flex-1 min-h-0 flex flex-col">
                                {/* Tabs — 1:1 from v2 prototype */}
                                <FramePanel className="shrink-0">
                                    <div className="flex items-center gap-1 p-1.5">
                                        { tabs.map(tab => (
                                            <button
                                                key={ tab.id }
                                                onClick={ () => handleTabClick(tab.id) }
                                                className={ cn(
                                                    'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-[11px] font-semibold transition-colors',
                                                    currentTab === tab.id
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                                ) }
                                            >
                                                { tab.label }
                                                { tab.count !== undefined && (
                                                    <span className={ cn(
                                                        'text-[9px] tabular-nums px-1 py-px rounded-full',
                                                        currentTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted/50'
                                                    ) }>
                                                        { tab.count }
                                                    </span>
                                                ) }
                                            </button>
                                        )) }
                                    </div>
                                </FramePanel>

                                {/* Search + Stats */}
                                <FramePanel className="shrink-0">
                                    <div className="p-2.5 space-y-2">
                                        <NavigatorSearchView sendSearch={ sendSearch } />
                                        { searchResult && <StatsBar { ...activityStats } /> }
                                    </div>
                                </FramePanel>

                                {/* Room List */}
                                <FramePanel className={ cn('flex-1 min-h-0 overflow-hidden', isLoading && 'opacity-40 pointer-events-none') }>
                                    <ScrollArea className="h-full">
                                        <div className="p-1.5 flex flex-col gap-1">
                                            { dedupedRooms.map((room) =>
                                                <NavigatorSearchResultItemView key={ room.roomId } roomData={ room } />
                                            ) }
                                            { searchResult && dedupedRooms.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-16 gap-2">
                                                    <Search className="w-5 h-5 text-muted-foreground/20" />
                                                    <span className="text-[12px] text-muted-foreground/30">Keine Räume gefunden</span>
                                                </div>
                                            ) }
                                        </div>
                                    </ScrollArea>
                                </FramePanel>
                            </Frame>
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-4 pt-0 shrink-0">
                            <Button variant="outline" className="w-full gap-2" onClick={ () => setCreatorOpen(true) }>
                                <Plus className="w-4 h-4" />
                                Raum erstellen
                            </Button>
                        </div>

                        {/* Room Creator Overlay */}
                        { isCreatorOpen && (
                            <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-6 px-3">
                                <div className="w-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-xl" style={ { maxHeight: '90%' } }>
                                    <div className="flex items-center justify-between px-4 shrink-0 border-b border-border/40" style={ { height: 44 } }>
                                        <span className="text-[12px] font-semibold">Raum erstellen</span>
                                        <button className="text-muted-foreground/50 hover:text-foreground transition-colors" onClick={ () => setCreatorOpen(false) }>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <NavigatorRoomCreatorView />
                                    </div>
                                </div>
                            </div>
                        ) }
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
