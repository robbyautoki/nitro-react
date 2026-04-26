import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AddEventLinkTracker, GetRoomSession, RemoveLinkEventTracker } from '../../api';
import { useMessageEvent } from '../../hooks';
import { cn } from '@/lib/utils';
import { Gavel, History, MapPinned, RefreshCcw, Search, Shield, TimerReset, UserRoundCheck, X } from 'lucide-react';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSelect from '@/align-ui/components/ui/select';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';

type JailEntry = {
    caseId: number;
    userId: number;
    username: string;
    status: string;
    reason: string;
    staffId: number;
    jailMinutes: number;
    until: number;
    reducedSeconds: number;
};

type JailZone = {
    id: number;
    type: string;
    key: string;
    x: number;
    y: number;
    radius: number;
};

type JailTask = {
    key: string;
    label: string;
    description: string;
    zoneType: string;
    requiredSeconds: number;
    reductionSeconds: number;
    maxPerCase: number;
};

type JailSnapshot = {
    configured: boolean;
    jailRoomId: number;
    active: JailEntry[];
    pending: JailEntry[];
    zones: JailZone[];
    tasks: JailTask[];
    history: JailEntry[];
};

const EMPTY_SNAPSHOT: JailSnapshot = {
    configured: false,
    jailRoomId: 0,
    active: [],
    pending: [],
    zones: [],
    tasks: [],
    history: [],
};

const TABS = [
    { id: 'active', label: 'Aktiv' },
    { id: 'pending', label: 'Wartend' },
    { id: 'history', label: 'Historie' },
    { id: 'setup', label: 'Setup' },
] as const;

type TabId = typeof TABS[number]['id'];

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

