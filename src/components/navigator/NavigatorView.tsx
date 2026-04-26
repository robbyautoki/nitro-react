import { ConvertGlobalRoomIdMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RoomDataParser, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Plus, Search, X } from 'lucide-react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TryVisitRoom } from '../../api';
import { useNavigator, useRoomSessionManagerEvent } from '../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { cn } from '@/align-ui/utils/cn';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorPanel, NavigatorPanelStack, NavigatorScrollViewport, NavigatorTabButton } from './views/NavigatorPrimitives';

import { NavigatorSearchResultItemView } from './views/search/NavigatorSearchResultItemView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';
import { applyGermanNavigatorLocale } from './NavigatorLocaleDE';

type TabId = 'all' | 'mine' | 'rp';

function StatsBar({ totalUsers, activeRooms, totalRooms }: { totalUsers: number; activeRooms: number; totalRooms: number })
{
    return (
        <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success-base ring-2 ring-success-lighter" />
                <span className="text-subheading-2xs font-bold tabular-nums text-text-strong-950">{ totalUsers }</span>
                <span className="text-subheading-2xs text-text-soft-400">online</span>
            </div>
            <AlignDivider.Root className="h-3 w-px" />
            <div className="flex items-center gap-1.5">
                <span className="text-subheading-2xs font-bold tabular-nums text-text-strong-950">{ activeRooms }</span>
                <span className="text-subheading-2xs text-text-soft-400">aktive Räume</span>
            </div>
            <AlignDivider.Root className="h-3 w-px" />
            <div className="flex items-center gap-1.5">
                <span className="text-subheading-2xs font-bold tabular-nums text-text-strong-950">{ totalRooms }</span>
                <span className="text-subheading-2xs text-text-soft-400">gesamt</span>
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
    const [ roomSettingsRequest, setRoomSettingsRequest ] = useState(0);
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

    useEffect(() =>
    {
        applyGermanNavigatorLocale();
    }, []);

    useEffect(() =>
    {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '452px' : '0px');
        return () =>
        {
            document.documentElement.style.setProperty('--drawer-width', '0px');
        };
    }, [ isVisible ]);

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
            <AlignDrawer.Root
                open={ isVisible }
                onOpenChange={ setIsVisible }
                modal={ false }
            >
                <AlignDrawer.Content
                    className="navigator-drawer w-[440px]"
                    onOpenAutoFocus={ event => event.preventDefault() }
                >
                        { /* Header */ }
                        <AlignDrawer.Header className="px-4 pb-2 pt-3">
                            <div className="flex items-center justify-between">
                                <AlignDrawer.Title className="flex items-center gap-2 text-label-md text-text-strong-950">
                                    <Compass className="size-4 text-text-sub-600" />
                                    Navigator
                                </AlignDrawer.Title>
                                <AlignDrawer.Description className="sr-only">Durchsuche und besuche Räume im Hotel</AlignDrawer.Description>
                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setIsVisible(false) }>
                                    <AlignButton.Icon as={ X } className="size-4" />
                                </AlignButton.Root>
                            </div>
                        </AlignDrawer.Header>
                        { /* Main panel */ }
                        <AlignDrawer.Body className="flex flex-col gap-3 px-3 pb-3">
                            <NavigatorPanelStack className="min-h-0 flex-1">
                                <NavigatorPanel className="shrink-0 p-0">
                                    <div className="flex items-center gap-1 p-1.5">
                                        { tabs.map(tab => (
                                            <NavigatorTabButton
                                                key={ tab.id }
                                                active={ currentTab === tab.id }
                                                onClick={ () => handleTabClick(tab.id) }
                                                className="flex-1"
                                            >
                                                { tab.label }
                                                { tab.count !== undefined && (
                                                    <span className={ cn(
                                                        'rounded-full px-1 py-px text-[9px] tabular-nums',
                                                        currentTab === tab.id ? 'bg-static-white/20 text-static-white' : 'bg-bg-weak-50 text-text-soft-400'
                                                    ) }>
                                                        { tab.count }
                                                    </span>
                                                ) }
                                            </NavigatorTabButton>
                                        )) }
                                    </div>
                                </NavigatorPanel>
                                { /* Search + Stats */ }
                                <NavigatorPanel className="shrink-0">
                                    <div className="p-2.5 space-y-2">
                                        <NavigatorSearchView sendSearch={ sendSearch } />
                                        { searchResult && <StatsBar { ...activityStats } /> }
                                    </div>
                                </NavigatorPanel>
                                { /* Room List */ }
                                <NavigatorPanel className={ cn('flex-1 min-h-0 overflow-hidden p-0', isLoading && 'opacity-40 pointer-events-none') }>
                                    <NavigatorScrollViewport className="h-full">
                                        <div className="p-1.5 flex flex-col gap-1">
                                            { dedupedRooms.map((room) =>
                                                <NavigatorSearchResultItemView key={ room.roomId } roomData={ room } />
                                            ) }
                                            { searchResult && dedupedRooms.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-16 gap-2">
                                                    <Search className="size-5 text-text-soft-400" />
                                                    <span className="text-paragraph-xs text-text-soft-400">Keine Räume gefunden</span>
                                                </div>
                                            ) }
                                        </div>
                                    </NavigatorScrollViewport>
                                </NavigatorPanel>
                            </NavigatorPanelStack>
                        </AlignDrawer.Body>
                        { /* Footer */ }
                        <AlignDrawer.Footer className="px-4 pb-4 pt-0">
                            <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" className="w-full gap-2" onClick={ () => setCreatorOpen(true) }>
                                <AlignButton.Icon as={ Plus } className="size-4" />
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
                                            <AlignButton.Icon as={ X } className="size-4" />
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
