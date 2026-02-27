
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trophy,
  Search,
  Package,
  GripVertical,
  X,
  Layers,
  Clock,
  Gift,
  Calendar,
  Users,
  HelpCircle,
  Check,
  Lock,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};
function getFurniIcon(n: string) { return `${ASSETS_URL()}/c_images/${n.split("*")[0]}_icon.png`; }

const CURRENCY_ICONS = {
  credits: `${ASSETS_URL()}/wallet/-1.png`,
  duckets: `${ASSETS_URL()}/wallet/0.png`,
  diamonds: `${ASSETS_URL()}/wallet/5.png`,
  hc: `${ASSETS_URL()}/wallet/hc.png`,
} as const;

function CurrencyIcon({ type, className }: { type: keyof typeof CURRENCY_ICONS; className?: string }) {
  return <img src={CURRENCY_ICONS[type]} alt={type} className={className || "w-4 h-4"} style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

// ─── Types ──────────────────────────────────────

interface SetItem {
  item_base_id: number;
  public_name: string;
  item_name: string;
  owned: boolean;
}

interface FurnitureSet {
  id: number;
  name: string;
  description: string | null;
  expires_at: string | null;
  show_countdown: boolean;
  reward_credits: number;
  reward_pixels: number;
  reward_points: number;
  reward_item: { public_name: string; item_name: string } | null;
  completions: number;
  release_date: string | null;
  items: SetItem[];
}

// ─── Mock Sets ──────────────────────────────────

const MOCK_SETS: FurnitureSet[] = [
  {
    id: 1, name: "Drachen-Kollektion", description: "Sammle alle seltenen Drachen-Möbel und werde zum Drachenmeister!",
    expires_at: null, show_countdown: false, reward_credits: 5000, reward_pixels: 1000, reward_points: 50,
    reward_item: { public_name: "Goldener Drache", item_name: "rare_colourable_dragon*1" },
    completions: 42, release_date: "2025-12-01",
    items: [
      { item_base_id: 1, public_name: "Drachen-Lampe", item_name: "rare_dragon_lamp", owned: true },
      { item_base_id: 2, public_name: "Goldener Drache", item_name: "rare_colourable_dragon*1", owned: true },
      { item_base_id: 3, public_name: "Drachen-Stuhl", item_name: "dragon_chair", owned: false },
      { item_base_id: 4, public_name: "Drachen-Teppich", item_name: "dragon_rug", owned: true },
      { item_base_id: 5, public_name: "Drachen-Ei", item_name: "dragon_egg", owned: false },
    ],
  },
  {
    id: 2, name: "Eis-Paradies", description: "Die schönsten Winter-Möbel in einer Kollektion.",
    expires_at: "2026-03-15T00:00:00Z", show_countdown: true, reward_credits: 2000, reward_pixels: 500, reward_points: 0,
    reward_item: null, completions: 128, release_date: "2026-01-10",
    items: [
      { item_base_id: 10, public_name: "Eis-Skulptur", item_name: "rare_ice", owned: true },
      { item_base_id: 11, public_name: "Schneemann", item_name: "snowman", owned: true },
      { item_base_id: 12, public_name: "Eisbär-Platte", item_name: "pressureplate_polarbear", owned: true },
      { item_base_id: 13, public_name: "Igluh", item_name: "igloo", owned: true },
    ],
  },
  {
    id: 3, name: "Executive Suite", description: "Stilvoll einrichten mit der Executive-Kollektion.",
    expires_at: null, show_countdown: false, reward_credits: 1500, reward_pixels: 0, reward_points: 25,
    reward_item: { public_name: "Executive Thron", item_name: "throne" },
    completions: 315, release_date: "2025-06-15",
    items: [
      { item_base_id: 20, public_name: "Executive Regal", item_name: "exe_shelf", owned: true },
      { item_base_id: 21, public_name: "Executive Tisch", item_name: "exe_table", owned: false },
      { item_base_id: 22, public_name: "Executive Stuhl", item_name: "exe_chair", owned: true },
      { item_base_id: 23, public_name: "Executive Lampe", item_name: "exe_lamp", owned: false },
      { item_base_id: 24, public_name: "Executive Teppich", item_name: "exe_rug", owned: false },
      { item_base_id: 25, public_name: "Executive Bild", item_name: "exe_painting", owned: true },
    ],
  },
  {
    id: 4, name: "Gothic Dungeon", description: "Dunkle Möbel für geheimnisvolle Räume.",
    expires_at: null, show_countdown: false, reward_credits: 800, reward_pixels: 200, reward_points: 10,
    reward_item: null, completions: 890, release_date: "2025-03-01",
    items: [
      { item_base_id: 30, public_name: "Gothic Stuhl", item_name: "gothic_chair*1", owned: true },
      { item_base_id: 31, public_name: "Gothic Tisch", item_name: "gothic_table", owned: true },
      { item_base_id: 32, public_name: "Kerzenständer", item_name: "candle_holder", owned: true },
    ],
  },
  {
    id: 5, name: "Bonzen-Luxus", description: "Nur das Beste vom Besten. Für echte Kenner.",
    expires_at: "2026-04-01T00:00:00Z", show_countdown: true, reward_credits: 15000, reward_pixels: 5000, reward_points: 200,
    reward_item: { public_name: "Diamant-Thron", item_name: "diamond_painting*1" },
    completions: 7, release_date: "2026-02-01",
    items: [
      { item_base_id: 40, public_name: "Goldbarren", item_name: "gold_bar", owned: false },
      { item_base_id: 41, public_name: "Mondlicht", item_name: "rare_moonlight*1", owned: false },
      { item_base_id: 42, public_name: "Thron", item_name: "throne", owned: true },
      { item_base_id: 43, public_name: "Seltener Brunnen", item_name: "rare_fountain*1", owned: false },
      { item_base_id: 44, public_name: "Kristallkugel", item_name: "crystal_ball", owned: false },
      { item_base_id: 45, public_name: "Cashshop Diamant", item_name: "diamond_painting*1", owned: false },
      { item_base_id: 46, public_name: "Holo-Mädchen", item_name: "holo_girl", owned: false },
    ],
  },
];

function formatDate(d: string | null): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return ""; }
}

