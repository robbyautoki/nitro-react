
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Separator } from "@/components/ui/separator";
import { Search, X } from "lucide-react";
import { NAMEPLATE_COLLECTIONS } from "./nameplates-data";
import { AVATAR_DECORATION_COLLECTIONS } from "./avatar-decorations-data";
import { PROFILE_EFFECT_COLLECTIONS } from "./profile-effects-data";
import type {
  Nameplate,
  NameplateCollection,
  AvatarDecoration,
  DecoCollection,
  ProfileEffect,
  EffectCollection,
} from "./types";

const PALETTE_COLORS: Record<string, string> = {
  crimson: "#dc2626", berry: "#db2777", sky: "#0ea5e9", teal: "#14b8a6",
  forest: "#22c55e", bubble_gum: "#f472b6", violet: "#8b5cf6", cobalt: "#3b82f6",
  clover: "#16a34a", lemon: "#eab308", white: "#e5e7eb",
};

type TabId = "nameplates" | "decorations" | "effects";

const TABS: { id: TabId; label: string; count: number }[] = [
  { id: "nameplates", label: "Nameplates", count: NAMEPLATE_COLLECTIONS.reduce((s, c) => s + c.nameplates.length, 0) },
  { id: "decorations", label: "Avatar Decorations", count: AVATAR_DECORATION_COLLECTIONS.reduce((s, c) => s + c.decorations.length, 0) },
  { id: "effects", label: "Profile Effects", count: PROFILE_EFFECT_COLLECTIONS.reduce((s, c) => s + c.effects.length, 0) },
];

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CollectionFilter({ names, active, onSelect, counts }: { names: { id: string; name: string }[]; active: string; onSelect: (id: string) => void; counts: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => onSelect("all")} className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${active === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
        Alle ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {names.map((c) => (
        <button key={c.id} onClick={() => onSelect(c.id)} className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${active === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
          {c.name} ({counts[c.id] ?? 0})
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <input type="text" placeholder="Suchen..." value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function DetailClose({ onClose }: { onClose: () => void }) {
  return <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="size-4" /></button>;
}

function PaletteDot({ palette }: { palette: string }) {
  return <span className="inline-block size-3 rounded-full border border-white/20" style={{ backgroundColor: PALETTE_COLORS[palette] ?? "#888" }} />;
}

// ═══════════════════════════════════════════════════════════════
// NAMEPLATES TAB
// ═══════════════════════════════════════════════════════════════

function NameplatesTab() {
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState<{ np: Nameplate; col: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const cols = active === "all" ? NAMEPLATE_COLLECTIONS : NAMEPLATE_COLLECTIONS.filter((c) => c.id === active);
    if (!q) return cols;
    return cols.map((c) => ({ ...c, nameplates: c.nameplates.filter((np) => np.name.toLowerCase().includes(q) || (np.label?.toLowerCase().includes(q) ?? false) || (np.palette?.toLowerCase().includes(q) ?? false)) })).filter((c) => c.nameplates.length > 0);
  }, [active, search]);

  const counts = Object.fromEntries(NAMEPLATE_COLLECTIONS.map((c) => [c.id, c.nameplates.length]));

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <CollectionFilter names={NAMEPLATE_COLLECTIONS} active={active} onSelect={(id) => { setActive(id); setSelected(null); }} counts={counts} />
      <p className="text-xs text-muted-foreground">{filtered.reduce((s, c) => s + c.nameplates.length, 0)} Nameplates</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-8">
          {filtered.map((col) => (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.name}</h2>
                <Badge variant="secondary" className="text-[10px]">{col.nameplates.length}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {col.nameplates.map((np) => (
                  <button key={np.skuId} onClick={() => setSelected({ np, col: col.name })} className={`group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:bg-accent/50 ${selected?.np.skuId === np.skuId ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card"}`}>
                    <div className="flex h-14 items-center justify-center">
                      <img src={np.staticUrl} alt={np.name} draggable={false} className="h-12 w-auto rounded-sm object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} />
                    </div>
                    <span className="text-xs font-medium leading-tight text-center truncate w-full">{np.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{col.name}</span>
                      {np.palette && <PaletteDot palette={np.palette} />}
                    </div>
                    {np.videoUrl && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-primary bg-primary/10 rounded px-1">VIDEO</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-6">
            {selected ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{selected.np.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">{selected.col}</Badge>
                    {selected.np.palette && <Badge variant="outline" className="text-[10px] gap-1"><PaletteDot palette={selected.np.palette} />{selected.np.palette}</Badge>}
                  </div>
                  <DetailClose onClose={() => setSelected(null)} />
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-[#313338] rounded-lg p-4 flex justify-center"><img src={selected.np.staticUrl} alt={selected.np.name} draggable={false} className="h-16 w-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} /></div>
                  {selected.np.videoUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Animiert</span>
                      <div className="bg-[#313338] rounded-lg p-4 w-full flex flex-col items-center gap-2">
                        <video src={selected.np.videoUrl} autoPlay loop muted playsInline className="h-16 w-auto rounded" />
                        <a href={selected.np.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline underline-offset-2">Video im Browser öffnen</a>
                      </div>
                    </div>
                  )}
                  {selected.np.label && <p className="text-sm text-muted-foreground">{selected.np.label}</p>}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">SKU ID</span><p className="font-mono text-[11px]">{selected.np.skuId}</p></div>
                    <div><span className="text-muted-foreground">Asset</span><p className="font-mono text-[11px] break-all">{selected.np.asset}</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center"><p className="text-sm text-muted-foreground">Klicke auf eine Nameplate</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AVATAR DECORATIONS TAB
// ═══════════════════════════════════════════════════════════════

function DecorationsTab() {
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState<{ d: AvatarDecoration; col: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const cols = active === "all" ? AVATAR_DECORATION_COLLECTIONS : AVATAR_DECORATION_COLLECTIONS.filter((c) => c.id === active);
    if (!q) return cols;
    return cols.map((c) => ({ ...c, decorations: c.decorations.filter((d) => d.name.toLowerCase().includes(q) || (d.label?.toLowerCase().includes(q) ?? false)) })).filter((c) => c.decorations.length > 0);
  }, [active, search]);

  const counts = Object.fromEntries(AVATAR_DECORATION_COLLECTIONS.map((c) => [c.id, c.decorations.length]));

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <CollectionFilter names={AVATAR_DECORATION_COLLECTIONS} active={active} onSelect={(id) => { setActive(id); setSelected(null); }} counts={counts} />
      <p className="text-xs text-muted-foreground">{filtered.reduce((s, c) => s + c.decorations.length, 0)} Decorations</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-8">
          {filtered.map((col) => (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.name}</h2>
                <Badge variant="secondary" className="text-[10px]">{col.decorations.length}</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2">
                {col.decorations.map((d) => (
                  <button key={d.skuId} onClick={() => setSelected({ d, col: col.name })} className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:bg-accent/50 ${selected?.d.skuId === d.skuId ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card"}`}>
                    <div className="flex size-16 items-center justify-center">
                      <img src={d.animatedUrl || d.staticUrl} alt={d.name} draggable={false} className="size-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-center truncate w-full">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-6">
            {selected ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{selected.d.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">{selected.col}</Badge>
                  </div>
                  <DetailClose onClose={() => setSelected(null)} />
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex gap-4 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Statisch</span>
                      <div className="bg-[#313338] rounded-lg p-4 flex justify-center"><img src={selected.d.staticUrl} alt={selected.d.name} draggable={false} className="size-24 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} /></div>
                    </div>
                    {selected.d.animatedUrl && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Animiert</span>
                        <div className="bg-[#313338] rounded-lg p-4 flex justify-center"><img src={selected.d.animatedUrl} alt={selected.d.name} draggable={false} className="size-24 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} /></div>
                      </div>
                    )}
                  </div>
                  {/* Discord-style avatar preview */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Avatar-Vorschau</span>
                    <div className="relative size-52">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center justify-center">
                          <img src="https://www.habbo.com/habbo-imaging/avatarimage?figure=hr-3163-45.hd-180-1.ch-3030-1408.lg-3116-85-62.sh-3115-1408-62.ha-3614-1408-62&headonly=1&direction=3&head_direction=3&size=l&gesture=sml" alt="Avatar" draggable={false} className="object-contain" style={{ maxWidth: "170px", height: "185px", imageRendering: "pixelated" }} />
                        </div>
                      </div>
                      <img src={selected.d.animatedUrl || selected.d.staticUrl} alt="" draggable={false} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-36 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </div>
                  {selected.d.label && <p className="text-sm text-muted-foreground">{selected.d.label}</p>}
                  <div className="text-xs"><span className="text-muted-foreground">SKU ID</span><p className="font-mono text-[11px]">{selected.d.skuId}</p></div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center"><p className="text-sm text-muted-foreground">Klicke auf eine Decoration</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE EFFECTS TAB
// ═══════════════════════════════════════════════════════════════

function EffectsTab() {
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState<{ e: ProfileEffect; col: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const cols = active === "all" ? PROFILE_EFFECT_COLLECTIONS : PROFILE_EFFECT_COLLECTIONS.filter((c) => c.id === active);
    if (!q) return cols;
    return cols.map((c) => ({ ...c, effects: c.effects.filter((e) => e.name.toLowerCase().includes(q) || (e.label?.toLowerCase().includes(q) ?? false)) })).filter((c) => c.effects.length > 0);
  }, [active, search]);

  const counts = Object.fromEntries(PROFILE_EFFECT_COLLECTIONS.map((c) => [c.id, c.effects.length]));

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <CollectionFilter names={PROFILE_EFFECT_COLLECTIONS} active={active} onSelect={(id) => { setActive(id); setSelected(null); }} counts={counts} />
      <p className="text-xs text-muted-foreground">{filtered.reduce((s, c) => s + c.effects.length, 0)} Effects</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-8">
          {filtered.map((col) => (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.name}</h2>
                <Badge variant="secondary" className="text-[10px]">{col.effects.length}</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2">
                {col.effects.map((e) => (
                  <button key={e.skuId} onClick={() => setSelected({ e, col: col.name })} className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:bg-accent/50 ${selected?.e.skuId === e.skuId ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card"}`}>
                    <div className="flex size-16 items-center justify-center">
                      <img src={e.staticUrl} alt={e.name} draggable={false} className="size-14 rounded object-cover" onError={(e2) => { (e2.target as HTMLImageElement).style.opacity = "0.15"; }} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-center truncate w-full">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-6">
            {selected ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{selected.e.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">{selected.col}</Badge>
                  </div>
                  <DetailClose onClose={() => setSelected(null)} />
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex gap-4 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Statisch</span>
                      <div className="bg-[#313338] rounded-lg p-4 flex justify-center"><img src={selected.e.staticUrl} alt={selected.e.name} draggable={false} className="h-32 w-auto rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} /></div>
                    </div>
                    {selected.e.animatedUrl && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Animiert</span>
                        <div className="bg-[#313338] rounded-lg p-4 flex justify-center"><img src={selected.e.animatedUrl} alt={selected.e.name} draggable={false} className="h-32 w-auto rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} /></div>
                      </div>
                    )}
                  </div>
                  {/* Mock profile preview */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Profil-Vorschau</span>
                    <div className="w-full max-w-xs bg-[#232428] rounded-xl overflow-hidden border border-[#3f4147] relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-40 overflow-hidden">
                        <img src={selected.e.animatedUrl || selected.e.staticUrl} alt="" draggable={false} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div className="relative h-16 bg-gradient-to-r from-indigo-600/60 to-purple-600/60" />
                      <div className="relative px-4 pb-4">
                        <div className="absolute -top-8 left-4 size-20 rounded-full bg-[#313338] border-4 border-[#232428] flex items-center justify-center overflow-hidden"><img src="https://www.habbo.com/habbo-imaging/avatarimage?figure=hr-3163-45.hd-180-1.ch-3030-1408.lg-3116-85-62.sh-3115-1408-62.ha-3614-1408-62&headonly=1&direction=3&head_direction=3&size=l&gesture=sml" alt="Avatar" draggable={false} className="size-24 object-contain" style={{ imageRendering: "pixelated" }} /></div>
                        <div className="pt-10"><p className="text-sm font-bold text-white">HabboPlayer</p><p className="text-xs text-[#b5bac1]">habbo_player</p></div>
                      </div>
                    </div>
                  </div>
                  {selected.e.label && <p className="text-sm text-muted-foreground">{selected.e.label}</p>}
                  <div className="text-xs"><span className="text-muted-foreground">SKU ID</span><p className="font-mono text-[11px]">{selected.e.skuId}</p></div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center"><p className="text-sm text-muted-foreground">Klicke auf einen Effect</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

import { FC } from 'react';

export const NameplatesV2View: FC<{}> = () => {
  const [tab, setTab] = useState<TabId>("nameplates");
  const total = TABS.reduce((s, t) => s + t.count, 0);

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discord Assets</h1>
        <p className="text-muted-foreground mt-1">
          {total} Items aus dem Discord Shop &mdash;{" "}
          <a href="https://github.com/aamiaa/discord-api-diff" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">aamiaa/discord-api-diff</a>
        </p>
      </div>

      <Separator />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label} <span className="text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === "nameplates" && <NameplatesTab />}
      {tab === "decorations" && <DecorationsTab />}
      {tab === "effects" && <EffectsTab />}
    </div>
  );
}
