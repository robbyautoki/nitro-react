
import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Search,
  Compass,
  Plus,
  Star,
  Crown,
  Users,
  MessageCircle,
  ArrowLeft,
  Check,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────

function getAvatarHead(figure: string) {
  return `https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&headonly=1&size=s&direction=2`;
}

function getRoomModel(model: string) {
  return `/navigator/models/model_${model}.png`;
}

function getDoorIconSrc(mode: DoorMode): string | null {
  if (mode === "doorbell") return "/navigator/icons/room_locked.png";
  if (mode === "password") return "/navigator/icons/room_password.png";
  if (mode === "invisible") return "/navigator/icons/room_invisible.png";
  return null;
}

// ─── Types ──────────────────────────────────────

type DoorMode = "open" | "doorbell" | "password" | "invisible";
type TabId = "all" | "mine" | "rp" | "favorites";

interface DemoRoom {
  id: number;
  name: string;
  owner: string;
  figure: string;
  description: string;
  userCount: number;
  maxUsers: number;
  doorMode: DoorMode;
  tags: string[];
  model: string;
  isMine: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  hasGroup: boolean;
  isHighlighted?: boolean;
}

// ─── Demo Data ──────────────────────────────────

const FIGURES = {
  bahhos: "hr-3090-45.hd-180-1.ch-3110-92.lg-3116-82.sh-3115-92",
  tim: "hr-893-45.hd-180-3.ch-3030-92.lg-285-82.sh-290-92",
  lucky: "hr-165-45.hd-190-10.ch-255-92.lg-275-82.sh-295-92",
  rpchef: "hr-3322-45.hd-180-1.ch-3135-92.lg-3116-82-1408.sh-3115-92",
  du: "hr-515-45.hd-600-1.ch-665-92.lg-700-82.sh-725-92",
  sunny: "hr-545-45.hd-605-1.ch-660-92.lg-710-82.sh-735-92",
  science: "hr-525-45.hd-620-1.ch-670-92.lg-715-82.sh-740-92",
  trade: "hr-100-45.hd-185-3.ch-210-92.lg-270-82.sh-300-92",
  djmax: "hr-535-45.hd-610-1.ch-655-92.lg-705-82.sh-730-92",
  jump: "hr-115-45.hd-195-3.ch-220-92.lg-280-82.sh-305-92",
  officer: "hr-3322-45.hd-180-1.ch-3135-92.lg-3116-82-1408.sh-3115-92",
  barista: "hr-545-45.hd-605-1.ch-660-92.lg-710-82.sh-735-92",
  medic: "hr-893-45.hd-180-3.ch-3030-92.lg-285-82.sh-290-92",
  banker: "hr-165-45.hd-190-10.ch-255-92.lg-275-82.sh-295-92",
  shadow: "hr-100-45.hd-185-3.ch-210-92.lg-270-82.sh-300-92",
};

