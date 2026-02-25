import { HabboClubLevelEnum, RoomControllerLevel, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatMessageTypeEnum, CreateLinkEvent, GetClubMemberLevel, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, LocalizeText, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { useChatInputWidget, useRoom, useSessionInfo, useUiEvent } from '../../../../hooks';
import { ChatInputEmojiPickerView } from './ChatInputEmojiPickerView';
import { ChatInputStyleSelectorView } from './ChatInputStyleSelectorView';
import { HotbarView } from '../../../hotbar/HotbarView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Smile, Zap, Palette } from 'lucide-react';

interface CommandParam { name: string; type: 'user' | 'number' | 'text' | 'id'; }

interface ChatCommand {
    command: string;
    description: string;
    minRank: number;
    category: string;
    roomId?: number;
    params?: CommandParam[];
}

const CHAT_COMMANDS: ChatCommand[] = [
    { command: ':shake', description: 'Raum schütteln', minRank: 0, category: 'Client' },
    { command: ':rotate', description: 'Raum drehen', minRank: 0, category: 'Client' },
    { command: ':flip', description: 'Raum spiegeln', minRank: 0, category: 'Client' },
    { command: ':zoom', description: 'Zoom-Level setzen', minRank: 0, category: 'Client', params: [{ name: 'level', type: 'number' }] },
    { command: ':screenshot', description: 'Screenshot erstellen', minRank: 0, category: 'Client' },
    { command: ':togglefps', description: 'FPS-Anzeige umschalten', minRank: 0, category: 'Client' },
    { command: ':d', description: 'Lach-Ausdruck', minRank: 0, category: 'Client' },
    { command: ':kiss', description: 'User küssen', minRank: 0, category: 'Allgemein', params: [{ name: 'username', type: 'user' }] },
    { command: ':hug', description: 'User umarmen', minRank: 0, category: 'Allgemein', params: [{ name: 'username', type: 'user' }] },
    { command: ':hit', description: 'User hauen', minRank: 0, category: 'Allgemein', params: [{ name: 'username', type: 'user' }] },
    { command: ':jump', description: 'Springen', minRank: 0, category: 'Client' },
    { command: ':idle', description: 'AFK gehen', minRank: 0, category: 'Client' },
    { command: ':sign', description: 'Schild zeigen', minRank: 0, category: 'Client', params: [{ name: 'nummer', type: 'number' }] },
    { command: 'o/', description: 'Winken', minRank: 0, category: 'Client' },
    { command: ':furni', description: 'Möbel-Wähler', minRank: 0, category: 'Client' },
    { command: ':chooser', description: 'User-Wähler', minRank: 0, category: 'Client' },
    { command: ':floor', description: 'Boden-Editor', minRank: 0, category: 'Client' },
    { command: ':settings', description: 'Raum-Einstellungen', minRank: 0, category: 'Client' },
    { command: ':lotto', description: 'Lotto-Info anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':lotto buy', description: 'Tickets kaufen', minRank: 0, category: 'Allgemein', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':lotto history', description: 'Letzte Gewinner anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':rel', description: 'Deine Top-Beziehungen anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':rel ', description: 'Beziehungs-Info mit User', minRank: 0, category: 'Allgemein', params: [{ name: 'username', type: 'user' }] },
    { command: ':sets', description: 'SET-Counter anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':sets complete', description: 'Set einfügen', minRank: 0, category: 'Allgemein', params: [{ name: 'id', type: 'id' }] },
    { command: ':sets claim', description: 'Belohnung abholen', minRank: 0, category: 'Allgemein', params: [{ name: 'id', type: 'id' }] },
    { command: ':sets preview', description: 'SET-Möbel platzieren', minRank: 0, category: 'Allgemein', params: [{ name: 'item_id', type: 'id' }] },
    { command: ':sellroom credits', description: 'Raum für Credits verkaufen', minRank: 0, category: 'Allgemein', params: [{ name: 'betrag', type: 'number' }] },
    { command: ':sellroom diamonds', description: 'Raum für Diamanten verkaufen', minRank: 0, category: 'Allgemein', params: [{ name: 'betrag', type: 'number' }] },
    { command: ':sellroom cancel', description: 'Raumverkauf abbrechen', minRank: 0, category: 'Allgemein' },
    { command: ':sellroom info', description: 'Verkaufs-Info', minRank: 0, category: 'Allgemein' },
    { command: ':buyroom', description: 'Raum-Kaufinfo', minRank: 0, category: 'Allgemein' },
    { command: ':buyroom confirm', description: 'Raumkauf bestätigen', minRank: 0, category: 'Allgemein' },
    { command: ':companion activate', description: 'Pet als Begleiter aktivieren', minRank: 0, category: 'Allgemein', params: [{ name: 'name', type: 'text' }] },
    { command: ':companion deactivate', description: 'Begleiter deaktivieren', minRank: 0, category: 'Allgemein' },
    { command: ':companion', description: 'Begleiter-Status', minRank: 0, category: 'Allgemein' },
    { command: ':companion room off', description: 'Begleiter im Raum aus', minRank: 0, category: 'Allgemein' },
    { command: ':companion room on', description: 'Begleiter im Raum an', minRank: 0, category: 'Allgemein' },
    { command: ':send', description: 'Währung senden', minRank: 0, category: 'Allgemein', params: [{ name: 'name', type: 'user' }, { name: 'typ', type: 'text' }, { name: 'anzahl', type: 'number' }] },
    { command: '@', description: 'Person markieren / Nachricht', minRank: 0, category: 'Allgemein', params: [{ name: 'name', type: 'user' }, { name: 'text', type: 'text' }] },
    { command: ':win', description: 'Event-Win vergeben', minRank: 13, category: 'GameX', params: [{ name: 'name', type: 'user' }] },
    { command: ':sit', description: 'Hinsetzen', minRank: 0, category: 'Allgemein' },
    { command: ':stand', description: 'Aufstehen', minRank: 0, category: 'Allgemein' },
    { command: ':lay', description: 'Hinlegen', minRank: 0, category: 'Allgemein' },
    { command: ':redeem', description: 'Möbel eintauschen', minRank: 0, category: 'Allgemein' },
    { command: ':info', description: 'Hotel-Info', minRank: 0, category: 'Allgemein' },
    { command: ':empty', description: 'Inventar leeren', minRank: 0, category: 'Allgemein' },
    { command: ':commands', description: 'Alle Commands anzeigen', minRank: 0, category: 'Allgemein' },
    { command: ':plugins', description: 'Geladene Plugins', minRank: 0, category: 'Allgemein' },
    { command: ':mimic', description: 'Look kopieren', minRank: 3, category: 'VIP', params: [{ name: 'username', type: 'user' }] },
    { command: ':moonwalk', description: 'Moonwalk an/aus', minRank: 3, category: 'VIP' },
    { command: ':pickall', description: 'Alle Möbel einpacken', minRank: 3, category: 'VIP' },
    { command: ':ejectall', description: 'Alle Möbel rauswerfen', minRank: 3, category: 'VIP' },
    { command: ':stalk', description: 'User folgen', minRank: 3, category: 'VIP', params: [{ name: 'username', type: 'user' }] },
    { command: ':alert', description: 'User benachrichtigen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }, { name: 'nachricht', type: 'text' }] },
    { command: ':mute', description: 'User stummschalten', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':unmute', description: 'User entstummen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':kick', description: 'Alle aus Raum kicken', minRank: 14, category: 'Moderator' },
    { command: ':softkick', description: 'User aus Raum kicken', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':roomalert', description: 'Raum-Benachrichtigung', minRank: 14, category: 'Moderator', params: [{ name: 'nachricht', type: 'text' }] },
    { command: ':roommute', description: 'Raum stummschalten', minRank: 14, category: 'Moderator' },
    { command: ':teleport', description: 'Teleport an/aus', minRank: 14, category: 'Moderator' },
    { command: ':pull', description: 'User heranziehen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':push', description: 'User wegstossen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':coords', description: 'Koordinaten anzeigen', minRank: 14, category: 'Moderator' },
    { command: ':enable', description: 'Effekt aktivieren', minRank: 14, category: 'Moderator', params: [{ name: 'id', type: 'id' }] },
    { command: ':handitem', description: 'Hand-Item geben', minRank: 14, category: 'Moderator', params: [{ name: 'id', type: 'id' }] },
    { command: ':fastwalk', description: 'Schnell laufen', minRank: 14, category: 'Moderator' },
    { command: ':hidewired', description: 'Wired verstecken', minRank: 14, category: 'Moderator' },
    { command: ':danceall', description: 'Alle tanzen lassen', minRank: 14, category: 'Moderator', params: [{ name: 'dance_id', type: 'number' }] },
    { command: ':shoutall', description: 'Alle rufen lassen', minRank: 14, category: 'Moderator', params: [{ name: 'text', type: 'text' }] },
    { command: ':say', description: 'User sagen lassen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }, { name: 'text', type: 'text' }] },
    { command: ':multi', description: 'Multi-Command an/aus', minRank: 14, category: 'Moderator' },
    { command: ':chatcolor', description: 'Chat-Farbe setzen', minRank: 14, category: 'Moderator', params: [{ name: 'farbe', type: 'text' }] },
    { command: ':changename', description: 'Namensänderung erlauben', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':calendar', description: 'Kalender öffnen', minRank: 14, category: 'Moderator' },
    { command: ':staffalert', description: 'Team-Alert senden', minRank: 14, category: 'Moderator', params: [{ name: 'nachricht', type: 'text' }] },
    { command: ':tradelock', description: 'Handeln sperren/entsperren', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':reload', description: 'Raum neu laden', minRank: 14, category: 'Moderator' },
    { command: ':pet_info', description: 'Pet-Info anzeigen', minRank: 14, category: 'Moderator', params: [{ name: 'id', type: 'id' }] },
    { command: ':disconnect', description: 'User disconnecten', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':blockalert', description: 'Alerts blockieren', minRank: 14, category: 'Moderator' },
    { command: ':mute_bots', description: 'Bots stummschalten', minRank: 14, category: 'Moderator' },
    { command: ':mute_pets', description: 'Pets stummschalten', minRank: 14, category: 'Moderator' },
    { command: ':connect_camera', description: 'Kamera verbinden', minRank: 14, category: 'Moderator' },
    { command: ':jail', description: 'Spieler verhaften', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }, { name: 'minuten', type: 'number' }] },
    { command: ':jail free', description: 'Spieler freilassen', minRank: 14, category: 'Moderator', params: [{ name: 'username', type: 'user' }] },
    { command: ':jail list', description: 'Inhaftierte anzeigen', minRank: 14, category: 'Moderator' },
    { command: ':radio', description: 'Radio-Hilfe', minRank: 14, category: 'Moderator' },
    { command: ':radio add', description: 'Track hinzufügen', minRank: 14, category: 'Moderator', params: [{ name: 'url', type: 'text' }, { name: 'titel', type: 'text' }, { name: 'artist', type: 'text' }] },
    { command: ':radio play', description: 'Radio starten', minRank: 14, category: 'Moderator' },
    { command: ':radio pause', description: 'Radio pausieren', minRank: 14, category: 'Moderator' },
    { command: ':radio skip', description: 'Track überspringen', minRank: 14, category: 'Moderator' },
    { command: ':radio queue', description: 'Warteschlange', minRank: 14, category: 'Moderator' },
    { command: ':radio remove', description: 'Track entfernen', minRank: 14, category: 'Moderator', params: [{ name: 'nr', type: 'number' }] },
    { command: ':radio clear', description: 'Queue leeren', minRank: 14, category: 'Moderator' },
    { command: ':radio transition', description: 'Übergang setzen', minRank: 14, category: 'Moderator', params: [{ name: 'typ', type: 'text' }] },
    { command: ':radio sfx', description: 'Sound-Effekt', minRank: 14, category: 'Moderator', params: [{ name: 'url', type: 'text' }] },
    { command: ':radio announce', description: 'DJ-Durchsage', minRank: 14, category: 'Moderator', params: [{ name: 'text', type: 'text' }] },
    { command: ':radio loop', description: 'Loop an/aus', minRank: 14, category: 'Moderator' },
    { command: ':radio tts', description: 'TTS-Durchsage', minRank: 14, category: 'Moderator', params: [{ name: 'text', type: 'text' }] },
    { command: ':radio tts confirm', description: 'TTS senden', minRank: 14, category: 'Moderator' },
    { command: ':radio tts cancel', description: 'TTS abbrechen', minRank: 14, category: 'Moderator' },
    { command: ':radio playlist list', description: 'Playlisten anzeigen', minRank: 14, category: 'Moderator' },
    { command: ':radio playlist create', description: 'Playlist erstellen', minRank: 14, category: 'Moderator', params: [{ name: 'name', type: 'text' }] },
    { command: ':radio playlist delete', description: 'Playlist löschen', minRank: 14, category: 'Moderator', params: [{ name: 'name', type: 'text' }] },
    { command: ':radio playlist add', description: 'Track zu Playlist', minRank: 14, category: 'Moderator', params: [{ name: 'playlist', type: 'text' }, { name: 'url', type: 'text' }] },
    { command: ':radio playlist remove', description: 'Track aus Playlist', minRank: 14, category: 'Moderator', params: [{ name: 'playlist', type: 'text' }, { name: 'nr', type: 'number' }] },
    { command: ':radio playlist load', description: 'Playlist laden', minRank: 14, category: 'Moderator', params: [{ name: 'name', type: 'text' }] },
    { command: ':radio playlist show', description: 'Playlist-Tracks', minRank: 14, category: 'Moderator', params: [{ name: 'name', type: 'text' }] },
    { command: ':radio on', description: 'Radio einschalten', minRank: 15, category: 'Admin' },
    { command: ':radio off', description: 'Radio ausschalten', minRank: 15, category: 'Admin' },
    { command: ':lotto draw', description: 'Ziehung starten', minRank: 15, category: 'Admin' },
    { command: ':lotto on', description: 'Lotto aktivieren', minRank: 15, category: 'Admin' },
    { command: ':lotto off', description: 'Lotto deaktivieren', minRank: 15, category: 'Admin' },
    { command: ':lotto settime', description: 'Ziehungszeit setzen', minRank: 15, category: 'Admin', params: [{ name: 'HH:MM', type: 'text' }] },
    { command: ':lotto setprice', description: 'Ticket-Preis', minRank: 15, category: 'Admin', params: [{ name: 'preis', type: 'number' }] },
    { command: ':lotto setjackpot', description: 'Basis-Jackpot', minRank: 15, category: 'Admin', params: [{ name: 'betrag', type: 'number' }] },
    { command: ':sets reload', description: 'SET-System neu laden', minRank: 15, category: 'Admin' },
    { command: ':voice on', description: 'Sprachchat aktivieren', minRank: 0, category: 'Allgemein' },
    { command: ':voice off', description: 'Sprachchat deaktivieren', minRank: 0, category: 'Allgemein' },
    { command: ':voice create', description: 'Voice-Channel erstellen', minRank: 0, category: 'Allgemein', params: [{ name: 'name', type: 'text' }, { name: 'max', type: 'number' }] },
    { command: ':voice delete', description: 'Voice-Channel löschen', minRank: 0, category: 'Allgemein', params: [{ name: 'name', type: 'text' }] },
    { command: ':voice list', description: 'Voice-Channels', minRank: 0, category: 'Allgemein' },
    { command: ':ban', description: 'User bannen', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'dauer', type: 'text' }] },
    { command: ':unban', description: 'User entbannen', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':credits', description: 'Credits geben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'anzahl', type: 'number' }] },
    { command: ':duckets', description: 'Duckets geben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'anzahl', type: 'number' }] },
    { command: ':points', description: 'Punkte geben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'anzahl', type: 'number' }] },
    { command: ':badge', description: 'Badge geben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'badge', type: 'text' }] },
    { command: ':takebadge', description: 'Badge entfernen', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'badge', type: 'text' }] },
    { command: ':gift', description: 'Geschenk senden', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':givefurni', description: 'Möbel vergeben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'id', type: 'id' }, { name: 'anzahl', type: 'number' }] },
    { command: ':ha', description: 'Hotel-Alert', minRank: 15, category: 'Admin', params: [{ name: 'nachricht', type: 'text' }] },
    { command: ':hal', description: 'Hotel-Alert mit Link', minRank: 15, category: 'Admin', params: [{ name: 'url', type: 'text' }, { name: 'nachricht', type: 'text' }] },
    { command: ':freeze', description: 'User einfrieren', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':summon', description: 'User herbeirufen', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':event', description: 'Raum-Event erstellen', minRank: 15, category: 'Admin', params: [{ name: 'text', type: 'text' }] },
    { command: ':invisible', description: 'Unsichtbar werden', minRank: 15, category: 'Admin' },
    { command: ':diagonal', description: 'Diagonal laufen an/aus', minRank: 15, category: 'Admin' },
    { command: ':faceless', description: 'Gesichtslos', minRank: 15, category: 'Admin' },
    { command: ':roombadge', description: 'Badge an alle', minRank: 15, category: 'Admin', params: [{ name: 'badge', type: 'text' }] },
    { command: ':roomcredits', description: 'Credits an alle', minRank: 15, category: 'Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':roomduckets', description: 'Duckets an alle', minRank: 15, category: 'Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':roompoints', description: 'Punkte an alle', minRank: 15, category: 'Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':roomeffect', description: 'Effekt an alle', minRank: 15, category: 'Admin', params: [{ name: 'id', type: 'id' }] },
    { command: ':roomgift', description: 'Geschenk an alle', minRank: 15, category: 'Admin' },
    { command: ':roomitem', description: 'Item an alle', minRank: 15, category: 'Admin', params: [{ name: 'id', type: 'id' }] },
    { command: ':setmax', description: 'Max User setzen', minRank: 15, category: 'Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':subscription', description: 'HC/VIP Abo geben', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }, { name: 'tage', type: 'number' }] },
    { command: ':control', description: 'User steuern', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':bots', description: 'Bots anzeigen', minRank: 15, category: 'Admin' },
    { command: ':bundle', description: 'Raum-Bundle', minRank: 15, category: 'Admin' },
    { command: ':userinfo', description: 'User-Info', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':happyhour', description: 'Happy Hour', minRank: 15, category: 'Admin' },
    { command: ':transform', description: 'In Tier verwandeln', minRank: 15, category: 'Admin', params: [{ name: 'pet_type', type: 'number' }] },
    { command: ':superpull', description: 'Super-Pull', minRank: 15, category: 'Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':wordquiz', description: 'Wort-Quiz', minRank: 15, category: 'Admin', params: [{ name: 'frage', type: 'text' }] },
    { command: ':emptybots', description: 'Alle Bots löschen', minRank: 15, category: 'Admin' },
    { command: ':emptypets', description: 'Alle Pets löschen', minRank: 15, category: 'Admin' },
    { command: ':sayall', description: 'Alle sagen lassen', minRank: 15, category: 'Admin', params: [{ name: 'text', type: 'text' }] },
    { command: ':freezebots', description: 'Bots einfrieren', minRank: 15, category: 'Admin' },
    { command: ':filter', description: 'Wort-Filter', minRank: 15, category: 'Admin', params: [{ name: 'wort', type: 'text' }] },
    { command: ':update_catalogue', description: 'Katalog neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_items', description: 'Items neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_navigator', description: 'Navigator neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_bots', description: 'Bots neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_polls', description: 'Umfragen neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_achievements', description: 'Achievements neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_hotelview', description: 'Hotel-View neu laden', minRank: 15, category: 'Admin' },
    { command: ':update_youtube', description: 'YouTube-Playlists', minRank: 15, category: 'Admin' },
    { command: ':durability type list', description: 'Raritätstyp-Defaults', minRank: 15, category: 'Admin' },
    { command: ':durability type set', description: 'Typ-Default setzen', minRank: 15, category: 'Admin', params: [{ name: 'typ', type: 'text' }, { name: 'wert', type: 'number' }] },
    { command: ':durability reload', description: 'Durability neu laden', minRank: 15, category: 'Admin' },
    { command: ':durability status', description: 'System-Status', minRank: 15, category: 'Admin' },
    { command: ':masscredits', description: 'Credits an alle User', minRank: 18, category: 'Super-Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':massduckets', description: 'Duckets an alle User', minRank: 18, category: 'Super-Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':masspoints', description: 'Punkte an alle User', minRank: 18, category: 'Super-Admin', params: [{ name: 'anzahl', type: 'number' }] },
    { command: ':massbadge', description: 'Badge an alle User', minRank: 18, category: 'Super-Admin', params: [{ name: 'badge', type: 'text' }] },
    { command: ':massgift', description: 'Geschenk an alle', minRank: 18, category: 'Super-Admin' },
    { command: ':ipban', description: 'IP-Ban', minRank: 18, category: 'Super-Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':machineban', description: 'Machine-Ban', minRank: 18, category: 'Super-Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':superban', description: 'Super-Ban', minRank: 18, category: 'Super-Admin', params: [{ name: 'username', type: 'user' }] },
    { command: ':shutdown', description: 'Hotel herunterfahren', minRank: 18, category: 'Super-Admin' },
    { command: ':unload', description: 'Raum entladen', minRank: 18, category: 'Super-Admin' },
    { command: ':setspeed', description: 'Roller-Speed', minRank: 18, category: 'Super-Admin', params: [{ name: 'speed', type: 'number' }] },
    { command: ':update_config', description: 'Config neu laden', minRank: 18, category: 'Super-Admin' },
    { command: ':update_texts', description: 'Texte neu laden', minRank: 18, category: 'Super-Admin' },
    { command: ':update_plugins', description: 'Plugins neu laden', minRank: 18, category: 'Super-Admin' },
    { command: ':giverank', description: 'Rang vergeben', minRank: 19, category: 'Root', params: [{ name: 'username', type: 'user' }, { name: 'rang', type: 'number' }] },
    { command: ':update_permissions', description: 'Permissions neu laden', minRank: 19, category: 'Root' },
    { command: ':update_guildparts', description: 'Gruppen-Teile', minRank: 19, category: 'Root' },
    { command: ':update_petdata', description: 'Pet-Daten', minRank: 19, category: 'Root' },
    { command: ':gym', description: 'Fitness-Stats', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym info', description: 'Gym-Anleitung', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym add strength', description: 'Punkt auf Stärke', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym add stamina', description: 'Punkt auf Ausdauer', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym add intellect', description: 'Punkt auf Intelligenz', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym shop', description: 'Energie-Shop', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym buy water', description: 'Wasser kaufen (5C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym buy energy', description: 'Energy-Drink (15C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':gym buy protein', description: 'Protein-Shake (30C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat', description: 'Kampf-Stats', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat shop', description: 'Waffen-Shop', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat buy bat', description: 'Schläger (100C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat buy axe', description: 'Axt (300C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat buy sword', description: 'Schwert (500C)', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat equip bat', description: 'Schläger ausrüsten', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat equip axe', description: 'Axt ausrüsten', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat equip sword', description: 'Schwert ausrüsten', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat equip armour', description: 'Rüstung anlegen', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':combat unequip', description: 'Alles ablegen', minRank: 0, category: 'Roleplay', roomId: 500 },
    { command: ':rob', description: 'Spieler ausrauben', minRank: 0, category: 'Roleplay', roomId: 500, params: [{ name: 'username', type: 'user' }] },
    { command: ':heal', description: 'HP heilen (20C)', minRank: 0, category: 'Roleplay', roomId: 500 },
];

const RANK_BADGE: Record<string, { label: string; color: string }> = {
    VIP: { label: 'VIP', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    GameX: { label: 'GameX', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    Moderator: { label: 'MOD', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    Admin: { label: 'ADMIN', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
    'Super-Admin': { label: 'S-ADMIN', color: 'bg-red-500/15 text-red-400 border-red-500/25' },
    Root: { label: 'ROOT', color: 'bg-red-600/15 text-red-300 border-red-500/25' },
};

function getGhostText(input: string, commands: ChatCommand[]): string {
    if (!input.startsWith(':')) return '';
    const sorted = [...commands].sort((a, b) => b.command.length - a.command.length);
    for (const cmd of sorted) {
        if (input.toLowerCase().startsWith(cmd.command.toLowerCase() + ' ') || input.toLowerCase() === cmd.command.toLowerCase()) {
            if (!cmd.params) return '';
            const rest = input.slice(cmd.command.length);
            const parts = rest.trim() ? rest.trim().split(/\s+/) : [];
            const completedCount = rest.endsWith(' ') ? parts.length : Math.max(0, parts.length - 1);
            const remaining = cmd.params.slice(completedCount);
            if (remaining.length === 0) return '';
            return remaining.map(p => `[${p.name}]`).join(' ');
        }
    }
    return '';
}

function getRoomUserNames(roomId: number): { name: string; figure: string }[] {
    try {
        const roomObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.UNIT);
        const session = GetRoomSession();
        const users: { name: string; figure: string }[] = [];
        for (const obj of roomObjects) {
            if (obj.id < 0) continue;
            const ud = session.userDataManager.getUserDataByIndex(obj.id);
            if (ud && ud.name) users.push({ name: ud.name, figure: ud.figure });
        }
        return users.sort((a, b) => a.name.localeCompare(b.name));
    } catch { return []; }
}

function shouldShowUserAutocomplete(input: string, commands: ChatCommand[]): { show: boolean; filter: string } {
    if (!input.startsWith(':')) return { show: false, filter: '' };
    const sorted = [...commands].sort((a, b) => b.command.length - a.command.length);
    for (const cmd of sorted) {
        if (input.toLowerCase().startsWith(cmd.command.toLowerCase() + ' ')) {
            if (!cmd.params) return { show: false, filter: '' };
            const rest = input.slice(cmd.command.length);
            if (!rest.startsWith(' ')) return { show: false, filter: '' };
            const parts = rest.trim() ? rest.trim().split(/\s+/) : [];
            const completedCount = rest.endsWith(' ') ? parts.length : Math.max(0, parts.length - 1);
            const param = cmd.params[completedCount];
            if (!param || param.type !== 'user') return { show: false, filter: '' };
            const currentVal = rest.endsWith(' ') ? '' : (parts[parts.length - 1] || '');
            return { show: true, filter: currentVal };
        }
    }
    return { show: false, filter: '' };
}

export const ChatInputView: FC<{}> = props =>
{
    const [ chatValue, setChatValue ] = useState<string>('');
    const [ showCommands, setShowCommands ] = useState(false);
    const [ selectedCmdIndex, setSelectedCmdIndex ] = useState(0);
    const [ selectedUserIndex, setSelectedUserIndex ] = useState(0);
    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const { selectedUsername = '', floodBlocked = false, floodBlockedSeconds = 0, setIsTyping = null, setIsIdle = null, sendChat = null } = useChatInputWidget();
    const { roomSession = null } = useRoom();
    const inputRef = useRef<HTMLInputElement>();
    const selectedCmdRef = useRef<HTMLButtonElement>(null);
    const selectedUserRef = useRef<HTMLButtonElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const chatModeIdWhisper = useMemo(() => LocalizeText('widgets.chatinput.mode.whisper'), []);
    const chatModeIdShout = useMemo(() => LocalizeText('widgets.chatinput.mode.shout'), []);
    const chatModeIdSpeak = useMemo(() => LocalizeText('widgets.chatinput.mode.speak'), []);
    const maxChatLength = useMemo(() => GetConfiguration<number>('chat.input.maxlength', 100), []);

    const availableCommands = useMemo(() =>
        CHAT_COMMANDS
            .filter(cmd => !cmd.roomId || cmd.roomId === roomSession?.roomId)
            .filter(cmd => cmd.minRank === 0 || GetSessionDataManager().hasSecurity(cmd.minRank)),
    [ roomSession?.roomId ]);

    const filteredCommands = useMemo(() => {
        if (!showCommands) return [];
        const q = chatValue.toLowerCase();
        return availableCommands.filter(cmd => cmd.command.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q));
    }, [ showCommands, chatValue, availableCommands ]);

    const ghostText = useMemo(() => getGhostText(chatValue, availableCommands), [ chatValue, availableCommands ]);

    const userAutoState = useMemo(() => shouldShowUserAutocomplete(chatValue, availableCommands), [ chatValue, availableCommands ]);
    const roomUsers = useMemo(() => {
        if (!userAutoState.show || !roomSession) return [];
        const users = getRoomUserNames(roomSession.roomId);
        if (!userAutoState.filter) return users;
        const q = userAutoState.filter.toLowerCase();
        return users.filter(u => u.name.toLowerCase().includes(q));
    }, [ userAutoState.show, userAutoState.filter, roomSession ]);

    const showUserAuto = userAutoState.show && !showCommands && roomUsers.length > 0;

    const chatStyleIds = useMemo(() =>
    {
        let styleIds: number[] = [];
        const styles = GetConfiguration<{ styleId: number, minRank: number, isSystemStyle: boolean, isHcOnly: boolean, isAmbassadorOnly: boolean }[]>('chat.styles');
        for(const style of styles)
        {
            if(!style) continue;
            if(style.minRank > 0) { if(GetSessionDataManager().hasSecurity(style.minRank)) styleIds.push(style.styleId); continue; }
            if(style.isSystemStyle) { if(GetSessionDataManager().hasSecurity(RoomControllerLevel.MODERATOR)) { styleIds.push(style.styleId); continue; } }
            if(GetConfiguration<number[]>('chat.styles.disabled').indexOf(style.styleId) >= 0) continue;
            if(style.isHcOnly && (GetClubMemberLevel() >= HabboClubLevelEnum.CLUB)) { styleIds.push(style.styleId); continue; }
            if(style.isAmbassadorOnly && GetSessionDataManager().isAmbassador) { styleIds.push(style.styleId); continue; }
            if(!style.isHcOnly && !style.isAmbassadorOnly) styleIds.push(style.styleId);
        }
        return styleIds;
    }, []);

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

        if(value.trim() === ':rel' || value.trim().startsWith(':rel '))
        {
            const relParts = value.trim().split(' ');
            const targetName = relParts.length >= 2 ? relParts[1] : '';
            CreateLinkEvent(targetName ? `relationship/show/${ targetName }` : 'relationship/show');
            setChatValue('');
            return;
        }

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
                parts.shift(); parts.shift();
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
            if(/%CC%/g.test(encodeURIComponent(text))) { setChatValue(''); }
            else { setChatValue(''); sendChat(text, chatType, recipientName, chatStyleId); }
        }
        setChatValue(append);
    }, [ chatModeIdWhisper, chatModeIdShout, chatModeIdSpeak, maxChatLength, chatStyleId, setIsTyping, setIsIdle, sendChat ]);

    const updateChatInput = useCallback((value: string) =>
    {
        if(!value || !value.length) { setIsTyping(false); }
        else { setIsTyping(true); setIsIdle(true); }

        if(value.startsWith(':') || value.startsWith('@'))
        {
            setShowCommands(true);
            setSelectedCmdIndex(0);
        }
        else
        {
            setShowCommands(false);
        }
        setSelectedUserIndex(0);
        setChatValue(value);
    }, [ setIsTyping, setIsIdle ]);

    const handleCommandSelect = useCallback((cmd: string) => {
        setChatValue(cmd);
        setShowCommands(false);
        setSelectedCmdIndex(0);
        inputRef.current?.focus();
    }, []);

    const handleUserSelect = useCallback((name: string) => {
        const sorted = [...availableCommands].sort((a, b) => b.command.length - a.command.length);
        for (const cmd of sorted) {
            if (chatValue.toLowerCase().startsWith(cmd.command.toLowerCase() + ' ')) {
                const cmdParts = cmd.command.split(/\s+/);
                const allParts = chatValue.split(/\s+/);
                const paramParts = allParts.slice(cmdParts.length);
                if (paramParts.length === 0) {
                    setChatValue(cmd.command + ' ' + name + ' ');
                } else {
                    paramParts[paramParts.length - 1] = name;
                    setChatValue(cmd.command + ' ' + paramParts.join(' ') + ' ');
                }
                break;
            }
        }
        setSelectedUserIndex(0);
        inputRef.current?.focus();
    }, [ chatValue, availableCommands ]);

    const onKeyDownEvent = useCallback((event: KeyboardEvent) =>
    {
        if(floodBlocked || !inputRef.current || anotherInputHasFocus()) return;
        if(document.activeElement !== inputRef.current) setInputFocus();

        const value = (event.target as HTMLInputElement).value;

        if(showCommands && filteredCommands.length > 0) {
            if(event.key === 'ArrowDown') { event.preventDefault(); setSelectedCmdIndex(prev => (prev + 1) % filteredCommands.length); return; }
            if(event.key === 'ArrowUp') { event.preventDefault(); setSelectedCmdIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length); return; }
            if(event.key === 'Enter') { event.preventDefault(); if(filteredCommands[selectedCmdIndex]) handleCommandSelect(filteredCommands[selectedCmdIndex].command + ' '); return; }
            if(event.key === 'Escape') { event.preventDefault(); setChatValue(''); setShowCommands(false); return; }
        }

        if(showUserAuto && roomUsers.length > 0) {
            if(event.key === 'ArrowDown') { event.preventDefault(); setSelectedUserIndex(prev => (prev + 1) % roomUsers.length); return; }
            if(event.key === 'ArrowUp') { event.preventDefault(); setSelectedUserIndex(prev => (prev - 1 + roomUsers.length) % roomUsers.length); return; }
            if(event.key === 'Enter') { event.preventDefault(); if(roomUsers[selectedUserIndex]) handleUserSelect(roomUsers[selectedUserIndex].name); return; }
            if(event.key === 'Escape') { event.preventDefault(); setChatValue(prev => prev.trimEnd() + ' '); return; }
        }

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
    }, [ floodBlocked, inputRef, chatModeIdWhisper, anotherInputHasFocus, setInputFocus, checkSpecialKeywordForInput, sendChatValue, showCommands, filteredCommands, selectedCmdIndex, handleCommandSelect, showUserAuto, roomUsers, selectedUserIndex, handleUserSelect ]);

    useUiEvent<RoomWidgetUpdateChatInputContentEvent>(RoomWidgetUpdateChatInputContentEvent.CHAT_INPUT_CONTENT, event =>
    {
        switch(event.chatMode)
        {
            case RoomWidgetUpdateChatInputContentEvent.WHISPER:
                setChatValue(`${ chatModeIdWhisper } ${ event.userName } `);
                return;
            case RoomWidgetUpdateChatInputContentEvent.SHOUT:
                return;
        }
    });

    useEffect(() =>
    {
        document.body.addEventListener('keydown', onKeyDownEvent);
        return () => { document.body.removeEventListener('keydown', onKeyDownEvent); }
    }, [ onKeyDownEvent ]);

    useEffect(() =>
    {
        if(!inputRef.current) return;
        inputRef.current.parentElement.dataset.value = chatValue;
    }, [ chatValue ]);

    useEffect(() => { selectedCmdRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [ selectedCmdIndex ]);
    useEffect(() => { selectedUserRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [ selectedUserIndex ]);

    useEffect(() =>
    {
        const onMouseDown = (e: MouseEvent) =>
        {
            if(!showCommands && !showUserAuto) return;
            if(autocompleteRef.current?.contains(e.target as Node)) return;
            if(inputRef.current?.contains(e.target as Node)) return;
            setShowCommands(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ showCommands, showUserAuto ]);

    if(!roomSession || roomSession.isSpectator) return null;

    const portalTarget = document.getElementById('toolbar-chat-input-container');
    if(!portalTarget) return null;

    let lastCategory = '';

    return createPortal(
        <>
            <HotbarView />
            <div className="relative w-full max-w-2xl mx-auto px-4 pb-3 pt-1">
                {/* Command Autocomplete */}
                { showCommands && filteredCommands.length > 0 && (
                    <div ref={ autocompleteRef } className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden z-10">
                        <ScrollArea className="max-h-[280px]">
                            { filteredCommands.map((cmd, flatIndex) => {
                                const showHeader = cmd.category !== lastCategory;
                                lastCategory = cmd.category;
                                const isSelected = flatIndex === selectedCmdIndex;
                                const rankBadge = RANK_BADGE[cmd.category];
                                return (
                                    <Fragment key={ cmd.command }>
                                        { showHeader && (
                                            <div className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 bg-muted/40 backdrop-blur-sm border-b border-border/15">
                                                { cmd.category }
                                            </div>
                                        ) }
                                        <button
                                            ref={ isSelected ? selectedCmdRef : undefined }
                                            className={ `w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${ isSelected ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/40 text-foreground/80' }` }
                                            onMouseDown={ e => { e.preventDefault(); handleCommandSelect(cmd.command + ' '); } }
                                        >
                                            <span className={ `text-[13px] font-mono font-semibold shrink-0 ${ isSelected ? 'text-primary' : 'text-primary/60' }` }>{ cmd.command }</span>
                                            <span className="text-[12px] text-muted-foreground truncate flex-1">{ cmd.description }</span>
                                            { cmd.params && cmd.params.length > 0 && (
                                                <span className="text-[9px] text-muted-foreground/30 shrink-0 font-mono">
                                                    { cmd.params.map(p => `[${p.name}]`).join(' ') }
                                                </span>
                                            ) }
                                            { rankBadge && <span className={ `text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${ rankBadge.color }` }>{ rankBadge.label }</span> }
                                            { isSelected && <span className="text-[9px] text-muted-foreground/40 shrink-0">↵</span> }
                                        </button>
                                    </Fragment>
                                );
                            }) }
                        </ScrollArea>
                    </div>
                ) }

                {/* Username Autocomplete */}
                { showUserAuto && (
                    <div className="absolute bottom-full left-4 mb-2 rounded-xl border border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden w-[220px] z-10">
                        <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 border-b border-border/15">Spieler</div>
                        <ScrollArea className="max-h-[200px]">
                            { roomUsers.map((user, i) => {
                                const isSelected = i === selectedUserIndex;
                                return (
                                    <button key={ user.name }
                                        ref={ isSelected ? selectedUserRef : undefined }
                                        className={ `w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${ isSelected ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/40 text-foreground/80' }` }
                                        onMouseDown={ e => { e.preventDefault(); handleUserSelect(user.name); } }
                                    >
                                        <img src={ `https://www.habbo.de/habbo-imaging/avatarimage?figure=${ user.figure }&headonly=1&size=s&direction=2` }
                                            alt={ user.name } className="w-[30px] h-[30px] object-contain shrink-0" style={{ imageRendering: 'pixelated' }}
                                            onError={ e => { (e.target as HTMLImageElement).style.opacity = '0.3'; } } />
                                        <span className="text-[13px] font-semibold">{ user.name }</span>
                                        { isSelected && <span className="text-[9px] text-muted-foreground/40 shrink-0 ml-auto">↵</span> }
                                    </button>
                                );
                            }) }
                        </ScrollArea>
                    </div>
                ) }

                {/* Input Bar */}
                <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-2.5 shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:shadow-xl">
                    <ChatInputEmojiPickerView onSelectEmoji={ (code) => { setChatValue(prev => prev + code); inputRef.current?.focus(); } } />

                    <div className="flex-1 relative">
                        { !floodBlocked &&
                            <input ref={ inputRef } type="text"
                                className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/30"
                                placeholder={ LocalizeText('widgets.chatinput.default') }
                                value={ chatValue } maxLength={ maxChatLength }
                                onChange={ event => updateChatInput(event.target.value) }
                                onMouseDown={ () => setInputFocus() } /> }
                        { floodBlocked &&
                            <span className="text-[13px] text-destructive">{ LocalizeText('chat.input.alert.flood', [ 'time' ], [ floodBlockedSeconds.toString() ]) }</span> }
                        { ghostText && chatValue && (
                            <div className="absolute top-0 left-0 h-full flex items-center pointer-events-none text-[14px]">
                                <span className="invisible whitespace-pre">{ chatValue }</span>
                                <span className="text-muted-foreground/20 whitespace-pre"> { ghostText }</span>
                            </div>
                        ) }
                    </div>

                    <ChatInputStyleSelectorView chatStyleId={ chatStyleId } chatStyleIds={ chatStyleIds } selectChatStyleId={ updateChatStyleId } />

                    <button
                        onClick={ () => window.dispatchEvent(new Event('hotbar:toggle')) }
                        title="Schnellleiste"
                        className="shrink-0 text-muted-foreground/40 hover:text-amber-400 transition-colors"
                    >
                        <Zap className="w-5 h-5" />
                    </button>

                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-[11px] text-muted-foreground/25 select-none shrink-0 font-medium">↵ Senden</span>
                </div>

                {/* Hints */}
                <div className="flex items-center justify-between mt-1.5 px-1">
                    <div className="flex items-center gap-3 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Smile className="w-3 h-3" /> Emoji</span>
                        <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> #{chatStyleId}</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Hotbar</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/25">
                        <span>Shift+↵ Rufen</span><span>·</span><span>: Befehle</span><span>·</span><span>↑↓ Navigation</span>
                    </div>
                </div>
            </div>
        </>,
        portalTarget
    );
}
