
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Search,
  X,
  Package,
  CheckSquare,
  Plus,
  Trash2,
  Wrench,
  Zap,
  Store,
  Sparkles,
  Layers,
  LayoutGrid,
  ArrowUpDown,
  Tag,
  Check,
  GripVertical,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};

function getFurniIcon(cn: string) {
  return `${ASSETS_URL()}/c_images/${cn.split("*")[0]}_icon.png`;
}

// ─── Types ──────────────────────────────────────

interface InventoryCategory {
  id: number;
  name: string;
  color: string;
}

interface InventoryItem {
  id: number;
  type: number;
  classname: string;
  public_name: string;
  count: number;
  is_wall: boolean;
  width: number;
  length: number;
  interaction_type: string;
  unique_number: number;
  unique_series: number;
  durability: number | null;
  categories: number[];
  rarity: string | null;
}

interface HotbarSlot {
  itemId: number | null;
  classname: string | null;
  public_name: string | null;
  count: number;
}

// ─── Initial Data ───────────────────────────────

const INITIAL_CATEGORIES: InventoryCategory[] = [
  { id: 1, name: "Wohnzimmer", color: "#3b82f6" },
  { id: 2, name: "Seltene", color: "#eab308" },
  { id: 3, name: "Tausch", color: "#22c55e" },
  { id: 4, name: "Deko", color: "#a855f7" },
  { id: 5, name: "Vintage", color: "#ef4444" },
];

