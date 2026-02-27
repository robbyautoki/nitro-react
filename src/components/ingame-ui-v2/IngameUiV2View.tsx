
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import {
  Headphones,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Home,
  Layers,
  Monitor,
  Mic,
  X,
  SkipForward,
  Repeat,
  Power,
  Music,
  HelpCircle,
  ShieldAlert,
  MessageCircle,
  Scale,
  Settings,
  User,
  MessageSquare,
  Check,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldX,
  Sparkles,
  Gift,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};

function CurrencyIcon({ type }: { type: string }) {
  return <img src={`${ASSETS_URL()}/wallet/${type}.png`} alt={type} className="w-4 h-4" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

function ToolbarIcon({ name, w, h }: { name: string; w: number; h: number }) {
  return <img src={`/toolbar-icons/${name}`} alt={name} style={{ width: w, height: h, imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

function AvatarImg({ figure, size = "l" }: { figure: string; size?: string }) {
  return <img src={`https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&direction=2&head_direction=2&size=${size}`} alt="Avatar" draggable={false} />;
}

function CatalogIcon({ iconId }: { iconId: number }) {
  return <img src={`${ASSETS_URL()}/c_images/catalogue/icon_${iconId}.png`} alt="" className="w-5 h-5" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

const DEMO_FIGURE = "hr-3163-45.hd-180-1.ch-3030-73.lg-3116-73-1408.sh-3016-73.ha-3614-73";
const DJ_FIGURE = "hr-831-45.hd-180-2.ch-255-73.lg-280-73.sh-305-73.ha-1003-73";

const CURRENCIES = [
  { type: "-1", label: "Credits", value: "12.450" },
  { type: "5", label: "Diamanten", value: "847" },
  { type: "0", label: "Duckets", value: "3.210" },
];

const NAV_ICONS = [
  { file: "habbo.png", w: 32, h: 28, label: "Hotel View" },
  { file: "rooms.png", w: 44, h: 30, label: "Navigator" },
  { file: "game.png", w: 44, h: 25, label: "Games" },
  { file: "catalog.png", w: 37, h: 36, label: "Katalog" },
  { file: "inventory.png", w: 44, h: 41, label: "Inventar", badge: 3 },
  { file: "camera.png", w: 37, h: 36, label: "Kamera" },
  { file: "modtools.png", w: 29, h: 34, label: "Mod Tools" },
];

const SOCIAL_ICONS = [
  { file: "friend_all.png", w: 32, h: 33, label: "Freunde", badge: 2 },
  { file: "message.png", w: 30, h: 30, label: "Messenger" },
];

const ME_ICONS = [
  { file: "me-menu/achievements.png", w: 32, h: 30, label: "Achievements" },
  { file: "me-menu/profile.png", w: 32, h: 30, label: "Profil" },
  { file: "me-menu/my-rooms.png", w: 32, h: 30, label: "Meine Räume" },
  { file: "me-menu/clothing.png", w: 32, h: 30, label: "Avatar" },
  { file: "me-menu/cog.png", w: 32, h: 30, label: "Einstellungen" },
];

const TOOL_ICONS: { iconId: number; label: string; badge?: number }[] = [
  { iconId: 69, label: "Marktplatz", badge: 2 },
  { iconId: 71, label: "Preisliste" },
  { iconId: 1004, label: "Werkstatt" },
  { iconId: 221, label: "Sets" },
];

const DEMO_QUEUE = [
  { title: "Starboy", artist: "The Weeknd", duration: "3:50" },
  { title: "Creepin'", artist: "Metro Boomin, The Weeknd", duration: "3:42" },
  { title: "Save Your Tears", artist: "The Weeknd", duration: "3:35" },
];

// ═══════════════════════════════════════════════════
// HELP POPOVER (full flow)
// ═══════════════════════════════════════════════════

const HELP_INDEX = [
  { icon: ShieldAlert, title: "Jemand melden", desc: "Melde einen Spieler wegen Fehlverhalten", color: "text-red-500", bg: "bg-red-50", hover: "hover:border-red-200" },
  { icon: MessageCircle, title: "Live-Support", desc: "Chatte direkt mit einem Teammitglied", color: "text-blue-500", bg: "bg-blue-50", hover: "hover:border-blue-200" },
  { icon: Scale, title: "Mein Sanktionsstatus", desc: "Prüfe ob Sanktionen gegen dich vorliegen", color: "text-amber-500", bg: "bg-amber-50", hover: "hover:border-amber-200" },
];

const DEMO_USERS = ["Player123", "xXDarkLordXx", "Habbo_Fan99"];
const DEMO_CHATS = ["lol du bist so schlecht", "geh weg noob", "ich hack dich", "du stinkst"];
const DEMO_CATEGORIES = [
  { name: "Beleidigung", topics: ["Verbale Beleidigung", "Rassismus", "Sexuelle Belästigung"] },
  { name: "Betrug", topics: ["Scamming", "Account-Diebstahl"] },
  { name: "Unangemessener Name", topics: ["Beleidigender Name", "Werbung im Namen"] },
  { name: "Spam", topics: ["Chat-Spam", "Handels-Spam"] },
];

const STAFF_FIGURE = "hr-893-45.hd-600-2.ch-665-73.lg-720-73.sh-725-73.ha-1015-73";

const DEMO_CHAT_MESSAGES = [
  { from: "staff", text: "Hallo! Wie kann ich dir helfen?" },
  { from: "user", text: "Jemand hat mich beleidigt im Raum" },
  { from: "staff", text: "Das tut mir leid. Kannst du mir den Namen des Spielers nennen?" },
];

const STEP_TITLES: Record<number, string> = {
  0: "Hilfe",
  1: "Wen möchtest du melden?",
  2: "Nachrichten auswählen",
  3: "Kategorie wählen",
  4: "Beschreibe das Problem",
  5: "Meldung absenden",
  10: "Live-Support",
  11: "Live-Support",
  12: "Live-Support",
  20: "Sanktionsstatus",
};

function HelpPopover() {
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState(-1);
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [selectedCat, setSelectedCat] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState(-1);
  const [message, setMessage] = useState("");

  const reset = () => { setStep(0); setSelectedUser(-1); setSelectedChats([]); setSelectedCat(-1); setSelectedTopic(-1); setMessage(""); };
  const toggleChat = (i: number) => setSelectedChats(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const goBack = () => {
    if (step === 3 && selectedCat >= 0 && selectedTopic < 0) { setSelectedCat(-1); return; }
    if (step >= 10 && step <= 12) { reset(); return; }
    if (step === 20) { reset(); return; }
    setStep(s => s - 1);
  };

  useEffect(() => {
    if (step === 10) { const t = setTimeout(() => setStep(11), 3000); return () => clearTimeout(t); }
    if (step === 11) { const t = setTimeout(() => setStep(12), 2000); return () => clearTimeout(t); }
  }, [step]);

  return (
    <Popover onOpenChange={open => { if (!open) reset(); }}>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <ToolbarIcon name="help.png" w={13} h={23} />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={goBack} className="p-0.5 rounded-md hover:bg-accent/50 transition-colors">
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>
            )}
            {step === 12 ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0 bg-muted/30">
                  <AvatarImg figure={STAFF_FIGURE} size="s" />
                </div>
                <span className="text-sm font-semibold">Mod_Sarah</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ) : (
              <>
                <HelpCircle className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{STEP_TITLES[step] ?? "Hilfe"}</span>
              </>
            )}
          </div>
          {step === 0 && <p className="text-[11px] text-muted-foreground mt-0.5">Wie können wir helfen?</p>}
        </div>

        <div className="p-3">
          {/* Step 0 — Index */}
          {step === 0 && (
            <div className="space-y-1.5">
              {HELP_INDEX.map((item, i) => (
                <button key={item.title} onClick={() => { if (i === 0) setStep(1); if (i === 1) setStep(10); if (i === 2) setStep(20); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 ${item.hover} hover:bg-accent/30 transition-all text-left`}>
                  <div className={`shrink-0 p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Spieler wählen */}
          {step === 1 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground mb-2">Wähle den Spieler, den du melden möchtest</p>
              {DEMO_USERS.map((name, i) => (
                <button key={name} onClick={() => setSelectedUser(i)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${selectedUser === i ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-accent/30"}`}>
                  <div className={`shrink-0 p-1.5 rounded-lg ${selectedUser === i ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                    <User className="size-4" />
                  </div>
                  <span className="text-xs font-medium">{name}</span>
                </button>
              ))}
              <div className="flex justify-end pt-2">
                <Button size="sm" className="h-7 text-xs" disabled={selectedUser < 0} onClick={() => setStep(2)}>Weiter</Button>
              </div>
            </div>
          )}

          {/* Step 2 — Nachrichten wählen */}
          {step === 2 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground mb-2">Wähle die Nachrichten, die du melden möchtest</p>
              {DEMO_CHATS.map((msg, i) => {
                const sel = selectedChats.includes(i);
                return (
                  <button key={i} onClick={() => toggleChat(i)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-accent/30"}`}>
                    <div className={`shrink-0 size-5 rounded-md border flex items-center justify-center transition-all ${sel ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background"}`}>
                      {sel && <Check className="size-3" />}
                    </div>
                    <MessageSquare className="size-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs text-foreground/80 truncate">{msg}</span>
                  </button>
                );
              })}
              <div className="flex justify-end pt-2">
                <Button size="sm" className="h-7 text-xs" disabled={selectedChats.length === 0} onClick={() => setStep(3)}>Weiter</Button>
              </div>
            </div>
          )}

          {/* Step 3 — Kategorie / Thema wählen */}
          {step === 3 && (
            <div className="space-y-1.5">
              {selectedCat < 0 ? (
                <>
                  <p className="text-[11px] text-muted-foreground mb-2">Wähle eine Kategorie</p>
                  {DEMO_CATEGORIES.map((cat, i) => (
                    <button key={cat.name} onClick={() => { setSelectedCat(i); setSelectedTopic(-1); }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 hover:bg-accent/30 transition-all text-left">
                      <span className="text-xs font-medium">{cat.name}</span>
                      <ChevronRight className="size-4 text-muted-foreground/40" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button onClick={() => { setSelectedCat(-1); setSelectedTopic(-1); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2">
                    <ChevronLeft className="size-3.5" />Zurück zu Kategorien
                  </button>
                  {DEMO_CATEGORIES[selectedCat].topics.map((topic, i) => (
                    <button key={topic} onClick={() => setSelectedTopic(i)} className={`w-full px-3 py-2.5 rounded-xl border transition-all text-left text-xs font-medium ${selectedTopic === i ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-accent/30"}`}>
                      {topic}
                    </button>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button size="sm" className="h-7 text-xs" disabled={selectedTopic < 0} onClick={() => setStep(4)}>Weiter</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4 — Beschreibung */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">Beschreibe das Problem möglichst genau (min. 15 Zeichen)</p>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Was ist passiert?"
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <span className={`absolute bottom-2 right-2.5 text-[10px] ${message.length >= 15 ? "text-green-500" : "text-muted-foreground/30"}`}>{message.length}/15</span>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="h-7 text-xs" disabled={message.length < 15} onClick={() => setStep(5)}>Weiter</Button>
              </div>
            </div>
          )}

          {/* Step 5 — Zusammenfassung */}
          {step === 5 && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-muted-foreground">Prüfe deine Meldung und sende sie ab</p>
              <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Deine Beschreibung</p>
                <p className="text-xs">{message}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Gemeldete Nachrichten</p>
                <p className="text-xs">{selectedChats.length} Nachricht(en) ausgewählt</p>
              </div>
              <div className="flex justify-end pt-1">
                <Button size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white" onClick={reset}>
                  <Send className="size-3" />Meldung absenden
                </Button>
              </div>
            </div>
          )}

          {/* Step 10 — Warteschlange */}
          {step === 10 && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <Loader2 className="size-8 text-blue-500 animate-spin" />
              <div>
                <p className="text-xs font-semibold">Deine Anfrage wird bearbeitet...</p>
                <p className="text-[11px] text-muted-foreground mt-1">Geschätzte Wartezeit: ~2 Minuten</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={reset}>Abbrechen</Button>
            </div>
          )}

          {/* Step 11 — Mitarbeiter gefunden */}
          {step === 11 && (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <CheckCircle2 className="size-8 text-green-500" />
              <div>
                <p className="text-xs font-semibold">Ein Teammitglied wurde gefunden!</p>
                <p className="text-[11px] text-muted-foreground mt-1">Du wirst gleich verbunden...</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                  <AvatarImg figure={STAFF_FIGURE} size="s" />
                </div>
                <span className="text-xs font-medium">Mod_Sarah</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
          )}

          {/* Step 12 — Live Chat */}
          {step === 12 && (
            <div className="flex flex-col gap-2.5">
              <div className="h-[200px] overflow-y-auto space-y-2 pr-1">
                {DEMO_CHAT_MESSAGES.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.from === "staff" && (
                      <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-muted/30 mt-0.5">
                        <AvatarImg figure={STAFF_FIGURE} size="s" />
                      </div>
                    )}
                    <div className={`max-w-[75%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${msg.from === "user" ? "bg-primary/10 text-foreground" : "bg-muted/40 text-foreground"}`}>
                      {msg.from === "staff" && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Mod_Sarah</p>}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input placeholder="Nachricht schreiben..." className="h-7 text-xs flex-1" />
                <Button size="sm" className="h-7 text-xs shrink-0">Senden</Button>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs w-full text-green-600 border-green-200 hover:bg-green-50" onClick={reset}>Gespräch beenden</Button>
            </div>
          )}

          {/* Step 20 — Sanktionsstatus */}
          {step === 20 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-green-200 bg-green-50">
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                <p className="text-xs font-medium text-green-700">Keine aktiven Sanktionen</p>
              </div>

              <div className="px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Letzte Sanktion</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Typ</span>
                    <span className="text-[11px] font-medium">Mute (2 Stunden)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Datum</span>
                    <span className="text-[11px] font-medium">15.02.2026, 14:32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Grund</span>
                    <span className="text-[11px] font-medium">Beleidigung</span>
                  </div>
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

              <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={reset}>Verstanden</Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════
// LEVEL POPOVER
// ═══════════════════════════════════════════════════

const LEVEL_STATS = [
  { emoji: "🕐", label: "Spielzeit", value: "142 Stunden" },
  { emoji: "💬", label: "Nachrichten", value: "8.430" },
  { emoji: "🏠", label: "Räume besucht", value: "1.240" },
  { emoji: "⭐", label: "Respekt", value: "347" },
];

function LevelPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <span className="text-xs font-semibold text-foreground">Lvl 14</span>
          <div className="w-[60px] h-[3px] bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" style={{ width: "67%" }} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-[260px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            <span className="text-sm font-bold">Level 14</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Erfahrener Spieler</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Progress value={67} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground tabular-nums">4.230 / 6.300 XP</span>
              <span className="text-[11px] font-semibold tabular-nums">67%</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70">Noch 2.070 XP bis Level 15</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LEVEL_STATS.map(s => (
              <div key={s.label} className="px-2.5 py-2 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs leading-none">{s.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xs font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <Gift className="size-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-amber-700">Level 15 Belohnung</p>
              <p className="text-[10px] text-amber-600/80">Exklusiver Badge + 500 Diamanten</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════
// SETTINGS POPOVER
// ═══════════════════════════════════════════════════

const SETTINGS_TOGGLES = [
  { label: "Alten Chat bevorzugen", defaultOn: false },
  { label: "Raumeinladungen ignorieren", defaultOn: true },
  { label: "Kamera folgt nicht", defaultOn: false },
  { label: "Mehrere Objekte platzieren", defaultOn: false },
  { label: "Kaufbestätigung überspringen", defaultOn: false },
];

const VOLUME_SLIDERS = [
  { label: "System-Sounds", defaultVal: 60 },
  { label: "Möbel-Sounds", defaultVal: 40 },
  { label: "Trax-Musik", defaultVal: 80 },
];

function SettingsPopover() {
  const [toggles, setToggles] = useState(SETTINGS_TOGGLES.map(t => t.defaultOn));
  const [volumes, setVolumes] = useState(VOLUME_SLIDERS.map(v => v.defaultVal));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <ToolbarIcon name="cog.png" w={21} h={21} />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0">
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
              {SETTINGS_TOGGLES.map((t, i) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-xs">{t.label}</span>
                  <Switch checked={toggles[i]} onCheckedChange={v => setToggles(prev => { const n = [...prev]; n[i] = v; return n; })} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Lautstärke</span>
            <div className="mt-3 space-y-4">
              {VOLUME_SLIDERS.map((v, i) => (
                <div key={v.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{volumes[i]}%</span>
                  </div>
                  <Slider value={[volumes[i]]} max={100} step={1} onValueChange={val => setVolumes(prev => { const n = [...prev]; n[i] = val[0]; return n; })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════════════

function TopBar() {
  return (
    <div className="inline-flex items-center gap-1 py-1.5 px-3 rounded-2xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-md">
      {CURRENCIES.map(c => (
        <Tooltip key={c.type}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CurrencyIcon type={c.type} />
              <span className="text-xs font-semibold tabular-nums">{c.value}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{c.label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="w-px h-6 bg-border/30 mx-1.5" />

      <LevelPopover />

      <div className="w-px h-6 bg-border/30 mx-1.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
            <CurrencyIcon type="hc" />
            <span className="text-xs font-medium">23 Tage</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Habbo Club</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border/30 mx-1.5" />

      {TOOL_ICONS.map(({ iconId, label, badge }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <div className="relative p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CatalogIcon iconId={iconId} />
              {badge != null && badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm">{badge}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="w-px h-6 bg-border/30 mx-1.5" />

      <HelpPopover />
      <SettingsPopover />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// LEFT SIDEBAR
// ═══════════════════════════════════════════════════

const ONLINE_FRIENDS = [
  { name: "xXDarkLordXx", figure: "hr-831-45.hd-180-2.ch-255-73.lg-280-73.sh-305-73.ha-1003-73", room: "Chill Lounge" },
  { name: "Habbo_Fan99", figure: "hr-3163-45.hd-600-1.ch-3030-92.lg-3116-92-1408.sh-3016-92", room: "Disco Palace" },
  { name: "Player123", figure: "hr-893-45.hd-180-8.ch-665-73.lg-720-73.sh-725-73", room: "Treffpunkt" },
  { name: "CoolGirl22", figure: "hr-515-45.hd-600-10.ch-630-73.lg-710-73.sh-725-73.ha-1015-73", room: "Beach Club" },
  { name: "ProGamer_DE", figure: "hr-3163-45.hd-180-3.ch-3185-73.lg-3116-73-1408.sh-3016-73", room: "Gaming Zone" },
];

function OnlineFriendsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          {ONLINE_FRIENDS.slice(0, 3).map((f, i) => (
            <div key={i} className="relative w-7 h-7 rounded-full overflow-hidden bg-muted/30 hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarImg figure={f.figure} size="s" />
              <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white" />
            </div>
          ))}
          <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted/40 rounded-full px-1.5 py-0.5">+5</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-[280px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Online-Freunde</span>
            <Badge variant="outline" size="xs">8</Badge>
          </div>
        </div>
        <div className="p-2 space-y-0.5 max-h-[260px] overflow-y-auto">
          {ONLINE_FRIENDS.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent/40 transition-colors">
              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 bg-muted/30">
                <AvatarImg figure={f.figure} size="s" />
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{f.room}</p>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 shrink-0">Besuchen</Button>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border/50">
          <button className="text-[11px] text-primary hover:underline">Alle Freunde anzeigen</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SidebarItem({ file, w, h, label, badge }: { file: string; w: number; h: number; label: string; badge?: number }) {
  return (
    <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
      <ToolbarIcon name={file} w={Math.min(w, 28)} h={Math.min(h, 28)} />
      <span className="text-[8px] font-medium text-muted-foreground/60 leading-none">{label}</span>
      {badge != null && (
        <span className="absolute top-0.5 right-0 h-[14px] min-w-[14px] flex items-center justify-center text-[8px] px-0.5 rounded-full bg-red-500 text-white font-bold shadow-sm">{badge}</span>
      )}
    </div>
  );
}

function LeftSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <div className="relative shrink-0">
      <div className={`border-r border-border/40 bg-card/50 flex flex-col items-center py-3 gap-0.5 overflow-hidden transition-all duration-200 ${expanded ? "w-16" : "w-0 border-r-0"}`}>
      {/* Avatar → Me-Menü Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="w-9 h-9 overflow-hidden cursor-pointer rounded-lg hover:ring-2 hover:ring-primary/20 transition-all mb-1">
            <AvatarImg figure={DEMO_FIGURE} size="s" />
          </div>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={8} className="w-[180px] p-1.5">
          {ME_ICONS.map(({ file, w, h, label }) => (
            <button key={file} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
              <ToolbarIcon name={file} w={w} h={h} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <div className="w-8 h-px bg-border/30 my-1" />

      {NAV_ICONS.map(i => <SidebarItem key={i.file} {...i} />)}

      <div className="w-8 h-px bg-border/30 my-1" />

      {SOCIAL_ICONS.map(i => <SidebarItem key={i.file} file={i.file} w={i.w} h={i.h} label={i.label} badge={i.badge} />)}

      <div className="w-8 h-px bg-border/30 my-1" />

      <OnlineFriendsPopover />
      </div>
      <button onClick={onToggle} className="absolute top-3 -right-3 z-20 size-6 rounded-full bg-card border border-border/50 shadow-sm flex items-center justify-center hover:bg-accent/50 transition-colors">
        {expanded ? <ChevronLeft className="size-3 text-muted-foreground" /> : <ChevronRight className="size-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DJ PANEL POPOVER
// ═══════════════════════════════════════════════════

function DjPanelPopover() {
  const [loopOn, setLoopOn] = useState(true);
  const [radioOn, setRadioOn] = useState(true);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors">
          <Headphones className="size-3.5 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">DJ Panel</span>
            </div>
            <Badge variant="outline" size="xs">Staff</Badge>
          </div>
        </div>

        <Tabs defaultValue="playing" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4 h-9">
            <TabsTrigger value="playing" className="text-xs">Now Playing</TabsTrigger>
            <TabsTrigger value="queue" className="text-xs">Queue</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs">DJ Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="playing" className="p-4 mt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shrink-0">
                <Music className="size-5 text-purple-500/60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">Blinding Lights</p>
                <p className="text-xs text-muted-foreground truncate">The Weeknd</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">YouTube</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <Progress value={45} className="h-1.5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">1:32 / 3:22</span>
                <Badge variant="outline" size="xs" className="text-muted-foreground/60">
                  <Repeat className="size-2.5 mr-1" />Loop
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Play className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Pause className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <SkipForward className="size-3.5" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="p-4 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Queue ({DEMO_QUEUE.length})</span>
            </div>
            <div className="space-y-1">
              {DEMO_QUEUE.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-accent/40 transition-colors group">
                  <span className="text-[10px] text-muted-foreground/50 w-3 text-right tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">{t.duration}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="controls" className="p-4 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Radio</span>
              </div>
              <Switch checked={radioOn} onCheckedChange={setRadioOn} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Loop</span>
              </div>
              <Switch checked={loopOn} onCheckedChange={setLoopOn} />
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Durchsage (TTS)</label>
              <textarea
                placeholder="Durchsage-Text eingeben..."
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <Button size="sm" className="w-full h-7 text-xs">Generieren</Button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sound Effect</label>
              <div className="flex gap-1.5">
                <Input placeholder="SFX URL (MP3)..." className="h-7 text-xs" />
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">Play</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════
// RADIO PANEL
// ═══════════════════════════════════════════════════

function RadioPanel() {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex items-center gap-1 py-2 px-3 rounded-2xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors">
              <Home className="size-4 text-muted-foreground/70" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Startseite</TooltipContent>
        </Tooltip>
        <div className="w-px h-5 bg-border/30" />
        <span className="text-sm font-bold px-2 tracking-tight">bahhos</span>
        <div className="w-px h-5 bg-border/30" />
        <span className="text-xs text-muted-foreground truncate max-w-[180px] px-1.5">
          Blinding Lights – The Weeknd
        </span>
        <button onClick={() => setPlaying(v => !v)} className="p-1.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors">
          {playing ? <Pause className="size-3.5 text-muted-foreground" strokeWidth={2.5} /> : <Play className="size-3.5 text-muted-foreground" strokeWidth={2.5} />}
        </button>
        <button onClick={() => setMuted(v => !v)} className="p-1 rounded-lg cursor-pointer hover:bg-accent/60 transition-colors">
          {muted ? <VolumeX className="size-3.5 text-muted-foreground/40" /> : <Volume2 className="size-3.5 text-muted-foreground" />}
        </button>
        <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }} className="w-14 h-1 accent-primary cursor-pointer" />
        <DjPanelPopover />
      </div>

      {!dismissed && (
        <div className="min-w-[340px] max-w-[400px] flex items-start gap-3 p-3 rounded-xl bg-card/80 border border-border/40 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted/30">
            <AvatarImg figure={DJ_FIGURE} size="s" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Mic className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold">DJ Robby</span>
              <Badge variant="outline" size="xs">Durchsage</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Willkommen bei bahhos.de! Heute Abend gibt es eine besondere Show.
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const IngameUiV2View: FC<{}> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">In-Game UI</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Top Bar · Sidebar · Radio Panel</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="gap-1.5 text-muted-foreground/60"><Monitor className="w-3.5 h-3.5" />3 Panels</Badge>
              <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar expanded={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
          <div className="flex-1 overflow-auto px-8 py-8 space-y-10">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Bar — PurseView</p>
              <TopBar />
            </div>

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Radio Panel — RadioPanelView</p>
              <RadioPanel />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
