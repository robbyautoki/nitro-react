
import { useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Layers,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Trash2,
  Dice5,
  X,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════

const DEMO_FIGURE = "hr-3163-45.hd-180-1.ch-3030-73.lg-3116-73-1408.sh-3016-73.ha-3614-73";

const WARDROBE_FIGURES = [
  { figure: "hr-3163-45.hd-180-1.ch-3030-73.lg-3116-73-1408.sh-3016-73.ha-3614-73", gender: "M" },
  { figure: "hr-831-45.hd-180-2.ch-255-73.lg-280-73.sh-305-73.ha-1003-73", gender: "M" },
  { figure: "hr-893-45.hd-600-2.ch-665-73.lg-720-73.sh-725-73.ha-1015-73", gender: "M" },
  { figure: null, gender: null },
  { figure: null, gender: null },
  { figure: "hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68", gender: "F" },
  { figure: null, gender: null },
  { figure: null, gender: null },
  { figure: "hr-100-45.hd-180-7.ch-215-66.lg-270-79.sh-305-62.ha-1002-70", gender: "M" },
  { figure: null, gender: null },
];

function avatarUrl(figure: string, dir = 2, size = "l") {
  return `https://www.habbo.de/habbo-imaging/avatarimage?figure=${figure}&direction=${dir}&head_direction=${dir}&size=${size}`;
}

type Category = "generic" | "head" | "torso" | "legs" | "wardrobe";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "generic", label: "Gesicht & Körper" },
  { key: "head", label: "Kopf" },
  { key: "torso", label: "Oberkörper" },
  { key: "legs", label: "Beine" },
  { key: "wardrobe", label: "Kleiderschrank" },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  generic: [],
  head: ["Haare", "Hüte", "Brillen", "Masken", "Ohrringe"],
  torso: ["Oberteile", "Jacken", "Ketten", "Handschuhe"],
  legs: ["Hosen", "Schuhe", "Gürtel"],
};

const SKIN_COLORS = [
  "#F5D7B5", "#F2C89D", "#EDBA87", "#E8A96C", "#D4915A", "#C27E4E",
  "#B06A3B", "#9D5830", "#8B4726", "#7A3A1E", "#5E2E17", "#4A2212",
  "#F0C4C4", "#E8ABAB", "#D49393", "#C17A7A", "#AD6262", "#9A4A4A",
  "#E8D0B8", "#D4BC9E", "#C0A884", "#AD946A", "#997F50", "#866B36",
];

const HAIR_COLORS = [
  "#1A1A1A", "#2C1B0E", "#3D2B1B", "#5C3A1E", "#7A4F2B", "#A06838",
  "#C48A4A", "#D4A862", "#E8C87A", "#F0D890", "#FFE8A0", "#F5E6D0",
  "#8B2500", "#A03020", "#C04030", "#D06050", "#4A0E4A", "#6B2D6B",
  "#2B4570", "#3A5A8A", "#4A70A5", "#5A88C0", "#6AA0DA", "#80B8F0",
];

// ═══════════════════════════════════════════════════
// AVATAR PREVIEW
// ═══════════════════════════════════════════════════

function AvatarPreview({ figure, direction, onRotate }: {
  figure: string; direction: number; onRotate: (d: number) => void;
}) {
  return (
    <div className="w-[180px] min-w-[180px] flex flex-col border-r">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-muted/40 via-muted/20 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(255,255,255,0.08),transparent)]" />
        <img
          src={avatarUrl(figure, direction)}
          alt=""
          className="relative z-10 h-[200px] object-contain drop-shadow-lg"
          draggable={false}
        />
        <button
          onClick={() => onRotate(1)}
          className="absolute left-2 bottom-1/2 translate-y-1/2 z-10 size-7 rounded-full bg-background/80 border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => onRotate(-1)}
          className="absolute right-2 bottom-1/2 translate-y-1/2 z-10 size-7 rounded-full bg-background/80 border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-2 space-y-1.5 border-t">
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 h-7"><Undo2 className="size-3" /></Button>
            </TooltipTrigger>
            <TooltipContent className="text-[10px]">Zurücksetzen</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 h-7"><Trash2 className="size-3" /></Button>
            </TooltipTrigger>
            <TooltipContent className="text-[10px]">Leeren</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 h-7"><Dice5 className="size-3" /></Button>
            </TooltipTrigger>
            <TooltipContent className="text-[10px]">Zufällig</TooltipContent>
          </Tooltip>
        </div>
        <Button size="sm" className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500">
          Änderungen speichern
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FIGURE ITEM GRID
// ═══════════════════════════════════════════════════

