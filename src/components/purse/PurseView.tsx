import { FriendlyTime, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, LocalizeText, getAuthHeaders } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { usePurse } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CurrencyView } from './views/CurrencyView';
import { LevelView } from './views/LevelView';
import { SeasonalView } from './views/SeasonalView';
import {
    HelpCircle, ShieldAlert, MessageCircle, Scale, Settings,
    User, MessageSquare, Check, ChevronLeft, ChevronRight, Send,
    Loader2, CheckCircle2, Clock, AlertTriangle, Sparkles, Gift,
} from 'lucide-react';

function CatalogIcon({ iconId }: { iconId: number })
{
    const imageUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
    return <img src={ `${ imageUrl }catalogue/icon_${ iconId }.png` } alt="" className="w-5 h-5" style={ { imageRendering: 'pixelated', objectFit: 'contain' } } draggable={ false } />;
}

const TOOL_ICONS: { iconId: number; label: string; link: string }[] = [
    { iconId: 69, label: 'Marktplatz', link: 'marketplace/toggle' },
    { iconId: 71, label: 'Preisliste', link: 'pricelist/toggle' },
    { iconId: 1004, label: 'Werkstatt', link: 'workshop/toggle' },
    { iconId: 221, label: 'Sets', link: 'sets/toggle' },
];

// ═══════════════════════════════════════════════════
// HELP POPOVER (1:1 from prototype)
// ═══════════════════════════════════════════════════

const HELP_INDEX = [
    { icon: ShieldAlert, title: 'Jemand melden', desc: 'Melde einen Spieler wegen Fehlverhalten', color: 'text-red-500', bg: 'bg-red-50', hover: 'hover:border-red-200' },
    { icon: MessageCircle, title: 'Live-Support', desc: 'Chatte direkt mit einem Teammitglied', color: 'text-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-200' },
    { icon: Scale, title: 'Mein Sanktionsstatus', desc: 'Prüfe ob Sanktionen gegen dich vorliegen', color: 'text-amber-500', bg: 'bg-amber-50', hover: 'hover:border-amber-200' },
];

const DEMO_USERS = ['Player123', 'xXDarkLordXx', 'Habbo_Fan99'];
const DEMO_CHATS = ['lol du bist so schlecht', 'geh weg noob', 'ich hack dich', 'du stinkst'];
const DEMO_CATEGORIES = [
    { name: 'Beleidigung', topics: ['Verbale Beleidigung', 'Rassismus', 'Sexuelle Belästigung'] },
    { name: 'Betrug', topics: ['Scamming', 'Account-Diebstahl'] },
    { name: 'Unangemessener Name', topics: ['Beleidigender Name', 'Werbung im Namen'] },
    { name: 'Spam', topics: ['Chat-Spam', 'Handels-Spam'] },
];

const STEP_TITLES: Record<number, string> = {
    0: 'Hilfe', 1: 'Wen möchtest du melden?', 2: 'Nachrichten auswählen', 3: 'Kategorie wählen',
    4: 'Beschreibe das Problem', 5: 'Meldung absenden', 10: 'Live-Support', 11: 'Live-Support', 12: 'Live-Support', 20: 'Sanktionsstatus',
};

const DEMO_CHAT_MESSAGES = [
    { from: 'staff', text: 'Hallo! Wie kann ich dir helfen?' },
    { from: 'user', text: 'Jemand hat mich beleidigt im Raum' },
    { from: 'staff', text: 'Das tut mir leid. Kannst du mir den Namen des Spielers nennen?' },
];

