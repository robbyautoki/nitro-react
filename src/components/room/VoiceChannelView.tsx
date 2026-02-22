import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfiguration, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useRoom } from '../../hooks';
import { LiveKitRoom, useParticipants, useLocalParticipant, useTracks, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import './VoiceChannelView.scss';

interface VoiceChannel {
    id: number;
    name: string;
    max: number;
    maxParticipants?: number;
}

const MicIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="none">
        <path d="M12 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" fill="currentColor"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 19v3m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const MicMuteIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="none">
        <path d="M12 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" fill="currentColor" opacity="0.5"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <line x1="3" y1="3" x2="21" y2="21" stroke="#ed4245" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

const HeadphoneIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.03 3 3 7.03 3 12v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-2c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9Z"/>
    </svg>
);

const DeafenIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7.03 3 3 7.03 3 12v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-2c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9Z" fill="currentColor" opacity="0.5"/>
        <line x1="3" y1="3" x2="21" y2="21" stroke="#ed4245" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

const DisconnectIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9Z"/>
    </svg>
);

const PlusIcon: FC<{ size?: number }> = ({ size = 14 }) => (
    <svg width={ size } height={ size } viewBox="0 0 18 18" fill="currentColor">
        <polygon points="15 10 10 10 10 15 8 15 8 10 3 10 3 8 8 8 8 3 10 3 10 8 15 8"/>
    </svg>
);

const SpeakerIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
);

const VoiceConnectedContent: FC<{
    channelName: string;
    livekitUrl: string;
    token: string;
    isMuted: boolean;
    isDeafened: boolean;
    onToggleMute: () => void;
    onToggleDeafen: () => void;
    onDisconnect: () => void;
}> = ({ channelName, livekitUrl, token, isMuted, isDeafened, onToggleMute, onToggleDeafen, onDisconnect }) =>
{
    const username = GetSessionDataManager().userName;

    return (
        <LiveKitRoom
            serverUrl={ livekitUrl }
            token={ token }
            connect={ true }
            audio={ true }
            video={ false }
            data-lk-theme="default"
        >
            <RoomAudioRenderer />
            <VoiceParticipantsList />
            <div className="dc-voice-footer">
                <div className="dc-voice-connected-info">
                    <div className="dc-voice-signal" />
                    <div className="dc-voice-connected-text">
                        <span className="dc-voice-connected-label">Sprachverbunden</span>
                        <span className="dc-voice-connected-channel">{ channelName }</span>
                    </div>
                </div>
                <div className="dc-voice-user-controls">
                    <div className="dc-voice-user-info">
                        <div className="dc-voice-user-avatar">
                            <img
                                src={ `https://www.habbo.de/habbo-imaging/avatarimage?figure=${ GetSessionDataManager().figure }&direction=2&head_direction=2&size=s` }
                                alt={ username }
                            />
                        </div>
                        <span className="dc-voice-user-name">{ username }</span>
                    </div>
                    <div className="dc-voice-buttons">
                        <button
                            className={ `dc-voice-btn ${ isMuted ? 'dc-voice-btn--danger' : '' }` }
                            onClick={ onToggleMute }
                            title={ isMuted ? 'Mikrofon einschalten' : 'Mikrofon ausschalten' }
                        >
                            { isMuted ? <MicMuteIcon size={ 20 } /> : <MicIcon size={ 20 } /> }
                        </button>
                        <button
                            className={ `dc-voice-btn ${ isDeafened ? 'dc-voice-btn--danger' : '' }` }
                            onClick={ onToggleDeafen }
                            title={ isDeafened ? 'Ton einschalten' : 'Ton ausschalten' }
                        >
                            { isDeafened ? <DeafenIcon size={ 20 } /> : <HeadphoneIcon size={ 20 } /> }
                        </button>
                        <button
                            className="dc-voice-btn dc-voice-btn--disconnect"
                            onClick={ onDisconnect }
                            title="Trennen"
                        >
                            <DisconnectIcon size={ 20 } />
                        </button>
                    </div>
                </div>
            </div>
        </LiveKitRoom>
    );
};

