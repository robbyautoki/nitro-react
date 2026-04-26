import { ILinkEventTracker, NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, InputHTMLAttributes, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, GetRoomSession, RemoveLinkEventTracker } from '../../api';
import { useMessageEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSelect from '@/align-ui/components/ui/select';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import {
    ArrowLeft,
    Check,
    ListMusic,
    Loader2,
    Megaphone,
    Music,
    Pause,
    Play,
    Plus,
    Power,
    Radio,
    Repeat,
    SkipForward,
    Trash2,
    Volume2,
    X
} from 'lucide-react';

/* ── Types ── */

interface RadioTrack {
    id: number;
    title: string;
    artist: string;
    url: string;
    type: string;
    duration: number;
}

interface Playlist {
    id: number;
    name: string;
    trackCount: number;
}

const parseQueue = (json: string): RadioTrack[] =>
{
    try
    {
        return JSON.parse(json || '[]');
    }
    catch
    {
        return [];
    }
};

const parsePlaylists = (json: string): Playlist[] =>
{
    try
    {
        return JSON.parse(json || '[]');
    }
    catch
    {
        return [];
    }
};

const formatTime = (sec: number): string =>
{
    const s = Math.max(0, Math.floor(sec));
    return `${ Math.floor(s / 60) }:${ String(s % 60).padStart(2, '0') }`;
};

const extractYoutubeId = (url: string): string | null =>
{
    if(url.includes('youtube.com/watch'))
    {
        const parts = url.split('v=');
        if(parts.length > 1) return parts[1].split('&')[0];
    }
    else if(url.includes('youtu.be/'))
    {
        const parts = url.split('youtu.be/');
        if(parts.length > 1) return parts[1].split('?')[0];
    }
    return null;
};

/* ── Tab IDs ── */
type TabId = 'playing' | 'playlists' | 'addtrack' | 'controls';

const TAB_ALL: { id: TabId; label: string; staffOnly: boolean }[] = [
    { id: 'playing', label: 'Now Playing', staffOnly: false },
    { id: 'playlists', label: 'Playlisten', staffOnly: true },
    { id: 'addtrack', label: 'Track +', staffOnly: true },
    { id: 'controls', label: 'DJ Controls', staffOnly: true },
];

const FieldLabel: FC<{ children: ReactNode }> = ({ children }) => (
    <label className="mb-1 block text-subheading-2xs uppercase text-text-sub-600">
        { children }
    </label>
);

const TextInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
    <AlignInput.Root size="xsmall" className={ className }>
        <AlignInput.Wrapper className="h-8">
            <AlignInput.Input className="h-8 text-paragraph-xs" { ...props } />
        </AlignInput.Wrapper>
    </AlignInput.Root>
);

const EmptyState: FC<{ icon: ReactNode; message: string; tone?: 'default' | 'error' }> = ({ icon, message, tone = 'default' }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-bg-weak-50 px-4 py-8 text-center ring-1 ring-inset ring-stroke-soft-200">
        <div className={ tone === 'error' ? 'mb-2 text-error-base' : 'mb-2 text-text-soft-400' }>
            { icon }
        </div>
        <div className={ tone === 'error' ? 'text-paragraph-xs text-error-base' : 'text-paragraph-xs text-text-sub-600' }>
            { message }
        </div>
    </div>
);

/* ── Component ── */

