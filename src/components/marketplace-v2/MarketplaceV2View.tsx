
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Store,
  Search,
  Package,
  History,
  MessageCircle,
  ShoppingBag,
  BarChart3,
  GripVertical,
  X,
  Layers,
  TrendingUp,
  TrendingDown,
  Tag,
  User,
  Check,
  Plus,
  Star,
  Gavel,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};
function getFurniIcon(n: string) { return `${ASSETS_URL()}/c_images/${n.split("*")[0]}_icon.png`; }
const MARKETPLACE_BANNER = `${ASSETS_URL()}/c_images/catalogue/bonush.gif`;

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

interface Listing { id: number; itemName: string; publicName: string; price: number; avgPrice: number; seller: string; listedAt: string; }
interface Sale { id: number; itemName: string; publicName: string; price: number; buyer: string; soldAt: string; }
interface Offer { id: number; itemName: string; publicName: string; offerPrice: number; askingPrice: number; from: string; status: "pending" | "accepted" | "rejected"; createdAt: string; }
interface InventoryItem { id: number; itemName: string; publicName: string; avgPrice: number; count: number; }

// ─── Mock Data ──────────────────────────────────

const INITIAL_LISTINGS: Listing[] = [
  { id: 1, itemName: "throne", publicName: "Thron", price: 250, avgPrice: 280, seller: "TradeMaster", listedAt: "2026-02-24T10:30:00Z" },
  { id: 2, itemName: "rare_dragon_lamp", publicName: "Drachen Lampe", price: 1200, avgPrice: 1100, seller: "RareKing", listedAt: "2026-02-24T09:15:00Z" },
  { id: 3, itemName: "holo_girl", publicName: "Holo Mädchen", price: 450, avgPrice: 500, seller: "Habbo2024", listedAt: "2026-02-23T22:00:00Z" },
  { id: 4, itemName: "parasol", publicName: "Sonnenschirm", price: 85, avgPrice: 90, seller: "SunnyTrader", listedAt: "2026-02-24T08:00:00Z" },
  { id: 5, itemName: "gold_bar", publicName: "Goldbarren", price: 2500, avgPrice: 2200, seller: "GoldRush", listedAt: "2026-02-24T07:00:00Z" },
  { id: 6, itemName: "club_sofa", publicName: "Club Sofa", price: 35, avgPrice: 40, seller: "CheapDeals", listedAt: "2026-02-23T18:30:00Z" },
  { id: 7, itemName: "exe_shelf", publicName: "Executive Regal", price: 180, avgPrice: 200, seller: "ShelfMaster", listedAt: "2026-02-24T06:00:00Z" },
  { id: 8, itemName: "rare_ice", publicName: "Eis Rare", price: 800, avgPrice: 750, seller: "IceQueen", listedAt: "2026-02-23T15:00:00Z" },
];

const INITIAL_SALES: Sale[] = [
  { id: 1, itemName: "throne", publicName: "Thron", price: 250, buyer: "BuyerOne", soldAt: "2026-02-24T10:00:00Z" },
  { id: 2, itemName: "holo_girl", publicName: "Holo Mädchen", price: 480, buyer: "Collector99", soldAt: "2026-02-23T20:00:00Z" },
  { id: 3, itemName: "parasol", publicName: "Sonnenschirm", price: 90, buyer: "NewPlayer", soldAt: "2026-02-23T14:00:00Z" },
];