function daysLeft(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Drag + Resize Hook ─────────────────────────

function useDragResize(initialPos: { x: number; y: number }, initialSize: { w: number; h: number }, minSize: { w: number; h: number }, maxSize: { w: number; h: number }) {
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) { setPos({ x: dragRef.current.startPosX + e.clientX - dragRef.current.startX, y: dragRef.current.startPosY + e.clientY - dragRef.current.startY }); }
      if (resizeRef.current) { setSize({ w: Math.min(maxSize.w, Math.max(minSize.w, resizeRef.current.startW + e.clientX - resizeRef.current.startX)), h: Math.min(maxSize.h, Math.max(minSize.h, resizeRef.current.startH + e.clientY - resizeRef.current.startY)) }); }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [minSize.w, minSize.h, maxSize.w, maxSize.h]);
  const onDragStart = (e: React.PointerEvent) => { e.preventDefault(); dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y }; };
  const onResizeStart = (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h }; };
  return { pos, size, onDragStart, onResizeStart };
}

function ItemIcon({ itemName, className }: { itemName: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={`flex items-center justify-center bg-muted/20 ${className || "w-full h-full"}`}><Package className="w-3.5 h-3.5 text-muted-foreground/30" /></div>;
  return <img src={getFurniIcon(itemName)} alt={itemName} className={`object-contain ${className || "w-full h-full"}`} style={{ imageRendering: "pixelated" }} loading="lazy" onError={() => setErr(true)} />;
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const SetsV2View: FC<{}> = () => {
  const [sets, setSets] = useState(MOCK_SETS);
  const [selectedSetId, setSelectedSetId] = useState<number>(MOCK_SETS[0].id);
  const [search, setSearch] = useState("");
  const [claimDialog, setClaimDialog] = useState<FurnitureSet | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { pos, size, onDragStart, onResizeStart } = useDragResize({ x: 0, y: 0 }, { w: 720, h: 560 }, { w: 560, h: 420 }, { w: 950, h: 750 });

  const filteredSets = useMemo(() => {
    if (!search) return sets;
    const q = search.toLowerCase();
    return sets.filter((s) => s.name.toLowerCase().includes(q));
  }, [sets, search]);

  const selectedSet = useMemo(() => sets.find((s) => s.id === selectedSetId) ?? null, [sets, selectedSetId]);

  const getProgress = useCallback((set: FurnitureSet) => {
    const owned = set.items.filter((i) => i.owned).length;
    return { owned, total: set.items.length, percent: set.items.length > 0 ? Math.round((owned / set.items.length) * 100) : 0 };
  }, []);

  const handleClaim = useCallback((set: FurnitureSet) => {
    setClaimedIds((prev) => new Set([...prev, set.id]));
    setClaimDialog(null);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Set-Katalog</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Set-Katalog-Redesign Prototyp · {sets.length} Sets · Ziehen zum Bewegen · Ecke zum Skalieren</p>
            </div>
            <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--muted)/0.15) 0%, hsl(var(--background)) 70%)" }}>
          <div className="absolute flex flex-col rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden" style={{ width: size.w, height: size.h, left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`, transform: `translate(-${size.w / 2}px, -${size.h / 2}px)` }}>

            {/* Title Bar */}
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none" onPointerDown={onDragStart}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                <Trophy className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-[13px] font-semibold">Set-Katalog</span>
                <span className="text-[10px] text-muted-foreground/40 tabular-nums">{sets.length} Sets</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[260px]">
                    <p className="text-xs font-semibold mb-1">Was ist der Set-Katalog?</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Sammle alle Möbelstücke eines Sets, um exklusive Belohnungen freizuschalten! Fortschritt wird automatisch erfasst. Manche Sets sind zeitlich begrenzt verfügbar.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 min-h-0">
              {/* Left: Set List */}
              <div className="w-[220px] min-w-[220px] shrink-0 border-r border-border/40 flex flex-col min-h-0">
                <div className="shrink-0 p-2 border-b border-border/30">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                    <Input placeholder="Set suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-6 text-[11px]" />
                  </div>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  {filteredSets.map((set) => {
                    const isSelected = selectedSetId === set.id;
                    const prog = getProgress(set);
                    const remaining = daysLeft(set.expires_at);
                    const isClaimed = claimedIds.has(set.id);
                    const isComplete = prog.percent === 100;
                    return (
                      <div key={set.id} onClick={() => setSelectedSetId(set.id)}
                        className={`px-2.5 py-2 border-b border-border/20 cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-accent/30"}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-medium truncate flex-1">{set.name}</span>
                          {isComplete && isClaimed && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                          {isComplete && !isClaimed && <Gift className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Progress value={prog.percent} className="h-1 flex-1" />
                          <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">{prog.owned}/{prog.total}</span>
                        </div>
                        {remaining !== null && remaining > 0 && remaining < 30 && (
                          <div className="flex items-center gap-0.5 mt-1">
                            <Clock className="w-2.5 h-2.5 text-red-400" />
                            <span className="text-[8px] text-red-400 font-medium">Noch {remaining} Tage</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>

              {/* Right: Detail */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {!selectedSet ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <Trophy className="w-10 h-10 opacity-10 mb-2" /><p className="text-xs">Set auswählen</p>
                  </div>
                ) : (() => {
                  const prog = getProgress(selectedSet);
                  const isComplete = prog.percent === 100;
                  const isClaimed = claimedIds.has(selectedSet.id);
                  const hasReward = selectedSet.reward_credits > 0 || selectedSet.reward_pixels > 0 || selectedSet.reward_points > 0 || selectedSet.reward_item;
                  return (
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-4 space-y-4">
                        {/* Header */}
                        <div>
                          <h3 className="text-sm font-bold">{selectedSet.name}</h3>
                          {selectedSet.description && <p className="text-[11px] text-muted-foreground mt-0.5">{selectedSet.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" />{selectedSet.items.length} Möbel</span>
                            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{selectedSet.completions}× abgeschlossen</span>
                            {selectedSet.release_date && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{formatDate(selectedSet.release_date)}</span>}
                          </div>
                          {/* Progress */}
                          <div className="mt-3 flex items-center gap-2">
                            <Progress value={prog.percent} className="h-2 flex-1" />
                            <span className={`text-[11px] font-bold tabular-nums ${isComplete ? "text-emerald-500" : "text-muted-foreground"}`}>{prog.percent}%</span>
                          </div>
                          {selectedSet.show_countdown && selectedSet.expires_at && (() => {
                            const days = daysLeft(selectedSet.expires_at);
                            if (!days || days <= 0) return null;
                            return (
                              <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Clock className="w-3 h-3 text-red-500" />
                                <span className="text-[10px] font-semibold text-red-500">Noch {days} {days === 1 ? "Tag" : "Tage"} verfügbar!</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Rewards — Enterprise Card */}
                        {hasReward && (
                          <div className="rounded-xl border border-border/50 overflow-hidden">
                            <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[11px] font-semibold">Belohnung für Abschluss</span>
                                </div>
                                {isComplete && !isClaimed && (
                                  <Badge variant="success" size="xs">Verfügbar!</Badge>
                                )}
                                {isClaimed && (
                                  <Badge variant="outline" size="xs" className="text-emerald-500 border-emerald-500/30"><Check className="w-2.5 h-2.5 mr-0.5" />Eingelöst</Badge>
                                )}
                              </div>
                            </div>
                            <div className="p-3 space-y-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {selectedSet.reward_credits > 0 && (
                                  <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                    <CurrencyIcon type="credits" className="w-4 h-4" />
                                    <span className="text-[11px] font-bold text-amber-600">{selectedSet.reward_credits.toLocaleString("de-DE")}</span>
                                    <span className="text-[9px] text-muted-foreground">Credits</span>
                                  </div>
                                )}
                                {selectedSet.reward_pixels > 0 && (
                                  <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                    <CurrencyIcon type="duckets" className="w-4 h-4" />
                                    <span className="text-[11px] font-bold text-purple-600">{selectedSet.reward_pixels.toLocaleString("de-DE")}</span>
                                    <span className="text-[9px] text-muted-foreground">Duckets</span>
                                  </div>
                                )}
                                {selectedSet.reward_points > 0 && (
                                  <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                                    <CurrencyIcon type="diamonds" className="w-4 h-4" />
                                    <span className="text-[11px] font-bold text-teal-600">{selectedSet.reward_points.toLocaleString("de-DE")}</span>
                                    <span className="text-[9px] text-muted-foreground">Diamanten</span>
                                  </div>
                                )}
                              </div>
                              {selectedSet.reward_item && (
                                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/20 border border-border/40">
                                  <div className="w-10 h-10 rounded-lg border border-border/40 bg-white/50 flex items-center justify-center">
                                    <ItemIcon itemName={selectedSet.reward_item.item_name} className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-semibold">{selectedSet.reward_item.public_name}</span>
                                    <p className="text-[9px] text-muted-foreground">Exklusives Belohnungs-Möbelstück</p>
                                  </div>
                                </div>
                              )}
                              <Button
                                size="sm"
                                className={`w-full h-7 text-[11px] gap-1.5 ${isComplete && !isClaimed ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                                variant={isComplete && !isClaimed ? "default" : "outline"}
                                disabled={!isComplete || isClaimed}
                                onClick={() => isComplete && !isClaimed && setClaimDialog(selectedSet)}
                              >
                                {isClaimed ? <><Check className="w-3 h-3" />Bereits eingelöst</> :
                                 isComplete ? <><Gift className="w-3 h-3" />Belohnung einlösen</> :
                                 <><Lock className="w-3 h-3" />Sammle alle {selectedSet.items.length} Möbel</>}
                              </Button>
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Items Grid */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
                            <span className="text-[11px] font-semibold">Benötigte Möbel ({prog.owned}/{prog.total})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedSet.items.map((item) => (
                              <Tooltip key={item.item_base_id}>
                                <TooltipTrigger asChild>
                                  <div className={`relative w-[52px] h-[52px] border rounded-md flex items-center justify-center transition-colors cursor-default ${
                                    item.owned ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/40 bg-muted/10 opacity-50"
                                  }`}>
                                    <ItemIcon itemName={item.item_name} className="w-9 h-9" />
                                    {item.owned && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-emerald-500" />}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={4}>
                                  <p className="font-semibold text-xs">{item.public_name}</p>
                                  <p className="text-[9px] opacity-40 font-mono">{item.item_name}</p>
                                  <p className={`text-[10px] font-medium ${item.owned ? "text-emerald-500" : "text-red-400"}`}>
                                    {item.owned ? "✓ Im Besitz" : "✗ Fehlt noch"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  );
                })()}
              </div>
            </div>

            {/* Resize Handle */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end" onPointerDown={onResizeStart}>
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30"><path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
            </div>
          </div>
        </div>

        {/* Claim Dialog */}
        <AlertDialog open={!!claimDialog} onOpenChange={(o) => !o && setClaimDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500" />Belohnung einlösen</AlertDialogTitle>
              <AlertDialogDescription>
                Du hast das Set <span className="font-semibold text-foreground">{claimDialog?.name}</span> komplett abgeschlossen! Möchtest du die Belohnung jetzt einlösen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            {claimDialog && (
              <div className="flex items-center gap-2 flex-wrap py-1">
                {claimDialog.reward_credits > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="credits" className="w-3.5 h-3.5" />{claimDialog.reward_credits.toLocaleString("de-DE")} Credits</Badge>}
                {claimDialog.reward_pixels > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="duckets" className="w-3.5 h-3.5" />{claimDialog.reward_pixels.toLocaleString("de-DE")} Duckets</Badge>}
                {claimDialog.reward_points > 0 && <Badge variant="outline" className="gap-1"><CurrencyIcon type="diamonds" className="w-3.5 h-3.5" />{claimDialog.reward_points.toLocaleString("de-DE")} Diamanten</Badge>}
                {claimDialog.reward_item && <Badge variant="outline" className="gap-1"><Package className="w-3 h-3 text-purple-500" />{claimDialog.reward_item.public_name}</Badge>}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={() => claimDialog && handleClaim(claimDialog)}>Einlösen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
