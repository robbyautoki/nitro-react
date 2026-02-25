
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, MessageCircle, Navigation, User, X, Heart, Smile, ArrowLeft, Send, Check, UserPlus, UserMinus, Mail, DoorOpen, Eye, Handshake, Swords, Trophy, Info, CheckSquare, Calendar, Clock, ChevronLeft, ChevronRight, Plus, UsersRound,
} from "lucide-react";

// ─── Avatar ─────────────────────────────────────

function getAvatarHead(figure: string) {
  return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${encodeURIComponent(figure)}&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}

// ─── Types ──────────────────────────────────────

interface Friend { id: number; name: string; figure: string; motto: string; online: boolean; lastAccess: string; followingAllowed: boolean; relationshipStatus: number; relLevel: number; relPoints: number; relNextPoints: number | null; relStats: { chat: number; whisper: number; trade: number; action: number; pm: number; event: number } }
interface FriendRequest { id: number; name: string; figure: string }
interface ChatMessage { id: number; senderId: number; senderName?: string; message: string; timestamp: string }
interface ChatThread { id: string; type: "dm" | "group"; participantIds: number[]; groupName?: string; messages: ChatMessage[]; unreadCount: number }
interface SearchResult { id: number; name: string; figure: string; online: boolean }

// ─── Constants ──────────────────────────────────

const LEVEL_NAMES = ["Unbekannt", "Bekannte", "Kumpel", "Guter Freund", "Bester Freund", "Seelenverwandt", "Unzertrennlich", "Legende"];
const LEVEL_COLORS = ["#666", "#999", "#6bb5ff", "#4ade80", "#facc15", "#f97316", "#ef4444", "#c084fc"];
const LEVEL_THRESHOLDS = [0, 50, 150, 400, 800, 1500, 3000, 5000];
const MY_USER = { id: 999, name: "Robby", figure: "hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-300-91.ha-1003-" };

const MOCK_REPLIES: Record<number, string[]> = {
  1: ["Bin gleich da!", "Moment, muss kurz handeln", "Cool, danke!"],
  2: ["Hab grad einen Rare bekommen!", "Komm in meinen Trade Room"],
  3: ["Danke dir! 💕", "Schau mal was ich gebaut hab", "Haha ja"],
  4: ["Alter Schwede!", "Kenne ich noch von damals"],
  5: ["Bin bald wieder on", "Alles klar!"],
};

const INITIAL_FRIENDS: Friend[] = [
  { id: 1, name: "TradeMaster", figure: "hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201-62", motto: "Trading is life", online: true, lastAccess: "", followingAllowed: true, relationshipStatus: 1, relLevel: 7, relPoints: 5420, relNextPoints: null, relStats: { chat: 1200, whisper: 800, trade: 1500, action: 620, pm: 900, event: 400 } },
  { id: 2, name: "RareKing", figure: "hr-831-45.hd-180-1.ch-255-82.lg-280-82.sh-295-62", motto: "Rares only!", online: true, lastAccess: "", followingAllowed: true, relationshipStatus: 0, relLevel: 4, relPoints: 920, relNextPoints: 1500, relStats: { chat: 300, whisper: 120, trade: 350, action: 50, pm: 80, event: 20 } },
  { id: 3, name: "PixelQueen", figure: "hr-515-45.hd-600-10.ch-665-82.lg-710-82.sh-725-62.ha-1004-", motto: "Design is everything", online: true, lastAccess: "", followingAllowed: true, relationshipStatus: 2, relLevel: 5, relPoints: 1820, relNextPoints: 3000, relStats: { chat: 500, whisper: 400, trade: 200, action: 320, pm: 300, event: 100 } },
  { id: 4, name: "HabboVeteran", figure: "hr-165-45.hd-190-1.ch-215-82.lg-285-82.sh-305-62", motto: "Since 2004", online: true, lastAccess: "", followingAllowed: false, relationshipStatus: 0, relLevel: 3, relPoints: 480, relNextPoints: 800, relStats: { chat: 200, whisper: 80, trade: 100, action: 40, pm: 50, event: 10 } },
  { id: 5, name: "CoolDude42", figure: "hr-893-45.hd-180-14.ch-220-82.lg-270-82.sh-300-91", motto: "Chillen und so", online: false, lastAccess: "vor 2 Stunden", followingAllowed: true, relationshipStatus: 3, relLevel: 2, relPoints: 180, relNextPoints: 400, relStats: { chat: 80, whisper: 30, trade: 20, action: 20, pm: 20, event: 10 } },
  { id: 6, name: "FurniCollector", figure: "hr-155-42.hd-209-19.ch-3110-82.lg-3116-82.sh-3115-1408", motto: "10k+ Möbel", online: false, lastAccess: "vor 5 Stunden", followingAllowed: true, relationshipStatus: 0, relLevel: 1, relPoints: 65, relNextPoints: 150, relStats: { chat: 30, whisper: 10, trade: 15, action: 5, pm: 5, event: 0 } },
  { id: 7, name: "NightOwl", figure: "hr-802-45.hd-600-1.ch-660-82.lg-710-82.sh-725-62", motto: "Nachts unterwegs", online: false, lastAccess: "vor 1 Tag", followingAllowed: true, relationshipStatus: 0, relLevel: 0, relPoints: 12, relNextPoints: 50, relStats: { chat: 8, whisper: 2, trade: 0, action: 2, pm: 0, event: 0 } },
  { id: 8, name: "NewPlayer2026", figure: "hr-115-42.hd-180-1.ch-210-82.lg-270-82.sh-300-62", motto: "Bin neu hier!", online: false, lastAccess: "vor 3 Tagen", followingAllowed: false, relationshipStatus: 0, relLevel: 0, relPoints: 0, relNextPoints: 50, relStats: { chat: 0, whisper: 0, trade: 0, action: 0, pm: 0, event: 0 } },
];