const INITIAL_OFFERS: Offer[] = [
  { id: 1, itemName: "rare_dragon_lamp", publicName: "Drachen Lampe", offerPrice: 1000, askingPrice: 1200, from: "Haggler42", status: "pending", createdAt: "2026-02-24T09:30:00Z" },
  { id: 2, itemName: "gold_bar", publicName: "Goldbarren", offerPrice: 2300, askingPrice: 2500, from: "BargainHunter", status: "pending", createdAt: "2026-02-24T08:00:00Z" },
  { id: 3, itemName: "throne", publicName: "Thron", offerPrice: 220, askingPrice: 250, from: "LowBaller", status: "rejected", createdAt: "2026-02-23T18:00:00Z" },
];

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: 1, itemName: "throne", publicName: "Thron", avgPrice: 280, count: 2 },
  { id: 2, itemName: "rare_dragon_lamp", publicName: "Drachen Lampe", avgPrice: 1100, count: 1 },
  { id: 3, itemName: "club_sofa", publicName: "Club Sofa", avgPrice: 40, count: 5 },
  { id: 4, itemName: "exe_shelf", publicName: "Executive Regal", avgPrice: 200, count: 3 },
  { id: 5, itemName: "holo_girl", publicName: "Holo Mädchen", avgPrice: 500, count: 1 },
  { id: 6, itemName: "parasol", publicName: "Sonnenschirm", avgPrice: 90, count: 2 },
  { id: 7, itemName: "gothic_chair*1", publicName: "Gothic Stuhl", avgPrice: 60, count: 4 },
  { id: 8, itemName: "rare_ice", publicName: "Eis Rare", avgPrice: 750, count: 1 },
  { id: 9, itemName: "discoball", publicName: "Disko-Kugel", avgPrice: 180, count: 2 },
  { id: 10, itemName: "lava_lamp*3", publicName: "Lava-Lampe", avgPrice: 95, count: 3 },
];

interface ChartItem { itemName: string; publicName: string; avgPrice: number; }

const CHART_ITEMS: ChartItem[] = (() => {
  const map = new Map<string, ChartItem>();
  for (const l of INITIAL_LISTINGS) map.set(l.itemName, { itemName: l.itemName, publicName: l.publicName, avgPrice: l.avgPrice });
  for (const i of INVENTORY_ITEMS) if (!map.has(i.itemName)) map.set(i.itemName, { itemName: i.itemName, publicName: i.publicName, avgPrice: i.avgPrice });
  return Array.from(map.values());
})();

function generateChartData(avgPrice: number) {
  const seed = avgPrice * 7;
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 1, i + 1);
    const noise = Math.sin(i * 0.5 + seed) * (avgPrice * 0.1) + Math.sin(i * 1.3) * (avgPrice * 0.05);
    return { date: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), price: Math.round(avgPrice + noise + (i > 20 ? avgPrice * 0.05 : 0)) };
  });
}

const TABS = [
  { id: "browse", label: "Allgemein", icon: Store },
  { id: "my", label: "Meine Angebote", icon: Package },
  { id: "sales", label: "Verkäufe", icon: History },
  { id: "offers", label: "Anfragen", icon: MessageCircle },
  { id: "sell", label: "Verkaufen", icon: ShoppingBag },
  { id: "charts", label: "Preisverlauf", icon: BarChart3 },
] as const;
type TabId = (typeof TABS)[number]["id"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben"; if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60); if (h < 24) return `${h} Std.`;
  return `${Math.floor(h / 24)}d`;
}
function fmtC(n: number) { return n.toLocaleString("de-DE"); }

// ─── Drag + Resize ──────────────────────────────

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

function PriceDelta({ price, avg }: { price: number; avg: number }) {
  if (avg <= 0) return null;
  const pct = ((price - avg) / avg) * 100;
  if (Math.abs(pct) < 1) return <span className="text-[9px] text-muted-foreground/50 tabular-nums">~Ø</span>;
  const isUp = pct > 0;
  return <span className={`text-[9px] tabular-nums font-medium flex items-center gap-0.5 ${isUp ? "text-red-500" : "text-emerald-500"}`}>{isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}{isUp ? "+" : ""}{pct.toFixed(1)}%</span>;
}

// ─── Tab: Browse ────────────────────────────────

