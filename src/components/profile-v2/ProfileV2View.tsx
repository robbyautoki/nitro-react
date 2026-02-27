
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  X, Pen, Heart, Smile, UserPlus, MessageCircle, DoorOpen, Layers, Star, Users, Shield, Calendar, ChevronRight, Sparkles, Crown, Gem,
} from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};
const KLIPY_KEY = process.env.NEXT_PUBLIC_KLIPY_API_KEY ?? "";

interface KlipyGif { id: number; slug: string; title: string; file: { md: { gif: { url: string } }; sm: { webp: { url: string } } } }

function getAvatar(figure: string) {
  return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${encodeURIComponent(figure)}&direction=2&head_direction=2&size=l&gesture=sml`;
}
function getAvatarHead(figure: string) {
  return `https://www.habbo.com/habbo-imaging/avatarimage?figure=${encodeURIComponent(figure)}&headonly=1&direction=2&head_direction=2&size=l&gesture=sml`;
}
function getBadgeUrl(code: string) {
  return `https://images.habbo.com/c_images/album1584/${code}.gif`;
}
function getGroupBadgeUrl(code: string) {
  return `https://www.habbo.com/habbo-imaging/badge/${code}.gif`;
}
function getFurniIcon(name: string) {
  return `${ASSETS_URL()}/c_images/${name.split("*")[0]}_icon.png`;
}

