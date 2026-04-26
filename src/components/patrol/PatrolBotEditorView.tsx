import { NotificationDialogMessageEvent, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { ArrowDown, ArrowUp, Bell, MapPinned, Play, RotateCcw, Save, Square, Trash2 } from 'lucide-react';
import { ComponentProps, FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GetOwnRoomObject, GetRoomObjectBounds, GetRoomSession } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { useMessageEvent } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

interface Waypoint {
    x: number;
    y: number;
    pauseMs: number;
}

interface GreetingConfig {
    enabled: boolean;
    radius: number;
    cooldownMs: number;
    message: string;
}

interface PatrolConfig {
    enabled: boolean;
    waypoints: Waypoint[];
    greeting: GreetingConfig;
}

interface PatrolEditorState {
    botId: number;
    botName: string;
    roomIndex: number;
    config: PatrolConfig;
}

const MAX_WAYPOINTS = 12;
const MAX_PAUSE_MS = 15000;
const MIN_RADIUS = 1;
const MAX_RADIUS = 5;
const MIN_COOLDOWN_MS = 5000;
const MAX_COOLDOWN_MS = 300000;

type BadgeColor = ComponentProps<typeof AlignBadge.Root>['color'];

function StatTile({ label, value, color = 'gray' }: { label: string; value: ReactNode; color?: BadgeColor })
{
    return (
        <div className="rounded-xl bg-bg-weak-50 px-3 py-2 ring-1 ring-inset ring-stroke-soft-200">
            <div className="text-subheading-2xs uppercase text-text-soft-400">{ label }</div>
            <AlignBadge.Root className="mt-1" color={ color } variant="light" size="small">
                { value }
            </AlignBadge.Root>
        </div>
    );
}

function NumberField(props: ComponentProps<typeof AlignInput.Input>)
{
    return (
        <AlignInput.Root size="xsmall">
            <AlignInput.Wrapper>
                <AlignInput.Input type="number" { ...props } />
            </AlignInput.Wrapper>
        </AlignInput.Root>
    );
}

const clamp = (value: number, min: number, max: number) =>
{
    if(!Number.isFinite(value)) return min;

    return Math.max(min, Math.min(max, value));
};

const defaultConfig = (): PatrolConfig =>
{
    return {
        enabled: false,
        waypoints: [],
        greeting: {
            enabled: true,
            radius: 3,
            cooldownMs: 60000,
            message: 'Hallo {user}.'
        }
    };
};

const sanitizeConfig = (config: Partial<PatrolConfig> | null | undefined): PatrolConfig =>
{
    const base = defaultConfig();
    const next = config ?? {};
    const greeting = next.greeting ?? {};

    return {
        enabled: !!next.enabled,
        waypoints: Array.isArray(next.waypoints)
            ? next.waypoints
                .filter(Boolean)
                .slice(0, MAX_WAYPOINTS)
                .map(waypoint => ({
                    x: Math.max(0, Math.floor(Number(waypoint.x) || 0)),
                    y: Math.max(0, Math.floor(Number(waypoint.y) || 0)),
                    pauseMs: clamp(Number(waypoint.pauseMs) || 0, 0, MAX_PAUSE_MS)
                }))
            : base.waypoints,
        greeting: {
            enabled: !!greeting.enabled,
            radius: clamp(Number(greeting.radius ?? base.greeting.radius), MIN_RADIUS, MAX_RADIUS),
            cooldownMs: clamp(Number(greeting.cooldownMs ?? base.greeting.cooldownMs), MIN_COOLDOWN_MS, MAX_COOLDOWN_MS),
            message: String(greeting.message ?? base.greeting.message).replace(/\r?\n/g, ' ').trim() || base.greeting.message
        }
    };
};

const parseConfig = (rawConfig: string | null | undefined): PatrolConfig =>
{
    if(!rawConfig) return defaultConfig();

    try
    {
        return sanitizeConfig(JSON.parse(rawConfig));
    }
    catch
    {
        return defaultConfig();
    }
};

const encodeBase64Url = (value: string) =>
{
    const bytes = new TextEncoder().encode(value);
    let binary = '';

    for(const byte of bytes)
    {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const getAnchorPosition = (roomIndex: number) =>
{
    const roomSession = GetRoomSession();

    if(!roomSession) return { x: 96, y: 96 };

    const bounds = GetRoomObjectBounds(roomSession.roomId, roomIndex, RoomObjectCategory.UNIT, 1);

    if(!bounds) return { x: 96, y: 96 };

    return {
        x: Math.max(24, Math.round(bounds.left + bounds.width + 24)),
        y: Math.max(24, Math.round(bounds.top - 12))
    };
};

export const PatrolBotEditorView: FC<{}> = () =>
{
    const [ editor, setEditor ] = useState<PatrolEditorState>(null);
    const [ anchor, setAnchor ] = useState({ x: 96, y: 96 });
    const editorRef = useRef<PatrolEditorState>(null);

    useEffect(() =>
    {
        editorRef.current = editor;
    }, [ editor ]);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.type !== 'patrol.bot.config') return;

        const nextEditor: PatrolEditorState = {
            botId: parseInt(parser.parameters?.get('botId') || '0'),
            botName: parser.parameters?.get('botName') || 'Patrouillen-Bot',
            roomIndex: parseInt(parser.parameters?.get('roomIndex') || '0'),
            config: parseConfig(parser.parameters?.get('config'))
        };

        const previous = editorRef.current;
        if(!previous || previous.botId !== nextEditor.botId)
        {
            setAnchor(getAnchorPosition(nextEditor.roomIndex));
        }

        setEditor(nextEditor);
    });

    const updateConfig = useCallback((updater: (config: PatrolConfig) => PatrolConfig) =>
    {
        setEditor(prev =>
        {
            if(!prev) return prev;

            return {
                ...prev,
                config: sanitizeConfig(updater(prev.config))
            };
        });
    }, []);

    const updateWaypoint = useCallback((index: number, updater: (waypoint: Waypoint) => Waypoint) =>
    {
        updateConfig(prev =>
        {
            const nextWaypoints = [ ...prev.waypoints ];
            const current = nextWaypoints[index];

            if(!current) return prev;

            nextWaypoints[index] = updater(current);

            return {
                ...prev,
                waypoints: nextWaypoints
            };
        });
    }, [ updateConfig ]);

    const moveWaypoint = useCallback((index: number, direction: -1 | 1) =>
    {
        updateConfig(prev =>
        {
            const targetIndex = index + direction;
            if(targetIndex < 0 || targetIndex >= prev.waypoints.length) return prev;

            const nextWaypoints = [ ...prev.waypoints ];
            const current = nextWaypoints[index];
            nextWaypoints[index] = nextWaypoints[targetIndex];
            nextWaypoints[targetIndex] = current;

            return {
                ...prev,
                waypoints: nextWaypoints
            };
        });
    }, [ updateConfig ]);

    const removeWaypoint = useCallback((index: number) =>
    {
        updateConfig(prev =>
        {
            const nextWaypoints = prev.waypoints.filter((_, waypointIndex) => waypointIndex !== index);

            return {
                ...prev,
                waypoints: nextWaypoints
            };
        });
    }, [ updateConfig ]);

    const addWaypointFromOwnPosition = useCallback(() =>
    {
        const roomObject = GetOwnRoomObject();
        const location = roomObject?.getLocation?.();

        if(!location) return;

        updateConfig(prev =>
        {
            if(prev.waypoints.length >= MAX_WAYPOINTS) return prev;

            return {
                ...prev,
                waypoints: [
                    ...prev.waypoints,
                    {
                        x: Math.max(0, Math.floor(location.x)),
                        y: Math.max(0, Math.floor(location.y)),
                        pauseMs: 2000
                    }
                ]
            };
        });
    }, [ updateConfig ]);

    const sendCommand = useCallback((command: string) =>
    {
        const session = GetRoomSession();

        if(!session) return;

        session.sendChatMessage(command, 0);
    }, []);

    const saveConfig = useCallback(() =>
    {
        if(!editor) return;

        const payload = encodeBase64Url(JSON.stringify(sanitizeConfig(editor.config)));
        sendCommand(`:patrolbot save ${ editor.botId } ${ payload }`);
    }, [ editor, sendCommand ]);

    if(!editor) return null;

    return (
        <DraggableWindow windowPosition={ DraggableWindowPosition.NOTHING } handleSelector=".drag-handler" dragStyle={ { top: anchor.y, left: anchor.x } }>
            <div className="w-[430px] max-w-[calc(100vw-32px)]">
                <AlignSurface.Panel className="overflow-hidden">
                    <AlignSurface.Header
                        className="drag-handler cursor-grab select-none active:cursor-grabbing"
                        title={
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-success-lighter text-success-base ring-1 ring-inset ring-success-light">
                                    <MapPinned className="size-4" />
                                </span>
                                <span className="truncate">{ editor.botName }</span>
                            </div>
                        }
                        description="Patrouillen-Bot Editor"
                        onClose={ () => setEditor(null) }
                    />
                    <div className="space-y-4 p-4">
                        <div className="grid grid-cols-3 gap-2">
                            <StatTile label="Status" value={ editor.config.enabled ? 'Aktiv' : 'Inaktiv' } color={ editor.config.enabled ? 'green' : 'orange' } />
                            <StatTile label="Wegpunkte" value={ `${ editor.config.waypoints.length } / ${ MAX_WAYPOINTS }` } color="blue" />
                            <StatTile label="Gruß" value={ editor.config.greeting.enabled ? 'Aktiv' : 'Aus' } color={ editor.config.greeting.enabled ? 'green' : 'gray' } />
                        </div>
                        <div className="space-y-3 rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-label-sm text-text-strong-950">Patrouille</div>
                                    <div className="text-paragraph-xs text-text-sub-600">Läuft nur mit mindestens zwei gespeicherten Wegpunkten.</div>
                                </div>
                                <label className="flex shrink-0 items-center gap-2 text-label-xs text-text-sub-600">
                                    <AlignCheckbox.Root
                                        checked={ editor.config.enabled }
                                        onCheckedChange={ checked => updateConfig(prev => ({ ...prev, enabled: checked === true })) }
                                    />
                                    Aktiv
                                </label>
                            </div>
                            <AlignButton.Root size="small" variant="neutral" mode="stroke" className="w-full justify-start" onClick={ addWaypointFromOwnPosition } disabled={ editor.config.waypoints.length >= MAX_WAYPOINTS }>
                                <AlignButton.Icon as={ MapPinned } className="size-4" />
                                Punkt an meiner Position hinzufügen
                            </AlignButton.Root>
                            <div className="text-paragraph-xs text-text-sub-600">Wegpunkte werden direkt aus deiner aktuellen Raumposition erfasst.</div>
                            <AlignProgress.Root value={ editor.config.waypoints.length } max={ MAX_WAYPOINTS } color={ editor.config.waypoints.length >= 2 ? 'green' : 'orange' } />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-label-sm text-text-strong-950">Wegpunkt-Liste</div>
                                <div className="text-paragraph-xs text-text-sub-600">Pause pro Punkt: 0 bis 15000 ms</div>
                            </div>
                            <div className="max-h-[240px] overflow-y-auto rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                                <div className="space-y-2 p-2">
                                    { editor.config.waypoints.length === 0 &&
                                        <div className="rounded-xl border border-dashed border-stroke-soft-200 px-3 py-4 text-center text-paragraph-xs text-text-sub-600">
                                            Noch keine Wegpunkte gespeichert.
                                        </div> }
                                    { editor.config.waypoints.map((waypoint, index) =>
                                    {
                                        return (
                                            <div key={ `${ waypoint.x }-${ waypoint.y }-${ index }` } className="rounded-xl bg-bg-weak-50 px-3 py-2 ring-1 ring-inset ring-stroke-soft-200">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-label-sm text-text-strong-950">Punkt #{ index + 1 }</div>
                                                        <div className="text-paragraph-xs text-text-sub-600">Position: X { waypoint.x } / Y { waypoint.y }</div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <AlignButton.Root size="xxsmall" variant="neutral" mode="ghost" className="size-7 p-0" disabled={ index === 0 } onClick={ () => moveWaypoint(index, -1) }>
                                                            <AlignButton.Icon as={ ArrowUp } className="size-3.5" />
                                                        </AlignButton.Root>
                                                        <AlignButton.Root size="xxsmall" variant="neutral" mode="ghost" className="size-7 p-0" disabled={ index === (editor.config.waypoints.length - 1) } onClick={ () => moveWaypoint(index, 1) }>
                                                            <AlignButton.Icon as={ ArrowDown } className="size-3.5" />
                                                        </AlignButton.Root>
                                                        <AlignButton.Root size="xxsmall" variant="error" mode="ghost" className="size-7 p-0" onClick={ () => removeWaypoint(index) }>
                                                            <AlignButton.Icon as={ Trash2 } className="size-3.5" />
                                                        </AlignButton.Root>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-paragraph-xs text-text-sub-600">Pause</span>
                                                    <NumberField
                                                        min={ 0 }
                                                        max={ MAX_PAUSE_MS }
                                                        value={ waypoint.pauseMs }
                                                        onChange={ event => updateWaypoint(index, current => ({
                                                            ...current,
                                                            pauseMs: clamp(event.target.valueAsNumber, 0, MAX_PAUSE_MS)
                                                        })) }
                                                    />
                                                    <span className="text-paragraph-xs text-text-sub-600">ms</span>
                                                </div>
                                            </div>
                                        );
                                    }) }
                                </div>
                            </div>
                        </div>
                        <AlignDivider.Root />
                        <div className="space-y-3 rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                            <div className="flex items-center gap-2">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-warning-lighter text-warning-base ring-1 ring-inset ring-warning-light">
                                    <Bell className="size-4" />
                                </span>
                                <div>
                                    <div className="text-label-sm text-text-strong-950">Gruß-Nachricht</div>
                                    <div className="text-paragraph-xs text-text-sub-600">{ '`{user}` wird automatisch mit dem Spielernamen ersetzt.' }</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-paragraph-xs text-text-sub-600">Gruß aktivieren</div>
                                <label className="flex items-center gap-2 text-label-xs text-text-sub-600">
                                    <AlignCheckbox.Root
                                        checked={ editor.config.greeting.enabled }
                                        onCheckedChange={ checked => updateConfig(prev => ({
                                            ...prev,
                                            greeting: {
                                                ...prev.greeting,
                                                enabled: checked === true
                                            }
                                        })) }
                                    />
                                    Aktiv
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="text-paragraph-xs text-text-sub-600">Radius</div>
                                    <NumberField
                                        min={ MIN_RADIUS }
                                        max={ MAX_RADIUS }
                                        value={ editor.config.greeting.radius }
                                        onChange={ event => updateConfig(prev => ({
                                            ...prev,
                                            greeting: {
                                                ...prev.greeting,
                                                radius: clamp(event.target.valueAsNumber, MIN_RADIUS, MAX_RADIUS)
                                            }
                                        })) }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-paragraph-xs text-text-sub-600">Cooldown (ms)</div>
                                    <NumberField
                                        min={ MIN_COOLDOWN_MS }
                                        max={ MAX_COOLDOWN_MS }
                                        value={ editor.config.greeting.cooldownMs }
                                        onChange={ event => updateConfig(prev => ({
                                            ...prev,
                                            greeting: {
                                                ...prev.greeting,
                                                cooldownMs: clamp(event.target.valueAsNumber, MIN_COOLDOWN_MS, MAX_COOLDOWN_MS)
                                            }
                                        })) }
                                    />
                                </div>
                            </div>
                            <label className="block space-y-1">
                                <div className="text-paragraph-xs text-text-sub-600">Nachricht</div>
                                <AlignTextarea.Root
                                    rows={ 3 }
                                    value={ editor.config.greeting.message }
                                    onChange={ event => updateConfig(prev => ({
                                        ...prev,
                                        greeting: {
                                            ...prev.greeting,
                                            message: event.target.value
                                        }
                                    })) }
                                />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <FancyButton.Root variant="primary" size="small" onClick={ saveConfig }>
                                <FancyButton.Icon as={ Save } className="size-4" />
                                Speichern
                            </FancyButton.Root>
                            <AlignButton.Root variant="primary" mode="stroke" onClick={ () => sendCommand(`:patrolbot start ${ editor.botId }`) }>
                                <AlignButton.Icon as={ Play } className="size-4" />
                                Start
                            </AlignButton.Root>
                            <AlignButton.Root variant="neutral" mode="lighter" onClick={ () => sendCommand(`:patrolbot stop ${ editor.botId }`) }>
                                <AlignButton.Icon as={ Square } className="size-4" />
                                Stop
                            </AlignButton.Root>
                            <AlignButton.Root variant="error" mode="stroke" onClick={ () => sendCommand(`:patrolbot reset ${ editor.botId }`) }>
                                <AlignButton.Icon as={ RotateCcw } className="size-4" />
                                Zurücksetzen
                            </AlignButton.Root>
                        </div>
                    </div>
                </AlignSurface.Panel>
            </div>
        </DraggableWindow>
    );
};