function BrowseTab({ listings, onBuy, onBid }: { listings: Listing[]; onBuy: (l: Listing) => void; onBid: (l: Listing) => void }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("price_asc");
  const [watchlist, setWatchlist] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    let items = listings;
    if (search) items = items.filter((l) => l.publicName.toLowerCase().includes(search.toLowerCase()));
    switch (sortBy) {
      case "price_asc": items = [...items].sort((a, b) => a.price - b.price); break;
      case "price_desc": items = [...items].sort((a, b) => b.price - a.price); break;
      case "newest": items = [...items].sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()); break;
    }
    return items;
  }, [listings, search, sortBy]);

  const toggleWatch = (id: number) => setWatchlist((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
          <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-6 text-[11px]" />
        </div>
        <Separator orientation="vertical" className="h-3.5" />
        {[{ id: "price_asc", label: "Günstig" }, { id: "price_desc", label: "Teuer" }, { id: "newest", label: "Neu" }].map((opt) => (
          <button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${sortBy === opt.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50"}`}>{opt.label}</button>
        ))}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Package className="w-8 h-8 opacity-20 mb-2" /><p className="text-xs">Keine Angebote</p></div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((l) => (
              <div key={l.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30 transition-colors">
                <button onClick={() => toggleWatch(l.id)} className="shrink-0"><Star className={`w-3.5 h-3.5 transition-colors ${watchlist.has(l.id) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20 hover:text-amber-300"}`} /></button>
                <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center"><ItemIcon itemName={l.itemName} className="w-7 h-7" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{l.publicName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[9px] text-muted-foreground/50">{l.seller}</span><span className="text-[8px] text-muted-foreground/30">·</span><span className="text-[9px] text-muted-foreground/40">{timeAgo(l.listedAt)}</span></div>
                </div>
                <div className="text-right shrink-0 mr-1">
                  <div className="flex items-center gap-1 justify-end"><CurrencyIcon type="credits" className="w-3.5 h-3.5" /><span className="text-[12px] font-bold text-amber-500 tabular-nums">{fmtC(l.price)}</span></div>
                  <PriceDelta price={l.price} avg={l.avgPrice} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onBid(l)}><Gavel className="w-3 h-3" /></Button>
                  </TooltipTrigger><TooltipContent side="top">Gebot abgeben</TooltipContent></Tooltip>
                  <Button size="sm" className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onBuy(l)}>Kaufen</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Tab: My Listings ───────────────────────────

function MyListingsTab({ listings, onEdit, onRemove }: { listings: Listing[]; onEdit: (id: number, newPrice: number) => void; onRemove: (id: number) => void }) {
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [removeListing, setRemoveListing] = useState<Listing | null>(null);

  return (
    <>
      <ScrollArea className="h-full">
        <div className="divide-y divide-border/30">
          {listings.slice(0, 3).map((l) => (
            <div key={l.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30">
              <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center"><ItemIcon itemName={l.itemName} className="w-7 h-7" /></div>
              <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate">{l.publicName}</div><div className="text-[9px] text-muted-foreground/50">{timeAgo(l.listedAt)}</div></div>
              <div className="text-right mr-1"><div className="flex items-center gap-1 justify-end"><CurrencyIcon type="credits" className="w-3.5 h-3.5" /><span className="text-[12px] font-bold text-amber-500 tabular-nums">{fmtC(l.price)}</span></div><PriceDelta price={l.price} avg={l.avgPrice} /></div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="sm" className="h-6 text-[9px] px-1.5" onClick={() => { setEditListing(l); setEditPrice(String(l.price)); }}>Bearbeiten</Button>
                <Button variant="outline" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => setRemoveListing(l)}><X className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={!!editListing} onOpenChange={(o) => !o && setEditListing(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">Preis bearbeiten</DialogTitle>
            <DialogDescription>
              Neuen Preis für <span className="font-semibold text-foreground">{editListing?.publicName}</span> festlegen.
            </DialogDescription>
          </DialogHeader>
          {editListing && (
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center"><ItemIcon itemName={editListing.itemName} className="w-8 h-8" /></div>
              <div className="relative flex-1">
                <img src={CURRENCY_ICONS.credits} alt="credits" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="pl-9 h-10 text-base font-bold" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)}>Abbrechen</Button>
            <Button className="bg-primary" disabled={!editPrice || Number(editPrice) <= 0} onClick={() => { if (editListing) { onEdit(editListing.id, Number(editPrice)); setEditListing(null); } }}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeListing} onOpenChange={(o) => !o && setRemoveListing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Angebot zurückziehen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du dein Angebot für <span className="font-semibold text-foreground">{removeListing?.publicName}</span> über <span className="font-bold text-amber-500">{removeListing ? fmtC(removeListing.price) : 0} Credits</span> zurückziehen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (removeListing) { onRemove(removeListing.id); setRemoveListing(null); } }}>Zurückziehen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Tab: Sales ─────────────────────────────────

function SalesTab({ sales }: { sales: Sale[] }) {
  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border/30">
        {sales.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30">
            <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center"><ItemIcon itemName={s.itemName} className="w-7 h-7" /></div>
            <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate">{s.publicName}</div><div className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{s.buyer}</div></div>
            <div className="text-right shrink-0"><div className="flex items-center gap-1 justify-end"><CurrencyIcon type="credits" className="w-3.5 h-3.5" /><span className="text-[12px] font-bold text-emerald-500 tabular-nums">+{fmtC(s.price)}</span></div><div className="text-[9px] text-muted-foreground/40">{timeAgo(s.soldAt)}</div></div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Tab: Offers ────────────────────────────────

function OffersTab({ offers, onAccept, onReject }: { offers: Offer[]; onAccept: (o: Offer) => void; onReject: (o: Offer) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border/30">
        {offers.map((o) => (
          <div key={o.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-accent/30">
            <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center"><ItemIcon itemName={o.itemName} className="w-7 h-7" /></div>
            <div className="flex-1 min-w-0"><div className="text-[12px] font-medium truncate">{o.publicName}</div><div className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{o.from} · {timeAgo(o.createdAt)}</div></div>
            <div className="text-right mr-1 shrink-0">
              <div className="flex items-center gap-1.5 justify-end"><span className="text-[10px] text-muted-foreground/40 line-through tabular-nums">{fmtC(o.askingPrice)}</span><CurrencyIcon type="credits" className="w-3 h-3" /><span className="text-[12px] font-bold text-amber-500 tabular-nums">{fmtC(o.offerPrice)}</span></div>
              <PriceDelta price={o.offerPrice} avg={o.askingPrice} />
            </div>
            {o.status === "pending" ? (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" className="h-6 text-[9px] px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAccept(o)}><Check className="w-2.5 h-2.5 mr-0.5" />OK</Button>
                <Button variant="outline" size="icon" className="h-6 w-6 text-red-400" onClick={() => onReject(o)}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <Badge variant={o.status === "accepted" ? "success" : "destructive"} size="xs" className="shrink-0">{o.status === "accepted" ? "Angenommen" : "Abgelehnt"}</Badge>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Tab: Sell ──────────────────────────────────

function SellTab({ onList }: { onList: () => void }) {
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [price, setPrice] = useState("");
  const [invSearch, setInvSearch] = useState("");

  const filteredInv = useMemo(() => {
    if (!invSearch) return INVENTORY_ITEMS;
    const q = invSearch.toLowerCase();
    return INVENTORY_ITEMS.filter((i) => i.publicName.toLowerCase().includes(q));
  }, [invSearch]);

  if (showInventory) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-2.5 py-1.5 border-b border-border/30 flex items-center gap-2">
          <button onClick={() => setShowInventory(false)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">&larr; Zurück</button>
          <Separator orientation="vertical" className="h-3" />
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
            <Input placeholder="Inventar durchsuchen..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="pl-7 h-6 text-[11px]" />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 grid grid-cols-6 gap-1.5">
            {filteredInv.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setSelectedItem(item); setShowInventory(false); setInvSearch(""); }}
                    className="relative w-full aspect-square rounded-md border border-border/40 bg-muted/10 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center transition-all"
                  >
                    <ItemIcon itemName={item.itemName} className="w-8 h-8" />
                    {item.count > 1 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full bg-foreground/80 text-background text-[8px] font-bold flex items-center justify-center px-0.5">
                        x{item.count}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  <p className="font-semibold text-xs">{item.publicName}</p>
                  <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">Ø <CurrencyIcon type="credits" className="w-2.5 h-2.5" />{fmtC(item.avgPrice)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          {filteredInv.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-6 h-6 opacity-20 mb-1" /><p className="text-[10px]">Nichts gefunden</p>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-amber-500" /></div>
      <div className="text-center"><p className="text-[12px] font-semibold">Möbel verkaufen</p><p className="text-[10px] text-muted-foreground mt-0.5">Wähle ein Möbelstück aus deinem Inventar</p></div>
      <div className="w-full max-w-[240px] space-y-2">
        {!selectedItem ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border/50 bg-muted/10 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setShowInventory(true)}>
            <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center"><Plus className="w-4 h-4 text-muted-foreground/40" /></div>
            <div><p className="text-[11px] font-medium">Aus Inventar wählen</p><p className="text-[9px] text-muted-foreground/50">Klicke zum Auswählen</p></div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="w-10 h-10 rounded-md border border-border/40 bg-white/50 flex items-center justify-center"><ItemIcon itemName={selectedItem.itemName} className="w-8 h-8" /></div>
            <div className="flex-1">
              <p className="text-[11px] font-medium">{selectedItem.publicName}</p>
              <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">Ø <CurrencyIcon type="credits" className="w-2.5 h-2.5" />{fmtC(selectedItem.avgPrice)}</p>
            </div>
            <button onClick={() => setSelectedItem(null)}><X className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-foreground" /></button>
          </div>
        )}
        <div className="relative">
          <img src={CURRENCY_ICONS.credits} alt="credits" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ imageRendering: "pixelated" }} />
          <Input type="number" placeholder="Preis in Credits" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-8 h-8 text-[12px]" />
        </div>
        <Button className="w-full h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white" disabled={!selectedItem || !price} onClick={() => { onList(); setSelectedItem(null); setPrice(""); }}>
          <Tag className="w-3 h-3 mr-1" />Angebot erstellen
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Charts ────────────────────────────────

const chartConfig = { price: { label: "Preis", color: "hsl(var(--primary))" } };

function ChartsTab() {
  const [selected, setSelected] = useState<ChartItem>(CHART_ITEMS[0]);
  const [open, setOpen] = useState(false);

  const data = useMemo(() => generateChartData(selected.avgPrice), [selected.avgPrice]);
  const prices = data.map((d) => d.price);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const trend = prices[prices.length - 1] - prices[0];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-3 pt-2 pb-1 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/10 hover:bg-accent/30 px-2 py-1 transition-colors">
                <div className="w-7 h-7 shrink-0 flex items-center justify-center"><ItemIcon itemName={selected.itemName} className="w-6 h-6" /></div>
                <div className="text-left"><p className="text-[12px] font-semibold leading-tight">{selected.publicName}</p><p className="text-[9px] text-muted-foreground font-mono leading-tight">{selected.itemName.split("*")[0]}</p></div>
                <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50 ml-1 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Möbel suchen..." className="h-8 text-[12px]" />
                <CommandList>
                  <CommandEmpty className="py-3 text-center text-[11px] text-muted-foreground">Nichts gefunden.</CommandEmpty>
                  <CommandGroup>
                    {CHART_ITEMS.map((item) => (
                      <CommandItem
                        key={item.itemName}
                        value={item.publicName}
                        onSelect={() => { setSelected(item); setOpen(false); }}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <div className="w-6 h-6 shrink-0 flex items-center justify-center"><ItemIcon itemName={item.itemName} className="w-5 h-5" /></div>
                        <span className="flex-1 truncate">{item.publicName}</span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><CurrencyIcon type="credits" className="w-2.5 h-2.5" />{fmtC(item.avgPrice)}</span>
                        {item.itemName === selected.itemName && <Check className="w-3 h-3 text-primary shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-center"><p className="text-[9px] text-muted-foreground">Ø Preis</p><p className="text-[11px] font-bold tabular-nums flex items-center gap-0.5 justify-center"><CurrencyIcon type="credits" className="w-3 h-3" />{fmtC(avg)}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted-foreground">Min</p><p className="text-[11px] font-bold tabular-nums text-emerald-500 flex items-center gap-0.5 justify-center"><CurrencyIcon type="credits" className="w-3 h-3" />{fmtC(min)}</p></div>
            <div className="text-center"><p className="text-[9px] text-muted-foreground">Max</p><p className="text-[11px] font-bold tabular-nums text-red-500 flex items-center gap-0.5 justify-center"><CurrencyIcon type="credits" className="w-3 h-3" />{fmtC(max)}</p></div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Trend</p>
              <p className={`text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{trend >= 0 ? "+" : ""}{trend}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-2 py-3">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={35} domain={["dataMin - 10", "dataMax + 10"]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#priceGrad)" />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const MarketplaceV2View: FC<{}> = () => {
  const [currentTab, setCurrentTab] = useState<TabId>("browse");
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [offers, setOffers] = useState(INITIAL_OFFERS);
  const [buyDialog, setBuyDialog] = useState<Listing | null>(null);
  const [bidDialog, setBidDialog] = useState<Listing | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [acceptDialog, setAcceptDialog] = useState<Offer | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Offer | null>(null);
  const [listSuccess, setListSuccess] = useState(false);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pos, size, onDragStart, onResizeStart } = useDragResize({ x: 0, y: 0 }, { w: 820, h: 580 }, { w: 600, h: 420 }, { w: 1000, h: 750 });

  const totalVolume = useMemo(() => sales.reduce((s, sale) => s + sale.price, 0), [sales]);

  const handleBuy = useCallback((l: Listing) => {
    setListings((prev) => prev.filter((x) => x.id !== l.id));
    setSales((prev) => [{ id: Date.now(), itemName: l.itemName, publicName: l.publicName, price: l.price, buyer: "Du", soldAt: new Date().toISOString() }, ...prev]);
    setBuyDialog(null);
    setBuySuccess(l.publicName);
    setTimeout(() => setBuySuccess(null), 2000);
  }, []);

  const handleBid = useCallback(() => {
    setBidDialog(null); setBidPrice("");
    setBuySuccess("Gebot abgegeben!");
    setTimeout(() => setBuySuccess(null), 2000);
  }, []);

  const handleAccept = useCallback((o: Offer) => {
    setOffers((prev) => prev.map((x) => x.id === o.id ? { ...x, status: "accepted" as const } : x));
    setAcceptDialog(null);
  }, []);

  const handleReject = useCallback((o: Offer) => {
    setOffers((prev) => prev.map((x) => x.id === o.id ? { ...x, status: "rejected" as const } : x));
    setRejectDialog(null);
  }, []);

  const handleList = useCallback(() => {
    setListSuccess(true);
    setTimeout(() => setListSuccess(false), 2000);
  }, []);

  const handleEditListing = useCallback((id: number, newPrice: number) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, price: newPrice } : l));
  }, []);

  const handleRemoveListing = useCallback((id: number) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Marktplatz</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Marktplatz-Redesign Prototyp · Ziehen zum Bewegen · Ecke zum Skalieren</p>
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
                <Store className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-[13px] font-semibold">Marktplatz</span>
                <Separator orientation="vertical" className="h-3 mx-1" />
                <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">{listings.length} Angebote · <CurrencyIcon type="credits" className="w-2.5 h-2.5" />{fmtC(totalVolume)} Umsatz</span>
              </div>
              <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Marketplace Banner */}
            <div className="shrink-0 border-b border-border/30 overflow-hidden">
              <img src={MARKETPLACE_BANNER} alt="Marktplatz" className="w-full h-[64px] object-cover" style={{ imageRendering: "pixelated" }} draggable={false} />
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex gap-0.5 px-2 pt-1.5 pb-1 border-b border-border/30">
              {TABS.map((tab) => { const Icon = tab.icon; const isActive = currentTab === tab.id; return (
                <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
                  <Icon className="w-3 h-3" />{tab.label}
                </button>
              ); })}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
              {currentTab === "browse" && <BrowseTab listings={listings} onBuy={(l) => setBuyDialog(l)} onBid={(l) => { setBidDialog(l); setBidPrice(String(Math.round(l.avgPrice * 0.9))); }} />}
              {currentTab === "my" && <MyListingsTab listings={listings} onEdit={handleEditListing} onRemove={handleRemoveListing} />}
              {currentTab === "sales" && <SalesTab sales={sales} />}
              {currentTab === "offers" && <OffersTab offers={offers} onAccept={(o) => setAcceptDialog(o)} onReject={(o) => setRejectDialog(o)} />}
              {currentTab === "sell" && <SellTab onList={handleList} />}
              {currentTab === "charts" && <ChartsTab />}

              {/* Success Toast */}
              {(buySuccess || listSuccess) && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 z-30">
                  <Check className="w-3.5 h-3.5" />
                  {buySuccess ? (typeof buySuccess === "string" ? buySuccess : "Erfolgreich!") : "Angebot erstellt!"}
                </div>
              )}
            </div>

            {/* Resize Handle */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end" onPointerDown={onResizeStart}>
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30"><path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
            </div>
          </div>
        </div>

        {/* Buy Confirm Dialog */}
        <AlertDialog open={!!buyDialog} onOpenChange={(o) => !o && setBuyDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><CurrencyIcon type="credits" className="w-5 h-5" />Möbel kaufen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du <span className="font-semibold text-foreground">{buyDialog?.publicName}</span> für <span className="font-bold text-amber-500">{buyDialog ? fmtC(buyDialog.price) : 0} Credits</span> kaufen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={() => buyDialog && handleBuy(buyDialog)}>Kaufen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bid Dialog */}
        <Dialog open={!!bidDialog} onOpenChange={(o) => !o && setBidDialog(null)}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Gavel className="w-5 h-5 text-blue-500" />Preisvorschlag</DialogTitle>
              <DialogDescription>
                Gib deinen Preisvorschlag für <span className="font-semibold text-foreground">{bidDialog?.publicName}</span> ab. Aktueller Preis: <span className="font-bold text-amber-500">{bidDialog ? fmtC(bidDialog.price) : 0} Credits</span>
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <img src={CURRENCY_ICONS.credits} alt="credits" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
              <Input type="number" placeholder="Dein Gebot" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="pl-9 h-10 text-base font-bold" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialog(null)}>Abbrechen</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" disabled={!bidPrice || Number(bidPrice) <= 0} onClick={handleBid}><Gavel className="w-3.5 h-3.5 mr-1.5" />Gebot senden</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Accept Offer Dialog */}
        <AlertDialog open={!!acceptDialog} onOpenChange={(o) => !o && setAcceptDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Angebot annehmen</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold text-foreground">{acceptDialog?.from}</span> bietet <span className="font-bold text-amber-500">{acceptDialog ? fmtC(acceptDialog.offerPrice) : 0} Credits</span> für dein(e) <span className="font-semibold text-foreground">{acceptDialog?.publicName}</span>. Annehmen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={() => acceptDialog && handleAccept(acceptDialog)}>Annehmen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Offer Dialog */}
        <AlertDialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Angebot ablehnen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du das Angebot von <span className="font-semibold text-foreground">{rejectDialog?.from}</span> über <span className="font-bold text-amber-500">{rejectDialog ? fmtC(rejectDialog.offerPrice) : 0} Credits</span> ablehnen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => rejectDialog && handleReject(rejectDialog)}>Ablehnen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
