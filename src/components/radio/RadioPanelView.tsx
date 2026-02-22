import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CreateLinkEvent, GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { TextGif } from '../../components/ui/text-gif';

/* YouTube IFrame API global types */
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | null;
    }
}

interface RadioTrack {
    id: number;
    title: string;
    artist: string;
    url: string;
    type: string;
    duration: number;
}

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

const parseQueue = (json: string): RadioTrack[] =>
{
    try { return JSON.parse(json || '[]'); }
    catch { return []; }
};

let ytApiLoading = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

const ensureYTApi = (cb: () => void) =>
{
    if(ytApiReady && window.YT && window.YT.Player)
    {
        cb();
        return;
    }

    ytApiCallbacks.push(cb);

    if(!ytApiLoading)
    {
        ytApiLoading = true;
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () =>
        {
            ytApiReady = true;
            if(prev) prev();
            ytApiCallbacks.forEach(fn => fn());
            ytApiCallbacks.length = 0;
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }
};

export const RadioPanelView: FC<{}> = () =>
{
    // ── Server State ──
    const [ currentTrack, setCurrentTrack ] = useState<RadioTrack | null>(null);
    const [ startedAt, setStartedAt ] = useState(0);
    const [ paused, setPaused ] = useState(false);
    const [ isStaff, setIsStaff ] = useState(false);
    const [ radioEnabled, setRadioEnabled ] = useState(true);
    const [ looping, setLooping ] = useState(false);

    // ── Local UI State ──
    const [ volume, setVolume ] = useState(0.5);
    const [ muted, setMuted ] = useState(false);
    const [ isInIframe, setIsInIframe ] = useState(false);
    const [ needsInteraction, setNeedsInteraction ] = useState(false);
    const [ announcement, setAnnouncement ] = useState<{ message: string; djName: string } | null>(null);

    // ── Refs ──
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ytPlayerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);
    const ytContainerRef = useRef<HTMLDivElement | null>(null);
    const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const volumeRef = useRef(0.5);
    const mutedRef = useRef(false);
    const pausedRef = useRef(false);

    // ── iframe detection ──
    useEffect(() =>
    {
        try { setIsInIframe(window !== window.parent); }
        catch { setIsInIframe(true); }
    }, []);

    // Keep refs in sync
    volumeRef.current = volume;
    mutedRef.current = muted;
    pausedRef.current = paused;

    // ── Stop all playback ──
    const stopPlayback = useCallback(() =>
    {
        if(audioRef.current)
        {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        if(ytPlayerRef.current && ytReadyRef.current)
        {
            try { ytPlayerRef.current.destroy(); } catch {}
            ytPlayerRef.current = null;
            ytReadyRef.current = false;
        }
    }, []);

    // ── Prepare YouTube container (safe DOM methods) ──
    const prepareYTContainer = useCallback(() =>
    {
        if(!ytContainerRef.current) return;
        while(ytContainerRef.current.firstChild)
        {
            ytContainerRef.current.removeChild(ytContainerRef.current.firstChild);
        }
        const playerDiv = document.createElement('div');
        playerDiv.id = 'yt-radio-player';
        ytContainerRef.current.appendChild(playerDiv);
    }, []);

    // ── Play a track ──
    const playTrack = useCallback((track: RadioTrack, sAt: number, isPaused: boolean) =>
    {
        stopPlayback();

        if(!track || !track.url) return;

        const elapsed = isPaused ? 0 : Math.max(0, (Date.now() - sAt) / 1000);
        const vol = mutedRef.current ? 0 : volumeRef.current;

        if(track.type === 'youtube')
        {
            const videoId = extractYoutubeId(track.url);
            if(!videoId) return;

            ensureYTApi(() =>
            {
                prepareYTContainer();

                ytReadyRef.current = false;
                ytPlayerRef.current = new window.YT.Player('yt-radio-player',
                {
                    height: '1',
                    width: '1',
                    videoId,
                    playerVars: { autoplay: isPaused ? 0 : 1, start: Math.floor(elapsed) },
                    events:
                    {
                        onReady: (ev: any) =>
                        {
                            ytReadyRef.current = true;
                            ev.target.setVolume(vol * 100);
                            if(!isPaused) ev.target.playVideo();
                        }
                    }
                });
            });
        }
        else
        {
            const audio = new Audio(track.url);
            audio.volume = vol;
            audioRef.current = audio;

            audio.addEventListener('loadedmetadata', () =>
            {
                audio.currentTime = Math.min(elapsed, track.duration);
            });

            if(!isPaused)
            {
                audio.play().then(() =>
                {
                    setNeedsInteraction(false);
                }).catch(() =>
                {
                    setNeedsInteraction(true);
                });
            }
        }
    }, [ stopPlayback, prepareYTContainer ]);

    // ── Handle user click to unlock autoplay ──
    const handleUnlock = useCallback(() =>
    {
        setNeedsInteraction(false);
        if(audioRef.current && !pausedRef.current)
        {
            audioRef.current.play().catch(() => {});
        }
        if(ytPlayerRef.current && ytReadyRef.current && !pausedRef.current)
        {
            try { ytPlayerRef.current.playVideo(); } catch {}
        }
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
                const staff = params?.get('is_staff') === 'true';
                setIsStaff(staff);
                setRadioEnabled(params?.get('enabled') !== 'false');

                const isPaused = params?.get('paused') === 'true';
                const isEnabled = params?.get('enabled') !== 'false';
                setPaused(isPaused);

                if(title && isEnabled)
                {
                    const track: RadioTrack = {
                        id: 0,
                        title,
                        artist: params?.get('track_artist') || '',
                        url: params?.get('track_url') || '',
                        type: params?.get('track_type') || 'audio',
                        duration: parseInt(params?.get('duration') || '0', 10)
                    };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track);
                    setStartedAt(sAt);
                    playTrack(track, sAt, isPaused);
                }
                else
                {
                    setCurrentTrack(null);
                    setStartedAt(0);
                    stopPlayback();
                }
                break;
            }
            case 'radio.track':
            {
                const title = params?.get('track_title') || '';
                const isLoop = params?.get('looping') === 'true';
                setLooping(isLoop);

                if(title)
                {
                    const track: RadioTrack = {
                        id: 0,
                        title,
                        artist: params?.get('track_artist') || '',
                        url: params?.get('track_url') || '',
                        type: params?.get('track_type') || 'audio',
                        duration: parseInt(params?.get('duration') || '0', 10)
                    };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track);
                    setStartedAt(sAt);
                    setPaused(false);
                    playTrack(track, sAt, false);
                }
                else
                {
                    setCurrentTrack(null);
                    setStartedAt(0);
                    setPaused(false);
                    setLooping(false);
                    stopPlayback();
                }
                break;
            }
            case 'radio.pause':
            {
                const isPaused = params?.get('paused') === 'true';
                setPaused(isPaused);

                if(isPaused)
                {
                    if(audioRef.current) audioRef.current.pause();
                    if(ytPlayerRef.current && ytReadyRef.current)
                    {
                        try { ytPlayerRef.current.pauseVideo(); } catch {}
                    }
                }
                else
                {
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    if(sAt > 0) setStartedAt(sAt);

                    if(audioRef.current)
                    {
                        const elapsed = (Date.now() - sAt) / 1000;
                        audioRef.current.currentTime = elapsed;
                        audioRef.current.play().catch(() => {});
                    }
                    if(ytPlayerRef.current && ytReadyRef.current)
                    {
                        const elapsed = (Date.now() - sAt) / 1000;
                        try { ytPlayerRef.current.seekTo(elapsed); ytPlayerRef.current.playVideo(); } catch {}
                    }
                }
                break;
            }
            case 'radio.sfx':
            {
                const sfxUrl = params?.get('sfx_url') || '';
                if(sfxUrl)
                {
                    const sfxAudio = new Audio(sfxUrl);
                    sfxAudio.volume = mutedRef.current ? 0 : volumeRef.current;
                    sfxAudio.play().catch(() => {});
                }
                break;
            }
            case 'radio.announce':
            {
                const message = params?.get('message') || '';
                const djName = params?.get('dj_name') || 'DJ';
                const duckMs = parseInt(params?.get('duck_ms') || '5000', 10);
                const audioChunks = parseInt(params?.get('audio_chunks') || '0', 10);
                const audioUrl = audioChunks > 0
                    ? 'data:audio/mpeg;base64,' + Array.from({ length: audioChunks }, (_, i) => params?.get('audio_chunk_' + i) || '').join('')
                    : (params?.get('audio_url') || '');

                if(message)
                {
                    const originalVolume = volumeRef.current;
                    const originalMuted = mutedRef.current;
                    const duckTarget = 0.15;
                    const fadeSteps = 30;
                    const fadeDownStepMs = 50;   // 30 x 50 = 1500ms (1.5s) fade down
                    const fadeUpStepMs = 65;     // 30 x 65 = ~2s fade up

                    // Smooth fade down (1.5s)
                    let step = 0;
                    const fadeDown = setInterval(() =>
                    {
                        step++;
                        const newVol = originalMuted ? 0 : originalVolume - (originalVolume - duckTarget) * (step / fadeSteps);
                        if(audioRef.current) audioRef.current.volume = Math.max(0, newVol);
                        if(ytPlayerRef.current && ytReadyRef.current)
                        {
                            try { ytPlayerRef.current.setVolume(Math.max(0, newVol * 100)); } catch {}
                        }
                        if(step >= fadeSteps) clearInterval(fadeDown);
                    }, fadeDownStepMs);

                    // Play TTS audio if provided (after fade starts, with fade-in/out)
                    if(audioUrl)
                    {
                        setTimeout(() =>
                        {
                            const ttsAudio = new Audio(audioUrl);
                            const ttsMaxVol = mutedRef.current ? 0 : 1.0;
                            ttsAudio.volume = 0;
                            ttsAudio.play().catch(() => {});

                            // Fade in (400ms)
                            let ttsStep = 0;
                            const ttsFadeIn = setInterval(() =>
                            {
                                ttsStep++;
                                ttsAudio.volume = Math.min(ttsMaxVol, ttsMaxVol * (ttsStep / 20));
                                if(ttsStep >= 20) clearInterval(ttsFadeIn);
                            }, 20);

                            // Fade out before end (2s)
                            setTimeout(() =>
                            {
                                let outStep = 0;
                                const ttsFadeOut = setInterval(() =>
                                {
                                    outStep++;
                                    ttsAudio.volume = Math.max(0, ttsMaxVol * (1 - outStep / 50));
                                    if(outStep >= 50) clearInterval(ttsFadeOut);
                                }, 40);
                            }, Math.max(0, duckMs - 800 - 2000));
                        }, 800);
                    }

                    // Show announcement
                    setAnnouncement({ message, djName });

                    // Clear any existing timer
                    if(announcementTimerRef.current) clearTimeout(announcementTimerRef.current);

                    // After duckMs, fade back up (~2s) and hide announcement
                    announcementTimerRef.current = setTimeout(() =>
                    {
                        setAnnouncement(null);
                        let upStep = 0;
                        const restoreVol = originalMuted ? 0 : originalVolume;
                        const fadeUp = setInterval(() =>
                        {
                            upStep++;
                            const newVol = duckTarget + (restoreVol - duckTarget) * (upStep / fadeSteps);
                            if(audioRef.current) audioRef.current.volume = Math.min(1, newVol);
                            if(ytPlayerRef.current && ytReadyRef.current)
                            {
                                try { ytPlayerRef.current.setVolume(Math.min(100, newVol * 100)); } catch {}
                            }
                            if(upStep >= fadeSteps) clearInterval(fadeUp);
                        }, fadeUpStepMs);
                    }, duckMs);
                }
                break;
            }
            case 'radio.toggle':
            {
                const isEnabled = params?.get('enabled') === 'true';
                setRadioEnabled(isEnabled);

                if(!isEnabled)
                {
                    stopPlayback();
                }
                else
                {
                    const title = params?.get('track_title') || '';
                    if(title)
                    {
                        const track: RadioTrack = {
                            id: 0,
                            title,
                            artist: params?.get('track_artist') || '',
                            url: params?.get('track_url') || '',
                            type: params?.get('track_type') || 'audio',
                            duration: parseInt(params?.get('duration') || '0', 10)
                        };
                        const sAt = parseInt(params?.get('started_at') || '0', 10);
                        setCurrentTrack(track);
                        setStartedAt(sAt);
                        setPaused(false);
                        playTrack(track, sAt, false);
                    }
                }
                break;
            }
        }
    });

    // ── Volume sync ──
    useEffect(() =>
    {
        const vol = muted ? 0 : volume;
        if(audioRef.current) audioRef.current.volume = vol;
        if(ytPlayerRef.current && ytReadyRef.current)
        {
            try { ytPlayerRef.current.setVolume(vol * 100); } catch {}
        }
    }, [ volume, muted ]);

    // ── Cleanup on unmount ──
    useEffect(() =>
    {
        return () => { stopPlayback(); };
    }, [ stopPlayback ]);

    // ── Don't render if nothing to show ──
    if(!radioEnabled && !isStaff) return null;

    return (
        <>
            {/* Hidden YouTube container */}
            <div
                ref={ ytContainerRef }
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
            />

            {/* ── Compact Float Bar ── */}
            <div className="fixed top-3 left-4 z-[65] pointer-events-auto flex items-center gap-1 py-1.5 px-3 min-h-[48px] texture-panel backdrop-blur-2xl rounded-2xl select-none">
                {/* CMS Switcher — nur wenn im iframe */}
                { isInIframe && (
                    <>
                        <button
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => window.parent.postMessage({ type: 'show-cms' }, '*') }
                            title="Zurück zum CMS"
                        >
                            <svg className="size-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </button>
                        <div className="w-px h-6 bg-white/[0.06]" />
                    </>
                ) }
                {/* Logo */}
                <TextGif
                    gifUrl="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmx6a3BzZ3pwajN0bnphZGlpcHI2ajA1cWpzaHBkbHJ0anVjeGcyeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wQHDnQmXZlpVuuPqey/giphy.gif"
                    text="bahhos"
                    size="sm"
                    weight="bold"
                />
                <div className="w-px h-6 bg-white/[0.06]" />

                {/* Track Info */}
                { !radioEnabled ? (
                    <span className="text-sm text-red-400/60 italic">Aus</span>
                ) : currentTrack ? (
                    <span className="text-sm text-white/80 truncate max-w-[160px]">
                        { currentTrack.title } – { currentTrack.artist }
                    </span>
                ) : (
                    <span className="text-sm text-white/40 italic">Radio</span>
                ) }

                { needsInteraction && (
                    <button
                        className="text-xs text-amber-300 hover:text-amber-200 font-bold"
                        onClick={ handleUnlock }
                    >
                        ▶
                    </button>
                ) }

                {/* Play/Pause */}
                { radioEnabled && currentTrack && (
                    <button
                        className="text-sm text-white/60 hover:text-white/90 transition-colors"
                        onClick={ () => sendCommand(paused ? ':radio play' : ':radio pause') }
                    >
                        { paused ? '▶' : '⏸' }
                    </button>
                ) }

                {/* Volume */}
                <div className="flex items-center gap-1">
                    <button
                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                        onClick={ () => setMuted(!muted) }
                    >
                        { muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊' }
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={ muted ? 0 : Math.round(volume * 100) }
                        onChange={ (e) => { setVolume(parseInt(e.target.value) / 100); setMuted(false); } }
                        className="w-14 h-1 accent-white/60 cursor-pointer"
                    />
                </div>

                {/* Open DJ Panel */}
                { isStaff && (
                    <button
                        onClick={ () => CreateLinkEvent('radio/toggle') }
                        className="text-xs text-white/40 hover:text-white/80 transition-colors"
                        title="DJ Panel"
                    >
                        🎧
                    </button>
                ) }
            </div>

            {/* ── DJ Announcement Overlay ── */}
            { announcement && (
                <div className="fixed top-14 left-4 z-[65] w-[320px] rounded-xl backdrop-blur-xl bg-gradient-to-r from-purple-900/70 to-indigo-900/70 border border-purple-400/20 shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-300 pointer-events-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">🎙</span>
                        <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">{ announcement.djName }</span>
                    </div>
                    <div className="text-sm text-white/90 font-medium leading-relaxed">{ announcement.message }</div>
                </div>
            ) }
        </>
    );
};