const INITIAL_ITEMS: InventoryItem[] = [
  { id: 1, type: 100, classname: "throne", public_name: "Thron", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "default", unique_number: 42, unique_series: 100, durability: 85, categories: [2], rarity: "legendary" },
  { id: 2, type: 101, classname: "hc_sofa", public_name: "HC Sofa", count: 3, is_wall: false, width: 2, length: 1, interaction_type: "multiheight", unique_number: 0, unique_series: 0, durability: null, categories: [1], rarity: null },
  { id: 3, type: 102, classname: "rare_dragon_lamp", public_name: "Drachen-Lampe", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "switch", unique_number: 7, unique_series: 50, durability: 34, categories: [2, 4], rarity: "epic" },
  { id: 4, type: 103, classname: "table_norja_med*2", public_name: "Norja Tisch", count: 5, is_wall: false, width: 2, length: 2, interaction_type: "default", unique_number: 0, unique_series: 0, durability: null, categories: [1], rarity: null },
  { id: 5, type: 104, classname: "bed_budget_one", public_name: "Budget Bett", count: 2, is_wall: false, width: 2, length: 3, interaction_type: "bed", unique_number: 0, unique_series: 0, durability: 92, categories: [1], rarity: null },
  { id: 6, type: 105, classname: "poster_trainer", public_name: "Trainer Poster", count: 1, is_wall: true, width: 0, length: 0, interaction_type: "default", unique_number: 0, unique_series: 0, durability: null, categories: [4], rarity: null },
  { id: 7, type: 106, classname: "rare_colourable_dragon*1", public_name: "Goldener Drache", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "default", unique_number: 15, unique_series: 25, durability: 100, categories: [2, 5], rarity: "legendary" },
  { id: 8, type: 107, classname: "teleport_door", public_name: "Teleporter", count: 4, is_wall: false, width: 1, length: 1, interaction_type: "teleport", unique_number: 0, unique_series: 0, durability: null, categories: [3], rarity: null },
  { id: 9, type: 108, classname: "dice_master", public_name: "Meister-Würfel", count: 2, is_wall: false, width: 1, length: 1, interaction_type: "dice", unique_number: 0, unique_series: 0, durability: 60, categories: [3], rarity: "rare" },
  { id: 10, type: 109, classname: "vending_machine", public_name: "Getränkeautomat", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "vendingmachine", unique_number: 0, unique_series: 0, durability: null, categories: [1], rarity: null },
  { id: 11, type: 110, classname: "crafting_table", public_name: "Crafting Tisch", count: 1, is_wall: false, width: 2, length: 1, interaction_type: "crackable", unique_number: 0, unique_series: 0, durability: null, categories: [1, 3], rarity: null },
  { id: 12, type: 111, classname: "rare_fountain*1", public_name: "Seltener Brunnen", count: 1, is_wall: false, width: 2, length: 2, interaction_type: "switch", unique_number: 3, unique_series: 10, durability: 78, categories: [2, 4], rarity: "epic" },
  { id: 13, type: 112, classname: "badge_display", public_name: "Badge-Vitrine", count: 6, is_wall: true, width: 0, length: 0, interaction_type: "badge", unique_number: 0, unique_series: 0, durability: null, categories: [4], rarity: null },
  { id: 14, type: 113, classname: "trophy_classic*1", public_name: "Klassische Trophäe", count: 2, is_wall: false, width: 1, length: 1, interaction_type: "trophy", unique_number: 0, unique_series: 0, durability: null, categories: [4], rarity: null },
  { id: 15, type: 114, classname: "gothic_chair*1", public_name: "Gothic Stuhl", count: 8, is_wall: false, width: 1, length: 1, interaction_type: "default", unique_number: 0, unique_series: 0, durability: null, categories: [5], rarity: null },
  { id: 16, type: 115, classname: "gate_garden", public_name: "Garten-Tor", count: 3, is_wall: false, width: 1, length: 1, interaction_type: "gate", unique_number: 0, unique_series: 0, durability: null, categories: [4], rarity: null },
  { id: 17, type: 116, classname: "roller_basic", public_name: "Roller", count: 20, is_wall: false, width: 1, length: 1, interaction_type: "roller", unique_number: 0, unique_series: 0, durability: null, categories: [3], rarity: null },
  { id: 18, type: 117, classname: "clothing_hat_top", public_name: "Zylinder", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "clothing", unique_number: 0, unique_series: 0, durability: null, categories: [], rarity: null },
  { id: 19, type: 118, classname: "pressureplate_polarbear", public_name: "Eisbär-Platte", count: 10, is_wall: false, width: 1, length: 1, interaction_type: "pressureplate", unique_number: 0, unique_series: 0, durability: null, categories: [3], rarity: null },
  { id: 20, type: 119, classname: "rare_moonlight*1", public_name: "Mondlicht", count: 1, is_wall: false, width: 1, length: 1, interaction_type: "switch", unique_number: 88, unique_series: 100, durability: 95, categories: [2, 5], rarity: "legendary" },
];

const INITIAL_HOTBAR: HotbarSlot[] = [
  { itemId: 4, classname: "table_norja_med*2", public_name: "Norja Tisch", count: 5 },
  { itemId: 17, classname: "roller_basic", public_name: "Roller", count: 20 },
  { itemId: 8, classname: "teleport_door", public_name: "Teleporter", count: 4 },
  { itemId: null, classname: null, public_name: null, count: 0 },
  { itemId: null, classname: null, public_name: null, count: 0 },
  { itemId: null, classname: null, public_name: null, count: 0 },
  { itemId: null, classname: null, public_name: null, count: 0 },
  { itemId: null, classname: null, public_name: null, count: 0 },
  { itemId: null, classname: null, public_name: null, count: 0 },
];

const CATEGORY_COLORS = ["#3b82f6", "#eab308", "#22c55e", "#a855f7", "#ef4444", "#f97316", "#06b6d4", "#ec4899"];

const RARITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  legendary: { bg: "bg-amber-500/10", text: "text-amber-400", label: "LGD" },
  epic: { bg: "bg-purple-500/10", text: "text-purple-400", label: "EPIC" },
  rare: { bg: "bg-blue-500/10", text: "text-blue-400", label: "RARE" },
};

