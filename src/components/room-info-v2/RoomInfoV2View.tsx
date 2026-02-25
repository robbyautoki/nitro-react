
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Home,
  Star,
  Settings,
  Link2,
  Camera,
  Users,
  Copy,
  Check,
  MessageCircle,
  Flag,
  VolumeX,
  Volume2,
  Filter,
  LayoutGrid,
  Eye,
  Shield,
  ArrowLeft,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────

function getAvatarHead(figure: string) {
  return `https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&headonly=1&size=s&direction=2`;
}

function getRoomModel(model: string) {
  return `/navigator/models/model_${model}.png`;
}

// ─── Types ──────────────────────────────────────

type DoorMode = "open" | "doorbell" | "password" | "invisible";

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
  category: string;
  rating: number;
  hasGroup: boolean;
  groupName?: string;
  groupBadge?: string;
  isOwner: boolean;
  isStaff: boolean;
}

// ─── Demo Data ──────────────────────────────────

const FIGURES = {
  bahhos: "hr-3090-45.hd-180-1.ch-3110-92.lg-3116-82.sh-3115-92",
  tim: "hr-893-45.hd-180-3.ch-3030-92.lg-285-82.sh-290-92",
  lucky: "hr-165-45.hd-190-10.ch-255-92.lg-275-82.sh-295-92",
  rpchef: "hr-3322-45.hd-180-1.ch-3135-92.lg-3116-82-1408.sh-3115-92",
  du: "hr-515-45.hd-600-1.ch-665-92.lg-700-82.sh-725-92",
};