const INITIAL_REQUESTS: FriendRequest[] = [
  { id: 101, name: "xXFreundXx", figure: "hr-831-45.hd-195-1.ch-255-82.lg-280-82.sh-295-62" },
  { id: 102, name: "TradeBot99", figure: "hr-115-42.hd-180-14.ch-3030-82.lg-275-82" },
  { id: 103, name: "HabboNewbie", figure: "hr-165-45.hd-190-1.ch-215-82.lg-285-82.sh-305-62" },
];

const SEARCH_RESULTS: SearchResult[] = [
  { id: 201, name: "ProTrader2026", figure: "hr-893-45.hd-195-19.ch-3030-82.lg-275-1408", online: true },
  { id: 202, name: "HabboQueen", figure: "hr-515-45.hd-600-10.ch-665-82.lg-710-82", online: false },
  { id: 203, name: "RetroKid", figure: "hr-165-45.hd-180-1.ch-210-82.lg-270-82", online: true },
  { id: 204, name: "PixelMaster99", figure: "hr-831-45.hd-190-14.ch-255-82.lg-280-82", online: false },
  { id: 205, name: "GoldTrader", figure: "hr-115-42.hd-180-1.ch-220-82.lg-285-82", online: true },
];

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "dm-1", type: "dm", participantIds: [1], unreadCount: 2,
    messages: [
      { id: 1, senderId: 1, message: "Hey, hast du den Thron noch?", timestamp: "10:30" },
      { id: 2, senderId: 999, message: "Ja klar, was bietest du?", timestamp: "10:31" },
      { id: 3, senderId: 1, message: "250 Credits?", timestamp: "10:32" },
      { id: 4, senderId: 999, message: "Mach 280 und wir haben einen Deal", timestamp: "10:33" },
      { id: 5, senderId: 1, message: "Okay, komme zu dir!", timestamp: "10:34" },
      { id: 6, senderId: 1, message: "Bin im Raum, wo bist du?", timestamp: "10:45" },
    ],
  },
  {
    id: "dm-3", type: "dm", participantIds: [3], unreadCount: 0,
    messages: [
      { id: 1, senderId: 3, message: "Schau mal mein neues Zimmer an!", timestamp: "09:15" },
      { id: 2, senderId: 999, message: "Oh nice, sieht mega aus!", timestamp: "09:16" },
      { id: 3, senderId: 3, message: "Danke! Hat ewig gedauert", timestamp: "09:17" },
    ],
  },
  {
    id: "dm-5", type: "dm", participantIds: [5], unreadCount: 1,
    messages: [{ id: 1, senderId: 5, message: "Wann bist du wieder online?", timestamp: "Gestern" }],
  },
  {
    id: "group-1", type: "group", participantIds: [1, 2, 3], groupName: "Trade Squad", unreadCount: 1,
    messages: [
      { id: 1, senderId: 1, senderName: "TradeMaster", message: "Leute, neuer Rare im Katalog!", timestamp: "08:00" },
      { id: 2, senderId: 2, senderName: "RareKing", message: "Wo?? Welcher?", timestamp: "08:01" },
      { id: 3, senderId: 3, senderName: "PixelQueen", message: "Omg ich muss den haben!", timestamp: "08:02" },
      { id: 4, senderId: 1, senderName: "TradeMaster", message: "Drachen Lampe V2, 1500 Credits", timestamp: "08:03" },
    ],
  },
];

const MOCK_ROOMS = [{ id: 1, name: "Robbys Chill Zone" }, { id: 2, name: "Trade Room #1" }, { id: 3, name: "Party Lounge" }, { id: 4, name: "Rares Showroom" }];
const LEVEL_TABLE = [{ level: 0, name: "Unbekannt", points: 0 }, { level: 1, name: "Bekannte", points: 50 }, { level: 2, name: "Kumpel", points: 150 }, { level: 3, name: "Guter Freund", points: 400 }, { level: 4, name: "Bester Freund", points: 800 }, { level: 5, name: "Seelenverwandt", points: 1500 }, { level: 6, name: "Unzertrennlich", points: 3000 }, { level: 7, name: "Legende", points: 5000 }];
const ACTION_TABLE = [{ action: "Chat im Raum", points: "+1", cooldown: "30s" }, { action: "Flüstern", points: "+2", cooldown: "30s" }, { action: "Handeln", points: "+10", cooldown: "-" }, { action: "Küssen (:kiss)", points: "+5", cooldown: "2min" }, { action: "Umarmen (:hug)", points: "+3", cooldown: "2min" }, { action: "Hauen (:hit)", points: "+1", cooldown: "2min" }, { action: "Private Nachricht", points: "+2", cooldown: "60s" }, { action: "Event (2v2)", points: "+25", cooldown: "-" }];
const STAT_ITEMS = [{ key: "chat" as const, label: "Chat", icon: MessageCircle, color: "text-blue-400" }, { key: "whisper" as const, label: "Flüstern", icon: Eye, color: "text-purple-400" }, { key: "trade" as const, label: "Handel", icon: Handshake, color: "text-amber-400" }, { key: "action" as const, label: "Aktionen", icon: Swords, color: "text-red-400" }, { key: "pm" as const, label: "Nachrichten", icon: Mail, color: "text-emerald-400" }, { key: "event" as const, label: "Events", icon: Trophy, color: "text-yellow-400" }];

// ─── Helpers ────────────────────────────────────

function renderStars(level: number) {
  return <span style={{ color: LEVEL_COLORS[level] || "#666", letterSpacing: 1 }}>{"★".repeat(level)}{"☆".repeat(7 - level)}</span>;
}

