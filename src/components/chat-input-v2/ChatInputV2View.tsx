
import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Package,
  Search,
  Smile,
  Zap,
  Palette,
  Layers,
} from "lucide-react";

const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL ?? "http://localhost:8080";

function getFurniIcon(cn: string) {
  return `${ASSETS_URL}/c_images/${cn.split("*")[0]}_icon.png`;
}

function getAvatarHead(figure: string) {
  return `https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&headonly=1&size=s&direction=2`;
}

// ─── Command Parameter Types ────────────────────

interface CommandParam {
  name: string;
  type: "user" | "number" | "text" | "id";
}

interface ChatCommand {
  command: string;
  description: string;
  minRank: number;
  category: string;
  params?: CommandParam[];
}

const DEMO_COMMANDS: ChatCommand[] = [
  { command: ":shake", description: "Raum schütteln", minRank: 0, category: "Client" },
  { command: ":rotate", description: "Raum drehen", minRank: 0, category: "Client" },
  { command: ":flip", description: "Raum spiegeln", minRank: 0, category: "Client" },
  { command: ":zoom", description: "Zoom-Level setzen", minRank: 0, category: "Client", params: [{ name: "level", type: "number" }] },
  { command: ":screenshot", description: "Screenshot erstellen", minRank: 0, category: "Client" },
  { command: ":togglefps", description: "FPS-Anzeige umschalten", minRank: 0, category: "Client" },
  { command: ":jump", description: "Springen", minRank: 0, category: "Client" },
  { command: ":idle", description: "AFK gehen", minRank: 0, category: "Client" },
  { command: ":sign", description: "Schild zeigen", minRank: 0, category: "Client", params: [{ name: "nummer", type: "number" }] },
  { command: ":d", description: "Lach-Ausdruck", minRank: 0, category: "Client" },
  { command: ":sit", description: "Hinsetzen", minRank: 0, category: "Allgemein" },
  { command: ":stand", description: "Aufstehen", minRank: 0, category: "Allgemein" },
  { command: ":lay", description: "Hinlegen", minRank: 0, category: "Allgemein" },
  { command: ":kiss", description: "User küssen", minRank: 0, category: "Allgemein", params: [{ name: "username", type: "user" }] },
  { command: ":hug", description: "User umarmen", minRank: 0, category: "Allgemein", params: [{ name: "username", type: "user" }] },
  { command: ":hit", description: "User hauen", minRank: 0, category: "Allgemein", params: [{ name: "username", type: "user" }] },
  { command: ":sets", description: "SET-Counter anzeigen", minRank: 0, category: "Allgemein" },
  { command: ":sets complete", description: "Set einfügen", minRank: 0, category: "Allgemein", params: [{ name: "id", type: "id" }] },
  { command: ":lotto", description: "Lotto-Info anzeigen", minRank: 0, category: "Allgemein" },
  { command: ":lotto buy", description: "Tickets kaufen", minRank: 0, category: "Allgemein", params: [{ name: "anzahl", type: "number" }] },
  { command: ":send", description: "Währung senden", minRank: 0, category: "Allgemein", params: [{ name: "username", type: "user" }, { name: "typ", type: "text" }, { name: "anzahl", type: "number" }] },
  { command: ":rel", description: "Top-Beziehungen anzeigen", minRank: 0, category: "Allgemein" },
  { command: ":empty", description: "Inventar leeren", minRank: 0, category: "Allgemein" },
  { command: ":commands", description: "Alle Commands anzeigen", minRank: 0, category: "Allgemein" },
  { command: ":redeem", description: "Möbel eintauschen", minRank: 0, category: "Allgemein" },
  { command: ":companion", description: "Begleiter-Pet Status", minRank: 0, category: "Allgemein" },
  { command: ":companion activate", description: "Pet als Begleiter aktivieren", minRank: 0, category: "Allgemein", params: [{ name: "petname", type: "text" }] },
  { command: ":voice on", description: "Sprachchat aktivieren", minRank: 0, category: "Allgemein" },
  { command: ":voice off", description: "Sprachchat deaktivieren", minRank: 0, category: "Allgemein" },
  { command: ":mimic", description: "Look kopieren", minRank: 3, category: "VIP", params: [{ name: "username", type: "user" }] },
  { command: ":moonwalk", description: "Moonwalk an/aus", minRank: 3, category: "VIP" },
  { command: ":pickall", description: "Alle Möbel einpacken", minRank: 3, category: "VIP" },
  { command: ":ejectall", description: "Alle Möbel rauswerfen", minRank: 3, category: "VIP" },
  { command: ":stalk", description: "User folgen", minRank: 3, category: "VIP", params: [{ name: "username", type: "user" }] },
  { command: ":alert", description: "User benachrichtigen", minRank: 14, category: "Moderator", params: [{ name: "username", type: "user" }, { name: "nachricht", type: "text" }] },
  { command: ":mute", description: "User stummschalten", minRank: 14, category: "Moderator", params: [{ name: "username", type: "user" }] },
  { command: ":unmute", description: "User entstummen", minRank: 14, category: "Moderator", params: [{ name: "username", type: "user" }] },
  { command: ":kick", description: "Alle aus Raum kicken", minRank: 14, category: "Moderator" },
  { command: ":teleport", description: "Teleport an/aus", minRank: 14, category: "Moderator" },
  { command: ":fastwalk", description: "Schnell laufen", minRank: 14, category: "Moderator" },
  { command: ":hidewired", description: "Wired verstecken", minRank: 14, category: "Moderator" },
  { command: ":coords", description: "Koordinaten anzeigen", minRank: 14, category: "Moderator" },
  { command: ":enable", description: "Effekt aktivieren", minRank: 14, category: "Moderator", params: [{ name: "effekt-id", type: "id" }] },
  { command: ":chatcolor", description: "Chat-Farbe setzen", minRank: 14, category: "Moderator", params: [{ name: "farbe", type: "text" }] },
  { command: ":jail", description: "Spieler verhaften", minRank: 14, category: "Moderator", params: [{ name: "username", type: "user" }, { name: "minuten", type: "number" }] },
  { command: ":radio", description: "Radio-Hilfe anzeigen", minRank: 14, category: "Moderator" },
  { command: ":radio play", description: "Radio starten", minRank: 14, category: "Moderator" },
  { command: ":radio skip", description: "Track überspringen", minRank: 14, category: "Moderator" },
  { command: ":radio tts", description: "TTS-Durchsage generieren", minRank: 14, category: "Moderator", params: [{ name: "text", type: "text" }] },
  { command: ":ban", description: "User bannen", minRank: 15, category: "Admin", params: [{ name: "username", type: "user" }, { name: "dauer", type: "text" }] },
  { command: ":unban", description: "User entbannen", minRank: 15, category: "Admin", params: [{ name: "username", type: "user" }] },
  { command: ":credits", description: "Credits geben", minRank: 15, category: "Admin", params: [{ name: "username", type: "user" }, { name: "anzahl", type: "number" }] },
  { command: ":ha", description: "Hotel-Alert senden", minRank: 15, category: "Admin", params: [{ name: "nachricht", type: "text" }] },
  { command: ":badge", description: "Badge geben", minRank: 15, category: "Admin", params: [{ name: "username", type: "user" }, { name: "badge-code", type: "text" }] },
  { command: ":givefurni", description: "Möbel vergeben", minRank: 15, category: "Admin", params: [{ name: "username", type: "user" }, { name: "id", type: "id" }, { name: "anzahl", type: "number" }] },
  { command: ":update_catalogue", description: "Katalog neu laden", minRank: 15, category: "Admin" },
  { command: ":update_items", description: "Items neu laden", minRank: 15, category: "Admin" },
  { command: ":shutdown", description: "Hotel herunterfahren", minRank: 18, category: "Super-Admin" },
  { command: ":masscredits", description: "Credits an alle User", minRank: 18, category: "Super-Admin", params: [{ name: "anzahl", type: "number" }] },
  { command: ":massbadge", description: "Badge an alle User", minRank: 18, category: "Super-Admin", params: [{ name: "badge-code", type: "text" }] },
  { command: ":giverank", description: "Rang vergeben", minRank: 19, category: "Root", params: [{ name: "username", type: "user" }, { name: "rang", type: "number" }] },
  { command: ":update_permissions", description: "Permissions neu laden", minRank: 19, category: "Root" },
];