const DEMO_ROOMS: DemoRoom[] = [
  {
    id: 1, name: "TestLobby", owner: "Systemaccount", figure: FIGURES.bahhos,
    description: "Willkommen im Hotel! Triff andere Habbos, chatte und hab Spaß. Dies ist der offizielle Treffpunkt.",
    userCount: 18, maxUsers: 25, doorMode: "open", tags: ["rp"], model: "a",
    category: "RP Lobby", rating: 0, hasGroup: false, isOwner: true, isStaff: true,
  },
  {
    id: 2, name: "Casino Royale", owner: "LuckyDice", figure: FIGURES.lucky,
    description: "Würfel, Poker und mehr! Einsätze ab 5 Credits. Täglich neue Turniere.",
    userCount: 22, maxUsers: 30, doorMode: "open", tags: ["casino", "spiele", "credits"],
    model: "c", category: "Unterhaltung", rating: 47, hasGroup: true,
    groupName: "Casino Gang", groupBadge: "b05114s26124", isOwner: false, isStaff: true,
  },
  {
    id: 3, name: "Tims Chill-Lounge", owner: "TimHD", figure: FIGURES.tim,
    description: "Entspannen, Musik hören, Leute treffen. Kein Drama!",
    userCount: 8, maxUsers: 20, doorMode: "open", tags: ["chill", "musik"],
    model: "b", category: "Persönlich", rating: 12, hasGroup: false, isOwner: false, isStaff: false,
  },
  {
    id: 4, name: "RP Hauptquartier", owner: "RPChef", figure: FIGURES.rpchef,
    description: "Zentrale für alle Roleplay-Aktivitäten. Melde dich beim Chef.",
    userCount: 15, maxUsers: 20, doorMode: "doorbell", tags: ["rp", "roleplay", "zentrale"],
    model: "d", category: "Roleplay", rating: 33, hasGroup: true,
    groupName: "RP-Leitung", groupBadge: "b27114s04114", isOwner: false, isStaff: true,
  },
  {
    id: 5, name: "Mein Zimmer", owner: "Du", figure: FIGURES.du,
    description: "",
    userCount: 1, maxUsers: 25, doorMode: "password", tags: [],
    model: "e", category: "Persönlich", rating: 0, hasGroup: false, isOwner: true, isStaff: false,
  },
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

// ─── Room Settings Demo Data ────────────────────

const DEMO_RIGHTS_USERS = [
  { id: 1, name: "TimHD", figure: FIGURES.tim },
  { id: 2, name: "LuckyDice", figure: FIGURES.lucky },
  { id: 3, name: "RPChef", figure: FIGURES.rpchef },
];

const DEMO_BANNED_USERS = [
  { id: 10, name: "Troll123", figure: FIGURES.du },
  { id: 11, name: "SpamBot", figure: FIGURES.tim },
];

const CATEGORIES = [
  { id: 1, name: "RP Lobby" },
  { id: 2, name: "Unterhaltung" },
  { id: 3, name: "Persönlich" },
  { id: 4, name: "Roleplay" },
  { id: 5, name: "Handel" },
];

// ─── Room Settings Content ──────────────────────

function RoomSettingsContent({ room, onBack }: { room: DemoRoom; onBack: () => void }) {
  const [roomName, setRoomName] = useState(room.name);
  const [roomDesc, setRoomDesc] = useState(room.description);
  const [categoryId, setCategoryId] = useState("1");
  const [maxVisitors, setMaxVisitors] = useState(String(room.maxUsers));
  const [tradeState, setTradeState] = useState("2");
  const [tag1, setTag1] = useState(room.tags[0] ?? "");
  const [tag2, setTag2] = useState(room.tags[1] ?? "");
  const [allowWalkthrough, setAllowWalkthrough] = useState(true);
  const [lockState, setLockState] = useState<string>(room.doorMode === "open" ? "0" : room.doorMode === "doorbell" ? "1" : room.doorMode === "invisible" ? "3" : "2");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allowPets, setAllowPets] = useState(false);
  const [allowPetsEat, setAllowPetsEat] = useState(false);
  const [rightsUsers, setRightsUsers] = useState(DEMO_RIGHTS_USERS);
  const [bannedUsers, setBannedUsers] = useState(DEMO_BANNED_USERS);
  const [selectedBanned, setSelectedBanned] = useState<number>(-1);
  const [chatMode, setChatMode] = useState("0");
  const [bubbleWidth, setBubbleWidth] = useState("0");
  const [scrollSpeed, setScrollSpeed] = useState("1");
  const [floodProtection, setFloodProtection] = useState("1");
  const [chatDistance, setChatDistance] = useState("14");
  const [hideWalls, setHideWalls] = useState(false);
  const [wallThickness, setWallThickness] = useState("0");
  const [floorThickness, setFloorThickness] = useState("0");
  const [modMute, setModMute] = useState("0");
  const [modKick, setModKick] = useState("1");
  const [modBan, setModBan] = useState("0");

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">Raumeinstellungen</span>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-8">
          <TabsTrigger value="basic" className="text-xs px-2.5">Allgemein</TabsTrigger>
          <TabsTrigger value="access" className="text-xs px-2.5">Zugang</TabsTrigger>
          <TabsTrigger value="rights" className="text-xs px-2.5">Rechte</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs px-2.5">Chat & VIP</TabsTrigger>
          <TabsTrigger value="mod" className="text-xs px-2.5">Moderation</TabsTrigger>
        </TabsList>

        {/* Tab 1: Allgemein */}
        <TabsContent value="basic">
          <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0">Raumname</label>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <Input className="h-7 text-xs" value={roomName} maxLength={60} onChange={e => setRoomName(e.target.value)} onBlur={() => toast.success("Name gespeichert")} />
                    {roomName.length < 3 && <span className="text-[10px] text-destructive">Mindestens 3 Zeichen</span>}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0 pt-1.5">Beschreibung</label>
                  <Textarea className="flex-1 text-xs resize-none min-h-[50px]" value={roomDesc} maxLength={255} onChange={e => setRoomDesc(e.target.value)} onBlur={() => toast.success("Beschreibung gespeichert")} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0">Kategorie</label>
                  <Select value={categoryId} onValueChange={v => { setCategoryId(v); toast.success("Kategorie geändert"); }}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0">Max. Besucher</label>
                  <Select value={maxVisitors} onValueChange={v => { setMaxVisitors(v); toast.success("Max. Besucher geändert"); }}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30, 40, 50, 75, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0">Handel</label>
                  <Select value={tradeState} onValueChange={v => { setTradeState(v); toast.success("Handel geändert"); }}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Nicht erlaubt</SelectItem>
                      <SelectItem value="1" className="text-xs">Nur mit Rechten</SelectItem>
                      <SelectItem value="2" className="text-xs">Erlaubt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-[80px] shrink-0">Tags</label>
                  <div className="flex-1 flex gap-1.5">
                    <Input className="h-7 text-xs flex-1" value={tag1} maxLength={15} placeholder="Tag 1" onChange={e => setTag1(e.target.value)} onBlur={() => toast.success("Tags gespeichert")} />
                    <Input className="h-7 text-xs flex-1" value={tag2} maxLength={15} placeholder="Tag 2" onChange={e => setTag2(e.target.value)} onBlur={() => toast.success("Tags gespeichert")} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-[88px]">
                  <Checkbox id="walkthrough" checked={allowWalkthrough} onCheckedChange={v => { setAllowWalkthrough(!!v); toast.success(v ? "Durchlaufen erlaubt" : "Durchlaufen gesperrt"); }} />
                  <label htmlFor="walkthrough" className="text-xs cursor-pointer">Durchlaufen erlauben</label>
                </div>
                <div className="flex justify-center pt-1">
                  <button className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors" onClick={() => toast.error("Raum würde gelöscht werden!")}>
                    <Trash2 className="w-3 h-3" />
                    Raum löschen
                  </button>
                </div>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>

        {/* Tab 2: Zugang */}
        <TabsContent value="access">
          <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium">Türmodus</span>
                  <span className="text-[11px] text-muted-foreground">Bestimme, wer deinen Raum betreten darf.</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "0", label: "Offen" },
                    { value: "1", label: "Türklingel" },
                    { value: "3", label: "Unsichtbar" },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5" checked={lockState === opt.value} onChange={() => { setLockState(opt.value); toast.success(`Türmodus: ${opt.label}`); }} />
                      <span className="text-xs">{opt.label}</span>
                    </label>
                  ))}
                  <div className="flex items-start gap-2">
                    <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5 mt-0.5" checked={lockState === "2"} onChange={() => setLockState("2")} />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-xs">Passwort</span>
                      {lockState === "2" && (
                        <>
                          <Input type="password" className="h-7 text-xs" value={password} onChange={e => setPassword(e.target.value)} placeholder="Passwort" />
                          {password.length > 0 && password.length < 3 && <span className="text-[10px] text-destructive">Passwort zu kurz</span>}
                          <Input type="password" className="h-7 text-xs" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Passwort bestätigen" onBlur={() => { if (password && password === confirmPassword) toast.success("Passwort gesetzt"); }} />
                          {password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword && <span className="text-[10px] text-destructive">Passwörter stimmen nicht überein</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FramePanel>
            <FramePanel>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium">Haustiere</span>
                <div className="flex items-center gap-2">
                  <Checkbox id="pets" checked={allowPets} onCheckedChange={v => { setAllowPets(!!v); toast.success(v ? "Haustiere erlaubt" : "Haustiere gesperrt"); }} />
                  <label htmlFor="pets" className="text-xs cursor-pointer">Haustiere erlauben</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="petsEat" checked={allowPetsEat} onCheckedChange={v => { setAllowPetsEat(!!v); toast.success(v ? "Füttern erlaubt" : "Füttern gesperrt"); }} />
                  <label htmlFor="petsEat" className="text-xs cursor-pointer">Haustiere füttern erlauben</label>
                </div>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>

        {/* Tab 3: Rechte */}
        <TabsContent value="rights">
          <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium">User mit Rechten ({rightsUsers.length})</span>
                <ScrollArea className="h-[120px]">
                  <div className="flex flex-col gap-0.5">
                    {rightsUsers.length === 0 && <span className="text-[11px] text-muted-foreground text-center py-4">Keine User mit Rechten</span>}
                    {rightsUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group">
                        <img src={getAvatarHead(user.figure)} alt="" className="w-[18px] h-[18px]" style={{ imageRendering: "pixelated" }} />
                        <span className="text-xs flex-1">{user.name}</span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                          onClick={() => { setRightsUsers(prev => prev.filter(u => u.id !== user.id)); toast.success(`Rechte von ${user.name} entfernt`); }}
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={rightsUsers.length === 0}
                  onClick={() => { setRightsUsers([]); toast.success("Alle Rechte entfernt"); }}
                >
                  Alle Rechte entfernen
                </Button>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>

        {/* Tab 4: Chat & VIP */}
        <TabsContent value="chat">
          <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-medium">Chat-Einstellungen</span>
                  <Select value={chatMode} onValueChange={v => { setChatMode(v); toast.success("Chat-Modus geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Frei fließend</SelectItem>
                      <SelectItem value="1" className="text-xs">Zeile für Zeile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bubbleWidth} onValueChange={v => { setBubbleWidth(v); toast.success("Blasenbreite geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Normal</SelectItem>
                      <SelectItem value="1" className="text-xs">Dünn</SelectItem>
                      <SelectItem value="2" className="text-xs">Breit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scrollSpeed} onValueChange={v => { setScrollSpeed(v); toast.success("Scroll-Speed geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Schnell</SelectItem>
                      <SelectItem value="1" className="text-xs">Normal</SelectItem>
                      <SelectItem value="2" className="text-xs">Langsam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={floodProtection} onValueChange={v => { setFloodProtection(v); toast.success("Flood-Schutz geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Locker</SelectItem>
                      <SelectItem value="1" className="text-xs">Normal</SelectItem>
                      <SelectItem value="2" className="text-xs">Streng</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">Hördistanz</span>
                    <Input type="number" min="0" className="h-7 text-xs" value={chatDistance} onChange={e => setChatDistance(e.target.value)} onBlur={() => toast.success("Hördistanz gespeichert")} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-medium">VIP-Einstellungen</span>
                  <div className="flex items-center gap-2">
                    <Checkbox id="hideWalls" checked={hideWalls} onCheckedChange={v => { setHideWalls(!!v); toast.success(v ? "Wände versteckt" : "Wände sichtbar"); }} />
                    <label htmlFor="hideWalls" className="text-xs cursor-pointer">Wände verstecken</label>
                  </div>
                  <Select value={wallThickness} onValueChange={v => { setWallThickness(v); toast.success("Wandstärke geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Normal</SelectItem>
                      <SelectItem value="1" className="text-xs">Dick</SelectItem>
                      <SelectItem value="-1" className="text-xs">Dünn</SelectItem>
                      <SelectItem value="-2" className="text-xs">Am dünnsten</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={floorThickness} onValueChange={v => { setFloorThickness(v); toast.success("Bodenstärke geändert"); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Normal</SelectItem>
                      <SelectItem value="1" className="text-xs">Dick</SelectItem>
                      <SelectItem value="-1" className="text-xs">Dünn</SelectItem>
                      <SelectItem value="-2" className="text-xs">Am dünnsten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>

        {/* Tab 5: Moderation */}
        <TabsContent value="mod">
          <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-medium">Gebannte User ({bannedUsers.length})</span>
                  <ScrollArea className="h-[100px]">
                    <div className="flex flex-col gap-0.5">
                      {bannedUsers.length === 0 && <span className="text-[11px] text-muted-foreground text-center py-4">Keine gebannten User</span>}
                      {bannedUsers.map(user => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selectedBanned === user.id ? "bg-muted ring-1 ring-border" : "hover:bg-muted/50"}`}
                          onClick={() => setSelectedBanned(user.id)}
                        >
                          <img src={getAvatarHead(user.figure)} alt="" className="w-[18px] h-[18px]" style={{ imageRendering: "pixelated" }} />
                          <span className="text-xs flex-1">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={selectedBanned <= 0}
                    onClick={() => {
                      const user = bannedUsers.find(u => u.id === selectedBanned);
                      setBannedUsers(prev => prev.filter(u => u.id !== selectedBanned));
                      setSelectedBanned(-1);
                      if (user) toast.success(`${user.name} entbannt`);
                    }}
                  >
                    Entbannen{selectedBanned > 0 && `: ${bannedUsers.find(u => u.id === selectedBanned)?.name}`}
                  </Button>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">Stummschalten</span>
                    <Select value={modMute} onValueChange={v => { setModMute(v); toast.success("Mute-Level geändert"); }}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">Niemand</SelectItem>
                        <SelectItem value="1" className="text-xs">Rechteinhaber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">Kicken</span>
                    <Select value={modKick} onValueChange={v => { setModKick(v); toast.success("Kick-Level geändert"); }}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">Niemand</SelectItem>
                        <SelectItem value="1" className="text-xs">Rechteinhaber</SelectItem>
                        <SelectItem value="2" className="text-xs">Alle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">Bannen</span>
                    <Select value={modBan} onValueChange={v => { setModBan(v); toast.success("Ban-Level geändert"); }}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">Niemand</SelectItem>
                        <SelectItem value="1" className="text-xs">Rechteinhaber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Room Info Modal Content ────────────────────

function RoomInfoContent({ room, onOpenSettings }: { room: DemoRoom; onOpenSettings: () => void }) {
  const [isHome, setIsHome] = useState(room.id === 1);
  const [isStaffPick, setIsStaffPick] = useState(false);
  const [isRoomMuted, setIsRoomMuted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const roomLink = `https://play.bahhos.de/room/${room.id}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(roomLink).then(() => {
      setLinkCopied(true);
      toast.success("Link kopiert!");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [roomLink]);

  const handleToggleHome = useCallback(() => {
    setIsHome(prev => {
      toast.success(prev ? "Heimraum entfernt" : "Als Heimraum gesetzt");
      return !prev;
    });
  }, []);

  const handleStaffPick = useCallback(() => {
    setIsStaffPick(prev => {
      toast.success(prev ? "Staff-Pick entfernt" : "Als Staff-Pick markiert");
      return !prev;
    });
  }, []);

  const handleMuteAll = useCallback(() => {
    setIsRoomMuted(prev => {
      toast.success(prev ? "Raum nicht mehr stumm" : "Alle stumm geschaltet");
      return !prev;
    });
  }, []);

  return (
    <Frame stacked spacing="sm" className="w-full">
      {/* Panel 1: Room Info */}
      <FramePanel>
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="relative shrink-0">
            <div
              className="w-[110px] h-[110px] rounded-lg overflow-hidden border border-border/30"
              style={{ backgroundColor: "hsl(40, 30%, 88%)" }}
            >
              <img
                src={getRoomModel(room.model)}
                alt={room.name}
                className="w-full h-full object-contain"
                style={{ imageRendering: "pixelated" }}
                onError={e => { (e.target as HTMLImageElement).src = "/navigator/thumbnail_placeholder.png"; }}
              />
            </div>
            {room.isOwner && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/40 hover:bg-black/60 transition-colors">
                      <Camera className="w-3 h-3 text-white/70" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Thumbnail ändern</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Row 1: Home + Name + Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={handleToggleHome} className="shrink-0">
                        <Home
                          className={`w-3.5 h-3.5 transition-colors ${isHome ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {isHome ? "Heimraum entfernen" : "Als Heimraum setzen"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-semibold truncate">{room.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {room.isOwner && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-1 rounded-md hover:bg-muted transition-colors"
                          onClick={onOpenSettings}
                        >
                          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">Raumeinstellungen</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                        onClick={() => setShowLink(prev => !prev)}
                      >
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Raum-Link</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Row 2: Owner */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Besitzer:</span>
              <img
                src={getAvatarHead(room.figure)}
                alt={room.owner}
                className="w-[18px] h-[18px]"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="text-[11px] font-medium">{room.owner}</span>
            </div>

            {/* Row 3: Rating */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Bewertung:</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-medium">{room.rating}</span>
            </div>

            {/* Tags */}
            {room.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {room.tags.map(tag => (
                  <Badge key={tag} variant="outline" size="xs" className="text-[10px] cursor-pointer hover:bg-muted">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Category */}
            {room.category && (
              <span className="text-[11px] text-muted-foreground mt-0.5">{room.category}</span>
            )}

            {/* Description */}
            {room.description && (
              <ScrollArea className="max-h-[40px] mt-0.5">
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{room.description}</p>
              </ScrollArea>
            )}

            {/* Group */}
            {room.hasGroup && room.groupName && (
              <button
                className="flex items-center gap-1 mt-0.5 text-[11px] text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                onClick={() => toast.info(`Gruppeninfo: ${room.groupName}`)}
              >
                <Shield className="w-3 h-3" />
                {room.groupName}
              </button>
            )}
          </div>
        </div>
      </FramePanel>

      {/* Panel 2: Link (Expandable) */}
      {showLink && (
        <FramePanel>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={roomLink}
              className="h-7 text-xs font-mono bg-muted/30"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 shrink-0"
              onClick={handleCopyLink}
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </FramePanel>
      )}

      {/* Panel 3: Actions */}
      <FramePanel>
        <div className="flex flex-col gap-0.5">
          {/* Staff Pick - only for staff */}
          {room.isStaff && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center h-8 text-xs"
              onClick={handleStaffPick}
            >
              <Star className={`w-3.5 h-3.5 mr-1.5 ${isStaffPick ? "text-amber-400 fill-amber-400" : ""}`} />
              {isStaffPick ? "Staff-Pick entfernen" : "Als Staff-Pick markieren"}
            </Button>
          )}

          {/* Report Room */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => toast.info("Raum melden...")}
          >
            <Flag className="w-3.5 h-3.5 mr-1.5" />
            Diesen Raum melden
          </Button>

          {/* Owner/Mod Actions */}
          {(room.isOwner || room.isStaff) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center h-8 text-xs"
                onClick={handleMuteAll}
              >
                {isRoomMuted
                  ? <><Volume2 className="w-3.5 h-3.5 mr-1.5" />Stummschaltung aufheben</>
                  : <><VolumeX className="w-3.5 h-3.5 mr-1.5" />Alle stumm schalten</>
                }
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center h-8 text-xs"
                onClick={() => toast.info("Raumfilter öffnen...")}
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Raumfilter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center h-8 text-xs"
                onClick={() => toast.info("Floor Plan Editor öffnen...")}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                Open Floor Plan Editor
              </Button>
            </>
          )}
        </div>
      </FramePanel>

      {/* Panel 4: Room Stats */}
      <FramePanel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {room.userCount}/{room.maxUsers} Besucher
            </span>
          </div>
          <Badge
            variant={room.userCount >= room.maxUsers * 0.9 ? "destructive-light" : room.userCount >= room.maxUsers * 0.5 ? "warning-light" : "success-light"}
            size="xs"
          >
            {room.userCount <= 0 ? "Leer" : room.userCount >= room.maxUsers ? "Voll" : "Offen"}
          </Badge>
        </div>
        <ActivityBar roomId={room.id} userCount={room.userCount} />
      </FramePanel>
    </Frame>
  );
}

// ─── Page ───────────────────────────────────────

function RoomDialogContent({ room }: { room: DemoRoom }) {
  const [view, setView] = useState<"info" | "settings">("info");

  return (
    <>
      {view === "info" ? (
        <>
          <DialogHeader className="pb-0">
            <DialogTitle className="text-sm">Rauminformationen</DialogTitle>
            <DialogDescription className="sr-only">Details und Aktionen für diesen Raum</DialogDescription>
          </DialogHeader>
          <RoomInfoContent room={room} onOpenSettings={() => setView("settings")} />
        </>
      ) : (
        <>
          <DialogHeader className="sr-only">
            <DialogTitle>Raumeinstellungen</DialogTitle>
            <DialogDescription>Einstellungen für diesen Raum</DialogDescription>
          </DialogHeader>
          <RoomSettingsContent room={room} onBack={() => setView("info")} />
        </>
      )}
    </>
  );
}

import { FC } from 'react';

export const RoomInfoV2View: FC<{}> = () => {
  const [selectedRoomId, setSelectedRoomId] = useState("1");
  const selectedRoom = DEMO_ROOMS.find(r => r.id === parseInt(selectedRoomId)) ?? DEMO_ROOMS[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
      {/* Room Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Demo-Raum:</span>
        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
          <SelectTrigger className="w-[220px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ROOMS.map(room => (
              <SelectItem key={room.id} value={String(room.id)} className="text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={getAvatarHead(room.figure)}
                    alt=""
                    className="w-4 h-4"
                    style={{ imageRendering: "pixelated" }}
                  />
                  {room.name}
                  {room.isOwner && <Badge variant="outline" size="xs">Owner</Badge>}
                  {room.isStaff && !room.isOwner && <Badge variant="primary-light" size="xs">Staff</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Sichtbar für: {selectedRoom.isOwner ? "Owner" : selectedRoom.isStaff ? "Staff" : "Besucher"}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {selectedRoom.userCount}/{selectedRoom.maxUsers}</span>
      </div>

      {/* Dialog Trigger */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg">
            Rauminformationen öffnen
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px] p-4 gap-3" showCloseButton={true}>
          <RoomDialogContent room={selectedRoom} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