const VoiceParticipantsList: FC = () =>
{
    const participants = useParticipants();
    const tracks = useTracks([ Track.Source.Microphone ]);

    return (
        <div className="dc-voice-participants">
            { participants.map(p =>
            {
                const audioTrack = tracks.find(t => t.participant.identity === p.identity);
                const isSpeaking = p.isSpeaking;
                const isMuted = !p.isMicrophoneEnabled;

                return (
                    <div key={ p.identity } className={ `dc-voice-participant ${ isSpeaking ? 'dc-voice-participant--speaking' : '' }` }>
                        <div className={ `dc-voice-participant-avatar ${ isSpeaking ? 'dc-voice-participant-avatar--speaking' : '' }` }>
                            <div className="dc-voice-participant-avatar-inner">
                                { p.identity.charAt(0).toUpperCase() }
                            </div>
                        </div>
                        <span className={ `dc-voice-participant-name ${ isMuted ? 'dc-voice-participant-name--muted' : '' }` }>
                            { p.identity }
                        </span>
                        { isMuted && (
                            <span className="dc-voice-participant-muted">
                                <MicMuteIcon size={ 14 } />
                            </span>
                        ) }
                    </div>
                );
            }) }
        </div>
    );
};

export const VoiceChannelView: FC<{}> = () =>
{
    const { roomSession } = useRoom();
    const [ channels, setChannels ] = useState<VoiceChannel[]>([]);
    const [ activeChannelId, setActiveChannelId ] = useState<number | null>(null);
    const [ activeChannelName, setActiveChannelName ] = useState<string>('');
    const [ token, setToken ] = useState<string>('');
    const [ isMuted, setIsMuted ] = useState(false);
    const [ isDeafened, setIsDeafened ] = useState(false);
    const [ isConnecting, setIsConnecting ] = useState(false);
    const [ showCreateForm, setShowCreateForm ] = useState(false);
    const [ newChannelName, setNewChannelName ] = useState('');

    const cmsUrl = useMemo(() => GetConfiguration<string>('url.prefix', ''), []);
    const livekitUrl = useMemo(() => GetConfiguration<string>('voice.livekit.url', 'ws://localhost:7880'), []);
    const isMod = GetSessionDataManager().isModerator;
    const roomId = roomSession?.roomId;

    const refreshChannels = useCallback(() =>
    {
        if(!roomId || !cmsUrl) return;

        fetch(`${ cmsUrl }/api/voice/channels?roomId=${ roomId }`)
            .then(r => { if(!r.ok) throw new Error(); return r.json(); })
            .then(data =>
            {
                if(data.channels && data.channels.length > 0)
                    setChannels(data.channels);
            })
            .catch(() => {});
    }, [ roomId, cmsUrl ]);

    useEffect(() => { refreshChannels(); }, [ refreshChannels ]);

    useEffect(() =>
    {
        if(!roomId || !cmsUrl) return;
        const interval = setInterval(refreshChannels, 10000);
        return () => clearInterval(interval);
    }, [ roomId, cmsUrl, refreshChannels ]);

    useEffect(() =>
    {
        const handler = (event: CustomEvent) =>
        {
            try
            {
                const msg = event.detail?.message;
                if(!msg || !msg.startsWith('[VOICE_CHANNELS]')) return;
                const json = JSON.parse(msg.replace('[VOICE_CHANNELS]', ''));
                if(json.roomId === roomId) setChannels(json.channels || []);
            }
            catch(_) {}
        };
        window.addEventListener('whisper_message' as any, handler);
        return () => window.removeEventListener('whisper_message' as any, handler);
    }, [ roomId ]);

    useEffect(() =>
    {
        return () =>
        {
            setActiveChannelId(null);
            setToken('');
        };
    }, [ roomId ]);

    const joinChannel = useCallback(async (channel: VoiceChannel) =>
    {
        if(isConnecting) return;
        setIsConnecting(true);

        try
        {
            const res = await fetch(`${ cmsUrl }/api/voice/token`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ roomId, channelId: channel.id }),
            });

            if(!res.ok) throw new Error('Token-Fehler');
            const data = await res.json();

            setToken(data.token);
            setActiveChannelId(channel.id);
            setActiveChannelName(channel.name);
            setIsMuted(false);
            setIsDeafened(false);
        }
        catch(e)
        {
            console.error('[Voice] Join failed:', e);
        }
        finally
        {
            setIsConnecting(false);
        }
    }, [ cmsUrl, roomId, isConnecting ]);

    const disconnect = useCallback(() =>
    {
        setActiveChannelId(null);
        setActiveChannelName('');
        setToken('');
        setIsMuted(false);
        setIsDeafened(false);
    }, []);

    const createChannel = useCallback(async () =>
    {
        if(!newChannelName.trim() || !cmsUrl || !roomId) return;

        try
        {
            await fetch(`${ cmsUrl }/api/voice/channels`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ roomId, name: newChannelName.trim(), maxParticipants: 0 }),
            });
            setNewChannelName('');
            setShowCreateForm(false);
            refreshChannels();
        }
        catch(e) { console.error('[Voice] Create failed:', e); }
    }, [ cmsUrl, roomId, newChannelName, refreshChannels ]);

    if(!roomId || channels.length === 0) return null;

    return (
        <div className="dc-voice">
            <div className="dc-voice-panel">
                <div className="dc-voice-header">
                    <span className="dc-voice-header-label">SPRACHCHANNEL</span>
                    { isMod && (
                        <button
                            className="dc-voice-header-add"
                            onClick={ () => setShowCreateForm(!showCreateForm) }
                            title="Channel erstellen"
                        >
                            <PlusIcon />
                        </button>
                    ) }
                </div>

                { showCreateForm && (
                    <div className="dc-voice-create">
                        <input
                            className="dc-voice-create-input"
                            type="text"
                            placeholder="Channel-Name..."
                            value={ newChannelName }
                            onChange={ e => setNewChannelName(e.target.value) }
                            onKeyDown={ e => e.key === 'Enter' && createChannel() }
                            autoFocus
                        />
                        <div className="dc-voice-create-actions">
                            <button className="dc-voice-create-btn" onClick={ createChannel }>Erstellen</button>
                            <button className="dc-voice-create-cancel" onClick={ () => { setShowCreateForm(false); setNewChannelName(''); } }>Abbrechen</button>
                        </div>
                    </div>
                ) }

                <div className="dc-voice-channels">
                    { channels.map(ch => (
                        <div key={ ch.id } className="dc-voice-channel">
                            <div
                                className={ `dc-voice-channel-row ${ activeChannelId === ch.id ? 'dc-voice-channel-row--active' : '' }` }
                                onClick={ () => activeChannelId === ch.id ? disconnect() : joinChannel(ch) }
                            >
                                <SpeakerIcon />
                                <span className="dc-voice-channel-name">{ ch.name }</span>
                                { (ch.max || ch.maxParticipants) ? (
                                    <span className="dc-voice-channel-limit">{ ch.max || ch.maxParticipants }</span>
                                ) : null }
                            </div>
                        </div>
                    )) }
                </div>

                { isConnecting && (
                    <div className="dc-voice-status">Verbinde...</div>
                ) }

                { activeChannelId && token && (
                    <VoiceConnectedContent
                        channelName={ activeChannelName }
                        livekitUrl={ livekitUrl }
                        token={ token }
                        isMuted={ isMuted }
                        isDeafened={ isDeafened }
                        onToggleMute={ () => setIsMuted(!isMuted) }
                        onToggleDeafen={ () => setIsDeafened(!isDeafened) }
                        onDisconnect={ disconnect }
                    />
                ) }
            </div>
        </div>
    );
};
