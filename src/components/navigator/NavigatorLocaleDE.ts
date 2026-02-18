import { GetLocalization } from '../../api';

const NAVIGATOR_DE: Record<string, string> = {
    // ── Main UI ──
    'navigator.title': 'Navigator',
    'navigator.createroom.title': 'Raum erstellen',

    // ── Sidebar top-level views ──
    'navigator.toplevelview.official': 'Offizielle Räume',
    'navigator.toplevelview.hotel_view': 'Hotel-Ansicht',
    'navigator.toplevelview.roomads_view': 'Raumwerbung',
    'navigator.toplevelview.myworld_view': 'Meine Welt',

    // ── Search filters ──
    'navigator.filter.anything': 'Alles',
    'navigator.filter.room.name': 'Raumname',
    'navigator.filter.owner': 'Besitzer',
    'navigator.filter.tag': 'Tag',
    'navigator.filter.group': 'Gruppe',
    'navigator.filter.input.placeholder': 'Suche...',

    // ── Search result group titles ──
    'navigator.searchcode.title.official': 'Offizielle Räume',
    'navigator.searchcode.title.popular': 'Beliebte Räume',
    'navigator.searchcode.title.recommended': 'Empfohlene Räume',
    'navigator.searchcode.title.my': 'Meine Räume',
    'navigator.searchcode.title.favorites': 'Favoriten',
    'navigator.searchcode.title.history': 'Verlauf',
    'navigator.searchcode.title.promotions': 'Aktionen',
    'navigator.searchcode.title.with_rights': 'Räume mit Rechten',
    'navigator.searchcode.title.my_groups': 'Meine Gruppen',

    // ── Room info ──
    'navigator.roomownercaption': 'Besitzer:',
    'navigator.roomrating': 'Bewertung:',
    'navigator.roomsettings.roominfo': 'Rauminformationen',
    'navigator.room.popup.info.room.settings': 'Raumeinstellungen',

    // ── Room creator ──
    'navigator.createroom.roomnameinfo': 'Raumname',
    'navigator.createroom.roomdescinfo': 'Raumbeschreibung',
    'navigator.createroom.tilesize': 'Kacheln',
    'navigator.createroom.create': 'Raum erstellen',
    'navigator.category': 'Kategorie',
    'navigator.maxvisitors': 'Max. Besucher',
    'navigator.tradesettings': 'Handelseinstellungen',

    // ── Trade settings ──
    'navigator.roomsettings.trade_not_allowed': 'Handel nicht erlaubt',
    'navigator.roomsettings.trade_not_with_Controller': 'Kein Handel mit Controllern',
    'navigator.roomsettings.trade_allowed': 'Handel erlaubt',

    // ── Doorbell / Password ──
    'navigator.doorbell.title': 'Türklingel',
    'navigator.password.title': 'Passwort',
    'navigator.doorbell.info': 'Möchtest du klingeln?',
    'navigator.doorbell.waiting': 'Warte auf Antwort...',
    'navigator.doorbell.no.answer': 'Keine Antwort.',
    'navigator.doorbell.button.ring': 'Klingeln',
    'navigator.password.info': 'Dieser Raum ist passwortgeschützt.',
    'navigator.password.retryinfo': 'Falsches Passwort. Versuche es erneut.',
    'navigator.password.enter': 'Passwort eingeben:',
    'navigator.password.button.try': 'Eingeben',

    // ── Room settings tabs ──
    'navigator.roomsettings': 'Raumeinstellungen',
    'navigator.roomsettings.tab.1': 'Allgemein',
    'navigator.roomsettings.tab.2': 'Zugang',
    'navigator.roomsettings.tab.3': 'Rechte',
    'navigator.roomsettings.tab.4': 'VIP / Chat',
    'navigator.roomsettings.tab.5': 'Moderation',

    // ── Room settings - basic ──
    'navigator.roomname': 'Raumname',
    'navigator.roomsettings.desc': 'Beschreibung',
    'navigator.roomsettings.roomname': 'Raumname',
    'navigator.roomsettings.roomnameismandatory': 'Raumname ist erforderlich',
    'navigator.roomsettings.toomanycharacters': 'Zu viele Zeichen',
    'navigator.tags': 'Tags',
    'navigator.roomsettings.tags': 'Tags',
    'navigator.roomsettings.category': 'Kategorie',
    'navigator.roomsettings.maxvisitors': 'Max. Besucher',
    'navigator.roomsettings.allow_walk_through': 'Durchlaufen erlauben',
    'navigator.roomsettings.delete': 'Raum löschen',

    // ── Room settings - access ──
    'navigator.roomsettings.doormode': 'Zugangsmodus',
    'navigator.roomsettings.doormode.open': 'Offen',
    'navigator.roomsettings.doormode.doorbell': 'Türklingel',
    'navigator.roomsettings.doormode.invisible': 'Unsichtbar',
    'navigator.roomsettings.doormode.password': 'Passwort',
    'navigator.roomsettings.password': 'Passwort',
    'navigator.roomsettings.passwordismandatory': 'Passwort ist erforderlich',
    'navigator.roomsettings.passwordconfirm': 'Passwort bestätigen',
    'navigator.roomsettings.invalidconfirm': 'Passwörter stimmen nicht überein',
    'navigator.roomsettings.pets': 'Haustiere',
    'navigator.roomsettings.allowpets': 'Haustiere erlauben',
    'navigator.roomsettings.allowfoodconsume': 'Füttern erlauben',

    // ── Room settings - VIP / chat ──
    'navigator.roomsettings.vip.caption': 'VIP-Einstellungen',
    'navigator.roomsettings.chat_settings': 'Chat-Einstellungen',
    'navigator.roomsettings.chat.mode.free.flow': 'Freier Fluss',
    'navigator.roomsettings.chat.mode.line.by.line': 'Zeile für Zeile',
    'navigator.roomsettings.chat.bubbles.width.normal': 'Normal',
    'navigator.roomsettings.chat.bubbles.width.thin': 'Schmal',
    'navigator.roomsettings.chat.bubbles.width.wide': 'Breit',
    'navigator.roomsettings.chat.speed.fast': 'Schnell',
    'navigator.roomsettings.chat.speed.normal': 'Normal',
    'navigator.roomsettings.chat.speed.slow': 'Langsam',
    'navigator.roomsettings.chat.flood.loose': 'Locker',
    'navigator.roomsettings.chat.flood.normal': 'Normal',
    'navigator.roomsettings.chat.flood.strict': 'Streng',
    'navigator.roomsettings.chat_settings.hearing.distance': 'Hörreichweite',
    'navigator.roomsettings.hide_walls': 'Wände verstecken',
    'navigator.roomsettings.wall_thickness.normal': 'Normal',
    'navigator.roomsettings.wall_thickness.thick': 'Dick',
    'navigator.roomsettings.wall_thickness.thin': 'Dünn',
    'navigator.roomsettings.wall_thickness.thinnest': 'Am dünnsten',
    'navigator.roomsettings.floor_thickness.normal': 'Normal',
    'navigator.roomsettings.floor_thickness.thick': 'Dick',
    'navigator.roomsettings.floor_thickness.thin': 'Dünn',
    'navigator.roomsettings.floor_thickness.thinnest': 'Am dünnsten',

    // ── Room settings - moderation ──
    'navigator.roomsettings.moderation.banned.users': 'Gebannte Benutzer',
    'navigator.roomsettings.moderation.unban': 'Entbannen',
    'navigator.roomsettings.moderation.mute.header': 'Stummschaltung',
    'navigator.roomsettings.moderation.kick.header': 'Kick',
    'navigator.roomsettings.moderation.ban.header': 'Bann',
    'navigator.roomsettings.moderation.none': 'Keine',
    'navigator.roomsettings.moderation.rights': 'Rechte',
    'navigator.roomsettings.moderation.all': 'Alle',

    // ── Room settings - rights ──
    'navigator.flatctrls.userswithrights': '%displayed% / %total% Benutzer mit Rechten',
    'navigator.flatctrls.clear': 'Rechte entfernen',

    // ── Link / Embed ──
    'navigator.embed.title': 'Raumlink',
    'navigator.embed.headline': 'Raumlink teilen',
    'navigator.embed.info': 'Teile diesen Raum mit Freunden.',
    'navigator.embed.caption': 'Raumlink',
    'navigator.embed.src': 'Link:',

    // ── Staff picks ──
    'navigator.staffpicks.pick': 'Als Staff-Pick markieren',
    'navigator.staffpicks.unpick': 'Staff-Pick entfernen',

    // ── Mute all ──
    'navigator.muteall_on': 'Alle laut schalten',
    'navigator.muteall_off': 'Alle stumm schalten',

    // ── Alerts ──
    'navigator.guestroomfull.title': 'Raum voll',
    'navigator.guestroomfull.text': 'Dieser Raum ist leider voll.',
    'navigator.banned.title': 'Gebannt',
    'navigator.banned.text': 'Du bist aus diesem Raum verbannt.',

    // ── Group base ──
    'navigator.guildbase': 'Gruppenraum: %groupName%',

    // ── Pinned section ──
    'navigator.pinned.title': 'Angepinnt',

    // ── Events ──
    'navigator.eventinprogress': 'Event läuft!',

    // ── Generic ──
    'generic.cancel': 'Abbrechen',
};

export function applyGermanNavigatorLocale(): void
{
    const localization = GetLocalization();

    for(const [ key, value ] of Object.entries(NAVIGATOR_DE))
    {
        localization.setValue(key, value);
    }
}