const DEMO_ROOMS: DemoRoom[] = [
  { id: 1, name: "Lobby", owner: "bahhos", figure: FIGURES.bahhos, description: "Willkommen im Hotel! Triff andere Habbos und chatte.", userCount: 18, maxUsers: 25, doorMode: "open", tags: ["offiziell", "treffpunkt"], model: "a", isMine: false, isFavorite: true, isPinned: true, hasGroup: true, isHighlighted: true },
  { id: 2, name: "Tims Chill-Lounge", owner: "TimHD", figure: FIGURES.tim, description: "Entspannen, Musik hören, Leute treffen.", userCount: 8, maxUsers: 20, doorMode: "open", tags: ["chill", "musik"], model: "b", isMine: false, isFavorite: true, isPinned: false, hasGroup: false },
  { id: 3, name: "Casino Royale", owner: "LuckyDice", figure: FIGURES.lucky, description: "Würfel, Poker und mehr! Einsätze ab 5 Credits.", userCount: 22, maxUsers: 30, doorMode: "open", tags: ["casino", "spiele"], model: "c", isMine: false, isFavorite: false, isPinned: false, hasGroup: true, isHighlighted: true },
  { id: 4, name: "RP Hauptquartier", owner: "RPChef", figure: FIGURES.rpchef, description: "Zentrale für alle Roleplay-Aktivitäten.", userCount: 20, maxUsers: 20, doorMode: "doorbell", tags: ["rp", "roleplay", "zentrale"], model: "d", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
  { id: 5, name: "Mein Zimmer", owner: "Du", figure: FIGURES.du, description: "Dein persönlicher Raum.", userCount: 1, maxUsers: 25, doorMode: "open", tags: [], model: "e", isMine: true, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 6, name: "VIP Lounge", owner: "bahhos", figure: FIGURES.bahhos, description: "Exklusiv für VIP-Mitglieder.", userCount: 5, maxUsers: 10, doorMode: "password", tags: ["vip", "exklusiv"], model: "f", isMine: false, isFavorite: true, isPinned: false, hasGroup: false },
  { id: 7, name: "Strand-Party", owner: "SunnyGirl", figure: FIGURES.sunny, description: "Sommer, Sonne, Strand! Party am Pool.", userCount: 14, maxUsers: 25, doorMode: "open", tags: ["party", "sommer"], model: "g", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 8, name: "Geheimes Labor", owner: "DrScience", figure: FIGURES.science, description: "Was passiert hier wirklich?", userCount: 3, maxUsers: 15, doorMode: "invisible", tags: ["geheim"], model: "h", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 9, name: "Handelszentrum", owner: "TradeKing", figure: FIGURES.trade, description: "Kaufen, verkaufen, tauschen - alles erlaubt!", userCount: 11, maxUsers: 30, doorMode: "open", tags: ["handel", "markt"], model: "i", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
  { id: 10, name: "Mein Laden", owner: "Du", figure: FIGURES.du, description: "Dein Shop - Credits & Rares.", userCount: 0, maxUsers: 15, doorMode: "doorbell", tags: ["shop"], model: "k", isMine: true, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 11, name: "Disco Inferno", owner: "DJMax", figure: FIGURES.djmax, description: "Die beste Musik im ganzen Hotel!", userCount: 0, maxUsers: 25, doorMode: "open", tags: ["disco", "musik"], model: "l", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 12, name: "Parkour Arena", owner: "JumpMaster", figure: FIGURES.jump, description: "Schaffe alle Level? Challenge accepted!", userCount: 6, maxUsers: 15, doorMode: "open", tags: ["spiel", "parkour"], model: "m", isMine: false, isFavorite: true, isPinned: false, hasGroup: false },
  { id: 13, name: "Polizei-Wache", owner: "Officer99", figure: FIGURES.officer, description: "RP Polizei-Station. Melde dich zum Dienst!", userCount: 4, maxUsers: 10, doorMode: "doorbell", tags: ["rp", "polizei"], model: "a", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
  { id: 14, name: "Mein Garten", owner: "Du", figure: FIGURES.du, description: "Dein privater Garten.", userCount: 0, maxUsers: 10, doorMode: "password", tags: ["privat"], model: "b", isMine: true, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 15, name: "Café Central", owner: "Barista", figure: FIGURES.barista, description: "Kaffee, Kuchen und gute Gespräche.", userCount: 9, maxUsers: 20, doorMode: "open", tags: ["café", "treffpunkt"], model: "c", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 16, name: "Krankenhaus", owner: "DrMedic", figure: FIGURES.medic, description: "RP Krankenhaus - Erste Hilfe und Notaufnahme.", userCount: 7, maxUsers: 15, doorMode: "open", tags: ["rp", "krankenhaus", "medizin"], model: "d", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
  { id: 17, name: "Bank von bahhos", owner: "Banker", figure: FIGURES.banker, description: "RP Bank - Kredite, Konten und Überfälle.", userCount: 3, maxUsers: 10, doorMode: "doorbell", tags: ["rp", "bank", "finanzen"], model: "e", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
  { id: 18, name: "Schwarzmarkt", owner: "Shadow", figure: FIGURES.shadow, description: "RP Untergrund-Handel. Nur für Eingeweihte.", userCount: 5, maxUsers: 8, doorMode: "password", tags: ["rp", "schwarzmarkt", "untergrund"], model: "f", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 19, name: "Strand Volleyball", owner: "SunnyGirl", figure: FIGURES.sunny, description: "2v2 Beach-Volleyball! Wer gewinnt?", userCount: 4, maxUsers: 8, doorMode: "open", tags: ["sport", "strand"], model: "g", isMine: false, isFavorite: false, isPinned: false, hasGroup: false },
  { id: 20, name: "Mafia Hauptquartier", owner: "Shadow", figure: FIGURES.shadow, description: "RP Mafia-Zentrale. Don's Büro im Keller.", userCount: 6, maxUsers: 12, doorMode: "invisible", tags: ["rp", "mafia", "untergrund"], model: "h", isMine: false, isFavorite: false, isPinned: false, hasGroup: true },
];

// ─── Activity Bar ───────────────────────────────

function ActivityBar({ roomId, userCount }: { roomId: number; userCount: number }) {
  const activity = userCount <= 0 ? 0 : Math.min(100, userCount * 8 + Math.floor(roomId * 7.3) % 30);
  let barColor = "bg-emerald-500";
  if (activity >= 80) barColor = "bg-red-500";
  else if (activity >= 45) barColor = "bg-amber-500";
  else if (userCount <= 0) barColor = "bg-muted-foreground/20";

  return (
    <div className="flex items-center gap-1.5 w-full">
      <MessageCircle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(activity, 2)}%` }} />
      </div>
    </div>
  );
}

// ─── User Count Badge ───────────────────────────

function UserCountBadge({ userCount, maxUsers }: { userCount: number; maxUsers: number }) {
  const pct = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
  const label = `${userCount}/${maxUsers}`;

  if (userCount <= 0)
    return <Badge variant="outline" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{label}</Badge>;
  if (pct >= 90)
    return <Badge variant="destructive-light" size="xs" className="gap-1 tabular-nums"><span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /><Users className="w-3 h-3" />{label}</Badge>;
  if (pct >= 50)
    return <Badge variant="warning-light" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{label}</Badge>;
  return <Badge variant="success-light" size="xs" className="gap-1 tabular-nums"><Users className="w-3 h-3" />{label}</Badge>;
}

// ─── Room Thumbnail ─────────────────────────────

function RoomThumbnail({ model, doorMode, hasGroup }: { model: string; doorMode: DoorMode; hasGroup: boolean }) {
  const doorIconSrc = getDoorIconSrc(doorMode);
  return (
    <div className="w-[80px] h-[80px] rounded-lg overflow-hidden relative shrink-0 border border-border/30" style={{ backgroundColor: "hsl(40, 30%, 88%)" }}>
      <img
        src={getRoomModel(model)}
        alt=""
        className="w-full h-full object-contain"
        style={{ imageRendering: "pixelated" }}
        onError={e => { (e.target as HTMLImageElement).src = "/navigator/thumbnail_placeholder.png"; }}
      />
      {hasGroup && (
        <div className="absolute top-0 left-0 p-0.5">
          <img src="/navigator/icons/room_group.png" alt="" className="w-[13px] h-[11px]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}
      {doorIconSrc && (
        <div className="absolute bottom-0 right-0 p-0.5 bg-black/50 backdrop-blur-sm rounded-tl-sm">
          <img src={doorIconSrc} alt="" className="w-[13px] h-[16px]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}
    </div>
  );
}

// ─── Room Card ──────────────────────────────────

function RoomCard({ room, onVisit, highlighted }: { room: DemoRoom; onVisit: (id: number) => void; highlighted?: boolean }) {
  const isEmpty = room.userCount <= 0;

  return (
    <div
      className={`flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${isEmpty ? "opacity-40 hover:opacity-60" : ""}`}
      onClick={() => onVisit(room.id)}
    >
      <RoomThumbnail model={room.model} doorMode={room.doorMode} hasGroup={room.hasGroup} />

      <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
        {/* Name + Count */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-semibold truncate leading-tight">{room.name}</span>
            {highlighted && (
              <span className="inline-flex items-center rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 shrink-0 relative overflow-hidden">
                <span className="text-[9px] font-medium text-muted-foreground">Hervorgehoben</span>
                <span className="absolute inset-0 animate-shine-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </span>
            )}
          </div>
          <UserCountBadge userCount={room.userCount} maxUsers={room.maxUsers} />
        </div>

        {/* Capacity bar */}
        <ActivityBar roomId={room.id} userCount={room.userCount} />

        {/* Owner row */}
        <div className="flex items-center gap-1.5">
          <img
            src={getAvatarHead(room.figure)}
            alt=""
            className="w-6 h-6 shrink-0"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-[11px] text-muted-foreground/60 truncate">{room.owner}</span>
          {room.isMine && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
          {room.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>

        {/* Tags */}
        {room.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {room.tags.map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-px rounded-full bg-muted/50 text-muted-foreground/50 font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────

function StatsBar({ totalUsers, activeRooms, totalRooms }: { totalUsers: number; activeRooms: number; totalRooms: number }) {
  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
        <span className="text-[11px] font-bold tabular-nums">{totalUsers}</span>
        <span className="text-[11px] text-muted-foreground/50">online</span>
      </div>
      <Separator orientation="vertical" className="h-3" />
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold tabular-nums">{activeRooms}</span>
        <span className="text-[11px] text-muted-foreground/50">aktive Räume</span>
      </div>
      <Separator orientation="vertical" className="h-3" />
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold tabular-nums">{totalRooms}</span>
        <span className="text-[11px] text-muted-foreground/50">gesamt</span>
      </div>
    </div>
  );
}

// ─── Room Models ────────────────────────────────

interface RoomModel {
  name: string;
  tileSize: number;
  clubLevel: number;
}

const ROOM_MODELS: RoomModel[] = [
  { name: "a", tileSize: 104, clubLevel: 0 },
  { name: "b", tileSize: 94, clubLevel: 0 },
  { name: "c", tileSize: 36, clubLevel: 0 },
  { name: "d", tileSize: 84, clubLevel: 0 },
  { name: "e", tileSize: 80, clubLevel: 0 },
  { name: "f", tileSize: 80, clubLevel: 0 },
  { name: "i", tileSize: 416, clubLevel: 0 },
  { name: "k", tileSize: 448, clubLevel: 0 },
  { name: "l", tileSize: 352, clubLevel: 0 },
  { name: "m", tileSize: 384, clubLevel: 0 },
  { name: "g", tileSize: 80, clubLevel: 1 },
  { name: "h", tileSize: 74, clubLevel: 1 },
];

const ROOM_CATEGORIES = [
  { id: 1, name: "Öffentliche Räume" },
  { id: 2, name: "Party" },
  { id: 3, name: "Spiele" },
  { id: 4, name: "Handel" },
  { id: 5, name: "Roleplay" },
];

const MAX_VISITORS_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// ─── Room Creator View ──────────────────────────

function RoomCreatorView({ onBack, onCreated }: { onBack: () => void; onCreated: (name: string) => void }) {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("1");
  const [maxVisitors, setMaxVisitors] = useState("20");
  const [tradeSetting, setTradeSetting] = useState("0");
  const [selectedModel, setSelectedModel] = useState("a");

  const canCreate = roomName.trim().length >= 3;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold">Raum erstellen</span>
      </div>

      <Separator />

      {/* Scrollable Form */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Raumname</Label>
            <Input
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              maxLength={60}
              placeholder="Mein neuer Raum"
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground/50">{roomName.length}/60 Zeichen (min. 3)</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={255}
              placeholder="Beschreibe deinen Raum..."
              className="text-xs min-h-[60px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground/50">{description.length}/255 Zeichen</p>
          </div>

          {/* Category + Max Visitors row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="text-xs">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max. Besucher</Label>
              <Select value={maxVisitors} onValueChange={setMaxVisitors}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_VISITORS_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trade Setting */}
          <div className="space-y-1.5">
            <Label className="text-xs">Handel</Label>
            <Select value={tradeSetting} onValueChange={setTradeSetting}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">Handel nicht erlaubt</SelectItem>
                <SelectItem value="1" className="text-xs">Nicht mit Controllern</SelectItem>
                <SelectItem value="2" className="text-xs">Handel erlaubt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Model Grid */}
          <div className="space-y-1.5">
            <Label className="text-xs">Raum-Modell</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_MODELS.map(model => {
                const isSelected = selectedModel === model.name;
                const isHc = model.clubLevel > 0;
                return (
                  <button
                    key={model.name}
                    onClick={() => setSelectedModel(model.name)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                        : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40"
                    } ${isHc ? "opacity-50" : ""}`}
                  >
                    <div
                      className="w-full aspect-square rounded-md overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: "hsl(40, 30%, 88%)" }}
                    >
                      <img
                        src={getRoomModel(model.name)}
                        alt={`Modell ${model.name}`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{model.tileSize} Tiles</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                    {isHc && (
                      <Badge variant="warning-light" size="xs" className="absolute top-1 left-1 text-[8px]">HC</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Create Button */}
      <div className="p-3 border-t shrink-0">
        <Button
          className="w-full gap-2"
          disabled={!canCreate}
          onClick={() => { if (canCreate) onCreated(roomName); }}
        >
          <Plus className="w-4 h-4" />
          Raum erstellen
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const NavigatorV2View: FC<{}> = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visitedRoom, setVisitedRoom] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<string | null>(null);

  const filteredRooms = useMemo(() => {
    let rooms = DEMO_ROOMS;

    if (activeTab === "mine") rooms = rooms.filter(r => r.isMine);
    else if (activeTab === "favorites") rooms = rooms.filter(r => r.isFavorite);
    else if (activeTab === "rp") rooms = rooms.filter(r => r.tags.includes("rp"));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rooms = rooms.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return rooms.sort((a, b) => {
      if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1;
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.userCount - a.userCount;
    });
  }, [activeTab, searchQuery]);

  const stats = useMemo(() => {
    let totalUsers = 0;
    let activeRooms = 0;
    for (const room of DEMO_ROOMS) {
      totalUsers += room.userCount;
      if (room.userCount > 0) activeRooms++;
    }
    return { totalUsers, activeRooms, totalRooms: DEMO_ROOMS.length };
  }, []);

  const handleVisit = useCallback((id: number) => {
    const room = DEMO_ROOMS.find(r => r.id === id);
    if (room) {
      setVisitedRoom(room.name);
      setTimeout(() => setVisitedRoom(null), 2000);
    }
  }, []);

  const handleRoomCreated = useCallback((name: string) => {
    setCreatedRoom(name);
    setIsCreating(false);
    setTimeout(() => setCreatedRoom(null), 2500);
  }, []);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "Alle Räume", count: DEMO_ROOMS.length },
    { id: "mine", label: "Meine", count: DEMO_ROOMS.filter(r => r.isMine).length },
    { id: "rp", label: "RP", count: DEMO_ROOMS.filter(r => r.tags.includes("rp")).length },
    { id: "favorites", label: "Favoriten", count: DEMO_ROOMS.filter(r => r.isFavorite).length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Navigator-Prototyp</h1>
        <p className="text-sm text-muted-foreground">Enterprise Raumnavigation mit Habbo Assets, Avatar-Köpfen und reui Design</p>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-[400px] h-[300px] rounded-2xl border border-dashed border-border/50 flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.1) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          >
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg">
                  <Compass className="w-5 h-5" />
                  Navigator öffnen
                </Button>
              </SheetTrigger>

              <SheetContent side="right" showCloseButton={false} className="sm:max-w-lg w-full p-0 flex flex-col gap-0">
                {isCreating ? (
                  <RoomCreatorView
                    onBack={() => setIsCreating(false)}
                    onCreated={handleRoomCreated}
                  />
                ) : (
                  <>
                    {/* Header */}
                    <SheetHeader className="px-5 pt-5 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <SheetTitle className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-muted-foreground" />
                            Navigator
                          </SheetTitle>
                          <SheetDescription className="text-xs mt-0.5">
                            Durchsuche und besuche Räume im Hotel
                          </SheetDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50" onClick={() => setOpen(false)}>
                          <span className="text-lg leading-none">&times;</span>
                        </Button>
                      </div>
                    </SheetHeader>

                    {/* Main Frame */}
                    <div className="flex-1 min-h-0 flex flex-col px-3 pb-3 gap-3">
                      <Frame variant="default" spacing="sm" stacked className="flex-1 min-h-0 flex flex-col">
                        {/* Tabs */}
                        <FramePanel className="shrink-0">
                          <div className="flex items-center gap-1 p-1.5">
                            {tabs.map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-[11px] font-semibold transition-colors ${
                                  activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                }`}
                              >
                                {tab.label}
                                <span className={`text-[9px] tabular-nums px-1 py-px rounded-full ${
                                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted/50"
                                }`}>
                                  {tab.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </FramePanel>

                        {/* Search + Stats */}
                        <FramePanel className="shrink-0">
                          <div className="p-2.5 space-y-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                              <Input
                                type="text"
                                placeholder="Raum oder Owner suchen..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-8 text-xs pl-8 rounded-lg"
                              />
                            </div>
                            <StatsBar {...stats} />
                          </div>
                        </FramePanel>

                        {/* Room List */}
                        <FramePanel className="flex-1 min-h-0 overflow-hidden">
                          <ScrollArea className="h-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
                            <div className="p-1.5 flex flex-col gap-1">
                              {filteredRooms.map(room => (
                                <RoomCard key={room.id} room={room} onVisit={handleVisit} highlighted={room.isHighlighted && activeTab === "all"} />
                              ))}
                              {filteredRooms.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 gap-2">
                                  <Search className="w-5 h-5 text-muted-foreground/20" />
                                  <span className="text-[12px] text-muted-foreground/30">Keine Räume gefunden</span>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </FramePanel>
                      </Frame>
                    </div>

                    {/* Footer */}
                    <SheetFooter className="px-4 pb-4 pt-0">
                      <Button variant="outline" className="w-full gap-2" onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4" />
                        Raum erstellen
                      </Button>
                    </SheetFooter>

                    {/* Created Toast */}
                    {createdRoom && (
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 z-10">
                        Raum &ldquo;{createdRoom}&rdquo; erstellt!
                      </div>
                    )}
                  </>
                )}
              </SheetContent>
            </Sheet>

            {visitedRoom && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                Raum &ldquo;{visitedRoom}&rdquo; betreten
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground/40 max-w-sm text-center">
            Klicke auf den Button um den Navigator als Sheet von rechts zu öffnen.
            Mit Habbo Raum-Modell Thumbnails, Avatar-Köpfen und Habbo Door-Icons.
          </p>
        </div>
      </div>
    </div>
  );
}
