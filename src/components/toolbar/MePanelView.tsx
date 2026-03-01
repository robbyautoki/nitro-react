import { FC, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Trophy, Home, Shirt, Settings as SettingsIcon, Award, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, GetUserProfile, LocalizeFormattedNumber, LocalizeShortNumber } from '../../api';
import { getPrestigeFromBadges, getPrestigeInfo, getOwnPrestige } from '../../api/utils/PrestigeUtils';
import { LayoutAvatarImageView, LayoutBadgeImageView, LayoutCurrencyIcon } from '../../common';
import { useAchievements, usePurse, useSessionInfo } from '../../hooks';
import { useInventoryBadges } from '../../hooks/inventory';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DispatchUiEvent } from '../../api';
import { GuideToolEvent } from '../../events';

interface MePanelViewProps {
  open: boolean;
  onClose: () => void;
  useGuideTool?: boolean;
}

function MeIcon({ name, w, h }: { name: string; w: number; h: number }) {
  return (
    <img
      src={`/toolbar-icons/${name}`}
      alt={name}
      style={{ width: w, height: h, imageRendering: 'pixelated', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

const CURRENCY_CARD_STYLES: Record<number, { bg: string; border: string; hoverBg: string; iconColor: string }> = {
  [-1]: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', hoverBg: 'hover:bg-amber-500/15', iconColor: 'text-amber-400' },
  5: { bg: 'bg-sky-500/8', border: 'border-sky-500/15', hoverBg: 'hover:bg-sky-500/15', iconColor: 'text-sky-400' },
  0: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', hoverBg: 'hover:bg-emerald-500/15', iconColor: 'text-emerald-400' },
};

const CURRENCY_LABELS: Record<number, string> = {
  [-1]: 'Credits',
  5: 'Diamanten',
  0: 'Duckets',
};

export const MePanelView: FC<MePanelViewProps> = ({ open, onClose, useGuideTool = false }) => {
  const { purse = null, hcDisabled = false } = usePurse();
  const { userFigure = null } = useSessionInfo();
  const { achievementScore = 0 } = useAchievements();
  const { activeBadgeCodes = [], activate = null, badgeCodes = [] } = useInventoryBadges();

  const userName = GetSessionDataManager().userName || 'User';

  const localPrestige = useMemo(() => getOwnPrestige(), []);
  const badgePrestige = useMemo(() => getPrestigeFromBadges(badgeCodes), [badgeCodes]);
  const prestige = Math.max(localPrestige, badgePrestige);
  const prestigeInfo = useMemo(() => getPrestigeInfo(achievementScore, prestige), [achievementScore, prestige]);

  const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
  const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

  // Trigger badge data loading when panel opens
  useEffect(() => {
    if (open && activate) activate();
  }, [open, activate]);

  const handleAction = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  const formatCurrency = useCallback((amount: number) => {
    return currencyDisplayNumberShort ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount);
  }, [currencyDisplayNumberShort]);

  // Build currency entries from config + purse data
  const currencyEntries = useMemo(() => {
    if (!purse) return [];

    const entries: { type: number; amount: string; label: string; styles: typeof CURRENCY_CARD_STYLES[-1] }[] = [];

    // Credits first
    if (displayedCurrencies.includes(-1)) {
      entries.push({
        type: -1,
        amount: formatCurrency(purse.credits),
        label: CURRENCY_LABELS[-1] || 'Credits',
        styles: CURRENCY_CARD_STYLES[-1] || CURRENCY_CARD_STYLES[-1],
      });
    }

    // Activity points
    for (const type of displayedCurrencies) {
      if (type === -1) continue;
      const amount = purse.activityPoints?.get(type) ?? 0;
      entries.push({
        type,
        amount: formatCurrency(amount),
        label: CURRENCY_LABELS[type] || `Währung ${type}`,
        styles: CURRENCY_CARD_STYLES[type] || { bg: 'bg-muted/30', border: 'border-border/30', hoverBg: 'hover:bg-muted/50', iconColor: 'text-muted-foreground' },
      });
    }

    return entries;
  }, [purse, displayedCurrencies, formatCurrency]);

  const quickActions = useMemo(() => {
    const actions = [];

    if (useGuideTool) {
      actions.push({
        icon: 'me-menu/helper-tool.png',
        label: 'Helper',
        action: () => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL)),
      });
    }

    actions.push(
      { icon: 'me-menu/achievements.png', label: 'Achievements', action: () => CreateLinkEvent('achievements/toggle') },
      { icon: 'me-menu/profile.png', label: 'Profil', action: () => GetUserProfile(GetSessionDataManager().userId) },
      { icon: 'me-menu/my-rooms.png', label: 'Meine Räume', action: () => CreateLinkEvent('navigator/search/myworld_view') },
      { icon: 'me-menu/clothing.png', label: 'Avatar', action: () => CreateLinkEvent('avatar-editor/toggle') },
      { icon: 'me-menu/cog.png', label: 'Einstellungen', action: () => CreateLinkEvent('user-settings/toggle') },
    );

    return actions;
  }, [useGuideTool]);

  return (
    <TooltipProvider delayDuration={200}>
      {/* Transparent backdrop — click to close, no dimming */}
      {open && (
        <div
          className="fixed inset-0 z-[69]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed z-[70] top-[60px] w-[360px]',
          'bg-card/95 backdrop-blur-xl border-r border-border/40',
          'shadow-[4px_0_24px_-4px_oklch(0_0_0/0.15)]',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          open
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4 pointer-events-none'
        )}
        style={{
          left: 'var(--sidebar-width, 80px)',
          height: 'calc(100vh - 60px)',
        }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">

          {/* ── Section 1: Hero ─────────────────────────── */}
          <div className="relative p-5 pb-4">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-accent/5 to-transparent pointer-events-none" />

            <div className="relative flex items-start gap-4">
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-accent/40 border border-border/30 shrink-0">
                <LayoutAvatarImageView
                  figure={userFigure}
                  direction={2}
                  className="!absolute top-0 left-1/2"
                  style={{ transform: 'translateX(-50%) scale(0.75)', transformOrigin: 'top center' }}
                />
                {/* VIP glow ring */}
                {purse?.isVip && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/40 animate-pulse" style={{ animationDuration: '3s' }} />
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-base font-bold text-foreground truncate">{userName}</h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {prestige > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/30 text-amber-400 bg-amber-500/10 font-semibold">
                      P{prestige}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Level {prestigeInfo.displayLevel}
                  </span>
                  {prestigeInfo.isMaxLevel && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-semibold">
                      MAX
                    </Badge>
                  )}
                </div>
                {purse?.isVip && (
                  <Badge className="mt-2 text-[10px] px-2 py-0.5 h-5 bg-amber-500/15 text-amber-400 border border-amber-500/25 font-semibold">
                    <Sparkles className="size-3 mr-1" />
                    VIP Mitglied
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: XP Progress Bar ──────────────── */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                {prestigeInfo.isMaxLevel
                  ? 'Max Level erreicht'
                  : `${LocalizeFormattedNumber(prestigeInfo.currentXP)} / ${LocalizeFormattedNumber(prestigeInfo.nextLevelXP)} XP`
                }
              </span>
              <span className="text-[11px] font-bold text-foreground tabular-nums">
                {Math.round(prestigeInfo.progress * 100)}%
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-accent/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{
                  width: `${Math.max(prestigeInfo.progress * 100, 2)}%`,
                  background: 'linear-gradient(90deg, oklch(0.65 0.15 250), oklch(0.70 0.18 200), oklch(0.65 0.15 170))',
                }}
              >
                {/* Shine sweep overlay */}
                <span className="absolute inset-0 animate-shine-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>
            </div>
          </div>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="h-px mx-5 bg-border/40" />

          {/* ── Section 3: Currency Grid ─────────────────── */}
          <div className="px-5 py-4">
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Kontostand
            </span>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {currencyEntries.map(({ type, amount, label, styles }) => (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors cursor-default',
                      styles.bg, styles.border, styles.hoverBg,
                    )}>
                      <LayoutCurrencyIcon type={type} />
                      <span className="text-sm font-bold text-foreground tabular-nums leading-none">{amount}</span>
                      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="h-px mx-5 bg-border/40" />

          {/* ── Section 4: HC/VIP Status ─────────────────── */}
          {!hcDisabled && (
            <>
              <div className="px-5 py-3">
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-colors',
                  purse?.clubDays > 0
                    ? 'bg-amber-500/8 border-amber-500/15'
                    : 'bg-accent/30 border-border/30'
                )}>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className={cn(
                      'size-4 shrink-0',
                      purse?.clubDays > 0 ? 'text-amber-400' : 'text-muted-foreground/40'
                    )} />
                    <div>
                      <span className={cn(
                        'text-xs font-semibold',
                        purse?.clubDays > 0 ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {purse?.clubDays > 0 ? 'Habbo Club aktiv' : 'Kein Habbo Club'}
                      </span>
                      {purse?.clubDays > 0 && purse?.clubPeriods > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {purse.clubPeriods} {purse.clubPeriods === 1 ? 'Monat' : 'Monate'} verbleibend
                        </p>
                      )}
                    </div>
                  </div>
                  {purse?.clubDays > 0 && (
                    <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                      {purse.clubDays}d
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px mx-5 bg-border/40" />
            </>
          )}

          {/* ── Section 5: Worn Badges ───────────────────── */}
          {activeBadgeCodes.length > 0 && (
            <>
              <div className="px-5 py-3">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Getragene Abzeichen
                </span>
                <div className="flex items-center gap-2 mt-2">
                  {activeBadgeCodes.map(code => (
                    <Tooltip key={code}>
                      <TooltipTrigger asChild>
                        <div className="w-10 h-10 rounded-lg bg-accent/30 border border-border/30 flex items-center justify-center hover:bg-accent/50 transition-colors cursor-pointer">
                          <LayoutBadgeImageView badgeCode={code} className="!bg-center !bg-no-repeat" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{code}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div className="h-px mx-5 bg-border/40" />
            </>
          )}

          {/* ── Section 6: Quick Actions ─────────────────── */}
          <div className="px-5 py-4">
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Schnellzugriff
            </span>
            <div className="grid grid-cols-2 gap-1.5 mt-2.5">
              {quickActions.map(item => (
                <button
                  key={item.label}
                  onClick={() => handleAction(item.action)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-accent/50 active:bg-accent/70 transition-colors text-left group"
                >
                  <MeIcon name={item.icon} w={20} h={20} />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
};
