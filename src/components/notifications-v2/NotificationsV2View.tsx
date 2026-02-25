
import { useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Info,
  X,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Server,
  Wrench,
  Search,
  UserX,
  Scale,
  Users,
  UserMinus,
  Award,
  BadgeCheck,
  Heart,
  PawPrint,
  Gift,
  ShoppingBag,
  Bell,
  Gem,
  MessageSquare,
  Crown,
  Music,
  Recycle,
  MessageCircle,
  Trophy,
  Lock,
  Timer,
  Ticket,
  PartyPopper,
  Frown,
  Dumbbell,
  Swords,
  Radio,
  ExternalLink,
  Megaphone,
  CircleHelp,
  Volume2,
  SkipForward,
  Pause,
  Play,
  HandMetal,
  Store,
  ShieldBan,
  Home,
  Zap,
  Droplets,
  FlaskConical,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION PROTOTYPE CONFIG
// ═══════════════════════════════════════════════════════════════

interface NotificationDef {
  id: string;
  label: string;
  category: "alert" | "bubble" | "confirm" | "spezial";
  description: string;
}

const ALERT_NOTIFICATIONS: NotificationDef[] = [
  { id: "default-alert", label: "Default Alert (Broadcast)", category: "alert", description: "Hotel-Broadcast vom Admin/Mod an alle Spieler" },
  { id: "motd", label: "MOTD (Message of the Day)", category: "alert", description: "Tägliche Nachricht beim Login" },
  { id: "moderator-alert", label: "Moderator Alert", category: "alert", description: "Warnung/Nachricht von einem Moderator an einen Spieler" },
  { id: "connection-error", label: "Connection Error", category: "alert", description: "Verbindungsfehler zum Server" },
  { id: "hotel-closing", label: "Hotel Closing", category: "alert", description: "Hotel schließt / Wartungsankündigung" },
  { id: "maintenance", label: "Maintenance", category: "alert", description: "Wartungsmodus-Ankündigung mit Countdown" },
  { id: "nitro-system", label: "Nitro System Info", category: "alert", description: "System-Info über Nitro-Version" },
  { id: "search-alert", label: "Search Alert", category: "alert", description: "Suchergebnisse in einem Alert-Dialog" },
  { id: "trade-alert", label: "Trade Alert", category: "alert", description: "Handel fehlgeschlagen / Warnung beim Tauschen" },
  { id: "user-banned", label: "User Banned", category: "alert", description: "Nachricht wenn ein Spieler gebannt wurde" },
];

const BUBBLE_NOTIFICATIONS: NotificationDef[] = [
  { id: "friend-online", label: "Friend Online", category: "bubble", description: "Ein Freund ist online gegangen" },
  { id: "friend-offline", label: "Friend Offline", category: "bubble", description: "Ein Freund ist offline gegangen" },
  { id: "achievement", label: "Achievement", category: "bubble", description: "Achievement freigeschaltet" },
  { id: "badge-received", label: "Badge Received", category: "bubble", description: "Neues Badge erhalten" },
  { id: "respect-received", label: "Respect Received", category: "bubble", description: "Respekt von einem Spieler erhalten" },
  { id: "pet-level", label: "Pet Level Up", category: "bubble", description: "Haustier ist aufgestiegen" },
  { id: "pet-received", label: "Pet Received", category: "bubble", description: "Neues Haustier erhalten/gekauft" },
  { id: "club-gift", label: "Club Gift", category: "bubble", description: "HC-Geschenk verfügbar" },
  { id: "buy-furni", label: "Buy Furni", category: "bubble", description: "Möbelstück erfolgreich gekauft" },
  { id: "info-generic", label: "Info (generisch)", category: "bubble", description: "Generische Info-Benachrichtigung" },
  { id: "loyalty-points", label: "Loyalty Points", category: "bubble", description: "Treuepunkte erhalten" },
  { id: "mod-disclaimer", label: "Mod Disclaimer", category: "bubble", description: "Chat-Hinweis beim Betreten eines Raumes" },
  { id: "vip-bubble", label: "VIP", category: "bubble", description: "VIP-bezogene Benachrichtigung" },
  { id: "soundmachine", label: "Soundmachine", category: "bubble", description: "Soundmachine-Status-Update" },
  { id: "recycler-ok", label: "Recycler OK", category: "bubble", description: "Recycling erfolgreich abgeschlossen" },
  { id: "room-messages", label: "Room Messages Posted", category: "bubble", description: "Neue Raum-Nachrichten" },
];

const CONFIRM_NOTIFICATIONS: NotificationDef[] = [
  { id: "default-confirm", label: "Default Confirm", category: "confirm", description: "Generischer Bestätigungs-Dialog mit Confirm/Cancel" },
];

const SPECIAL_NOTIFICATIONS: NotificationDef[] = [
  { id: "win-broadcast", label: "Win Broadcast", category: "spezial", description: "Toast wenn ein Spieler einen Win erhalten hat" },
  { id: "arrest-toast", label: "Arrest/Jail Toast", category: "spezial", description: "Verhaftungs-Nachricht (persistent, oben zentriert)" },
  { id: "jail-timer", label: "Jail Timer", category: "spezial", description: "Countdown-Timer für Haftstrafe" },
  { id: "lottery-countdown", label: "Lottery Countdown", category: "spezial", description: "Lotto-Ziehung Countdown mit Jackpot" },
  { id: "lottery-result", label: "Lottery Result", category: "spezial", description: "Gewinner der Lotto-Ziehung" },
  { id: "lottery-no-winner", label: "Lottery No Winner", category: "spezial", description: "Kein Gewinner bei der Ziehung" },
  { id: "gym-info", label: "Gym Info Panel", category: "spezial", description: "Gym-Stats mit Energie, XP und Attributen" },
  { id: "combat-hp", label: "Combat HP HUD", category: "spezial", description: "HP-Leiste im Kampfmodus" },
  { id: "radio-panel", label: "Radio Panel", category: "spezial", description: "Musik-Player mit Queue, YouTube, TTS" },
  { id: "welcome-toast", label: "Welcome Toast", category: "spezial", description: "Willkommens-Nachricht beim Login (auto-dismiss)" },
  { id: "win-reward", label: "Win Reward Dialog", category: "spezial", description: "Modal zum Einlösen einer Win-Belohnung (Währung + Item)" },
  { id: "gym-progress", label: "Gym Progress", category: "spezial", description: "XP-Fortschrittsbalken über dem Avatar beim Training" },
  { id: "gym-shop", label: "Gym Shop", category: "spezial", description: "Energie-Shop Modal (Getränke kaufen)" },
  { id: "combat-shop", label: "Combat Shop", category: "spezial", description: "Waffen-Shop Modal (Waffen + Rüstung kaufen)" },
  { id: "sanction-status", label: "Sanction Status", category: "spezial", description: "Sanktionsstatus-Overlay (Sperre, Bewährung)" },
  { id: "room-sale", label: "Room Sale Banner", category: "spezial", description: "Banner wenn ein Raum zum Verkauf steht" },
];

const CATEGORY_COLORS: Record<string, "info" | "success" | "warning" | "destructive"> = {
  alert: "destructive",
  bubble: "info",
  confirm: "warning",
  spezial: "success",
};

const CATEGORY_LABELS: Record<string, string> = {
  alert: "Alert-Dialog",
  bubble: "Bubble",
  confirm: "Confirm",
  spezial: "Spezial",
};

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════

function SectionHeader({ def }: { def: NotificationDef }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <Badge variant={CATEGORY_COLORS[def.category]} size="sm">{CATEGORY_LABELS[def.category]}</Badge>
      <span className="text-sm font-semibold text-foreground">{def.label}</span>
      <span className="text-xs text-muted-foreground ml-auto">{def.description}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ALERT PREVIEWS
// ═══════════════════════════════════════════════════════════════

function DefaultAlertPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <span className="text-sm font-semibold">Ankündigung</span>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          Willkommen auf Bahhos! Heute gibt es doppelte Credits für alle VIP-Spieler. Viel Spaß!
        </div>
        <div className="px-4 pb-3">
          <Button className="w-full" size="sm">Schließen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function MotdPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <Alert className="border-0 shadow-none rounded-none">
          <Info className="size-4 text-blue-500" />
          <AlertTitle>Nachricht des Tages</AlertTitle>
          <AlertDescription>
            <p>Herzlich willkommen bei Bahhos!</p>
            <p className="mt-1">Heute findet um 20:00 Uhr ein Event im Casino statt. Sei dabei und gewinne exklusive Preise!</p>
          </AlertDescription>
        </Alert>
        <div className="px-4 pb-3">
          <button className="text-sm text-blue-500 hover:text-blue-600 hover:underline transition-colors">
            Mehr erfahren &rarr;
          </button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function ModeratorAlertPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-red-500" />
            <span className="text-sm font-semibold">Moderator-Nachricht</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          Du wurdest verwarnt. Bitte halte dich an die Hotelregeln. Wiederholte Verstöße führen zu einem Bann.
        </div>
        <div className="px-4 pb-3">
          <Button variant="outline" className="w-full" size="sm">
            <ExternalLink className="size-3.5" /> Habbo Way lesen
          </Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function ConnectionErrorPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <Alert variant="destructive" className="border-0 shadow-none rounded-none">
          <AlertTriangle className="size-4" />
          <AlertTitle>Verbindungsfehler</AlertTitle>
          <AlertDescription>
            Die Verbindung zum Server wurde unterbrochen. (Fehlercode: 4013)
          </AlertDescription>
        </Alert>
        <div className="px-4 pb-3">
          <Button variant="destructive" className="w-full" size="sm">Schließen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function HotelClosingPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-amber-500" />
            <span className="text-sm font-semibold">Hotel schließt</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          Das Hotel schließt in Kürze und öffnet wieder um <span className="font-semibold text-foreground">06:00</span> Uhr.
        </div>
        <div className="px-4 pb-3">
          <Button className="w-full" size="sm">Verstanden</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function MaintenancePreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-orange-500" />
            <span className="text-sm font-semibold">Wartungsarbeiten</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          Das Hotel wird in <span className="font-semibold text-foreground">15 Minuten</span> für Wartungsarbeiten heruntergefahren. Geschätzte Dauer: <span className="font-semibold text-foreground">30 Minuten</span>.
        </div>
        <div className="px-4 pb-3">
          <Button className="w-full" size="sm">Verstanden</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function NitroSystemPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <CircleHelp className="size-4 text-blue-500" />
            <span className="text-sm font-semibold">Nitro</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="size-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-primary">N</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="font-semibold text-foreground">Nitro React</div>
            <div className="text-muted-foreground">Client: v2.1.0</div>
            <div className="text-muted-foreground">Renderer: v1.8.5</div>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">Discord</Button>
          <Button variant="outline" size="sm" className="flex-1">Git</Button>
          <Button variant="outline" size="sm" className="flex-1">Bug Report</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function SearchAlertPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Suchergebnisse</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input type="text" placeholder="Suchen..." className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border-0 outline-none placeholder:text-muted-foreground" readOnly />
          </div>
        </div>
        <div className="px-4 py-3 space-y-1 max-h-32 overflow-y-auto">
          {["Tropical Paradise", "Beach Club", "Habbo Mall", "Casino Royale"].map(r => (
            <div key={r} className="text-sm text-muted-foreground py-1 px-2 rounded-md hover:bg-muted cursor-pointer">{r}</div>
          ))}
        </div>
        <Separator />
        <div className="px-4 py-3">
          <Button className="w-full" size="sm">Schließen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function TradeAlertPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-amber-500" />
            <span className="text-sm font-semibold">Handel</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          Achtung: Der andere Spieler bietet keine Gegenstände an! Prüfe den Handel sorgfältig.
        </div>
        <div className="px-4 pb-3">
          <Button className="w-full" size="sm">Schließen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function UserBannedPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <Alert variant="destructive" className="border-0 shadow-none rounded-none">
          <UserX className="size-4" />
          <AlertTitle>Account gesperrt</AlertTitle>
          <AlertDescription>
            Dein Account wurde aufgrund von Regelverstößen gesperrt. Kontaktiere den Support für weitere Informationen.
          </AlertDescription>
        </Alert>
        <div className="px-4 pb-3">
          <Button variant="destructive" className="w-full" size="sm">Verstanden</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUBBLE PREVIEWS
// ═══════════════════════════════════════════════════════════════

function BubbleWrapper({ icon, iconColor, title, text }: { icon: React.ReactNode; iconColor?: string; title: string; text: string }) {
  return (
    <div className="max-w-xs">
      <Frame>
        <FramePanel className="!p-0">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className={`shrink-0 ${iconColor || "text-blue-500"}`}>{icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{title}</div>
              <div className="text-xs text-muted-foreground truncate">{text}</div>
            </div>
            <button className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}

function ClubGiftBubblePreview() {
  return (
    <div className="max-w-xs">
      <Frame>
        <FramePanel className="!p-0">
          <div className="px-3.5 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-foreground">HC-Geschenk verfügbar!</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs" className="flex-1">Geschenke anzeigen</Button>
              <button className="text-xs text-muted-foreground hover:text-foreground underline">Später</button>
            </div>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONFIRM PREVIEWS
// ═══════════════════════════════════════════════════════════════

function DefaultConfirmPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <span className="text-sm font-semibold">Bestätigung</span>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-4 text-sm text-muted-foreground text-center">
          Möchtest du wirklich dein Inventar leeren? Diese Aktion kann nicht rückgängig gemacht werden.
        </div>
        <div className="px-4 pb-3 flex gap-2">
          <Button variant="destructive" size="sm" className="flex-1">Abbrechen</Button>
          <Button size="sm" className="flex-1">Bestätigen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPECIAL PREVIEWS
// ═══════════════════════════════════════════════════════════════

function WinBroadcastPreview() {
  return (
    <div className="max-w-xs">
      <Frame>
        <FramePanel className="!p-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5">
            <Trophy className="size-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-foreground">Player123 hat einen Win erhalten!</div>
              <div className="text-[10px] text-amber-500/80 mt-0.5">Level 3</div>
            </div>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}

function ArrestToastPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-4 py-2.5 text-center">
          <div className="text-sm font-semibold text-red-500">Du wirst verhaftet!</div>
          <div className="text-xs text-muted-foreground mt-1">Grund: <span className="text-foreground">Regelverstoß im Casino</span></div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function JailTimerPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-4 py-2.5 text-center">
          <div className="text-sm text-muted-foreground">
            Du bist inhaftiert wegen: <span className="text-foreground">Regelverstoß</span>. Noch <span className="font-bold text-amber-500">04:32</span> Minuten.
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function LotteryCountdownPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-5 py-3 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Ticket className="size-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">Lotto Ziehung in 4:32</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Jackpot: <span className="text-emerald-500 font-semibold">12.450 Credits</span>
            <span className="mx-2 text-muted-foreground/50">|</span>
            8 Tickets
          </div>
          <div className="text-xs text-muted-foreground/70">:lotto buy — Jetzt Ticket kaufen! (10 Credits)</div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function LotteryResultPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-5 py-3 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="size-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">Lotto Gewinner!</span>
            <PartyPopper className="size-4 text-amber-500" />
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-amber-400 font-bold">Player123</span> hat{" "}
            <span className="text-emerald-500 font-bold">12.450 Credits</span> gewonnen!
          </div>
          <div className="text-xs text-muted-foreground/70">Nächste Ziehung: 20:00 Uhr</div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function LotteryNoWinnerPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-5 py-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Frown className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kein Gewinner heute</span>
          </div>
          <div className="text-xs text-muted-foreground/70">Niemand hat teilgenommen. Nächste Ziehung: 20:00 Uhr</div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function GymInfoPreview() {
  return (
    <Frame className="max-w-xs">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-emerald-500" />
            <span className="text-sm font-semibold">Gym</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Energie</span><span className="font-semibold text-emerald-500">75/100</span></div>
            <Progress value={75} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Gym XP</span><span className="font-semibold text-blue-500">1.250/2.000</span></div>
            <Progress value={62} className="h-1.5" />
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Stärke</div>
              <div className="text-sm font-bold text-orange-500">5/10</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ausdauer</div>
              <div className="text-sm font-bold text-blue-500">3/10</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Intellekt</div>
              <div className="text-sm font-bold text-purple-500">7/10</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/60 text-center">Stat-Punkte verfügbar: 2</div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function CombatHpPreview() {
  return (
    <div className="flex items-center gap-3 max-w-xs">
      <div className="flex-1 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-foreground">HP</span>
          <span className="text-red-500 font-semibold">65/100</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500" style={{ width: "65%" }} />
        </div>
      </div>
    </div>
  );
}

function RadioPanelPreview() {
  return (
    <Frame className="max-w-xs">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-purple-500" />
            <span className="text-sm font-semibold">Radio</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <div className="text-sm font-semibold text-foreground truncate">Starboy</div>
            <div className="text-xs text-muted-foreground">The Weeknd</div>
          </div>
          <Progress value={45} className="h-1" />
          <div className="flex items-center justify-center gap-3">
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Volume2 className="size-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Play className="size-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><SkipForward className="size-4" /></button>
          </div>
          <Separator />
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warteschlange</div>
            {["Creepin' — Metro Boomin", "Save Your Tears — The Weeknd"].map(t => (
              <div key={t} className="text-xs text-muted-foreground py-1">{t}</div>
            ))}
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function WelcomeToastPreview() {
  return (
    <Frame className="max-w-sm mx-auto">
      <FramePanel className="!p-0">
        <div className="px-5 py-2.5 text-center">
          <span className="text-sm text-muted-foreground font-medium">Willkommen zurück, <span className="text-amber-500 font-bold">Player123</span>!</span>
        </div>
      </FramePanel>
    </Frame>
  );
}

function WinRewardPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <span className="text-sm font-semibold">Event-Win erhalten!</span>
            <Badge variant="warning" size="xs">+2 weitere</Badge>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-500">Level 3</div>
            <div className="text-xs text-muted-foreground">Win von <span className="text-foreground font-medium">Admin</span></div>
            <Badge variant="info-light" size="xs" className="mt-1.5">+10% Rang-Bonus</Badge>
          </div>
          <Separator />
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Wähle eine Währung:</div>
            <div className="grid grid-cols-3 gap-2">
              {[{ emoji: "💰", amount: "5.000", label: "Credits", active: true }, { emoji: "💎", amount: "250", label: "Pixels", active: false }, { emoji: "⭐", amount: "100", label: "Punkte", active: false }].map(c => (
                <div key={c.label} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center ${c.active ? "border-amber-500/40 bg-amber-500/5" : "border-border"}`}>
                  <span>{c.emoji}</span>
                  <span className="text-xs font-bold text-foreground">{c.amount}</span>
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" size="sm">Belohnung einlösen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function GymProgressPreview() {
  return (
    <div className="flex flex-col items-center gap-1 max-w-[100px] mx-auto">
      <div className="w-full rounded-md border bg-muted/50 px-2 py-1.5 space-y-0.5">
        <Progress value={62} className="h-1.5" />
        <div className="text-[9px] font-bold text-foreground text-center">1.250/2.000 XP</div>
      </div>
      <span className="text-[10px] text-muted-foreground">(schwebt über Avatar)</span>
    </div>
  );
}

function GymShopPreview() {
  return (
    <Frame className="max-w-sm">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-emerald-500" />
            <span className="text-sm font-semibold">Energie-Shop</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>💰 <span className="font-semibold text-foreground">1.200</span> Credits</span>
            <span>⚡ <span className="font-semibold text-foreground">45</span> Energie</span>
          </div>
          {[
            { emoji: <Droplets className="size-5 text-cyan-500" />, name: "Wasser", desc: "Leichte Erfrischung", cost: "5", energy: "+10", color: "text-cyan-500" },
            { emoji: <Zap className="size-5 text-orange-500" />, name: "Energy-Drink", desc: "Starker Boost", cost: "15", energy: "+30", color: "text-orange-500" },
            { emoji: <FlaskConical className="size-5 text-emerald-500" />, name: "Protein-Shake", desc: "Maximale Energie", cost: "30", energy: "+75", color: "text-emerald-500" },
          ].map(d => (
            <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-lg border">
              {d.emoji}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">{d.desc}</div>
                <div className="text-[11px] mt-0.5"><span className="text-amber-500">💰 {d.cost}</span> <span className={`ml-2 ${d.color}`}>⚡ {d.energy}</span></div>
              </div>
              <Button size="xs" variant="outline">Kaufen</Button>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}

function CombatShopPreview() {
  return (
    <Frame className="max-w-sm">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-red-500" />
            <span className="text-sm font-semibold">Waffen-Shop</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 space-y-2">
          {[
            { name: "Schläger", desc: "Basis-Waffe", dmg: 10, cost: 50, color: "text-orange-500", equipped: true },
            { name: "Axt", desc: "Mittlere Waffe", dmg: 25, cost: 150, color: "text-red-500", equipped: false },
            { name: "Schwert", desc: "Stärkste Waffe", dmg: 50, cost: 300, color: "text-purple-500", equipped: false },
          ].map(w => (
            <div key={w.name} className={`flex items-center gap-3 p-2.5 rounded-lg border ${w.equipped ? "border-emerald-500/30" : ""}`}>
              <Swords className={`size-5 ${w.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{w.name}</span>
                  {w.equipped && <Badge variant="success" size="xs">Ausgerüstet</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground">{w.desc}</div>
                <div className="text-[11px] mt-0.5"><span className="text-red-500">⚔️ {w.dmg} Schaden</span> <span className="text-amber-500 ml-2">💰 {w.cost}</span></div>
              </div>
              <Button size="xs" variant={w.equipped ? "secondary" : "outline"}>{w.equipped ? "✓" : "Kaufen"}</Button>
            </div>
          ))}
          <Separator />
          <div className="flex items-center gap-3 p-2.5 rounded-lg border">
            <Shield className="size-5 text-cyan-500 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Rüstung</div>
              <div className="text-[11px] text-muted-foreground">Reduziert eingehenden Schaden</div>
              <div className="text-[11px] mt-0.5"><span className="text-cyan-500">🛡️ -30% Schaden</span> <span className="text-amber-500 ml-2">💰 150</span></div>
            </div>
            <Button size="xs" variant="outline">Kaufen</Button>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function SanctionStatusPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <ShieldBan className="size-4 text-red-500" />
            <span className="text-sm font-semibold">Sanktionsstatus</span>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="size-3.5" /></button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <Alert variant="destructive" className="border-0 shadow-none p-0!">
            <AlertTriangle className="size-4" />
            <AlertTitle>Aktive Sanktion</AlertTitle>
            <AlertDescription>Du wurdest für 24 Stunden stummgeschaltet wegen: Beleidigung</AlertDescription>
          </Alert>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><Timer className="size-3.5" /> Bewährungszeit</span>
              <span className="font-semibold text-amber-500">72 Stunden verbleibend</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><Lock className="size-3.5" /> Nächste Strafe</span>
              <span className="font-semibold text-red-500">Bann (48h)</span>
            </div>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function RoomSaleBannerPreview() {
  return (
    <Frame className="max-w-sm">
      <FramePanel className="!p-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Home className="size-5 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Dieser Raum steht zum Verkauf!</div>
            <div className="text-xs text-muted-foreground">Besitzer: <span className="text-foreground">Player123</span> — <span className="text-emerald-500 font-semibold">500 Credits</span></div>
            <div className="text-[11px] text-muted-foreground mt-0.5">42 Möbel, 2 Bots, 1 Pet</div>
          </div>
          <Button size="xs">Kaufen</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════
// RENDER MAP
// ═══════════════════════════════════════════════════════════════

const ALERT_PREVIEWS: Record<string, () => React.ReactNode> = {
  "default-alert": () => <DefaultAlertPreview />,
  "motd": () => <MotdPreview />,
  "moderator-alert": () => <ModeratorAlertPreview />,
  "connection-error": () => <ConnectionErrorPreview />,
  "hotel-closing": () => <HotelClosingPreview />,
  "maintenance": () => <MaintenancePreview />,
  "nitro-system": () => <NitroSystemPreview />,
  "search-alert": () => <SearchAlertPreview />,
  "trade-alert": () => <TradeAlertPreview />,
  "user-banned": () => <UserBannedPreview />,
};

const BUBBLE_PREVIEWS: Record<string, () => React.ReactNode> = {
  "friend-online": () => <BubbleWrapper icon={<Users className="size-4" />} iconColor="text-emerald-500" title="Freund online" text="Player123 ist jetzt online" />,
  "friend-offline": () => <BubbleWrapper icon={<UserMinus className="size-4" />} iconColor="text-gray-400" title="Freund offline" text="Player123 ist offline gegangen" />,
  "achievement": () => <BubbleWrapper icon={<Award className="size-4" />} iconColor="text-amber-500" title="Achievement freigeschaltet!" text="True Habbo — Stufe 5 erreicht" />,
  "badge-received": () => <BubbleWrapper icon={<BadgeCheck className="size-4" />} iconColor="text-blue-500" title="Neues Badge!" text="Beta-Tester Badge erhalten" />,
  "respect-received": () => <BubbleWrapper icon={<Heart className="size-4" />} iconColor="text-pink-500" title="Respekt erhalten" text="Du hast jetzt 42 Respektpunkte" />,
  "pet-level": () => <BubbleWrapper icon={<PawPrint className="size-4" />} iconColor="text-emerald-500" title="Pet Level Up!" text="Fluffy ist jetzt Level 5" />,
  "pet-received": () => <BubbleWrapper icon={<PawPrint className="size-4" />} iconColor="text-amber-500" title="Neues Haustier!" text="Du hast ein Haustier erhalten" />,
  "club-gift": () => <ClubGiftBubblePreview />,
  "buy-furni": () => <BubbleWrapper icon={<ShoppingBag className="size-4" />} iconColor="text-emerald-500" title="Möbel gekauft" text="Throne erfolgreich erworben" />,
  "info-generic": () => <BubbleWrapper icon={<Info className="size-4" />} iconColor="text-blue-500" title="Information" text="Dies ist eine generische Info-Benachrichtigung" />,
  "loyalty-points": () => <BubbleWrapper icon={<Gem className="size-4" />} iconColor="text-purple-500" title="Treuepunkte" text="Du hast 50 Treuepunkte erhalten!" />,
  "mod-disclaimer": () => <BubbleWrapper icon={<MessageSquare className="size-4" />} iconColor="text-muted-foreground" title="Hinweis" text="Alle Chats werden protokolliert" />,
  "vip-bubble": () => <BubbleWrapper icon={<Crown className="size-4" />} iconColor="text-amber-500" title="VIP" text="VIP-Status aktiviert" />,
  "soundmachine": () => <BubbleWrapper icon={<Music className="size-4" />} iconColor="text-purple-500" title="Soundmachine" text="Soundmachine wird abgespielt" />,
  "recycler-ok": () => <BubbleWrapper icon={<Recycle className="size-4" />} iconColor="text-emerald-500" title="Recycling abgeschlossen" text="Dein Item wurde recycled" />,
  "room-messages": () => <BubbleWrapper icon={<MessageCircle className="size-4" />} iconColor="text-blue-500" title="Raum-Nachrichten" text="3 neue Nachrichten in deinem Raum" />,
};

const CONFIRM_PREVIEWS: Record<string, () => React.ReactNode> = {
  "default-confirm": () => <DefaultConfirmPreview />,
};

const SPECIAL_PREVIEWS: Record<string, () => React.ReactNode> = {
  "win-broadcast": () => <WinBroadcastPreview />,
  "arrest-toast": () => <ArrestToastPreview />,
  "jail-timer": () => <JailTimerPreview />,
  "lottery-countdown": () => <LotteryCountdownPreview />,
  "lottery-result": () => <LotteryResultPreview />,
  "lottery-no-winner": () => <LotteryNoWinnerPreview />,
  "gym-info": () => <GymInfoPreview />,
  "combat-hp": () => <CombatHpPreview />,
  "radio-panel": () => <RadioPanelPreview />,
  "welcome-toast": () => <WelcomeToastPreview />,
  "win-reward": () => <WinRewardPreview />,
  "gym-progress": () => <GymProgressPreview />,
  "gym-shop": () => <GymShopPreview />,
  "combat-shop": () => <CombatShopPreview />,
  "sanction-status": () => <SanctionStatusPreview />,
  "room-sale": () => <RoomSaleBannerPreview />,
};

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

function NotificationSection({ items, previews }: { items: NotificationDef[]; previews: Record<string, () => React.ReactNode> }) {
  return (
    <div className="space-y-6">
      {items.map((def) => (
        <div key={def.id}>
          <SectionHeader def={def} />
          <div className="pl-1">
            {previews[def.id]?.()}
          </div>
        </div>
      ))}
    </div>
  );
}

import { FC } from 'react';

export const NotificationsV2View: FC<{}> = () => {
  const totalCount = ALERT_NOTIFICATIONS.length + BUBBLE_NOTIFICATIONS.length + CONFIRM_NOTIFICATIONS.length + SPECIAL_NOTIFICATIONS.length;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications & Alerts Prototypen</h1>
        <p className="text-muted-foreground mt-1">
          Alle {totalCount} Notification-Typen im Überblick — Enterprise reUI Redesign
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="destructive" size="lg">{ALERT_NOTIFICATIONS.length} Alerts</Badge>
        <Badge variant="info" size="lg">{BUBBLE_NOTIFICATIONS.length} Bubbles</Badge>
        <Badge variant="warning" size="lg">{CONFIRM_NOTIFICATIONS.length} Confirms</Badge>
        <Badge variant="success" size="lg">{SPECIAL_NOTIFICATIONS.length} Spezial</Badge>
      </div>

      <Separator />

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Alerts ({ALERT_NOTIFICATIONS.length})</TabsTrigger>
          <TabsTrigger value="bubbles">Bubbles ({BUBBLE_NOTIFICATIONS.length})</TabsTrigger>
          <TabsTrigger value="confirms">Confirms ({CONFIRM_NOTIFICATIONS.length})</TabsTrigger>
          <TabsTrigger value="spezial">Spezial ({SPECIAL_NOTIFICATIONS.length})</TabsTrigger>
          <TabsTrigger value="alle">Alle ({totalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6">
          <NotificationSection items={ALERT_NOTIFICATIONS} previews={ALERT_PREVIEWS} />
        </TabsContent>

        <TabsContent value="bubbles" className="mt-6">
          <NotificationSection items={BUBBLE_NOTIFICATIONS} previews={BUBBLE_PREVIEWS} />
        </TabsContent>

        <TabsContent value="confirms" className="mt-6">
          <NotificationSection items={CONFIRM_NOTIFICATIONS} previews={CONFIRM_PREVIEWS} />
        </TabsContent>

        <TabsContent value="spezial" className="mt-6">
          <NotificationSection items={SPECIAL_NOTIFICATIONS} previews={SPECIAL_PREVIEWS} />
        </TabsContent>

        <TabsContent value="alle" className="mt-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Megaphone className="size-5 text-red-500" /> Alert-Dialoge
              </h2>
              <NotificationSection items={ALERT_NOTIFICATIONS} previews={ALERT_PREVIEWS} />
            </div>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="size-5 text-blue-500" /> Bubble-Notifications
              </h2>
              <NotificationSection items={BUBBLE_NOTIFICATIONS} previews={BUBBLE_PREVIEWS} />
            </div>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="size-5 text-amber-500" /> Confirm-Dialoge
              </h2>
              <NotificationSection items={CONFIRM_NOTIFICATIONS} previews={CONFIRM_PREVIEWS} />
            </div>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Swords className="size-5 text-emerald-500" /> Spezial-Notifications
              </h2>
              <NotificationSection items={SPECIAL_NOTIFICATIONS} previews={SPECIAL_PREVIEWS} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
