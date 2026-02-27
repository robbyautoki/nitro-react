
import { useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Wrench,
  Move,
  RotateCw,
  PackageOpen,
  Hand,
  ShoppingCart,
  List,
  Shield,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Config ─────────────────────────────────────

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};

function getFurniIcon(cn: string) {
  return `${ASSETS_URL()}/c_images/${cn.split("*")[0]}_icon.png`;
}

function getAvatarHead(figure: string) {
  return `https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&headonly=1&size=s&direction=2`;
}

// ─── Types ──────────────────────────────────────

type RarityType = "og_rare" | "weekly_rare" | "monthly_rare" | "cashshop_rare" | "bonzen_rare" | "drachen_rare" | "ltd" | null;

interface DemoFurni {
  id: number;
  classname: string;
  name: string;
  description: string;
  owner: string;
  figure: string;
  posX: number;
  posY: number;
  posZ: number;
  rarityType: RarityType;
  rarityLabel?: string;
  circulation?: number;
  tradeValue?: number;
  setName?: string;
  isOg?: boolean;
  ltdNumber?: number;
  ltdSeries?: number;
  durability?: number;
  isBroken?: boolean;
  canBuy?: boolean;
}

// ─── Rarity Colors ──────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  og_rare: "#ff5078",
  weekly_rare: "#10b981",
  monthly_rare: "#8b5cf6",
  cashshop_rare: "#f97316",
  bonzen_rare: "#fbbf24",
  drachen_rare: "#6366f1",
  ltd: "#06b6d4",
};

const RARITY_LABELS: Record<string, string> = {
  og_rare: "OG Rare",
  weekly_rare: "Wochenrare",
  monthly_rare: "Monatsrare",
  cashshop_rare: "Cashshop Rare",
  bonzen_rare: "Bonzenrare",
  drachen_rare: "Drachenrare",
  ltd: "LTD",
};

// ─── Demo Data ──────────────────────────────────

const FIGURES = {
  bahhos: "hr-3090-45.hd-180-1.ch-3110-92.lg-3116-82.sh-3115-92",
  sykeez: "hr-893-45.hd-180-3.ch-3030-92.lg-285-82.sh-290-92",
  lucky: "hr-165-45.hd-190-10.ch-255-92.lg-275-82.sh-295-92",
  trader: "hr-100-45.hd-185-3.ch-210-92.lg-270-82.sh-300-92",
};