export const RadioView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<TabId>('playing');

    // ── Radio State (from server events) ──
    const [ currentTrack, setCurrentTrack ] = useState<RadioTrack | null>(null);
    const [ startedAt, setStartedAt ] = useState(0);
    const [ paused, setPaused ] = useState(false);
    const [ queue, setQueue ] = useState<RadioTrack[]>([]);
    const [ isStaff, setIsStaff ] = useState(false);
    const [ radioEnabled, setRadioEnabled ] = useState(true);
    const [ loopEnabled, setLoopEnabled ] = useState(true);
    const [ looping, setLooping ] = useState(false);
    const [ transitionType, setTransitionType ] = useState('crossfade');
    const [ crossfadeMs, setCrossfadeMs ] = useState(3000);

    // ── Playlist State ──
    const [ playlists, setPlaylists ] = useState<Playlist[]>([]);
    const [ selectedPlaylist, setSelectedPlaylist ] = useState<Playlist | null>(null);
    const [ playlistTracks, setPlaylistTracks ] = useState<RadioTrack[]>([]);
    const [ newPlaylistName, setNewPlaylistName ] = useState('');

    // ── Add Track Form ──
    const [ addUrl, setAddUrl ] = useState('');
    const [ addTitle, setAddTitle ] = useState('');
    const [ addArtist, setAddArtist ] = useState('');
    const [ addTarget, setAddTarget ] = useState<'queue' | number>('queue');
    const [ addDetecting, setAddDetecting ] = useState(false);

    // ── DJ Controls ──
    const [ sfxUrl, setSfxUrl ] = useState('');
    const [ ttsText, setTtsText ] = useState('');
    const [ ttsGenerating, setTtsGenerating ] = useState(false);
    const [ ttsPreview, setTtsPreview ] = useState<{ url: string; text: string } | null>(null);
    const [ ttsError, setTtsError ] = useState('');

    // ── Progress ──
    const [ progress, setProgress ] = useState(0);
    const [ timeText, setTimeText ] = useState('');
    const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAtRef = useRef(0);
    const currentTrackRef = useRef<RadioTrack | null>(null);
    const pausedRef = useRef(false);

    startedAtRef.current = startedAt;
    currentTrackRef.current = currentTrack;
    pausedRef.current = paused;

    // ── Link Event Tracker ──
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
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'radio/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    // ── Send chat command ──
    const sendCommand = useCallback((cmd: string) =>
    {
        try
        {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(cmd, 0);
        }
        catch
        {}
    }, []);

    // ── Listen for server events ──
    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        const params = parser.parameters;

        switch(parser.type)
        {
            case 'radio.state':
            {
                const title = params?.get('track_title') || '';
                setIsStaff(params?.get('is_staff') === 'true');
                setRadioEnabled(params?.get('enabled') !== 'false');
                setLoopEnabled(params?.get('loop_enabled') !== 'false');
                setTransitionType(params?.get('transition') || 'crossfade');
                setCrossfadeMs(parseInt(params?.get('crossfade_ms') || '3000', 10));
                setQueue(parseQueue(params?.get('queue') || '[]'));
                setPaused(params?.get('paused') === 'true');

                if(title)
                {
                    setCurrentTrack({
                        id: 0,
                        title,
                        artist: params?.get('track_artist') || '',
                        url: params?.get('track_url') || '',
                        type: params?.get('track_type') || 'audio',
                        duration: parseInt(params?.get('duration') || '0', 10)
                    });
                    setStartedAt(parseInt(params?.get('started_at') || '0', 10));
                }
                else
                {
                    setCurrentTrack(null);
                    setStartedAt(0);
                }
                break;
            }
            case 'radio.track':
            {
                const title = params?.get('track_title') || '';
                setLooping(params?.get('looping') === 'true');
                setTransitionType(params?.get('transition') || transitionType);
                setCrossfadeMs(parseInt(params?.get('crossfade_ms') || String(crossfadeMs), 10));
                setQueue(parseQueue(params?.get('queue') || '[]'));

                if(title)
                {
                    setCurrentTrack({
                        id: 0,
                        title,
                        artist: params?.get('track_artist') || '',
                        url: params?.get('track_url') || '',
                        type: params?.get('track_type') || 'audio',
                        duration: parseInt(params?.get('duration') || '0', 10)
                    });
                    setStartedAt(parseInt(params?.get('started_at') || '0', 10));
                    setPaused(false);
                }
                else
                {
                    setCurrentTrack(null);
                    setStartedAt(0);
                    setPaused(false);
                    setLooping(false);
                }
                break;
            }
            case 'radio.pause':
            {
                const isPaused = params?.get('paused') === 'true';
                setPaused(isPaused);
                if(!isPaused)
                {
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    if(sAt > 0) setStartedAt(sAt);
                }
                break;
            }
            case 'radio.queue':
            {
                setQueue(parseQueue(params?.get('queue') || '[]'));
                break;
            }
            case 'radio.toggle':
            {
                setRadioEnabled(params?.get('enabled') === 'true');
                break;
            }
            case 'radio.playlists':
            {
                const json = params?.get('playlists_json') || '[]';
                setPlaylists(parsePlaylists(json));
                break;
            }
            case 'radio.playlist.tracks':
            {
                const playlistId = parseInt(params?.get('playlist_id') || '0', 10);
                const json = params?.get('tracks_json') || '[]';
                if(selectedPlaylist && selectedPlaylist.id === playlistId)
                {
                    setPlaylistTracks(parseQueue(json));
                }
                break;
            }
            case 'radio.tts.preview':
            {
                const audioChunks = parseInt(params?.get('audio_chunks') || '0', 10);
                const ttsUrl = audioChunks > 0
                    ? 'data:audio/mpeg;base64,' + Array.from({ length: audioChunks }, (_, i) => params?.get('audio_chunk_' + i) || '').join('')
                    : (params?.get('tts_url') || '');
                const ttsMsg = params?.get('tts_text') || '';
                if(ttsUrl)
                {
                    setTtsPreview({ url: ttsUrl, text: ttsMsg });
                    setTtsGenerating(false);
                    setTtsError('');
                }
                break;
            }
            case 'radio.tts.error':
            {
                setTtsError(params?.get('message') || 'TTS Fehler');
                setTtsGenerating(false);
                break;
            }
        }
    });

    // ── Progress bar ticker ──
    useEffect(() =>
    {
        if(progressTimerRef.current)
        {
            clearInterval(progressTimerRef.current); progressTimerRef.current = null;
        }

        if(!currentTrack)
        {
            setProgress(0);
            setTimeText('');
            return;
        }

        const update = () =>
        {
            const t = currentTrackRef.current;
            const sAt = startedAtRef.current;
            if(!t || !sAt) return;

            const elapsed = pausedRef.current ? 0 : Math.max(0, (Date.now() - sAt) / 1000);
            const pct = Math.min(100, (elapsed / t.duration) * 100);
            setProgress(pct);
            setTimeText(`${ formatTime(elapsed) } / ${ formatTime(t.duration) }`);
        };

        update();
        progressTimerRef.current = setInterval(update, 500);

        return () =>
        {
            if(progressTimerRef.current)
            {
                clearInterval(progressTimerRef.current); progressTimerRef.current = null;
            }
        };
    }, [ currentTrack, startedAt, paused ]);

    // ── Add track handler (auto-detect duration) ──
    const handleAddTrack = useCallback(() =>
    {
        if(!addUrl || !addTitle || !addArtist || addDetecting) return;
        setAddDetecting(true);

        const submitTrack = (dur: number) =>
        {
            if(addTarget === 'queue')
            {
                sendCommand(`:radio add ${ addUrl } ${ addTitle } ${ addArtist } ${ dur }`);
            }
            else
            {
                sendCommand(`:radio playlist add ${ addTarget } ${ addUrl } ${ addTitle } ${ addArtist }`);
            }
            setAddUrl('');
            setAddTitle('');
            setAddArtist('');
            setAddDetecting(false);
        };

        const ytId = extractYoutubeId(addUrl);
        if(ytId)
        {
            // For YouTube, detect duration via hidden player
            if(window.YT && window.YT.Player)
            {
                const tempDiv = document.createElement('div');
                tempDiv.id = 'yt-detect-' + Date.now();
                tempDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px';
                document.body.appendChild(tempDiv);

                new window.YT.Player(tempDiv.id,
                    {
                        height: '1',
                        width: '1',
                        videoId: ytId,
                        events:
                    {
                        onReady: (ev: any) =>
                        {
                            const dur = Math.ceil(ev.target.getDuration());
                            try
                            {
                                ev.target.destroy();
                            }
                            catch
                            {}
                            tempDiv.remove();
                            submitTrack(dur > 0 ? dur : 300);
                        }
                    }
                    });
            }
            else
            {
                submitTrack(300);
            }
        }
        else
        {
            const tempAudio = new Audio(addUrl);
            tempAudio.addEventListener('loadedmetadata', () =>
            {
                const dur = Math.ceil(tempAudio.duration);
                tempAudio.src = '';
                submitTrack(dur > 0 ? dur : 300);
            });
            tempAudio.addEventListener('error', () =>
            {
                submitTrack(300);
            });
        }
    }, [ addUrl, addTitle, addArtist, addTarget, addDetecting, sendCommand ]);

    // ── Don't render if not visible ──
    if(!isVisible) return null;

    const visibleTabs = TAB_ALL.filter(t => !t.staffOnly || isStaff);

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <AlignSurface.Panel className="w-[420px] max-w-[calc(100vw-24px)] overflow-hidden">
                <div className="drag-handler flex h-11 cursor-move select-none items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0 px-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-alpha-10 text-primary-base">
                            <Radio className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <div className="truncate text-label-sm text-text-strong-950">BAHHOS RADIO</div>
                            <div className="truncate text-paragraph-xs text-text-sub-600">
                                { radioEnabled ? 'Live' : 'Deaktiviert' }{ isStaff ? ' · Staff' : '' }
                            </div>
                        </div>
                    </div>
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="size-7 px-0"
                        onClick={ () => setIsVisible(false) }
                        onMouseDown={ (e) => e.stopPropagation() }
                    >
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                    { /* ── Tab Bar ── */ }
                    <div className="flex gap-1 overflow-x-auto">
                        { visibleTabs.map(tab => (
                            <AlignButton.Root
                                key={ tab.id }
                                type="button"
                                variant={ currentTab === tab.id ? 'primary' : 'neutral' }
                                mode={ currentTab === tab.id ? 'lighter' : 'ghost' }
                                size="xxsmall"
                                className="shrink-0 text-label-xs"
                                onClick={ () => setCurrentTab(tab.id) }
                            >
                                { tab.label }
                            </AlignButton.Root>
                        )) }
                    </div>
                </div>
                <div className="max-h-[560px] overflow-y-auto bg-bg-white-0 p-4">
                    { /* ── Tab: Now Playing ── */ }
                    { currentTab === 'playing' && (
                        <div className="space-y-4">
                            { !radioEnabled ? (
                                <EmptyState icon={ <Radio className="size-7" /> } message="Radio ist deaktiviert" tone="error" />
                            ) : currentTrack ? (
                                <>
                                    { /* Current Track */ }
                                    <div className="rounded-2xl bg-bg-weak-50 p-4 ring-1 ring-inset ring-stroke-soft-200">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-alpha-10 text-primary-base ring-1 ring-inset ring-primary-base/20">
                                                <Music className="size-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className="truncate text-label-sm text-text-strong-950">{ currentTrack.title }</div>
                                                    { looping && (
                                                        <AlignBadge.Root color="blue" variant="lighter" size="small">
                                                            <AlignBadge.Icon as={ Repeat } className="size-3" />
                                                            Loop
                                                        </AlignBadge.Root>
                                                    ) }
                                                </div>
                                                <div className="truncate text-paragraph-xs text-text-sub-600">{ currentTrack.artist }</div>
                                                <div className="mt-0.5 text-subheading-2xs uppercase text-text-soft-400">
                                                    { currentTrack.type === 'youtube' ? 'YouTube' : 'Audio' }
                                                </div>
                                            </div>
                                        </div>
                                        { /* Progress */ }
                                        <div className="mt-4 space-y-1.5">
                                            <AlignProgressBar.Root value={ progress } color="blue" />
                                            <div className="flex items-center justify-between text-subheading-2xs text-text-sub-600">
                                                <span>{ timeText }</span>
                                                { paused && <span className="font-medium text-warning-base">PAUSIERT</span> }
                                            </div>
                                        </div>
                                    </div>
                                    { /* Queue */ }
                                    <div>
                                        <div className="mb-2 text-subheading-2xs uppercase text-text-sub-600">
                                            Queue ({ queue.length })
                                        </div>
                                        { queue.length === 0 ? (
                                            <div className="rounded-xl bg-bg-weak-50 px-3 py-3 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">Queue ist leer</div>
                                        ) : (
                                            <div className="max-h-[200px] space-y-1 overflow-y-auto">
                                                { queue.map((t, i) => (
                                                    <div key={ `${ t.id }-${ i }` } className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-paragraph-xs transition-colors hover:bg-bg-weak-50">
                                                        <span className="w-5 shrink-0 text-right text-subheading-2xs text-text-soft-400">{ i + 1 }</span>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="block truncate text-text-strong-950">{ t.title } – { t.artist }</span>
                                                        </div>
                                                        <span className="shrink-0 text-subheading-2xs text-text-sub-600">{ formatTime(t.duration) }</span>
                                                    </div>
                                                )) }
                                            </div>
                                        ) }
                                    </div>
                                </>
                            ) : (
                                <EmptyState icon={ <Music className="size-7" /> } message="Kein Track wird abgespielt" />
                            ) }
                        </div>
                    ) }
                    { /* ── Tab: Playlisten ── */ }
                    { currentTab === 'playlists' && isStaff && (
                        <div className="space-y-4">
                            { !selectedPlaylist ? (
                                <>
                                    { /* Create new playlist */ }
                                    <div className="flex gap-2">
                                        <TextInput
                                            placeholder="Neue Playlist..."
                                            value={ newPlaylistName }
                                            onChange={ (e) => setNewPlaylistName(e.target.value) }
                                            className="flex-1"
                                            onKeyDown={ (e) =>
                                            {
                                                if(e.key === 'Enter' && newPlaylistName)
                                                {
                                                    sendCommand(`:radio playlist create ${ newPlaylistName }`);
                                                    setNewPlaylistName('');
                                                }
                                            } }
                                        />
                                        <AlignButton.Root
                                            type="button"
                                            variant="primary"
                                            mode="filled"
                                            size="xsmall"
                                            disabled={ !newPlaylistName }
                                            onClick={ () =>
                                            {
                                                if(newPlaylistName)
                                                {
                                                    sendCommand(`:radio playlist create ${ newPlaylistName }`);
                                                    setNewPlaylistName('');
                                                }
                                            } }
                                        >
                                            <AlignButton.Icon as={ Plus } className="size-4" />
                                            Erstellen
                                        </AlignButton.Root>
                                    </div>
                                    { /* Playlist list */ }
                                    { playlists.length === 0 ? (
                                        <EmptyState icon={ <ListMusic className="size-7" /> } message="Keine Playlisten vorhanden" />
                                    ) : (
                                        <div className="space-y-1.5">
                                            { playlists.map(pl => (
                                                <div
                                                    key={ pl.id }
                                                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-bg-weak-50 px-3 py-2 ring-1 ring-inset ring-stroke-soft-200 transition-colors hover:bg-bg-white-0"
                                                    onClick={ () =>
                                                    {
                                                        setSelectedPlaylist(pl); sendCommand(`:radio playlist show ${ pl.id }`);
                                                    } }
                                                >
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-alpha-10 text-primary-base">
                                                        <ListMusic className="size-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-label-xs text-text-strong-950">{ pl.name }</div>
                                                        <div className="text-subheading-2xs text-text-sub-600">{ pl.trackCount } Tracks</div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <AlignButton.Root
                                                            type="button"
                                                            variant="primary"
                                                            mode="lighter"
                                                            size="xxsmall"
                                                            onClick={ (e) =>
                                                            {
                                                                e.stopPropagation(); sendCommand(`:radio playlist load ${ pl.id }`);
                                                            } }
                                                            title="In Queue laden"
                                                        >
                                                            <AlignButton.Icon as={ Play } className="size-3.5" />
                                                            Load
                                                        </AlignButton.Root>
                                                        <AlignButton.Root
                                                            type="button"
                                                            variant="error"
                                                            mode="lighter"
                                                            size="xxsmall"
                                                            onClick={ (e) =>
                                                            {
                                                                e.stopPropagation(); sendCommand(`:radio playlist delete ${ pl.id }`);
                                                            } }
                                                            title="Loeschen"
                                                        >
                                                            <AlignButton.Icon as={ Trash2 } className="size-3.5" />
                                                        </AlignButton.Root>
                                                    </div>
                                                </div>
                                            )) }
                                        </div>
                                    ) }
                                </>
                            ) : (
                                <div className="space-y-3">
                                    { /* Back button + playlist name */ }
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlignButton.Root
                                            type="button"
                                            variant="neutral"
                                            mode="ghost"
                                            size="xxsmall"
                                            onClick={ () =>
                                            {
                                                setSelectedPlaylist(null); setPlaylistTracks([]);
                                            } }
                                        >
                                            <AlignButton.Icon as={ ArrowLeft } className="size-3.5" />
                                            Zurueck
                                        </AlignButton.Root>
                                        <div className="min-w-0 flex-1 truncate text-label-xs text-text-strong-950">{ selectedPlaylist.name }</div>
                                    </div>
                                    { /* Playlist tracks */ }
                                    { playlistTracks.length === 0 ? (
                                        <EmptyState icon={ <ListMusic className="size-7" /> } message="Playlist ist leer" />
                                    ) : (
                                        <div className="max-h-[300px] space-y-1 overflow-y-auto">
                                            { playlistTracks.map((t, i) => (
                                                <div key={ `${ t.id }-${ i }` } className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-weak-50">
                                                    <span className="w-5 shrink-0 text-right text-subheading-2xs text-text-soft-400">{ i + 1 }</span>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block truncate text-paragraph-xs text-text-strong-950">{ t.title }</span>
                                                        <span className="text-subheading-2xs text-text-sub-600">{ t.artist }</span>
                                                    </div>
                                                    <AlignButton.Root
                                                        type="button"
                                                        variant="error"
                                                        mode="ghost"
                                                        size="xxsmall"
                                                        className="size-7 px-0 opacity-0 transition-opacity group-hover:opacity-100"
                                                        onClick={ () => sendCommand(`:radio playlist remove ${ selectedPlaylist.id } ${ i + 1 }`) }
                                                    >
                                                        <AlignButton.Icon as={ X } className="size-3.5" />
                                                    </AlignButton.Root>
                                                </div>
                                            )) }
                                        </div>
                                    ) }
                                    { /* Load playlist to queue */ }
                                    <div className="border-t border-stroke-soft-200 pt-3">
                                        <AlignButton.Root
                                            type="button"
                                            variant="primary"
                                            mode="lighter"
                                            size="xsmall"
                                            className="w-full"
                                            onClick={ () => sendCommand(`:radio playlist load ${ selectedPlaylist.id }`) }
                                        >
                                            <AlignButton.Icon as={ Play } className="size-4" />
                                            Alle in Queue laden
                                        </AlignButton.Root>
                                    </div>
                                </div>
                            ) }
                        </div>
                    ) }
                    { /* ── Tab: Track hinzufuegen ── */ }
                    { currentTab === 'addtrack' && isStaff && (
                        <div className="space-y-3">
                            <div>
                                <FieldLabel>URL</FieldLabel>
                                <TextInput
                                    placeholder="YouTube URL oder MP3 Link..."
                                    value={ addUrl }
                                    onChange={ (e) => setAddUrl(e.target.value) }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Titel</FieldLabel>
                                    <TextInput
                                        placeholder="Track Titel"
                                        value={ addTitle }
                                        onChange={ (e) => setAddTitle(e.target.value) }
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Artist</FieldLabel>
                                    <TextInput
                                        placeholder="Artist Name"
                                        value={ addArtist }
                                        onChange={ (e) => setAddArtist(e.target.value) }
                                    />
                                </div>
                            </div>
                            <div>
                                <FieldLabel>Ziel</FieldLabel>
                                <AlignSelect.Root
                                    size="xsmall"
                                    value={ addTarget === 'queue' ? 'queue' : String(addTarget) }
                                    onValueChange={ (value) => setAddTarget(value === 'queue' ? 'queue' : parseInt(value, 10)) }
                                >
                                    <AlignSelect.Trigger>
                                        <AlignSelect.Value />
                                    </AlignSelect.Trigger>
                                    <AlignSelect.Content>
                                        <AlignSelect.Item value="queue">Zur Queue hinzufuegen</AlignSelect.Item>
                                        { playlists.map(pl => (
                                            <AlignSelect.Item key={ pl.id } value={ String(pl.id) }>Playlist: { pl.name }</AlignSelect.Item>
                                        )) }
                                    </AlignSelect.Content>
                                </AlignSelect.Root>
                            </div>
                            <AlignButton.Root
                                type="button"
                                variant="primary"
                                mode="filled"
                                size="small"
                                className="w-full"
                                onClick={ handleAddTrack }
                                disabled={ addDetecting || !addUrl || !addTitle || !addArtist }
                            >
                                <AlignButton.Icon as={ addDetecting ? Loader2 : Plus } className={ addDetecting ? 'size-4 animate-spin' : 'size-4' } />
                                { addDetecting ? 'Erkennung...' : 'Track hinzufuegen' }
                            </AlignButton.Root>
                        </div>
                    ) }
                    { /* ── Tab: DJ Controls ── */ }
                    { currentTab === 'controls' && isStaff && (
                        <div className="space-y-4">
                            { /* Playback Controls */ }
                            <div>
                                <div className="mb-2 text-subheading-2xs uppercase text-text-sub-600">Playback</div>
                                <div className="flex flex-wrap gap-1.5">
                                    <AlignButton.Root
                                        type="button"
                                        variant={ radioEnabled ? 'error' : 'primary' }
                                        mode="lighter"
                                        size="xsmall"
                                        onClick={ () => sendCommand(radioEnabled ? ':radio off' : ':radio on') }
                                    >
                                        <AlignButton.Icon as={ Power } className="size-4" />
                                        { radioEnabled ? '⏻ Radio Aus' : '⏻ Radio Ein' }
                                    </AlignButton.Root>
                                    <AlignButton.Root
                                        type="button"
                                        variant={ loopEnabled ? 'primary' : 'neutral' }
                                        mode="lighter"
                                        size="xsmall"
                                        onClick={ () => sendCommand(loopEnabled ? ':radio loop off' : ':radio loop on') }
                                    >
                                        <AlignButton.Icon as={ Repeat } className="size-4" />
                                        Loop { loopEnabled ? 'An' : 'Aus' }
                                    </AlignButton.Root>
                                    { radioEnabled && (
                                        <>
                                            { !currentTrack && queue.length > 0 && (
                                                <AlignButton.Root type="button" variant="primary" mode="lighter" size="xsmall" onClick={ () => sendCommand(':radio play') }>
                                                    <AlignButton.Icon as={ Play } className="size-4" />
                                                    Start
                                                </AlignButton.Root>
                                            ) }
                                            { currentTrack && (
                                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xsmall" onClick={ () => sendCommand(paused ? ':radio play' : ':radio pause') }>
                                                    <AlignButton.Icon as={ paused ? Play : Pause } className="size-4" />
                                                    { paused ? 'Play' : 'Pause' }
                                                </AlignButton.Root>
                                            ) }
                                            { currentTrack && (
                                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xsmall" onClick={ () => sendCommand(':radio skip') }>
                                                    <AlignButton.Icon as={ SkipForward } className="size-4" />
                                                    Skip
                                                </AlignButton.Root>
                                            ) }
                                            { queue.length > 0 && (
                                                <AlignButton.Root type="button" variant="error" mode="lighter" size="xsmall" onClick={ () => sendCommand(':radio clear') }>
                                                    <AlignButton.Icon as={ Trash2 } className="size-4" />
                                                    Clear
                                                </AlignButton.Root>
                                            ) }
                                        </>
                                    ) }
                                </div>
                            </div>
                            { /* Transition Info */ }
                            <div className="rounded-xl bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                                Transition: { transitionType } ({ crossfadeMs }ms)
                            </div>
                            { /* SFX */ }
                            { radioEnabled && (
                                <div className="border-t border-stroke-soft-200 pt-3">
                                    <div className="mb-2 text-subheading-2xs uppercase text-text-sub-600">Sound Effect</div>
                                    <div className="flex gap-2">
                                        <TextInput
                                            placeholder="SFX URL (MP3)..."
                                            value={ sfxUrl }
                                            onChange={ (e) => setSfxUrl(e.target.value) }
                                            className="flex-1"
                                        />
                                        <AlignButton.Root
                                            type="button"
                                            variant="neutral"
                                            mode="stroke"
                                            size="xsmall"
                                            onClick={ () =>
                                            {
                                                if(sfxUrl)
                                                {
                                                    sendCommand(`:radio sfx ${ sfxUrl }`); setSfxUrl('');
                                                }
                                            } }
                                        >
                                            <AlignButton.Icon as={ Volume2 } className="size-4" />
                                            Play
                                        </AlignButton.Root>
                                    </div>
                                </div>
                            ) }
                            { /* TTS Durchsage */ }
                            { radioEnabled && (
                                <div className="border-t border-stroke-soft-200 pt-3">
                                    <div className="mb-2 text-subheading-2xs uppercase text-text-sub-600">Durchsage (TTS)</div>
                                    { !ttsPreview ? (
                                        <>
                                            <div className="flex gap-2">
                                                <TextInput
                                                    placeholder="Durchsage-Text eingeben..."
                                                    value={ ttsText }
                                                    onChange={ (e) => setTtsText(e.target.value) }
                                                    className="flex-1"
                                                    onKeyDown={ (e) =>
                                                    {
                                                        if(e.key === 'Enter' && ttsText && !ttsGenerating)
                                                        {
                                                            setTtsGenerating(true);
                                                            setTtsError('');
                                                            sendCommand(`:radio tts ${ ttsText }`);
                                                        }
                                                    } }
                                                />
                                                <AlignButton.Root
                                                    type="button"
                                                    variant="primary"
                                                    mode="lighter"
                                                    size="xsmall"
                                                    disabled={ !ttsText || ttsGenerating }
                                                    onClick={ () =>
                                                    {
                                                        if(ttsText && !ttsGenerating)
                                                        {
                                                            setTtsGenerating(true);
                                                            setTtsError('');
                                                            sendCommand(`:radio tts ${ ttsText }`);
                                                        }
                                                    } }
                                                >
                                                    <AlignButton.Icon as={ ttsGenerating ? Loader2 : Megaphone } className={ ttsGenerating ? 'size-4 animate-spin' : 'size-4' } />
                                                    { ttsGenerating ? '...' : 'Generieren' }
                                                </AlignButton.Root>
                                            </div>
                                            { ttsError && (
                                                <div className="mt-2 rounded-lg bg-error-lighter px-2 py-1.5 text-paragraph-xs text-error-base ring-1 ring-inset ring-error-light">{ ttsError }</div>
                                            ) }
                                        </>
                                    ) : (
                                        <div className="space-y-2 rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                                            <div className="truncate text-paragraph-xs text-text-sub-600">
                                                &quot;{ ttsPreview.text }&quot;
                                            </div>
                                            <audio
                                                src={ ttsPreview.url }
                                                controls
                                                className="h-8 w-full"
                                            />
                                            <div className="flex gap-2">
                                                <AlignButton.Root
                                                    type="button"
                                                    variant="primary"
                                                    mode="filled"
                                                    size="xsmall"
                                                    className="flex-1"
                                                    onClick={ () =>
                                                    {
                                                        sendCommand(':radio tts confirm'); setTtsPreview(null); setTtsText('');
                                                    } }
                                                >
                                                    <AlignButton.Icon as={ Check } className="size-4" />
                                                    Senden
                                                </AlignButton.Root>
                                                <AlignButton.Root
                                                    type="button"
                                                    variant="error"
                                                    mode="lighter"
                                                    size="xsmall"
                                                    className="flex-1"
                                                    onClick={ () =>
                                                    {
                                                        sendCommand(':radio tts cancel'); setTtsPreview(null);
                                                    } }
                                                >
                                                    Abbrechen
                                                </AlignButton.Root>
                                            </div>
                                        </div>
                                    ) }
                                </div>
                            ) }
                        </div>
                    ) }
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
};
