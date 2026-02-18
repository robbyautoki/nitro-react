import { HabboClubLevelEnum, RoomControllerLevel } from '@nitrots/nitro-renderer';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatMessageTypeEnum, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, LocalizeText, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { useChatInputWidget, useRoom, useSessionInfo, useUiEvent } from '../../../../hooks';
import { ChatInputEmojiPickerView } from './ChatInputEmojiPickerView';
import { ChatInputStyleSelectorView } from './ChatInputStyleSelectorView';

const CHAT_COMMANDS: { command: string, description: string, minRank: number, category: string }[] = [
    // ── Client ─────────────────────────────────────────────
    { command: ':shake', description: 'Raum schuetteln', minRank: 0, category: 'Client' },
    { command: ':rotate', description: 'Raum drehen', minRank: 0, category: 'Client' },
    { command: ':flip', description: 'Raum spiegeln', minRank: 0, category: 'Client' },
    { command: ':zoom', description: 'Zoom-Level setzen', minRank: 0, category: 'Client' },
    { command: ':screenshot', description: 'Screenshot erstellen', minRank: 0, category: 'Client' },
    { command: ':togglefps', description: 'FPS-Anzeige umschalten', minRank: 0, category: 'Client' },
    { command: ':d', description: 'Lach-Ausdruck', minRank: 0, category: 'Client' },
    { command: ':kiss', description: 'Kuss werfen', minRank: 0, category: 'Client' },
    { command: ':jump', description: 'Springen', minRank: 0, category: 'Client' },
    { command: ':idle', description: 'AFK gehen', minRank: 0, category: 'Client' },
    { command: ':sign', description: 'Schild zeigen (Nummer)', minRank: 0, category: 'Client' },
    { command: 'o/', description: 'Winken', minRank: 0, category: 'Client' },
    { command: ':furni', description: 'Moebel-Waehler', minRank: 0, category: 'Client' },
    { command: ':chooser', description: 'User-Waehler', minRank: 0, category: 'Client' },
    { command: ':floor', description: 'Boden-Editor', minRank: 0, category: 'Client' },
    { command: ':settings', description: 'Raum-Einstellungen', minRank: 0, category: 'Client' },
    // ── Allgemein ──────────────────────────────────────────
    { command: ':lotto', description: 'Lotto-Info anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':lotto buy', description: 'Tickets kaufen [anzahl]', minRank: 0, category: 'Allgemein' },
    { command: ':lotto history', description: 'Letzte Gewinner anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':sit', description: 'Hinsetzen', minRank: 0, category: 'Allgemein' },
    { command: ':stand', description: 'Aufstehen', minRank: 0, category: 'Allgemein' },
    { command: ':lay', description: 'Hinlegen', minRank: 0, category: 'Allgemein' },
    { command: ':redeem', description: 'Moebel eintauschen', minRank: 0, category: 'Allgemein' },
    { command: ':info', description: 'Hotel-Info', minRank: 0, category: 'Allgemein' },
    { command: ':empty', description: 'Inventar leeren', minRank: 0, category: 'Allgemein' },
    { command: ':commands', description: 'Alle Commands anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':plugins', description: 'Geladene Plugins anzeigen', minRank: 0, category: 'Allgemein' },
    // ── VIP ────────────────────────────────────────────────
    { command: ':mimic', description: 'Look kopieren', minRank: 2, category: 'VIP' },
    { command: ':moonwalk', description: 'Moonwalk an/aus', minRank: 2, category: 'VIP' },
    { command: ':pickall', description: 'Alle Moebel einpacken', minRank: 2, category: 'VIP' },
    { command: ':ejectall', description: 'Alle Moebel rauswerfen', minRank: 2, category: 'VIP' },
    { command: ':stalk', description: 'User folgen', minRank: 2, category: 'VIP' },
    // ── Moderator ──────────────────────────────────────────
    { command: ':alert', description: 'User benachrichtigen', minRank: 4, category: 'Moderator' },
    { command: ':mute', description: 'User stummschalten', minRank: 4, category: 'Moderator' },
    { command: ':unmute', description: 'User entstummen', minRank: 4, category: 'Moderator' },
    { command: ':kick', description: 'Alle aus Raum kicken', minRank: 4, category: 'Moderator' },
    { command: ':softkick', description: 'User aus Raum kicken', minRank: 4, category: 'Moderator' },
    { command: ':roomalert', description: 'Raum-Benachrichtigung', minRank: 4, category: 'Moderator' },
    { command: ':roommute', description: 'Raum stummschalten', minRank: 4, category: 'Moderator' },
    { command: ':teleport', description: 'Teleport an/aus', minRank: 4, category: 'Moderator' },
    { command: ':pull', description: 'User heranziehen', minRank: 4, category: 'Moderator' },
    { command: ':push', description: 'User wegstossen', minRank: 4, category: 'Moderator' },
    { command: ':coords', description: 'Koordinaten anzeigen', minRank: 4, category: 'Moderator' },
    { command: ':enable', description: 'Effekt aktivieren', minRank: 4, category: 'Moderator' },
    { command: ':handitem', description: 'Hand-Item geben', minRank: 4, category: 'Moderator' },
    { command: ':fastwalk', description: 'Schnell laufen', minRank: 4, category: 'Moderator' },
    { command: ':hidewired', description: 'Wired verstecken', minRank: 4, category: 'Moderator' },
    { command: ':danceall', description: 'Alle tanzen lassen', minRank: 4, category: 'Moderator' },
    { command: ':shoutall', description: 'Alle rufen lassen', minRank: 4, category: 'Moderator' },
    { command: ':say', description: 'User etwas sagen lassen', minRank: 4, category: 'Moderator' },
    { command: ':multi', description: 'Multi-Command an/aus', minRank: 4, category: 'Moderator' },
    { command: ':chatcolor', description: 'Chat-Farbe setzen', minRank: 4, category: 'Moderator' },
    { command: ':changename', description: 'Namensaenderung erlauben', minRank: 4, category: 'Moderator' },
    { command: ':calendar', description: 'Kalender oeffnen', minRank: 4, category: 'Moderator' },
    { command: ':staffalert', description: 'Team-Alert senden', minRank: 4, category: 'Moderator' },
    { command: ':tradelock', description: 'Handeln sperren/entsperren', minRank: 4, category: 'Moderator' },
    { command: ':reload', description: 'Raum neu laden', minRank: 4, category: 'Moderator' },
    { command: ':pet_info', description: 'Pet-Info anzeigen', minRank: 4, category: 'Moderator' },
    { command: ':disconnect', description: 'User disconnecten', minRank: 4, category: 'Moderator' },
    { command: ':blockalert', description: 'Alerts blockieren', minRank: 4, category: 'Moderator' },
    { command: ':mute_bots', description: 'Bots stummschalten', minRank: 4, category: 'Moderator' },
    { command: ':mute_pets', description: 'Pets stummschalten', minRank: 4, category: 'Moderator' },
    { command: ':connect_camera', description: 'Kamera verbinden', minRank: 4, category: 'Moderator' },
    // ── Admin ──────────────────────────────────────────────
    { command: ':lotto draw', description: 'Ziehung sofort starten', minRank: 5, category: 'Admin' },
    { command: ':lotto on', description: 'Lotto aktivieren', minRank: 5, category: 'Admin' },
    { command: ':lotto off', description: 'Lotto deaktivieren', minRank: 5, category: 'Admin' },
    { command: ':lotto settime', description: 'Ziehungszeit setzen (HH:MM)', minRank: 5, category: 'Admin' },
    { command: ':lotto setprice', description: 'Ticket-Preis setzen', minRank: 5, category: 'Admin' },
    { command: ':lotto setjackpot', description: 'Basis-Jackpot setzen', minRank: 5, category: 'Admin' },
    { command: ':ban', description: 'User bannen', minRank: 5, category: 'Admin' },
    { command: ':unban', description: 'User entbannen', minRank: 5, category: 'Admin' },
    { command: ':credits', description: 'Credits geben', minRank: 5, category: 'Admin' },
    { command: ':duckets', description: 'Duckets geben', minRank: 5, category: 'Admin' },
    { command: ':points', description: 'Punkte geben', minRank: 5, category: 'Admin' },
    { command: ':badge', description: 'Badge geben', minRank: 5, category: 'Admin' },
    { command: ':takebadge', description: 'Badge entfernen', minRank: 5, category: 'Admin' },
    { command: ':gift', description: 'Geschenk senden', minRank: 5, category: 'Admin' },
    { command: ':ha', description: 'Hotel-Alert senden', minRank: 5, category: 'Admin' },
    { command: ':hal', description: 'Hotel-Alert mit Link', minRank: 5, category: 'Admin' },
    { command: ':freeze', description: 'User einfrieren', minRank: 5, category: 'Admin' },
    { command: ':summon', description: 'User herbeirufen', minRank: 5, category: 'Admin' },
    { command: ':event', description: 'Raum-Event erstellen', minRank: 5, category: 'Admin' },
    { command: ':invisible', description: 'Unsichtbar werden', minRank: 5, category: 'Admin' },
    { command: ':diagonal', description: 'Diagonales Laufen an/aus', minRank: 5, category: 'Admin' },
    { command: ':faceless', description: 'Gesichtslos machen', minRank: 5, category: 'Admin' },
    { command: ':roombadge', description: 'Badge an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roomcredits', description: 'Credits an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roomduckets', description: 'Duckets an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roompoints', description: 'Punkte an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roomeffect', description: 'Effekt an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roomgift', description: 'Geschenk an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':roomitem', description: 'Item an alle im Raum', minRank: 5, category: 'Admin' },
    { command: ':setmax', description: 'Max User im Raum setzen', minRank: 5, category: 'Admin' },
    { command: ':setpoll', description: 'Umfrage setzen', minRank: 5, category: 'Admin' },
    { command: ':subscription', description: 'HC/VIP Abo geben', minRank: 5, category: 'Admin' },
    { command: ':control', description: 'User steuern', minRank: 5, category: 'Admin' },
    { command: ':bots', description: 'Bots anzeigen', minRank: 5, category: 'Admin' },
    { command: ':bundle', description: 'Raum-Bundle erstellen', minRank: 5, category: 'Admin' },
    { command: ':userinfo', description: 'User-Info anzeigen', minRank: 5, category: 'Admin' },
    { command: ':happyhour', description: 'Happy Hour starten', minRank: 5, category: 'Admin' },
    { command: ':transform', description: 'In Tier verwandeln', minRank: 5, category: 'Admin' },
    { command: ':superpull', description: 'Super-Pull (weiter)', minRank: 5, category: 'Admin' },
    { command: ':wordquiz', description: 'Wort-Quiz starten', minRank: 5, category: 'Admin' },
    { command: ':emptybots', description: 'Alle Bots loeschen', minRank: 5, category: 'Admin' },
    { command: ':emptypets', description: 'Alle Pets loeschen', minRank: 5, category: 'Admin' },
    { command: ':sayall', description: 'Alle sagen lassen', minRank: 5, category: 'Admin' },
    { command: ':freezebots', description: 'Bots einfrieren', minRank: 5, category: 'Admin' },
    { command: ':filter', description: 'Wort-Filter hinzufuegen', minRank: 5, category: 'Admin' },
    { command: ':update_catalogue', description: 'Katalog neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_items', description: 'Items neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_navigator', description: 'Navigator neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_bots', description: 'Bots neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_polls', description: 'Umfragen neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_achievements', description: 'Achievements neu laden', minRank: 5, category: 'Admin' },
    { command: ':update_hotelview', description: 'Hotel-View neu laden', minRank: 5, category: 'Admin' },
    { command: ':promote_offer', description: 'Promo-Angebot senden', minRank: 5, category: 'Admin' },
    { command: ':update_youtube', description: 'YouTube-Playlists neu laden', minRank: 5, category: 'Admin' },
    // ── Super-Admin ────────────────────────────────────────
    { command: ':masscredits', description: 'Credits an alle User', minRank: 6, category: 'Super-Admin' },
    { command: ':massduckets', description: 'Duckets an alle User', minRank: 6, category: 'Super-Admin' },
    { command: ':masspoints', description: 'Punkte an alle User', minRank: 6, category: 'Super-Admin' },
    { command: ':massbadge', description: 'Badge an alle User', minRank: 6, category: 'Super-Admin' },
    { command: ':massgift', description: 'Geschenk an alle User', minRank: 6, category: 'Super-Admin' },
    { command: ':ipban', description: 'IP-Ban', minRank: 6, category: 'Super-Admin' },
    { command: ':machineban', description: 'Machine-Ban', minRank: 6, category: 'Super-Admin' },
    { command: ':superban', description: 'Super-Ban (IP+Machine)', minRank: 6, category: 'Super-Admin' },
    { command: ':shutdown', description: 'Hotel herunterfahren', minRank: 6, category: 'Super-Admin' },
    { command: ':unload', description: 'Raum entladen', minRank: 6, category: 'Super-Admin' },
    { command: ':setspeed', description: 'Roller-Speed setzen', minRank: 6, category: 'Super-Admin' },
    { command: ':update_config', description: 'Config neu laden', minRank: 6, category: 'Super-Admin' },
    { command: ':update_texts', description: 'Texte neu laden', minRank: 6, category: 'Super-Admin' },
    { command: ':update_plugins', description: 'Plugins neu laden', minRank: 6, category: 'Super-Admin' },
    { command: ':add_youtube', description: 'YouTube-Playlist hinzufuegen', minRank: 6, category: 'Super-Admin' },
    // ── Root ───────────────────────────────────────────────
    { command: ':giverank', description: 'Rang vergeben', minRank: 7, category: 'Root' },
    { command: ':update_permissions', description: 'Permissions neu laden', minRank: 7, category: 'Root' },
    { command: ':update_guildparts', description: 'Gruppen-Teile neu laden', minRank: 7, category: 'Root' },
    { command: ':update_petdata', description: 'Pet-Daten neu laden', minRank: 7, category: 'Root' },
];

export const ChatInputView: FC<{}> = props =>
{
    const [ chatValue, setChatValue ] = useState<string>('');
    const [ showCommands, setShowCommands ] = useState(false);
    const [ commandFilter, setCommandFilter ] = useState('');
    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const { selectedUsername = '', floodBlocked = false, floodBlockedSeconds = 0, setIsTyping = null, setIsIdle = null, sendChat = null } = useChatInputWidget();
    const { roomSession = null } = useRoom();
    const inputRef = useRef<HTMLInputElement>();

    const chatModeIdWhisper = useMemo(() => LocalizeText('widgets.chatinput.mode.whisper'), []);
    const chatModeIdShout = useMemo(() => LocalizeText('widgets.chatinput.mode.shout'), []);
    const chatModeIdSpeak = useMemo(() => LocalizeText('widgets.chatinput.mode.speak'), []);
    const maxChatLength = useMemo(() => GetConfiguration<number>('chat.input.maxlength', 100), []);

    const anotherInputHasFocus = useCallback(() =>
    {
        const activeElement = document.activeElement;

        if(!activeElement) return false;

        if(inputRef && (inputRef.current === activeElement)) return false;

        if(!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) return false;

        return true;
    }, [ inputRef ]);

    const setInputFocus = useCallback(() =>
    {
        inputRef.current.focus();

        inputRef.current.setSelectionRange((inputRef.current.value.length * 2), (inputRef.current.value.length * 2));
    }, [ inputRef ]);

    const checkSpecialKeywordForInput = useCallback(() =>
    {
        setChatValue(prevValue =>
        {
            if((prevValue !== chatModeIdWhisper) || !selectedUsername.length) return prevValue;

            return (`${ prevValue } ${ selectedUsername }`);
        });
    }, [ selectedUsername, chatModeIdWhisper ]);

    const sendChatValue = useCallback((value: string, shiftKey: boolean = false) =>
    {
        if(!value || (value === '')) return;

        let chatType = (shiftKey ? ChatMessageTypeEnum.CHAT_SHOUT : ChatMessageTypeEnum.CHAT_DEFAULT);
        let text = value;

        const parts = text.split(' ');

        let recipientName = '';
        let append = '';

        switch(parts[0])
        {
            case chatModeIdWhisper:
                chatType = ChatMessageTypeEnum.CHAT_WHISPER;
                recipientName = parts[1];
                append = (chatModeIdWhisper + ' ' + recipientName + ' ');

                parts.shift();
                parts.shift();
                break;
            case chatModeIdShout:
                chatType = ChatMessageTypeEnum.CHAT_SHOUT;

                parts.shift();
                break;
            case chatModeIdSpeak:
                chatType = ChatMessageTypeEnum.CHAT_DEFAULT;

                parts.shift();
                break;
        }

        text = parts.join(' ');

        setIsTyping(false);
        setIsIdle(false);

        if(text.length <= maxChatLength)
        {
            if(/%CC%/g.test(encodeURIComponent(text)))
            {
                setChatValue('');
            }
            else
            {
                setChatValue('');
                sendChat(text, chatType, recipientName, chatStyleId);
            }
        }

        setChatValue(append);
    }, [ chatModeIdWhisper, chatModeIdShout, chatModeIdSpeak, maxChatLength, chatStyleId, setIsTyping, setIsIdle, sendChat ]);

    const updateChatInput = useCallback((value: string) =>
    {
        if(!value || !value.length)
        {
            setIsTyping(false);
        }
        else
        {
            setIsTyping(true);
            setIsIdle(true);
        }

        if(value.startsWith(':'))
        {
            setShowCommands(true);
            setCommandFilter(value.slice(1).toLowerCase());
        }
        else
        {
            setShowCommands(false);
        }

        setChatValue(value);
    }, [ setIsTyping, setIsIdle ]);

    const onKeyDownEvent = useCallback((event: KeyboardEvent) =>
    {
        if(floodBlocked || !inputRef.current || anotherInputHasFocus()) return;

        if(document.activeElement !== inputRef.current) setInputFocus();

        const value = (event.target as HTMLInputElement).value;

        switch(event.key)
        {
            case ' ':
            case 'Space':
                checkSpecialKeywordForInput();
                return;
            case 'NumpadEnter':
            case 'Enter':
                sendChatValue(value, event.shiftKey);
                return;
            case 'Backspace':
                if(value)
                {
                    const parts = value.split(' ');

                    if((parts[0] === chatModeIdWhisper) && (parts.length === 3) && (parts[2] === ''))
                    {
                        setChatValue('');
                    }
                }
                return;
        }

    }, [ floodBlocked, inputRef, chatModeIdWhisper, anotherInputHasFocus, setInputFocus, checkSpecialKeywordForInput, sendChatValue ]);

    useUiEvent<RoomWidgetUpdateChatInputContentEvent>(RoomWidgetUpdateChatInputContentEvent.CHAT_INPUT_CONTENT, event =>
    {
        switch(event.chatMode)
        {
            case RoomWidgetUpdateChatInputContentEvent.WHISPER: {
                setChatValue(`${ chatModeIdWhisper } ${ event.userName } `);
                return;
            }
            case RoomWidgetUpdateChatInputContentEvent.SHOUT:
                return;
        }
    });

    const chatStyleIds = useMemo(() =>
    {
        let styleIds: number[] = [];

        const styles = GetConfiguration<{ styleId: number, minRank: number, isSystemStyle: boolean, isHcOnly: boolean, isAmbassadorOnly: boolean }[]>('chat.styles');

        for(const style of styles)
        {
            if(!style) continue;

            if(style.minRank > 0)
            {
                if(GetSessionDataManager().hasSecurity(style.minRank)) styleIds.push(style.styleId);

                continue;
            }

            if(style.isSystemStyle)
            {
                if(GetSessionDataManager().hasSecurity(RoomControllerLevel.MODERATOR))
                {
                    styleIds.push(style.styleId);

                    continue;
                }
            }

            if(GetConfiguration<number[]>('chat.styles.disabled').indexOf(style.styleId) >= 0) continue;

            if(style.isHcOnly && (GetClubMemberLevel() >= HabboClubLevelEnum.CLUB))
            {
                styleIds.push(style.styleId);

                continue;
            }

            if(style.isAmbassadorOnly && GetSessionDataManager().isAmbassador)
            {
                styleIds.push(style.styleId);

                continue;
            }

            if(!style.isHcOnly && !style.isAmbassadorOnly) styleIds.push(style.styleId);
        }

        return styleIds;
    }, []);

    useEffect(() =>
    {
        document.body.addEventListener('keydown', onKeyDownEvent);

        return () =>
        {
            document.body.removeEventListener('keydown', onKeyDownEvent);
        }
    }, [ onKeyDownEvent ]);

    useEffect(() =>
    {
        if(!inputRef.current) return;

        inputRef.current.parentElement.dataset.value = chatValue;
    }, [ chatValue ]);

    if(!roomSession || roomSession.isSpectator) return null;

    return (
        createPortal(
            <div className="relative w-full">
                { showCommands && (() => {
                    const filtered = CHAT_COMMANDS
                        .filter(cmd => cmd.minRank === 0 || GetSessionDataManager().hasSecurity(cmd.minRank))
                        .filter(cmd => cmd.command.startsWith(':') ? cmd.command.slice(1).startsWith(commandFilter) : cmd.command.startsWith(commandFilter));
                    if(filtered.length === 0) return null;
                    let lastCategory = '';
                    return (
                        <div className="chat-commands-dropdown absolute bottom-full left-0 right-0 mb-1 z-10">
                            { filtered.map(cmd => {
                                const showHeader = cmd.category !== lastCategory;
                                lastCategory = cmd.category;
                                return (
                                    <Fragment key={ cmd.command }>
                                        { showHeader && <div className="chat-command-category">{ cmd.category }</div> }
                                        <div
                                            className="chat-command-item"
                                            onMouseDown={ (e) => { e.preventDefault(); setChatValue(cmd.command + ' '); setShowCommands(false); inputRef.current?.focus(); } }
                                        >
                                            <span className="chat-command-name">{ cmd.command }</span>
                                            <span className="chat-command-desc">{ cmd.description }</span>
                                            { cmd.minRank >= 4 && (
                                                <span className={ `chat-command-badge rank-${ cmd.minRank }` }>
                                                    { cmd.minRank >= 7 ? 'ROOT' : cmd.minRank >= 6 ? 'S-ADMIN' : cmd.minRank >= 5 ? 'ADMIN' : 'MOD' }
                                                </span>
                                            ) }
                                        </div>
                                    </Fragment>
                                );
                            }) }
                        </div>
                    );
                })() }
                <div className="nitro-chat-input-container chat-composer">
                    <div className="chat-composer-input">
                        <div className="input-sizer">
                            { !floodBlocked &&
                            <input ref={ inputRef } type="text" className="chat-input" placeholder={ LocalizeText('widgets.chatinput.default') } value={ chatValue } maxLength={ maxChatLength } onChange={ event => updateChatInput(event.target.value) } onMouseDown={ event => setInputFocus() } /> }
                            { floodBlocked &&
                            <span className="chat-flood-warning">{ LocalizeText('chat.input.alert.flood', [ 'time' ], [ floodBlockedSeconds.toString() ]) }</span> }
                        </div>
                    </div>
                    <div className="chat-composer-toolbar">
                        <div className="flex items-center gap-2">
                            <ChatInputEmojiPickerView onSelectEmoji={ (code) => { setChatValue(prev => prev + code); inputRef.current?.focus(); } } />
                            <ChatInputStyleSelectorView chatStyleId={ chatStyleId } chatStyleIds={ chatStyleIds } selectChatStyleId={ updateChatStyleId } />
                        </div>
                        <span className="chat-send-hint">↵ Send</span>
                    </div>
                </div>
            </div>, document.getElementById('toolbar-chat-input-container'))
    );
}