function renderProgress(points: number, level: number, nextPoints: number | null) {
  if (!nextPoints) return <span className="text-[9px] text-purple-400/60 font-medium">MAX LEVEL</span>;
  const prev = LEVEL_THRESHOLDS[level] || 0;
  const pct = ((points - prev) / (nextPoints - prev)) * 100;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: LEVEL_COLORS[level] || "#666" }} /></div>
      <span className="text-[9px] text-muted-foreground/50 shrink-0 tabular-nums">{points}/{nextPoints}</span>
    </div>
  );
}

function RelIcon({ s }: { s: number }) {
  if (s === 1) return <Heart className="w-3 h-3 shrink-0" fill="#e74c3c" style={{ color: "#e74c3c" }} />;
  if (s === 2) return <Smile className="w-3 h-3 shrink-0" style={{ color: "#f39c12" }} />;
  if (s === 3) return <span className="text-[11px] font-bold shrink-0" style={{ color: "#9b59b6" }}>♣</span>;
  return null;
}

const GROUP_COLORS = ["text-blue-400", "text-emerald-400", "text-amber-400", "text-pink-400", "text-purple-400", "text-cyan-400", "text-rose-400", "text-lime-400"];

// ─── Friend Item ────────────────────────────────

function FriendItem({ friend, selectMode, selected, hasUnread, onSelect, onClick, onRelClick, onRelChange }: {
  friend: Friend; selectMode: boolean; selected: boolean; hasUnread: boolean;
  onSelect: (id: number) => void; onClick: (id: number) => void; onRelClick: (id: number) => void; onRelChange: (id: number, status: number) => void;
}) {
  const [relOpen, setRelOpen] = useState(false);
  return (
    <div onClick={() => selectMode ? onSelect(friend.id) : onClick(friend.id)}
      className={`group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${selected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent/50 border-l-2 border-transparent"} ${!friend.online ? "opacity-60" : ""}`}>
      {selectMode && <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary border-primary" : "border-border/60"}`}>{selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}</div>}
      <div className="relative shrink-0">
        <img src={getAvatarHead(friend.figure)} alt={friend.name} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
        {friend.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold truncate">{friend.name}</span>
          {!relOpen && friend.relationshipStatus !== 0 && <RelIcon s={friend.relationshipStatus} />}
          {!relOpen ? (
            <button onClick={(e) => { e.stopPropagation(); setRelOpen(true); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"><Heart className="w-2.5 h-2.5 text-muted-foreground/50" /></button>
          ) : (
            <div className="flex items-center gap-0.5 ml-0.5" onClick={(e) => e.stopPropagation()}>
              {[{ s: 1, el: <Heart className="w-3 h-3" fill="#e74c3c" style={{ color: "#e74c3c" }} /> }, { s: 2, el: <Smile className="w-3 h-3" style={{ color: "#f39c12" }} /> }, { s: 3, el: <span className="text-[10px] font-bold" style={{ color: "#9b59b6" }}>♣</span> }, { s: 0, el: <X className="w-3 h-3 text-muted-foreground" /> }].map((o) => (
                <button key={o.s} onClick={() => { onRelChange(friend.id, o.s); setRelOpen(false); }} className={`p-0.5 rounded hover:bg-accent transition-colors ${friend.relationshipStatus === o.s ? "bg-accent" : ""}`}>{o.el}</button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{friend.online ? friend.motto : friend.lastAccess || "Offline"}</p>
        <button onClick={(e) => { e.stopPropagation(); onRelClick(friend.id); }} className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
          <span className="text-[9px]">{renderStars(friend.relLevel)}</span>
          <span className="text-[9px]" style={{ color: LEVEL_COLORS[friend.relLevel] }}>{LEVEL_NAMES[friend.relLevel]}</span>
        </button>
      </div>
      {hasUnread && !selectMode && <span className="w-2.5 h-2.5 rounded-full bg-foreground shrink-0" />}
    </div>
  );
}

// ─── Chat Bubble ────────────────────────────────

function ChatBubble({ message, isOwn, figure, isGroup }: { message: ChatMessage; isOwn: boolean; figure: string; isGroup?: boolean }) {
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      <img src={getAvatarHead(figure)} alt="" className="w-7 h-7 rounded-full border border-border/30 bg-muted/20 shrink-0 mt-0.5" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
      <div className={`max-w-[75%] rounded-xl px-3 py-1.5 ${isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
        {isGroup && !isOwn && message.senderName && <p className={`text-[10px] font-semibold mb-0.5 ${GROUP_COLORS[message.senderId % GROUP_COLORS.length]}`}>{message.senderName}</p>}
        <p className="text-[12px] break-words">{message.message}</p>
        <p className={`text-[9px] mt-0.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>{message.timestamp}</p>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[10px] text-muted-foreground/60">{name} tippt...</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

type ViewType = "list" | "chat" | "relationship" | "invite" | "newGroup";

import { FC } from 'react';

export const FriendsV2View: FC<{}> = () => {
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"online" | "offline" | "requests" | "search">("online");
  const [view, setView] = useState<ViewType>("list");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [relDetailFriendId, setRelDetailFriendId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRelInfo, setShowRelInfo] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteRoom, setInviteRoom] = useState("");
  const [inviteDate, setInviteDate] = useState("");
  const [inviteTime, setInviteTime] = useState("");
  const [invitePlanned, setInvitePlanned] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barOffset, setBarOffset] = useState(0);
  const [groupSelectIds, setGroupSelectIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const onlineFriends = useMemo(() => friends.filter((f) => f.online).sort((a, b) => a.name.localeCompare(b.name)), [friends]);
  const offlineFriends = useMemo(() => friends.filter((f) => !f.online).sort((a, b) => a.name.localeCompare(b.name)), [friends]);
  const filteredList = useMemo(() => { const list = tab === "online" ? onlineFriends : offlineFriends; if (!search) return list; const q = search.toLowerCase(); return list.filter((f) => f.name.toLowerCase().includes(q)); }, [tab, onlineFriends, offlineFriends, search]);
  const filteredSearchResults = useMemo(() => { if (!userSearch) return SEARCH_RESULTS; const q = userSearch.toLowerCase(); return SEARCH_RESULTS.filter((r) => r.name.toLowerCase().includes(q)); }, [userSearch]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) || null, [threads, activeThreadId]);
  const chatPartnerFriend = useMemo(() => { if (!activeThread || activeThread.type !== "dm") return null; return friends.find((f) => f.id === activeThread.participantIds[0]) || null; }, [activeThread, friends]);
  const relFriend = useMemo(() => friends.find((f) => f.id === relDetailFriendId) || null, [friends, relDetailFriendId]);
  const selectedFriendNames = useMemo(() => selectedIds.map((id) => friends.find((f) => f.id === id)?.name).filter(Boolean) as string[], [selectedIds, friends]);
  const totalUnread = useMemo(() => threads.reduce((s, t) => s + t.unreadCount, 0), [threads]);
  const unreadByFriend = useMemo(() => { const m = new Map<number, number>(); for (const t of threads) { if (t.unreadCount > 0 && t.type === "dm") m.set(t.participantIds[0], t.unreadCount); } return m; }, [threads]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeThread?.messages.length, typing]);

  const getFriendById = useCallback((id: number) => friends.find((f) => f.id === id), [friends]);

  const toggleSelect = useCallback((id: number) => { setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }, []);

  const openChat = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setView("chat");
    setThreads((p) => p.map((t) => t.id === threadId ? { ...t, unreadCount: 0 } : t));
  }, []);

  const openDmChat = useCallback((friendId: number) => {
    const tid = `dm-${friendId}`;
    setThreads((prev) => {
      if (prev.find((t) => t.id === tid)) return prev.map((t) => t.id === tid ? { ...t, unreadCount: 0 } : t);
      return [...prev, { id: tid, type: "dm" as const, participantIds: [friendId], messages: [], unreadCount: 0 }];
    });
    setActiveThreadId(tid);
    setView("chat");
  }, []);

  const closeThread = useCallback((threadId: string) => {
    setThreads((p) => p.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) {
      const remaining = threads.filter((t) => t.id !== threadId);
      if (remaining.length > 0) { setActiveThreadId(remaining[0].id); } else { setView("list"); setActiveThreadId(null); }
    }
  }, [activeThreadId, threads]);

  const sendMessage = useCallback(() => {
    if (!messageText.trim() || !activeThreadId) return;
    const now = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = { id: Date.now(), senderId: MY_USER.id, senderName: MY_USER.name, message: messageText.trim(), timestamp: now };
    setThreads((p) => p.map((t) => t.id === activeThreadId ? { ...t, messages: [...t.messages, newMsg] } : t));
    setMessageText("");

    // Mock reply (typing indicator + auto response)
    const thread = threads.find((t) => t.id === activeThreadId);
    if (thread?.type === "dm") {
      const fId = thread.participantIds[0];
      const replies = MOCK_REPLIES[fId];
      if (replies) {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          const reply = replies[Math.floor(Math.random() * replies.length)];
          const friend = friends.find((f) => f.id === fId);
          const replyMsg: ChatMessage = { id: Date.now() + 1, senderId: fId, message: reply, timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
          setThreads((p) => p.map((t) => t.id === `dm-${fId}` ? { ...t, messages: [...t.messages, replyMsg] } : t));
          if (friend) toast(`Neue Nachricht von ${friend.name}`, { description: reply, duration: 3000 });
        }, 1500 + Math.random() * 1000);
      }
    }
  }, [messageText, activeThreadId, threads, friends]);

  const handleAcceptRequest = useCallback((id: number) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    setRequests((p) => p.filter((r) => r.id !== id));
    setFriends((p) => [...p, { id: req.id, name: req.name, figure: req.figure, motto: "", online: false, lastAccess: "Gerade hinzugefügt", followingAllowed: true, relationshipStatus: 0, relLevel: 0, relPoints: 0, relNextPoints: 50, relStats: { chat: 0, whisper: 0, trade: 0, action: 0, pm: 0, event: 0 } }]);
    toast(`${req.name} ist jetzt dein Freund!`);
  }, [requests]);

  const handleRejectRequest = useCallback((id: number) => { setRequests((p) => p.filter((r) => r.id !== id)); }, []);
  const handleRejectAll = useCallback(() => { setRequests([]); }, []);
  const handleRemoveFriends = useCallback(() => { setFriends((p) => p.filter((f) => !selectedIds.includes(f.id))); setThreads((p) => p.filter((t) => !t.participantIds.some((pid) => selectedIds.includes(pid)) || t.type === "group")); setSelectedIds([]); setSelectMode(false); setShowRemoveConfirm(false); }, [selectedIds]);
  const handleRelChange = useCallback((id: number, status: number) => { setFriends((p) => p.map((f) => f.id === id ? { ...f, relationshipStatus: status } : f)); }, []);
  const exitSelectMode = useCallback(() => { setSelectMode(false); setSelectedIds([]); }, []);

  const createGroupChat = useCallback(() => {
    if (groupSelectIds.length < 2 || !groupName.trim()) return;
    const newThread: ChatThread = { id: `group-${Date.now()}`, type: "group", participantIds: groupSelectIds, groupName: groupName.trim(), messages: [], unreadCount: 0 };
    setThreads((p) => [...p, newThread]);
    setActiveThreadId(newThread.id);
    setView("chat");
    setGroupSelectIds([]);
    setGroupName("");
  }, [groupSelectIds, groupName]);

  const TABS = [
    { id: "online" as const, label: "Online", count: onlineFriends.length },
    { id: "offline" as const, label: "Offline", count: offlineFriends.length },
    { id: "requests" as const, label: "Anfragen", count: requests.length },
    { id: "search" as const, label: "Suche", count: null },
  ];

  const FRIEND_BAR_COUNT = 3;

  // Thread display helper
  const getThreadDisplay = (thread: ChatThread) => {
    if (thread.type === "group") return { name: thread.groupName || "Gruppe", figures: thread.participantIds.map((id) => getFriendById(id)?.figure || "").filter(Boolean) };
    const f = getFriendById(thread.participantIds[0]);
    return { name: f?.name || "?", figures: f ? [f.figure] : [] };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex flex-col items-center justify-center min-h-screen gap-6" style={{ background: "radial-gradient(ellipse at center, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 70%)" }}>
        <Badge variant="outline" className="absolute top-4 right-4 text-[10px] text-muted-foreground/50">Prototyp</Badge>

        {/* ═══ FRIEND BAR ═══ */}
        <div className="flex items-center gap-1.5">
          <button className="p-1 rounded-md border border-border/40 text-muted-foreground hover:bg-accent disabled:opacity-25 transition-colors" disabled={barOffset <= 0} onClick={() => setBarOffset((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: FRIEND_BAR_COUNT }, (_, i) => {
            const f = onlineFriends[barOffset + i];
            if (!f) return <div key={i} className="w-[120px] h-10 rounded-lg border border-dashed border-border/30 flex items-center justify-center"><UserPlus className="w-4 h-4 text-muted-foreground/30" /></div>;
            const hasUnread = unreadByFriend.has(f.id);
            return (
              <button key={f.id} onClick={() => { setSheetOpen(true); setTimeout(() => openDmChat(f.id), 100); }}
                className="relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors w-[120px]">
                <img src={getAvatarHead(f.figure)} alt={f.name} className="w-8 h-8 rounded-full" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                <span className="text-[11px] font-medium truncate">{f.name}</span>
                {hasUnread && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />}
              </button>
            );
          })}
          <button className="p-1 rounded-md border border-border/40 text-muted-foreground hover:bg-accent disabled:opacity-25 transition-colors" disabled={barOffset + FRIEND_BAR_COUNT >= onlineFriends.length} onClick={() => setBarOffset((p) => p + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* ═══ OPEN BUTTON ═══ */}
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) { setView("list"); setSelectMode(false); setSelectedIds([]); } }}>
          <SheetTrigger asChild>
            <Button className="relative gap-2" variant="outline" size="lg" onClick={() => setSheetOpen(true)}>
              <Users className="w-5 h-5" />Freunde öffnen
              {totalUnread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">{totalUnread}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" showCloseButton={false} className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">

            {/* ═══ VIEW: LIST ═══ */}
            {view === "list" && (<>
              <div className="shrink-0 px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Users className="w-5 h-5" /><h2 className="text-base font-bold">Freunde</h2><Badge variant="secondary" className="text-[10px] h-5">{onlineFriends.length} online</Badge></div>
                  <div className="flex items-center gap-1">
                    {totalUnread > 0 && !selectMode && <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { const t = threads.find((t) => t.unreadCount > 0); if (t) openChat(t.id); }}><MessageCircle className="w-3 h-3" />{totalUnread}</Button>}
                    <Tooltip><TooltipTrigger asChild><Button variant={selectMode ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}><CheckSquare className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent className="text-[10px]">{selectMode ? "Auswahl beenden" : "Auswählen"}</TooltipContent></Tooltip>
                  </div>
                </div>
                {tab !== "search" && <div className="relative mb-2"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" /><Input placeholder="Freunde suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[12px]" /></div>}
                <div className="flex gap-1">
                  {TABS.map((t) => (<button key={t.id} onClick={() => { setTab(t.id); setSearch(""); setUserSearch(""); }} className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50"}`}>{t.label}{t.count !== null ? ` (${t.count})` : ""}</button>))}
                </div>
              </div>
              <Separator />
              <ScrollArea className="flex-1 min-h-0">
                {tab === "search" ? (
                  <div className="p-3 flex flex-col gap-2">
                    <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" /><Input placeholder="Nutzer suchen..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-8 h-8 text-[12px]" /></div>
                    <div className="divide-y divide-border/20">
                      {filteredSearchResults.map((r) => {
                        const isSent = sentRequests.includes(r.id);
                        const isAlreadyFriend = friends.some((f) => f.id === r.id);
                        return (
                          <div key={r.id} className="flex items-center gap-2.5 py-2">
                            <div className="relative shrink-0"><img src={getAvatarHead(r.figure)} alt={r.name} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />{r.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />}</div>
                            <div className="flex-1 min-w-0"><span className="text-[12px] font-semibold block truncate">{r.name}</span><span className="text-[10px] text-muted-foreground">{r.online ? "Online" : "Offline"}</span></div>
                            {isAlreadyFriend ? <Badge variant="secondary" className="text-[9px] h-5">Freund</Badge>
                              : isSent ? <Badge variant="outline" className="text-[9px] h-5 text-emerald-500">Gesendet ✓</Badge>
                              : <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setSentRequests((p) => [...p, r.id]); toast(`Anfrage an ${r.name} gesendet!`); }}><UserPlus className="w-3 h-3" />Hinzufügen</Button>}
                          </div>
                        );
                      })}
                      {filteredSearchResults.length === 0 && <div className="flex flex-col items-center py-8 text-muted-foreground"><Search className="w-6 h-6 opacity-20 mb-1" /><p className="text-[11px]">Keine Nutzer gefunden</p></div>}
                    </div>
                  </div>
                ) : tab === "requests" ? (
                  <div>
                    {requests.length === 0 ? <div className="flex flex-col items-center py-12 text-muted-foreground"><UserPlus className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">Keine Anfragen</p></div> : (<>
                      <div className="divide-y divide-border/30">{requests.map((r) => (
                        <div key={r.id} className="flex items-center gap-2.5 px-3 py-2">
                          <img src={getAvatarHead(r.figure)} alt={r.name} className="w-9 h-9 rounded-full border border-border/40 bg-muted/20 shrink-0" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                          <div className="flex-1 min-w-0"><span className="text-[12px] font-semibold truncate block">{r.name}</span><span className="text-[10px] text-muted-foreground">Möchte dein Freund sein</span></div>
                          <div className="flex gap-1 shrink-0"><Button variant="outline" size="icon" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleAcceptRequest(r.id)}><Check className="w-3 h-3" /></Button><Button variant="outline" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10" onClick={() => handleRejectRequest(r.id)}><X className="w-3 h-3" /></Button></div>
                        </div>
                      ))}</div>
                      <div className="px-3 py-2"><Button variant="outline" size="sm" className="w-full h-7 text-[10px] text-red-400" onClick={handleRejectAll}>Alle ablehnen</Button></div>
                    </>)}
                  </div>
                ) : (
                  <div>{filteredList.length === 0 ? <div className="flex flex-col items-center py-12 text-muted-foreground"><Users className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">{search ? "Nichts gefunden" : tab === "online" ? "Keine Freunde online" : "Keine Offline-Freunde"}</p></div> : (
                    <div className="divide-y divide-border/20">{filteredList.map((f) => <FriendItem key={f.id} friend={f} selectMode={selectMode} selected={selectedIds.includes(f.id)} hasUnread={unreadByFriend.has(f.id)} onSelect={toggleSelect} onClick={(id) => openDmChat(id)} onRelClick={(id) => { setRelDetailFriendId(id); setView("relationship"); }} onRelChange={handleRelChange} />)}</div>
                  )}</div>
                )}
              </ScrollArea>
              {selectMode && selectedIds.length > 0 && (<><Separator /><div className="shrink-0 px-3 py-2 flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{selectedIds.length} ausgewählt</span><div className="ml-auto flex gap-1"><Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { setView("invite"); setInviteMessage(""); setInviteRoom(""); setInviteDate(""); setInviteTime(""); setInvitePlanned(false); }}><DoorOpen className="w-3 h-3" />Einladen</Button><Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-red-400" onClick={() => setShowRemoveConfirm(true)}><UserMinus className="w-3 h-3" />Entfernen</Button></div></div></>)}
            </>)}

            {/* ═══ VIEW: CHAT ═══ */}
            {view === "chat" && (<>
              <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setView("list"); setActiveThreadId(null); }} className="p-1 rounded hover:bg-accent transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                  {activeThread?.type === "dm" && chatPartnerFriend && (<>
                    <img src={getAvatarHead(chatPartnerFriend.figure)} alt={chatPartnerFriend.name} className="w-8 h-8 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-[13px] font-bold">{chatPartnerFriend.name}</span>{chatPartnerFriend.online && <span className="w-2 h-2 rounded-full bg-emerald-500" />}</div>
                      <p className="text-[10px] text-muted-foreground truncate">{chatPartnerFriend.motto}</p>
                      <div className="flex items-center gap-1"><span className="text-[8px]">{renderStars(chatPartnerFriend.relLevel)}</span><span className="text-[8px]" style={{ color: LEVEL_COLORS[chatPartnerFriend.relLevel] }}>{LEVEL_NAMES[chatPartnerFriend.relLevel]}</span></div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {chatPartnerFriend.followingAllowed && chatPartnerFriend.online && <Tooltip><TooltipTrigger asChild><button className="p-1.5 rounded hover:bg-accent"><Navigation className="w-3.5 h-3.5 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Folgen</TooltipContent></Tooltip>}
                      <Tooltip><TooltipTrigger asChild><button className="p-1.5 rounded hover:bg-accent"><User className="w-3.5 h-3.5 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Profil</TooltipContent></Tooltip>
                    </div>
                  </>)}
                  {activeThread?.type === "group" && (<>
                    <div className="flex -space-x-2">{activeThread.participantIds.slice(0, 3).map((pid) => { const f = getFriendById(pid); return f ? <img key={pid} src={getAvatarHead(f.figure)} alt={f.name} className="w-9 h-9 rounded-full border-2 border-background bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} /> : null; })}</div>
                    <div className="flex-1 min-w-0"><span className="text-[13px] font-bold">{activeThread.groupName}</span><p className="text-[10px] text-muted-foreground">{activeThread.participantIds.length} Teilnehmer</p></div>
                  </>)}
                </div>
                {/* Thread bar */}
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                  {threads.map((t) => {
                    const d = getThreadDisplay(t);
                    const isActive = t.id === activeThreadId;
                    return (
                      <Tooltip key={t.id}><TooltipTrigger asChild>
                        <div className={`relative shrink-0 group/thread ${isActive ? "ring-2 ring-primary rounded-full" : "opacity-60 hover:opacity-100"}`}>
                          <button onClick={() => openChat(t.id)}>
                            {t.type === "dm" && d.figures[0] ? <img src={getAvatarHead(d.figures[0])} alt={d.name} className="w-9 h-9 rounded-full border border-border/30 bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} /> : <div className="w-9 h-9 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center"><UsersRound className="w-4.5 h-4.5 text-muted-foreground" /></div>}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); closeThread(t.id); }} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border/40 items-center justify-center hidden group-hover/thread:flex"><X className="w-2.5 h-2.5" /></button>
                          {t.unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-[12px] rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center px-0.5">{t.unreadCount}</span>}
                        </div>
                      </TooltipTrigger><TooltipContent className="text-[10px]">{d.name}</TooltipContent></Tooltip>
                    );
                  })}
                  <Tooltip><TooltipTrigger asChild><button onClick={() => { setView("newGroup"); setGroupSelectIds([]); setGroupName(""); }} className="w-9 h-9 rounded-full border border-dashed border-border/40 flex items-center justify-center hover:bg-accent/30 transition-colors"><Plus className="w-4 h-4 text-muted-foreground/50" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Gruppenchat</TooltipContent></Tooltip>
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col gap-2 p-3">
                  {activeThread && activeThread.messages.length > 0 ? activeThread.messages.map((msg) => {
                    const isOwn = msg.senderId === MY_USER.id;
                    let figure = MY_USER.figure;
                    if (!isOwn) { const f = getFriendById(msg.senderId); figure = f?.figure || ""; }
                    return <ChatBubble key={msg.id} message={msg} isOwn={isOwn} figure={figure} isGroup={activeThread.type === "group"} />;
                  }) : <div className="flex flex-col items-center py-12 text-muted-foreground"><MessageCircle className="w-8 h-8 opacity-20 mb-2" /><p className="text-[12px]">Noch keine Nachrichten</p></div>}
                  {typing && chatPartnerFriend && <TypingIndicator name={chatPartnerFriend.name} />}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="shrink-0 p-3 border-t border-border/30"><div className="flex gap-2"><Input placeholder="Nachricht..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="text-[12px] h-9" /><Button size="icon" className="h-9 w-9 shrink-0" disabled={!messageText.trim()} onClick={sendMessage}><Send className="w-4 h-4" /></Button></div></div>
            </>)}

            {/* ═══ VIEW: NEW GROUP ═══ */}
            {view === "newGroup" && (<>
              <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30"><div className="flex items-center gap-2"><button onClick={() => setView("chat")} className="p-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" /></button><UsersRound className="w-4 h-4" /><span className="text-[13px] font-bold">Gruppenchat erstellen</span></div></div>
              <div className="shrink-0 px-3 pt-3"><Input placeholder="Gruppenname..." value={groupName} onChange={(e) => setGroupName(e.target.value)} className="text-[12px] h-8 mb-2" /><p className="text-[10px] text-muted-foreground mb-1">Freunde auswählen (min. 2):</p></div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="divide-y divide-border/20">{onlineFriends.concat(offlineFriends).map((f) => {
                  const sel = groupSelectIds.includes(f.id);
                  return (<div key={f.id} onClick={() => setGroupSelectIds((p) => sel ? p.filter((x) => x !== f.id) : [...p, f.id])} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${sel ? "bg-primary/10" : "hover:bg-accent/50"} ${!f.online ? "opacity-60" : ""}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel ? "bg-primary border-primary" : "border-border/60"}`}>{sel && <Check className="w-2.5 h-2.5 text-primary-foreground" />}</div>
                    <img src={getAvatarHead(f.figure)} alt={f.name} className="w-8 h-8 rounded-full border border-border/40 bg-muted/20" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                    <span className="text-[12px] font-medium">{f.name}</span>
                    {f.online && <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />}
                  </div>);
                })}</div>
              </ScrollArea>
              <div className="shrink-0 p-3 border-t border-border/30"><Button className="w-full h-9 text-[12px] gap-1" disabled={groupSelectIds.length < 2 || !groupName.trim()} onClick={createGroupChat}><UsersRound className="w-3.5 h-3.5" />Chat starten ({groupSelectIds.length} ausgewählt)</Button></div>
            </>)}

            {/* ═══ VIEW: RELATIONSHIP ═══ */}
            {view === "relationship" && relFriend && (<>
              <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30"><div className="flex items-center gap-2"><button onClick={() => setView("list")} className="p-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" /></button><span className="text-[13px] font-bold">Beziehung</span><div className="ml-auto"><Tooltip><TooltipTrigger asChild><button className={`p-1.5 rounded-md transition-colors ${showRelInfo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`} onClick={() => setShowRelInfo((p) => !p)}><Info className="w-3.5 h-3.5" /></button></TooltipTrigger><TooltipContent className="text-[10px]">Info</TooltipContent></Tooltip></div></div></div>
              <ScrollArea className="flex-1 min-h-0"><div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="flex flex-col items-center gap-1"><img src={getAvatarHead(MY_USER.figure)} alt={MY_USER.name} className="w-14 h-14 rounded-xl border border-border/40 bg-muted/10" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} /><span className="text-[11px] text-muted-foreground">{MY_USER.name}</span></div>
                  <div className="flex flex-col items-center gap-1"><div className="text-lg">{renderStars(relFriend.relLevel)}</div><span className="text-xs font-semibold" style={{ color: LEVEL_COLORS[relFriend.relLevel] }}>{LEVEL_NAMES[relFriend.relLevel]}</span><span className="text-[10px] text-muted-foreground/50">Level {relFriend.relLevel}</span></div>
                  <div className="flex flex-col items-center gap-1"><img src={getAvatarHead(relFriend.figure)} alt={relFriend.name} className="w-14 h-14 rounded-xl border border-border/40 bg-muted/10" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} /><span className="text-[11px] text-muted-foreground">{relFriend.name}</span></div>
                </div>
                <div className="px-2">{renderProgress(relFriend.relPoints, relFriend.relLevel, relFriend.relNextPoints)}</div>
                <div className="grid grid-cols-3 gap-2">{STAT_ITEMS.map((stat) => { const Icon = stat.icon; return (<div key={stat.key} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/10 border border-border/30"><Icon className={`w-4 h-4 ${stat.color}`} /><span className="text-sm font-semibold tabular-nums">{relFriend.relStats[stat.key].toLocaleString()}</span><span className="text-[9px] text-muted-foreground">{stat.label}</span></div>); })}</div>
                <div className="flex items-center justify-center p-3 rounded-xl bg-muted/10 border border-border/30"><span className="text-xs text-muted-foreground">Gesamt: </span><span className="text-sm font-bold ml-1.5">{relFriend.relPoints.toLocaleString()} Punkte</span></div>
                {showRelInfo && (<div className="flex flex-col gap-3 mt-1">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10"><p className="text-[11px] text-muted-foreground leading-relaxed">Das Beziehungssystem trackt automatisch deine Interaktionen mit Freunden. Je mehr ihr miteinander chattet, handelt und interagiert, desto stärker wird eure Bindung.</p></div>
                  <div className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground/70">Punkte pro Aktion</span><div className="rounded-xl border border-border/30 overflow-hidden text-[10px]"><div className="grid grid-cols-3 bg-muted/20 font-semibold text-muted-foreground"><div className="px-2.5 py-1.5">Aktion</div><div className="px-2.5 py-1.5">Punkte</div><div className="px-2.5 py-1.5">Cooldown</div></div>{ACTION_TABLE.map((r, i) => (<div key={i} className="grid grid-cols-3 border-t border-border/20"><div className="px-2.5 py-1.5 text-muted-foreground">{r.action}</div><div className="px-2.5 py-1.5 text-emerald-500 font-medium">{r.points}</div><div className="px-2.5 py-1.5 text-muted-foreground/50">{r.cooldown}</div></div>))}</div></div>
                  <div className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground/70">Level-Stufen</span><div className="rounded-xl border border-border/30 overflow-hidden text-[10px]"><div className="grid grid-cols-3 bg-muted/20 font-semibold text-muted-foreground"><div className="px-2.5 py-1.5">Level</div><div className="px-2.5 py-1.5">Titel</div><div className="px-2.5 py-1.5">Punkte</div></div>{LEVEL_TABLE.map((r) => (<div key={r.level} className="grid grid-cols-3 border-t border-border/20"><div className="px-2.5 py-1.5" style={{ color: LEVEL_COLORS[r.level] }}>{"★".repeat(r.level)}{"☆".repeat(7 - r.level)}</div><div className="px-2.5 py-1.5 text-muted-foreground">{r.name}</div><div className="px-2.5 py-1.5 text-muted-foreground/50">{r.points.toLocaleString()}</div></div>))}</div></div>
                </div>)}
              </div></ScrollArea>
            </>)}

            {/* ═══ VIEW: INVITE ═══ */}
            {view === "invite" && (<>
              <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border/30"><div className="flex items-center gap-2"><button onClick={() => setView("list")} className="p-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" /></button><DoorOpen className="w-4 h-4" /><span className="text-[13px] font-bold">Raum-Einladung</span></div></div>
              <ScrollArea className="flex-1 min-h-0"><div className="p-4 flex flex-col gap-4">
                <div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Eingeladen ({selectedIds.length})</label><div className="flex flex-wrap gap-1.5">{selectedIds.map((id) => { const f = getFriendById(id); if (!f) return null; return (<div key={id} className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-muted/30 border border-border/30"><img src={getAvatarHead(f.figure)} alt={f.name} className="w-5 h-5 rounded-full" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} /><span className="text-[11px]">{f.name}</span><button onClick={() => setSelectedIds((p) => p.filter((x) => x !== id))}><X className="w-3 h-3 text-muted-foreground/50 hover:text-foreground" /></button></div>); })}</div></div>
                <div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Raum</label><Select value={inviteRoom} onValueChange={setInviteRoom}><SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Raum auswählen..." /></SelectTrigger><SelectContent>{MOCK_ROOMS.map((r) => <SelectItem key={r.id} value={String(r.id)} className="text-[12px]">{r.name}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Nachricht</label><Input placeholder="Kommt in meinen Raum!" value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} className="text-[12px] h-9" /></div>
                <button onClick={() => setInvitePlanned((p) => !p)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full ${invitePlanned ? "border-primary bg-primary/5" : "border-border/40 hover:bg-accent/30"}`}><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-[12px] font-medium">Einladung planen</span><div className={`ml-auto w-8 h-4 rounded-full transition-colors flex items-center ${invitePlanned ? "bg-primary justify-end" : "bg-muted/50 justify-start"}`}><div className="w-3.5 h-3.5 rounded-full bg-white shadow mx-0.5" /></div></button>
                {invitePlanned && <div className="grid grid-cols-2 gap-2"><div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Datum</label><Input type="date" value={inviteDate} onChange={(e) => setInviteDate(e.target.value)} className="text-[12px] h-9" /></div><div><label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Uhrzeit</label><Input type="time" value={inviteTime} onChange={(e) => setInviteTime(e.target.value)} className="text-[12px] h-9" /></div></div>}
              </div></ScrollArea>
              <div className="shrink-0 p-3 border-t border-border/30 flex gap-2"><Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={() => setView("list")}>Abbrechen</Button><Button className="flex-1 h-9 text-[12px] gap-1" disabled={!inviteRoom || selectedIds.length === 0} onClick={() => { toast("Einladung gesendet!"); setView("list"); setSelectMode(false); setSelectedIds([]); }}>{invitePlanned ? <><Clock className="w-3.5 h-3.5" />Planen</> : <><Send className="w-3.5 h-3.5" />Jetzt einladen</>}</Button></div>
            </>)}

          </SheetContent>
        </Sheet>

        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Freunde entfernen?</AlertDialogTitle><AlertDialogDescription>Möchtest du <span className="font-semibold text-foreground">{selectedFriendNames.join(", ")}</span> wirklich entfernen?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleRemoveFriends}>Entfernen</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </TooltipProvider>
  );
}
