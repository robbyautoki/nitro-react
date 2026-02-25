
import { useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  MessageSquare,
  Users,
  AlertTriangle,
  Home,
  Clock,
  Eye,
  Send,
  Ban,
  Gavel,
  FileText,
  X,
  Layers,
  Monitor,
  CircleDot,
  ChevronRight,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════

const DEMO_ROOM = { id: 4821, name: "Robbys Chill Lounge", owner: "Robby", ownerId: 1, usersInRoom: 8, ownerInRoom: true };

const DEMO_CHATLOG = [
  { time: "14:32:01", user: "Robby", userId: 1, message: "Hey willkommen in meinem Raum!" },
  { time: "14:32:15", user: "xShadow", userId: 2, message: "Danke, cooler Raum!" },
  { time: "14:32:28", user: "Luna99", userId: 3, message: "Hat jemand Lust auf ein Spiel?" },
  { time: "14:32:45", user: "xShadow", userId: 2, message: "Klar, was spielen wir?" },
  { time: "14:33:02", user: "DarkKnight", userId: 4, message: "ich bin dabei" },
  { time: "14:33:18", user: "Robby", userId: 1, message: "Wir könnten Freeze spielen" },
  { time: "14:33:35", user: "Luna99", userId: 3, message: "Oh ja! Wo ist der Eingang?" },
  { time: "14:33:52", user: "xShadow", userId: 2, message: "Rechts hinten bei den Bäumen" },
  { time: "14:34:10", user: "Noob123", userId: 5, message: "HAHAHA IHR SEID ALLE NOOBS" },
  { time: "14:34:15", user: "Noob123", userId: 5, message: "KOMMT KÄMPFEN WENN IHR EUCH TRAUT" },
];

const DEMO_USER = {
  userId: 5, userName: "Noob123", online: true, cfhCount: 3, abusiveCfhCount: 1,
  cautionCount: 2, banCount: 1, lastSanctionTime: "2026-02-20 18:30", tradingLockCount: 0,
  tradingExpiryDate: "Keine", minutesSinceLastLogin: 12, lastPurchaseDate: "2026-02-24 09:15",
  primaryEmailAddress: "n***3@gmail.com", identityRelatedBanCount: 0, registrationAge: "45 Tage",
  userClassification: "Aggressive",
};

const USER_PROPS: [string, string][] = [
  ["Username", DEMO_USER.userName],
  ["CFH Meldungen", String(DEMO_USER.cfhCount)],
  ["Missbr. CFH", String(DEMO_USER.abusiveCfhCount)],
  ["Verwarnungen", String(DEMO_USER.cautionCount)],
  ["Bans", String(DEMO_USER.banCount)],
  ["Letzte Sanktion", DEMO_USER.lastSanctionTime],
  ["Trade-Sperren", String(DEMO_USER.tradingLockCount)],
  ["Trade-Ablauf", DEMO_USER.tradingExpiryDate],
  ["Letzter Login", `vor ${DEMO_USER.minutesSinceLastLogin} Min.`],
  ["Letzter Kauf", DEMO_USER.lastPurchaseDate],
  ["E-Mail", DEMO_USER.primaryEmailAddress],
  ["IP-Bans", String(DEMO_USER.identityRelatedBanCount)],
  ["Registriert", DEMO_USER.registrationAge],
  ["Klassifizierung", DEMO_USER.userClassification],
];

const SANCTIONS = ["Alert", "Mute 1h", "Ban 18h", "Ban 7 Tage", "Ban 30 Tage (1)", "Ban 30 Tage (2)", "Ban 100 Jahre", "Ban Avatar 100J", "Kick", "Trade-Sperre 1W", "Trade-Sperre perm.", "Nachricht"];
const CFH_TOPICS = ["Beleidigung", "Spam / Flooding", "Sexuelle Inhalte", "Betrug / Scam", "Rassismus", "Accountdiebstahl", "Werbung", "Sonstiges"];

const DEMO_TICKETS = [
  { id: 1001, cat: 3, reporter: "Luna99", reported: "Noob123", msg: "Beleidigt mich ständig und spammt den Chat", ageMs: 120000, state: "open" as const },
  { id: 1002, cat: 5, reporter: "xShadow", reported: "DarkKnight", msg: "Versucht meinen Account zu übernehmen", ageMs: 340000, state: "open" as const },
  { id: 1003, cat: 1, reporter: "Stella", reported: "xShadow", msg: "Rassistische Äußerungen im Raum", ageMs: 600000, state: "picked" as const },
  { id: 1004, cat: 7, reporter: "MaxPower", reported: "Luna99", msg: "Wirbt für anderen Server", ageMs: 900000, state: "picked" as const },
];

const ROOM_VISITS = [
  { time: "14:30", room: "Robbys Chill Lounge", id: 4821 },
  { time: "14:15", room: "Casino Royale", id: 3320 },
  { time: "13:58", room: "Willkommensraum", id: 1 },
  { time: "13:42", room: "Strandbar", id: 2210 },
  { time: "13:20", room: "Robbys Chill Lounge", id: 4821 },
];

// ═══════════════════════════════════════════════════
// PANEL HEADER (reusable)
// ═══════════════════════════════════════════════════

function PanelHeader({ icon: Icon, title, right }: { icon: React.ElementType; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2 border-b">
      <span className="text-xs font-semibold flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" /> {title}
      </span>
      {right}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════

type ActivePanel = "room" | "chatlog" | "user" | "tickets" | null;

function ModToolsMainPanel() {
  const [active, setActive] = useState<ActivePanel>(null);
  const toggle = (p: ActivePanel) => setActive(v => v === p ? null : p);

  return (
    <div className="space-y-2">
      <Frame>
        <FramePanel className="p-0!">
          <PanelHeader icon={Shield} title="Mod Tools" />
          <div className="p-2 space-y-1">
            {([
              ["room", Home, "Room Tool"],
              ["chatlog", MessageSquare, "Chatlog Tool"],
              ["user", Users, `User: ${DEMO_USER.userName}`],
              ["tickets", AlertTriangle, "Report Tool"],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => toggle(key as ActivePanel)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${active === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </FramePanel>
      </Frame>

      {active === "room" && <RoomToolPanel />}
      {active === "chatlog" && <ChatlogPanel />}
      {active === "user" && <UserToolPanel />}
      {active === "tickets" && <TicketsPanel />}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ROOM TOOL
// ═══════════════════════════════════════════════════

function RoomToolPanel() {
  const [kickAll, setKickAll] = useState(false);
  const [lockRoom, setLockRoom] = useState(false);
  const [changeName, setChangeName] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={Home} title={`Room Info: ${DEMO_ROOM.name}`} />
        <div className="px-3.5 py-2.5 space-y-2.5">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1">
              {([
                ["Raumbesitzer", DEMO_ROOM.owner, true],
                ["User im Raum", String(DEMO_ROOM.usersInRoom), false],
                ["Besitzer anwesend", DEMO_ROOM.ownerInRoom ? "Ja" : "Nein", false],
              ] as const).map(([label, val, isLink]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${isLink ? "text-primary cursor-pointer hover:underline" : ""}`}>{val}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"><Eye className="size-3" />Besuchen</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"><MessageSquare className="size-3" />Chatlog</Button>
            </div>
          </div>

          <div className="rounded border bg-muted/30 p-2 space-y-1.5">
            {([
              [kickAll, setKickAll, "kick", "Alle User kicken"],
              [lockRoom, setLockRoom, "lock", "Türklingel aktivieren"],
              [changeName, setChangeName, "name", "Raumname ändern"],
            ] as const).map(([val, setter, id, label]) => (
              <div key={id} className="flex items-center gap-2">
                <Checkbox id={id} checked={val as boolean} onCheckedChange={(v) => (setter as (v: boolean) => void)(!!v)} />
                <label htmlFor={id} className="text-xs cursor-pointer">{label}</label>
              </div>
            ))}
          </div>

          <Textarea placeholder="Nachricht an die User im Raum..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[50px] text-xs" />

          <div className="flex gap-1.5">
            <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1"><AlertTriangle className="size-3" />Verwarnung</Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"><Send className="size-3" />Nur Hinweis</Button>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════
// CHATLOG
// ═══════════════════════════════════════════════════

function ChatlogPanel() {
  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={MessageSquare} title={`Chatlog: ${DEMO_ROOM.name}`} right={
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2"><Eye className="size-2.5" />Besuchen</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2"><Shield className="size-2.5" />Room Tools</Button>
          </div>
        } />
        <ScrollArea className="h-[240px]">
          <div className="grid grid-cols-[56px_70px_1fr] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
            <span>Zeit</span><span>User</span><span>Nachricht</span>
          </div>
          {DEMO_CHATLOG.map((e, i) => (
            <div key={i} className={`grid grid-cols-[56px_70px_1fr] text-[11px] px-3.5 py-1 border-b border-border/30 ${e.user === "Noob123" ? "bg-red-500/8" : i % 2 === 0 ? "bg-muted/10" : ""}`}>
              <span className="text-muted-foreground tabular-nums">{e.time}</span>
              <span className="font-medium text-primary cursor-pointer hover:underline truncate">{e.user}</span>
              <span className="break-all">{e.message}</span>
            </div>
          ))}
        </ScrollArea>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════
// USER TOOL
// ═══════════════════════════════════════════════════

type UserSub = "msg" | "action" | "visits" | null;

function UserToolPanel() {
  const [sub, setSub] = useState<UserSub>(null);
  const toggleSub = (v: UserSub) => setSub(p => p === v ? null : v);

  return (
    <div className="space-y-2">
      <Frame>
        <FramePanel className="p-0!">
          <PanelHeader icon={Users} title={`User: ${DEMO_USER.userName}`} right={
            DEMO_USER.online
              ? <Badge variant="default" size="sm" className="bg-green-600 text-white text-[10px] h-5">Online</Badge>
              : <Badge variant="secondary" size="sm" className="text-[10px] h-5">Offline</Badge>
          } />
          <div className="grid grid-cols-[1fr_auto]">
            <div>
              {USER_PROPS.map(([label, val], i) => (
                <div key={label} className={`flex justify-between px-3.5 py-0.5 text-[11px] ${i % 2 === 0 ? "bg-muted/15" : ""}`}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums">
                    {val}
                    {label === "Username" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 p-2 border-l">
              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2 justify-start"><MessageSquare className="size-2.5" />Room Chat</Button>
              <Button size="sm" variant={sub === "msg" ? "default" : "outline"} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub("msg")}><Send className="size-2.5" />Nachricht</Button>
              <Button size="sm" variant={sub === "visits" ? "default" : "outline"} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub("visits")}><Clock className="size-2.5" />Besuche</Button>
              <Button size="sm" variant={sub === "action" ? "default" : "outline"} className="h-6 text-[10px] gap-1 px-2 justify-start" onClick={() => toggleSub("action")}><Gavel className="size-2.5" />Mod Action</Button>
            </div>
          </div>
        </FramePanel>
      </Frame>

      {sub === "msg" && <SendMessagePanel />}
      {sub === "visits" && <RoomVisitsPanel />}
      {sub === "action" && <ModActionPanel />}
    </div>
  );
}

function SendMessagePanel() {
  const [msg, setMsg] = useState("");
  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={Send} title={`Nachricht an: ${DEMO_USER.userName}`} />
        <div className="px-3.5 py-2.5 space-y-2">
          <Textarea placeholder="Nachricht eingeben..." value={msg} onChange={e => setMsg(e.target.value)} className="min-h-[50px] text-xs" />
          <Button size="sm" className="w-full h-7 text-[11px] gap-1"><Send className="size-3" />Senden</Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function RoomVisitsPanel() {
  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={Clock} title={`Besuche: ${DEMO_USER.userName}`} />
        <div>
          <div className="grid grid-cols-[44px_1fr_60px] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
            <span>Zeit</span><span>Raum</span><span></span>
          </div>
          {ROOM_VISITS.map((v, i) => (
            <div key={i} className={`grid grid-cols-[44px_1fr_60px] text-[11px] px-3.5 py-1 items-center border-b border-border/30 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
              <span className="text-muted-foreground tabular-nums">{v.time}</span>
              <span className="truncate">{v.room}</span>
              <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 text-primary">Besuchen</Button>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}

function ModActionPanel() {
  const [topic, setTopic] = useState(-1);
  const [action, setAction] = useState(-1);
  const [msg, setMsg] = useState("");

  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={Gavel} title={`Mod Action: ${DEMO_USER.userName}`} />
        <div className="px-3.5 py-2.5 space-y-2">
          <Select value={topic > -1 ? String(topic) : undefined} onValueChange={v => setTopic(Number(v))}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue placeholder="CFH Thema" />
            </SelectTrigger>
            <SelectContent>
              {CFH_TOPICS.map((t, i) => <SelectItem key={i} value={String(i)} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={action > -1 ? String(action) : undefined} onValueChange={v => setAction(Number(v))}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue placeholder="Sanktionstyp" />
            </SelectTrigger>
            <SelectContent>
              {SANCTIONS.map((s, i) => <SelectItem key={i} value={String(i)} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Optionale Nachricht (überschreibt Standard)</p>
            <Textarea placeholder="Nachricht..." value={msg} onChange={e => setMsg(e.target.value)} className="min-h-[40px] text-xs" />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] gap-1"><Gavel className="size-3" />Default</Button>
            <Button size="sm" className="flex-1 h-7 text-[11px] gap-1 bg-green-600 hover:bg-green-700"><Ban className="size-3" />Ausführen</Button>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════════════

function TicketsPanel() {
  const [selected, setSelected] = useState<number | null>(null);
  const ticket = DEMO_TICKETS.find(t => t.id === selected);

  const open = DEMO_TICKETS.filter(t => t.state === "open");
  const picked = DEMO_TICKETS.filter(t => t.state === "picked");

  if (ticket) return <IssueDetail ticket={ticket} onBack={() => setSelected(null)} />;

  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={AlertTriangle} title="Tickets" />
        <Tabs defaultValue="open">
          <TabsList className="w-full rounded-none border-b bg-transparent h-8 px-3">
            <TabsTrigger value="open" className="text-[11px] h-6 gap-1">Offen <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{open.length}</Badge></TabsTrigger>
            <TabsTrigger value="my" className="text-[11px] h-6 gap-1">Meine <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{picked.length}</Badge></TabsTrigger>
            <TabsTrigger value="picked" className="text-[11px] h-6 gap-1">Aufgenommen <Badge variant="secondary" size="sm" className="text-[9px] h-4 ml-0.5">{picked.length}</Badge></TabsTrigger>
          </TabsList>
          <TabsContent value="open"><TicketList tickets={open} onSelect={setSelected} showPick /></TabsContent>
          <TabsContent value="my"><TicketList tickets={picked} onSelect={setSelected} /></TabsContent>
          <TabsContent value="picked"><TicketList tickets={picked} onSelect={setSelected} /></TabsContent>
        </Tabs>
      </FramePanel>
    </Frame>
  );
}

function TicketList({ tickets, onSelect, showPick }: { tickets: typeof DEMO_TICKETS; onSelect: (id: number) => void; showPick?: boolean }) {
  return (
    <div>
      <div className="grid grid-cols-[32px_70px_70px_1fr] text-[11px] font-semibold text-muted-foreground px-3.5 py-1 border-b bg-muted/20">
        <span>Typ</span><span>Spieler</span><span>Alter</span><span></span>
      </div>
      {tickets.map(t => (
        <div key={t.id} onClick={() => onSelect(t.id)} className="grid grid-cols-[32px_70px_70px_1fr] text-[11px] px-3.5 py-1 items-center border-b border-border/30 hover:bg-muted/20 cursor-pointer">
          <span className="tabular-nums">{t.cat}</span>
          <span className="font-medium text-primary truncate">{t.reported}</span>
          <span className="text-muted-foreground">{Math.floor(t.ageMs / 60000)}m</span>
          <div className="flex justify-end">
            {showPick ? (
              <Button size="sm" className="h-5 text-[10px] px-2 bg-green-600 hover:bg-green-700" onClick={e => e.stopPropagation()}>Annehmen</Button>
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
      {tickets.length === 0 && <div className="py-4 text-center text-[11px] text-muted-foreground">Keine Issues</div>}
    </div>
  );
}

function IssueDetail({ ticket, onBack }: { ticket: typeof DEMO_TICKETS[0]; onBack: () => void }) {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <Frame>
        <FramePanel className="p-0!">
          <PanelHeader icon={MessageSquare} title={`CFH Chatlog — #${ticket.id}`} right={
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setShowChat(false)}><X className="size-2.5 mr-1" />Zurück</Button>
          } />
          <ScrollArea className="h-[160px]">
            {DEMO_CHATLOG.slice(0, 5).map((e, i) => (
              <div key={i} className={`grid grid-cols-[56px_70px_1fr] text-[11px] px-3.5 py-1 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <span className="text-muted-foreground tabular-nums">{e.time}</span>
                <span className="font-medium text-primary">{e.user}</span>
                <span className="break-all">{e.message}</span>
              </div>
            ))}
          </ScrollArea>
        </FramePanel>
      </Frame>
    );
  }

  const rows: [string, string, boolean?][] = [
    ["Quelle", `Kategorie ${ticket.cat}`],
    ["Kategorie", CFH_TOPICS[ticket.cat - 1] || "Sonstiges"],
    ["Beschreibung", ticket.msg],
    ["Melder", ticket.reporter, true],
    ["Gemeldeter User", ticket.reported, true],
  ];

  return (
    <Frame>
      <FramePanel className="p-0!">
        <PanelHeader icon={FileText} title={`Issue #${ticket.id}`} right={
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={onBack}><X className="size-2.5 mr-1" />Zurück</Button>
        } />
        <div className="grid grid-cols-[1fr_auto]">
          <div>
            {rows.map(([label, val, isUser], i) => (
              <div key={label} className={`flex justify-between px-3.5 py-1 text-[11px] ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className={`${isUser ? "text-primary font-medium cursor-pointer hover:underline" : ""} text-right max-w-[200px]`}>{val}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 p-2 border-l">
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={() => setShowChat(true)}><MessageSquare className="size-2.5" />Chatlog</Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2"><X className="size-2.5" />Nutzlos</Button>
            <Button size="sm" variant="destructive" className="h-6 text-[10px] gap-1 px-2"><Ban className="size-2.5" />Missbr.</Button>
            <Button size="sm" className="h-6 text-[10px] gap-1 px-2 bg-green-600 hover:bg-green-700"><CircleDot className="size-2.5" />Gelöst</Button>
            <Button size="sm" variant="secondary" className="h-6 text-[10px] gap-1 px-2"><FileText className="size-2.5" />Freigeben</Button>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const ModToolsV2View: FC<{}> = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Mod Tools</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Room Tool · Chatlog · User Tool · Tickets</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="gap-1.5 text-muted-foreground/60"><Monitor className="w-3.5 h-3.5" />4 Panels</Badge>
              <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-xl">
            <ModToolsMainPanel />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
