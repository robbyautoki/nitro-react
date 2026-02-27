
/* eslint-disable react/no-unknown-property */
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Package,
  Search,
  X,
  Star,
  Clock,
  Flame,
  ShieldCheck,
  Minus,
  Plus,
  ShoppingCart,
  Gift,
  Sparkles,
  Eye,
  Keyboard,
  PanelLeftClose,
  PanelLeft,

  Filter,
  FileText,
  PawPrint,
  Crown,
  Users,
  MessageSquare,
  Paintbrush,
  Store,
  Music,
  Megaphone,
  Bot,
  Palette,
  Trophy,
  Award,
  Home,
  Layers,
  Play,
  Type,
  RotateCw,
  ZoomIn,
  Box,
  Shirt,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => GetConfiguration<string>('asset.url', 'http://localhost:8080');
const IMAGE_LIB_URL = `${ASSETS_URL()}`;

const CURRENCY_ICONS = {
  credits: `${ASSETS_URL()}/wallet/-1.png`,
  duckets: `${ASSETS_URL()}/wallet/0.png`,
  diamonds: `${ASSETS_URL()}/wallet/5.png`,
  hc: `${ASSETS_URL()}/wallet/hc.png`,
} as const;

const HABBO_IMAGER = "https://www.habbo.de/habbo-imaging/avatarimage";
const HC_FIGURES = [
  "hr-3163-42.hd-180-1.ch-3030-64.lg-275-64.sh-3068-64.ha-3129-64",
  "hr-3322-45.hd-600-10.ch-3185-92.lg-3116-92.sh-3115-92.he-3082-92",
  "hr-3012-42.hd-180-2.ch-3324-110.lg-3058-110.sh-3068-64.ha-3129-110",
];

function getFurniIcon(cn: string) {
  return `${ASSETS_URL()}/c_images/${cn.split("*")[0]}_icon.png`;
}
function getCatalogIcon(iconId: number) {
  return `${ASSETS_URL()}/c_images/catalogue/icon_${iconId}.png`;
}

const PAGE_SIZE = 100;
const DEFAULT_PRICE = 3;

// ─── Types ──────────────────────────────────

interface CatalogPage {
  id: number;
  parent_id: number;
  caption: string;
  caption_save: string;
  order_num: number;
  visible: string;
  enabled: string;
  min_rank: number;
  page_layout: string;
  club_only: string;
  vip_only: string;
  item_count: number;
  child_count: number;
  icon_image: number;
}

interface PageDetail {
  id: number;
  caption: string;
  page_layout: string;
  page_headline: string;
  page_teaser: string;
  page_text1: string;
  page_text2: string;
  page_text_details: string;
  page_text_teaser: string;
}

interface CatalogItem {
  catalog_item_id: number;
  item_id: number;
  sprite_id: number;
  classname: string;
  public_name: string;
  cost_credits: number;
  cost_points: number;
  points_type: number;
  amount: number;
  limited_stack: number;
  limited_sells: number;
  order_number: number;
  page_id: number;
  item_type: string;
  width: number;
  length: number;
  interaction_type: string;
  interaction_modes_count?: number;
}

interface TreeNode extends CatalogPage {
  children: TreeNode[];
  expanded: boolean;
}

interface CatalogStats {
  priceDistribution: { price_range: string; cnt: number }[];
  topPages: { id: number; caption: string; page_layout: string; item_cnt: number }[];
  featuredPages: { slot_id: number; image: string; caption: string; type: string; page_name: string; page_id: number }[];
  clubOffers: { id: number; name: string; days: number; credits: number; points: number; type: string }[];
  targetOffers: { id: number; title: string; description: string; image: string; credits: number; points: number }[];
  limitedCount: number;
  interactionTypes: { interaction_type: string; cnt: number }[];
  pagesWithContent: number;
}

interface RecentPurchase {
  id: number; timestamp: number; user_id: number; catalog_item_id: number;
  catalog_name: string; cost_credits: number; cost_points: number; amount: number;
  classname: string | null; public_name: string | null; username: string | null;
}

interface PopularItem {
  catalog_item_id: number; catalog_name: string; purchase_count: number;
  cost_credits: number; cost_points: number;
  classname: string | null; public_name: string | null;
}

const INTERACTION_LABELS: Record<string, { label: string; color: string }> = {
  vendingmachine: { label: "Automat", color: "text-emerald-400" },
  gate: { label: "Tor", color: "text-blue-400" },
  teleport: { label: "Teleporter", color: "text-purple-400" },
  trophy: { label: "Trophäe", color: "text-amber-400" },
  badge: { label: "Badge", color: "text-cyan-400" },
  bed: { label: "Bett", color: "text-pink-400" },
  roller: { label: "Roller", color: "text-orange-400" },
  dice: { label: "Würfel", color: "text-red-400" },
  crackable: { label: "Knackbar", color: "text-lime-400" },
  effect: { label: "Effekt", color: "text-violet-400" },
  clothing: { label: "Kleidung", color: "text-rose-400" },
  pressureplate: { label: "Druckplatte", color: "text-teal-400" },
  switch: { label: "Schalter", color: "text-yellow-400" },
  multiheight: { label: "Multiheight", color: "text-sky-400" },
  pet_food: { label: "Tierfutter", color: "text-green-400" },
};

// ─── Tree helpers ───────────────────────────

function buildTree(pages: CatalogPage[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  for (const p of pages) map.set(p.id, { ...p, children: [], expanded: false });
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id === -1) roots.push(node);
    else map.get(node.parent_id)?.children.push(node);
  }
  for (const node of map.values())
    node.children.sort((a, b) => a.order_num - b.order_num || a.caption.localeCompare(b.caption));
  return roots.sort((a, b) => a.order_num - b.order_num);
}

function findNodeById(nodes: TreeNode[], id: number): TreeNode | null {
  for (const n of nodes) { if (n.id === id) return n; const c = findNodeById(n.children, id); if (c) return c; }
  return null;
}

function getTotalItems(node: TreeNode): number {
  let t = node.item_count;
  for (const c of node.children) t += getTotalItems(c);
  return t;
}

function getBreadcrumbs(pages: CatalogPage[], pageId: number) {
  const map = new Map<number, CatalogPage>();
  for (const p of pages) map.set(p.id, p);
  const crumbs: { id: number; caption: string }[] = [];
  let cur = map.get(pageId);
  while (cur) {
    crumbs.unshift({ id: cur.id, caption: cur.caption });
    cur = cur.parent_id !== -1 ? map.get(cur.parent_id) : undefined;
  }
  return crumbs;
}

// ─── Catalog Category Icon ──────────────────