function HelpPopover()
{
    const [ step, setStep ] = useState(0);
    const [ selectedUser, setSelectedUser ] = useState(-1);
    const [ selectedChats, setSelectedChats ] = useState<number[]>([]);
    const [ selectedCat, setSelectedCat ] = useState(-1);
    const [ selectedTopic, setSelectedTopic ] = useState(-1);
    const [ message, setMessage ] = useState('');

    const reset = () => { setStep(0); setSelectedUser(-1); setSelectedChats([]); setSelectedCat(-1); setSelectedTopic(-1); setMessage(''); };
    const toggleChat = (i: number) => setSelectedChats(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

    const goBack = () =>
    {
        if(step === 3 && selectedCat >= 0 && selectedTopic < 0) { setSelectedCat(-1); return; }
        if(step >= 10 && step <= 12) { reset(); return; }
        if(step === 20) { reset(); return; }
        setStep(s => s - 1);
    };

    useEffect(() =>
    {
        if(step === 10) { const t = setTimeout(() => setStep(11), 3000); return () => clearTimeout(t); }
        if(step === 11) { const t = setTimeout(() => setStep(12), 2000); return () => clearTimeout(t); }
    }, [ step ]);

    return (
        <Popover onOpenChange={ open => { if(!open) reset(); } }>
            <PopoverTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <i className="icon icon-help" />
                </div>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={ 8 } className="w-[320px] p-0">
                {/* Header */}
                <div className="px-4 pt-3 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        { step > 0 && (
                            <button onClick={ goBack } className="p-0.5 rounded-md hover:bg-accent/50 transition-colors">
                                <ChevronLeft className="size-4 text-muted-foreground" />
                            </button>
                        ) }
                        <HelpCircle className="size-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{ STEP_TITLES[step] ?? 'Hilfe' }</span>
                    </div>
                    { step === 0 && <p className="text-[11px] text-muted-foreground mt-0.5">Wie können wir helfen?</p> }
                </div>

                <div className="p-3">
                    {/* Step 0 — Index */}
                    { step === 0 && (
                        <div className="space-y-1.5">
                            { HELP_INDEX.map((item, i) => (
                                <button key={ item.title } onClick={ () => { if(i === 0) setStep(1); if(i === 1) setStep(10); if(i === 2) setStep(20); } } className={ `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 ${ item.hover } hover:bg-accent/30 transition-all text-left` }>
                                    <div className={ `shrink-0 p-2 rounded-lg ${ item.bg }` }>
                                        <item.icon className={ `size-4 ${ item.color }` } />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium">{ item.title }</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ item.desc }</p>
                                    </div>
                                </button>
                            )) }
                        </div>
                    ) }

                    {/* Step 1 — Spieler wählen */}
                    { step === 1 && (
                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground mb-2">Wähle den Spieler, den du melden möchtest</p>
                            { DEMO_USERS.map((name, i) => (
                                <button key={ name } onClick={ () => setSelectedUser(i) } className={ `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${ selectedUser === i ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:bg-accent/30' }` }>
                                    <div className={ `shrink-0 p-1.5 rounded-lg ${ selectedUser === i ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground' }` }>
                                        <User className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium">{ name }</span>
                                </button>
                            )) }
                            <div className="flex justify-end pt-2">
                                <button className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={ selectedUser < 0 } onClick={ () => setStep(2) }>Weiter</button>
                            </div>
                        </div>
                    ) }

                    {/* Step 2 — Nachrichten wählen */}
                    { step === 2 && (
                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground mb-2">Wähle die Nachrichten, die du melden möchtest</p>
                            { DEMO_CHATS.map((msg, i) =>
                            {
                                const sel = selectedChats.includes(i);
                                return (
                                    <button key={ i } onClick={ () => toggleChat(i) } className={ `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${ sel ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:bg-accent/30' }` }>
                                        <div className={ `shrink-0 size-5 rounded-md border flex items-center justify-center transition-all ${ sel ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-background' }` }>
                                            { sel && <Check className="size-3" /> }
                                        </div>
                                        <MessageSquare className="size-3.5 text-muted-foreground/40 shrink-0" />
                                        <span className="text-xs text-foreground/80 truncate">{ msg }</span>
                                    </button>
                                );
                            }) }
                            <div className="flex justify-end pt-2">
                                <button className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={ selectedChats.length === 0 } onClick={ () => setStep(3) }>Weiter</button>
                            </div>
                        </div>
                    ) }

                    {/* Step 3 — Kategorie / Thema wählen */}
                    { step === 3 && (
                        <div className="space-y-1.5">
                            { selectedCat < 0 ? (
                                <>
                                    <p className="text-[11px] text-muted-foreground mb-2">Wähle eine Kategorie</p>
                                    { DEMO_CATEGORIES.map((cat, i) => (
                                        <button key={ cat.name } onClick={ () => { setSelectedCat(i); setSelectedTopic(-1); } } className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 hover:bg-accent/30 transition-all text-left">
                                            <span className="text-xs font-medium">{ cat.name }</span>
                                            <ChevronRight className="size-4 text-muted-foreground/40" />
                                        </button>
                                    )) }
                                </>
                            ) : (
                                <>
                                    <button onClick={ () => { setSelectedCat(-1); setSelectedTopic(-1); } } className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2">
                                        <ChevronLeft className="size-3.5" />Zurück zu Kategorien
                                    </button>
                                    { DEMO_CATEGORIES[selectedCat].topics.map((topic, i) => (
                                        <button key={ topic } onClick={ () => setSelectedTopic(i) } className={ `w-full px-3 py-2.5 rounded-xl border transition-all text-left text-xs font-medium ${ selectedTopic === i ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:bg-accent/30' }` }>
                                            { topic }
                                        </button>
                                    )) }
                                    <div className="flex justify-end pt-2">
                                        <button className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={ selectedTopic < 0 } onClick={ () => setStep(4) }>Weiter</button>
                                    </div>
                                </>
                            ) }
                        </div>
                    ) }

                    {/* Step 4 — Beschreibung */}
                    { step === 4 && (
                        <div className="space-y-3">
                            <p className="text-[11px] text-muted-foreground">Beschreibe das Problem möglichst genau (min. 15 Zeichen)</p>
                            <div className="relative">
                                <textarea value={ message } onChange={ e => setMessage(e.target.value) } placeholder="Was ist passiert?" rows={ 4 } className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none" />
                                <span className={ `absolute bottom-2 right-2.5 text-[10px] ${ message.length >= 15 ? 'text-green-500' : 'text-muted-foreground/30' }` }>{ message.length }/15</span>
                            </div>
                            <div className="flex justify-end">
                                <button className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={ message.length < 15 } onClick={ () => setStep(5) }>Weiter</button>
                            </div>
                        </div>
                    ) }

                    {/* Step 5 — Zusammenfassung */}
                    { step === 5 && (
                        <div className="space-y-2.5">
                            <p className="text-[11px] text-muted-foreground">Prüfe deine Meldung und sende sie ab</p>
                            <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Deine Beschreibung</p>
                                <p className="text-xs">{ message }</p>
                            </div>
                            <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Gemeldete Nachrichten</p>
                                <p className="text-xs">{ selectedChats.length } Nachricht(en) ausgewählt</p>
                            </div>
                            <div className="flex justify-end pt-1">
                                <button className="h-7 px-3 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5" onClick={ reset }>
                                    <Send className="size-3" />Meldung absenden
                                </button>
                            </div>
                        </div>
                    ) }

                    {/* Step 10 — Warteschlange */}
                    { step === 10 && (
                        <div className="flex flex-col items-center text-center py-4 space-y-3">
                            <Loader2 className="size-8 text-blue-500 animate-spin" />
                            <div>
                                <p className="text-xs font-semibold">Deine Anfrage wird bearbeitet...</p>
                                <p className="text-[11px] text-muted-foreground mt-1">Geschätzte Wartezeit: ~2 Minuten</p>
                            </div>
                            <button className="h-7 px-3 text-xs font-medium rounded-md border border-red-200 text-red-500 hover:bg-red-50" onClick={ reset }>Abbrechen</button>
                        </div>
                    ) }

                    {/* Step 11 — Mitarbeiter gefunden */}
                    { step === 11 && (
                        <div className="flex flex-col items-center text-center py-4 space-y-3">
                            <CheckCircle2 className="size-8 text-green-500" />
                            <div>
                                <p className="text-xs font-semibold">Ein Teammitglied wurde gefunden!</p>
                                <p className="text-[11px] text-muted-foreground mt-1">Du wirst gleich verbunden...</p>
                            </div>
                        </div>
                    ) }

                    {/* Step 12 — Live Chat */}
                    { step === 12 && (
                        <div className="flex flex-col gap-2.5">
                            <div className="h-[200px] overflow-y-auto space-y-2 pr-1">
                                { DEMO_CHAT_MESSAGES.map((msg, i) => (
                                    <div key={ i } className={ `flex gap-2 ${ msg.from === 'user' ? 'justify-end' : 'justify-start' }` }>
                                        <div className={ `max-w-[75%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${ msg.from === 'user' ? 'bg-primary/10 text-foreground' : 'bg-muted/40 text-foreground' }` }>
                                            { msg.from === 'staff' && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Mod_Sarah</p> }
                                            { msg.text }
                                        </div>
                                    </div>
                                )) }
                            </div>
                            <div className="flex gap-1.5">
                                <input placeholder="Nachricht schreiben..." className="h-7 text-xs flex-1 px-2 rounded-md border border-border bg-background outline-none focus:ring-1 focus:ring-ring" />
                                <button className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">Senden</button>
                            </div>
                            <button className="h-7 px-3 text-xs font-medium rounded-md border border-green-200 text-green-600 hover:bg-green-50 w-full" onClick={ reset }>Gespräch beenden</button>
                        </div>
                    ) }

                    {/* Step 20 — Sanktionsstatus */}
                    { step === 20 && (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-green-200 bg-green-50">
                                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                                <p className="text-xs font-medium text-green-700">Keine aktiven Sanktionen</p>
                            </div>
                            <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Letzte Sanktion</p>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Typ</span><span className="text-[11px] font-medium">Mute (2 Stunden)</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Datum</span><span className="text-[11px] font-medium">15.02.2026, 14:32</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Grund</span><span className="text-[11px] font-medium">Beleidigung</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20">
                                <Clock className="size-3.5 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Bewährung verbleibend</p>
                                    <p className="text-xs font-medium">3 Tage</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50">
                                <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-700">Bei erneutem Verstoß: Ban (24 Stunden)</p>
                            </div>
                            <button className="h-7 px-3 text-xs font-medium rounded-md border border-border text-foreground hover:bg-accent w-full" onClick={ reset }>Verstanden</button>
                        </div>
                    ) }
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ═══════════════════════════════════════════════════
// SETTINGS POPOVER (1:1 from prototype)
// ═══════════════════════════════════════════════════

const SETTINGS_TOGGLES = [
    { label: 'Alten Chat bevorzugen', defaultOn: false },
    { label: 'Raumeinladungen ignorieren', defaultOn: true },
    { label: 'Kamera folgt nicht', defaultOn: false },
    { label: 'Mehrere Objekte platzieren', defaultOn: false },
    { label: 'Kaufbestätigung überspringen', defaultOn: false },
];

const VOLUME_SLIDERS = [
    { label: 'System-Sounds', defaultVal: 60 },
    { label: 'Möbel-Sounds', defaultVal: 40 },
    { label: 'Trax-Musik', defaultVal: 80 },
];

function SettingsPopover()
{
    const [ toggles, setToggles ] = useState(SETTINGS_TOGGLES.map(t => t.defaultOn));
    const [ volumes, setVolumes ] = useState(VOLUME_SLIDERS.map(v => v.defaultVal));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <i className="icon icon-cog" />
                </div>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={ 8 } className="w-[340px] p-0">
                <div className="px-4 pt-3 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <Settings className="size-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Einstellungen</span>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Allgemein</span>
                        <div className="mt-2 space-y-2.5">
                            { SETTINGS_TOGGLES.map((t, i) => (
                                <div key={ t.label } className="flex items-center justify-between">
                                    <span className="text-xs">{ t.label }</span>
                                    <Switch checked={ toggles[i] } onCheckedChange={ v => setToggles(prev => { const n = [...prev]; n[i] = v; return n; }) } />
                                </div>
                            )) }
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Lautstärke</span>
                        <div className="mt-3 space-y-4">
                            { VOLUME_SLIDERS.map((v, i) => (
                                <div key={ v.label } className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs">{ v.label }</span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums">{ volumes[i] }%</span>
                                    </div>
                                    <Slider value={ [ volumes[i] ] } max={ 100 } step={ 1 } onValueChange={ (val: number[]) => setVolumes(prev => { const n = [...prev]; n[i] = val[0]; return n; }) } />
                                </div>
                            )) }
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ═══════════════════════════════════════════════════
// MAIN PURSE VIEW (TopBar — 1:1 floating panel)
// ═══════════════════════════════════════════════════

export const PurseView: FC<{}> = props =>
{
    const { purse = null, hcDisabled = false } = usePurse();

    const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

    const [ offerCount, setOfferCount ] = useState(0);

    useEffect(() =>
    {
        const fetchOffers = () =>
        {
            try
            {
                const cmsUrl = GetConfiguration<string>('url.prefix', '');
                const userId = GetSessionDataManager().userId;
                if(!cmsUrl || !userId) return;

                fetch(`${ cmsUrl }/api/marketplace?action=my-offers-received`, {
                    headers: getAuthHeaders(),
                })
                    .then(r => r.ok ? r.json() : [])
                    .then(data => setOfferCount(Array.isArray(data) ? data.length : 0))
                    .catch(() => {});
            }
            catch {}
        };

        fetchOffers();
        const interval = setInterval(fetchOffers, 30000);
        return () => clearInterval(interval);
    }, []);

    const getClubText = (() =>
    {
        if(!purse) return null;

        const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
        const minutesUntilExpiration = purse.minutesUntilExpiration;

        if(purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');
        else if((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);
        else return FriendlyTime.shortFormat(totalDays * 86400);
    })();

    const getCurrencyElements = (offset: number, limit: number = -1, seasonal: boolean = false) =>
    {
        if(!purse || !purse.activityPoints || !purse.activityPoints.size) return null;

        const types = Array.from(purse.activityPoints.keys()).filter(type => (displayedCurrencies.indexOf(type) >= 0));
        let count = 0;

        while(count < offset) { types.shift(); count++; }

        count = 0;
        const elements: JSX.Element[] = [];

        for(const type of types)
        {
            if((limit > -1) && (count === limit)) break;

            if(seasonal) elements.push(<SeasonalView key={ type } type={ type } amount={ purse.activityPoints.get(type) } />);
            else elements.push(<CurrencyView key={ type } type={ type } amount={ purse.activityPoints.get(type) } short={ currencyDisplayNumberShort } />);

            count++;
        }

        return elements;
    }

    if(!purse) return null;

    return (
        <TooltipProvider delayDuration={ 400 }>
            <div className="fixed top-3 left-20 z-[69] pointer-events-auto inline-flex items-center gap-1 py-1.5 px-3 rounded-2xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-md">
                <CurrencyView type={ -1 } amount={ purse.credits } short={ currencyDisplayNumberShort } />
                { getCurrencyElements(0, 2) }
                { getCurrencyElements(2, -1, true) }

                <div className="w-px h-6 bg-border/30 mx-1.5" />
                <LevelView />

                { !hcDisabled && <div className="w-px h-6 bg-border/30 mx-1.5" /> }
                { !hcDisabled && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('habboUI/open/hccenter') }>
                                <LayoutCurrencyIcon type="hc" />
                                <span className="text-xs font-medium">{ getClubText }</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Habbo Club</TooltipContent>
                    </Tooltip>
                ) }

                <div className="w-px h-6 bg-border/30 mx-1.5" />

                { TOOL_ICONS.map(({ iconId, label, link }) => (
                    <Tooltip key={ label }>
                        <TooltipTrigger asChild>
                            <div className="relative p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent(link) }>
                                <CatalogIcon iconId={ iconId } />
                                { label === 'Marktplatz' && offerCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm">{ offerCount }</span>
                                ) }
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">{ label }</TooltipContent>
                    </Tooltip>
                )) }

                <div className="w-px h-6 bg-border/30 mx-1.5" />

                <HelpPopover />
                <SettingsPopover />
            </div>
        </TooltipProvider>
    );
}
