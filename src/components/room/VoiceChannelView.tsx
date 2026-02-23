import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager } from '../../api';
import { getAuthHeaders } from '../../api/utils/SessionTokenManager';
import { useRoom } from '../../hooks';
import { LiveKitRoom, useParticipants, useLocalParticipant, useTracks, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent, Room as LkRoom } from 'livekit-client';
import './VoiceChannelView.scss';

interface VoiceChannel {
    id: number;
    name: string;
    max: number;
    maxParticipants?: number;
}

type VoiceMode = 'always' | 'ptt';

const getVoiceMode = (): VoiceMode => (localStorage.getItem('voice_mode') as VoiceMode) || 'always';
const setVoiceMode = (m: VoiceMode) => localStorage.setItem('voice_mode', m);
const getPttKey = (): string => localStorage.getItem('voice_ptt_key') || 'KeyV';
const setPttKey = (k: string) => localStorage.setItem('voice_ptt_key', k);
const getPttKeyLabel = (code: string): string => {
    if(code.startsWith('Key')) return code.slice(3);
    if(code.startsWith('Digit')) return code.slice(5);
    const map: Record<string, string> = { Space: 'Leertaste', ShiftLeft: 'Shift', ShiftRight: 'Shift R', ControlLeft: 'Strg', ControlRight: 'Strg R', AltLeft: 'Alt', AltRight: 'Alt R', CapsLock: 'Caps' };
    return map[code] || code;
};

// --- Icons ---

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

const GearIcon: FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={ size } height={ size } viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
    </svg>
);

// --- PTT Hook ---