const CURRENCY_ICONS = { credits: `${ASSETS_URL()}/wallet/-1.png` } as const;
function CurrencyIcon({ className }: { className?: string }) {
  return <img src={CURRENCY_ICONS.credits} alt="Credits" className={className || "w-3.5 h-3.5"} style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

// ─── Banner Presets ─────────────────────────────

interface BannerPreset { id: string; name: string; gradient: string; gifUrl?: string }

const BANNER_PRESETS: BannerPreset[] = [
  { id: "nebula", name: "Nebula", gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", gifUrl: "https://user-images.githubusercontent.com/75514601/209616422-ae1407ff-146d-46b7-b716-d43da5cb021d.gif" },
  { id: "plasma", name: "Plasma", gradient: "linear-gradient(135deg, #00c9ff, #92fe9d)", gifUrl: "https://user-images.githubusercontent.com/75514601/209625722-7a7ffa83-f44c-4a6b-93b5-32474236fe94.gif" },
  { id: "inferno", name: "Inferno", gradient: "linear-gradient(135deg, #f83600, #f9d423)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642124-8de07088-6665-4f8f-b42a-e0572b3f468e.gif" },
  { id: "vortex", name: "Vortex", gradient: "linear-gradient(135deg, #0f0c29, #302b63)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642130-a31ad8c4-d125-4623-bbbd-904824928f5c.gif" },
  { id: "aurora", name: "Aurora", gradient: "linear-gradient(135deg, #00c9ff, #92fe9d)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642135-64e5c1d2-ef3e-48b2-837f-33ba0be22bd3.gif" },
  { id: "cyberwave", name: "Cyberwave", gradient: "linear-gradient(135deg, #b721ff, #21d4fd)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642170-6e844de7-6396-44b2-bc71-71dafbbd316c.gif" },
  { id: "magma", name: "Magma", gradient: "linear-gradient(135deg, #f12711, #f5af19)", gifUrl: "https://user-images.githubusercontent.com/75514601/209625716-5dae539d-65d1-4703-b04d-ca5e839f8c61.gif" },
  { id: "storm", name: "Storm", gradient: "linear-gradient(135deg, #0061ff, #60efff)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642206-fcfbc935-7b5e-4912-8293-156bcf67ff03.gif" },
  { id: "cosmos", name: "Cosmos", gradient: "linear-gradient(135deg, #fc00ff, #00dbde)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642192-97d027db-db77-496b-8f68-0f1d8452d819.gif" },
  { id: "toxic", name: "Toxic", gradient: "linear-gradient(135deg, #56ab2f, #a8e063)", gifUrl: "https://user-images.githubusercontent.com/75514601/209642212-ec8ba881-2a1b-49dd-a29b-a5a65786cc31.gif" },
  { id: "default", name: "Default", gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))" },
];

// ─── Profile Effects (Discord-Style) ────────────

interface EffectLayer { src: string; loop: boolean; width: number; height: number; duration: number; start: number; loopDelay: number; zIndex: number }
interface ProfileEffectData { id: string; title: string; thumbnailSrc: string; effects: EffectLayer[] }

const PROFILE_EFFECTS: ProfileEffectData[] = [
  {
    id: "boost-relic", title: "Boost Relic",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-7/boost-relic/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/boost-relic/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "cyberspace", title: "Cyberspace",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-7/cyberspace/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-20/cyberspace/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "hydro-blast", title: "Hydro Blast",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/splash/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "shatter", title: "Shatter",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/earthquake/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/earthquake/intro.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/earthquake/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 2880, zIndex: 101 },
    ],
  },
  {
    id: "magic-hearts", title: "Magic Hearts",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/magic-girl/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "sakura-dreams", title: "Sakura Dreams",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/sakura/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-12-13/sakura/intro.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/sakura/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 2880, zIndex: 101 },
    ],
  },
  {
    id: "power-surge", title: "Power Surge",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/sayan/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/intro.png", loop: false, height: 880, width: 450, duration: 2400, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/sayan/loop.png", loop: true, height: 880, width: 450, duration: 2480, start: 4960, loopDelay: 4960, zIndex: 101 },
    ],
  },
  {
    id: "shuriken-strike", title: "Shuriken Strike",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/shuriken/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-5/shuriken/intro3.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/shuriken/loop3.png", loop: true, height: 880, width: 450, duration: 2000, start: 2880, loopDelay: 2000, zIndex: 101 },
    ],
  },
  {
    id: "mystic-vines", title: "Mystic Vines",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2e46d5d2d9e/vines/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/intro.png", loop: true, height: 880, width: 450, duration: 3071, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/loop.png", loop: true, height: 880, width: 450, duration: 2988, start: 2905, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/vines/intro-glow.png", loop: false, height: 880, width: 450, duration: 2573, start: 1666, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "pixie-dust", title: "Pixie Dust",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/fairy/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 2880, zIndex: 100 },
    ],
  },
  {
    id: "discord-os", title: "Discord-Os",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/cereal/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "breakfast-plate", title: "Breakfast Plate",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/plate/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "ghoulish-graffiti", title: "Ghoulish Graffiti",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/intro.png", loop: false, height: 880, width: 450, duration: 2573, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/punk-girl/loop.png", loop: true, height: 880, width: 450, duration: 2000, start: 5146, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "dark-omens", title: "Dark Omens",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/ghost-skull/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "zombie-slime", title: "Zombie Slime",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/b17d139f2e9/zombie-slime/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "fall-foliage", title: "Fall Foliage",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/leaves/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/intro-branch.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/intro-leaves.png", loop: false, height: 880, width: 450, duration: 2988, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-10-11/leaves/loop.png", loop: true, height: 880, width: 450, duration: 3984, start: 5760, loopDelay: 7968, zIndex: 102 },
    ],
  },
  {
    id: "lillypad-life", title: "Lillypad Life",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-9-25/rain/loop.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "deck-the-halls", title: "Deck the halls",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/deck-the-halls/intro.png", loop: true, height: 880, width: 450, duration: 1750, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/deck-the-halls/loop.png", loop: true, height: 880, width: 450, duration: 1250, start: 1750, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "snowy-shenanigans", title: "Snowy Shenanigans",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/snowy-shenanigans/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-28/snowy-shenanigans/intro.png", loop: true, height: 880, width: 450, duration: 4168, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-22/snowy-shenanigans/loop.png", loop: true, height: 880, width: 450, duration: 8334, start: 4168, loopDelay: 8334, zIndex: 101 },
    ],
  },
  {
    id: "goozilla", title: "Goozilla",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/intro-claw.png", loop: true, height: 880, width: 450, duration: 4250, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/intro-slime.png", loop: false, height: 880, width: 450, duration: 4250, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/goozilla/loop.png", loop: true, height: 880, width: 450, duration: 3000, start: 4250, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "heartzilla", title: "Heartzilla",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/heartzilla/intro.png", loop: true, height: 880, width: 450, duration: 3750, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/heartzilla/loop.png", loop: true, height: 880, width: 450, duration: 4000, start: 3750, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "monster-pop", title: "Monster Pop",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/monster-pop/intro-monster.png", loop: true, height: 880, width: 450, duration: 3917, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-30/monster-pop/intro-glass.png", loop: true, height: 880, width: 450, duration: 3917, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2023-11-29/monster-pop/loop.png", loop: true, height: 880, width: 450, duration: 2083, start: 3917, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "nightrunner", title: "Nightrunner",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-16/cyberpunk-nightrunner/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-nightrunner/intro.png", loop: false, height: 880, width: 450, duration: 2960, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-nightrunner/idle.png", loop: true, height: 880, width: 450, duration: 2960, start: 5920, loopDelay: 5920, zIndex: 101 },
    ],
  },
  {
    id: "uplink-error", title: "Uplink Error",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-16/cyberpunk-uplinkerror/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-19/cyberpunk-uplinkerror/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-1-18/cyberpunk-uplinkerror/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "dragon-dance", title: "Dragon Dance",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/dragon-dance/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/intro_2e0f72c35c.png", loop: false, height: 880, width: 450, duration: 3360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-07/dragon-dance/loop_20e743b578.png", loop: true, height: 880, width: 450, duration: 8560, start: 2880, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "fortune-flurry", title: "Fortune Flurry",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/fortune-flurry/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/fortune-flurry/frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/fortune-flurry/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-02/fortune-flurry/loop.png", loop: true, height: 880, width: 450, duration: 10000, start: 2880, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "midnight-celebration", title: "Midnight Celebration",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-01-31/midnight-celebration/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-01/midnight-celebration/fireworks.png", loop: true, height: 880, width: 450, duration: 2880, start: 3200, loopDelay: 5760, zIndex: 102 },
    ],
  },
  {
    id: "rock-slide", title: "Rock Slide",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/rock-slide/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "vortex", title: "Vortex",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/vortex/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "mastery", title: "Mastery",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-13/mastery/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 5760, zIndex: 101 },
    ],
  },
  {
    id: "dreamy", title: "Dreamy",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/dreamy/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "ki-detonate", title: "Ki Detonate",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/ki-detonate/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "sushi-mania", title: "Sushi Mania",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-02-28/sushi-mania/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 3280, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "petal-serenade", title: "Petal Serenade",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/intro-pse01.png", loop: false, height: 880, width: 450, duration: 3200, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/petal-serenade/idle-petals.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 3500, zIndex: 102 },
    ],
  },
  {
    id: "fellowship-of-the-spring", title: "Fellowship of the Spring",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/intro-fose01.png", loop: false, height: 880, width: 450, duration: 3100, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-frame.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/fellowship-of-the-spring/idle-critters.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 8000, zIndex: 102 },
    ],
  },
  {
    id: "spring-bloom", title: "Spring Bloom",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/intro-sbe01.png", loop: false, height: 880, width: 450, duration: 7300, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-flowers.png", loop: true, height: 880, width: 450, duration: 4800, start: 6800, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-11/spring-bloom/idle-rain.png", loop: true, height: 880, width: 450, duration: 4880, start: 6800, loopDelay: 8000, zIndex: 102 },
    ],
  },
  {
    id: "cloves-ruse", title: "Clove's Ruse",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/thumbnail_a5917b67.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/intro_b62d8ce4.png", loop: false, height: 880, width: 450, duration: 5360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/cloves-ruse/idle_050419ac.png", loop: true, height: 880, width: 450, duration: 5840, start: 6560, loopDelay: 5840, zIndex: 101 },
    ],
  },
  {
    id: "ace", title: "ACE",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/thumbnail_7c4f8929.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/intro_fa545ec0.png", loop: false, height: 880, width: 450, duration: 4480, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_frame_83d027d7.png", loop: true, height: 880, width: 450, duration: 20000, start: 4080, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/ace/idle_a4ea3c0d.png", loop: true, height: 880, width: 450, duration: 5680, start: 8960, loopDelay: 0, zIndex: 102 },
    ],
  },
  {
    id: "the-immortal-clove", title: "The Immortal Clove",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/thumbnail_20409a9b.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/intro_310a69a3.png", loop: false, height: 880, width: 400, duration: 4890, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-03-21/the-immortal-clove/idle_8739289c.png", loop: true, height: 880, width: 400, duration: 7350, start: 9780, loopDelay: 3580, zIndex: 101 },
    ],
  },
  {
    id: "study-spot", title: "Study Spot",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-12/study-spot/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/study-spot/idle.png", loop: true, height: 880, width: 450, duration: 3000, start: 3000, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "all-nighter", title: "All Nighter",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-14/all-nighter/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-frame.png", loop: true, height: 880, width: 450, duration: 3000, start: 3000, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/all-nighter/idle-lights.png", loop: true, height: 880, width: 450, duration: 3000, start: 4000, loopDelay: 5000, zIndex: 102 },
    ],
  },
  {
    id: "watercolors", title: "Watercolors",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/intro.png", loop: false, height: 880, width: 450, duration: 3000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-04/watercolors/idle.png", loop: true, height: 880, width: 450, duration: 3000, start: 6000, loopDelay: 3000, zIndex: 101 },
    ],
  },
  {
    id: "shooting-stars", title: "Shooting Stars",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/shooting-stars/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/intro_770bd27eae0.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/shooting-stars/loop_b1b5a9936b.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "supernova", title: "Supernova",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/supernova/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/intro_9e90bcf683.png", loop: true, height: 880, width: 450, duration: 2960, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/supernova/loop_5835f1730b.png", loop: true, height: 880, width: 450, duration: 2880, start: 5920, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "twilight", title: "Twilight",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-22/twilight/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/intro_56dbd2384f.png", loop: true, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-04-25/twilight/loop_ff3e249d19.png", loop: true, height: 880, width: 450, duration: 2880, start: 5760, loopDelay: 4320, zIndex: 101 },
    ],
  },
  {
    id: "feelin-mischievous", title: "Feelin' Mischievous",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/intro_bg.png", loop: false, height: 880, width: 450, duration: 5200, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/intro.png", loop: false, height: 880, width: 450, duration: 5200, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle_bg.png", loop: true, height: 880, width: 450, duration: 2160, start: 4800, loopDelay: 0, zIndex: 102 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-mischievous/idle.png", loop: true, height: 880, width: 450, duration: 2160, start: 4800, loopDelay: 0, zIndex: 103 },
    ],
  },
  {
    id: "feelin-90s", title: "Feelin' 90s",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/intro.png", loop: false, height: 880, width: 450, duration: 1360, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-70s/idle.png", loop: true, height: 880, width: 450, duration: 8080, start: 1360, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "feelin-pizzazz", title: "Feelin' Pizzazz",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/feelin-pizzazz/intro.png", loop: false, height: 880, width: 450, duration: 1280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/feelin-pizzazz/idle.png", loop: true, height: 880, width: 450, duration: 7840, start: 1260, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "jolly-roger", title: "Jolly Roger",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/jolly-roger/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/jolly-roger/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "forgotten-treasure", title: "Forgotten Treasure",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-10/forgotten-treasure/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/forgotten-treasure/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "haunted-man-o-war", title: "Haunted Man O' War",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-09/haunted-man-o-war/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/intro.png", loop: false, height: 880, width: 450, duration: 3280, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-13/haunted-man-o-war/idle.png", loop: true, height: 880, width: 450, duration: 3280, start: 6000, loopDelay: 4000, zIndex: 101 },
    ],
  },
  {
    id: "space-evader", title: "Space Evader",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/intro_bg.png", loop: false, height: 880, width: 450, duration: 4160, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/intro_spaceship.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/idle.png", loop: true, height: 880, width: 450, duration: 4800, start: 7000, loopDelay: 3500, zIndex: 102 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/space-evader/hud.png", loop: true, height: 880, width: 450, duration: 2400, start: 0, loopDelay: 0, zIndex: 103 },
    ],
  },
  {
    id: "turbo-drive", title: "Turbo Drive",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_finish.png", loop: true, height: 880, width: 450, duration: 2880, start: 2700, loopDelay: 0, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/turbo-drive/idle_confetti.png", loop: true, height: 880, width: 450, duration: 2880, start: 2700, loopDelay: 3500, zIndex: 102 },
    ],
  },
  {
    id: "twinkle-trails", title: "Twinkle Trails",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/intro.png", loop: false, height: 880, width: 450, duration: 9760, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-05-29/twinkle-trails/idle.png", loop: true, height: 880, width: 450, duration: 6380, start: 9500, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "saya", title: "Saya",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-21/saya/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/saya/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 10240, loopDelay: 6400, zIndex: 101 },
    ],
  },
  {
    id: "wake-up", title: "Wake Up!",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/wake-up/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/wake-up/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 7780, loopDelay: 4900, zIndex: 101 },
    ],
  },
  {
    id: "tocotoco", title: "Tocotoco",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-20/tocotoco/intro.png", loop: false, height: 880, width: 450, duration: 2880, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-06-18/tocotoco/idle.png", loop: true, height: 880, width: 450, duration: 2880, start: 2880, loopDelay: 7000, zIndex: 101 },
    ],
  },
  {
    id: "arcane-summons", title: "Arcane Summons",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/intro.png", loop: false, height: 880, width: 450, duration: 4720, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/arcane-summons/idle.png", loop: true, height: 880, width: 450, duration: 4960, start: 8000, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "vengeance", title: "Vengeance",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/intro.png", loop: false, height: 880, width: 450, duration: 3840, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/vengeance/idle.png", loop: true, height: 880, width: 450, duration: 5120, start: 8000, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "spirit-flame", title: "Spirit Flame",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/thumbnail.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/intro.png", loop: false, height: 880, width: 450, duration: 2560, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-01/spirit-flame/idle.png", loop: true, height: 880, width: 450, duration: 2960, start: 6000, loopDelay: 6000, zIndex: 101 },
    ],
  },
  {
    id: "nice-profile", title: "NiCe pRoFiLE",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/thumbnail_f44f333d.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-24/nice-profile/intro_a9d1e733.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_a.png", loop: true, height: 880, width: 450, duration: 4760, start: 8920, loopDelay: 14760, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/nice-profile/idle_b.png", loop: true, height: 880, width: 450, duration: 4760, start: 18680, loopDelay: 14760, zIndex: 102 },
    ],
  },
  {
    id: "handsome-squidward", title: "Handsome Squidward",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/thumbnail_c1f759bf.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/intro_e89c516b.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_a.png", loop: true, height: 880, width: 450, duration: 3280, start: 9000, loopDelay: 14120, zIndex: 101 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/handsome-squidward/idle_b.png", loop: true, height: 880, width: 450, duration: 4120, start: 17280, loopDelay: 13280, zIndex: 102 },
    ],
  },
  {
    id: "doodlebob-takeover", title: "DoodleBob Takeover",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/thumbnail_23f31885.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/intro_479359c2.png", loop: false, height: 880, width: 450, duration: 6000, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/doodlebob-takeover/idle.png", loop: true, height: 880, width: 450, duration: 4600, start: 8640, loopDelay: 5000, zIndex: 101 },
    ],
  },
  {
    id: "plankton-splat", title: "Plankton Splat",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/plankton-splat/thumbnail_72c641e8.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/intro.png", loop: false, height: 880, width: 450, duration: 5900, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-17/plankton-splat/idle.png", loop: true, height: 880, width: 450, duration: 7760, start: 4350, loopDelay: 0, zIndex: 101 },
    ],
  },
  {
    id: "ocean-flowers", title: "Ocean Flowers",
    thumbnailSrc: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/thumbnail_fe6ab6db.png",
    effects: [
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/intro.png", loop: false, height: 880, width: 450, duration: 3680, start: 0, loopDelay: 0, zIndex: 100 },
      { src: "https://cdn.discordapp.com/assets/profile_effects/effects/2024-07-15/ocean-flowers/idle.png", loop: true, height: 880, width: 450, duration: 5840, start: 6840, loopDelay: 5000, zIndex: 101 },
    ],
  },
];

