import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CreateLinkEvent, GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Home, Headphones, Pause, Play, Volume2, VolumeX, Mic, X,
  SkipForward, Repeat, Power, Music,
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

const extractYoutubeId = (url: string): string | null => {
    if (url.includes('youtube.com/watch')) {
        const parts = url.split('v=');
        if (parts.length > 1) return parts[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts.length > 1) return parts[1].split('?')[0];
    }
    return null;
};

const parseQueue = (json: string): RadioTrack[] => {
    try { return JSON.parse(json || '[]'); }
    catch { return []; }
};

let ytApiLoading = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

const ensureYTApi = (cb: () => void) => {
    if (ytApiReady && window.YT && window.YT.Player) { cb(); return; }
    ytApiCallbacks.push(cb);
    if (!ytApiLoading) {
        ytApiLoading = true;
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
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

function DjPanelPopover({ currentTrack, paused, looping, radioEnabled, sendCommand }: {
  currentTrack: RadioTrack | null;
  paused: boolean;
  looping: boolean;
  radioEnabled: boolean;
  sendCommand: (cmd: string) => void;
}) {
  const [loopOn, setLoopOn] = useState(looping);
  const [radioOn, setRadioOn] = useState(radioEnabled);

  useEffect(() => { setLoopOn(looping); }, [looping]);
  useEffect(() => { setRadioOn(radioEnabled); }, [radioEnabled]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
          <Headphones className="size-3.5 text-muted-foreground/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0 bg-popover border-border/50 text-foreground">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">DJ Panel</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">Staff</Badge>
          </div>
        </div>

        <Tabs defaultValue="playing" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent px-4 h-9">
            <TabsTrigger value="playing" className="text-xs text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-accent/50">Now Playing</TabsTrigger>
            <TabsTrigger value="queue" className="text-xs text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-accent/50">Queue</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-accent/50">DJ Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="playing" className="p-4 mt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                <Music className="size-5 text-purple-400/60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{currentTrack?.title || 'Kein Track'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack?.artist || '—'}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">{currentTrack?.type === 'youtube' ? 'YouTube' : 'Audio'}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <Progress value={45} className="h-1.5 bg-muted/50" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">—</span>
                {loopOn && (
                  <Badge variant="outline" className="text-muted-foreground/60 border-border/50">
                    <Repeat className="size-2.5 mr-1" />Loop
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/50 text-white hover:bg-accent/50" onClick={() => sendCommand(':radio play')}>
                <Play className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/50 text-white hover:bg-accent/50" onClick={() => sendCommand(':radio pause')}>
                <Pause className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/50 text-white hover:bg-accent/50" onClick={() => sendCommand(':radio skip')}>
                <SkipForward className="size-3.5" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="p-4 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Queue</span>
            </div>
            <p className="text-xs text-muted-foreground/60 text-center py-4">Queue wird vom Server verwaltet</p>
          </TabsContent>

          <TabsContent value="controls" className="p-4 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Radio</span>
              </div>
              <Switch checked={radioOn} onCheckedChange={v => { setRadioOn(v); sendCommand(v ? ':radio on' : ':radio off'); }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Loop</span>
              </div>
              <Switch checked={loopOn} onCheckedChange={v => { setLoopOn(v); sendCommand(v ? ':radio loop on' : ':radio loop off'); }} />
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Durchsage (TTS)</label>
              <textarea
                placeholder="Durchsage-Text eingeben..."
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border/50 bg-accent/30 text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none"
                id="dj-tts-input"
              />
              <Button size="sm" className="w-full h-7 text-xs bg-muted/50 hover:bg-accent/60 text-white border-0" onClick={() => {
                const el = document.getElementById('dj-tts-input') as HTMLTextAreaElement;
                if (el?.value) { sendCommand(':radio tts ' + el.value); el.value = ''; }
              }}>Generieren</Button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Sound Effect</label>
              <div className="flex gap-1.5">
                <Input placeholder="SFX URL (MP3)..." className="h-7 text-xs bg-accent/30 border-border/50 text-foreground placeholder:text-muted-foreground/40" id="dj-sfx-input" />
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0 border-border/50 text-white hover:bg-accent/50" onClick={() => {
                  const el = document.getElementById('dj-sfx-input') as HTMLInputElement;
                  if (el?.value) { sendCommand(':radio sfx ' + el.value); el.value = ''; }
                }}>Play</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export const RadioPanelView: FC<{}> = () => {
    const [currentTrack, setCurrentTrack] = useState<RadioTrack | null>(null);
    const [startedAt, setStartedAt] = useState(0);
    const [paused, setPaused] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [radioEnabled, setRadioEnabled] = useState(true);
    const [looping, setLooping] = useState(false);

    const [volume, setVolume] = useState(0.5);
    const [muted, setMuted] = useState(false);
    const [isInIframe, setIsInIframe] = useState(false);
    const [needsInteraction, setNeedsInteraction] = useState(false);
    const [announcement, setAnnouncement] = useState<{ message: string; djName: string } | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ytPlayerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);
    const ytContainerRef = useRef<HTMLDivElement | null>(null);
    const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const volumeRef = useRef(0.5);
    const mutedRef = useRef(false);
    const pausedRef = useRef(false);

    useEffect(() => {
        try { setIsInIframe(window !== window.parent); }
        catch { setIsInIframe(true); }
    }, []);

    volumeRef.current = volume;
    mutedRef.current = muted;
    pausedRef.current = paused;

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        if (ytPlayerRef.current && ytReadyRef.current) {
            try { ytPlayerRef.current.destroy(); } catch {}
            ytPlayerRef.current = null;
            ytReadyRef.current = false;
        }
    }, []);

    const prepareYTContainer = useCallback(() => {
        if (!ytContainerRef.current) return;
        while (ytContainerRef.current.firstChild) {
            ytContainerRef.current.removeChild(ytContainerRef.current.firstChild);
        }
        const playerDiv = document.createElement('div');
        playerDiv.id = 'yt-radio-player';
        ytContainerRef.current.appendChild(playerDiv);
    }, []);

    const playTrack = useCallback((track: RadioTrack, sAt: number, isPaused: boolean) => {
        stopPlayback();
        if (!track || !track.url) return;
        const elapsed = isPaused ? 0 : Math.max(0, (Date.now() - sAt) / 1000);
        const vol = mutedRef.current ? 0 : volumeRef.current;

        if (track.type === 'youtube') {
            const videoId = extractYoutubeId(track.url);
            if (!videoId) return;
            ensureYTApi(() => {
                prepareYTContainer();
                ytReadyRef.current = false;
                ytPlayerRef.current = new window.YT.Player('yt-radio-player', {
                    height: '1', width: '1', videoId,
                    playerVars: { autoplay: isPaused ? 0 : 1, start: Math.floor(elapsed) },
                    events: {
                        onReady: (ev: any) => {
                            ytReadyRef.current = true;
                            ev.target.setVolume(vol * 100);
                            if (!isPaused) ev.target.playVideo();
                        }
                    }
                });
            });
        } else {
            const audio = new Audio(track.url);
            audio.volume = vol;
            audioRef.current = audio;
            audio.addEventListener('loadedmetadata', () => {
                audio.currentTime = Math.min(elapsed, track.duration);
            });
            if (!isPaused) {
                audio.play().then(() => setNeedsInteraction(false)).catch(() => setNeedsInteraction(true));
            }
        }
    }, [stopPlayback, prepareYTContainer]);

    const handleUnlock = useCallback(() => {
        setNeedsInteraction(false);
        if (audioRef.current && !pausedRef.current) audioRef.current.play().catch(() => {});
        if (ytPlayerRef.current && ytReadyRef.current && !pausedRef.current) {
            try { ytPlayerRef.current.playVideo(); } catch {}
        }
    }, []);

    const sendCommand = useCallback((cmd: string) => {
        try {
            const session = GetRoomSession();
            if (session) session.sendChatMessage(cmd, 0);
        } catch {}
    }, []);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();
        const params = parser.parameters;

        switch (parser.type) {
            case 'radio.state': {
                const title = params?.get('track_title') || '';
                const staff = params?.get('is_staff') === 'true';
                setIsStaff(staff);
                setRadioEnabled(params?.get('enabled') !== 'false');
                const isPaused = params?.get('paused') === 'true';
                const isEnabled = params?.get('enabled') !== 'false';
                setPaused(isPaused);
                if (title && isEnabled) {
                    const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track); setStartedAt(sAt); playTrack(track, sAt, isPaused);
                } else { setCurrentTrack(null); setStartedAt(0); stopPlayback(); }
                break;
            }
            case 'radio.track': {
                const title = params?.get('track_title') || '';
                const isLoop = params?.get('looping') === 'true';
                setLooping(isLoop);
                if (title) {
                    const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    setCurrentTrack(track); setStartedAt(sAt); setPaused(false); playTrack(track, sAt, false);
                } else { setCurrentTrack(null); setStartedAt(0); setPaused(false); setLooping(false); stopPlayback(); }
                break;
            }
            case 'radio.pause': {
                const isPaused = params?.get('paused') === 'true';
                setPaused(isPaused);
                if (isPaused) {
                    if (audioRef.current) audioRef.current.pause();
                    if (ytPlayerRef.current && ytReadyRef.current) try { ytPlayerRef.current.pauseVideo(); } catch {}
                } else {
                    const sAt = parseInt(params?.get('started_at') || '0', 10);
                    if (sAt > 0) setStartedAt(sAt);
                    if (audioRef.current) { const elapsed = (Date.now() - sAt) / 1000; audioRef.current.currentTime = elapsed; audioRef.current.play().catch(() => {}); }
                    if (ytPlayerRef.current && ytReadyRef.current) { const elapsed = (Date.now() - sAt) / 1000; try { ytPlayerRef.current.seekTo(elapsed); ytPlayerRef.current.playVideo(); } catch {} }
                }
                break;
            }
            case 'radio.sfx': {
                const sfxUrl = params?.get('sfx_url') || '';
                if (sfxUrl) { const sfxAudio = new Audio(sfxUrl); sfxAudio.volume = mutedRef.current ? 0 : volumeRef.current; sfxAudio.play().catch(() => {}); }
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

                if (message) {
                    const originalVolume = volumeRef.current;
                    const originalMuted = mutedRef.current;
                    const duckTarget = 0.15;
                    const fadeSteps = 30;
                    const fadeDownStepMs = 50;
                    const fadeUpStepMs = 65;

                    let step = 0;
                    const fadeDown = setInterval(() => {
                        step++;
                        const newVol = originalMuted ? 0 : originalVolume - (originalVolume - duckTarget) * (step / fadeSteps);
                        if (audioRef.current) audioRef.current.volume = Math.max(0, newVol);
                        if (ytPlayerRef.current && ytReadyRef.current) try { ytPlayerRef.current.setVolume(Math.max(0, newVol * 100)); } catch {}
                        if (step >= fadeSteps) clearInterval(fadeDown);
                    }, fadeDownStepMs);

                    if (audioUrl) {
                        setTimeout(() => {
                            const ttsAudio = new Audio(audioUrl);
                            const ttsMaxVol = mutedRef.current ? 0 : 1.0;
                            ttsAudio.volume = 0;
                            ttsAudio.play().catch(() => {});
                            let ttsStep = 0;
                            const ttsFadeIn = setInterval(() => { ttsStep++; ttsAudio.volume = Math.min(ttsMaxVol, ttsMaxVol * (ttsStep / 20)); if (ttsStep >= 20) clearInterval(ttsFadeIn); }, 20);
                            setTimeout(() => { let outStep = 0; const ttsFadeOut = setInterval(() => { outStep++; ttsAudio.volume = Math.max(0, ttsMaxVol * (1 - outStep / 50)); if (outStep >= 50) clearInterval(ttsFadeOut); }, 40); }, Math.max(0, duckMs - 800 - 2000));
                        }, 800);
                    }

                    setAnnouncement({ message, djName });
                    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);

                    announcementTimerRef.current = setTimeout(() => {
                        setAnnouncement(null);
                        let upStep = 0;
                        const restoreVol = originalMuted ? 0 : originalVolume;
                        const fadeUp = setInterval(() => {
                            upStep++;
                            const newVol = duckTarget + (restoreVol - duckTarget) * (upStep / fadeSteps);
                            if (audioRef.current) audioRef.current.volume = Math.min(1, newVol);
                            if (ytPlayerRef.current && ytReadyRef.current) try { ytPlayerRef.current.setVolume(Math.min(100, newVol * 100)); } catch {}
                            if (upStep >= fadeSteps) clearInterval(fadeUp);
                        }, fadeUpStepMs);
                    }, duckMs);
                }
                break;
            }
            case 'radio.toggle': {
                const isEnabled = params?.get('enabled') === 'true';
                setRadioEnabled(isEnabled);
                if (!isEnabled) { stopPlayback(); } else {
                    const title = params?.get('track_title') || '';
                    if (title) {
                        const track: RadioTrack = { id: 0, title, artist: params?.get('track_artist') || '', url: params?.get('track_url') || '', type: params?.get('track_type') || 'audio', duration: parseInt(params?.get('duration') || '0', 10) };
                        const sAt = parseInt(params?.get('started_at') || '0', 10);
                        setCurrentTrack(track); setStartedAt(sAt); setPaused(false); playTrack(track, sAt, false);
                    }
                }
                break;
            }
        }
    });

    useEffect(() => {
        const vol = muted ? 0 : volume;
        if (audioRef.current) audioRef.current.volume = vol;
        if (ytPlayerRef.current && ytReadyRef.current) try { ytPlayerRef.current.setVolume(vol * 100); } catch {}
    }, [volume, muted]);

    useEffect(() => { return () => { stopPlayback(); }; }, [stopPlayback]);

    if (!radioEnabled && !isStaff) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <div ref={ytContainerRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} />

            <div className="fixed top-3 left-20 z-[65] pointer-events-auto flex flex-col gap-3">
                <div className="inline-flex items-center gap-1 py-2 px-3 rounded-2xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-xl">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors" onClick={() => isInIframe ? window.parent.postMessage({ type: 'show-cms' }, '*') : null}>
                                <Home className="size-4 text-muted-foreground/70" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Startseite</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-5 bg-border/30" />

                    <span className="text-sm font-bold px-2 tracking-tight">bahhos</span>
                    <div className="w-px h-5 bg-border/30" />

                    {!radioEnabled ? (
                        <span className="text-xs text-red-400/60 italic px-1.5">Aus</span>
                    ) : currentTrack ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[180px] px-1.5">
                            {currentTrack.title} – {currentTrack.artist}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground/40 italic px-1.5">Radio</span>
                    )}

                    {needsInteraction && (
                        <button className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors" onClick={handleUnlock}>
                            <Play className="size-3.5 text-amber-500" />
                        </button>
                    )}

                    <button
                        className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors"
                        onClick={() => sendCommand(paused ? ':radio play' : ':radio pause')}
                    >
                        {paused
                            ? <Play className="size-3.5 text-muted-foreground" strokeWidth={2.5} />
                            : <Pause className="size-3.5 text-muted-foreground" strokeWidth={2.5} />
                        }
                    </button>

                    <button
                        className="p-1 rounded-lg cursor-pointer hover:bg-accent/60 transition-colors"
                        onClick={() => setMuted(v => !v)}
                    >
                        {muted || volume === 0
                            ? <VolumeX className="size-3.5 text-muted-foreground/40" />
                            : <Volume2 className="size-3.5 text-muted-foreground" />
                        }
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={muted ? 0 : Math.round(volume * 100)}
                        onChange={e => { setVolume(parseInt(e.target.value) / 100); setMuted(false); }}
                        className="w-14 h-1 accent-primary cursor-pointer"
                    />

                    {isStaff && (
                        <DjPanelPopover
                            currentTrack={currentTrack}
                            paused={paused}
                            looping={looping}
                            radioEnabled={radioEnabled}
                            sendCommand={sendCommand}
                        />
                    )}
                </div>

                {announcement && (
                    <div className="min-w-[340px] max-w-[400px] flex items-start gap-3 p-3 rounded-xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-xl animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <Mic className="size-3 text-muted-foreground shrink-0" />
                                <span className="text-xs font-semibold">{announcement.djName}</span>
                                <Badge variant="outline" className="text-[10px]">Durchsage</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{announcement.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
