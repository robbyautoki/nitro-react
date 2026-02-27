
import { useState } from "react";
import { Badge } from "@/components/ui/reui-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameFooter,
} from "@/components/ui/frame";
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, X, Gift, ChevronRight } from "lucide-react";

import { GetConfiguration } from '@/api';
const ASSETS_URL = () => {
  try { const v = GetConfiguration<string>('asset.url', ''); if (v && !v.includes('localhost')) return v; } catch {}
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://assets.bahhos.de';
};

function getCategoryImage(code: string, active: boolean) {
  return `${ASSETS_URL()}/c_images/Quests/achcategory_${code}_${active ? "active" : "inactive"}.png`;
}

function getBadgeImage(badgeCode: string) {
  return `${ASSETS_URL()}/c_images/album1584/${badgeCode}.gif`;
}

function PixelImg({
  src,
  alt,
  className,
  size = 48,
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        objectFit: "contain",
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.opacity = "0.2";
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════

interface MockAchievement {
  id: number;
  name: string;
  description: string;
  badgeCode: string;
  level: number;
  maxLevel: number;
  currentXP: number;
  requiredXP: number;
  rewardAmount: number;
  rewardType: string;
  completed: boolean;
  unseen: boolean;
}

interface MockCategory {
  code: string;
  label: string;
  progress: number;
  maxProgress: number;
  unseen: number;
  achievements: MockAchievement[];
}

const CATEGORIES: MockCategory[] = [
  {
    code: "explore",
    label: "Entdecken",
    progress: 8,
    maxProgress: 15,
    unseen: 2,
    achievements: [
      { id: 1, name: "Erste Schritte", description: "Betrete das Hotel zum ersten Mal", badgeCode: "ACH_AllTimeHotelPresence5", level: 5, maxLevel: 20, currentXP: 100, requiredXP: 100, rewardAmount: 10, rewardType: "pixels", completed: true, unseen: false },
      { id: 2, name: "Weltenbummler", description: "Besuche 100 verschiedene Räume", badgeCode: "ACH_AllTimeHotelPresence3", level: 3, maxLevel: 10, currentXP: 67, requiredXP: 100, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: true },
      { id: 3, name: "Navigator-Profi", description: "Nutze den Navigator 50 Mal", badgeCode: "ACH_AllTimeHotelPresence2", level: 2, maxLevel: 5, currentXP: 30, requiredXP: 50, rewardAmount: 5, rewardType: "pixels", completed: false, unseen: true },
      { id: 4, name: "Hotel-Veteran", description: "Sei 365 Tage im Hotel registriert", badgeCode: "ACH_AllTimeHotelPresence1", level: 0, maxLevel: 10, currentXP: 0, requiredXP: 365, rewardAmount: 50, rewardType: "pixels", completed: false, unseen: false },
      { id: 29, name: "Stammgast", description: "Besuche das Hotel 30 Tage in Folge", badgeCode: "ACH_AllTimeHotelPresence8", level: 8, maxLevel: 20, currentXP: 30, requiredXP: 30, rewardAmount: 25, rewardType: "pixels", completed: true, unseen: false },
      { id: 30, name: "Entdecker", description: "Besuche alle öffentlichen Räume", badgeCode: "ACH_AllTimeHotelPresence10", level: 10, maxLevel: 20, currentXP: 15, requiredXP: 20, rewardAmount: 40, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "identity",
    label: "Identität",
    progress: 5,
    maxProgress: 12,
    unseen: 0,
    achievements: [
      { id: 5, name: "Modebewusst", description: "Ändere dein Outfit 10 Mal", badgeCode: "ACH_AvatarLooks1", level: 4, maxLevel: 5, currentXP: 8, requiredXP: 10, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
      { id: 6, name: "Foto-Profi", description: "Mache 10 Fotos mit der Kamera", badgeCode: "ACH_CameraPhotoCount5", level: 5, maxLevel: 10, currentXP: 10, requiredXP: 10, rewardAmount: 15, rewardType: "pixels", completed: true, unseen: false },
      { id: 7, name: "Profilbild", description: "Mache ein Foto mit der Kamera", badgeCode: "ACH_CameraPhotoCount1", level: 1, maxLevel: 3, currentXP: 1, requiredXP: 5, rewardAmount: 5, rewardType: "pixels", completed: false, unseen: false },
      { id: 31, name: "Selfie-König", description: "Mache 50 Fotos mit der Kamera", badgeCode: "ACH_CameraPhotoCount8", level: 3, maxLevel: 10, currentXP: 28, requiredXP: 50, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
      { id: 32, name: "Stilikone", description: "Trage 20 verschiedene Outfits", badgeCode: "ACH_CameraPhotoCount3", level: 2, maxLevel: 5, currentXP: 12, requiredXP: 20, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "social",
    label: "Soziales",
    progress: 11,
    maxProgress: 18,
    unseen: 1,
    achievements: [
      { id: 8, name: "Freundeskreis", description: "Habe 10 Freunde gleichzeitig", badgeCode: "ACH_FriendListSize5", level: 3, maxLevel: 14, currentXP: 10, requiredXP: 25, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
      { id: 9, name: "Geschenke-Geber", description: "Verschenke 100 Geschenke", badgeCode: "ACH_GiftGiver5", level: 5, maxLevel: 15, currentXP: 78, requiredXP: 100, rewardAmount: 30, rewardType: "pixels", completed: false, unseen: true },
      { id: 10, name: "Forum-Aktiv", description: "Schreibe 50 Forum-Beiträge", badgeCode: "ACH_Forum3", level: 3, maxLevel: 10, currentXP: 30, requiredXP: 50, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
      { id: 11, name: "Bester Freund", description: "Erreiche Freundschaftslevel 10", badgeCode: "ACH_FriendListSize10", level: 10, maxLevel: 14, currentXP: 50, requiredXP: 50, rewardAmount: 50, rewardType: "pixels", completed: true, unseen: false },
      { id: 33, name: "Großzügig", description: "Verschenke 50 Geschenke", badgeCode: "ACH_GiftGiver3", level: 3, maxLevel: 15, currentXP: 50, requiredXP: 50, rewardAmount: 15, rewardType: "pixels", completed: true, unseen: false },
      { id: 34, name: "Netzwerker", description: "Habe 50 Freunde gleichzeitig", badgeCode: "ACH_FriendListSize8", level: 0, maxLevel: 14, currentXP: 0, requiredXP: 50, rewardAmount: 40, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "music",
    label: "Musik",
    progress: 2,
    maxProgress: 8,
    unseen: 0,
    achievements: [
      { id: 12, name: "DJ", description: "Spiele 10 Songs", badgeCode: "ACH_Citizenship1", level: 2, maxLevel: 5, currentXP: 4, requiredXP: 10, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "games",
    label: "Spiele",
    progress: 4,
    maxProgress: 10,
    unseen: 0,
    achievements: [
      { id: 13, name: "Spieler", description: "Gewinne 10 Spiele", badgeCode: "ACH_GamePlayed5", level: 5, maxLevel: 10, currentXP: 6, requiredXP: 10, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
      { id: 14, name: "Spielsüchtig", description: "Spiele 100 Spiele", badgeCode: "ACH_GamePlayed3", level: 3, maxLevel: 10, currentXP: 22, requiredXP: 100, rewardAmount: 50, rewardType: "credits", completed: false, unseen: false },
      { id: 35, name: "Profi-Gamer", description: "Gewinne 50 Spiele", badgeCode: "ACH_GamePlayed8", level: 0, maxLevel: 10, currentXP: 0, requiredXP: 50, rewardAmount: 30, rewardType: "pixels", completed: false, unseen: false },
      { id: 36, name: "Anfänger", description: "Spiele dein erstes Spiel", badgeCode: "ACH_GamePlayed1", level: 1, maxLevel: 10, currentXP: 1, requiredXP: 1, rewardAmount: 5, rewardType: "pixels", completed: true, unseen: false },
    ],
  },
  {
    code: "room_builder",
    label: "Raumbau",
    progress: 6,
    maxProgress: 14,
    unseen: 0,
    achievements: [
      { id: 15, name: "Architekt", description: "Erstelle 5 Räume", badgeCode: "ACH_Contributer1", level: 3, maxLevel: 5, currentXP: 3, requiredXP: 5, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
      { id: 16, name: "Einrichter", description: "Platziere 100 Möbel", badgeCode: "ACH_CrossTrainer1", level: 5, maxLevel: 10, currentXP: 87, requiredXP: 100, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "pets",
    label: "Haustiere",
    progress: 4,
    maxProgress: 10,
    unseen: 0,
    achievements: [
      { id: 17, name: "Tierfreund", description: "Kaufe dein erstes Haustier", badgeCode: "ACH_PetBreeder1", level: 1, maxLevel: 1, currentXP: 1, requiredXP: 1, rewardAmount: 10, rewardType: "pixels", completed: true, unseen: false },
      { id: 18, name: "Züchter", description: "Bringe ein Haustier auf Level 10", badgeCode: "ACH_DogBreeder1", level: 2, maxLevel: 5, currentXP: 7, requiredXP: 10, rewardAmount: 25, rewardType: "pixels", completed: false, unseen: false },
      { id: 37, name: "Katzenfreund", description: "Adoptiere eine Katze", badgeCode: "ACH_CatBreeder1", level: 1, maxLevel: 3, currentXP: 1, requiredXP: 1, rewardAmount: 10, rewardType: "pixels", completed: true, unseen: false },
    ],
  },
  {
    code: "tools",
    label: "Werkzeuge",
    progress: 1,
    maxProgress: 6,
    unseen: 0,
    achievements: [
      { id: 19, name: "E-Mail verifiziert", description: "Verifiziere deine E-Mail-Adresse", badgeCode: "ACH_EmailVerification1", level: 1, maxLevel: 1, currentXP: 1, requiredXP: 1, rewardAmount: 20, rewardType: "pixels", completed: true, unseen: false },
    ],
  },
  {
    code: "trading",
    label: "Handel",
    progress: 3,
    maxProgress: 8,
    unseen: 0,
    achievements: [
      { id: 20, name: "Händler", description: "Führe 50 Trades durch", badgeCode: "ACH_Bazaar1", level: 3, maxLevel: 5, currentXP: 30, requiredXP: 50, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "chat",
    label: "Chat",
    progress: 5,
    maxProgress: 10,
    unseen: 0,
    achievements: [
      { id: 21, name: "Chatmeister", description: "Sende 1.000 Nachrichten", badgeCode: "ACH_Forum5", level: 5, maxLevel: 10, currentXP: 820, requiredXP: 1000, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "creativity",
    label: "Kreativität",
    progress: 2,
    maxProgress: 7,
    unseen: 0,
    achievements: [
      { id: 22, name: "Künstler", description: "Erstelle 10 kreative Räume", badgeCode: "ACH_CrystalCracker1", level: 2, maxLevel: 5, currentXP: 5, requiredXP: 10, rewardAmount: 15, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "seasonal",
    label: "Saisonal",
    progress: 4,
    maxProgress: 12,
    unseen: 0,
    achievements: [
      { id: 23, name: "Weihnachts-Event", description: "Nimm am Weihnachts-Event teil", badgeCode: "ACH_ChristmasHat1", level: 1, maxLevel: 3, currentXP: 1, requiredXP: 3, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
      { id: 24, name: "Oster-Sammler", description: "Sammle 20 Ostereier", badgeCode: "ACH_EggCracker1", level: 3, maxLevel: 5, currentXP: 15, requiredXP: 20, rewardAmount: 25, rewardType: "pixels", completed: false, unseen: false },
      { id: 38, name: "Oster-Meister", description: "Sammle alle Ostereier", badgeCode: "ACH_EggMaster1", level: 1, maxLevel: 3, currentXP: 5, requiredXP: 50, rewardAmount: 50, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "vip",
    label: "VIP",
    progress: 2,
    maxProgress: 5,
    unseen: 0,
    achievements: [
      { id: 25, name: "VIP-Mitglied", description: "Werde VIP-Mitglied", badgeCode: "ACH_BasicClub1", level: 2, maxLevel: 5, currentXP: 60, requiredXP: 90, rewardAmount: 50, rewardType: "credits", completed: false, unseen: false },
    ],
  },
  {
    code: "habboon",
    label: "Habboon",
    progress: 1,
    maxProgress: 4,
    unseen: 0,
    achievements: [
      { id: 26, name: "Habboon-Held", description: "Schließe die Habboon-Quests ab", badgeCode: "ACH_Atcg1", level: 1, maxLevel: 4, currentXP: 2, requiredXP: 10, rewardAmount: 10, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
  {
    code: "battleball",
    label: "Battleball",
    progress: 3,
    maxProgress: 8,
    unseen: 0,
    achievements: [
      { id: 27, name: "Battleball-Spieler", description: "Spiele 10 Runden Battleball", badgeCode: "ACH_BattleBallPlayer5", level: 3, maxLevel: 20, currentXP: 8, requiredXP: 10, rewardAmount: 15, rewardType: "pixels", completed: false, unseen: false },
      { id: 28, name: "Battleball-Sieger", description: "Gewinne 5 Battleball-Runden", badgeCode: "ACH_BattleBallWinner3", level: 2, maxLevel: 10, currentXP: 3, requiredXP: 5, rewardAmount: 30, rewardType: "pixels", completed: false, unseen: false },
      { id: 39, name: "Battleball-Quest", description: "Schließe eine Battleball-Quest ab", badgeCode: "ACH_BattleBallQuestCompleted1", level: 1, maxLevel: 10, currentXP: 1, requiredXP: 1, rewardAmount: 10, rewardType: "pixels", completed: true, unseen: false },
      { id: 40, name: "Flächendeckend", description: "Verschließe 100 Felder", badgeCode: "ACH_BattleBallTilesLocked3", level: 3, maxLevel: 20, currentXP: 55, requiredXP: 100, rewardAmount: 20, rewardType: "pixels", completed: false, unseen: false },
    ],
  },
];

const TOTAL_PROGRESS = CATEGORIES.reduce((s, c) => s + c.progress, 0);
const TOTAL_MAX = CATEGORIES.reduce((s, c) => s + c.maxProgress, 0);
const ACHIEVEMENT_SCORE = 1847;

function SectionLabel({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Badge variant="info" size="sm">Preview</Badge>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — HAUPTPANEL (Split-Layout)
// ═══════════════════════════════════════════════════════════════

function AchievementMainPanel() {
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].code);
  const category = CATEGORIES.find((c) => c.code === selectedCat)!;
  const [selectedAchId, setSelectedAchId] = useState<number>(
    category.achievements[0]?.id ?? 0
  );

  const handleSelectCategory = (code: string) => {
    setSelectedCat(code);
    const cat = CATEGORIES.find((c) => c.code === code)!;
    setSelectedAchId(cat.achievements[0]?.id ?? 0);
  };

  const selectedAch = category.achievements.find((a) => a.id === selectedAchId);

  return (
    <Frame className="max-w-2xl">
      <FramePanel className="!p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <PixelImg
              src={`${ASSETS_URL()}/c_images/Quests/ach_receive_star.png`}
              alt="star"
              size={22}
            />
            <span className="text-sm font-semibold">Achievements</span>
            <Badge variant="outline" size="xs">
              {TOTAL_PROGRESS}/{TOTAL_MAX}
            </Badge>
          </div>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-3.5" />
          </button>
        </div>

        {/* Split body */}
        <div className="flex min-h-[420px]">
          {/* Left — Category sidebar */}
          <div className="w-[180px] shrink-0 border-r bg-muted/20 overflow-y-auto">
            <ItemGroup className="py-1">
              {CATEGORIES.map((cat) => {
                const isActive = cat.code === selectedCat;
                const pct =
                  cat.maxProgress > 0
                    ? Math.round((cat.progress / cat.maxProgress) * 100)
                    : 0;
                return (
                  <button
                    key={cat.code}
                    onClick={() => handleSelectCategory(cat.code)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors relative ${
                      isActive
                        ? "bg-accent/60"
                        : "hover:bg-accent/30"
                    }`}
                  >
                    {cat.unseen > 0 && (
                      <span className="absolute top-1.5 right-2 size-2 rounded-full bg-destructive" />
                    )}
                    <PixelImg
                      src={getCategoryImage(
                        cat.code,
                        cat.progress > 0
                      )}
                      alt={cat.label}
                      size={36}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {cat.label}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Progress value={pct} className="h-1 flex-1" />
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {cat.progress}/{cat.maxProgress}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </ItemGroup>
          </div>

          {/* Right — Achievements */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Category header */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b bg-muted/10">
              <PixelImg
                src={getCategoryImage(category.code, true)}
                alt={category.label}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{category.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {category.progress} / {category.maxProgress} abgeschlossen
                </div>
              </div>
              {category.unseen > 0 && (
                <Badge variant="destructive" size="xs">
                  {category.unseen} Neu
                </Badge>
              )}
            </div>

            {/* Badge Grid */}
            <div className="p-3 border-b">
              <div className="grid grid-cols-6 gap-1.5">
                {category.achievements.map((ach) => {
                  const started = ach.completed || ach.level > 0;
                  const isSelected = ach.id === selectedAchId;
                  return (
                    <button
                      key={ach.id}
                      onClick={() => setSelectedAchId(ach.id)}
                      className={`relative flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-transparent hover:border-border hover:bg-accent/40"
                      }`}
                    >
                      {ach.unseen && (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive z-10 ring-2 ring-background" />
                      )}
                      <div className="flex flex-col items-center gap-0.5">
                        <PixelImg
                          src={getBadgeImage(ach.badgeCode)}
                          alt={ach.name}
                          size={38}
                          className={
                            !started ? "grayscale opacity-30" : ""
                          }
                        />
                        <span className="text-[8px] text-muted-foreground font-medium">
                          Lv.{ach.level}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Achievement Detail */}
            <div className="flex-1 p-3">
              {selectedAch && <AchievementDetail achievement={selectedAch} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20">
          <div className="flex items-center gap-2 text-xs">
            <PixelImg
              src={`${ASSETS_URL()}/c_images/Quests/ach_receive_star.png`}
              alt="star"
              size={16}
            />
            <span className="text-muted-foreground">Score:</span>
            <span className="font-bold text-amber-500">
              {ACHIEVEMENT_SCORE}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Progress
              value={Math.round((TOTAL_PROGRESS / TOTAL_MAX) * 100)}
              className="w-24 h-1.5"
            />
            <span className="text-[11px] text-muted-foreground">
              {TOTAL_PROGRESS}/{TOTAL_MAX}
            </span>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function AchievementDetail({ achievement }: { achievement: MockAchievement }) {
  const started = achievement.completed || achievement.level > 0;
  const xpPct =
    achievement.requiredXP > 0
      ? Math.round(
          (achievement.currentXP / achievement.requiredXP) * 100
        )
      : 0;

  return (
    <Item variant="muted" size="sm" className="rounded-xl !items-start">
      <ItemMedia className="!self-start">
        <div className="size-16 rounded-lg bg-background border flex items-center justify-center shrink-0">
          <PixelImg
            src={getBadgeImage(achievement.badgeCode)}
            alt={achievement.name}
            size={52}
            className={!started ? "grayscale opacity-30" : ""}
          />
        </div>
      </ItemMedia>
      <ItemContent className="gap-1.5">
        <div className="flex items-center gap-2">
          <ItemTitle className="!text-sm">{achievement.name}</ItemTitle>
          <Badge
            variant={achievement.completed ? "success" : "outline"}
            size="xs"
          >
            Lv. {achievement.level}/{achievement.maxLevel}
          </Badge>
        </div>
        <ItemDescription className="!text-xs !line-clamp-1">
          {achievement.description}
        </ItemDescription>

        {achievement.rewardAmount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Gift className="size-3 text-amber-500" />
            <span className="text-muted-foreground">Belohnung:</span>
            <span className="font-semibold text-foreground">
              {achievement.rewardAmount}{" "}
              {achievement.rewardType === "credits" ? "Credits" : "Pixels"}
            </span>
          </div>
        )}

        {!achievement.completed && achievement.requiredXP > 0 && (
          <div className="space-y-1 mt-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-semibold text-foreground">
                {achievement.currentXP} / {achievement.requiredXP}
              </span>
            </div>
            <Progress value={xpPct} className="h-1.5" />
          </div>
        )}

        {achievement.completed && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <img
              src={`${ASSETS_URL()}/c_images/Quests/category_completed.png`}
              alt="done"
              style={{
                width: 14,
                height: 14,
                imageRendering: "pixelated",
              }}
              draggable={false}
            />
            <Badge variant="success-light" size="xs">
              Abgeschlossen
            </Badge>
          </div>
        )}
      </ItemContent>
    </Item>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — LEVEL & PRESTIGE BAR
// ═══════════════════════════════════════════════════════════════

function LevelPrestigePreview() {
  return (
    <TooltipProvider>
      <Frame className="max-w-sm">
        <FramePanel className="!p-0">
          <div className="flex items-center gap-4 px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-400">
                      P1
                    </span>
                    <Star className="size-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">
                      24
                    </span>
                  </div>
                  <Progress value={68} className="w-20 h-1.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-purple-400">
                    Prestige 1
                  </span>
                  <span className="font-medium text-amber-400">
                    Level 24
                  </span>
                  <span className="text-muted-foreground">
                    1.847 / 2.500 XP
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5" />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PixelImg
                src={`${ASSETS_URL()}/c_images/Quests/ach_receive_star.png`}
                alt="star"
                size={18}
              />
              <span className="font-semibold text-foreground">
                {ACHIEVEMENT_SCORE}
              </span>
              <span>Score</span>
            </div>
          </div>
        </FramePanel>
      </Frame>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — NOTIFICATIONS & UNLOCK
// ═══════════════════════════════════════════════════════════════

function AchievementBubblePreview() {
  return (
    <Frame className="max-w-xs">
      <FramePanel className="!p-0">
        <Item size="sm">
          <ItemMedia>
            <PixelImg
              src={getBadgeImage("ACH_AllTimeHotelPresence5")}
              alt="badge"
              size={32}
            />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="!text-xs">
              Achievement freigeschaltet!
            </ItemTitle>
            <ItemDescription className="!text-[11px]">
              Erste Schritte — Stufe 5 erreicht
            </ItemDescription>
          </ItemContent>
          <button className="p-0.5 rounded text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </Item>
      </FramePanel>
    </Frame>
  );
}

function AchievementUnlockDialog() {
  return (
    <Frame className="max-w-sm">
      <FramePanel className="!p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
          <span className="text-sm font-semibold">Achievement freigeschaltet!</span>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <PixelImg
                src={`${ASSETS_URL()}/c_images/Quests/ach_receive_star.png`}
                alt="star-bg"
                size={120}
              />
            </div>
            <div className="relative size-24 rounded-2xl bg-muted/50 border-2 border-amber-500/30 flex items-center justify-center">
              <PixelImg
                src={getBadgeImage("ACH_AllTimeHotelPresence5")}
                alt="badge"
                size={72}
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-base font-bold text-foreground">
              Erste Schritte
            </div>
            <div className="text-sm text-muted-foreground">
              Stufe 5 erreicht
            </div>
            <Badge variant="success" size="sm">
              Lv. 5/20
            </Badge>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Gift className="size-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">
              +10 Pixels erhalten
            </span>
          </div>

          <Button size="sm" className="w-full">
            Weiter
          </Button>
        </div>
      </FramePanel>
    </Frame>
  );
}

function ScoreSummaryPreview() {
  return (
    <Frame className="max-w-md">
      <FramePanel className="!p-0">
        <div className="px-4 py-2.5 border-b bg-muted/30">
          <div className="text-sm font-semibold">Achievement-Übersicht</div>
        </div>
        <div className="p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center p-3 rounded-xl border bg-muted/30">
              <span className="text-xl font-bold text-amber-500">
                {ACHIEVEMENT_SCORE}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Score
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border bg-muted/30">
              <span className="text-xl font-bold text-emerald-500">
                {TOTAL_PROGRESS}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Abgeschlossen
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border bg-muted/30">
              <span className="text-xl font-bold text-foreground">
                {TOTAL_MAX}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Gesamt
              </span>
            </div>
          </div>

          {/* Categories list */}
          <ItemGroup className="rounded-lg border overflow-hidden">
            {CATEGORIES.map((cat, i) => {
              const pct =
                cat.maxProgress > 0
                  ? Math.round(
                      (cat.progress / cat.maxProgress) * 100
                    )
                  : 0;
              const isActive = cat.progress > 0;
              return (
                <div key={cat.code}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <PixelImg
                      src={getCategoryImage(cat.code, isActive)}
                      alt={cat.label}
                      size={28}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {cat.progress}/{cat.maxProgress}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1" />
                    </div>
                    {pct === 100 && (
                      <img
                        src={`${ASSETS_URL()}/c_images/Quests/category_completed.png`}
                        alt="done"
                        className="shrink-0"
                        style={{
                          width: 16,
                          height: 16,
                          imageRendering: "pixelated",
                        }}
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </ItemGroup>
        </div>
      </FramePanel>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

import { FC } from 'react';

export const AchievementsV2View: FC<{}> = () => {
  const totalAch = CATEGORIES.reduce(
    (s, c) => s + c.achievements.length,
    0
  );

  return (
    <div className="container max-w-4xl py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Achievements Prototyp
        </h1>
        <p className="text-muted-foreground mt-1">
          Enterprise reUI Redesign — {CATEGORIES.length} Kategorien,{" "}
          {totalAch} Achievements, echte Ingame-Bilder
        </p>
      </div>

      <Separator />

      {/* SECTION 1 — Main Panel */}
      <div>
        <SectionLabel
          label="Achievement-Panel (Split-Layout)"
          description="Kategorie-Sidebar links mit echten Pixel-Art-Bildern, Badge-Grid + Detail rechts. Klicke auf Kategorien und Badges."
        />
        <AchievementMainPanel />
      </div>

      <Separator />

      {/* SECTION 2 — Level Bar */}
      <div>
        <SectionLabel
          label="Level & Prestige Bar"
          description="Prestige, Level, XP-Fortschritt und Achievement-Score in der Floatbar"
        />
        <LevelPrestigePreview />
      </div>

      <Separator />

      {/* SECTION 3 — Notifications & Unlock */}
      <div className="space-y-8">
        <div>
          <SectionLabel
            label="Achievement Bubble Notification"
            description="Kleine Bubble-Notification oben rechts bei Achievement-Unlock (auto-dismiss)"
          />
          <AchievementBubblePreview />
        </div>

        <div>
          <SectionLabel
            label="Achievement Unlock Dialog"
            description="Großer Glückwunsch-Dialog bei Achievement-Freischaltung mit Badge, Stufe und Belohnung"
          />
          <AchievementUnlockDialog />
        </div>

        <div>
          <SectionLabel
            label="Achievement Score Summary"
            description="Gesamtübersicht aller 15 Kategorien mit Fortschrittsbalken und Score"
          />
          <ScoreSummaryPreview />
        </div>
      </div>
    </div>
  );
}