const INTERACTION_LABELS: Record<string, string> = {
  vendingmachine: "Automat", gate: "Tor", teleport: "Teleporter", trophy: "Trophäe",
  badge: "Badge", bed: "Bett", roller: "Roller", dice: "Würfel", crackable: "Knackbar",
  switch: "Schalter", multiheight: "Multiheight", pressureplate: "Druckplatte",
  clothing: "Kleidung", default: "Standard",
};

type SortMode = "name" | "count" | "rarity";

// ─── Drag + Resize Hook ─────────────────────────

function useDragResize(initialPos: { x: number; y: number }, initialSize: { w: number; h: number }, minSize: { w: number; h: number }, maxSize: { w: number; h: number }) {
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
      }
      if (resizeRef.current) {
        const dw = e.clientX - resizeRef.current.startX;
        const dh = e.clientY - resizeRef.current.startY;
        setSize({
          w: Math.min(maxSize.w, Math.max(minSize.w, resizeRef.current.startW + dw)),
          h: Math.min(maxSize.h, Math.max(minSize.h, resizeRef.current.startH + dh)),
        });
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [minSize.w, minSize.h, maxSize.w, maxSize.h]);

  const onDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  const onResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
  };

  return { pos, size, onDragStart, onResizeStart };
}

// ─── Item Icon ──────────────────────────────────

function ItemIcon({ classname, className }: { classname: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={`flex items-center justify-center bg-muted/20 ${className || "w-full h-full"}`}>
      <Package className="w-3.5 h-3.5 text-muted-foreground/30" />
    </div>
  );
  return (
    <img src={getFurniIcon(classname)} alt={classname}
      className={`object-contain ${className || "w-full h-full"}`}
      style={{ imageRendering: "pixelated" }} loading="lazy" onError={() => setErr(true)} />
  );
}

// ─── Item Tile (tight) ──────────────────────────

function ItemTile({
  item, isSelected, isMultiSelected, multiMode, onSelect,
}: {
  item: InventoryItem; isSelected: boolean; isMultiSelected: boolean;
  multiMode: boolean; onSelect: () => void;
}) {
  const rarityStyle = item.rarity ? RARITY_STYLES[item.rarity] : null;
  const isLtd = item.unique_number > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onSelect}
            className={`relative w-[52px] h-[52px] border border-border/30 flex items-center justify-center transition-colors duration-100
              ${isSelected && !multiMode
                ? "bg-primary/15 border-primary/50 z-10"
                : isMultiSelected
                  ? "bg-sky-500/15 border-sky-400/50 z-10"
                  : "bg-card hover:bg-accent/40"}`}
          >
            <div className="w-9 h-9">
              <ItemIcon classname={item.classname} />
            </div>
            {multiMode && (
              <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[7px] font-bold
                ${isMultiSelected ? "border-sky-400 bg-sky-500 text-white" : "border-border/50 bg-card/80"}`}>
                {isMultiSelected && "✓"}
              </div>
            )}
            {isLtd && (
              <div className="absolute top-0 right-0">
                <span className="text-[7px] font-bold text-amber-300 bg-amber-900/60 px-0.5 leading-tight">
                  {item.unique_number}
                </span>
              </div>
            )}
            {item.count > 1 && (
              <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-foreground/60 tabular-nums leading-tight">
                {item.count}
              </span>
            )}
            {rarityStyle && (
              <span className={`absolute bottom-0 left-0 text-[6px] font-black uppercase px-0.5 leading-tight ${rarityStyle.bg} ${rarityStyle.text}`}>
                {rarityStyle.label}
              </span>
            )}
            {!multiMode && item.durability !== null && item.durability < 40 && (
              <Wrench className="absolute top-0.5 left-0.5 w-2.5 h-2.5 text-red-400" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="font-semibold text-xs">{item.public_name}</span>
            <span className="text-[9px] opacity-40 font-mono">{item.classname}</span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-80">
              <span>{item.count}×</span>
              <span>·</span>
              <span>{item.is_wall ? "Wand" : `${item.width}×${item.length}`}</span>
            </div>
            {isLtd && <span className="text-[10px] text-amber-400">LTD #{item.unique_number}/{item.unique_series}</span>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Durability Bar ─────────────────────────────

function DurabilityBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Wrench className={`w-3 h-3 shrink-0 ${value < 30 ? "text-red-400" : "text-muted-foreground/50"}`} />
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${value < 30 ? "bg-red-500" : value < 60 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums font-medium shrink-0 ${value < 30 ? "text-red-400" : value < 60 ? "text-amber-400" : "text-emerald-400"}`}>
        {value}%
      </span>
    </div>
  );
}