// ─── Sprite Sheet Canvas Player ─────────────────

function SpriteLayer({ src, startDelay = 0 }: { src: string; startDelay?: number }) {
  const [visible, setVisible] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay > 0) {
      const t = setTimeout(() => setVisible(true), startDelay);
      return () => clearTimeout(t);
    }
  }, [startDelay]);

  if (!visible) return null;

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    />
  );
}

function ProfileEffectRenderer({ effect }: { effect: ProfileEffectData }) {
  const sorted = useMemo(() => [...effect.effects].sort((a, b) => a.zIndex - b.zIndex), [effect]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[15] group-hover:z-[2] opacity-100 group-hover:opacity-60 transition-opacity duration-500"
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
    >
      {sorted.map((layer, i) => (
        <div key={`${effect.id}-${i}`} className="absolute inset-0" style={{ zIndex: layer.zIndex }}>
          <SpriteLayer src={layer.src} startDelay={layer.start} />
        </div>
      ))}
    </div>
  );
}

// ─── Role Config ────────────────────────────────

interface RoleBadge { label: string; color: string; bg: string; border: string }

const ROLE_PRESETS: Record<string, RoleBadge> = {
  founder: { label: "Gründer", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/20" },
  admin: { label: "Admin", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20" },
  mod: { label: "Moderator", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/20" },
  vip: { label: "VIP", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/20" },
  trader: { label: "Trader", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/20" },
  builder: { label: "Builder", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/20" },
};

// ─── Showcase Items ─────────────────────────────

interface ShowcaseItem { name: string; itemName: string; value: number }

const OWN_SHOWCASE: ShowcaseItem[] = [
  { name: "Goldbarren", itemName: "gold_bar", value: 6500 },
  { name: "Thron", itemName: "throne", value: 4200 },
  { name: "Drachen-Lampe", itemName: "rare_dragon_lamp", value: 1800 },
  { name: "Kristallkugel", itemName: "crystal_ball", value: 750 },
];

const OTHER_SHOWCASE: ShowcaseItem[] = [
  { name: "Thron", itemName: "throne", value: 4200 },
  { name: "Seltener Brunnen", itemName: "rare_fountain", value: 2800 },
  { name: "Holo-Mädchen", itemName: "holo_girl", value: 950 },
  { name: "Disko-Kugel", itemName: "discoball", value: 180 },
];

// ─── Mutual Friends ─────────────────────────────

interface MutualFriend { name: string; figure: string }

const MUTUAL_FRIENDS: MutualFriend[] = [
  { name: "PixelQueen", figure: "hr-515-45.hd-600-10.ch-665-82.lg-710-82.sh-725-62.ha-1004-" },
  { name: "RareKing", figure: "hr-831-45.hd-180-1.ch-255-82.lg-280-82.sh-295-62" },
  { name: "CoolDude42", figure: "hr-893-45.hd-180-14.ch-220-82.lg-270-82.sh-300-91" },
];

// ─── Mock Profiles ──────────────────────────────

interface MockProfile {
  id: number;
  displayId: string;
  username: string;
  figure: string;
  motto: string;
  aboutMe: string;
  online: boolean;
  registration: string;
  lastAccess: string;
  friendsCount: number;
  achievementPoints: number;
  isMyFriend: boolean;
  requestSent: boolean;
  badges: string[];
  bannerId: string;
  roles: string[];
  currentRoom: string | null;
  featuredBadges: string[];
  featuredRares: ShowcaseItem[];
  relationships: { type: "heart" | "smile" | "bobba"; friendName: string; friendFigure: string; friendCount: number }[];
  profileEffectId: string | null;
  groups: { id: number; name: string; description: string; badgeCode: string; memberCount: number; isFavourite: boolean }[];
}

const OWN_PROFILE: MockProfile = {
  id: 1, displayId: "#1", username: "Sykeez",
  figure: "hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-300-91.ha-1003-",
  motto: "fear the dark",
  aboutMe: "Gründer von Bahhos.de. Seit 2006 in der Habbo-Szene unterwegs. Rare-Collector und UI-Designer.",
  online: true, registration: "18.02.2026", lastAccess: "Jetzt",
  friendsCount: 3, achievementPoints: 103, isMyFriend: false, requestSent: false,
  badges: ["ACH_RoomDecoFurniCount5", "ACH_Login5", "ACH_AvatarLooks1", "ACH_RespectGiven1", "ACH_AllTimeHotelPresence3"],
  bannerId: "nebula", roles: ["founder", "admin"], profileEffectId: "sakura-dreams",
  featuredBadges: ["ACH_Login5", "ACH_RoomDecoFurniCount5"],
  featuredRares: [{ name: "Thron", itemName: "throne", value: 4200 }, { name: "Goldbarren", itemName: "gold_bar", value: 6500 }],
  currentRoom: "Sykeez's Chill Lounge",
  relationships: [
    { type: "heart", friendName: "PixelQueen", friendFigure: "hr-515-45.hd-600-10.ch-665-82.lg-710-82.sh-725-62.ha-1004-", friendCount: 1 },
    { type: "smile", friendName: "—", friendFigure: "", friendCount: 0 },
    { type: "bobba", friendName: "—", friendFigure: "", friendCount: 0 },
  ],
  groups: [
    { id: 1, name: "Bahhos Elite", description: "Die Elite-Gruppe von Bahhos.de — nur für echte Veteranen.", badgeCode: "b21154s19124s18124s17134s161245f080555b", memberCount: 12, isFavourite: true },
    { id: 2, name: "Trade Masters", description: "Wir handeln fair und schnell.", badgeCode: "b05114s05134s05124s05114s0511457e66457", memberCount: 87, isFavourite: false },
    { id: 3, name: "Hotel Security", description: "Wir sorgen für Ordnung.", badgeCode: "b24154s24134s24124s24114s241140cee24c", memberCount: 8, isFavourite: false },
  ],
};

const OTHER_PROFILE: MockProfile = {
  id: 2, displayId: "#247", username: "TradeMaster",
  figure: "hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201-62",
  motto: "Trading is life",
  aboutMe: "Top-Trader auf Bahhos. Spezialisiert auf OG Rares und Bonzen-Items. DM für Deals!",
  online: true, registration: "05.01.2025", lastAccess: "Jetzt",
  friendsCount: 48, achievementPoints: 1420, isMyFriend: true, requestSent: false,
  badges: ["ACH_RoomDecoFurniCount10", "ACH_Login10", "ACH_RespectGiven5", "ACH_TraderPass1", "ACH_AvatarLooks5", "ACH_AllTimeHotelPresence10", "ACH_RoomDecoHosting1"],
  bannerId: "cyberwave", roles: ["vip", "trader"], profileEffectId: "power-surge",
  featuredBadges: ["ACH_TraderPass1", "ACH_Login10"],
  featuredRares: [{ name: "Seltener Brunnen", itemName: "rare_fountain", value: 2800 }, { name: "Thron", itemName: "throne", value: 4200 }],
  currentRoom: "TradeMaster's Handelsraum",
  relationships: [
    { type: "heart", friendName: "Sykeez", friendFigure: "hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-300-91.ha-1003-", friendCount: 1 },
    { type: "smile", friendName: "RareKing", friendFigure: "hr-831-45.hd-180-1.ch-255-82.lg-280-82.sh-295-62", friendCount: 3 },
    { type: "bobba", friendName: "CoolDude42", friendFigure: "hr-893-45.hd-180-14.ch-220-82.lg-270-82.sh-300-91", friendCount: 1 },
  ],
  groups: [
    { id: 2, name: "Trade Masters", description: "Wir handeln fair und schnell.", badgeCode: "b05114s05134s05124s05114s0511457e66457", memberCount: 87, isFavourite: true },
    { id: 4, name: "Rare Collectors Club", description: "Nur die seltensten Items!", badgeCode: "b20154s20134s20124s20114s201140ffda44", memberCount: 234, isFavourite: false },
  ],
};

// ─── Prestige ───────────────────────────────────

const PRESTIGE_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000];

function getLevel(score: number) {
  let level = 1;
  for (let i = 1; i < PRESTIGE_THRESHOLDS.length; i++) {
    if (score >= PRESTIGE_THRESHOLDS[i]) level = i + 1; else break;
  }
  const cur = PRESTIGE_THRESHOLDS[level - 1] ?? 0;
  const next = PRESTIGE_THRESHOLDS[level] ?? cur;
  const progress = next > cur ? ((score - cur) / (next - cur)) * 100 : 100;
  return { level: Math.min(level, 15), progress: Math.min(progress, 100) };
}

// ─── Drag + Resize ─────────────────────────────

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

// ─── Relationship Config ────────────────────────

const REL_CONFIG: Record<string, { icon: typeof Heart; color: string; bg: string; label: string }> = {
  heart: { icon: Heart, color: "text-red-400", bg: "bg-red-500/10", label: "Herz" },
  smile: { icon: Smile, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Smiley" },
  bobba: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10", label: "Bobba" },
};

// ─── Section Header ─────────────────────────────

function SectionHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/40">{children}</span>
      {action}
    </div>
  );
}

// ─── Page ───────────────────────────────────────

import { FC } from 'react';

export const ProfileV2View: FC<{}> = () => {
  const [viewOwn, setViewOwn] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(BANNER_PRESETS[0].gifUrl ?? null);
  const [effectId, setEffectId] = useState<string | null>(OWN_PROFILE.profileEffectId);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<KlipyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchGifs = useCallback(async (query: string) => {
    if (!KLIPY_KEY) return;
    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/search?q=${encodeURIComponent(query)}&per_page=12&customer_id=banner-picker&locale=de&format_filter=gif,webp`
        : `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/trending?per_page=12&customer_id=banner-picker&locale=de&format_filter=gif,webp`;
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.result && json.data?.data) setGifResults(json.data.data);
    } catch { /* ignore */ } finally { setGifLoading(false); }
  }, []);

  useEffect(() => {
    if (showBannerPicker) fetchGifs("");
  }, [showBannerPicker, fetchGifs]);

  useEffect(() => {
    if (!showBannerPicker) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(gifQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [gifQuery, showBannerPicker, fetchGifs]);

  const { pos, size, onDragStart, onResizeStart } = useDragResize({ x: 0, y: 0 }, { w: 480, h: 680 }, { w: 400, h: 520 }, { w: 620, h: 860 });

  const profile = viewOwn ? OWN_PROFILE : OTHER_PROFILE;
  const isOwnProfile = viewOwn;
  const resolvedBannerUrl = isOwnProfile ? bannerUrl : (BANNER_PRESETS.find((b) => b.id === profile.bannerId)?.gifUrl ?? null);
  const levelInfo = getLevel(profile.achievementPoints);
  const favGroup = profile.groups.find((g) => g.isFavourite);
  const showcase = isOwnProfile ? OWN_SHOWCASE : OTHER_SHOWCASE;
  const activeEffect = PROFILE_EFFECTS.find((e) => e.id === (isOwnProfile ? effectId : profile.profileEffectId));
  const cardBg = activeEffect ? "bg-muted/30" : "bg-muted/15";
  const cardBgLight = activeEffect ? "bg-muted/20" : "bg-muted/10";

  useEffect(() => { setExpandedGroupId(null); setRequestSent(false); setShowBannerPicker(false); setEditingNote(false); setGifQuery(""); if (!viewOwn) setEffectId(OTHER_PROFILE.profileEffectId); else setEffectId(OWN_PROFILE.profileEffectId); }, [viewOwn]);
  useEffect(() => { if (editingNote && noteRef.current) noteRef.current.focus(); }, [editingNote]);

  const friendStatusText = (() => {
    if (isOwnProfile) return "Das bist du";
    if (profile.isMyFriend) return "Freunde";
    if (requestSent || profile.requestSent) return "Anfrage gesendet";
    return null;
  })();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Page Header */}
        <div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Profil</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Discord-Style Profil Prototyp</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-[11px]">
                <button onClick={() => setViewOwn(true)} className={`px-3 py-1.5 transition-colors ${viewOwn ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>Eigenes Profil</button>
                <button onClick={() => setViewOwn(false)} className={`px-3 py-1.5 transition-colors ${!viewOwn ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>Fremdes Profil</button>
              </div>
              <Badge variant="outline" size="sm" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Prototyp</Badge>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--muted)/0.15) 0%, hsl(var(--background)) 70%)" }}>
          <div className={`group absolute flex flex-col rounded-xl border border-border/60 shadow-2xl overflow-hidden bg-card`} style={{ width: size.w, height: size.h, left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`, transform: `translate(-${size.w / 2}px, -${size.h / 2}px)` }}>

            {/* ── Banner ── */}
            <div className="shrink-0 relative h-[120px] cursor-grab active:cursor-grabbing select-none" onPointerDown={onDragStart} style={resolvedBannerUrl ? { backgroundImage: `url(${resolvedBannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))" }}>
              {isOwnProfile && (
                <Tooltip><TooltipTrigger asChild>
                  <button onClick={() => setShowBannerPicker(!showBannerPicker)} className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all" onPointerDown={(e) => e.stopPropagation()}>
                    <Pen className="w-3 h-3" />
                  </button>
                </TooltipTrigger><TooltipContent className="text-[10px]">Banner ändern</TooltipContent></Tooltip>
              )}
              <button className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-all" onPointerDown={(e) => e.stopPropagation()}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Banner Picker (KLIPY GIF Search) ── */}
            {showBannerPicker && (
              <div className="shrink-0 border-b border-border/20 bg-muted/5 relative z-10">
                <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="Search KLIPY"
                    className="flex-1 h-7 rounded-md bg-muted/20 border border-border/20 px-2.5 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <button onClick={() => { setBannerUrl(null); setShowBannerPicker(false); }} className="shrink-0 h-7 px-2 rounded-md bg-muted/20 border border-border/20 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                    Standard
                  </button>
                </div>
                <div className="px-3 pb-2.5 grid grid-cols-4 gap-1.5 max-h-[120px] overflow-y-auto scrollbar-none">
                  {gifLoading && gifResults.length === 0 && (
                    <div className="col-span-4 py-4 text-center text-[10px] text-muted-foreground/40">Laden...</div>
                  )}
                  {gifResults.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => { setBannerUrl(gif.file.md.gif.url); setShowBannerPicker(false); }}
                      className="aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary/60 transition-all cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <img src={gif.file.sm.webp.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" draggable={false} />
                    </button>
                  ))}
                </div>
                <div className="px-3 pb-1.5 text-[9px] text-muted-foreground/30 text-right">Powered by KLIPY</div>
              </div>
            )}

            {/* ── Avatar + Actions ── */}
            <div className="shrink-0 relative z-10 px-5">
              <div className="flex items-end justify-between -mt-[52px]">
                <div className="relative">
                  <div className={`w-[104px] h-[104px] rounded-full ring-[5px] overflow-hidden ring-card bg-card`}>
                    <img src={getAvatar(profile.figure)} alt={profile.username} className="w-full h-full" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center -8px" }} draggable={false} />
                  </div>
                  <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full ring-[3px] ring-card ${profile.online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                </div>
                <div className="flex items-center gap-1.5 pb-2">
                  {!isOwnProfile && !profile.isMyFriend && !requestSent && !profile.requestSent && (
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setRequestSent(true)}><UserPlus className="w-3.5 h-3.5" /></Button>
                    </TooltipTrigger><TooltipContent className="text-[10px]">Freund hinzufügen</TooltipContent></Tooltip>
                  )}
                  {!isOwnProfile && requestSent && (
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" disabled><UserPlus className="w-3.5 h-3.5" /></Button>
                    </TooltipTrigger><TooltipContent className="text-[10px]">Anfrage gesendet</TooltipContent></Tooltip>
                  )}
                  {!isOwnProfile && profile.isMyFriend && (
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full"><MessageCircle className="w-3.5 h-3.5" /></Button>
                    </TooltipTrigger><TooltipContent className="text-[10px]">Nachricht</TooltipContent></Tooltip>
                  )}
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full"><DoorOpen className="w-3.5 h-3.5" /></Button>
                  </TooltipTrigger><TooltipContent className="text-[10px]">Räume</TooltipContent></Tooltip>
                </div>
              </div>
            </div>

            {/* ── Profile Info + Roles + Featured Showcase ── */}
            <div className="shrink-0 relative z-10 px-5 pt-2 pb-3 flex gap-4">
              {/* Left: Name, motto, roles */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight">{profile.username}</span>
                  <span className="text-sm text-muted-foreground/40 font-mono">{profile.displayId}</span>
                  {favGroup && (
                    <Tooltip><TooltipTrigger asChild>
                      <img src={getGroupBadgeUrl(favGroup.badgeCode)} alt="" className="w-5 h-5 shrink-0" style={{ imageRendering: "pixelated" }} draggable={false} />
                    </TooltipTrigger><TooltipContent className="text-[10px]">{favGroup.name}</TooltipContent></Tooltip>
                  )}
                </div>
                {profile.motto && <p className="text-[12px] text-muted-foreground/50 italic mt-0.5">{profile.motto}</p>}
                {profile.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.roles.map((r) => {
                      const cfg = ROLE_PRESETS[r];
                      if (!cfg) return null;
                      return (
                        <span key={r} className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Featured 2x2 grid (badges + rares) */}
              <div className="shrink-0 grid grid-cols-2 gap-1.5 self-start">
                {profile.featuredBadges.map((badge) => (
                  <Tooltip key={badge}><TooltipTrigger asChild>
                    <div className={`w-12 h-12 rounded-lg ${cardBg} border border-border/15 flex items-center justify-center hover:bg-muted/30 hover:border-border/30 transition-all cursor-default group/slot relative`}>
                      <img src={getBadgeUrl(badge)} alt={badge} className="w-8 h-8" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />
                      {isOwnProfile && <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center"><Pen className="w-3 h-3 text-white/70" /></div>}
                    </div>
                  </TooltipTrigger><TooltipContent className="text-[10px]">{badge}</TooltipContent></Tooltip>
                ))}
                {profile.featuredRares.map((item) => (
                  <Tooltip key={item.itemName}><TooltipTrigger asChild>
                    <div className={`w-12 h-12 rounded-lg ${cardBg} border border-border/15 flex items-center justify-center hover:bg-muted/30 hover:border-border/30 transition-all cursor-default group/slot relative`}>
                      <img src={getFurniIcon(item.itemName)} alt={item.name} className="w-8 h-8" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />
                      {isOwnProfile && <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center"><Pen className="w-3 h-3 text-white/70" /></div>}
                    </div>
                  </TooltipTrigger><TooltipContent className="text-[10px]"><div className="flex items-center gap-1">{item.name} · <CurrencyIcon className="w-3 h-3" /><span className="text-amber-400 font-semibold">{item.value.toLocaleString("de-DE")}</span></div></TooltipContent></Tooltip>
                ))}
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <ScrollArea className="flex-1 min-h-0 relative z-10">
              <div className="px-5 pb-5 space-y-4">

                {/* ── Über mich ── */}
                <div className={`rounded-lg ${cardBg} border border-border/15 p-3.5`}>
                  <SectionHeader>Über mich</SectionHeader>
                  <p className="text-[12px] text-muted-foreground/70 leading-relaxed">{profile.aboutMe}</p>

                  <Separator className="my-3 bg-border/20" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                      <span className="text-muted-foreground/50">Bahhos-Mitglied seit</span>
                      <span className="text-muted-foreground/80 font-medium ml-auto">{profile.registration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                        <span className={`w-2 h-2 rounded-full ${profile.online ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                      </div>
                      <span className="text-muted-foreground/50">Status</span>
                      <span className="text-muted-foreground/80 font-medium ml-auto">{profile.online ? "Online" : profile.lastAccess}</span>
                    </div>
                  </div>

                  <Separator className="my-3 bg-border/20" />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium"><Users className="w-3 h-3" />{profile.friendsCount} Freunde</Badge>
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium"><Star className="w-3 h-3" />{profile.achievementPoints} Erfolge</Badge>
                    <Tooltip><TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1 font-medium">Lv.{levelInfo.level}</Badge>
                        <div className="w-12"><Progress value={levelInfo.progress} className="h-1" /></div>
                      </div>
                    </TooltipTrigger><TooltipContent className="text-[10px]">Level {levelInfo.level} — {Math.round(levelInfo.progress)}% zum nächsten</TooltipContent></Tooltip>
                    <div className="flex-1" />
                    {isOwnProfile && <Badge variant="outline" className="text-[10px] h-5 px-2 text-muted-foreground/50">Das bist du</Badge>}
                    {!isOwnProfile && profile.isMyFriend && <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 text-green-500/70 border-green-500/20"><Heart className="w-2.5 h-2.5 fill-current" />Freunde</Badge>}
                    {!isOwnProfile && !profile.isMyFriend && requestSent && <Badge variant="outline" className="text-[10px] h-5 px-2 text-muted-foreground/40">Anfrage gesendet</Badge>}
                  </div>
                </div>

                {/* ── Aktivität ── */}
                {profile.currentRoom && (
                  <div className={`rounded-md ${cardBgLight} border border-border/10 px-3 py-2.5 flex items-center gap-2.5`}>
                    <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <DoorOpen className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold">Gerade aktiv</div>
                      <div className="text-[12px] font-medium truncate mt-0.5">{profile.currentRoom}</div>
                    </div>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><DoorOpen className="w-3 h-3" /></Button>
                    </TooltipTrigger><TooltipContent className="text-[10px]">Raum betreten</TooltipContent></Tooltip>
                  </div>
                )}

                {/* ── Gemeinsame Freunde (nur fremdes Profil) ── */}
                {!isOwnProfile && (
                  <div>
                    <SectionHeader>Gemeinsame Freunde — {MUTUAL_FRIENDS.length}</SectionHeader>
                    <div className={`flex items-center gap-3 rounded-md ${cardBgLight} border border-border/10 px-3 py-2.5`}>
                      <div className="flex -space-x-2">
                        {MUTUAL_FRIENDS.map((f) => (
                          <Tooltip key={f.name}><TooltipTrigger asChild>
                            <img src={getAvatarHead(f.figure)} alt={f.name} className="w-8 h-8 rounded-full border-2 border-card bg-muted/20 shrink-0" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                          </TooltipTrigger><TooltipContent className="text-[10px]">{f.name}</TooltipContent></Tooltip>
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground/50">{MUTUAL_FRIENDS.map((f) => f.name).join(", ")}</span>
                    </div>
                  </div>
                )}

                {/* ── Notiz (nur fremdes Profil) ── */}
                {!isOwnProfile && (
                  <div>
                    <SectionHeader action={
                      <button onClick={() => { setEditingNote(true); }} className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                        <Pen className="w-3 h-3" />
                      </button>
                    }>Notiz</SectionHeader>
                    {editingNote ? (
                      <textarea
                        ref={noteRef}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={() => setEditingNote(false)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setEditingNote(false); } }}
                        placeholder="Klicke um eine Notiz hinzuzufügen..."
                        className={`w-full rounded-md ${cardBgLight} border border-border/20 px-3 py-2 text-[11px] text-muted-foreground/70 placeholder:text-muted-foreground/25 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[60px]`}
                        rows={3}
                      />
                    ) : (
                      <button onClick={() => setEditingNote(true)} className={`w-full text-left rounded-md ${cardBgLight} border border-border/10 px-3 py-2 hover:bg-muted/20 transition-colors min-h-[36px]`}>
                        <span className={`text-[11px] ${note ? "text-muted-foreground/60" : "text-muted-foreground/25 italic"}`}>
                          {note || "Klicke um eine Notiz hinzuzufügen..."}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* ── Showcase ── */}
                <div>
                  <SectionHeader action={isOwnProfile ? (
                    <button className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"><Pen className="w-3 h-3" /></button>
                  ) : undefined}>Showcase</SectionHeader>
                  <div className="grid grid-cols-2 gap-1.5">
                    {showcase.map((item) => (
                      <div key={item.itemName} className={`flex items-center gap-2 rounded-md ${cardBgLight} border border-border/10 px-2.5 py-2 hover:bg-muted/20 transition-colors`}>
                        <img src={getFurniIcon(item.itemName)} alt={item.name} className="w-8 h-8 shrink-0" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium truncate">{item.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CurrencyIcon className="w-3 h-3" />
                            <span className="text-[10px] text-amber-400/80 font-semibold tabular-nums">{item.value.toLocaleString("de-DE")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Badges ── */}
                <div>
                  <SectionHeader>Badges</SectionHeader>
                  {profile.badges.length > 0 ? (
                    <div className="grid grid-cols-8 gap-1">
                      {profile.badges.map((badge) => (
                        <Tooltip key={badge}><TooltipTrigger asChild>
                          <div className={`aspect-square rounded-md ${cardBg} border border-border/15 flex items-center justify-center hover:bg-muted/40 hover:border-border/30 transition-all cursor-default`}>
                            <img src={getBadgeUrl(badge)} alt={badge} className="w-7 h-7" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />
                          </div>
                        </TooltipTrigger><TooltipContent className="text-[10px]">{badge}</TooltipContent></Tooltip>
                      ))}
                    </div>
                  ) : (
                    <div className={`rounded-lg ${cardBgLight} border border-border/10 py-5 text-center text-[11px] text-muted-foreground/30`}>Keine Badges</div>
                  )}
                </div>

                {/* ── Beziehungen ── */}
                <div>
                  <SectionHeader>Beziehungen</SectionHeader>
                  <div className="space-y-1">
                    {profile.relationships.map((rel) => {
                      const c = REL_CONFIG[rel.type];
                      const Icon = c.icon;
                      const hasData = rel.friendCount > 0;
                      return (
                        <div key={rel.type} className={`flex items-center gap-2.5 rounded-md ${cardBgLight} border border-border/10 px-2.5 py-2 hover:bg-muted/20 transition-colors`}>
                          <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center shrink-0`}><Icon className={`w-3.5 h-3.5 ${c.color}`} /></div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[12px] font-medium ${hasData ? "" : "text-muted-foreground/30"}`}>{hasData ? rel.friendName : "Noch niemand"}</span>
                            {rel.friendCount > 1 && <span className="text-[10px] text-muted-foreground/30 ml-1.5">+{rel.friendCount - 1}</span>}
                          </div>
                          {hasData && rel.friendFigure && (
                            <img src={getAvatarHead(rel.friendFigure)} alt="" className="w-6 h-6 rounded-full border border-border/20 bg-muted/20 shrink-0" style={{ imageRendering: "pixelated", objectFit: "cover", objectPosition: "center top" }} draggable={false} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Gruppen ── */}
                <div>
                  <SectionHeader>Gruppen</SectionHeader>
                  {profile.groups.length > 0 ? (
                    <div className="space-y-1.5">
                      {profile.groups.map((g) => (
                        <div key={g.id}>
                          <button onClick={() => setExpandedGroupId(expandedGroupId === g.id ? null : g.id)} className={`w-full flex items-center gap-2.5 rounded-md ${cardBgLight} border border-border/10 px-2.5 py-2 hover:bg-muted/20 transition-colors text-left`}>
                            <img src={getGroupBadgeUrl(g.badgeCode)} alt={g.name} className="w-8 h-8 shrink-0" style={{ imageRendering: "pixelated" }} draggable={false} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-medium truncate">{g.name}</span>
                                {g.isFavourite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground/30">{g.memberCount} Mitglieder</span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/30 shrink-0 transition-transform ${expandedGroupId === g.id ? "rotate-90" : ""}`} />
                          </button>
                          {expandedGroupId === g.id && (
                            <div className="ml-[42px] mt-1 rounded-md bg-muted/5 border border-border/10 px-3 py-2.5">
                              <p className="text-[11px] text-muted-foreground/50 leading-relaxed">{g.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`rounded-lg ${cardBgLight} border border-border/10 py-5 text-center text-[11px] text-muted-foreground/30 flex flex-col items-center gap-1.5`}>
                      <Users className="w-5 h-5" />Keine Gruppen
                    </div>
                  )}
                </div>

              </div>
            </ScrollArea>

            {/* ── Profile Effect Overlay ── */}
            {activeEffect && <ProfileEffectRenderer key={activeEffect.id} effect={activeEffect} />}

            {/* Resize Handle */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-end justify-end" onPointerDown={onResizeStart}>
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/20"><path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
            </div>
          </div>

          {/* ── Effect Picker (unter der Card) ── */}
          <div className="absolute bottom-4 left-4 right-4 z-30 rounded-xl border border-border/40 bg-card/90 backdrop-blur-md px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0"><Sparkles className="w-3 h-3 inline -mt-0.5" /> Effekt</span>
              <Tooltip><TooltipTrigger asChild>
                <button onClick={() => setEffectId(null)} className={`shrink-0 w-8 h-8 rounded-md border-2 transition-all flex items-center justify-center ${!effectId ? "border-primary ring-1 ring-primary/30" : "border-border/30 hover:border-border/60"} bg-muted/20`}>
                  <X className="w-3 h-3 text-muted-foreground/50" />
                </button>
              </TooltipTrigger><TooltipContent className="text-[10px]">Kein Effekt</TooltipContent></Tooltip>
              {PROFILE_EFFECTS.map((pe) => (
                <Tooltip key={pe.id}><TooltipTrigger asChild>
                  <button onClick={() => setEffectId(pe.id)} className={`shrink-0 w-8 h-8 rounded-md overflow-hidden border-2 transition-all ${effectId === pe.id ? "border-purple-500 ring-1 ring-purple-500/30 scale-110" : "border-transparent hover:border-border/60"}`}>
                    <img src={pe.thumbnailSrc} alt={pe.title} className="w-full h-full object-cover" draggable={false} />
                  </button>
                </TooltipTrigger><TooltipContent className="text-[10px]">{pe.title}</TooltipContent></Tooltip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