const RANK_BADGE: Record<string, { label: string; color: string }> = {
  VIP: { label: "VIP", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  Moderator: { label: "MOD", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  Admin: { label: "ADMIN", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  "Super-Admin": { label: "S-ADMIN", color: "bg-red-500/15 text-red-400 border-red-500/25" },
  Root: { label: "ROOT", color: "bg-red-600/15 text-red-300 border-red-500/25" },
};

// ─── Demo Users (for username autocomplete) ─────

interface DemoUser {
  name: string;
  figure: string;
}

const DEMO_USERS: DemoUser[] = [
  { name: "Robby", figure: "hr-3322-45.hd-180-1.ch-3135-92.lg-3116-82-1408.sh-3115-92" },
  { name: "Sarah", figure: "hr-515-45.hd-600-1.ch-665-92.lg-700-82.sh-725-92" },
  { name: "MaxPower", figure: "hr-893-45.hd-180-3.ch-3030-92.lg-285-82.sh-290-92" },
  { name: "Luna", figure: "hr-545-45.hd-605-1.ch-660-92.lg-710-82.sh-735-92" },
  { name: "DarkKnight", figure: "hr-165-45.hd-190-10.ch-255-92.lg-275-82.sh-295-92" },
  { name: "xXNinaXx", figure: "hr-525-45.hd-620-1.ch-670-92.lg-715-82.sh-740-92" },
  { name: "Kevin2010", figure: "hr-100-45.hd-185-3.ch-210-92.lg-270-82.sh-300-92" },
  { name: "Butterfly", figure: "hr-535-45.hd-610-1.ch-655-92.lg-705-82.sh-730-92" },
  { name: "Admin", figure: "hr-3090-45.hd-180-1.ch-3110-92.lg-3116-82.sh-3115-92" },
  { name: "TestUser", figure: "hr-115-45.hd-195-3.ch-220-92.lg-280-82.sh-305-92" },
];

// ─── Demo Emoji Data ────────────────────────────

interface EmojiCategory { id: string; label: string; icon: string; }
interface Emoji { shortcode: string; display: string; category: string; }

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: "recent", label: "Zuletzt", icon: "🕐" },
  { id: "smileys", label: "Smileys", icon: "😊" },
  { id: "gestures", label: "Gesten", icon: "👋" },
  { id: "hearts", label: "Herzen", icon: "❤️" },
  { id: "objects", label: "Objekte", icon: "🎮" },
  { id: "animals", label: "Tiere", icon: "🐱" },
];

const DEMO_EMOJIS: Emoji[] = [
  { shortcode: "smile", display: "😊", category: "smileys" },
  { shortcode: "laugh", display: "😂", category: "smileys" },
  { shortcode: "wink", display: "😉", category: "smileys" },
  { shortcode: "cool", display: "😎", category: "smileys" },
  { shortcode: "love_eyes", display: "😍", category: "smileys" },
  { shortcode: "thinking", display: "🤔", category: "smileys" },
  { shortcode: "cry", display: "😢", category: "smileys" },
  { shortcode: "angry", display: "😡", category: "smileys" },
  { shortcode: "surprised", display: "😮", category: "smileys" },
  { shortcode: "party", display: "🥳", category: "smileys" },
  { shortcode: "halo", display: "😇", category: "smileys" },
  { shortcode: "devil", display: "😈", category: "smileys" },
  { shortcode: "sleeping", display: "😴", category: "smileys" },
  { shortcode: "star_eyes", display: "🤩", category: "smileys" },
  { shortcode: "shush", display: "🤫", category: "smileys" },
  { shortcode: "nerd", display: "🤓", category: "smileys" },
  { shortcode: "wave", display: "👋", category: "gestures" },
  { shortcode: "thumbsup", display: "👍", category: "gestures" },
  { shortcode: "thumbsdown", display: "👎", category: "gestures" },
  { shortcode: "clap", display: "👏", category: "gestures" },
  { shortcode: "pray", display: "🙏", category: "gestures" },
  { shortcode: "peace", display: "✌️", category: "gestures" },
  { shortcode: "muscle", display: "💪", category: "gestures" },
  { shortcode: "ok", display: "👌", category: "gestures" },
  { shortcode: "heart", display: "❤️", category: "hearts" },
  { shortcode: "broken_heart", display: "💔", category: "hearts" },
  { shortcode: "sparkle_heart", display: "💖", category: "hearts" },
  { shortcode: "blue_heart", display: "💙", category: "hearts" },
  { shortcode: "green_heart", display: "💚", category: "hearts" },
  { shortcode: "fire_heart", display: "❤️‍🔥", category: "hearts" },
  { shortcode: "controller", display: "🎮", category: "objects" },
  { shortcode: "trophy", display: "🏆", category: "objects" },
  { shortcode: "dice", display: "🎲", category: "objects" },
  { shortcode: "crown", display: "👑", category: "objects" },
  { shortcode: "gem", display: "💎", category: "objects" },
  { shortcode: "fire", display: "🔥", category: "objects" },
  { shortcode: "cat", display: "🐱", category: "animals" },
  { shortcode: "dog", display: "🐶", category: "animals" },
  { shortcode: "bear", display: "🐻", category: "animals" },
  { shortcode: "unicorn", display: "🦄", category: "animals" },
  { shortcode: "penguin", display: "🐧", category: "animals" },
  { shortcode: "butterfly", display: "🦋", category: "animals" },
];

// ─── Chat Bubble Styles ─────────────────────────

interface ChatBubbleStyle { id: number; name: string; image: string; }

const BUBBLE_STYLES: ChatBubbleStyle[] = [
  { id: 0, name: "Standard", image: "/chatbubbles/bubble_0.png" },
  { id: 1, name: "Rot / Alert", image: "/chatbubbles/bubble_1.png" },
  { id: 2, name: "Blau / Flüstern", image: "/chatbubbles/bubble_2.png" },
  { id: 3, name: "Grün", image: "/chatbubbles/bubble_3.png" },
  { id: 4, name: "Totenkopf", image: "/chatbubbles/bubble_4.png" },
  { id: 5, name: "Pink", image: "/chatbubbles/bubble_5.png" },
  { id: 6, name: "Dunkelblau", image: "/chatbubbles/bubble_6.png" },
  { id: 7, name: "Schwarz", image: "/chatbubbles/bubble_7.png" },
  { id: 8, name: "Stern", image: "/chatbubbles/bubble_8.png" },
  { id: 9, name: "Herz", image: "/chatbubbles/bubble_9.png" },
  { id: 10, name: "Smiley", image: "/chatbubbles/bubble_10.png" },
  { id: 11, name: "Gelb", image: "/chatbubbles/bubble_11.png" },
  { id: 12, name: "HC Pink", image: "/chatbubbles/bubble_12.png" },
  { id: 13, name: "Eisig", image: "/chatbubbles/bubble_13.png" },
  { id: 14, name: "Admin", image: "/chatbubbles/bubble_14.png" },
  { id: 15, name: "Ambassador", image: "/chatbubbles/bubble_15.png" },
  { id: 16, name: "Pirat", image: "/chatbubbles/bubble_16.png" },
  { id: 17, name: "Neon Grün", image: "/chatbubbles/bubble_17.png" },
  { id: 18, name: "Neon Blau", image: "/chatbubbles/bubble_18.png" },
  { id: 19, name: "Neon Pink", image: "/chatbubbles/bubble_19.png" },
  { id: 20, name: "Neon Gelb", image: "/chatbubbles/bubble_20.png" },
  { id: 21, name: "Neon Cyan", image: "/chatbubbles/bubble_21.png" },
  { id: 22, name: "Neon Rot", image: "/chatbubbles/bubble_22.png" },
  { id: 23, name: "Bot", image: "/chatbubbles/bubble_23.png" },
  { id: 24, name: "Arcade", image: "/chatbubbles/bubble_24.png" },
  { id: 25, name: "Space", image: "/chatbubbles/bubble_25.png" },
  { id: 26, name: "Halloween", image: "/chatbubbles/bubble_26.png" },
  { id: 27, name: "Weihnachten", image: "/chatbubbles/bubble_27.png" },
  { id: 28, name: "Valentinstag", image: "/chatbubbles/bubble_28.png" },
  { id: 29, name: "Ostern", image: "/chatbubbles/bubble_29.png" },
  { id: 30, name: "Retro", image: "/chatbubbles/bubble_30.png" },
  { id: 32, name: "Regenbogen", image: "/chatbubbles/bubble_32.png" },
  { id: 33, name: "Blitz", image: "/chatbubbles/bubble_33_34.png" },
  { id: 34, name: "Flamme", image: "/chatbubbles/bubble_33_34.png" },
  { id: 35, name: "Diamant", image: "/chatbubbles/bubble_35.png" },
  { id: 36, name: "Musik", image: "/chatbubbles/bubble_36.png" },
  { id: 37, name: "Krone", image: "/chatbubbles/bubble_35.png" },
  { id: 38, name: "Galaxy", image: "/chatbubbles/bubble_38.png" },
];

// ─── Demo Hotbar ────────────────────────────────

interface HotbarSlot { item_base_id: number | null; public_name: string | null; classname: string | null; count: number; }

const DEMO_HOTBAR: HotbarSlot[] = [
  { item_base_id: 103, public_name: "Norja Tisch", classname: "table_norja_med*2", count: 5 },
  { item_base_id: 117, public_name: "Roller", classname: "roller_basic", count: 20 },
  { item_base_id: 108, public_name: "Teleporter", classname: "teleport_door", count: 4 },
  { item_base_id: 105, public_name: "Würfel", classname: "dice_master", count: 2 },
  { item_base_id: null, public_name: null, classname: null, count: 0 },
  { item_base_id: null, public_name: null, classname: null, count: 0 },
  { item_base_id: null, public_name: null, classname: null, count: 0 },
  { item_base_id: null, public_name: null, classname: null, count: 0 },
  { item_base_id: null, public_name: null, classname: null, count: 0 },
];

// ─── Helpers: Parse active command + current param

function parseCommandState(input: string): {
  matchedCommand: ChatCommand | null;
  filledParams: string[];
  currentParamIndex: number;
  currentParamValue: string;
} {
  if (!input.startsWith(":")) return { matchedCommand: null, filledParams: [], currentParamIndex: -1, currentParamValue: "" };

  const sortedCommands = [...DEMO_COMMANDS].sort((a, b) => b.command.length - a.command.length);
  for (const cmd of sortedCommands) {
    if (input.toLowerCase().startsWith(cmd.command.toLowerCase() + " ") || input.toLowerCase() === cmd.command.toLowerCase()) {
      const rest = input.slice(cmd.command.length).trimStart();
      const parts = rest ? rest.split(/\s+/) : [];
      const paramCount = cmd.params?.length ?? 0;
      const filledParams = parts.slice(0, paramCount);
      const currentParamIndex = Math.min(filledParams.length, paramCount - 1);
      const currentParamValue = parts[filledParams.length - 1] ?? "";
      const isCompleteLastParam = filledParams.length > 0 && rest.endsWith(" ");

      return {
        matchedCommand: cmd,
        filledParams,
        currentParamIndex: isCompleteLastParam ? Math.min(filledParams.length, paramCount - 1) : Math.max(0, filledParams.length - 1),
        currentParamValue: isCompleteLastParam ? "" : (parts[parts.length - 1] ?? ""),
      };
    }
  }
  return { matchedCommand: null, filledParams: [], currentParamIndex: -1, currentParamValue: "" };
}

function getGhostText(input: string): string {
  const { matchedCommand, filledParams } = parseCommandState(input);
  if (!matchedCommand?.params) return "";
  const rest = input.slice(matchedCommand.command.length);
  const parts = rest.trim() ? rest.trim().split(/\s+/) : [];
  const completedCount = rest.endsWith(" ") ? parts.length : Math.max(0, parts.length - 1);
  const remaining = matchedCommand.params.slice(completedCount);
  if (remaining.length === 0) return "";
  return remaining.map(p => `[${p.name}]`).join(" ");
}

function shouldShowUserAutocomplete(input: string): { show: boolean; filter: string } {
  const { matchedCommand, currentParamIndex, currentParamValue, filledParams } = parseCommandState(input);
  if (!matchedCommand?.params) return { show: false, filter: "" };
  const param = matchedCommand.params[currentParamIndex];
  if (!param || param.type !== "user") return { show: false, filter: "" };
  const rest = input.slice(matchedCommand.command.length);
  if (!rest.startsWith(" ")) return { show: false, filter: "" };
  if (currentParamValue === "" && filledParams.length > currentParamIndex) return { show: false, filter: "" };
  return { show: true, filter: currentParamValue };
}

// ─── Emoji Picker ───────────────────────────────

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (search) return DEMO_EMOJIS.filter(e => e.shortcode.includes(search.toLowerCase()));
    return DEMO_EMOJIS.filter(e => e.category === activeCategory);
  }, [activeCategory, search]);

  return (
    <div className="w-[280px]">
      <div className="p-2 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-7 text-xs" />
        </div>
      </div>
      {!search && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/20">
          {EMOJI_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${activeCategory === cat.id ? "bg-primary/10" : "hover:bg-accent/50"}`}
              title={cat.label}>{cat.icon}</button>
          ))}
        </div>
      )}
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-8 gap-0.5 p-2">
          {filtered.map(emoji => (
            <button key={emoji.shortcode} onClick={() => onSelect(`:${emoji.shortcode}:`)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-lg hover:bg-accent/50 transition-colors"
              title={`:${emoji.shortcode}:`}>{emoji.display}</button>
          ))}
          {filtered.length === 0 && <div className="col-span-8 flex items-center justify-center py-8 text-xs text-muted-foreground/50">Keine Emojis gefunden</div>}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Style Selector (Popover with bubble PNGs) ──

function StyleSelectorPopover({ activeStyle, onSelect }: { activeStyle: number; onSelect: (id: number) => void }) {
  return (
    <div className="w-[440px]">
      <div className="px-3 pt-3 pb-1.5">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Chat-Style</span>
      </div>
      <ScrollArea className="max-h-[260px]">
        <div className="grid grid-cols-6 gap-1.5 px-3 pt-1 pb-4">
          {BUBBLE_STYLES.map(style => (
            <TooltipProvider key={style.id} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => onSelect(style.id)}
                    className={`relative flex items-center justify-center h-[30px] rounded-lg border-2 transition-all overflow-hidden
                      ${activeStyle === style.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/20 hover:border-border/50 bg-muted/5 hover:bg-accent/20"}`}>
                    <img src={style.image} alt={style.name} className="h-[22px] w-auto object-contain" style={{ imageRendering: "pixelated" }}
                      onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                    {activeStyle === style.id && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-tl-md flex items-center justify-center">
                        <span className="text-[7px] text-white font-bold">✓</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  <span className="text-[11px]">#{style.id} · {style.name}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Command Autocomplete ───────────────────────

function CommandAutocomplete({
  filter, onSelect, selectedIndex, itemCount,
}: {
  filter: string; onSelect: (cmd: string) => void; selectedIndex: number; itemCount: (n: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return DEMO_COMMANDS.filter(cmd => cmd.command.includes(q) || cmd.description.toLowerCase().includes(q));
  }, [filter]);

  useEffect(() => { itemCount(filtered.length); }, [filtered.length, itemCount]);
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selectedIndex]);

  if (filtered.length === 0) return null;
  let lastCategory = "";
  let flatIndex = -1;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden">
      <ScrollArea className="max-h-[280px]">
        {filtered.map(cmd => {
          const showHeader = cmd.category !== lastCategory;
          lastCategory = cmd.category;
          flatIndex++;
          const isSelected = flatIndex === selectedIndex;
          const rankBadge = RANK_BADGE[cmd.category];
          return (
            <Fragment key={cmd.command}>
              {showHeader && (
                <div className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 bg-muted/40 backdrop-blur-sm border-b border-border/15">
                  {cmd.category}
                </div>
              )}
              <button ref={isSelected ? selectedRef : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                  ${isSelected ? "bg-primary/10 text-foreground" : "hover:bg-accent/40 text-foreground/80"}`}
                onMouseDown={e => { e.preventDefault(); onSelect(cmd.command + " "); }}>
                <span className={`text-[13px] font-mono font-semibold shrink-0 ${isSelected ? "text-primary" : "text-primary/60"}`}>{cmd.command}</span>
                <span className="text-[12px] text-muted-foreground truncate flex-1">{cmd.description}</span>
                {cmd.params && cmd.params.length > 0 && (
                  <span className="text-[9px] text-muted-foreground/30 shrink-0 font-mono">
                    {cmd.params.map(p => `[${p.name}]`).join(" ")}
                  </span>
                )}
                {rankBadge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${rankBadge.color}`}>{rankBadge.label}</span>}
                {isSelected && <span className="text-[9px] text-muted-foreground/40 shrink-0">↵</span>}
              </button>
            </Fragment>
          );
        })}
      </ScrollArea>
    </div>
  );
}

// ─── Username Autocomplete ──────────────────────

function UserAutocomplete({
  filter, onSelect, selectedIndex, onItemCount,
}: {
  filter: string; onSelect: (name: string) => void; selectedIndex: number; onItemCount: (n: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => {
    if (!filter) return DEMO_USERS;
    const q = filter.toLowerCase();
    return DEMO_USERS.filter(u => u.name.toLowerCase().includes(q));
  }, [filter]);

  useEffect(() => { onItemCount(filtered.length); }, [filtered.length, onItemCount]);
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 rounded-xl border border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden w-[220px]">
      <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 border-b border-border/15">
        Spieler
      </div>
      <ScrollArea className="max-h-[200px]">
        {filtered.map((user, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button key={user.name} ref={isSelected ? selectedRef : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors
                ${isSelected ? "bg-primary/10 text-foreground" : "hover:bg-accent/40 text-foreground/80"}`}
              onMouseDown={e => { e.preventDefault(); onSelect(user.name); }}>
              <img src={getAvatarHead(user.figure)} alt={user.name}
                className="w-[30px] h-[30px] object-contain shrink-0" style={{ imageRendering: "pixelated" }}
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
              <span className="text-[13px] font-semibold">{user.name}</span>
              {isSelected && <span className="text-[9px] text-muted-foreground/40 shrink-0 ml-auto">↵</span>}
            </button>
          );
        })}
      </ScrollArea>
    </div>
  );
}

// ─── Hotbar ─────────────────────────────────────

function HotbarBar({ slots }: { slots: HotbarSlot[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {slots.map((slot, i) => {
        const filled = slot.item_base_id !== null;
        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`relative w-11 h-11 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-150
                  ${filled ? hovered === i ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/50 bg-card/80" : "border-dashed border-border/30 bg-muted/10"}`}
                  onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                  <span className="absolute top-0.5 left-1 text-[8px] font-semibold text-muted-foreground/30">{i + 1}</span>
                  {filled && slot.classname && (
                    <img src={getFurniIcon(slot.classname)} alt="" className="w-7 h-7 object-contain" style={{ imageRendering: "pixelated" }}
                      onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                  )}
                  {filled && slot.count > 0 && <span className="absolute bottom-0 right-1 text-[8px] font-bold text-foreground/50 tabular-nums">{slot.count}</span>}
                </div>
              </TooltipTrigger>
              {filled && <TooltipContent side="top" sideOffset={4}><span className="text-xs">{slot.public_name} ({slot.count}×)</span></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const ChatInputV2View: FC<{}> = () => {
  const [chatValue, setChatValue] = useState("");
  const [activeStyle, setActiveStyle] = useState(0);
  const [hotbarVisible, setHotbarVisible] = useState(true);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [commandCount, setCommandCount] = useState(0);
  const [userSelectedIndex, setUserSelectedIndex] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const showCommands = useMemo(() => chatValue.startsWith(":") && !chatValue.includes(" ") && chatValue.length > 0, [chatValue]);
  const ghostText = useMemo(() => getGhostText(chatValue), [chatValue]);
  const userAutoState = useMemo(() => shouldShowUserAutocomplete(chatValue), [chatValue]);
  const showUserAuto = userAutoState.show && !showCommands;

  const handleChange = useCallback((value: string) => {
    setChatValue(value);
    if (value.startsWith(":") && !value.includes(" ")) setSelectedCommandIndex(0);
    setUserSelectedIndex(0);
  }, []);

  const handleCommandSelect = useCallback((cmd: string) => {
    setChatValue(cmd);
    setSelectedCommandIndex(0);
    inputRef.current?.focus();
  }, []);

  const handleUserSelect = useCallback((name: string) => {
    const { matchedCommand } = parseCommandState(chatValue);
    if (!matchedCommand) return;
    const parts = chatValue.split(/\s+/);
    const cmdParts = matchedCommand.command.split(/\s+/);
    const paramParts = parts.slice(cmdParts.length);
    if (paramParts.length === 0) {
      setChatValue(matchedCommand.command + " " + name + " ");
    } else {
      paramParts[paramParts.length - 1] = name;
      setChatValue(matchedCommand.command + " " + paramParts.join(" ") + " ");
    }
    setUserSelectedIndex(0);
    inputRef.current?.focus();
  }, [chatValue]);

  const handleEmojiSelect = useCallback((code: string) => {
    setChatValue(prev => prev + code);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showCommands && commandCount > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedCommandIndex(prev => (prev + 1) % commandCount); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedCommandIndex(prev => (prev - 1 + commandCount) % commandCount); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const q = chatValue.toLowerCase();
        const filtered = DEMO_COMMANDS.filter(cmd => cmd.command.includes(q) || cmd.description.toLowerCase().includes(q));
        if (filtered[selectedCommandIndex]) handleCommandSelect(filtered[selectedCommandIndex].command + " ");
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setChatValue(""); return; }
    }
    if (showUserAuto && userCount > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setUserSelectedIndex(prev => (prev + 1) % userCount); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setUserSelectedIndex(prev => (prev - 1 + userCount) % userCount); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const q = userAutoState.filter.toLowerCase();
        const filtered = q ? DEMO_USERS.filter(u => u.name.toLowerCase().includes(q)) : DEMO_USERS;
        if (filtered[userSelectedIndex]) handleUserSelect(filtered[userSelectedIndex].name);
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setChatValue(prev => prev.trimEnd() + " "); return; }
    }
    if (e.key === "Enter" && !showCommands && !showUserAuto) {
      setChatValue("");
    }
  }, [showCommands, commandCount, selectedCommandIndex, chatValue, handleCommandSelect, showUserAuto, userCount, userSelectedIndex, userAutoState.filter, handleUserSelect]);

  const activeStyleData = BUBBLE_STYLES.find(s => s.id === activeStyle) ?? BUBBLE_STYLES[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Chat-Input</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Chat-System Redesign · Hotbar · Commands · Emoji · Styles</p>
          </div>
          <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
        </div>
      </div>

      {/* Room Area */}
      <div className="flex-1 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--muted)/0.15) 0%, hsl(var(--background)) 70%)" }}>
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl opacity-5 mb-4">💬</div>
            <p className="text-sm text-muted-foreground/20 font-medium">Raum-Bereich</p>
            <p className="text-xs text-muted-foreground/10 mt-1">Chat-Input erscheint unten</p>
          </div>
        </div>
      </div>

      {/* Bottom: Style + Hotbar + Chat Input */}
      <div className="shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm">
        {/* Hotbar */}
        {hotbarVisible && <HotbarBar slots={DEMO_HOTBAR} />}

        <div className="relative px-4 pb-4 pt-1 max-w-2xl mx-auto w-full">
          {/* Command Autocomplete */}
          {showCommands && chatValue.startsWith(":") && (
            <CommandAutocomplete filter={chatValue.toLowerCase()} onSelect={handleCommandSelect}
              selectedIndex={selectedCommandIndex} itemCount={setCommandCount} />
          )}

          {/* Username Autocomplete */}
          {showUserAuto && (
            <UserAutocomplete filter={userAutoState.filter} onSelect={handleUserSelect}
              selectedIndex={userSelectedIndex} onItemCount={setUserCount} />
          )}

          {/* Input Bar */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-2.5 shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:shadow-xl">
            {/* Emoji */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors" title="Emojis">
                  <Smile className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" sideOffset={12} className="p-0 w-auto">
                <EmojiPicker onSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>

            {/* Input with ghost text */}
            <div className="flex-1 relative">
              <input ref={inputRef} type="text"
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/30"
                placeholder="Nachricht eingeben... (:command für Befehle)"
                value={chatValue}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus />
              {/* Ghost param hints */}
              {ghostText && chatValue && (
                <div className="absolute top-0 left-0 h-full flex items-center pointer-events-none text-[14px]">
                  <span className="invisible whitespace-pre">{chatValue}</span>
                  <span className="text-muted-foreground/20 whitespace-pre"> {ghostText}</span>
                </div>
              )}
            </div>

            {/* Style Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors" title="Chat-Style">
                  <Palette className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" sideOffset={12} className="p-0 w-auto">
                <StyleSelectorPopover activeStyle={activeStyle} onSelect={setActiveStyle} />
              </PopoverContent>
            </Popover>

            {/* Hotbar Toggle */}
            <button onClick={() => setHotbarVisible(!hotbarVisible)}
              className={`shrink-0 transition-colors ${hotbarVisible ? "text-amber-400" : "text-muted-foreground/40 hover:text-foreground"}`}
              title="Schnellleiste">
              <Zap className="w-5 h-5" />
            </button>

            <Separator orientation="vertical" className="h-4" />
            <span className="text-[11px] text-muted-foreground/25 select-none shrink-0 font-medium">↵ Senden</span>
          </div>

          {/* Hints */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/25">
              <span className="flex items-center gap-1"><Smile className="w-3 h-3" /> Emoji</span>
              <span className="flex items-center gap-1">
                <img src={activeStyleData.image} alt="" className="h-3 w-auto inline-block opacity-60" style={{ imageRendering: "pixelated" }} />
                {activeStyleData.name}
              </span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Hotbar</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/25">
              <span>Shift+↵ Rufen</span><span>·</span><span>: Befehle</span><span>·</span><span>↑↓ Navigation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
