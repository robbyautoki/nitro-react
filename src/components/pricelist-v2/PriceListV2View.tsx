
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ClipboardList,
  Search,
  Package,
  GripVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Hash,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => GetConfiguration<string>('asset.url', 'http://localhost:8080');
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

interface PriceListItem {
  itemBaseId: number;
  name: string;
  itemName: string;
  tradeValue: number;
  rarityType: string | null;
  rarityDisplayName: string | null;
  circulation: number;
  setName: string | null;
}

// ─── Mock Data ──────────────────────────────────

const MOCK_ITEMS: PriceListItem[] = [
  { itemBaseId: 1, name: "Thron", itemName: "throne", tradeValue: 4200, rarityType: "og_rare", rarityDisplayName: "OG Rare", circulation: 87, setName: null },
  { itemBaseId: 2, name: "Drachen-Lampe", itemName: "rare_dragon_lamp", tradeValue: 1800, rarityType: "og_rare", rarityDisplayName: "OG Rare", circulation: 142, setName: "Drachen-Set" },
  { itemBaseId: 3, name: "Holo-Mädchen", itemName: "holo_girl", tradeValue: 950, rarityType: "monthly_rare", rarityDisplayName: "Monats-Rare", circulation: 310, setName: null },
  { itemBaseId: 4, name: "Sonnenschirm", itemName: "parasol", tradeValue: 320, rarityType: "weekly_rare", rarityDisplayName: "Wochen-Rare", circulation: 520, setName: null },
  { itemBaseId: 5, name: "Goldbarren", itemName: "gold_bar", tradeValue: 6500, rarityType: "bonzen_rare", rarityDisplayName: "Bonzen-Rare", circulation: 23, setName: "Bonzen-Set" },
  { itemBaseId: 6, name: "Club Sofa", itemName: "club_sofa", tradeValue: 85, rarityType: null, rarityDisplayName: null, circulation: 3400, setName: null },
  { itemBaseId: 7, name: "Executive Regal", itemName: "exe_shelf", tradeValue: 210, rarityType: null, rarityDisplayName: null, circulation: 1200, setName: "Executive-Set" },
  { itemBaseId: 8, name: "Eis-Skulptur", itemName: "rare_ice", tradeValue: 1100, rarityType: "monthly_rare", rarityDisplayName: "Monats-Rare", circulation: 195, setName: "Eis-Set" },
  { itemBaseId: 9, name: "Kristallkugel", itemName: "crystal_ball", tradeValue: 750, rarityType: "weekly_rare", rarityDisplayName: "Wochen-Rare", circulation: 430, setName: null },
  { itemBaseId: 10, name: "Disko-Kugel", itemName: "discoball", tradeValue: 180, rarityType: null, rarityDisplayName: null, circulation: 2100, setName: null },
  { itemBaseId: 11, name: "Gothic Stuhl", itemName: "gothic_chair*1", tradeValue: 60, rarityType: null, rarityDisplayName: null, circulation: 5800, setName: "Gothic-Set" },
  { itemBaseId: 12, name: "Seltener Brunnen", itemName: "rare_fountain*1", tradeValue: 2800, rarityType: "og_rare", rarityDisplayName: "OG Rare", circulation: 65, setName: null },
  { itemBaseId: 13, name: "Mondlicht", itemName: "rare_moonlight*1", tradeValue: 3400, rarityType: "bonzen_rare", rarityDisplayName: "Bonzen-Rare", circulation: 34, setName: null },
  { itemBaseId: 14, name: "Meister-Würfel", itemName: "dice_master", tradeValue: 420, rarityType: "cashshop_rare", rarityDisplayName: "Cashshop-Rare", circulation: 890, setName: null },
  { itemBaseId: 15, name: "Teleporter", itemName: "teleport_door", tradeValue: 55, rarityType: null, rarityDisplayName: null, circulation: 12000, setName: null },
  { itemBaseId: 16, name: "HC Sofa", itemName: "hc_sofa", tradeValue: 140, rarityType: null, rarityDisplayName: null, circulation: 7200, setName: null },
  { itemBaseId: 17, name: "Goldener Drache", itemName: "rare_colourable_dragon*1", tradeValue: 5200, rarityType: "og_rare", rarityDisplayName: "OG Rare", circulation: 18, setName: "Drachen-Set" },
  { itemBaseId: 18, name: "Roller", itemName: "roller_basic", tradeValue: 15, rarityType: null, rarityDisplayName: null, circulation: 45000, setName: null },
  { itemBaseId: 19, name: "Norja Tisch", itemName: "table_norja_med*2", tradeValue: 35, rarityType: null, rarityDisplayName: null, circulation: 9800, setName: "Norja-Set" },
  { itemBaseId: 20, name: "Cashshop Diamant", itemName: "diamond_painting*1", tradeValue: 1600, rarityType: "cashshop_rare", rarityDisplayName: "Cashshop-Rare", circulation: 270, setName: null },
  { itemBaseId: 21, name: "Vintage Jukebox", itemName: "jukebox", tradeValue: 380, rarityType: "weekly_rare", rarityDisplayName: "Wochen-Rare", circulation: 640, setName: null },
  { itemBaseId: 22, name: "Lava-Lampe", itemName: "lava_lamp*3", tradeValue: 95, rarityType: null, rarityDisplayName: null, circulation: 4100, setName: null },
];

