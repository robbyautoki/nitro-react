import { ILinkEventTracker, NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, CreateLinkEvent, GetRoomSession, RemoveLinkEventTracker } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';

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
    try { return JSON.parse(json || '[]'); }
    catch { return []; }
};

const parsePlaylists = (json: string): Playlist[] =>
{
    try { return JSON.parse(json || '[]'); }
    catch { return []; }
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
        catch {}
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
                const ttsUrl = params?.get('tts_url') || '';
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
        if(progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }

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

        return () => { if(progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; } };
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
                            try { ev.target.destroy(); } catch {}
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

    // ── Shared input class ──
    const inputClass = 'w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-white/5 border border-white/[0.08] text-white/80 placeholder:text-white/25 outline-none focus:border-white/20 transition-colors';
    const btnClass = 'px-3 py-1.5 text-[11px] rounded-lg font-medium transition-colors';

    return (
        <NitroCardView uniqueKey="radio" className="nitro-radio" style={{ width: '420px' }}>
            <NitroCardHeaderView headerText="BAHHOS RADIO" onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView>
                <div className="flex flex-col h-full">
                    {/* ── Tab Bar ── */}
                    <div className="flex gap-1 mb-3 border-b border-white/[0.06] pb-2">
                        { visibleTabs.map(tab => (
                            <button
                                key={ tab.id }
                                onClick={ () => setCurrentTab(tab.id) }
                                className={ `px-3 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
                                    currentTab === tab.id
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }` }
                            >
                                { tab.label }
                            </button>
                        )) }
                    </div>

                    {/* ── Tab: Now Playing ── */}
                    { currentTab === 'playing' && (
                        <div className="flex-1 overflow-y-auto">
                            { !radioEnabled ? (
                                <div className="text-center py-8">
                                    <div className="text-3xl mb-2 opacity-30">📻</div>
                                    <div className="text-xs text-red-400/60 italic">Radio ist deaktiviert</div>
                                </div>
                            ) : currentTrack ? (
                                <div>
                                    {/* Current Track */}
                                    <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] rounded-xl p-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-2xl shrink-0">
                                                🎵
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-white/90 truncate">
                                                    { currentTrack.title }
                                                    { looping && <span className="ml-1.5 text-blue-300 text-[10px]">🔁</span> }
                                                </div>
                                                <div className="text-xs text-white/50 truncate">{ currentTrack.artist }</div>
                                                <div className="text-[10px] text-white/30 mt-0.5">
                                                    { currentTrack.type === 'youtube' ? 'YouTube' : 'Audio' }
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-3">
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-400/60 to-blue-400/60 rounded-full transition-all duration-500 ease-linear"
                                                    style={{ width: `${ progress }%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-white/40">{ timeText }</span>
                                                { paused && <span className="text-[10px] text-amber-300 font-medium">PAUSIERT</span> }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Queue */}
                                    <div>
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                                            Queue ({ queue.length })
                                        </div>
                                        { queue.length === 0 ? (
                                            <div className="text-xs text-white/25 italic py-2">Queue ist leer</div>
                                        ) : (
                                            <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                                                { queue.map((t, i) => (
                                                    <div key={ `${ t.id }-${ i }` } className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                        <span className="text-[10px] text-white/30 w-4 text-right">{ i + 1 }</span>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="text-xs text-white/60 truncate block">{ t.title } – { t.artist }</span>
                                                        </div>
                                                        <span className="text-[10px] text-white/25 shrink-0">{ formatTime(t.duration) }</span>
                                                    </div>
                                                )) }
                                            </div>
                                        ) }
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-3xl mb-2 opacity-30">🎵</div>
                                    <div className="text-xs text-white/30 italic">Kein Track wird abgespielt</div>
                                </div>
                            ) }
                        </div>
                    ) }

                    {/* ── Tab: Playlisten ── */}
                    { currentTab === 'playlists' && isStaff && (
                        <div className="flex-1 overflow-y-auto">
                            { !selectedPlaylist ? (
                                <div>
                                    {/* Create new playlist */}
                                    <div className="flex gap-1.5 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Neue Playlist..."
                                            value={ newPlaylistName }
                                            onChange={ (e) => setNewPlaylistName(e.target.value) }
                                            className={ inputClass + ' flex-1' }
                                            onKeyDown={ (e) => { if(e.key === 'Enter' && newPlaylistName) { sendCommand(`:radio playlist create ${ newPlaylistName }`); setNewPlaylistName(''); } } }
                                        />
                                        <button
                                            onClick={ () => { if(newPlaylistName) { sendCommand(`:radio playlist create ${ newPlaylistName }`); setNewPlaylistName(''); } } }
                                            disabled={ !newPlaylistName }
                                            className={ `${ btnClass } bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 disabled:opacity-30` }
                                        >
                                            + Erstellen
                                        </button>
                                    </div>

                                    {/* Playlist list */}
                                    { playlists.length === 0 ? (
                                        <div className="text-center py-6">
                                            <div className="text-2xl mb-2 opacity-30">📋</div>
                                            <div className="text-xs text-white/30 italic">Keine Playlisten vorhanden</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            { playlists.map(pl => (
                                                <div
                                                    key={ pl.id }
                                                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    onClick={ () => { setSelectedPlaylist(pl); sendCommand(`:radio playlist show ${ pl.id }`); } }
                                                >
                                                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm">
                                                        🎶
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-white/80 truncate">{ pl.name }</div>
                                                        <div className="text-[10px] text-white/30">{ pl.trackCount } Tracks</div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={ (e) => { e.stopPropagation(); sendCommand(`:radio playlist load ${ pl.id }`); } }
                                                            className="px-2 py-1 text-[10px] rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors"
                                                            title="In Queue laden"
                                                        >
                                                            ▶ Load
                                                        </button>
                                                        <button
                                                            onClick={ (e) => { e.stopPropagation(); sendCommand(`:radio playlist delete ${ pl.id }`); } }
                                                            className="px-2 py-1 text-[10px] rounded bg-red-500/15 hover:bg-red-500/25 text-red-300/80 transition-colors"
                                                            title="Loeschen"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )) }
                                        </div>
                                    ) }
                                </div>
                            ) : (
                                <div>
                                    {/* Back button + playlist name */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <button
                                            onClick={ () => { setSelectedPlaylist(null); setPlaylistTracks([]); } }
                                            className="text-xs text-white/40 hover:text-white/80 transition-colors"
                                        >
                                            ← Zurueck
                                        </button>
                                        <div className="text-xs font-semibold text-white/80">{ selectedPlaylist.name }</div>
                                    </div>

                                    {/* Playlist tracks */}
                                    { playlistTracks.length === 0 ? (
                                        <div className="text-center py-6">
                                            <div className="text-xs text-white/30 italic">Playlist ist leer</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                                            { playlistTracks.map((t, i) => (
                                                <div key={ `${ t.id }-${ i }` } className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                                                    <span className="text-[10px] text-white/30 w-4 text-right">{ i + 1 }</span>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs text-white/60 truncate block">{ t.title }</span>
                                                        <span className="text-[10px] text-white/30">{ t.artist }</span>
                                                    </div>
                                                    <button
                                                        onClick={ () => sendCommand(`:radio playlist remove ${ selectedPlaylist.id } ${ i + 1 }`) }
                                                        className="text-[10px] text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )) }
                                        </div>
                                    ) }

                                    {/* Load playlist to queue */}
                                    <div className="mt-3 pt-2 border-t border-white/[0.06]">
                                        <button
                                            onClick={ () => sendCommand(`:radio playlist load ${ selectedPlaylist.id }`) }
                                            className={ `w-full ${ btnClass } bg-blue-500/20 hover:bg-blue-500/30 text-blue-300` }
                                        >
                                            ▶ Alle in Queue laden
                                        </button>
                                    </div>
                                </div>
                            ) }
                        </div>
                    ) }

                    {/* ── Tab: Track hinzufuegen ── */}
                    { currentTab === 'addtrack' && isStaff && (
                        <div className="flex-1">
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">URL</label>
                                    <input
                                        type="text"
                                        placeholder="YouTube URL oder MP3 Link..."
                                        value={ addUrl }
                                        onChange={ (e) => setAddUrl(e.target.value) }
                                        className={ inputClass }
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Titel</label>
                                        <input
                                            type="text"
                                            placeholder="Track Titel"
                                            value={ addTitle }
                                            onChange={ (e) => setAddTitle(e.target.value) }
                                            className={ inputClass }
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Artist</label>
                                        <input
                                            type="text"
                                            placeholder="Artist Name"
                                            value={ addArtist }
                                            onChange={ (e) => setAddArtist(e.target.value) }
                                            className={ inputClass }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Ziel</label>
                                    <select
                                        value={ addTarget === 'queue' ? 'queue' : String(addTarget) }
                                        onChange={ (e) => setAddTarget(e.target.value === 'queue' ? 'queue' : parseInt(e.target.value)) }
                                        className={ inputClass + ' cursor-pointer' }
                                    >
                                        <option value="queue">Zur Queue hinzufuegen</option>
                                        { playlists.map(pl => (
                                            <option key={ pl.id } value={ pl.id }>Playlist: { pl.name }</option>
                                        )) }
                                    </select>
                                </div>

                                <button
                                    onClick={ handleAddTrack }
                                    disabled={ addDetecting || !addUrl || !addTitle || !addArtist }
                                    className={ `w-full ${ btnClass } ${
                                        addDetecting
                                            ? 'bg-white/5 text-white/30 cursor-wait'
                                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                                    }` }
                                >
                                    { addDetecting ? 'Erkennung...' : '+ Track hinzufuegen' }
                                </button>
                            </div>
                        </div>
                    ) }

                    {/* ── Tab: DJ Controls ── */}
                    { currentTab === 'controls' && isStaff && (
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {/* Playback Controls */}
                            <div>
                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Playback</div>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        onClick={ () => sendCommand(radioEnabled ? ':radio off' : ':radio on') }
                                        className={ `${ btnClass } ${
                                            radioEnabled
                                                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300/80'
                                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                        }` }
                                    >
                                        { radioEnabled ? '⏻ Radio Aus' : '⏻ Radio Ein' }
                                    </button>
                                    <button
                                        onClick={ () => sendCommand(loopEnabled ? ':radio loop off' : ':radio loop on') }
                                        className={ `${ btnClass } ${
                                            loopEnabled
                                                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                                                : 'bg-white/10 hover:bg-white/15 text-white/50'
                                        }` }
                                    >
                                        🔁 Loop { loopEnabled ? 'An' : 'Aus' }
                                    </button>
                                    { radioEnabled && (
                                        <>
                                            { !currentTrack && queue.length > 0 && (
                                                <button onClick={ () => sendCommand(':radio play') } className={ `${ btnClass } bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300` }>
                                                    ▶ Start
                                                </button>
                                            ) }
                                            { currentTrack && (
                                                <button onClick={ () => sendCommand(paused ? ':radio play' : ':radio pause') } className={ `${ btnClass } bg-white/10 hover:bg-white/15 text-white/80` }>
                                                    { paused ? '▶ Play' : '⏸ Pause' }
                                                </button>
                                            ) }
                                            { currentTrack && (
                                                <button onClick={ () => sendCommand(':radio skip') } className={ `${ btnClass } bg-white/10 hover:bg-white/15 text-white/80` }>
                                                    ⏭ Skip
                                                </button>
                                            ) }
                                            { queue.length > 0 && (
                                                <button onClick={ () => sendCommand(':radio clear') } className={ `${ btnClass } bg-red-500/15 hover:bg-red-500/25 text-red-300/80` }>
                                                    ✕ Clear
                                                </button>
                                            ) }
                                        </>
                                    ) }
                                </div>
                            </div>

                            {/* Transition Info */}
                            <div className="text-[10px] text-white/30">
                                Transition: { transitionType } ({ crossfadeMs }ms)
                            </div>

                            {/* SFX */}
                            { radioEnabled && (
                                <div className="border-t border-white/[0.06] pt-2">
                                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Sound Effect</div>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            placeholder="SFX URL (MP3)..."
                                            value={ sfxUrl }
                                            onChange={ (e) => setSfxUrl(e.target.value) }
                                            className={ inputClass + ' flex-1' }
                                        />
                                        <button
                                            onClick={ () => { if(sfxUrl) { sendCommand(`:radio sfx ${ sfxUrl }`); setSfxUrl(''); } } }
                                            className={ `${ btnClass } bg-amber-500/20 hover:bg-amber-500/30 text-amber-300` }
                                        >
                                            ▶ Play
                                        </button>
                                    </div>
                                </div>
                            ) }

                            {/* TTS Durchsage */}
                            { radioEnabled && (
                                <div className="border-t border-white/[0.06] pt-2">
                                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Durchsage (TTS)</div>

                                    { !ttsPreview ? (
                                        <>
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="Durchsage-Text eingeben..."
                                                    value={ ttsText }
                                                    onChange={ (e) => setTtsText(e.target.value) }
                                                    className={ inputClass + ' flex-1' }
                                                    onKeyDown={ (e) => { if(e.key === 'Enter' && ttsText && !ttsGenerating) { setTtsGenerating(true); setTtsError(''); sendCommand(`:radio tts ${ ttsText }`); } } }
                                                />
                                                <button
                                                    onClick={ () => { if(ttsText && !ttsGenerating) { setTtsGenerating(true); setTtsError(''); sendCommand(`:radio tts ${ ttsText }`); } } }
                                                    disabled={ !ttsText || ttsGenerating }
                                                    className={ `${ btnClass } ${
                                                        ttsGenerating
                                                            ? 'bg-white/5 text-white/30 cursor-wait'
                                                            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300'
                                                    }` }
                                                >
                                                    { ttsGenerating ? '...' : 'Generieren' }
                                                </button>
                                            </div>
                                            { ttsError && (
                                                <div className="mt-1 text-[10px] text-red-400/80">{ ttsError }</div>
                                            ) }
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-[11px] text-white/60 italic truncate">
                                                &quot;{ ttsPreview.text }&quot;
                                            </div>
                                            <audio
                                                src={ ttsPreview.url }
                                                controls
                                                className="w-full h-7 opacity-80"
                                                style={{ filter: 'invert(1) hue-rotate(180deg)', maxHeight: '28px' }}
                                            />
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={ () => { sendCommand(':radio tts confirm'); setTtsPreview(null); setTtsText(''); } }
                                                    className={ `flex-1 ${ btnClass } bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300` }
                                                >
                                                    Senden
                                                </button>
                                                <button
                                                    onClick={ () => { sendCommand(':radio tts cancel'); setTtsPreview(null); } }
                                                    className={ `flex-1 ${ btnClass } bg-red-500/15 hover:bg-red-500/25 text-red-300/80` }
                                                >
                                                    Abbrechen
                                                </button>
                                            </div>
                                        </div>
                                    ) }
                                </div>
                            ) }
                        </div>
                    ) }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