const DEMO_FURNI: DemoFurni[] = [
  {
    id: 877,
    classname: "throne",
    name: "Hollywood Spiegel 2",
    description: "Für den perfekten Look!",
    owner: "Sykeez",
    figure: FIGURES.sykeez,
    posX: 6, posY: 21, posZ: 14.0,
    rarityType: null,
    durability: 85,
  },
  {
    id: 1204,
    classname: "rare_dragonlamp",
    name: "Drachenlampe",
    description: "Eine mystische Lampe mit Drachenmotiv.",
    owner: "bahhos",
    figure: FIGURES.bahhos,
    posX: 12, posY: 8, posZ: 0.0,
    rarityType: "weekly_rare",
    rarityLabel: "Wochenrare",
    circulation: 1250,
    tradeValue: 450,
    durability: 72,
  },
  {
    id: 543,
    classname: "rare_moonrug",
    name: "Mondteppich",
    description: "Ein seltener Teppich aus der ersten Stunde.",
    owner: "LuckyDice",
    figure: FIGURES.lucky,
    posX: 3, posY: 5, posZ: 0.0,
    rarityType: "og_rare",
    rarityLabel: "OG Rare",
    circulation: 89,
    tradeValue: 12500,
    setName: "Valentins-Set",
    isOg: true,
    durability: 100,
  },
  {
    id: 2001,
    classname: "rare_fountain",
    name: "Kristallbrunnen",
    description: "Ein magischer Brunnen der Wünsche erfüllt.",
    owner: "bahhos",
    figure: FIGURES.bahhos,
    posX: 8, posY: 14, posZ: 2.5,
    rarityType: "monthly_rare",
    rarityLabel: "Monatsrare",
    circulation: 320,
    tradeValue: 2800,
    durability: 45,
  },
  {
    id: 3010,
    classname: "diamond_painting1",
    name: "Diamant-Gemälde",
    description: "Exklusiv im Cashshop erhältlich.",
    owner: "Sykeez",
    figure: FIGURES.sykeez,
    posX: 1, posY: 1, posZ: 0.0,
    rarityType: "cashshop_rare",
    rarityLabel: "Cashshop Rare",
    circulation: 500,
    tradeValue: 1500,
    canBuy: true,
    durability: 100,
  },
  {
    id: 4200,
    classname: "gold_bar",
    name: "Goldbarren",
    description: "999er Feingold. Ein Zeichen von Reichtum.",
    owner: "TradeKing",
    figure: FIGURES.trader,
    posX: 10, posY: 10, posZ: 1.0,
    rarityType: "bonzen_rare",
    rarityLabel: "Bonzenrare",
    circulation: 42,
    tradeValue: 35000,
    durability: 100,
  },
  {
    id: 5050,
    classname: "dragon_egg",
    name: "Drachenei",
    description: "Wer weiß was daraus schlüpft...",
    owner: "LuckyDice",
    figure: FIGURES.lucky,
    posX: 7, posY: 3, posZ: 0.5,
    rarityType: "drachen_rare",
    rarityLabel: "Drachenrare",
    circulation: 150,
    tradeValue: 5200,
    durability: 0,
    isBroken: true,
  },
  {
    id: 9999,
    classname: "exe_trax_bling",
    name: "Podium Gold",
    description: "Limitierte Auflage - nie wieder erhältlich.",
    owner: "bahhos",
    figure: FIGURES.bahhos,
    posX: 5, posY: 5, posZ: 3.0,
    rarityType: "ltd",
    rarityLabel: "LTD",
    ltdNumber: 42,
    ltdSeries: 500,
    circulation: 500,
    tradeValue: 8900,
    durability: 91,
  },
];

// ─── Durability Bar ─────────────────────────────