// ─── Inspector Panel (Enterprise - reui Frame) ──

function InspectorPanel({
  item, categories, onClose, onPlace, onDelete, onRepair, onHotbar,
  onAddCategory, onRemoveCategory,
}: {
  item: InventoryItem; categories: InventoryCategory[];
  onClose: () => void; onPlace: () => void; onDelete: () => void;
  onRepair: () => void; onHotbar: () => void;
  onAddCategory: (catId: number) => void; onRemoveCategory: (catId: number) => void;
}) {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const rarityStyle = item.rarity ? RARITY_STYLES[item.rarity] : null;
  const isLtd = item.unique_number > 0;
  const assignedCats = categories.filter(c => item.categories.includes(c.id));
  const unassignedCats = categories.filter(c => !item.categories.includes(c.id));

  return (
    <div className="shrink-0 px-1.5 pb-1.5">
      <Frame variant="default" spacing="sm" stacked className="rounded-xl">
        {/* Detail Panel */}
        <FramePanel className="rounded-xl">
          <div className="flex gap-3 p-3">
            {/* Preview Frame - inset display */}
            <div className="w-[72px] h-[72px] shrink-0 rounded-lg relative overflow-hidden bg-muted/40 border border-border/30"
              style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.02)" }}>
              <div className="absolute inset-0 opacity-[0.025]"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)", backgroundSize: "8px 8px" }} />
              <div className="relative flex items-center justify-center h-full p-1.5">
                <div className="w-12 h-12 drop-shadow-md"><ItemIcon classname={item.classname} /></div>
              </div>
              {isLtd && (
                <div className="absolute top-0 right-0 bg-amber-500/90 text-white text-[6px] font-black px-1 py-px rounded-bl leading-tight">
                  LTD
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[13px] font-semibold truncate leading-tight">{item.public_name}</h3>
                    <span className="text-base font-black tabular-nums text-foreground/60 leading-none">{item.count}×</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <code className="text-[9px] text-muted-foreground/50 font-mono bg-muted/40 px-1.5 py-0.5 rounded">{item.classname}</code>
                    {rarityStyle && (
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${rarityStyle.bg} ${rarityStyle.text}`}>
                        {rarityStyle.label}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-accent/50 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Metadata pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" size="xs" className="text-[8px] h-4 px-1.5">{item.is_wall ? "Wand" : "Boden"}</Badge>
                {!item.is_wall && <Badge variant="outline" size="xs" className="text-[8px] h-4 px-1.5">{item.width}×{item.length}</Badge>}
                <Badge variant="outline" size="xs" className="text-[8px] h-4 px-1.5">{INTERACTION_LABELS[item.interaction_type] || item.interaction_type}</Badge>
                {isLtd && <Badge variant="warning" size="xs" className="text-[8px] h-4 px-1.5">#{item.unique_number}/{item.unique_series}</Badge>}
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-1 flex-wrap">
                {assignedCats.map(cat => (
                  <span key={cat.id} className="inline-flex items-center gap-0.5 text-[8px] font-medium pl-1.5 pr-0.5 py-0.5 rounded-full border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                    <button onClick={() => onRemoveCategory(cat.id)} className="w-3 h-3 rounded-full flex items-center justify-center hover:text-red-400 hover:bg-red-500/10 transition-colors text-[9px]">×</button>
                  </span>
                ))}
                <Popover open={showCatPicker} onOpenChange={setShowCatPicker}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground/40 hover:text-muted-foreground px-1.5 py-0.5 rounded-full border border-dashed border-border/20 hover:border-border/40 transition-colors">
                      <Plus className="w-2 h-2" /><Tag className="w-2 h-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" sideOffset={4} className="w-auto p-1.5">
                    {unassignedCats.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground px-2 py-1">Alle zugewiesen</p>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {unassignedCats.map(cat => (
                          <button key={cat.id} onClick={() => { onAddCategory(cat.id); setShowCatPicker(false); }}
                            className="flex items-center gap-2 px-2 py-1 rounded text-[11px] hover:bg-accent/50 text-left">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Durability */}
              {item.durability !== null && <DurabilityBar value={item.durability} />}
            </div>
          </div>
        </FramePanel>

        {/* Action Toolbar Panel */}
        <FramePanel className="rounded-xl">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Button onClick={onPlace} className="h-7 gap-1.5 rounded-lg text-[10px] font-bold px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-sm" size="sm">
              <ArrowUpDown className="w-3 h-3" />Platzieren
            </Button>
            <Button variant="outline" onClick={onHotbar} className="h-7 gap-1.5 rounded-lg text-[10px] px-3" size="sm">
              <Zap className="w-3 h-3" />Hotbar
            </Button>
            <Button variant="outline" className="h-7 gap-1.5 rounded-lg text-[10px] px-3" size="sm">
              <Store className="w-3 h-3" />Markt
            </Button>
            {item.durability !== null && item.durability < 30 && (
              <Button variant="outline" onClick={onRepair} className="h-7 gap-1.5 rounded-lg text-[10px] px-3 text-amber-400 border-amber-500/30 hover:bg-amber-500/10" size="sm">
                <Wrench className="w-3 h-3" />Reparieren
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={onDelete} className="h-7 w-7 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10" size="icon">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}

// ─── Hotbar ─────────────────────────────────────

function Hotbar({ slots, onRemove }: { slots: HotbarSlot[]; onRemove: (index: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="shrink-0 border-t border-border/30 bg-card/50 px-3 py-1.5">
      <div className="flex items-center justify-center gap-1">
        {slots.map((slot, i) => {
          const filled = slot.itemId !== null;
          return (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`relative w-10 h-10 border flex items-center justify-center cursor-pointer transition-colors
                      ${filled ? hovered === i ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card" : "border-dashed border-border/20 bg-muted/5"}`}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  >
                    <span className="absolute top-0 left-0.5 text-[7px] font-semibold text-muted-foreground/25">{i + 1}</span>
                    {filled && slot.classname && (
                      <img src={getFurniIcon(slot.classname)} alt="" className="w-7 h-7 object-contain" style={{ imageRendering: "pixelated" }}
                        onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                    )}
                    {filled && slot.count > 0 && (
                      <span className="absolute bottom-0 right-0.5 text-[7px] font-bold text-foreground/50 tabular-nums">{slot.count}</span>
                    )}
                    {filled && hovered === i && (
                      <button onClick={e => { e.stopPropagation(); onRemove(i); }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[8px] font-bold hover:bg-red-500 z-10">×</button>
                    )}
                  </div>
                </TooltipTrigger>
                {filled && <TooltipContent side="top" sideOffset={4}><span className="text-xs">{slot.public_name} ({slot.count}×)</span></TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category Sidebar ───────────────────────────

function CategorySidebar({
  categories, activeCategory, onSelect, items, onCreateCategory,
}: {
  categories: InventoryCategory[]; activeCategory: number | null;
  onSelect: (id: number | null) => void; items: InventoryItem[];
  onCreateCategory: (name: string, color: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const getCatCount = (catId: number) => items.filter(i => i.categories.includes(catId)).length;

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateCategory(newName.trim(), newColor);
    setNewName(""); setNewColor(CATEGORY_COLORS[0]); setCreating(false);
  };

  return (
    <div className="flex flex-col gap-0.5 p-2">
      <button onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors
          ${activeCategory === null ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"}`}>
        <LayoutGrid className="w-3 h-3 opacity-50" />
        <span className="flex-1 text-left">Alle</span>
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{items.length}</span>
      </button>
      {categories.map(cat => (
        <button key={cat.id} onClick={() => onSelect(activeCategory === cat.id ? null : cat.id)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors
            ${activeCategory === cat.id ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"}`}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="flex-1 text-left truncate">{cat.name}</span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{getCatCount(cat.id)}</span>
        </button>
      ))}
      <Separator className="my-1" />
      {creating ? (
        <div className="flex flex-col gap-1 px-1">
          <Input placeholder="Name..." value={newName} onChange={e => setNewName(e.target.value)}
            className="h-5 text-[10px] px-2" autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }} />
          <div className="flex items-center gap-0.5 flex-wrap">
            {CATEGORY_COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${newColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="flex-1 h-5 text-[9px] rounded" onClick={handleCreate}>
              <Check className="w-2.5 h-2.5 mr-0.5" />OK
            </Button>
            <Button variant="ghost" size="sm" className="h-5 text-[9px] rounded" onClick={() => setCreating(false)}>
              <X className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground/50 hover:bg-accent/30 transition-colors">
          <Plus className="w-3 h-3" /><span>Erstellen</span>
        </button>
      )}
    </div>
  );
}

// ─── Category Assign Popover ────────────────────

function CategoryAssignPopover({ categories, onAssign, onClose }: {
  categories: InventoryCategory[]; onAssign: (catId: number) => void; onClose: () => void;
}) {
  return (
    <Popover open onOpenChange={v => { if (!v) onClose(); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 rounded px-2">
          <Layers className="w-2.5 h-2.5" /> Kategorie
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={4} className="w-auto p-1.5">
        <div className="flex flex-col gap-0.5">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { onAssign(cat.id); onClose(); }}
              className="flex items-center gap-2 px-2 py-1 rounded text-[11px] hover:bg-accent/50 text-left">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const InventoryV2View: FC<{}> = () => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [categories, setCategories] = useState<InventoryCategory[]>(INITIAL_CATEGORIES);
  const [hotbar, setHotbar] = useState<HotbarSlot[]>(INITIAL_HOTBAR);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [multiMode, setMultiMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [placeFeedback, setPlaceFeedback] = useState<number | null>(null);
  const [showCatAssign, setShowCatAssign] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { pos, size, onDragStart, onResizeStart } = useDragResize(
    { x: 0, y: 0 }, { w: 660, h: 520 },
    { w: 500, h: 400 }, { w: 900, h: 700 }
  );

  // Center on mount
  const [centered, setCentered] = useState(false);
  useEffect(() => {
    if (!centered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = (rect.width - size.w) / 2;
      const cy = (rect.height - size.h) / 2;
      // We can't set pos directly since it's from useDragResize, so we init with 0,0 and use transform
      setCentered(true);
    }
  }, [centered, size.w, size.h]);

  const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId) ?? null, [items, selectedItemId]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory !== null) result = result.filter(i => i.categories.includes(activeCategory));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.public_name.toLowerCase().includes(q) || i.classname.toLowerCase().includes(q));
    }
    switch (sortMode) {
      case "count": return [...result].sort((a, b) => b.count - a.count);
      case "rarity": return [...result].sort((a, b) => {
        const order = { legendary: 3, epic: 2, rare: 1 };
        return (order[b.rarity as keyof typeof order] || 0) - (order[a.rarity as keyof typeof order] || 0);
      });
      default: return [...result].sort((a, b) => a.public_name.localeCompare(b.public_name));
    }
  }, [items, search, activeCategory, sortMode]);

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.count, 0), [items]);

  const toggleMulti = useCallback((id: number) => {
    setMultiSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleSelect = useCallback((item: InventoryItem) => {
    if (multiMode) toggleMulti(item.id);
    else setSelectedItemId(prev => prev === item.id ? null : item.id);
  }, [multiMode, toggleMulti]);

  const handleCreateCategory = useCallback((name: string, color: string) => {
    const maxId = categories.reduce((m, c) => Math.max(m, c.id), 0);
    setCategories(prev => [...prev, { id: maxId + 1, name, color }]);
  }, [categories]);

  const handlePlace = useCallback(() => {
    if (!selectedItem) return;
    setPlaceFeedback(selectedItem.id);
    setTimeout(() => setPlaceFeedback(null), 800);
    if (selectedItem.count <= 1) { setItems(prev => prev.filter(i => i.id !== selectedItem.id)); setSelectedItemId(null); }
    else setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, count: i.count - 1 } : i));
  }, [selectedItem]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    setItems(prev => prev.filter(i => i.id !== selectedItem.id));
    setSelectedItemId(null);
    setHotbar(prev => prev.map(s => s.itemId === selectedItem.id ? { itemId: null, classname: null, public_name: null, count: 0 } : s));
  }, [selectedItem]);

  const handleMultiDelete = useCallback(() => {
    setItems(prev => prev.filter(i => !multiSelected.has(i.id)));
    setHotbar(prev => prev.map(s => s.itemId !== null && multiSelected.has(s.itemId) ? { itemId: null, classname: null, public_name: null, count: 0 } : s));
    setMultiSelected(new Set()); setMultiMode(false);
  }, [multiSelected]);

  const handleRepair = useCallback(() => {
    if (!selectedItem) return;
    setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, durability: 100 } : i));
  }, [selectedItem]);

  const handleAddToHotbar = useCallback(() => {
    if (!selectedItem) return;
    const emptyIdx = hotbar.findIndex(s => s.itemId === null);
    if (emptyIdx === -1 || hotbar.some(s => s.itemId === selectedItem.id)) return;
    setHotbar(prev => prev.map((s, i) => i === emptyIdx
      ? { itemId: selectedItem.id, classname: selectedItem.classname, public_name: selectedItem.public_name, count: selectedItem.count } : s));
  }, [selectedItem, hotbar]);

  const handleRemoveFromHotbar = useCallback((index: number) => {
    setHotbar(prev => prev.map((s, i) => i === index ? { itemId: null, classname: null, public_name: null, count: 0 } : s));
  }, []);

  const handleAddItemCategory = useCallback((itemId: number, catId: number) => {
    setItems(prev => prev.map(i => i.id === itemId && !i.categories.includes(catId) ? { ...i, categories: [...i.categories, catId] } : i));
  }, []);

  const handleRemoveItemCategory = useCallback((itemId: number, catId: number) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, categories: i.categories.filter(c => c !== catId) } : i));
  }, []);

  const handleMultiAssignCategory = useCallback((catId: number) => {
    setItems(prev => prev.map(i => multiSelected.has(i.id) && !i.categories.includes(catId) ? { ...i, categories: [...i.categories, catId] } : i));
    setMultiSelected(new Set()); setMultiMode(false);
  }, [multiSelected]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Möbel-Anzeige</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Inventar-Redesign Prototyp · {items.length} Gruppen · {totalCount} Stück · Ziehen zum Bewegen · Ecke zum Skalieren
            </p>
          </div>
          <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--muted)/0.15) 0%, hsl(var(--background)) 70%)" }}>
        {/* Draggable + Resizable Panel */}
        <div className="absolute flex flex-col rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          style={{
            width: size.w, height: size.h,
            left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`,
            transform: `translate(-${size.w / 2}px, -${size.h / 2}px)`,
          }}>
          {/* Title Bar (drag handle) */}
          <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onDragStart}>
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
              <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-[13px] font-semibold">Inventar</span>
              <span className="text-[10px] text-muted-foreground/40 tabular-nums">{totalCount} Möbel</span>
            </div>
            <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
              onPointerDown={e => e.stopPropagation()}>
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            <div className="w-[150px] shrink-0 border-r border-border/40 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <CategorySidebar categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory}
                items={items} onCreateCategory={handleCreateCategory} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Toolbar */}
              <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30 bg-card/30">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                  <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-6 text-[11px]" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-2.5 h-2.5 text-muted-foreground/50" /></button>}
                </div>
                <Separator orientation="vertical" className="h-3.5" />
                {(["name", "count", "rarity"] as SortMode[]).map(mode => (
                  <button key={mode} onClick={() => setSortMode(mode)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${sortMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50"}`}>
                    {mode === "name" ? "A-Z" : mode === "count" ? "Menge" : "Rarität"}
                  </button>
                ))}
                <Separator orientation="vertical" className="h-3.5" />
                <button onClick={() => { setMultiMode(!multiMode); setMultiSelected(new Set()); setShowCatAssign(false); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${multiMode ? "bg-sky-500/10 text-sky-400" : "text-muted-foreground hover:bg-accent/50"}`}>
                  <CheckSquare className="w-2.5 h-2.5" />Multi
                </button>
                <span className="text-[9px] text-muted-foreground/40 tabular-nums ml-auto">{filteredItems.length}/{items.length}</span>
              </div>

              {/* Multi toolbar */}
              {multiMode && multiSelected.size > 0 && (
                <div className="shrink-0 flex items-center gap-2 px-2 py-1 border-b border-sky-500/20 bg-sky-500/5">
                  <span className="text-[9px] font-semibold text-sky-400">{multiSelected.size} ausgewählt</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {showCatAssign
                      ? <CategoryAssignPopover categories={categories} onAssign={handleMultiAssignCategory} onClose={() => setShowCatAssign(false)} />
                      : <Button variant="outline" size="sm" className="h-5 text-[9px] gap-1 rounded px-1.5" onClick={() => setShowCatAssign(true)}><Layers className="w-2.5 h-2.5" />Kategorie</Button>}
                    <Button variant="outline" size="sm" className="h-5 text-[9px] gap-1 rounded px-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={handleMultiDelete}>
                      <Trash2 className="w-2.5 h-2.5" />Löschen
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] rounded px-1.5" onClick={() => { setMultiMode(false); setMultiSelected(new Set()); }}>Abbrechen</Button>
                  </div>
                </div>
              )}

              {/* Tight Item Grid */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-0.5">
                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="w-8 h-8 mb-2 opacity-20" />
                      <p className="font-medium text-xs">Keine Möbel gefunden</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap">
                      {filteredItems.map(item => (
                        <div key={item.id} className="relative" style={{ margin: "-0.5px" }}>
                          {placeFeedback === item.id && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/20 animate-pulse pointer-events-none">
                              <Check className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                          <ItemTile item={item}
                            isSelected={selectedItemId === item.id}
                            isMultiSelected={multiSelected.has(item.id)}
                            multiMode={multiMode}
                            onSelect={() => handleSelect(item)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Inspector */}
              {!multiMode && selectedItem && (
                <InspectorPanel item={selectedItem} categories={categories}
                  onClose={() => setSelectedItemId(null)} onPlace={handlePlace} onDelete={handleDelete}
                  onRepair={handleRepair} onHotbar={handleAddToHotbar}
                  onAddCategory={catId => handleAddItemCategory(selectedItem.id, catId)}
                  onRemoveCategory={catId => handleRemoveItemCategory(selectedItem.id, catId)} />
              )}
            </div>
          </div>

          {/* Hotbar */}
          <Hotbar slots={hotbar} onRemove={handleRemoveFromHotbar} />

          {/* Resize Handle */}
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end"
            onPointerDown={onResizeStart}>
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/30">
              <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