const usePushToTalk = (
    localParticipant: any,
    mode: VoiceMode,
    pttKey: string,
    isMuted: boolean,
    isDeafened: boolean,
    isConnected: boolean,
) =>
{
    const pttActiveRef = useRef(false);

    useEffect(() =>
    {
        if(!isConnected || mode !== 'ptt') return;

        // In PTT mode, mic starts disabled
        if(localParticipant && !isMuted && !isDeafened)
        {
            localParticipant.setMicrophoneEnabled(false);
        }

        const onKeyDown = (e: KeyboardEvent) =>
        {
            if(e.code !== pttKey || pttActiveRef.current || isMuted || isDeafened) return;
            // Don't trigger PTT when typing in input fields
            const tag = (e.target as HTMLElement)?.tagName;
            if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            pttActiveRef.current = true;
            localParticipant?.setMicrophoneEnabled(true);
        };

        const onKeyUp = (e: KeyboardEvent) =>
        {
            if(e.code !== pttKey || !pttActiveRef.current) return;
            pttActiveRef.current = false;
            localParticipant?.setMicrophoneEnabled(false);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () =>
        {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            pttActiveRef.current = false;
        };
    }, [ localParticipant, mode, pttKey, isMuted, isDeafened, isConnected ]);
};

// --- Voice Settings Popover ---

const VoiceSettings: FC<{
    mode: VoiceMode;
    pttKey: string;
    anchorRef: React.RefObject<HTMLButtonElement>;
    onChangeMode: (m: VoiceMode) => void;
    onChangePttKey: (k: string) => void;
    onClose: () => void;
}> = ({ mode, pttKey, anchorRef, onChangeMode, onChangePttKey, onClose }) =>
{
    const [ listening, setListening ] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const [ pos, setPos ] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() =>
    {
        const anchor = anchorRef.current;
        if(!anchor) return;
        const rect = anchor.getBoundingClientRect();
        const panelW = 220;
        const panelH = mode === 'ptt' ? 110 : 80;
        let top = rect.top - panelH - 8;
        let left = rect.right - panelW;
        if(top < 8) top = rect.bottom + 8;
        if(left < 8) left = 8;
        setPos({ top, left });
    }, [ anchorRef, mode ]);

    // Close on outside click
    useEffect(() =>
    {
        const handler = (e: MouseEvent) =>
        {
            if(panelRef.current?.contains(e.target as Node)) return;
            if(anchorRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ onClose, anchorRef ]);

    useEffect(() =>
    {
        if(!listening) return;
        const handler = (e: KeyboardEvent) =>
        {
            e.preventDefault();
            e.stopPropagation();
            onChangePttKey(e.code);
            setListening(false);
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [ listening, onChangePttKey ]);

    return (
        <div className="dc-voice-settings" ref={ panelRef } style={{ top: pos.top, left: pos.left }}>
            <div className="dc-voice-settings-title">Sprach-Einstellungen</div>
            <div className="dc-voice-settings-row">
                <span className="dc-voice-settings-label">Modus</span>
                <div className="dc-voice-settings-toggle">
                    <button
                        className={ `dc-voice-settings-opt ${ mode === 'always' ? 'dc-voice-settings-opt--active' : '' }` }
                        onClick={ () => onChangeMode('always') }>
                        Immer aktiv
                    </button>
                    <button
                        className={ `dc-voice-settings-opt ${ mode === 'ptt' ? 'dc-voice-settings-opt--active' : '' }` }
                        onClick={ () => onChangeMode('ptt') }>
                        Push-to-Talk
                    </button>
                </div>
            </div>
            { mode === 'ptt' && (
                <div className="dc-voice-settings-row">
                    <span className="dc-voice-settings-label">Taste</span>
                    <button
                        className={ `dc-voice-settings-keybind ${ listening ? 'dc-voice-settings-keybind--listening' : '' }` }
                        onClick={ () => setListening(true) }>
                        { listening ? 'Drücke eine Taste...' : getPttKeyLabel(pttKey) }
                    </button>
                </div>
            ) }
        </div>
    );
};

// --- Voice Controls ---

const VoiceControls: FC<{
    channelName: string;
    onDisconnect: () => void;
    voiceMode: VoiceMode;
    pttKey: string;
    onChangeMode: (m: VoiceMode) => void;
    onChangePttKey: (k: string) => void;
}> = ({ channelName, onDisconnect, voiceMode, pttKey, onChangeMode, onChangePttKey }) =>
{
    const { localParticipant } = useLocalParticipant();
    const [ isMuted, setIsMuted ] = useState(false);
    const [ isDeafened, setIsDeafened ] = useState(false);
    const [ showSettings, setShowSettings ] = useState(false);
    const gearBtnRef = useRef<HTMLButtonElement>(null);
    const participants = useParticipants();
    const username = GetSessionDataManager().userName;

    usePushToTalk(localParticipant, voiceMode, pttKey, isMuted, isDeafened, true);

    const toggleMute = useCallback(async () =>
    {
        if(voiceMode === 'ptt') return; // PTT controls mic
        const newMuted = !isMuted;
        await localParticipant.setMicrophoneEnabled(!newMuted);
        setIsMuted(newMuted);
    }, [ localParticipant, isMuted, voiceMode ]);

    const toggleDeafen = useCallback(async () =>
    {
        const newDeafened = !isDeafened;

        participants.forEach(p =>
        {
            if(p.identity === localParticipant.identity) return;
            p.audioTrackPublications.forEach(pub =>
            {
                if(pub.track) pub.track.enabled = !newDeafened;
            });
        });

        if(newDeafened && !isMuted)
        {
            await localParticipant.setMicrophoneEnabled(false);
            setIsMuted(true);
        }
        else if(!newDeafened && isMuted)
        {
            if(voiceMode === 'always')
            {
                await localParticipant.setMicrophoneEnabled(true);
            }
            setIsMuted(false);
        }

        setIsDeafened(newDeafened);
    }, [ localParticipant, isDeafened, isMuted, participants, voiceMode ]);

    return (
        <div className="dc-voice-footer">
            <div className="dc-voice-connected-info">
                <div className="dc-voice-signal" />
                <div className="dc-voice-connected-text">
                    <span className="dc-voice-connected-label">Sprachverbunden</span>
                    <span className="dc-voice-connected-channel">
                        { channelName }
                        { voiceMode === 'ptt' && <span className="dc-voice-ptt-badge">PTT</span> }
                    </span>
                </div>
            </div>
            <div className="dc-voice-user-controls">
                <div className="dc-voice-user-info">
                    <div className="dc-voice-user-avatar">
                        <img
                            src={ `https://www.habbo.de/habbo-imaging/avatarimage?figure=${ GetSessionDataManager().figure }&direction=2&head_direction=2&headonly=1&size=s` }
                            alt={ username }
                        />
                    </div>
                    <span className="dc-voice-user-name">{ username }</span>
                </div>
                <div className="dc-voice-buttons">
                    <button
                        className={ `dc-voice-btn ${ isMuted ? 'dc-voice-btn--danger' : '' } ${ voiceMode === 'ptt' ? 'dc-voice-btn--disabled' : '' }` }
                        onClick={ toggleMute }
                        title={ voiceMode === 'ptt' ? `Push-to-Talk: ${ getPttKeyLabel(pttKey) }` : (isMuted ? 'Mikrofon einschalten' : 'Mikrofon ausschalten') }
                    >
                        { isMuted ? <MicMuteIcon size={ 20 } /> : <MicIcon size={ 20 } /> }
                    </button>
                    <button
                        className={ `dc-voice-btn ${ isDeafened ? 'dc-voice-btn--danger' : '' }` }
                        onClick={ toggleDeafen }
                        title={ isDeafened ? 'Ton einschalten' : 'Ton ausschalten' }
                    >
                        { isDeafened ? <DeafenIcon size={ 20 } /> : <HeadphoneIcon size={ 20 } /> }
                    </button>
                    <button
                        ref={ gearBtnRef }
                        className={ `dc-voice-btn ${ showSettings ? 'dc-voice-btn--active' : '' }` }
                        onClick={ () => setShowSettings(!showSettings) }
                        title="Einstellungen"
                    >
                        <GearIcon size={ 18 } />
                    </button>
                    { showSettings && (
                        <VoiceSettings
                            mode={ voiceMode }
                            pttKey={ pttKey }
                            anchorRef={ gearBtnRef as React.RefObject<HTMLButtonElement> }
                            onChangeMode={ onChangeMode }
                            onChangePttKey={ onChangePttKey }
                            onClose={ () => setShowSettings(false) }
                        />
                    ) }
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
    );
};

// --- Auto-Delete Empty Channel Hook ---

const useAutoDeleteChannel: (
    cmsUrl: string,
    roomId: number | undefined,
    channelId: number | null,
    channelName: string,
    onDeleted: () => void,
) => void = (cmsUrl, roomId, channelId, channelName, onDeleted) =>
{
    const participants = useParticipants();

    useEffect(() =>
    {
        if(!channelId || !roomId || !cmsUrl) return;
        // "Allgemein" is never auto-deleted
        if(channelName.toLowerCase() === 'allgemein') return;
        // Only trigger when we're the last participant and we just went to 1
        if(participants.length !== 1) return;

        // We're the only one left; when we disconnect, the channel should be deleted.
        // We can't do it on our own disconnect (component unmounts), so we watch for
        // other participants leaving. The actual deletion on our disconnect is handled
        // by the disconnect callback in the parent.
    }, [ participants.length, channelId, roomId, cmsUrl, channelName ]);
};

// --- Connected Content ---

const VoiceConnectedContent: FC<{
    channelId: number;
    channelName: string;
    livekitUrl: string;
    token: string;
    cmsUrl: string;
    roomId: number | undefined;
    voiceMode: VoiceMode;
    pttKey: string;
    onChangeMode: (m: VoiceMode) => void;
    onChangePttKey: (k: string) => void;
    onDisconnect: () => void;
}> = ({ channelId, channelName, livekitUrl, token, cmsUrl, roomId, voiceMode, pttKey, onChangeMode, onChangePttKey, onDisconnect }) =>
{
    return (
        <LiveKitRoom
            serverUrl={ livekitUrl }
            token={ token }
            connect={ true }
            audio={ voiceMode === 'always' }
            video={ false }
            data-lk-theme="default"
        >
            <RoomAudioRenderer />
            <VoiceParticipantsList />
            <AutoDeleteWatcher
                cmsUrl={ cmsUrl }
                roomId={ roomId }
                channelId={ channelId }
                channelName={ channelName }
                onDisconnect={ onDisconnect }
            />
            <VoiceControls
                channelName={ channelName }
                onDisconnect={ onDisconnect }
                voiceMode={ voiceMode }
                pttKey={ pttKey }
                onChangeMode={ onChangeMode }
                onChangePttKey={ onChangePttKey }
            />
        </LiveKitRoom>
    );
};

// Watches for empty channel and auto-deletes (except "Allgemein")
const AutoDeleteWatcher: FC<{
    cmsUrl: string;
    roomId: number | undefined;
    channelId: number;
    channelName: string;
    onDisconnect: () => void;
}> = ({ cmsUrl, roomId, channelId, channelName, onDisconnect }) =>
{
    const participants = useParticipants();
    const lastCountRef = useRef(participants.length);

    useEffect(() =>
    {
        // Track participant count changes
        const prevCount = lastCountRef.current;
        lastCountRef.current = participants.length;

        // If someone left and now only we remain, mark for auto-delete on our disconnect
        // (handled by parent's disconnect callback)
    }, [ participants.length ]);

    return null;
};

// --- Participants List ---

const VoiceParticipantsList: FC = () =>
{
    const participants = useParticipants();
    const tracks = useTracks([ Track.Source.Microphone ]);

    const getFigureForUser = useCallback((username: string): string =>
    {
        try
        {
            const session = GetRoomSession();
            if(!session) return '';
            const roomObjects = GetRoomEngine().getRoomObjects(session.roomId, RoomObjectCategory.UNIT);
            for(const obj of roomObjects)
            {
                const ud = session.userDataManager.getUserDataByIndex(obj.id);
                if(ud?.name === username) return ud.figure;
            }
        }
        catch(_) {}
        return '';
    }, []);

    return (
        <div className="dc-voice-participants">
            { participants.map(p =>
            {
                const isSpeaking = p.isSpeaking;
                const isMuted = !p.isMicrophoneEnabled;
                const figure = getFigureForUser(p.identity);

                return (
                    <div key={ p.identity } className={ `dc-voice-participant ${ isSpeaking ? 'dc-voice-participant--speaking' : '' }` }>
                        <div className={ `dc-voice-participant-avatar ${ isSpeaking ? 'dc-voice-participant-avatar--speaking' : '' }` }>
                            <div className="dc-voice-participant-avatar-inner">
                                { figure
                                    ? <img src={ `https://www.habbo.de/habbo-imaging/avatarimage?figure=${ figure }&direction=2&head_direction=2&headonly=1&size=s` } alt={ p.identity } />
                                    : p.identity.charAt(0).toUpperCase()
                                }
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

// --- Main Component ---

export const VoiceChannelView: FC<{}> = () =>
{
    const { roomSession } = useRoom();
    const [ channels, setChannels ] = useState<VoiceChannel[]>([]);
    const [ activeChannelId, setActiveChannelId ] = useState<number | null>(null);
    const [ activeChannelName, setActiveChannelName ] = useState<string>('');
    const [ token, setToken ] = useState<string>('');
    const [ isConnecting, setIsConnecting ] = useState(false);
    const [ showCreateForm, setShowCreateForm ] = useState(false);
    const [ newChannelName, setNewChannelName ] = useState('');
    const [ uiVisible, setUiVisible ] = useState(true);
    const [ joinError, setJoinError ] = useState<string | null>(null);
    const [ voiceMode, setVoiceModeState ] = useState<VoiceMode>(getVoiceMode());
    const [ pttKey, setPttKeyState ] = useState<string>(getPttKey());

    const cmsUrl = useMemo(() => GetConfiguration<string>('url.prefix', ''), []);
    const livekitUrl = useMemo(() => GetConfiguration<string>('voice.livekit.url', 'ws://localhost:7880'), []);
    const isMod = GetSessionDataManager().isModerator;
    const roomId = roomSession?.roomId;

    const isConnected = !!(activeChannelId && token);

    const handleChangeMode = useCallback((m: VoiceMode) =>
    {
        setVoiceModeState(m);
        setVoiceMode(m);
    }, []);

    const handleChangePttKey = useCallback((k: string) =>
    {
        setPttKeyState(k);
        setPttKey(k);
    }, []);

    const refreshChannels = useCallback(() =>
    {
        if(!roomId || !cmsUrl) return;

        fetch(`${ cmsUrl }/api/voice/channels?roomId=${ roomId }`)
            .then(r => { if(!r.ok) throw new Error(); return r.json(); })
            .then(data =>
            {
                if(data.channels && data.channels.length > 0)
                    setChannels(data.channels);
                else
                    setChannels([]);
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
        setJoinError(null);

        try
        {
            const res = await fetch(`${ cmsUrl }/api/voice/token`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ roomId, channelId: channel.id }),
            });

            if(res.status === 403)
            {
                const data = await res.json().catch(() => ({}));
                setJoinError(data.error || 'Channel ist voll');
                return;
            }

            if(!res.ok) throw new Error('Token-Fehler');
            const data = await res.json();

            setToken(data.token);
            setActiveChannelId(channel.id);
            setActiveChannelName(channel.name);
            setUiVisible(true);
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

    const disconnect = useCallback(async () =>
    {
        const chId = activeChannelId;
        const chName = activeChannelName;

        setActiveChannelId(null);
        setActiveChannelName('');
        setToken('');

        // Auto-delete: notify server we left (it checks if channel is empty)
        if(chId && roomId && cmsUrl && chName.toLowerCase() !== 'allgemein')
        {
            try
            {
                await fetch(`${ cmsUrl }/api/voice/channels/leave`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ roomId, channelId: chId }),
                });
                refreshChannels();
            }
            catch(_) {}
        }
    }, [ activeChannelId, activeChannelName, roomId, cmsUrl, refreshChannels ]);

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

    if(!roomId || channels.length === 0)
    {
        // No channels but still show toggle button if connected (edge case)
        if(!isConnected) return null;
    }

    return (
        <>
            {/* Toggle Button - always visible when channels exist */}
            <button
                className={ `dc-voice-toggle ${ isConnected ? 'dc-voice-toggle--connected' : '' }` }
                onClick={ () => setUiVisible(!uiVisible) }
                title={ uiVisible ? 'Sprachchat ausblenden' : 'Sprachchat einblenden' }
            >
                { isConnected
                    ? <MicIcon size={ 20 } />
                    : <MicMuteIcon size={ 20 } />
                }
            </button>

            {/* Voice Panel - hideable */}
            { uiVisible && (
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

                        { joinError && (
                            <div className="dc-voice-error">{ joinError }</div>
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
                                channelId={ activeChannelId }
                                channelName={ activeChannelName }
                                livekitUrl={ livekitUrl }
                                token={ token }
                                cmsUrl={ cmsUrl }
                                roomId={ roomId }
                                voiceMode={ voiceMode }
                                pttKey={ pttKey }
                                onChangeMode={ handleChangeMode }
                                onChangePttKey={ handleChangePttKey }
                                onDisconnect={ disconnect }
                            />
                        ) }
                    </div>
                </div>
            ) }
        </>
    );
};