function DurabilityBar({ durability, isBroken }: { durability: number; isBroken?: boolean }) {
  const color = isBroken
    ? "bg-muted-foreground/30"
    : durability > 50
    ? "bg-emerald-500"
    : durability > 25
    ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <Wrench className="w-2.5 h-2.5 text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground">
          Haltbarkeit: {durability}%
        </span>
      </div>
      <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(durability, 2)}%` }}
        />
      </div>
      {isBroken && (
        <span className="text-[10px] text-destructive font-medium">
          ZERBROCHEN - Repariere in der Werkstatt!
        </span>
      )}
    </div>
  );
}

// ─── Position Editor ────────────────────────────

function PositionEditor({ posX, posY, posZ }: { posX: number; posY: number; posZ: number }) {
  const [x, setX] = useState(posX);
  const [y, setY] = useState(posY);
  const [z, setZ] = useState(posZ);

  const moveDir = (dx: number, dy: number) => {
    setX(prev => prev + dx);
    setY(prev => prev + dy);
    toast.success(`Position: ${x + dx}, ${y + dy}`);
  };

  const changeHeight = (delta: number) => {
    setZ(prev => {
      const next = Math.max(0, Math.round((prev + delta) * 100) / 100);
      toast.success(`Höhe: ${next.toFixed(2)}`);
      return next;
    });
  };

  return (
    <div className="flex gap-3 animate-in slide-in-from-top-2 duration-200">
      {/* Position Diamond */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40">Position</span>
        <div className="relative w-[68px] h-[68px]">
          {[
            { cls: "top-0 left-1/2 -translate-x-1/2", icon: ChevronUp, dx: 0, dy: -1 },
            { cls: "top-1/2 right-0 -translate-y-1/2", icon: ChevronRight, dx: 1, dy: 0 },
            { cls: "top-1/2 left-0 -translate-y-1/2", icon: ChevronLeft, dx: -1, dy: 0 },
            { cls: "bottom-0 left-1/2 -translate-x-1/2", icon: ChevronDown, dx: 0, dy: 1 },
          ].map(({ cls, icon: Icon, dx, dy }, i) => (
            <button
              key={i}
              className={`absolute ${cls} w-[26px] h-[26px] rounded flex items-center justify-center bg-muted/50 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-foreground active:scale-90 transition-all`}
              onClick={() => moveDir(dx, dy)}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 mt-1">Drehen</span>
        <div className="flex gap-1.5">
          <button
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center bg-muted/50 border border-border/50 text-muted-foreground hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-foreground active:scale-90 transition-all"
            onClick={() => toast.success("Links gedreht")}
          >
            <Undo2 className="w-3 h-3" />
          </button>
          <button
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center bg-muted/50 border border-border/50 text-muted-foreground hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-foreground active:scale-90 transition-all"
            onClick={() => toast.success("Rechts gedreht")}
          >
            <Redo2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Height */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40">Höhe</span>
        <div className="text-center font-mono text-sm font-bold px-3 py-1 rounded bg-muted/30 border border-border/50 w-full">
          {z.toFixed(2)}
        </div>
        <div className="grid grid-cols-3 gap-1 w-full">
          {[1, 0.1, 0.01].map(delta => (
            <button
              key={`+${delta}`}
              className="py-1 rounded text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/35 active:scale-90 transition-all"
              onClick={() => changeHeight(delta)}
            >
              +{delta}
            </button>
          ))}
          {[1, 0.1, 0.01].map(delta => (
            <button
              key={`-${delta}`}
              className="py-1 rounded text-[10px] font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/35 active:scale-90 transition-all"
              onClick={() => changeHeight(-delta)}
            >
              -{delta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Furni Info Card ────────────────────────────

function FurniInfoCard({ furni }: { furni: DemoFurni }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const isRare = furni.rarityType !== null;
  const rarityColor = furni.rarityType ? RARITY_COLORS[furni.rarityType] : undefined;
  const rarityLabel = furni.rarityType ? RARITY_LABELS[furni.rarityType] : undefined;

  return (
    <div
      className="rounded-xl"
      style={isRare ? { boxShadow: `0 0 40px ${rarityColor}15, 0 0 80px ${rarityColor}08` } : undefined}
    >
      <Frame
        stacked
        spacing="sm"
        className="w-[300px]"
        style={isRare ? { border: `1.5px solid ${rarityColor}40` } : undefined}
      >
        {/* Furni Preview */}
        <FramePanel>
          <div
            className="flex items-center justify-center h-[130px] rounded-md overflow-hidden relative"
            style={{
              backgroundColor: isRare ? `${rarityColor}06` : "hsl(var(--muted) / 0.3)",
            }}
          >
            {/* Rarity glow bg */}
            {isRare && (
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  background: `radial-gradient(ellipse at 50% 30%, ${rarityColor}, transparent 65%)`,
                }}
              />
            )}

            {/* Rarity badge top-left */}
            {isRare && rarityLabel && (
              <span
                className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: `${rarityColor}18`,
                  border: `1px solid ${rarityColor}40`,
                  color: rarityColor,
                }}
              >
                {rarityLabel}
              </span>
            )}

            {/* OG seal */}
            {furni.isOg && (
              <span
                className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                style={{
                  backgroundColor: `${rarityColor}25`,
                  border: `1px solid ${rarityColor}50`,
                  color: rarityColor,
                }}
              >
                OG
              </span>
            )}

            {/* LTD number overlay */}
            {furni.ltdNumber && furni.ltdSeries && (
              <span
                className="absolute bottom-2 right-2 z-20 font-mono text-[11px] font-bold"
                style={{ color: rarityColor }}
              >
                #{furni.ltdNumber} / {furni.ltdSeries}
              </span>
            )}

            <img
              src={getFurniIcon(furni.classname)}
              alt={furni.name}
              className="max-w-[90px] max-h-[90px] object-contain relative z-10"
              style={{
                imageRendering: "pixelated",
                filter: isRare ? `drop-shadow(0 4px 12px ${rarityColor}30)` : undefined,
              }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </FramePanel>

        {/* Name + Description */}
        <FramePanel>
          <div
            className="flex flex-col gap-1"
            style={isRare ? { borderLeft: `3px solid ${rarityColor}`, paddingLeft: "8px" } : undefined}
          >
            <span className="text-sm font-semibold">{furni.name}</span>
            {furni.description && (
              <span className="text-[11px] text-muted-foreground leading-relaxed">{furni.description}</span>
            )}
            {furni.setName && (
              <Badge
                variant="outline"
                size="xs"
                className="w-fit text-[9px]"
                style={{ borderColor: `${rarityColor}40`, color: rarityColor }}
              >
                {furni.setName}
              </Badge>
            )}
          </div>
        </FramePanel>

        {/* Details */}
        <FramePanel>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground/50" />
              <img src={getAvatarHead(furni.figure)} alt={furni.owner} className="w-[16px] h-[16px]" style={{ imageRendering: "pixelated" }} />
              <span className="text-xs">{furni.owner}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                X: {furni.posX}  Y: {furni.posY}  H: {furni.posZ.toFixed(2)}
              </span>
              <button
                className={`p-0.5 rounded transition-colors ${editorOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground/50"}`}
                onClick={() => setEditorOpen(prev => !prev)}
              >
                <Wrench className="w-3 h-3" />
              </button>
            </div>

            {furni.circulation !== undefined && furni.circulation > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Umlauf: {furni.circulation.toLocaleString("de-DE")} Stk.
              </span>
            )}
            {furni.tradeValue !== undefined && furni.tradeValue > 0 && (
              <span className="text-[10px] text-muted-foreground" style={isRare ? { color: rarityColor } : undefined}>
                Wert: {furni.tradeValue.toLocaleString("de-DE")} Credits
              </span>
            )}

            {furni.durability !== undefined && (
              <DurabilityBar durability={furni.durability} isBroken={furni.isBroken} />
            )}

            <span className="text-[10px] text-muted-foreground/50">ID: {furni.id}</span>
          </div>
        </FramePanel>

        {/* Position Editor (toggle) */}
        {editorOpen && (
          <FramePanel>
            <PositionEditor posX={furni.posX} posY={furni.posY} posZ={furni.posZ} />
          </FramePanel>
        )}

        {/* Actions */}
        <FramePanel>
          <div className="flex items-stretch divide-x divide-border">
            {[
              { icon: Move, label: "Bewegen" },
              { icon: RotateCw, label: "Drehen" },
              { icon: PackageOpen, label: "Aufnehmen" },
              { icon: Hand, label: "Benutzen" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                onClick={() => toast.info(`${label}...`)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </FramePanel>

        {/* Quick Links */}
        {(furni.canBuy || isRare) && (
          <FramePanel>
            <div className="flex items-center gap-2">
              {furni.canBuy && (
                <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => toast.info("Katalog öffnen...")}>
                  <ShoppingCart className="w-3 h-3 mr-1" />Kaufen
                </Button>
              )}
              {isRare && (
                <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => toast.info("Preisliste öffnen...")}>
                  <List className="w-3 h-3 mr-1" />Preisliste
                </Button>
              )}
            </div>
          </FramePanel>
        )}
      </Frame>
    </div>
  );
}

// ─── Section Header ─────────────────────────────

function SectionHeader({ title, subtitle, color }: { title: string; subtitle: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      {color && (
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────

import { FC } from 'react';

export const FurniInfoV2View: FC<{}> = () => {
  return (
    <div className="flex flex-col items-center gap-10 py-8 px-4">
      <div className="text-center">
        <h1 className="text-lg font-bold">Möbel-Info Prototypen</h1>
        <p className="text-sm text-muted-foreground mt-1">Alle Varianten der In-Game Möbelanzeige im reui Enterprise Style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 items-start">
        {DEMO_FURNI.map((furni) => {
          const rarityColor = furni.rarityType ? RARITY_COLORS[furni.rarityType] : undefined;
          const label = furni.rarityType ? RARITY_LABELS[furni.rarityType] : "Normal";
          const subtitle = furni.rarityType
            ? `${furni.classname} · ${furni.circulation?.toLocaleString("de-DE") ?? 0} Stk.`
            : `${furni.classname} · Kein Rare`;

          return (
            <div key={furni.id} className="flex flex-col gap-3">
              <SectionHeader
                title={label}
                subtitle={subtitle}
                color={rarityColor}
              />
              <FurniInfoCard furni={furni} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