function CatalogIconImg({ iconId, size = 20 }: { iconId: number; size?: number }) {
  const [err, setErr] = useState(false);
  if (err || !iconId) return <Package className="shrink-0 opacity-30" style={{ width: size - 4, height: size - 4 }} />;
  return (
    <img
      src={getCatalogIcon(iconId)}
      alt=""
      className="shrink-0 object-contain"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

// ─── Furni Icon ─────────────────────────────

function ItemIcon({ classname, className }: { classname: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err)
    return (
      <div className={`flex items-center justify-center rounded bg-muted/30 ${className || "w-full h-full"}`}>
        <Package className="w-4 h-4 text-muted-foreground/40" />
      </div>
    );
  return (
    <img
      src={getFurniIcon(classname)}
      alt={classname}
      className={`object-contain ${className || "w-full h-full"}`}
      style={{ imageRendering: "pixelated" }}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

// ─── Sidebar Nav Item ───────────────────────

function SidebarNavItem({
  node, depth, selectedId, onSelect, onToggle, favorites, onToggleFavorite,
}: {
  node: TreeNode; depth: number; selectedId: number | null;
  onSelect: (n: TreeNode) => void; onToggle: (id: number) => void;
  favorites: Set<number>; onToggleFavorite: (id: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isFav = favorites.has(node.id);
  const total = getTotalItems(node);
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <div className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <button
          onClick={() => { if (hasChildren) onToggle(node.id); onSelect(node); }}
          className={`w-full flex items-center gap-2.5 py-[6px] text-sm rounded-lg transition-all duration-150 ${isSelected
            ? "bg-accent text-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
          style={{ paddingLeft: `${depth * 14 + 10}px`, paddingRight: "10px" }}
        >
          <CatalogIconImg iconId={node.icon_image} size={20} />
          <span className="truncate flex-1 text-left">{node.caption}</span>

          {hovered && !hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(node.id); }}
              className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
            >
              <Star className={`w-3 h-3 ${isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            </button>
          ) : total > 0 ? (
            <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">{total.toLocaleString("de-DE")}</span>
          ) : null}

          {hasChildren && (
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200 ${node.expanded ? "rotate-90" : ""}`} />
          )}
        </button>
      </div>
      {hasChildren && node.expanded &&
        node.children.filter((c) => c.visible === "1").map((c) => (
          <SidebarNavItem key={c.id} node={c} depth={depth + 1} selectedId={selectedId}
            onSelect={onSelect} onToggle={onToggle} favorites={favorites} onToggleFavorite={onToggleFavorite} />
        ))}
    </div>
  );
}

// ─── Item Grid Tile ─────────────────────────

function ItemTile({ item, isSelected, onSelect }: { item: CatalogItem; isSelected: boolean; onSelect: () => void }) {
  const isDefaultPrice = item.cost_credits === DEFAULT_PRICE && item.cost_points === 0;
  const isFree = item.cost_credits === 0 && item.cost_points === 0;
  const interactionInfo = INTERACTION_LABELS[item.interaction_type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onSelect}
            className={`group relative aspect-square rounded-xl border p-1.5 transition-all duration-150
              ${isSelected
                ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-[0_0_12px_rgba(var(--primary),0.15)]"
                : "border-border/50 bg-card hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm"}`}
          >
            <ItemIcon classname={item.classname} />
            {item.limited_stack > 0 && (
              <div className="absolute top-1 right-1">
                <Badge variant="warning" size="xs" className="text-[8px] px-1">LTD</Badge>
              </div>
            )}
            {isFree && (
              <div className="absolute bottom-1 left-1">
                <Badge variant="success" size="xs" className="text-[8px] px-1">GRATIS</Badge>
              </div>
            )}
            {!isDefaultPrice && !isFree && item.cost_credits > DEFAULT_PRICE && (
              <div className="absolute bottom-1 right-1">
                <Badge variant="info-light" size="xs" className="text-[8px] px-1">{item.cost_credits}</Badge>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          <div className="flex flex-col gap-0.5 max-w-[220px]">
            <span className="font-semibold text-xs">{item.public_name || item.classname}</span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-80">
              {item.cost_credits > 0 && (
                <span className="flex items-center gap-0.5">
                  <CurrencyIcon type="credits" className="w-3.5 h-3.5" />{item.cost_credits}
                  {isDefaultPrice && <span className="opacity-50">(Standard)</span>}
                </span>
              )}
              {item.cost_points > 0 && (
                <span className="flex items-center gap-0.5"><CurrencyIcon type="diamonds" className="w-3.5 h-3.5" />{item.cost_points}</span>
              )}
              {isFree && <span className="text-emerald-400">Kostenlos</span>}
            </div>
            {interactionInfo && <span className={`text-[10px] ${interactionInfo.color}`}>{interactionInfo.label}</span>}
            {item.limited_stack > 0 && <span className="text-[10px] text-amber-400">Limited: {item.limited_sells}/{item.limited_stack}</span>}
            <span className="text-[9px] opacity-40 font-mono">{item.classname}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Page Header Banner ─────────────────────

function PageHeaderBanner({ detail }: { detail: PageDetail }) {
  const hasHeadline = detail.page_headline && detail.page_headline.length > 0;
  const hasText = detail.page_text1 && detail.page_text1.length > 0;
  if (!hasHeadline && !hasText) return null;

  return (
    <div className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-4 px-4 py-3">
        {hasHeadline && (
          <img src={`${IMAGE_LIB_URL}/${detail.page_headline}`} alt=""
            className="h-12 object-contain shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <div className="flex-1 min-w-0">
          {hasText && <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />}
        </div>
        <Badge variant="outline" size="sm" className="shrink-0 opacity-60">{detail.page_layout}</Badge>
      </div>
    </div>
  );
}

// ─── Frontpage with Carousel + Purchase Stats ─

function CatalogFrontpage({
  features, recentPurchases, popularItems, onLoadRecent, onLoadPopular, bannerDismissed, onDismissBanner, onNavigateToPage,
}: {
  features: CatalogStats["featuredPages"];
  recentPurchases: RecentPurchase[];
  popularItems: PopularItem[];
  onLoadRecent: () => void;
  onLoadPopular: () => void;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onNavigateToPage?: (pageId: number) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { onLoadRecent(); onLoadPopular(); }, [onLoadRecent, onLoadPopular]);

  useEffect(() => {
    if (features.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [features.length]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const slide = container.children[currentSlide] as HTMLElement;
    if (slide) slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, [currentSlide]);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Gerade eben";
    if (diffH < 24) return `vor ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `vor ${diffD}d`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Promo Banner */}
      {!bannerDismissed && (
        <div className="shrink-0 mx-3 mt-3 relative rounded-lg overflow-hidden cursor-pointer group" onClick={() => onNavigateToPage?.(83)}>
          <div className="absolute inset-0 rounded-lg" style={{
            padding: "1px",
            background: "linear-gradient(90deg, #a855f7, #ec4899, #f59e0b, #06b6d4, #a855f7)",
            backgroundSize: "300% 100%",
            animation: "rainbow-border 4s linear infinite",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          } as React.CSSProperties} />
          <div className="relative flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-amber-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm font-bold">Neue Rares sind da!</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Jetzt ansehen →</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDismissBanner(); }} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Auto-Carousel */}
      {features.length > 0 && (
        <div className="shrink-0 relative">
          <div ref={scrollRef} className="flex overflow-hidden scroll-smooth">
            {features.map((f, i) => (
              <div key={f.slot_id} className="min-w-full relative">
                <div className="aspect-[21/9] bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden">
                  <img src={`${IMAGE_LIB_URL}/${f.image}`} alt={f.caption}
                    className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-14">
                  <p className="text-base font-bold text-white drop-shadow-lg">{f.caption}</p>
                  <p className="text-xs text-white/50 mt-0.5">{f.page_name}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          {features.length > 1 && (
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {features.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-5 space-y-5">
        {/* Meist gekauft */}
        {popularItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold">Meist gekauft</span>
              <Badge variant="secondary" size="xs">{popularItems.length}</Badge>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              {popularItems.map((item) => (
                <div key={item.catalog_item_id} className="shrink-0 w-[120px] flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden">
                    {item.classname && <ItemIcon classname={item.classname} />}
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight line-clamp-2">{item.public_name || item.classname || item.catalog_name}</span>
                  <Badge variant="secondary" size="xs" className="gap-0.5"><Flame className="w-2.5 h-2.5 text-orange-400" />{item.purchase_count}×</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Letzte Käufe */}
        {recentPurchases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold">Letzte Käufe</span>
            </div>
            <div className="flex flex-col gap-1">
              {recentPurchases.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden">
                    {p.classname && <ItemIcon classname={p.classname} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium block truncate">{p.public_name || p.classname || p.catalog_name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.username || "Unbekannt"} · {formatTime(p.timestamp)}</span>
                  </div>
                  <div className="shrink-0">
                    <PriceDisplay credits={p.cost_credits} points={p.cost_points} isFree={p.cost_credits === 0 && p.cost_points === 0} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">Wähle eine Kategorie oder nutze die Suche</p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
            <Keyboard className="w-3 h-3" />
            <kbd className="font-mono bg-muted rounded px-1.5 py-0.5 border border-border/50 text-[9px]">⌘K</kbd>
            zum Suchen
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interaction Type Filter ────────────────

function InteractionFilter({ items, activeFilter, onFilter }: {
  items: CatalogItem[]; activeFilter: string | null; onFilter: (f: string | null) => void;
}) {
  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const t = item.interaction_type || "default";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return Array.from(counts.entries()).filter(([t]) => t !== "default").sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [items]);

  if (types.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border/30 bg-muted/10 overflow-x-auto">
      <Filter className="w-3 h-3 text-muted-foreground/40 shrink-0" />
      <button onClick={() => onFilter(null)}
        className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors
          ${!activeFilter ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50"}`}>
        Alle
      </button>
      {types.map(([type, count]) => {
        const info = INTERACTION_LABELS[type];
        return (
          <button key={type} onClick={() => onFilter(activeFilter === type ? null : type)}
            className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1
              ${activeFilter === type ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50"}`}>
            {info?.label || type}
            <span className="opacity-40 text-[9px]">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Content Block Parser ───────────────────

function parseContentBlocks(html: string): { number?: string; html: string }[] {
  if (!html?.trim()) return [];
  const normalized = html.replace(/<br\s*\/?>/gi, "\n");
  const chunks = normalized.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const rendered = chunk.replace(/\n/g, "<br>");
    const match = chunk.match(/^(\d+)\.\s*/);
    if (match) return { number: match[1], html: rendered.replace(/^\d+\.\s*/, "") };
    return { html: rendered };
  });
}

// ─── Layout: Pets ───────────────────────────

function LayoutPets({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  const [petName, setPetName] = useState("");
  const selected = selectedItem;
  const petColors = ["#E8A87C", "#85DCB0", "#E27D60", "#C38D9E", "#41B3A3", "#F6D55C", "#3CAEA3", "#ED553B", "#F2A154", "#7768AE", "#20639B", "#3CAEA3", "#173F5F", "#ED553B", "#F6D55C", "#D4A5A5"];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Pet breeds grid */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
        {detail && (
          <div className="flex items-center gap-3 mb-4">
            {detail.page_headline && (
              <img src={`${IMAGE_LIB_URL}/${detail.page_headline}`} alt="" className="h-10 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2"><PawPrint className="w-4 h-4 text-primary/60" />{detail.caption}</h3>
              {detail.page_text1 && <p className="text-[11px] text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />}
            </div>
          </div>
        )}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PawPrint className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Haustiere auf dieser Seite</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {items.map((item) => {
              const isActive = selected?.catalog_item_id === item.catalog_item_id;
              return (
                <button key={item.catalog_item_id} onClick={() => onSelect(isActive ? null : item)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${isActive
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-lg" : "border-border/50 bg-card hover:border-primary/30 hover:shadow-md"}`}>
                  <div className="w-20 h-16 flex items-center justify-center">
                    <img src={`${ASSETS_URL()}/c_images/${item.classname.split("*")[0]}_icon.png`} alt={item.public_name}
                      className="max-w-full max-h-full object-contain" style={{ imageRendering: "pixelated" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }} />
                    {/* Fallback */}
                    <PawPrint className="w-8 h-8 text-muted-foreground/20 absolute" />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">{item.public_name || item.classname}</span>
                  <PriceDisplay credits={item.cost_credits} points={item.cost_points} isFree={item.cost_credits === 0 && item.cost_points === 0} size="sm" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pet config panel (right side) */}
      {selected && (
        <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="relative h-[180px] shrink-0 overflow-hidden" style={{ backgroundImage: `url('${ROOM_BG_SVG}')`, backgroundColor: "hsl(var(--muted) / 0.3)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="flex items-center justify-center h-full">
              <PawPrint className="w-16 h-16 text-primary/20" />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h3 className="text-base font-bold">{selected.public_name || selected.classname}</h3>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold block mb-2">Rasse wählen</span>
              <div className="grid grid-cols-4 gap-1.5">
                {petColors.map((c, i) => (
                  <div key={i} className="aspect-square rounded-lg border-2 border-border/30 cursor-pointer hover:border-primary/50 transition-colors" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold block mb-1.5">{detail?.page_text2 || "Name eingeben"}</span>
              <Input placeholder="Tiername eingeben..." value={petName} onChange={(e) => setPetName(e.target.value)} className="h-8 text-xs" />
            </div>
            <Separator />
            <PriceDisplay credits={selected.cost_credits} points={selected.cost_points} isFree={selected.cost_credits === 0 && selected.cost_points === 0} />
            <PurchaseButtons size="lg" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout: Info Pages (pets2/pets3/info_loyalty) ─

function LayoutInfoPage({ detail }: { detail: PageDetail | null }) {
  const blocks = useMemo(() => parseContentBlocks(detail?.page_text1 || ""), [detail]);
  if (!detail) return null;
  const teaserImage = detail.page_teaser;
  const headline = detail.page_headline;
  const text2 = detail.page_text2;
  const hasImages = headline || teaserImage;
  const numberedBlocks = blocks.filter(b => b.number);
  const textBlocks = blocks.filter(b => !b.number);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Hero Card */}
      {hasImages && (
        <div className="shrink-0 relative overflow-hidden border-b border-border/30">
          <div className="relative flex items-center gap-4 p-5 bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent">
            {(headline || teaserImage) && (
              <div className="shrink-0 flex items-center gap-3">
                {headline && (
                  <img src={`${IMAGE_LIB_URL}/${headline}`} alt="" className="h-14 object-contain rounded-lg drop-shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                {teaserImage && teaserImage !== headline && (
                  <img src={`${IMAGE_LIB_URL}/${teaserImage}`} alt="" className="h-14 object-contain rounded-lg drop-shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black tracking-tight">{detail.caption}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" size="xs" className="opacity-50">{detail.page_layout}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {!hasImages && (
          <h2 className="text-base font-black tracking-tight">{detail.caption}</h2>
        )}

        {/* Subtitle / page_text2 */}
        {text2 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm font-medium text-foreground/80 leading-relaxed [&_b]:font-bold [&_b]:text-foreground" dangerouslySetInnerHTML={{ __html: text2 }} />
            </CardContent>
          </Card>
        )}

        {/* Numbered steps as timeline */}
        {numberedBlocks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Anleitung</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col gap-3">
                {numberedBlocks.map((block, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                      {block.number}
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-muted-foreground leading-relaxed pt-1 [&_b]:font-semibold [&_b]:text-foreground" dangerouslySetInnerHTML={{ __html: block.html }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Text blocks */}
        {textBlocks.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                {textBlocks.map((block, i) => (
                  <div key={i} className="text-sm text-muted-foreground leading-relaxed [&_b]:font-semibold [&_b]:text-foreground [&_br]:mb-1 [&_h1]:text-lg [&_h1]:font-black [&_h1]:text-foreground [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-1" dangerouslySetInnerHTML={{ __html: block.html }} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback: raw page_text1 */}
        {blocks.length === 0 && detail.page_text1 ? (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground leading-relaxed [&_b]:font-semibold [&_b]:text-foreground [&_br]:mb-1 [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-foreground [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-2" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />
            </CardContent>
          </Card>
        ) : blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Inhalte auf dieser Seite</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Layout: Single Bundle ──────────────────

function LayoutSingleBundle({ detail, items }: { detail: PageDetail | null; items: CatalogItem[] }) {
  const totalCredits = items.reduce((s, i) => s + i.cost_credits, 0);
  const totalPoints = items.reduce((s, i) => s + i.cost_points, 0);
  const bundlePrice = items[0]?.cost_credits ?? totalCredits;
  const bundlePoints = items[0]?.cost_points ?? totalPoints;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Hero Banner */}
      {detail?.page_teaser && (
        <div className="shrink-0 relative h-[200px] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <img src={`${IMAGE_LIB_URL}/${detail.page_teaser}`} alt="" className="w-full h-full object-cover opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge variant="secondary" size="sm" className="mb-2"><Box className="w-3 h-3" /> Bundle</Badge>
            <h2 className="text-xl font-black tracking-tight">{detail?.caption}</h2>
          </div>
        </div>
      )}
      {!detail?.page_teaser && detail && (
        <div className="shrink-0 p-4 border-b border-border/30">
          <Badge variant="secondary" size="sm" className="mb-2"><Box className="w-3 h-3" /> Bundle</Badge>
          <h2 className="text-xl font-black tracking-tight">{detail.caption}</h2>
        </div>
      )}

      {/* Description */}
      {(detail?.page_text1 || detail?.page_text2) && (
        <div className="shrink-0 px-4 py-3 border-b border-border/20">
          {detail?.page_text2 && <p className="text-sm font-semibold mb-1">{detail.page_text2}</p>}
          {detail?.page_text1 && <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />}
        </div>
      )}

      {/* Bundle contents - horizontal scroll */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Paket-Inhalt · {items.length} Items</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
          {items.map((item) => (
            <div key={item.catalog_item_id} className="shrink-0 w-[56px] h-[56px] rounded-lg border border-border/40 bg-card flex items-center justify-center overflow-hidden">
              <ItemIcon classname={item.classname} className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Big purchase area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <PriceDisplay credits={bundlePrice} points={bundlePoints} isFree={bundlePrice === 0 && bundlePoints === 0} />
        <div className="w-full max-w-xs">
          <PurchaseButtons size="lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Room Bundle ────────────────────

function LayoutRoomBundle({ detail, items }: { detail: PageDetail | null; items: CatalogItem[] }) {
  const bundlePrice = items[0]?.cost_credits ?? 0;
  const bundlePoints = items[0]?.cost_points ?? 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Room preview */}
      <div className="flex-[3] min-w-0 relative overflow-hidden" style={{ backgroundImage: `url('${ROOM_BG_SVG}')`, backgroundColor: "hsl(var(--muted) / 0.2)" }}>
        {detail?.page_teaser && (
          <img src={`${IMAGE_LIB_URL}/${detail.page_teaser}`} alt="" className="w-full h-full object-cover opacity-60"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/90" />
        <div className="absolute bottom-4 left-4">
          <Badge variant="info-light" size="sm" className="mb-2"><Home className="w-3 h-3" /> Raum-Bundle</Badge>
          <h2 className="text-lg font-black tracking-tight">{detail?.caption}</h2>
          {detail?.page_text1 && <p className="text-xs text-muted-foreground mt-1">{detail.page_text1}</p>}
        </div>
      </div>

      {/* Right: Bundle details */}
      <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="p-4">
          <h3 className="text-base font-bold mb-1">{detail?.caption}</h3>
          {detail?.page_text2 && <p className="text-xs text-muted-foreground mb-3">{detail.page_text2}</p>}
        </div>
        <Separator />
        <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 block mb-2">{items.length} Items enthalten</span>
          <div className="flex flex-col gap-1.5">
            {items.slice(0, 30).map((item) => (
              <div key={item.catalog_item_id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="w-8 h-8 shrink-0 rounded bg-muted/20 flex items-center justify-center overflow-hidden">
                  <ItemIcon classname={item.classname} className="w-full h-full" />
                </div>
                <span className="text-[11px] truncate flex-1">{item.public_name || item.classname}</span>
                {item.amount > 1 && <Badge variant="secondary" size="xs">×{item.amount}</Badge>}
              </div>
            ))}
            {items.length > 30 && <span className="text-[10px] text-muted-foreground/50 text-center">+{items.length - 30} weitere</span>}
          </div>
        </div>
        <div className="shrink-0 p-4 border-t border-border/30 space-y-3">
          <PriceDisplay credits={bundlePrice} points={bundlePoints} isFree={bundlePrice === 0 && bundlePoints === 0} />
          <PurchaseButtons size="lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Trophies ───────────────────────

function LayoutTrophies({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  const [trophyText, setTrophyText] = useState("");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Grid */}
      <div className="flex-1 min-w-0 flex flex-col">
        {detail && <PageHeaderBanner detail={detail} />}
        <div className="flex-1 min-h-0 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-1.5">
            {items.map((item) => (
              <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
                onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
            ))}
          </div>
        </div>
      </div>
      {/* Gravur Panel */}
      {selectedItem && (
        <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5">
          <div className="relative h-[160px] shrink-0 overflow-hidden" style={{ backgroundImage: `url('${ROOM_BG_SVG}')`, backgroundColor: "hsl(var(--muted) / 0.3)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="flex items-center justify-center h-full p-4">
              <div className="w-24 h-24 drop-shadow-2xl"><ItemIcon classname={selectedItem.classname} /></div>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 flex-1">
            <h3 className="text-base font-bold">{selectedItem.public_name || selectedItem.classname}</h3>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold flex items-center gap-1.5"><Trophy className="w-3 h-3 text-amber-500/60" />Gravur</span>
                <span className="text-[10px] text-muted-foreground/40 tabular-nums">{trophyText.length}/100</span>
              </div>
              <Textarea placeholder="Text für die Trophäe eingeben..." value={trophyText} onChange={(e) => setTrophyText(e.target.value.slice(0, 100))} className="h-20 text-xs resize-none" />
            </div>
            <Separator />
            <PriceDisplay credits={selectedItem.cost_credits} points={selectedItem.cost_points} isFree={selectedItem.cost_credits === 0 && selectedItem.cost_points === 0} />
            <PurchaseButtons size="lg" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout: Badge Display ──────────────────

function LayoutBadgeDisplay({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && <PageHeaderBanner detail={detail} />}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 mb-4">
          {items.map((item) => (
            <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
              onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
          ))}
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-primary/60" />
            <span className="text-xs font-semibold">Badge auswählen</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-muted-foreground/20" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">Badge-Auswahl im Spiel verfügbar</p>
        </div>
      </div>
    </div>
  );
}

// ─── HC Offer Name Mapping ──────────────────

const HC_OFFER_NAMES: Record<string, string> = {
  HABBO_CLUB_1_MONTH: "1 Monat HC",
  HABBO_CLUB_3_MONTHS: "3 Monate HC",
  HABBO_CLUB_6_MONTHS: "6 Monate HC",
  HABBO_CLUB_12_MONTHS: "12 Monate HC",
};

const HC_BENEFITS = [
  "Exklusive Kleidung & Frisuren",
  "Monatliche Credits-Auszahlung",
  "HC-Geschenke freischalten",
  "Doppelte Duckets-Einnahmen",
  "Garderobe zum Outfits speichern",
  "Exklusive Raumdesigns",
];

// ─── Layout: VIP Buy / Club ─────────────────

function LayoutVipBuy({ detail, stats }: { detail: PageDetail | null; stats: CatalogStats | null }) {
  const offers = stats?.clubOffers || [];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Hero Header */}
      <div className="shrink-0 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-b border-amber-400/20 p-6">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CurrencyIcon type="hc" className="w-10 h-10" />
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">Habbo Club</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Werde HC-Mitglied und schalte exklusive Vorteile frei</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {/* Benefits card */}
        <Card className="mb-6 border-amber-400/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />HC-Vorteile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {HC_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-amber-400/60 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offer cards */}
        {offers.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {offers.map((offer, i) => {
              const isActive = selected === i;
              const isBest = offers.length > 1 && i === offers.length - 1;
              const displayName = HC_OFFER_NAMES[offer.name] || offer.name || `${offer.days} Tage`;
              const figureUrl = `${HABBO_IMAGER}?figure=${HC_FIGURES[i % HC_FIGURES.length]}&direction=2&head_direction=2&size=l&gesture=sml`;

              return (
                <button key={i} onClick={() => setSelected(isActive ? null : i)}
                  className={`group relative flex flex-col items-center rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isActive
                    ? "border-amber-400 bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-[1.02]"
                    : isBest
                      ? "border-amber-400/40 bg-gradient-to-b from-amber-500/5 to-transparent hover:border-amber-400/70 hover:shadow-lg"
                      : "border-border/40 bg-card hover:border-amber-400/30 hover:shadow-md"}`}>
                  {isBest && <Badge variant="warning" size="xs" className="absolute top-2.5 right-2.5 z-10">Beliebt</Badge>}

                  {/* Avatar hero area */}
                  <div className="relative w-full h-[140px] bg-gradient-to-b from-amber-400/10 to-transparent flex items-end justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                    <img
                      src={figureUrl}
                      alt={displayName}
                      className="relative h-[120px] object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                      style={{ imageRendering: "pixelated" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col items-center gap-2 p-4 w-full">
                    <span className="text-base font-black tracking-tight">{displayName}</span>
                    <span className="text-[11px] text-muted-foreground">{offer.days} Tage Mitgliedschaft</span>
                    <Separator className="w-full" />
                    <PriceDisplay credits={Number(offer.credits)} points={Number(offer.points)} isFree={Number(offer.credits) === 0 && Number(offer.points) === 0} size="sm" />
                    {isActive && (
                      <div className="w-full mt-2 animate-in slide-in-from-top-2 duration-200">
                        <PurchaseButtons size="sm" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Crown className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Club-Angebote verfügbar</p>
          </div>
        )}

        {/* Page content below */}
        {detail?.page_text1 && (
          <Card className="mt-6">
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground leading-relaxed [&_b]:font-semibold [&_b]:text-foreground [&_br]:mb-1" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Layout: Guilds / Group Frontpage ───────

function LayoutGuildFrontpage({ detail }: { detail: PageDetail | null }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={{ scrollbarWidth: "thin" }}>
      {detail?.page_teaser && (
        <div className="flex justify-center p-4 rounded-xl bg-muted/20 border border-border/40">
          <img src={`${IMAGE_LIB_URL}/${detail.page_teaser}`} alt="" className="max-h-20 object-contain rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary/60" />
        <span className="text-sm font-bold">{detail?.caption || "Gruppen"}</span>
      </div>
      {detail?.page_text1 && (
        <div className="rounded-lg bg-muted/10 border border-border/30 p-4 text-xs text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />
      )}
      <Button className="w-full h-10 gap-2 rounded-xl text-sm font-bold" disabled>
        <Users className="w-4 h-4" /> Gruppe erstellen
      </Button>
      <p className="text-[10px] text-muted-foreground/50 text-center">Gruppenerstellung im Spiel verfügbar</p>
    </div>
  );
}

// ─── Layout: Guild Forum ────────────────────

function LayoutGuildForum({ detail }: { detail: PageDetail | null }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={{ scrollbarWidth: "thin" }}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary/60" />
        <span className="text-sm font-bold">{detail?.caption || "Gruppen-Forum"}</span>
      </div>
      {detail?.page_text1 && (
        <div className="rounded-lg bg-muted/10 border border-border/30 p-4 text-xs text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />
      )}
      <div className="rounded-lg border border-border/40 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-xs font-semibold">Gruppe auswählen</span>
        </div>
        <div className="h-8 rounded-md border border-border/40 bg-muted/20 flex items-center px-3">
          <span className="text-xs text-muted-foreground/50">Wähle eine Gruppe...</span>
        </div>
        <Button className="w-full h-9 mt-3 gap-2 rounded-lg text-xs font-bold" disabled>
          <MessageSquare className="w-3.5 h-3.5" /> Forum aktivieren
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">Forum-Verwaltung im Spiel verfügbar</p>
    </div>
  );
}

// ─── Layout: Guild Furni ────────────────────

function LayoutGuildFurni({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && <PageHeaderBanner detail={detail} />}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/20">
        <div className="flex items-center gap-2 mb-2">
          <Paintbrush className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-semibold">Gruppe auswählen</span>
        </div>
        <div className="h-8 rounded-md border border-border/40 bg-muted/20 flex items-center px-3">
          <span className="text-xs text-muted-foreground/50">Wähle eine Gruppe für die Möbelfarben...</span>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {items.map((item) => (
            <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
              onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Functional Placeholder ─────────

function LayoutFunctionalPlaceholder({ detail, icon: Icon, title, desc }: { detail: PageDetail | null; icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-muted-foreground/20" />
      </div>
      <h3 className="text-lg font-bold mb-2">{detail?.caption || title}</h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-4">{desc}</p>
      <Badge variant="outline" size="xs">Nur im Spiel verfügbar</Badge>
    </div>
  );
}

// ─── Layout: Marketplace ────────────────────

function LayoutMarketplace({ detail }: { detail: PageDetail | null }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={{ scrollbarWidth: "thin" }}>
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-primary/60" />
        <span className="text-sm font-bold">{detail?.caption || "Marktplatz"}</span>
      </div>
      <div className="rounded-lg border border-border/40 bg-card p-4">
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <Input placeholder="Möbel suchen..." className="h-8 text-xs" disabled />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Suchen</Button>
        </div>
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1" disabled>Nach Wert</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1" disabled>Nach Aktivität</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1" disabled>Erweitert</Button>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-muted/10">
              <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-muted-foreground/30" />
              </div>
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">Marktplatz-Funktionen im Spiel verfügbar</p>
    </div>
  );
}

// ─── Layout: Spaces (Räume) ─────────────────

function LayoutSpaces({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  const [tab, setTab] = useState<"floor" | "wall" | "landscape">("floor");
  const filtered = useMemo(() => {
    if (tab === "floor") return items.filter((i) => i.classname.startsWith("floor_") || i.interaction_type === "floor");
    if (tab === "wall") return items.filter((i) => i.classname.startsWith("wallpaper_") || i.interaction_type === "wallpaper");
    return items.filter((i) => i.classname.startsWith("landscape_") || i.interaction_type === "landscape");
  }, [items, tab]);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && <PageHeaderBanner detail={detail} />}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-border/20">
        {(["floor", "wall", "landscape"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50"}`}>
            {t === "floor" ? "Boden" : t === "wall" ? "Wand" : "Landschaft"}
          </button>
        ))}
        <Badge variant="outline" size="xs" className="ml-auto opacity-50">{filtered.length} / {items.length}</Badge>
      </div>
      <div className="flex-1 p-4">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
            {filtered.map((item) => (
              <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
                onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
            {items.map((item) => (
              <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
                onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Layout: Soundmachine ───────────────────

function LayoutSoundmachine({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && <PageHeaderBanner detail={detail} />}
      {selectedItem && (
        <div className="shrink-0 px-4 py-2 border-b border-border/20 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" disabled>
            <Play className="w-3 h-3" /> Vorschau
          </Button>
          <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[11px] text-muted-foreground/50">Song-Vorschau im Spiel verfügbar</span>
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {items.map((item) => (
            <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
              onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Room Ads ───────────────────────

function LayoutRoomAds({ detail }: { detail: PageDetail | null }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={{ scrollbarWidth: "thin" }}>
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary/60" />
        <span className="text-sm font-bold">{detail?.caption || "Raum-Events"}</span>
      </div>
      <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
        <div>
          <span className="text-xs font-semibold mb-1 block">Kategorie</span>
          <div className="h-8 rounded-md border border-border/40 bg-muted/20 flex items-center px-3">
            <span className="text-xs text-muted-foreground/50">Kategorie wählen...</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold mb-1 block">Event-Name</span>
          <Input placeholder="Mein Event..." className="h-8 text-xs" disabled />
        </div>
        <div>
          <span className="text-xs font-semibold mb-1 block">Beschreibung</span>
          <Textarea placeholder="Event-Beschreibung..." className="h-16 text-xs resize-none" disabled />
        </div>
        <div>
          <span className="text-xs font-semibold mb-1 block">Raum</span>
          <div className="h-8 rounded-md border border-border/40 bg-muted/20 flex items-center px-3">
            <span className="text-xs text-muted-foreground/50">Raum auswählen...</span>
          </div>
        </div>
        <Button className="w-full h-9 gap-2 rounded-lg text-xs font-bold" disabled>
          <Megaphone className="w-3.5 h-3.5" /> Event erstellen
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">Raum-Events im Spiel verfügbar</p>
    </div>
  );
}

// ─── Layout: Bots ───────────────────────────

function LayoutBots({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && (
        <div className="shrink-0 px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-bold">{detail.caption}</span>
          </div>
          {detail.page_text1 && <p className="text-xs text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />}
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {items.map((item) => {
            const isActive = selectedItem?.catalog_item_id === item.catalog_item_id;
            return (
              <button key={item.catalog_item_id} onClick={() => onSelect(isActive ? null : item)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-left ${isActive
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-lg" : "border-border/50 bg-card hover:border-primary/30 hover:shadow-md"}`}>
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <span className="text-sm font-bold text-center">{item.public_name || item.classname}</span>
                <PriceDisplay credits={item.cost_credits} points={item.cost_points} isFree={item.cost_credits === 0 && item.cost_points === 0} size="sm" />
                {isActive && <div className="w-full mt-1"><PurchaseButtons size="sm" /></div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Color Grouping ─────────────────

function LayoutColorGrouping({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && <PageHeaderBanner detail={detail} />}
      {selectedItem && (
        <div className="shrink-0 px-4 py-2 border-b border-border/20 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[11px] text-muted-foreground/50">Farbauswahl im Spiel verfügbar</span>
          <div className="flex gap-1 ml-auto">
            {["#E57373", "#64B5F6", "#81C784", "#FFD54F", "#BA68C8", "#4DD0E1"].map((c) => (
              <div key={c} className="w-4 h-4 rounded-full border border-border/40" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {items.map((item) => (
            <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
              onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Pet Customization ──────────────

function LayoutPetCustomization({ detail, items, selectedItem, onSelect }: {
  detail: PageDetail | null; items: CatalogItem[]; selectedItem: CatalogItem | null; onSelect: (item: CatalogItem | null) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {detail && (
        <div className="shrink-0 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4 px-4 py-3">
            {detail.page_headline && (
              <img src={`${IMAGE_LIB_URL}/${detail.page_headline}`} alt="" className="h-12 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Paintbrush className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-bold">{detail.caption}</span>
                <Badge variant="outline" size="xs">Anpassung</Badge>
              </div>
              {detail.page_text1 && <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: detail.page_text1 }} />}
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {items.map((item) => (
            <ItemTile key={item.catalog_item_id} item={item} isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
              onSelect={() => onSelect(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layout Router ──────────────────────────

const SELF_CONTAINED_LAYOUTS = new Set([
  "pets2", "pets3", "info_loyalty", "info_duckets", "info_rentables",
  "guilds", "guild_frontpage", "guild_forum",
  "vip_buy", "club_buy", "club_gift",
  "marketplace", "marketplace_own_items",
  "roomads", "frontpage", "frontpage_featured", "frontpage4",
  "recycler", "recycler_prizes",
  "builders_club_frontpage", "builders_club_loyalty", "builders_club_addons",
  "recent_purchases", "sold_ltd_items", "mad_money", "monkey", "niko", "collectibles",
]);

function renderLayoutContent(
  layout: string,
  detail: PageDetail | null,
  items: CatalogItem[],
  selectedItem: CatalogItem | null,
  onSelect: (item: CatalogItem | null) => void,
  stats: CatalogStats | null,
) {
  switch (layout) {
    case "pets":
      return <LayoutPets detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "pets2":
    case "pets3":
    case "info_loyalty":
    case "info_duckets":
    case "info_rentables":
      return <LayoutInfoPage detail={detail} />;
    case "single_bundle":
      return <LayoutSingleBundle detail={detail} items={items} />;
    case "room_bundle":
      return <LayoutRoomBundle detail={detail} items={items} />;
    case "trophies":
      return <LayoutTrophies detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "badge_display":
      return <LayoutBadgeDisplay detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "vip_buy":
    case "club_buy":
    case "club_gift":
      return <LayoutVipBuy detail={detail} stats={stats} />;
    case "guilds":
    case "guild_frontpage":
      return <LayoutGuildFrontpage detail={detail} />;
    case "guild_forum":
      return <LayoutGuildForum detail={detail} />;
    case "guild_furni":
    case "guild_custom_furni":
      return <LayoutGuildFurni detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "marketplace":
    case "marketplace_own_items":
      return <LayoutMarketplace detail={detail} />;
    case "recent_purchases":
      return <LayoutFunctionalPlaceholder detail={detail} icon={Clock} title="Letzte Käufe" desc="Zeigt die zuletzt gekauften Möbel des Spielers. Im Spiel können Items hier erneut gekauft werden." />;
    case "collectibles":
    case "sold_ltd_items":
      return <LayoutFunctionalPlaceholder detail={detail} icon={Sparkles} title="Sammelstücke" desc="Zeigt limitierte und sammelbare Items. Im Spiel werden hier LTD-Möbel mit Seriennummer angeboten." />;
    case "spaces_new":
      return <LayoutSpaces detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "soundmachine":
      return <LayoutSoundmachine detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "roomads":
      return <LayoutRoomAds detail={detail} />;
    case "bots":
      return <LayoutBots detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "default_3x3_color_grouping":
      return <LayoutColorGrouping detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    case "petcustomization":
      return <LayoutPetCustomization detail={detail} items={items} selectedItem={selectedItem} onSelect={onSelect} />;
    default:
      return null; // fall through to default grid
  }
}

// ─── Isometric Room Background SVG ──────────

const ROOM_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="220" viewBox="0 0 280 220"><rect fill="#111114" width="280" height="220"/><polygon points="140,60 280,130 140,200 0,130" fill="#1a1a2e"/><polygon points="0,130 0,60 140,60 140,130" fill="#15152a" opacity="0.6"/><polygon points="280,130 280,60 140,60 140,130" fill="#0e0e20" opacity="0.6"/><line x1="0" y1="60" x2="140" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><line x1="280" y1="60" x2="140" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><line x1="0" y1="130" x2="140" y2="200" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/><line x1="280" y1="130" x2="140" y2="200" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/><line x1="70" y1="95" x2="210" y2="165" stroke="rgba(255,255,255,0.02)" stroke-width="0.5"/><line x1="210" y1="95" x2="70" y2="165" stroke="rgba(255,255,255,0.02)" stroke-width="0.5"/></svg>`)}`;

// ─── Currency Icon Component ────────────────

function CurrencyIcon({ type, className }: { type: "credits" | "diamonds" | "duckets" | "hc"; className?: string }) {
  return <img src={CURRENCY_ICONS[type]} alt={type} className={className || "w-4 h-4"} style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

// ─── Price Display Component ────────────────

function PriceDisplay({ credits, points, isFree, size = "lg" }: { credits: number; points: number; isFree?: boolean; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-lg font-black" : "text-sm font-bold";
  const iconCls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  if (isFree) return <div className="flex items-center gap-1.5 text-emerald-500"><Gift className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} /><span className={cls}>Gratis</span></div>;
  return (
    <div className="flex items-center gap-2.5">
      {credits > 0 && (
        <div className="flex items-center gap-1.5">
          <CurrencyIcon type="credits" className={iconCls} />
          <span className={`${cls} tabular-nums text-amber-500`}>{credits.toLocaleString("de-DE")}</span>
          {size === "lg" && <span className="text-xs font-medium opacity-70">Credits</span>}
        </div>
      )}
      {credits > 0 && points > 0 && <span className="text-muted-foreground text-xs">+</span>}
      {points > 0 && (
        <div className="flex items-center gap-1.5">
          <CurrencyIcon type="diamonds" className={iconCls} />
          <span className={`${cls} tabular-nums text-teal-400`}>{points.toLocaleString("de-DE")}</span>
          {size === "lg" && <span className="text-xs font-medium opacity-70">Diamanten</span>}
        </div>
      )}
    </div>
  );
}

// ─── Purchase Buttons Component ─────────────

function PurchaseButtons({ size = "lg", className }: { size?: "sm" | "lg"; className?: string }) {
  const h = size === "lg" ? "h-11" : "h-9";
  const text = size === "lg" ? "text-sm" : "text-xs";
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <Button className={`w-full ${h} gap-2 rounded-xl ${text} font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200`} size="sm">
        <ShoppingCart className="w-4 h-4" /> Kaufen
      </Button>
      <Button variant="outline" className={`w-full ${size === "lg" ? "h-9" : "h-8"} gap-2 rounded-xl ${text} font-medium hover:bg-accent/50 transition-all`} size="sm">
        <Gift className="w-4 h-4" /> Schenken
      </Button>
    </div>
  );
}

// ─── Preview Panel (replaces Inspector) ─────

function PreviewPanel({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [variantIdx, setVariantIdx] = useState(0);
  const [loadedVariants, setLoadedVariants] = useState<string[]>([]);
  const interactionInfo = INTERACTION_LABELS[item.interaction_type];
  const isDefaultPrice = item.cost_credits === DEFAULT_PRICE && item.cost_points === 0;
  const isFree = item.cost_credits === 0 && item.cost_points === 0;
  const totalCredits = item.cost_credits * quantity;
  const totalPoints = item.cost_points * quantity;
  const hasVariants = item.classname.includes("*");
  const baseName = item.classname.split("*")[0];

  // Probe for color variants on mount
  useEffect(() => {
    if (!hasVariants) { setLoadedVariants([]); return; }
    const urls: string[] = [];
    let loaded = 0;
    const total = 10;
    const results: string[] = [];
    for (let i = 1; i <= total; i++) {
      const url = `${ASSETS_URL()}/c_images/${baseName}*${i}_icon.png`;
      urls.push(url);
      const img = new Image();
      img.onload = () => { results.push(url); loaded++; if (loaded === total) setLoadedVariants([...results]); };
      img.onerror = () => { loaded++; if (loaded === total) setLoadedVariants([...results]); };
      img.src = url;
    }
  }, [hasVariants, baseName]);

  // Auto-cycle through variants
  useEffect(() => {
    if (loadedVariants.length <= 1) return;
    const timer = setInterval(() => setVariantIdx((v) => (v + 1) % loadedVariants.length), 2000);
    return () => clearInterval(timer);
  }, [loadedVariants.length]);

  const currentIcon = loadedVariants.length > 0 ? loadedVariants[variantIdx % loadedVariants.length] : getFurniIcon(item.classname);
  const stateCount = item.interaction_modes_count ?? 0;

  return (
    <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Room Preview Area */}
      <div className="relative h-[220px] shrink-0 overflow-hidden rounded-b-xl border-b border-white/[0.06]" style={{ backgroundColor: "#111114" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${ROOM_BG_SVG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114]/60 via-transparent to-[#111114]/30" />
        {/* Furniture icon */}
        <div className="relative flex items-center justify-center h-full">
          <img
            key={currentIcon}
            src={currentIcon}
            alt={item.public_name || item.classname}
            className={`max-w-[160px] max-h-[140px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${loadedVariants.length <= 1 ? "animate-[float_3s_ease-in-out_infinite]" : ""}`}
            style={{ imageRendering: "pixelated" }}
            onError={(e) => { (e.target as HTMLImageElement).src = getFurniIcon(item.classname); }}
          />
        </div>
        {/* Controls */}
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          {loadedVariants.length > 1 && (
            <button onClick={() => setVariantIdx((v) => (v + 1) % loadedVariants.length)}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-white/90 hover:bg-black/60 transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button onClick={onClose} className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-white/90 hover:bg-black/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Variant indicator */}
        {loadedVariants.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {loadedVariants.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === variantIdx % loadedVariants.length ? "bg-white/80 w-3" : "bg-white/20"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-bold tracking-tight leading-tight">{item.public_name || item.classname}</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.classname}</p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" size="xs">{item.item_type === "s" ? "Boden" : "Wand"}</Badge>
          <Badge variant="outline" size="xs">{item.width}×{item.length}</Badge>
          {interactionInfo && (
            <Badge variant="outline" size="xs" className="gap-0.5">
              <span className={`text-[6px] ${interactionInfo.color}`}>●</span>{interactionInfo.label}
            </Badge>
          )}
          {stateCount > 1 && (
            <Badge variant="outline" size="xs" className="gap-0.5"><Eye className="w-2.5 h-2.5" />{stateCount} Zustände</Badge>
          )}
          {item.limited_stack > 0 && (
            <Badge variant="warning" size="xs" className="gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />{item.limited_sells}/{item.limited_stack}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Price */}
        <div>
          <PriceDisplay credits={quantity > 1 ? totalCredits : item.cost_credits} points={quantity > 1 ? totalPoints : item.cost_points} isFree={isFree} />
          {isDefaultPrice && <span className="text-[10px] text-muted-foreground/50">(Standard-Preis)</span>}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Menge</span>
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus className="w-3 h-3" /></Button>
            <span className="text-sm font-bold w-8 text-center tabular-nums">{quantity}</span>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setQuantity((q) => Math.min(100, q + 1))}><Plus className="w-3 h-3" /></Button>
          </div>
        </div>
        <div className="flex gap-1">
          {[5, 10, 25, 50].map((n) => (
            <Button key={n} variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-lg font-semibold" onClick={() => setQuantity(n)}>×{n}</Button>
          ))}
        </div>

        <Separator />
        <PurchaseButtons size="lg" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Recent Purchases View ──────────────────

function RecentPurchasesView({ purchases, onLoad }: { purchases: RecentPurchase[]; onLoad: () => void }) {
  useEffect(() => { if (purchases.length === 0) onLoad(); }, [purchases.length, onLoad]);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-base font-bold">Letzte Käufe</h2>
        <Badge variant="secondary" size="sm">{purchases.length} Einträge</Badge>
      </div>
      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Käufe vorhanden</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-accent/30 transition-colors border border-transparent hover:border-border/30">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-muted/20 flex items-center justify-center overflow-hidden border border-border/30">
                {p.classname && <ItemIcon classname={p.classname} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">{p.public_name || p.classname || p.catalog_name}</span>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-medium">{p.username || "Unbekannt"}</span>
                  <span className="opacity-40">·</span>
                  <span>{formatTime(p.timestamp)}</span>
                  {p.amount > 1 && <><span className="opacity-40">·</span><Badge variant="secondary" size="xs">×{p.amount}</Badge></>}
                </div>
              </div>
              <PriceDisplay credits={p.cost_credits} points={p.cost_points} isFree={p.cost_credits === 0 && p.cost_points === 0} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Popular Items View ─────────────────────

function PopularItemsView({ items, onLoad }: { items: PopularItem[]; onLoad: () => void }) {
  useEffect(() => { if (items.length === 0) onLoad(); }, [items.length, onLoad]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-400" />
        <h2 className="text-base font-bold">Meist gekauft</h2>
        <Badge variant="secondary" size="sm">{items.length} Items</Badge>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Flame className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Kaufdaten vorhanden</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {items.map((item, i) => (
            <div key={item.catalog_item_id} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer relative">
              {i < 3 && (
                <Badge variant={i === 0 ? "warning" : "secondary"} size="xs" className="absolute top-2 left-2">
                  #{i + 1}
                </Badge>
              )}
              <div className="w-14 h-14 rounded-xl bg-muted/20 flex items-center justify-center overflow-hidden">
                {item.classname && <ItemIcon classname={item.classname} />}
              </div>
              <span className="text-xs font-semibold text-center leading-tight line-clamp-2">{item.public_name || item.classname || item.catalog_name}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" size="xs" className="gap-0.5"><Flame className="w-2.5 h-2.5 text-orange-400" />{item.purchase_count}× gekauft</Badge>
              </div>
              <PriceDisplay credits={item.cost_credits} points={item.cost_points} isFree={item.cost_credits === 0 && item.cost_points === 0} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const CatalogV2View: FC<{}> = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [allPages, setAllPages] = useState<CatalogPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<TreeNode | null>(null);
  const [pageDetail, setPageDetail] = useState<PageDetail | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [interactionFilter, setInteractionFilter] = useState<string | null>(null);
  const [staffMode, setStaffMode] = useState(false);
  const [contentView, setContentView] = useState<"catalog" | "recent" | "popular">("catalog");
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      const [treeRes, statsRes] = await Promise.all([
        fetch("/api/admin/catalog?mode=tree"),
        fetch("/api/admin/catalog?mode=stats"),
      ]);
      if (treeRes.status === 403) throw new Error("Zugriff verweigert");
      const treeData = await treeRes.json();
      const statsData = await statsRes.json();
      setAllPages(treeData.pages);
      setTree(buildTree(treeData.pages));
      setStats(statsData);
    } catch {
      toast.error("Katalog konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const loadItems = useCallback(async (pageId: number, newOffset: number) => {
    setItemsLoading(true); setSearchActive(false); setInteractionFilter(null);
    try {
      const [itemsRes, detailRes] = await Promise.all([
        fetch(`/api/admin/catalog?page_id=${pageId}&offset=${newOffset}&limit=${PAGE_SIZE}`),
        fetch(`/api/admin/catalog?page_detail=${pageId}`),
      ]);
      const d = await itemsRes.json();
      const detail = await detailRes.json();
      setItems(d.items || []); setTotalItems(d.total || 0); setOffset(newOffset);
      setPageDetail(detail.page || null);
    } catch { setItems([]); setPageDetail(null); }
    setItemsLoading(false);
  }, []);

  const doSearch = useCallback(async (term: string, newOffset: number) => {
    if (!term.trim()) { setSearchActive(false); setItems([]); setTotalItems(0); return; }
    setItemsLoading(true); setSearchActive(true); setInteractionFilter(null); setPageDetail(null);
    try {
      const r = await fetch(`/api/admin/catalog?search=${encodeURIComponent(term)}&offset=${newOffset}&limit=${PAGE_SIZE}`);
      const d = await r.json();
      setItems(d.items || []); setTotalItems(d.total || 0); setOffset(newOffset);
    } catch { setItems([]); }
    setItemsLoading(false);
  }, []);

  const loadRecentPurchases = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/catalog?mode=recent_purchases");
      const d = await r.json();
      setRecentPurchases(d.purchases || []);
    } catch { setRecentPurchases([]); }
  }, []);

  const loadPopularItems = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/catalog?mode=popular_items");
      const d = await r.json();
      setPopularItems(d.items || []);
    } catch { setPopularItems([]); }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (val.trim().length >= 2) { setSelectedPage(null); setSelectedItem(null); doSearch(val, 0); }
      else if (!val.trim()) { setSearchActive(false); setItems([]); setTotalItems(0); }
    }, 350);
  };

  const handleSelect = (node: TreeNode) => {
    setSelectedPage(node); setSelectedItem(null); setSearch(""); setSearchActive(false);
    loadItems(node.id, 0);
  };

  const handleToggle = (id: number) => {
    setTree((prev) => {
      const toggle = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((n) => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: toggle(n.children) });
      return toggle(prev);
    });
  };

  const toggleFavorite = useCallback((pageId: number) => {
    setFavorites((prev) => { const next = new Set(prev); if (next.has(pageId)) next.delete(pageId); else next.add(pageId); return next; });
  }, []);

  const toggleSection = useCallback((id: number) => {
    setOpenSections((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const breadcrumbs = selectedPage ? getBreadcrumbs(allPages, selectedPage.id) : [];
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPageNum = Math.floor(offset / PAGE_SIZE) + 1;

  const favoriteNodes = useMemo(() => {
    if (favorites.size === 0) return [];
    const pageMap = new Map<number, CatalogPage>();
    for (const p of allPages) pageMap.set(p.id, p);
    return Array.from(favorites).map((id) => pageMap.get(id)).filter(Boolean) as CatalogPage[];
  }, [favorites, allPages]);

  const catalogStats = useMemo(() => ({
    pages: allPages.length,
    items: allPages.reduce((s, p) => s + Number(p.item_count), 0),
  }), [allPages]);

  const visibleRoots = useMemo(() => {
    const visible = tree.filter((n) => n.visible === "1");
    if (staffMode) return visible.filter((n) => n.min_rank >= 4);
    return visible.filter((n) => n.min_rank < 4);
  }, [tree, staffMode]);

  const filteredItems = useMemo(() => {
    if (!interactionFilter) return items;
    return items.filter((i) => i.interaction_type === interactionFilter);
  }, [items, interactionFilter]);

  const showFrontpage = !selectedPage && !searchActive && !itemsLoading;

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div><h1 className="text-2xl font-bold">Katalog Prototyp</h1><p className="text-muted-foreground">Wird geladen...</p></div>
        <div className="flex gap-3 h-[calc(100vh-200px)]">
          <div className="w-[260px] shrink-0 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
              {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes rainbow-border { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
      <div className="w-full space-y-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Katalog Prototyp</h1>
            <p className="text-sm text-muted-foreground">
              {catalogStats.pages.toLocaleString("de-DE")} Seiten &middot; {catalogStats.items.toLocaleString("de-DE")} Items
              {stats && <> &middot; {stats.limitedCount.toLocaleString("de-DE")} Limited vergeben</>}
            </p>
          </div>
          <Badge variant="info-light" size="lg"><Eye className="w-3.5 h-3.5" /> Vorschau</Badge>
        </div>

        {/* Catalog Window */}
        <div className="rounded-2xl border border-border shadow-lg overflow-hidden transition-colors duration-300 bg-card text-card-foreground">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 h-12 border-b border-border bg-muted/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen((v) => !v)}>
                  {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{sidebarOpen ? "Sidebar ausblenden" : "Sidebar einblenden"}</TooltipContent>
            </Tooltip>

            <div className="flex-1 min-w-0">
              {searchActive ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Search className="w-3.5 h-3.5" />
                  <span>Suche: &ldquo;<span className="text-foreground font-medium">{search}</span>&rdquo; &mdash; {totalItems.toLocaleString("de-DE")} Ergebnisse</span>
                </div>
              ) : breadcrumbs.length > 0 ? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink className="cursor-pointer text-xs" onClick={() => { setSelectedPage(null); setItems([]); setSelectedItem(null); setPageDetail(null); }}>
                        Katalog
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((c, i) => (
                      <BreadcrumbItem key={c.id}>
                        <BreadcrumbSeparator />
                        {i === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-xs">{c.caption}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink className="cursor-pointer text-xs">{c.caption}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : (
                <span className="text-sm text-muted-foreground">Wähle eine Kategorie</span>
              )}
            </div>

            <div className="relative w-[240px] shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Möbel suchen..." value={search}
                onChange={(e) => handleSearchChange(e.target.value)} className="pl-8 pr-16 h-8 text-sm" />
              {search ? (
                <button onClick={() => { setSearch(""); setSearchActive(false); setItems([]); setTotalItems(0); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              ) : (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="text-[9px] font-mono text-muted-foreground/60 bg-muted rounded px-1 py-0.5 border border-border/50">⌘K</kbd>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-5" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-7 w-7 ${contentView === "recent" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => { setContentView(contentView === "recent" ? "catalog" : "recent"); if (contentView !== "recent") loadRecentPurchases(); }}>
                <Clock className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Zuletzt gekauft</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-7 w-7 ${contentView === "popular" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => { setContentView(contentView === "popular" ? "catalog" : "popular"); if (contentView !== "popular") loadPopularItems(); }}>
                <Flame className={`w-3.5 h-3.5 ${contentView === "popular" ? "" : "text-orange-400"}`} />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Meist gekauft</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-7 w-7 ${staffMode ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => { setStaffMode(!staffMode); setSelectedPage(null); setItems([]); setSelectedItem(null); setPageDetail(null); setContentView("catalog"); }}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">{staffMode ? "Normal-Katalog" : "Staff-Katalog"}</TooltipContent></Tooltip>

          </div>

          {/* Body */}
          <div className="flex overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: "400px" }}>
            {/* Sidebar */}
            {sidebarOpen && (
              <div className="w-[260px] min-w-[260px] border-r border-border bg-muted/5 flex flex-col min-h-0">
                {/* Staff mode indicator */}
                {staffMode && (
                  <div className="shrink-0 px-3 py-2 border-b border-amber-400/20 bg-amber-500/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Staff-Katalog aktiv
                    </div>
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  <div className="py-1.5">
                    {/* Favorites */}
                    {favoriteNodes.length > 0 && (
                      <>
                        <div className="px-3 pt-2 pb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60 flex items-center gap-1.5">
                            <Star className="w-3 h-3 fill-current" />Favoriten
                          </span>
                        </div>
                        <div className="px-1.5 pb-1">
                          {favoriteNodes.map((p) => (
                            <button key={p.id}
                              onClick={() => {
                                const node = tree.flatMap(function flat(n: TreeNode): TreeNode[] { return [n, ...n.children.flatMap(flat)]; }).find((n) => n.id === p.id);
                                if (node) { handleSelect(node); setContentView("catalog"); }
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-[6px] text-sm rounded-lg transition-all
                                ${selectedPage?.id === p.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              <span className="truncate">{p.caption}</span>
                            </button>
                          ))}
                        </div>
                        <Separator className="mx-3 my-1.5" />
                      </>
                    )}

                    {/* Category tree */}
                    {visibleRoots.map((topNode, index) => {
                      const hasChildren = topNode.children.filter((c) => c.visible === "1").length > 0;
                      if (hasChildren) {
                        const isOpen = openSections.has(topNode.id) || topNode.expanded;
                        return (
                          <div key={topNode.id} className={index > 0 ? "mt-0.5" : ""}>
                            <button
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-accent/30"
                              onClick={() => { toggleSection(topNode.id); handleToggle(topNode.id); }}>
                              <CatalogIconImg iconId={topNode.icon_image} size={20} />
                              <span className="flex-1 text-left truncate text-xs font-bold uppercase tracking-wide text-muted-foreground/70">{topNode.caption}</span>
                              <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">{getTotalItems(topNode).toLocaleString("de-DE")}</span>
                              <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                            <div className="grid transition-[grid-template-rows,opacity] duration-200 ease-in-out"
                              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}>
                              <div className="overflow-hidden min-h-0">
                                <div className="px-1.5 pb-1">
                                  {topNode.children.filter((c) => c.visible === "1").map((child) => (
                                    <SidebarNavItem key={child.id} node={child} depth={1} selectedId={selectedPage?.id ?? null}
                                      onSelect={(n) => { handleSelect(n); setContentView("catalog"); }} onToggle={handleToggle} favorites={favorites} onToggleFavorite={toggleFavorite} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={topNode.id} className={`px-1.5 ${index > 0 ? "mt-0.5" : ""}`}>
                          <SidebarNavItem node={topNode} depth={0} selectedId={selectedPage?.id ?? null}
                            onSelect={(n) => { handleSelect(n); setContentView("catalog"); }} onToggle={handleToggle} favorites={favorites} onToggleFavorite={toggleFavorite} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {contentView === "recent" ? (
                <RecentPurchasesView purchases={recentPurchases} onLoad={loadRecentPurchases} />
              ) : contentView === "popular" ? (
                <PopularItemsView items={popularItems} onLoad={loadPopularItems} />
              ) : showFrontpage && stats ? (
                <CatalogFrontpage features={stats.featuredPages} recentPurchases={recentPurchases} popularItems={popularItems} onLoadRecent={loadRecentPurchases} onLoadPopular={loadPopularItems} bannerDismissed={bannerDismissed} onDismissBanner={() => setBannerDismissed(true)} onNavigateToPage={(pid) => { const node = findNodeById(tree, pid); if (node) { setSelectedPage(node); loadItems(pid, 0); } }} />
              ) : itemsLoading ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
                    {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                  </div>
                </div>
              ) : pageDetail && renderLayoutContent(
                pageDetail.page_layout,
                pageDetail,
                filteredItems,
                selectedItem,
                (item) => setSelectedItem(item),
                stats,
              ) ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  {renderLayoutContent(pageDetail.page_layout, pageDetail, filteredItems, selectedItem, (item) => setSelectedItem(item), stats)}
                </div>
              ) : (
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  {/* Grid Area */}
                  <div className="flex-1 min-w-0 flex flex-col min-h-0">
                    {pageDetail && <PageHeaderBanner detail={pageDetail} />}
                    <InteractionFilter items={items} activeFilter={interactionFilter} onFilter={setInteractionFilter} />

                    {totalItems > PAGE_SIZE && (
                      <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-border/30 bg-muted/20">
                        <span className="text-xs text-muted-foreground">{totalItems.toLocaleString("de-DE")} Items</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-6 w-6" disabled={offset === 0}
                            onClick={() => { const o = Math.max(0, offset - PAGE_SIZE); if (searchActive) doSearch(search, o); else if (selectedPage) loadItems(selectedPage.id, o); }}>
                            <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground tabular-nums">{currentPageNum} / {totalPages}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" disabled={offset + PAGE_SIZE >= totalItems}
                            onClick={() => { const o = offset + PAGE_SIZE; if (searchActive) doSearch(search, o); else if (selectedPage) loadItems(selectedPage.id, o); }}>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-h-0 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                      {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                          {searchActive ? (
                            <><Search className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine Items gefunden</p></>
                          ) : interactionFilter ? (
                            <><Filter className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Keine &ldquo;{INTERACTION_LABELS[interactionFilter]?.label || interactionFilter}&rdquo; Items</p></>
                          ) : selectedPage ? (
                            <div className="flex flex-col items-center text-center max-w-xs">
                              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-muted-foreground/20" />
                              </div>
                              <p className="font-semibold text-sm mb-1">Diese Seite hat noch keine Artikel</p>
                              <p className="text-xs text-muted-foreground/60 mb-4">Artikel werden im Admin-Panel hinzugefügt</p>
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                <Badge variant="outline" size="xs">{selectedPage.caption}</Badge>
                                <Badge variant="outline" size="xs">Layout: {selectedPage.page_layout}</Badge>
                                <Badge variant="outline" size="xs">ID: {selectedPage.id}</Badge>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-1.5">
                          {filteredItems.map((item) => (
                            <ItemTile key={item.catalog_item_id} item={item}
                              isSelected={selectedItem?.catalog_item_id === item.catalog_item_id}
                              onSelect={() => setSelectedItem(selectedItem?.catalog_item_id === item.catalog_item_id ? null : item)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Panel (right side) */}
                  {selectedItem && <PreviewPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
