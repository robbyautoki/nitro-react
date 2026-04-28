// =============================================================================
// Pet Command Translations
// =============================================================================
// Übersetzt englische Pet-Commands aus assets/gamedata/ExternalTexts.json
// (`pet.command.${id}`) in deutsche Befehle, die der User ins Chat-Eingabefeld
// senden möchte.
//
// WICHTIG: Diese Strings MÜSSEN auf die deutschen Trigger-Patterns aus
// `database/134-pet-chat-triggers-deutsch.sql` matchen. Beispiel: "Spielen"
// matcht `\bspielen\b`, aber "Spiel" würde nur einen englischen `\bplay\b`
// matchen. Wir senden also den **deutschen Trigger-Text**, das Pet versteht
// ihn, der Vanilla-Bubble bleibt unverändert. Nicht alle Befehle haben
// deutsche Trigger (z.B. "Züchten" läuft via Inventar) — Fallback ist dann
// der englische Originaltext.
//
// Pflege-Hinweis: Bei jeder Änderung hier MUSS Migration 134 mitgepflegt
// werden — beide Listen sind voneinander abhängig.
// =============================================================================

export const PET_COMMAND_TRANSLATIONS: Record<string, string> = {
    'Free': 'Frei',
    'Sit': 'Sitz',
    'Down': 'Platz',
    'Here': 'Hier',
    'Beg': 'Männchen',
    'Play dead': 'Stell dich tot',
    'Stay': 'Bleib',
    'Follow': 'Folge',
    'Stand': 'Steh',
    'Jump': 'Spring',
    'Speak': 'Sprich',
    'Play': 'Spielen',
    'Silent': 'Ruhig',
    'Nest': 'Ins Nest',
    'Drink': 'Trink',
    'Follow left': 'Folge links',
    'Follow right': 'Folge rechts',
    'Play football': 'Fußball',
    'Come here': 'Komm her',
    'Bounce': 'Springe',
    'Flat': 'Flach',
    'Dance': 'Tanz',
    'Spin': 'Dreh dich',
    'Switch TV': 'TV an',
    'Move forward': 'Vorwärts',
    'Turn left': 'Links drehen',
    'Turn right': 'Rechts drehen',
    'Relax': 'Entspann dich',
    'Croak': 'Quak',
    'Dip': 'Tauch',
    'Wave': 'Winke',
    'Mambo!': 'Mambo',
    'High jump': 'Hoch springen',
    'Chicken dance': 'Hühnertanz',
    'Triple jump': 'Dreifachsprung',
    'Spread wings': 'Flügel ausbreiten',
    'Breathe fire': 'Feuer speien',
    'Hang': 'Hängen',
    'Torch': 'Fackel',
    'Swing': 'Schwingen',
    'Roll': 'Rolle',
    'Ring of fire': 'Feuerring',
    'Eat': 'Iss',
    'Wag Tail': 'Schwanz wedeln',
    'Count': 'Zähle',
    'Breed': 'Züchten'
};

/**
 * Übersetzt einen englischen Pet-Command in den deutschen Befehl, der ins
 * Chat-Eingabefeld geschrieben werden soll. Fällt auf den Originaltext
 * zurück, wenn keine Übersetzung gefunden wurde.
 */
export const translatePetCommand = (englishCommand: string): string =>
{
    if (!englishCommand) return englishCommand;

    return PET_COMMAND_TRANSLATIONS[englishCommand] ?? englishCommand;
};