const RARITY_TABS = [
  { id: "", label: "Alle" },
  { id: "og_rare", label: "OG", color: "#FFD700" },
  { id: "weekly_rare", label: "Wochen", color: "#22C55E" },
  { id: "monthly_rare", label: "Monat", color: "#A855F7" },
  { id: "cashshop_rare", label: "Cash", color: "#F97316" },
  { id: "bonzen_rare", label: "Bonzen", color: "#FFD700" },
];

const PAGE_SIZE = 12;

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

// ─── Item Icon ──────────────────────────────────

function ItemIcon({ itemName, className }: { itemName: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={`flex items-center justify-center bg-muted/20 ${className || "w-full h-full"}`}><Package className="w-3.5 h-3.5 text-muted-foreground/30" /></div>;
  return <img src={getFurniIcon(itemName)} alt={itemName} className={`object-contain ${className || "w-full h-full"}`} style={{ imageRendering: "pixelated" }} loading="lazy" onError={() => setErr(true)} />;
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const PriceListV2View: FC<{}> = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pos, size, onDragStart, onResizeStart } = useDragResize({ x: 0, y: 0 }, { w: 580, h: 520 }, { w: 420, h: 380 }, { w: 800, h: 700 });

  const filtered = useMemo(() => {
    let items = MOCK_ITEMS;
    if (activeTab) items = items.filter((i) => i.rarityType === activeTab);
    if (search) { const q = search.toLowerCase(); items = items.filter((i) => i.name.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)); }
    return items;
  }, [search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, activeTab]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Preisliste</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Preisliste-Redesign Prototyp · {filtered.length} Items · Ziehen zum Bewegen · Ecke zum Skalieren</p>
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
                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-[13px] font-semibold">Preisliste</span>
                <span className="text-[10px] text-muted-foreground/40 tabular-nums">{filtered.length} Items</span>
              </div>
              <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Search + Tabs */}
            <div className="shrink-0 px-3 py-2 space-y-1.5 border-b border-border/30">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 text-[11px]" />
                {search && <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-2.5 h-2.5 text-muted-foreground/50" /></button>}
              </div>
              <div className="flex gap-1 flex-wrap">
                {RARITY_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                    style={activeTab === tab.id && tab.color ? { color: tab.color, backgroundColor: tab.color + "10" } : undefined}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item List */}
            <ScrollArea className="flex-1 min-h-0">
              {paged.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="w-8 h-8 mb-2 opacity-20" /><p className="text-xs font-medium">Keine Items gefunden</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {paged.map((item) => (
                    <Tooltip key={item.itemBaseId}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent/30 transition-colors cursor-default">
                          <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center overflow-hidden">
                            <ItemIcon itemName={item.itemName} className="w-7 h-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium truncate">{item.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.rarityDisplayName && <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: RARITY_TABS.find((t) => t.id === item.rarityType)?.color }}>{item.rarityDisplayName}</span>}
                              {item.setName && <span className="text-[9px] text-muted-foreground/50">{item.setName}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                              <CurrencyIcon type="credits" className="w-3.5 h-3.5" />
                              <span className="text-[12px] font-bold text-amber-500 tabular-nums">{item.tradeValue.toLocaleString("de-DE")}</span>
                            </div>
                          </div>
                          {item.circulation > 0 && (
                            <div className="text-right shrink-0 pl-2 border-l border-border/30">
                              <div className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-0.5 justify-end"><Hash className="w-2.5 h-2.5 opacity-40" />{item.circulation.toLocaleString("de-DE")}</div>
                              <div className="text-[9px] text-muted-foreground/30">Stk.</div>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" sideOffset={8}>
                        <div className="space-y-0.5 max-w-[180px]">
                          <p className="font-semibold text-xs">{item.name}</p>
                          <p className="text-[9px] opacity-40 font-mono">{item.itemName}</p>
                          {item.rarityDisplayName && <p className="text-[10px]">Seltenheit: {item.rarityDisplayName}</p>}
                          {item.setName && <p className="text-[10px]">Set: {item.setName}</p>}
                          <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><CurrencyIcon type="credits" className="w-3 h-3" />{item.tradeValue.toLocaleString("de-DE")} Credits</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 border-t border-border/30 bg-muted/10">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-3 h-3" /></Button>
                <span className="text-[10px] text-muted-foreground tabular-nums">{page} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-3 h-3" /></Button>
              </div>
            )}

            {/* Resize Handle */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end" onPointerDown={onResizeStart}>
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30"><path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
