import { FriendlyTime, HabboClubLevelEnum, RateFlatMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetRoomEngine, GetSessionDataManager, LocalizeFormattedNumber, LocalizeShortNumber, LocalizeText, SendMessageComposer, getAuthHeaders } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { useAchievements, useNavigator, usePurse, useRoom } from '../../hooks';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Settings, Sparkles, Gift,
  Info, ZoomIn, ZoomOut, MessageSquareDashed, ThumbsUp,
} from 'lucide-react';

function CurrencyIcon({ type }: { type: string }) {
  const assetsUrl = GetConfiguration<string>('currency.asset.icon.url', '').replace('%type%', type);
  return <img src={assetsUrl} alt={type} className="w-4 h-4" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

function CatalogIcon({ iconId }: { iconId: number }) {
  const imageUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
  return <img src={`${imageUrl}catalogue/icon_${iconId}.png`} alt="" className="w-5 h-5" style={{ imageRendering: "pixelated", objectFit: "contain" }} draggable={false} />;
}

const TOOL_ICONS: { iconId: number; label: string; link: string }[] = [
  { iconId: 69, label: "Marktplatz", link: "marketplace/toggle" },
  { iconId: 71, label: "Preisliste", link: "pricelist/toggle" },
  { iconId: 1004, label: "Werkstatt", link: "workshop/toggle" },
  { iconId: 221, label: "Sets", link: "sets/toggle" },
];


const LEVEL_STATS = [
  { emoji: "🕐", label: "Spielzeit", value: "142 Stunden" },
  { emoji: "💬", label: "Nachrichten", value: "8.430" },
  { emoji: "🏠", label: "Räume besucht", value: "1.240" },
  { emoji: "⭐", label: "Respekt", value: "347" },
];

function LevelPopover() {
  const { achievementScore = 0 } = useAchievements();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <span className="text-xs font-semibold text-foreground">Lvl {Math.floor(achievementScore / 100) || 1}</span>
          <div className="w-[60px] h-[3px] bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" style={{ width: `${(achievementScore % 100) || 67}%` }} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-[260px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-sm font-bold text-foreground">Level {Math.floor(achievementScore / 100) || 1}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Erfahrener Spieler</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Progress value={achievementScore % 100 || 67} className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground tabular-nums">{achievementScore} XP</span>
              <span className="text-[11px] font-semibold text-foreground tabular-nums">{achievementScore % 100 || 67}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LEVEL_STATS.map(s => (
              <div key={s.label} className="px-2.5 py-2 rounded-lg border border-border/40 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs leading-none">{s.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xs font-semibold text-foreground tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
            <Gift className="size-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-amber-300">Nächste Belohnung</p>
              <p className="text-[10px] text-amber-400/60">Exklusiver Badge + 500 Diamanten</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SETTINGS_TOGGLES = [
  { label: "Alten Chat bevorzugen", defaultOn: false },
  { label: "Raumeinladungen ignorieren", defaultOn: true },
  { label: "Kamera folgt nicht", defaultOn: false },
  { label: "Mehrere Objekte platzieren", defaultOn: false },
  { label: "Kaufbestätigung überspringen", defaultOn: false },
];

const VOLUME_SLIDERS = [
  { label: "System-Sounds", defaultVal: 60 },
  { label: "Möbel-Sounds", defaultVal: 40 },
  { label: "Trax-Musik", defaultVal: 80 },
];

function SettingsPopover() {
  const [toggles, setToggles] = useState(SETTINGS_TOGGLES.map(t => t.defaultOn));
  const [volumes, setVolumes] = useState(VOLUME_SLIDERS.map(v => v.defaultVal));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <i className="icon icon-cog" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Einstellungen</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Allgemein</span>
            <div className="mt-2 space-y-2.5">
              {SETTINGS_TOGGLES.map((t, i) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{t.label}</span>
                  <Switch checked={toggles[i]} onCheckedChange={v => setToggles(prev => { const n = [...prev]; n[i] = v; return n; })} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-accent/50" />

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Lautstärke</span>
            <div className="mt-3 space-y-4">
              {VOLUME_SLIDERS.map((v, i) => (
                <div key={v.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{v.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{volumes[i]}%</span>
                  </div>
                  <Slider value={[volumes[i]]} max={100} step={1} onValueChange={(val: number[]) => setVolumes(prev => { const n = [...prev]; n[i] = val[0]; return n; })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const PurseView: FC<{}> = props => {
  const { purse = null, hcDisabled = false } = usePurse();
  const { roomSession = null } = useRoom();
  const { navigatorData = null } = useNavigator();
  const [ isZoomedIn, setIsZoomedIn ] = useState(false);

  const handleZoom = useCallback(() => {
    if(!roomSession) return;
    setIsZoomedIn(prev => {
      let scale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);
      if(!prev) scale /= 2; else scale *= 2;
      GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, scale);
      return !prev;
    });
  }, [roomSession]);

  const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
  const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

  const [offerCount, setOfferCount] = useState(0);

  useEffect(() => {
    const fetchOffers = () => {
      try {
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        const userId = GetSessionDataManager().userId;
        if (!cmsUrl || !userId) return;
        fetch(`${cmsUrl}/api/marketplace?action=my-offers-received`, { headers: getAuthHeaders() })
          .then(r => r.ok ? r.json() : [])
          .then(data => setOfferCount(Array.isArray(data) ? data.length : 0))
          .catch(() => {});
      } catch {}
    };
    fetchOffers();
    const interval = setInterval(fetchOffers, 30000);
    return () => clearInterval(interval);
  }, []);

  const getClubText = (() => {
    if (!purse) return null;
    const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
    const minutesUntilExpiration = purse.minutesUntilExpiration;
    if (purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');
    else if ((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);
    else return FriendlyTime.shortFormat(totalDays * 86400);
  })();

  const getCurrencyElements = () => {
    if (!purse || !purse.activityPoints || !purse.activityPoints.size) return null;
    const types = Array.from(purse.activityPoints.keys()).filter(type => displayedCurrencies.indexOf(type) >= 0);
    return types.map(type => {
      const amount = purse.activityPoints.get(type);
      const display = currencyDisplayNumberShort ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount);
      return (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CurrencyIcon type={String(type)} />
              <span className="text-xs font-semibold text-foreground tabular-nums">{display}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Währung {type}</TooltipContent>
        </Tooltip>
      );
    });
  };

  if (!purse) return null;

  const creditsDisplay = currencyDisplayNumberShort ? LocalizeShortNumber(purse.credits) : LocalizeFormattedNumber(purse.credits);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[69] pointer-events-auto inline-flex items-center gap-1 py-1.5 px-3 rounded-2xl bg-card border border-border/40 shadow-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <CurrencyIcon type="-1" />
              <span className="text-xs font-semibold text-foreground tabular-nums">{creditsDisplay}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Credits</TooltipContent>
        </Tooltip>

        {getCurrencyElements()}

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        <LevelPopover />

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        {!hcDisabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => CreateLinkEvent('habboUI/open/hccenter')}>
                <CurrencyIcon type="hc" />
                <span className="text-xs font-medium text-foreground">{getClubText}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Habbo Club</TooltipContent>
          </Tooltip>
        )}

        {!hcDisabled && <div className="w-px h-6 bg-accent/50 mx-1.5" />}

        {TOOL_ICONS.map(({ iconId, label, link }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <div className="relative p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => CreateLinkEvent(link)}>
                <CatalogIcon iconId={iconId} />
                {label === "Marktplatz" && offerCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow-sm">{offerCount}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
          </Tooltip>
        ))}

        { roomSession && (
          <>
            <div className="w-px h-6 bg-accent/50 mx-1.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('navigator/toggle-room-info') }>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Raum Info</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ handleZoom }>
                  { isZoomedIn ? <ZoomOut className="w-4 h-4 text-muted-foreground" /> : <ZoomIn className="w-4 h-4 text-muted-foreground" /> }
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{ isZoomedIn ? 'Herauszoomen' : 'Hineinzoomen' }</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('chat-history/toggle') }>
                  <MessageSquareDashed className="w-4 h-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Chat-Verlauf</TooltipContent>
            </Tooltip>
            { navigatorData?.canRate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => SendMessageComposer(new RateFlatMessageComposer(1)) }>
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Raum bewerten</TooltipContent>
              </Tooltip>
            ) }
          </>
        ) }

        <div className="w-px h-6 bg-accent/50 mx-1.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={ () => CreateLinkEvent('help/show') }>
              <i className="icon icon-help" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Hilfe</TooltipContent>
        </Tooltip>
        <SettingsPopover />
      </div>
    </TooltipProvider>
  );
}
