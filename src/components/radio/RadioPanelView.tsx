import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CreateLinkEvent, GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
import bahhosLogo from '@/assets/images/brand/bahhos-logo.png';
import {
    Headphones,
    Home,
    Mic,
    Pause,
    Play,
    Volume2,
    VolumeX,
} from 'lucide-react';

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
    if (url.includes('youtube.com/watch'))
    {
        const parts = url.split('v=');
        if (parts.length > 1) return parts[1].split('&')[0];
    }
    else if (url.includes('youtu.be/'))
    {
        const parts = url.split('youtu.be/');
        if (parts.length > 1) return parts[1].split('?')[0];
    }
    return null;
};

let ytApiLoading = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

const ensureYTApi = (cb: () => void) =>
{
    if (ytApiReady && window.YT && window.YT.Player)
    {
        cb(); return;
    }
    ytApiCallbacks.push(cb);
    if (!ytApiLoading)
    {
        ytApiLoading = true;
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () =>
        {
            ytApiReady = true;
            if (prev) prev();
            ytApiCallbacks.forEach(fn => fn());
            ytApiCallbacks.length = 0;
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }
};

export const RadioPanelView: FC<{ embedded?: boolean }> = ({ embedded = false }) =>
{
    const [ currentTrack, setCurrentTrack ] = useState<RadioTrack | null>(null);
    const [ , setStartedAt ] = useState(0);
    const [ paused, setPaused ] = useState(false);
    const [ isStaff, setIsStaff ] = useState(false);
    const [ radioEnabled, setRadioEnabled ] = useState(true);
    const [ looping, setLooping ] = useState(false);

    const [ volume, setVolume ] = useState(0.5);
    const [ muted, setMuted ] = useState(false);
    const [ isInIframe, setIsInIframe ] = useState(false);
    const [ needsInteraction, setNeedsInteraction ] = useState(false);
    const [ announcement, setAnnouncement ] = useState<{ message: string; djName: string } | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ytPlayerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);
    const ytContainerRef = useRef<HTMLDivElement | null>(null);
    const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const volumeRef = useRef(0.5);
    const mutedRef = useRef(false);
    const pausedRef = useRef(false);

    useEffect(() =>
    {
        try
        {
            setIsInIframe(window !== window.parent);
        }
        catch
        {
            setIsInIframe(true);
        }
    }, []);

    volumeRef.current = volume;
    mutedRef.current = muted;
    pausedRef.current = paused;

    const stopPlayback = useCallback(() =>
    {
        if (audioRef.current)
        {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        if (ytPlayerRef.current && ytReadyRef.current)
        {
            try
            {
                ytPlayerRef.current.destroy();
            }
            catch
            {}
            ytPlayerRef.current = null;
            ytReadyRef.current = false;
        }
    }, []);

    const prepareYTContainer = useCallback(() =>
    {
        if (!ytContainerRef.current) return;
        while (ytContainerRef.current.firstChild)
        {
            ytContainerRef.current.removeChild(ytContainerRef.current.firstChild);
        }
        const playerDiv = document.createElement('div');
        playerDiv.id = 'yt-radio-player';
        ytContainerRef.current.appendChild(playerDiv);
    }, []);

    const playTrack = useCallback((track: RadioTrack, sAt: number, isPaused: boolean) =>
    {
        stopPlayback();
        if (!track || !track.url) return;
        const elapsed = isPaused ? 0 : Math.max(0, (Date.now() - sAt) / 1000);
        const vol = mutedRef.current ? 0 : volumeRef.current;

        if (track.type === 'youtube')
        {
            const videoId = extractYoutubeId(track.url);
            if (!videoId) return;
            ensureYTApi(() =>
            {
                prepareYTContainer();
                ytReadyRef.current = false;
                ytPlayerRef.current = new window.YT.Player('yt-radio-player', {
                    height: '1', width: '1', videoId,
                    playerVars: { autoplay: isPaused ? 0 : 1, start: Math.floor(elapsed) },
                    events: {
                        onReady: (ev: any) =>
                        {
                            ytReadyRef.current = true;
                            ev.target.setVolume(vol * 100);
                            if (!isPaused) ev.target.playVideo();
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
            if (!isPaused)
            {
                audio.play().then(() => setNeedsInteraction(false)).catch(() => setNeedsInteraction(true));
            }
        }
    }, [ stopPlayback, prepareYTContainer ]);

    const handleUnlock = useCallback(() =>
    {
        setNeedsInteraction(false);
        if (audioRef.current && !pausedRef.current) audioRef.current.play().catch(() =>
        {});
        if (ytPlayerRef.current && ytReadyRef.current && !pausedRef.current)
        {
            try
            {
                ytPlayerRef.current.playVideo();
            }
            catch
            {}
        }
    }, []);

    const sendCommand = useCallback((cmd: string) =>
    {
        try
        {
            const session = GetRoomSession();
            if (session) session.sendChatMessage(cmd, 0);
        }
        catch
        {}
    }, []);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        const params = parser.parameters;

        switch (parser.type)
        {
            case 'radio.state': {
                const title = params?.get('track_title') || '';
                const staff = params?.get('is_staff') === 'true';
                setIsStaff(staff);
                setRadioEnabled(params?.get('enabled') !== 'false');
                const isPaused = params?.get('paused') === 'true';
                const isEnabled = params?.get('enabled') !== 'false';
                setPaused(isPaused);
                if (title && isEnabled)
                {
                    const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track); setStartedAt(sAt); playTrack(track, sAt, isPaused);
                }
                else
                {
                    setCurrentTrack(null); setStartedAt(0); stopPlayback();
                }
                break;
            }
            case 'radio.track': {
                const title = params?.get('track_title') || '';
                const isLoop = params?.get('looping') === 'true';
                setLooping(isLoop);
                if (title)
                {
                    const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track); setStartedAt(sAt); setPaused(false); playTrack(track, sAt, false);
                }
                else
                {
                    setCurrentTrack(null); setStartedAt(0); setPaused(false); setLooping(false); stopPlayback();
                }
                break;
            }
            case 'radio.pause': {
                const isPaused = params?.get('paused') === 'true';
                setPaused(isPaused);
                if (isPaused)
                {
                    if (audioRef.current) audioRef.current.pause();
                    if (ytPlayerRef.current && ytReadyRef.current) try
                    {
                        ytPlayerRef.current.pauseVideo();
                    }
                    catch
                    {}
                }
                else
                {
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    if (sAt > 0) setStartedAt(sAt);
                    if (audioRef.current)
                    {
                        const elapsed = (Date.now() - sAt) / 1000; audioRef.current.currentTime = elapsed; audioRef.current.play().catch(() =>
                        {});
                    }
                    if (ytPlayerRef.current && ytReadyRef.current)
                    {
                        const elapsed = (Date.now() - sAt) / 1000; try
                        {
                            ytPlayerRef.current.seekTo(elapsed); ytPlayerRef.current.playVideo();
                        }
                        catch
                        {}
                    }
                }
                break;
            }
            case 'radio.sfx': {
                const sfxUrl = params?.get('sfx_url') || '';
                if (sfxUrl)
                {
                    const sfxAudio = new Audio(sfxUrl); sfxAudio.volume = mutedRef.current ? 0 : volumeRef.current; sfxAudio.play().catch(() =>
                    {});
                }
                break;
            }
            case 'radio.announce': {
                const message = params?.get('message') || '';
                const djName = params?.get('dj_name') || 'DJ';
                const duckMs = parseInt(params?.get('duck_ms') || '5000', 10);
                const audioChunks = parseInt(params?.get('audio_chunks') || '0', 10);
                const audioUrl = audioChunks > 0
                    ? 'data:audio/mpeg;base64,' + Array.from({ length: audioChunks }, (_, i) => params?.get('audio_chunk_' + i) || '').join('')
                    : (params?.get('audio_url') || '');

                if (message)
                {
                    const originalVolume = volumeRef.current;
                    const originalMuted = mutedRef.current;
                    const duckTarget = 0.15;
                    const fadeSteps = 30;
                    const fadeDownStepMs = 50;
                    const fadeUpStepMs = 65;

                    let step = 0;
                    const fadeDown = setInterval(() =>
                    {
                        step++;
                        const newVol = originalMuted ? 0 : originalVolume - (originalVolume - duckTarget) * (step / fadeSteps);
                        if (audioRef.current) audioRef.current.volume = Math.max(0, newVol);
                        if (ytPlayerRef.current && ytReadyRef.current) try
                        {
                            ytPlayerRef.current.setVolume(Math.max(0, newVol * 100));
                        }
                        catch
                        {}
                        if (step >= fadeSteps) clearInterval(fadeDown);
                    }, fadeDownStepMs);

                    if (audioUrl)
                    {
                        setTimeout(() =>
                        {
                            const ttsAudio = new Audio(audioUrl);
                            const ttsMaxVol = mutedRef.current ? 0 : 1.0;
                            ttsAudio.volume = 0;
                            ttsAudio.play().catch(() =>
                            {});
                            let ttsStep = 0;
                            const ttsFadeIn = setInterval(() =>
                            {
                                ttsStep++; ttsAudio.volume = Math.min(ttsMaxVol, ttsMaxVol * (ttsStep / 20)); if (ttsStep >= 20) clearInterval(ttsFadeIn);
                            }, 20);
                            setTimeout(() =>
                            {
                                let outStep = 0; const ttsFadeOut = setInterval(() =>
                                {
                                    outStep++; ttsAudio.volume = Math.max(0, ttsMaxVol * (1 - outStep / 50)); if (outStep >= 50) clearInterval(ttsFadeOut);
                                }, 40);
                            }, Math.max(0, duckMs - 800 - 2000));
                        }, 800);
                    }

                    setAnnouncement({ message, djName });
                    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);

                    announcementTimerRef.current = setTimeout(() =>
                    {
                        setAnnouncement(null);
                        let upStep = 0;
                        const restoreVol = originalMuted ? 0 : originalVolume;
                        const fadeUp = setInterval(() =>
                        {
                            upStep++;
                            const newVol = duckTarget + (restoreVol - duckTarget) * (upStep / fadeSteps);
                            if (audioRef.current) audioRef.current.volume = Math.min(1, newVol);
                            if (ytPlayerRef.current && ytReadyRef.current) try
                            {
                                ytPlayerRef.current.setVolume(Math.min(100, newVol * 100));
                            }
                            catch
                            {}
                            if (upStep >= fadeSteps) clearInterval(fadeUp);
                        }, fadeUpStepMs);
                    }, duckMs);
                }
                break;
            }
            case 'radio.toggle': {
                const isEnabled = params?.get('enabled') === 'true';
                setRadioEnabled(isEnabled);
                if (!isEnabled)
                {
                    stopPlayback();
                }
                else
                {
                    const title = params?.get('track_title') || '';
                    if (title)
                    {
                        const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                        const sAt = parseInt(params?.get('started_at') || '0', 10);
                        setCurrentTrack(track); setStartedAt(sAt); setPaused(false); playTrack(track, sAt, false);
                    }
                }
                break;
            }
        }
    });

    useEffect(() =>
    {
        const vol = muted ? 0 : volume;
        if (audioRef.current) audioRef.current.volume = vol;
        if (ytPlayerRef.current && ytReadyRef.current) try
        {
            ytPlayerRef.current.setVolume(vol * 100);
        }
        catch
        {}
    }, [ volume, muted ]);

    useEffect(() =>
    {
        return () =>
        {
            stopPlayback();
        };
    }, [ stopPlayback ]);

    if (!radioEnabled && !isStaff) return null;

    return (
        <AlignTooltip.Provider delayDuration={ 200 }>
            <div ref={ ytContainerRef } style={ { position: embedded ? 'absolute' : 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' } } />
            <div className={ embedded ? 'relative flex min-w-0 items-center' : 'radio-panel fixed top-3 left-[calc(var(--sidebar-width,80px)+16px)] z-[65] pointer-events-auto flex flex-col gap-3' }>
                <div className={ `inline-flex min-w-0 items-center gap-1 ${ embedded ? 'max-w-[240px] bg-transparent px-1 py-1' : 'rounded-2xl bg-bg-white-0 px-3 py-2 text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200' }` }>
                    { !embedded && isInIframe && (
                        <>
                            <AlignTooltip.Root>
                                <AlignTooltip.Trigger asChild>
                                    <AlignButton.Root
                                        type="button"
                                        variant="neutral"
                                        mode="ghost"
                                        size="xxsmall"
                                        className="size-7 px-0"
                                        onClick={ () => window.parent.postMessage({ type: 'show-cms' }, '*') }
                                    >
                                        <AlignButton.Icon as={ Home } className="size-4" />
                                    </AlignButton.Root>
                                </AlignTooltip.Trigger>
                                <AlignTooltip.Content>Startseite</AlignTooltip.Content>
                            </AlignTooltip.Root>
                            <div className="h-5 w-px bg-stroke-soft-200" />
                        </>
                    ) }
                    { !embedded && (
                        <>
                            <img
                                src={ bahhosLogo }
                                alt="Bahhos.de"
                                className="h-8 w-auto max-w-[112px] object-contain px-1"
                                style={ { imageRendering: 'pixelated' } }
                                draggable={ false }
                            />
                            <div className="h-5 w-px bg-stroke-soft-200" />
                        </>
                    ) }
                    { !radioEnabled ? (
                        <span className="px-1.5 text-paragraph-xs italic text-error-base">Aus</span>
                    ) : currentTrack ? (
                        <span className={ `min-w-0 truncate px-1.5 text-paragraph-xs text-text-sub-600 ${ embedded ? 'max-w-[120px]' : 'max-w-[180px]' }` }>
                            { currentTrack.title } – { currentTrack.artist }
                        </span>
                    ) : (
                        <span className="px-1.5 text-paragraph-xs italic text-text-soft-400">Radio</span>
                    ) }
                    { looping && (
                        <AlignBadge.Root color="blue" variant="lighter" size="small" className="shrink-0">
                            Loop
                        </AlignBadge.Root>
                    ) }
                    { needsInteraction && (
                        <AlignTooltip.Root>
                            <AlignTooltip.Trigger asChild>
                                <AlignButton.Root
                                    type="button"
                                    variant="primary"
                                    mode="lighter"
                                    size="xxsmall"
                                    className="size-7 shrink-0 px-0"
                                    onClick={ handleUnlock }
                                >
                                    <AlignButton.Icon as={ Play } className="size-3.5" />
                                </AlignButton.Root>
                            </AlignTooltip.Trigger>
                            <AlignTooltip.Content>Audio starten</AlignTooltip.Content>
                        </AlignTooltip.Root>
                    ) }
                    { radioEnabled && currentTrack && (
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="size-7 shrink-0 px-0"
                            onClick={ () => sendCommand(paused ? ':radio play' : ':radio pause') }
                        >
                            <AlignButton.Icon as={ paused ? Play : Pause } className="size-3.5" />
                        </AlignButton.Root>
                    ) }
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="size-7 shrink-0 px-0"
                        onClick={ () => setMuted(v => !v) }
                    >
                        <AlignButton.Icon as={ muted || volume === 0 ? VolumeX : Volume2 } className="size-3.5" />
                    </AlignButton.Root>
                    <input
                        type="range"
                        min={ 0 }
                        max={ 100 }
                        value={ muted ? 0 : Math.round(volume * 100) }
                        onChange={ e =>
                        {
                            setVolume(parseInt(e.target.value) / 100); setMuted(false);
                        } }
                        className={ `${ embedded ? 'w-10' : 'w-14' } h-1 shrink-0 cursor-pointer accent-primary-base` }
                    />
                    { isStaff && (
                        <AlignTooltip.Root>
                            <AlignTooltip.Trigger asChild>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="ghost"
                                    size="xxsmall"
                                    className="size-7 shrink-0 px-0"
                                    onClick={ () => CreateLinkEvent('radio/toggle') }
                                >
                                    <AlignButton.Icon as={ Headphones } className="size-3.5" />
                                </AlignButton.Root>
                            </AlignTooltip.Trigger>
                            <AlignTooltip.Content>DJ Panel</AlignTooltip.Content>
                        </AlignTooltip.Root>
                    ) }
                </div>
                { announcement && (
                    <div className={ `min-w-[340px] max-w-[400px] animate-in slide-in-from-top-2 fade-in duration-300 ${ embedded ? 'absolute top-full right-0 mt-2 z-[80] pointer-events-auto' : '' }` }>
                        <AlignSurface.Panel className="p-3">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <Mic className="size-3 shrink-0 text-text-sub-600" />
                                        <span className="text-label-xs text-text-strong-950">{ announcement.djName }</span>
                                        <AlignBadge.Root color="blue" variant="lighter" size="small">Durchsage</AlignBadge.Root>
                                    </div>
                                    <p className="mt-1 text-paragraph-xs leading-relaxed text-text-sub-600">{ announcement.message }</p>
                                </div>
                            </div>
                        </AlignSurface.Panel>
                    </div>
                ) }
            </div>
        </AlignTooltip.Provider>
    );
};
