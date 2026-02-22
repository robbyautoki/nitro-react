import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfiguration, GetSessionDataManager } from '../../api';
import { useRoom } from '../../hooks';
import {
    Room as LiveKitRoom,
    RoomEvent,
    Track,
    RemoteParticipant,
    LocalParticipant,
    Participant,
    ConnectionState,
} from 'livekit-client';

interface VoiceChannel {
    id: number;
    name: string;
    max: number;
    maxParticipants?: number;
}

interface VoiceParticipant {
    identity: string;
    isSpeaking: boolean;
    isMuted: boolean;
}

export const VoiceChannelView: FC<{}> = () =>
{
    const { roomSession } = useRoom();
    const [ isOpen, setIsOpen ] = useState(false);
    const [ channels, setChannels ] = useState<VoiceChannel[]>([]);
    const [ activeChannelId, setActiveChannelId ] = useState<number | null>(null);
    const [ participants, setParticipants ] = useState<VoiceParticipant[]>([]);
    const [ isMuted, setIsMuted ] = useState(false);
    const [ isDeafened, setIsDeafened ] = useState(false);
    const [ pushToTalk, setPushToTalk ] = useState(false);
    const [ isConnecting, setIsConnecting ] = useState(false);
    const [ connectionState, setConnectionState ] = useState<string>('disconnected');

    const livekitRoom = useRef<LiveKitRoom | null>(null);
    const cmsUrl = useMemo(() => GetConfiguration<string>('url.prefix', ''), []);
    const livekitUrl = useMemo(() => GetConfiguration<string>('voice.livekit.url', 'ws://localhost:7880'), []);
    const isMod = GetSessionDataManager().isModerator;

    const roomId = roomSession?.roomId;

    // Load channels when room changes
    useEffect(() =>
    {
        if(!roomId || !cmsUrl) return;

        fetch(`${ cmsUrl }/api/voice/channels?roomId=${ roomId }`)
            .then(r => r.json())
            .then(data => setChannels(data.channels || []))
            .catch(() => setChannels([]));
    }, [ roomId, cmsUrl ]);

    // Listen for [VOICE_CHANNELS] whisper from emulator
    useEffect(() =>
    {
        const handler = (event: CustomEvent) =>
        {
            try
            {
                const msg = event.detail?.message;
                if(!msg || !msg.startsWith('[VOICE_CHANNELS]')) return;
                const json = JSON.parse(msg.replace('[VOICE_CHANNELS]', ''));
                if(json.roomId === roomId)
                {
                    setChannels(json.channels || []);
                }
            }
            catch(_) {}
        };

        window.addEventListener('whisper_message' as any, handler);
        return () => window.removeEventListener('whisper_message' as any, handler);
    }, [ roomId ]);

    // Cleanup on room change
    useEffect(() =>
    {
        return () =>
        {
            if(livekitRoom.current)
            {
                livekitRoom.current.disconnect();
                livekitRoom.current = null;
            }
            setActiveChannelId(null);
            setParticipants([]);
            setConnectionState('disconnected');
        };
    }, [ roomId ]);

    // Push-to-Talk key handler
    useEffect(() =>
    {
        if(!pushToTalk || !livekitRoom.current) return;

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if(e.key === 'v' || e.key === 'V')
            {
                livekitRoom.current?.localParticipant?.setMicrophoneEnabled(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) =>
        {
            if(e.key === 'v' || e.key === 'V')
            {
                livekitRoom.current?.localParticipant?.setMicrophoneEnabled(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () =>
        {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [ pushToTalk ]);

    const updateParticipants = useCallback(() =>
    {
        if(!livekitRoom.current) return;

        const room = livekitRoom.current;
        const parts: VoiceParticipant[] = [];

        const addParticipant = (p: Participant) =>
        {
            parts.push({
                identity: p.identity,
                isSpeaking: p.isSpeaking,
                isMuted: !p.isMicrophoneEnabled,
            });
        };

        addParticipant(room.localParticipant);
        room.remoteParticipants.forEach(p => addParticipant(p));

        setParticipants(parts);
    }, []);

    const joinChannel = useCallback(async (channel: VoiceChannel) =>
    {
        if(isConnecting) return;

        // Disconnect from current if any
        if(livekitRoom.current)
        {
            await livekitRoom.current.disconnect();
            livekitRoom.current = null;
        }

        setIsConnecting(true);
        setConnectionState('connecting');

        try
        {
            const ssoTicket = GetSessionDataManager().ssoTicket;
            const res = await fetch(`${ cmsUrl }/api/voice/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ssoTicket,
                    roomId,
                    channelId: channel.id,
                }),
            });

            if(!res.ok) throw new Error('Token-Fehler');

            const { token } = await res.json();

            const room = new LiveKitRoom({
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
                adaptiveStream: true,
                dynacast: true,
            });

            room.on(RoomEvent.ParticipantConnected, updateParticipants);
            room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
            room.on(RoomEvent.ActiveSpeakersChanged, updateParticipants);
            room.on(RoomEvent.TrackMuted, updateParticipants);
            room.on(RoomEvent.TrackUnmuted, updateParticipants);
            room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) =>
            {
                setConnectionState(state);
            });
            room.on(RoomEvent.Disconnected, () =>
            {
                setActiveChannelId(null);
                setParticipants([]);
                setConnectionState('disconnected');
                livekitRoom.current = null;
            });

            await room.connect(livekitUrl, token);
            await room.localParticipant.setMicrophoneEnabled(!pushToTalk);

            livekitRoom.current = room;
            setActiveChannelId(channel.id);
            setIsMuted(false);
            setIsDeafened(false);
            updateParticipants();
        }
        catch(e)
        {
            console.error('[Voice] Join failed:', e);
            setConnectionState('disconnected');
        }
        finally
        {
            setIsConnecting(false);
        }
    }, [ cmsUrl, roomId, livekitUrl, pushToTalk, isConnecting, updateParticipants ]);

    const leaveChannel = useCallback(async () =>
    {
        if(livekitRoom.current)
        {
            await livekitRoom.current.disconnect();
            livekitRoom.current = null;
        }
        setActiveChannelId(null);
        setParticipants([]);
        setConnectionState('disconnected');
    }, []);

    const toggleMute = useCallback(async () =>
    {
        if(!livekitRoom.current || pushToTalk) return;
        const newMuted = !isMuted;
        await livekitRoom.current.localParticipant.setMicrophoneEnabled(!newMuted);
        setIsMuted(newMuted);
    }, [ isMuted, pushToTalk ]);

    const toggleDeafen = useCallback(async () =>
    {
        if(!livekitRoom.current) return;
        const newDeafened = !isDeafened;

        livekitRoom.current.remoteParticipants.forEach(p =>
        {
            p.audioTrackPublications.forEach(pub =>
            {
                if(pub.track) pub.track.enabled = !newDeafened;
            });
        });

        if(newDeafened && !isMuted)
        {
            await livekitRoom.current.localParticipant.setMicrophoneEnabled(false);
            setIsMuted(true);
        }

        setIsDeafened(newDeafened);
    }, [ isDeafened, isMuted ]);

    const kickParticipant = useCallback(async (identity: string) =>
    {
        if(!livekitRoom.current || !isMod) return;
        livekitRoom.current.remoteParticipants.forEach(p =>
        {
            if(p.identity === identity)
            {
                // Server-side kick via data message
                livekitRoom.current?.localParticipant.publishData(
                    new TextEncoder().encode(JSON.stringify({ action: 'kick', target: identity })),
                    { reliable: true }
                );
            }
        });
    }, [ isMod ]);

    if(!roomId || channels.length === 0) return null;

    return (
        <>
            { /* Mikrofon-Button (fixed position, über Toolbar) */ }
            <div
                className="voice-toggle-btn"
                onClick={ () => setIsOpen(!isOpen) }
                title="Sprachchat"
            >
                <div className={ `voice-icon ${ activeChannelId ? 'active' : '' }` }>
                    { activeChannelId
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    }
                </div>
                { activeChannelId && <div className="voice-pulse" /> }
            </div>

            { /* Voice Panel */ }
            { isOpen && (
                <div className="voice-panel">
                    <div className="voice-panel-header">
                        <span>Sprachchat</span>
                        <button className="voice-close-btn" onClick={ () => setIsOpen(false) }>x</button>
                    </div>

                    <div className="voice-channels-list">
                        { channels.map(ch => (
                            <div key={ ch.id } className="voice-channel-item">
                                <div
                                    className={ `voice-channel-name ${ activeChannelId === ch.id ? 'active' : '' }` }
                                    onClick={ () => activeChannelId === ch.id ? leaveChannel() : joinChannel(ch) }
                                >
                                    <span className="voice-channel-icon">{ activeChannelId === ch.id ? '\u{1F50A}' : '\u{1F508}' }</span>
                                    <span>{ ch.name }</span>
                                    { (ch.max || ch.maxParticipants) ? (
                                        <span className="voice-channel-count">
                                            { activeChannelId === ch.id ? participants.length : 0 }/{ ch.max || ch.maxParticipants }
                                        </span>
                                    ) : null }
                                </div>

                                { activeChannelId === ch.id && participants.length > 0 && (
                                    <div className="voice-participants">
                                        { participants.map(p => (
                                            <div
                                                key={ p.identity }
                                                className={ `voice-participant ${ p.isSpeaking ? 'speaking' : '' }` }
                                                onContextMenu={ (e) =>
                                                {
                                                    if(!isMod || p.identity === GetSessionDataManager().userName) return;
                                                    e.preventDefault();
                                                    kickParticipant(p.identity);
                                                } }
                                            >
                                                <span className={ `voice-participant-dot ${ p.isMuted ? 'muted' : 'active' }` } />
                                                <span>{ p.identity }</span>
                                                { p.isSpeaking && <span className="voice-speaking-indicator" /> }
                                            </div>
                                        )) }
                                    </div>
                                ) }
                            </div>
                        )) }
                    </div>

                    { activeChannelId && (
                        <div className="voice-controls">
                            <button
                                className={ `voice-ctrl-btn ${ isMuted ? 'active' : '' }` }
                                onClick={ toggleMute }
                                title={ isMuted ? 'Mikro an' : 'Mikro aus' }
                            >
                                { isMuted ? '\u{1F507}' : '\u{1F3A4}' }
                            </button>
                            <button
                                className={ `voice-ctrl-btn ${ isDeafened ? 'active' : '' }` }
                                onClick={ toggleDeafen }
                                title={ isDeafened ? 'Audio an' : 'Audio aus' }
                            >
                                { isDeafened ? '\u{1F515}' : '\u{1F514}' }
                            </button>
                            <button
                                className="voice-ctrl-btn disconnect"
                                onClick={ leaveChannel }
                                title="Verlassen"
                            >
                                x
                            </button>
                            <button
                                className={ `voice-ctrl-btn ptt ${ pushToTalk ? 'active' : '' }` }
                                onClick={ () => setPushToTalk(!pushToTalk) }
                                title={ pushToTalk ? 'Push-to-Talk aus' : 'Push-to-Talk an (V)' }
                            >
                                PTT
                            </button>
                        </div>
                    ) }

                    { connectionState === 'connecting' && (
                        <div className="voice-status">Verbinde...</div>
                    ) }
                </div>
            ) }
        </>
    );
};