function FigureGrid({ activeItem, onSelect }: { activeItem: number; onSelect: (i: number) => void }) {
  const items = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    hc: i === 5 || i === 6 || i === 12 || i === 13 || i === 20 || i === 21,
  }));

  return (
    <div className="grid grid-cols-7 gap-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`relative aspect-square rounded-md border cursor-pointer transition-all flex items-center justify-center ${
            activeItem === item.id
              ? "border-primary ring-1 ring-primary/30 bg-primary/10"
              : "border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-border"
          }`}
        >
          <div className="size-8 rounded bg-muted/60" />
          {item.hc && (
            <span className="absolute top-0.5 right-0.5 text-[8px] font-bold text-amber-500 bg-amber-500/15 rounded px-0.5 leading-tight">HC</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════

function ColorPalette({ colors, active, onSelect }: {
  colors: string[]; active: number; onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {colors.map((color, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`size-5 rounded-sm cursor-pointer border transition-all ${
            active === i
              ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary"
              : "border-transparent hover:border-border"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// WARDROBE VIEW
// ═══════════════════════════════════════════════════

function WardrobeView() {
  return (
    <div className="grid grid-cols-5 gap-2 p-3">
      {WARDROBE_FIGURES.map((slot, i) => (
        <div key={i} className="flex flex-col items-center rounded-lg border bg-muted/20 overflow-hidden">
          <div className="w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-b from-muted/30 to-transparent relative">
            {slot.figure ? (
              <img src={avatarUrl(slot.figure, 2, "m")} alt="" className="h-[90px] object-contain" draggable={false} />
            ) : (
              <span className="text-[10px] text-muted-foreground/40">Leer</span>
            )}
          </div>
          <div className="flex gap-0.5 p-1 w-full">
            <Button size="sm" variant="ghost" className="flex-1 h-5 text-[9px] px-0">Speichern</Button>
            {slot.figure && (
              <Button size="sm" variant="ghost" className="flex-1 h-5 text-[9px] px-0 text-primary">Anziehen</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// EDITOR RIGHT PANEL
// ═══════════════════════════════════════════════════

function EditorPanel({ category, gender, setGender }: {
  category: Category; gender: "M" | "F"; setGender: (g: "M" | "F") => void;
}) {
  const [activeItem, setActiveItem] = useState(4);
  const [activeColor, setActiveColor] = useState(2);
  const [activeSub, setActiveSub] = useState(0);

  if (category === "wardrobe") return <WardrobeView />;

  const subs = SUB_CATEGORIES[category] || [];
  const isGeneric = category === "generic";
  const colors = isGeneric ? SKIN_COLORS : HAIR_COLORS;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0">
        {isGeneric ? (
          <>
            <button
              onClick={() => setGender("M")}
              className={`size-8 rounded-md flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                gender === "M" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              ♂
            </button>
            <button
              onClick={() => setGender("F")}
              className={`size-8 rounded-md flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                gender === "F" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              ♀
            </button>
          </>
        ) : (
          subs.map((sub, i) => (
            <button
              key={sub}
              onClick={() => setActiveSub(i)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                activeSub === i ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {sub}
            </button>
          ))
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2.5">
          <FigureGrid activeItem={activeItem} onSelect={setActiveItem} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t px-2.5 py-2 max-h-[100px] overflow-y-auto">
        <ColorPalette colors={colors} active={activeColor} onSelect={setActiveColor} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN EDITOR
// ═══════════════════════════════════════════════════

function AvatarEditor() {
  const [category, setCategory] = useState<Category>("generic");
  const [direction, setDirection] = useState(2);
  const [gender, setGender] = useState<"M" | "F">("M");

  const rotate = (d: number) => {
    setDirection(prev => {
      let next = prev + d;
      if (next < 0) next = 7;
      if (next > 7) next = 0;
      return next;
    });
  };

  return (
    <Frame className="max-w-[640px]">
      <FramePanel className="p-0!">
        <div className="flex items-center justify-between px-3.5 py-2 border-b">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aussehen ändern</span>
          <button className="size-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer">
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex border-b px-3 py-1 gap-1 shrink-0">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                category === c.key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex h-[400px]">
          <AvatarPreview figure={DEMO_FIGURE} direction={direction} onRotate={rotate} />
          <EditorPanel category={category} gender={gender} setGender={setGender} />
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

import { FC } from 'react';

export const AvatarEditorV2View: FC<{}> = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Avatar-Editor</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gesicht · Kopf · Oberkörper · Beine · Kleiderschrank</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="gap-1.5 text-muted-foreground/60"><Monitor className="w-3.5 h-3.5" />5 Tabs</Badge>
              <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 py-6">
          <AvatarEditor />
        </div>
      </div>
    </TooltipProvider>
  );
}