function formatRemaining(until: number) {
    if(!until) return 'Permanent';
    const remaining = Math.max(0, until - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${ minutes }:${ String(seconds).padStart(2, '0') }`;
}

function sendJailCommand(command: string) {
    const session = GetRoomSession();
    if(!session) return false;
    session.sendChatMessage(command, 0);
    return true;
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <div className="text-subheading-2xs uppercase tracking-wide text-text-soft-400">{ label }</div>
            <div className="mt-1 text-label-md text-text-strong-950">{ value }</div>
        </div>
    );
}

function EntryRow({
    entry,
    actionMinutes,
    actionReason,
    onRefresh,
}: {
    entry: JailEntry;
    actionMinutes: string;
    actionReason: string;
    onRefresh: () => void;
}) {
    const run = (command: string) => {
        if(sendJailCommand(command)) setTimeout(onRefresh, 250);
    };

    return (
        <div className="flex flex-col gap-2 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-label-sm text-text-strong-950">{ entry.username }</span>
                        <AlignBadge.Root color={ entry.status === 'pending' ? 'yellow' : entry.status === 'released' ? 'gray' : 'red' } variant="lighter" size="small">
                            { entry.status }
                        </AlignBadge.Root>
                    </div>
                    <div className="mt-1 text-paragraph-xs text-text-sub-600">
                        { entry.reason || 'Kein Grund angegeben' }
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-label-xs tabular-nums text-text-strong-950">{ formatRemaining(entry.until) }</div>
                    <div className="text-paragraph-xs text-text-soft-400">Case #{ entry.caseId || '-' }</div>
                </div>
            </div>

            <div className="flex items-center gap-4 text-paragraph-xs text-text-sub-600">
                <span><span className="text-text-soft-400">Dauer </span><span className="text-text-strong-950">{ entry.jailMinutes > 0 ? `${ entry.jailMinutes }m` : 'Permanent' }</span></span>
                <span><span className="text-text-soft-400">Reduziert </span><span className="text-text-strong-950">{ entry.reducedSeconds || 0 }s</span></span>
                <span><span className="text-text-soft-400">Staff </span><span className="text-text-strong-950">{ entry.staffId || '-' }</span></span>
            </div>

            { entry.status !== 'released' && (
                <div className="flex flex-wrap gap-2 pt-1">
                    <AlignButton.Root variant="primary" mode="lighter" size="xsmall" onClick={ () => run(`:jail reduce ${ entry.username } ${ actionMinutes || '1' }`) }>
                        <AlignButton.Icon as={ TimerReset } className="size-4" />
                        Reduzieren
                    </AlignButton.Root>
                    <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ () => run(`:jail extend ${ entry.username } ${ actionMinutes || '1' }`) }>
                        Verlängern
                    </AlignButton.Root>
                    <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ () => actionReason && run(`:jail reason ${ entry.username } ${ actionReason }`) }>
                        Grund ändern
                    </AlignButton.Root>
                    <AlignButton.Root variant="error" mode="lighter" size="xsmall" onClick={ () => run(`:jail free ${ entry.username }`) }>
                        Freilassen
                    </AlignButton.Root>
                </div>
            ) }
        </div>
    );
}

export const JailStaffDrawerView: FC<{}> = () => {
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<TabId>('active');
    const [ snapshot, setSnapshot ] = useState<JailSnapshot>(EMPTY_SNAPSHOT);
    const [ target, setTarget ] = useState('');
    const [ minutes, setMinutes ] = useState('10');
    const [ reason, setReason ] = useState('');
    const [ actionMinutes, setActionMinutes ] = useState('5');
    const [ actionReason, setActionReason ] = useState('');
    const [ zoneType, setZoneType ] = useState('work');
    const [ zoneKey, setZoneKey ] = useState('zone-1');
    const [ zoneRadius, setZoneRadius ] = useState('2');
    const [ query, setQuery ] = useState('');

    const refresh = useCallback(() => {
        sendJailCommand(':jail panel');
    }, []);

    useEffect(() => {
        const tracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');
                if(parts[1] === 'toggle') setIsVisible(value => !value);
                if(parts[1] === 'open') setIsVisible(true);
            },
            eventUrlPrefix: 'jail/'
        };
        AddEventLinkTracker(tracker);
        return () => RemoveLinkEventTracker(tracker);
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '452px' : '0px');
        if(isVisible) refresh();
        return () => {
            if(!isVisible) return;
            document.documentElement.style.setProperty('--drawer-width', '0px');
        };
    }, [ isVisible, refresh ]);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();
        if(parser.type !== 'jail.staff.snapshot') return;
        const payload = parser.parameters?.get('payload') || '';
        const decoded = decodePayload<JailSnapshot>(payload);
        if(decoded) setSnapshot({ ...EMPTY_SNAPSHOT, ...decoded });
    });

    const visibleEntries = useMemo(() => {
        const list = activeTab === 'active' ? snapshot.active : activeTab === 'pending' ? snapshot.pending : snapshot.history;
        const normalized = query.trim().toLowerCase();
        if(!normalized) return list;
        return list.filter(entry => entry.username?.toLowerCase().includes(normalized) || entry.reason?.toLowerCase().includes(normalized));
    }, [ activeTab, snapshot, query ]);

    const jailUser = () => {
        if(!target.trim()) return;
        const command = `:jail ${ target.trim() } ${ minutes || '0' }${ reason.trim() ? ` ${ reason.trim() }` : '' }`;
        if(sendJailCommand(command)) {
            setTimeout(refresh, 350);
            setReason('');
        }
    };

    const setupRoom = () => {
        if(sendJailCommand(':jail setup room')) setTimeout(refresh, 350);
    };

    const addZone = () => {
        if(!zoneKey.trim()) return;
        if(sendJailCommand(`:jail zone add ${ zoneType } ${ zoneKey.trim() } ${ zoneRadius || '1' }`)) setTimeout(refresh, 350);
    };

    return (
        <AlignTooltip.Provider delayDuration={200}>
            <AlignDrawer.Root open={ isVisible } onOpenChange={ setIsVisible } modal={ false }>
                <AlignDrawer.Content className="jail-drawer w-[440px]" onOpenAutoFocus={ event => event.preventDefault() }>
                    <AlignDrawer.Header className="px-5 pb-4 pt-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <AlignDrawer.Title className="flex items-center gap-2 text-label-md text-text-strong-950">
                                    <Shield className="size-4 text-error-base" />
                                    Jail Control
                                </AlignDrawer.Title>
                                <AlignDrawer.Description className="mt-1 text-paragraph-xs text-text-sub-600">
                                    Ingame-Haftfälle, Zonen und Aufgaben verwalten.
                                </AlignDrawer.Description>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ refresh }>
                                    <AlignButton.Icon as={ RefreshCcw } className="size-4" />
                                </AlignButton.Root>
                                <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ () => setIsVisible(false) }>
                                    <AlignButton.Icon as={ X } className="size-4" />
                                </AlignButton.Root>
                            </div>
                        </div>
                    </AlignDrawer.Header>

                    <div className="grid grid-cols-4 gap-0 border-b border-stroke-soft-200 px-3">
                        { TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={ tab.id }
                                    type="button"
                                    onClick={ () => setActiveTab(tab.id) }
                                    className={ cn(
                                        'relative h-10 px-2 text-label-xs transition-colors outline-none',
                                        isActive
                                            ? 'text-text-strong-950 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-text-strong-950'
                                            : 'text-text-sub-600 hover:text-text-strong-950'
                                    ) }
                                >
                                    { tab.label }
                                </button>
                            );
                        }) }
                    </div>

                    <AlignDrawer.Body className="flex min-h-0 flex-1 flex-col overflow-y-auto p-0">
                        <div className="grid grid-cols-3 gap-3 p-5">
                            <Stat label="Aktiv" value={ snapshot.active.length } />
                            <Stat label="Wartend" value={ snapshot.pending.length } />
                            <Stat label="Raum" value={ snapshot.jailRoomId || 'Fehlt' } />
                        </div>

                        { !snapshot.configured && (
                            <div className="mx-5 mb-3 rounded-12 bg-warning-lighter px-3 py-2.5 text-paragraph-xs text-warning-dark">
                                Kein Jail-Raum konfiguriert. Stelle dich in den Knast-Raum und nutze im Setup "Raum setzen".
                            </div>
                        ) }

                        { activeTab !== 'setup' && (
                            <>
                                <AlignDivider.Root variant="solid-text">NEUE HAFT</AlignDivider.Root>
                                <div className="space-y-2 p-5">
                                    <div className="grid grid-cols-[1fr_76px] gap-2">
                                        <AlignInput.Root>
                                            <AlignInput.Wrapper>
                                                <AlignInput.Icon as={ UserRoundCheck } />
                                                <AlignInput.Input value={ target } onChange={ event => setTarget(event.target.value) } placeholder="Username" />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                        <AlignInput.Root>
                                            <AlignInput.Wrapper>
                                                <AlignInput.Input value={ minutes } onChange={ event => setMinutes(event.target.value) } placeholder="Min" />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <AlignInput.Root>
                                            <AlignInput.Wrapper>
                                                <AlignInput.Input value={ reason } onChange={ event => setReason(event.target.value) } placeholder="Grund" />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                        <AlignButton.Root variant="primary" mode="filled" size="small" onClick={ jailUser }>
                                            <AlignButton.Icon as={ Gavel } className="size-4" />
                                            Jail
                                        </AlignButton.Root>
                                    </div>
                                </div>

                                <AlignDivider.Root variant="solid-text">KARTEN-AKTION</AlignDivider.Root>
                                <div className="grid grid-cols-[96px_1fr] gap-2 p-5">
                                    <AlignInput.Root>
                                        <AlignInput.Wrapper>
                                            <AlignInput.Input value={ actionMinutes } onChange={ event => setActionMinutes(event.target.value) } placeholder="Min" />
                                        </AlignInput.Wrapper>
                                    </AlignInput.Root>
                                    <AlignInput.Root>
                                        <AlignInput.Wrapper>
                                            <AlignInput.Input value={ actionReason } onChange={ event => setActionReason(event.target.value) } placeholder="Neuer Grund für Karten-Aktion" />
                                        </AlignInput.Wrapper>
                                    </AlignInput.Root>
                                </div>

                                <AlignDivider.Root variant="solid-text">EINTRÄGE</AlignDivider.Root>
                                <div className="px-5 pb-5 pt-2">
                                    <AlignInput.Root>
                                        <AlignInput.Wrapper>
                                            <AlignInput.Icon as={ Search } />
                                            <AlignInput.Input value={ query } onChange={ event => setQuery(event.target.value) } placeholder="Suchen..." />
                                        </AlignInput.Wrapper>
                                    </AlignInput.Root>
                                </div>
                                <div className="divide-y divide-stroke-soft-200 px-5 pb-5">
                                    { visibleEntries.length === 0 && (
                                        <div className="py-8 text-center text-paragraph-sm text-text-sub-600">
                                            Keine Einträge.
                                        </div>
                                    ) }
                                    { visibleEntries.map(entry => (
                                        <EntryRow key={ `${ activeTab }-${ entry.caseId || entry.userId }` } entry={ entry } actionMinutes={ actionMinutes } actionReason={ actionReason } onRefresh={ refresh } />
                                    )) }
                                </div>
                            </>
                        ) }

                        { activeTab === 'setup' && (
                            <>
                                <AlignDivider.Root variant="solid-text">JAIL-RAUM</AlignDivider.Root>
                                <div className="flex items-center justify-between gap-3 p-5">
                                    <div>
                                        <div className="text-label-sm text-text-strong-950">Aktueller Raum</div>
                                        <div className="text-paragraph-xs text-text-sub-600">Setzt den aktuellen Raum als Knast.</div>
                                    </div>
                                    <AlignButton.Root variant="primary" mode="lighter" size="small" onClick={ setupRoom }>
                                        Raum setzen
                                    </AlignButton.Root>
                                </div>

                                <AlignDivider.Root variant="solid-text">ZONE SETZEN</AlignDivider.Root>
                                <div className="space-y-2 p-5">
                                    <div className="flex items-center gap-2 text-paragraph-xs text-text-sub-600">
                                        <MapPinned className="size-4" />
                                        An aktueller Position
                                    </div>
                                    <div className="grid grid-cols-[112px_1fr_72px] gap-2">
                                        <AlignSelect.Root size="xsmall" value={ zoneType } onValueChange={ value => setZoneType(value) }>
                                            <AlignSelect.Trigger className="w-full text-paragraph-xs">
                                                <AlignSelect.Value placeholder="Typ" />
                                            </AlignSelect.Trigger>
                                            <AlignSelect.Content>
                                                <AlignSelect.Item value="spawn" className="text-paragraph-xs">spawn</AlignSelect.Item>
                                                <AlignSelect.Item value="cell" className="text-paragraph-xs">cell</AlignSelect.Item>
                                                <AlignSelect.Item value="work" className="text-paragraph-xs">work</AlignSelect.Item>
                                                <AlignSelect.Item value="yard" className="text-paragraph-xs">yard</AlignSelect.Item>
                                                <AlignSelect.Item value="checkpoint" className="text-paragraph-xs">checkpoint</AlignSelect.Item>
                                            </AlignSelect.Content>
                                        </AlignSelect.Root>
                                        <AlignInput.Root>
                                            <AlignInput.Wrapper>
                                                <AlignInput.Input value={ zoneKey } onChange={ event => setZoneKey(event.target.value) } placeholder="Key" />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                        <AlignInput.Root>
                                            <AlignInput.Wrapper>
                                                <AlignInput.Input value={ zoneRadius } onChange={ event => setZoneRadius(event.target.value) } placeholder="R" />
                                            </AlignInput.Wrapper>
                                        </AlignInput.Root>
                                    </div>
                                    <AlignButton.Root variant="neutral" mode="stroke" size="small" className="w-full" onClick={ addZone }>
                                        Zone speichern
                                    </AlignButton.Root>
                                </div>

                                <AlignDivider.Root variant="solid-text">ZONEN</AlignDivider.Root>
                                <div className="divide-y divide-stroke-soft-200 px-5">
                                    { snapshot.zones.length === 0 && (
                                        <div className="py-4 text-paragraph-xs text-text-sub-600">Keine Zonen gesetzt.</div>
                                    ) }
                                    { snapshot.zones.map(zone => (
                                        <div key={ zone.id || `${ zone.type }-${ zone.key }` } className="flex items-center justify-between gap-2 py-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-label-xs text-text-strong-950">{ zone.type } / { zone.key }</div>
                                                <div className="text-paragraph-xs text-text-sub-600">{ zone.x }, { zone.y } · Radius { zone.radius }</div>
                                            </div>
                                            <AlignBadge.Root color="gray" variant="lighter" size="small">{ zone.type }</AlignBadge.Root>
                                        </div>
                                    )) }
                                </div>

                                <AlignDivider.Root variant="solid-text">
                                    <span className="inline-flex items-center gap-1.5">
                                        <History className="size-3.5" />
                                        AUFGABEN
                                    </span>
                                </AlignDivider.Root>
                                <div className="divide-y divide-stroke-soft-200 px-5 pb-5">
                                    { snapshot.tasks.map(task => {
                                        const matched = snapshot.zones.some(zone => zone.type === task.zoneType);
                                        return (
                                            <div key={ task.key } className="flex items-start justify-between gap-2 py-3">
                                                <div className="min-w-0">
                                                    <div className={ cn('text-label-xs', matched ? 'text-success-base' : 'text-text-strong-950') }>{ task.label }</div>
                                                    <div className="text-paragraph-xs text-text-sub-600">{ task.zoneType } · { task.requiredSeconds }s · -{ task.reductionSeconds }s</div>
                                                </div>
                                                { matched && (
                                                    <AlignBadge.Root color="green" variant="lighter" size="small">aktiv</AlignBadge.Root>
                                                ) }
                                            </div>
                                        );
                                    }) }
                                </div>
                            </>
                        ) }
                    </AlignDrawer.Body>
                </AlignDrawer.Content>
            </AlignDrawer.Root>
        </AlignTooltip.Provider>
    );
};
