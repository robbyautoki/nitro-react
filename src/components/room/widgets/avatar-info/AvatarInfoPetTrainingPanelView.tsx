// =============================================================================
// AvatarInfoPetTrainingPanelView — Bahhos Pet-Training-Center (Enterprise UX)
// =============================================================================
// STRIKT AlignUI ONLY (per Bündel D-Polish v2 Spec):
//   • Quelle: /Users/robbyreinemann/Desktop/AlignUI-Kit
//   • Komponenten ausschließlich aus `@/align-ui/components/ui/*` verwenden
//   • KEIN shadcn/ui, KEIN Glassmorphism, KEIN NitroCardView (Habbo-Frame raus)
//   • KEINE hardcoded Farben — nur AlignUI-Tokens
//
// Funktion (Enterprise UX):
//   - Floating-Card oben rechts unter der Topbar (420px)
//   - Pet-Hero + Tier-Badge (Welpe / Junior / Erwachsen / Weise)
//   - XP-Bar (live, Re-Fetch nach Trainings-Klick)
//   - Mini-Stats: Happiness / Energy / Alter
//   - Drei Tabs: Lernen / Beherrscht / Gesperrt
//   - Locked Commands sichtbar mit Lock-Icon, Stufe-Anforderung,
//     Mini-Progress (Pet-Lvl / required-Lvl)
//   - DIREKT-FEUER (kein Confirm-Modal): Klick sendet sofort,
//     Button blinkt 600ms primary, dann Auto-Refresh nach 2.5s
//   - Train-Mode-Banner mit 30s-Countdown, falls aktiv
// =============================================================================

import { IRoomUserData, PetTrainingMessageParser, PetTrainingPanelMessageEvent } from '@nitrots/nitro-renderer';
import {
    RiCheckLine,
    RiCloseLine,
    RiFlashlightLine,
    RiGraduationCapLine,
    RiHeart3Line,
    RiLightbulbLine,
    RiLockLine,
    RiSeedlingLine,
    RiSparkling2Line,
    RiTimerLine,
    RiTrophyLine
} from '@remixicon/react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { LayoutPetImageView } from '../../../../common';
import { useMessageEvent, useRoom, useSessionInfo } from '../../../../hooks';
import { buildCommandMetaMap, usePetCommandsMeta } from '../../../../hooks/pets/usePetCommandsMeta';
import { petTierLabel, usePetInfoForTraining } from '../../../../hooks/pets/usePetInfoForTraining';
import { usePetKnownCommands } from '../../../../hooks/pets/usePetKnownCommands';
import { translatePetCommand } from './petCommandTranslations';

import * as Badge from '@/align-ui/components/ui/badge';
import * as CompactButton from '@/align-ui/components/ui/compact-button';
import * as Divider from '@/align-ui/components/ui/divider';
import * as ProgressBar from '@/align-ui/components/ui/progress-bar';
import * as SegmentedControl from '@/align-ui/components/ui/segmented-control';
import * as Tooltip from '@/align-ui/components/ui/tooltip';

type FilterValue = 'training' | 'mastered' | 'locked';

const TRAIN_MODE_WINDOW_MS = 30_000;
const REFRESH_AFTER_FIRE_MS = 2500;
const FIRING_HIGHLIGHT_MS = 700;

export const AvatarInfoPetTrainingPanelView: FC<{}> = () =>
{
    const [ petData, setPetData ] = useState<IRoomUserData>(null);
    const [ petTrainInformation, setPetTrainInformation ] = useState<PetTrainingMessageParser>(null);
    const [ filter, setFilter ] = useState<FilterValue>('training');
    const [ firingId, setFiringId ] = useState<number | null>(null);
    const [ trainModeStartedAt, setTrainModeStartedAt ] = useState<number | null>(null);
    const [ trainModeRemaining, setTrainModeRemaining ] = useState(0);

    const { chatStyleId = 0 } = useSessionInfo();
    const { roomSession = null } = useRoom();

    const { commands: commandsMeta } = usePetCommandsMeta();
    const metaMap = useMemo(() => buildCommandMetaMap(commandsMeta), [ commandsMeta ]);

    const petId = petTrainInformation?.petId ?? null;
    const { info: petInfo, refresh: refreshPetInfo } = usePetInfoForTraining({ petId });
    const { knownCommandIds, refresh: refreshKnownCommands } = usePetKnownCommands(petId);

    const fireTimerRef = useRef<number | null>(null);
    const refreshTimerRef = useRef<number | null>(null);

    // ─── Panel öffnen ────────────────────────────────────────────────────
    useMessageEvent<PetTrainingPanelMessageEvent>(PetTrainingPanelMessageEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;

        const roomPetData = roomSession?.userDataManager.getPetData(parser.petId);
        if(!roomPetData) return;

        setPetData(roomPetData);
        setPetTrainInformation(parser);
        setFilter('training');
        setTrainModeStartedAt(Date.now());
    });

    // ─── Train-Mode-Countdown (server hält 30s offen) ────────────────────
    useEffect(() =>
    {
        if(trainModeStartedAt === null) { setTrainModeRemaining(0); return; }
        const tick = () =>
        {
            const elapsed = Date.now() - trainModeStartedAt;
            const left = Math.max(0, TRAIN_MODE_WINDOW_MS - elapsed);
            setTrainModeRemaining(left);
        };
        tick();
        const id = window.setInterval(tick, 250);
        return () => window.clearInterval(id);
    }, [ trainModeStartedAt ]);

    // ─── Cleanup bei Unmount/Close ───────────────────────────────────────
    useEffect(() => () =>
    {
        if(fireTimerRef.current) window.clearTimeout(fireTimerRef.current);
        if(refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    }, []);

    const handleClose = () =>
    {
        setPetTrainInformation(null);
        setPetData(null);
        setFiringId(null);
        setTrainModeStartedAt(null);
    };

    // ─── Direkt-Feuer (kein Confirm) ─────────────────────────────────────
    const handleFireCommand = useCallback((commandId: number, locked: boolean) =>
    {
        if(locked) return;
        if(!petData?.name || !roomSession) return;

        const englishCommand = LocalizeText(`pet.command.${ commandId }`);
        const germanCommand = translatePetCommand(englishCommand);

        roomSession.sendChatMessage(`${ petData.name } ${ germanCommand }`, chatStyleId);

        setFiringId(commandId);
        if(fireTimerRef.current) window.clearTimeout(fireTimerRef.current);
        fireTimerRef.current = window.setTimeout(() => setFiringId(null), FIRING_HIGHLIGHT_MS);

        // Train-Mode neu anstoßen (User-Aktivität verlängert das gefühlte Fenster).
        setTrainModeStartedAt(Date.now());

        // PetInfo + KnownCommands nach kurzer Verzögerung neu holen
        // (XP-Bar live + im Train-Mode gelernte Tricks wandern in „Beherrscht").
        if(refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() =>
        {
            refreshPetInfo();
            refreshKnownCommands();
        }, REFRESH_AFTER_FIRE_MS);
    }, [ chatStyleId, petData, roomSession, refreshPetInfo, refreshKnownCommands ]);

    // ─── Buckets nach Status (Hybrid-Logik) ─────────────────────────────
    //   Beherrscht  = Vanilla enabledCommands ∪ pet_known_commands
    //   Lernen      = level >= required_level UND nicht Beherrscht
    //   Gesperrt    = level <  required_level
    //
    // Failsafe: wenn commandsMeta noch nicht geladen ist (CMS down oder
    // Kaltstart), nutzen wir requiredLevel=Infinity → alles, was nicht in
    // Vanilla enabledCommands ist, landet im Locked-Bucket. So sieht der
    // User niemals "alles freigeschaltet" wenn die Wahrheit anders ist.
    const { masteredIds, learnableIds, lockedIds, allIds } = useMemo(() =>
    {
        if(!petTrainInformation) return { masteredIds: [] as number[], learnableIds: [] as number[], lockedIds: [] as number[], allIds: [] as number[] };

        const all = petTrainInformation.commands ?? [];
        const enabled = new Set(petTrainInformation.enabledCommands ?? []);
        const known = new Set(knownCommandIds ?? []);
        const level = petInfo?.level ?? 1;
        const metaLoaded = !!commandsMeta;

        const mastered: number[] = [];
        const learnable: number[] = [];
        const locked: number[] = [];

        for(const cmdId of all)
        {
            if(enabled.has(cmdId) || known.has(cmdId))
            {
                mastered.push(cmdId);
                continue;
            }
            const meta = metaMap[cmdId];
            // Failsafe: wenn Meta noch nicht da → eher locked (kein false-positive Learnable).
            const required = meta?.requiredLevel ?? (metaLoaded ? 1 : Number.POSITIVE_INFINITY);
            if(level >= required) learnable.push(cmdId);
            else locked.push(cmdId);
        }

        return { masteredIds: mastered, learnableIds: learnable, lockedIds: locked, allIds: all };
    }, [ petTrainInformation, petInfo, metaMap, commandsMeta, knownCommandIds ]);

    if(!petData || !petTrainInformation) return null;

    const tier = petTierLabel(petInfo?.level ?? 1);
    const xpCurrent = petInfo?.experience ?? 0;
    const xpGoal = Math.max(1, petInfo?.levelExperienceGoal ?? 100);
    const xpPct = Math.min(100, Math.round((xpCurrent / xpGoal) * 100));

    const visibleIds =
        filter === 'training' ? learnableIds :
        filter === 'mastered' ? masteredIds :
        lockedIds;

    const trainModeSecondsLeft = Math.ceil(trainModeRemaining / 1000);

    return (
        <Tooltip.Provider delayDuration={ 200 }>
            <div
                role="dialog"
                aria-label="Pet Trainings-Zentrum"
                className="pointer-events-auto fixed right-4 top-[calc(var(--topbar-height,60px)+12px)] z-[800] flex w-[420px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-var(--topbar-height,60px)-var(--bottom-bar-height,80px)-32px)] flex-col gap-4 overflow-hidden rounded-20 bg-bg-white-0 p-5 shadow-regular-md ring-1 ring-stroke-soft-200">

                {/* ─── HEADER ──────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-alpha-10 text-primary-base">
                        <RiTrophyLine className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-label-md text-text-strong-950">Trainings-Zentrum</div>
                        <div className="text-paragraph-xs text-text-sub-600">Belohne dein Tier mit XP und schalte neue Tricks frei</div>
                    </div>
                    <CompactButton.Root variant="ghost" size="large" onClick={ handleClose } aria-label="Schließen">
                        <CompactButton.Icon as={ RiCloseLine } />
                    </CompactButton.Root>
                </div>

                {/* ─── TRAIN-MODE BANNER (30s-Window läuft) ─────────── */}
                { trainModeSecondsLeft > 0 && (
                    <div className="flex items-center gap-2 rounded-12 bg-primary-alpha-10 px-3 py-2 text-primary-base">
                        <RiTimerLine className="size-4 shrink-0" />
                        <div className="flex-1 text-label-xs">Train-Mode aktiv — neue Befehle werden sofort gelernt</div>
                        <div className="font-mono text-label-xs tabular-nums">{ trainModeSecondsLeft }s</div>
                    </div>
                ) }

                <Divider.Root variant="line" />

                {/* ─── PET-HERO + LEVEL/XP/STATS ────────────────────── */}
                <div className="flex items-start gap-4">
                    <div className="flex size-24 shrink-0 items-center justify-center rounded-16 bg-bg-weak-50 ring-1 ring-stroke-soft-200">
                        <LayoutPetImageView figure={ petData.figure } posture="std" direction={ 2 } />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="truncate text-title-h6 text-text-strong-950">{ petData.name }</div>
                            <Badge.Root variant="lighter" color="purple" size="small">
                                <Badge.Icon as={ RiSparkling2Line } />
                                { tier.label }
                            </Badge.Root>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2 text-paragraph-xs text-text-sub-600">
                                <span>Stufe { petInfo?.level ?? '–' } { petInfo ? `→ ${ petInfo.level + 1 }` : '' }</span>
                                <span className="font-mono tabular-nums text-text-strong-950">{ xpCurrent } / { xpGoal } XP</span>
                            </div>
                            <ProgressBar.Root value={ xpPct } max={ 100 } color="orange" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-paragraph-xs text-text-sub-600">
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <div className="flex items-center gap-1">
                                        <RiHeart3Line className="size-3.5 text-error-base" />
                                        <span className="font-medium text-text-strong-950">{ petInfo?.happyness ?? '–' }</span>
                                        <span>/{ petInfo?.maximumHappyness ?? 100 }</span>
                                    </div>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Glücklichkeit</Tooltip.Content>
                            </Tooltip.Root>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <div className="flex items-center gap-1">
                                        <RiFlashlightLine className="size-3.5 text-warning-base" />
                                        <span className="font-medium text-text-strong-950">{ petInfo?.energy ?? '–' }</span>
                                        <span>/{ petInfo?.maximumEnergy ?? 100 }</span>
                                    </div>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Energie</Tooltip.Content>
                            </Tooltip.Root>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <div className="flex items-center gap-1">
                                        <RiSeedlingLine className="size-3.5 text-success-base" />
                                        <span className="font-medium text-text-strong-950">{ petInfo?.age ?? '–' }</span>
                                        <span>Tage</span>
                                    </div>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Alter des Tiers</Tooltip.Content>
                            </Tooltip.Root>
                        </div>
                    </div>
                </div>

                {/* ─── KPI-BADGES (Counts pro Bucket) ───────────────── */}
                <div className="grid grid-cols-3 gap-2">
                    <KpiCard
                        active={ filter === 'training' }
                        color="primary"
                        Icon={ RiGraduationCapLine }
                        value={ learnableIds.length }
                        label="Lernen"
                        onClick={ () => setFilter('training') }
                    />
                    <KpiCard
                        active={ filter === 'mastered' }
                        color="success"
                        Icon={ RiTrophyLine }
                        value={ masteredIds.length }
                        label="Beherrscht"
                        onClick={ () => setFilter('mastered') }
                    />
                    <KpiCard
                        active={ filter === 'locked' }
                        color="muted"
                        Icon={ RiLockLine }
                        value={ lockedIds.length }
                        label="Gesperrt"
                        onClick={ () => setFilter('locked') }
                    />
                </div>

                {/* ─── COMMAND-LISTE ────────────────────────────────── */}
                <div className="-mx-1 flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-1">
                    { visibleIds.length === 0 && (
                        <EmptyState filter={ filter } petName={ petData.name } total={ allIds.length } />
                    ) }
                    { visibleIds.map(commandId =>
                    {
                        const englishCommand = LocalizeText(`pet.command.${ commandId }`);
                        const germanCommand = translatePetCommand(englishCommand);
                        const meta = metaMap[commandId];
                        const requiredLevel = meta?.requiredLevel ?? 1;
                        const rewardXp = meta?.rewardXp ?? 5;
                        const petLevel = petInfo?.level ?? 1;
                        const isMastered = filter === 'mastered';
                        // Mastered-Tricks dürfen NIE als locked gerendert werden,
                        // selbst wenn die required_level-Metadaten lückenhaft sind.
                        const isLocked = !isMastered && (filter === 'locked' || petLevel < requiredLevel);
                        const isFiring = firingId === commandId;
                        const lockProgress = Math.min(100, Math.round((petLevel / Math.max(1, requiredLevel)) * 100));

                        return (
                            <CommandRow
                                key={ commandId }
                                germanCommand={ germanCommand }
                                englishCommand={ englishCommand }
                                requiredLevel={ requiredLevel }
                                rewardXp={ rewardXp }
                                petLevel={ petLevel }
                                lockProgress={ lockProgress }
                                isMastered={ isMastered }
                                isLocked={ isLocked }
                                isFiring={ isFiring }
                                onFire={ () => handleFireCommand(commandId, isLocked) }
                            />
                        );
                    }) }
                </div>

                {/* ─── FOOTER-HINT ──────────────────────────────────── */}
                <div className="flex items-start gap-2 rounded-12 bg-bg-weak-50 p-3">
                    <RiLightbulbLine className="mt-0.5 size-4 shrink-0 text-text-sub-600" />
                    <div className="text-paragraph-xs text-text-sub-600">
                        Klicke einen Befehl — { petData.name } führt ihn sofort aus und sammelt XP. Höhere Stufen schalten neue Tricks frei.
                    </div>
                </div>
            </div>
        </Tooltip.Provider>
    );
};

// =============================================================================
// Sub-Komponenten
// =============================================================================

interface KpiCardProps
{
    active: boolean;
    color: 'primary' | 'success' | 'muted';
    Icon: React.ComponentType<{ className?: string }>;
    value: number;
    label: string;
    onClick: () => void;
}

const KpiCard: FC<KpiCardProps> = ({ active, color, Icon, value, label, onClick }) =>
{
    const palette = {
        primary: { ring: 'ring-primary-base', icon: 'text-primary-base', bg: 'bg-primary-alpha-10' },
        success: { ring: 'ring-success-base', icon: 'text-success-base', bg: 'bg-success-lighter' },
        muted:   { ring: 'ring-stroke-strong-950', icon: 'text-text-sub-600', bg: 'bg-bg-weak-50' }
    }[color];

    return (
        <button
            type="button"
            onClick={ onClick }
            className={ `flex flex-col items-start gap-1 rounded-12 p-3 text-left ring-1 transition duration-200 ease-out focus:outline-none focus-visible:ring-2 ${ active ? `bg-bg-white-0 ${ palette.ring } shadow-regular-xs` : 'bg-bg-weak-50 ring-stroke-soft-200 hover:bg-bg-white-0 hover:ring-stroke-strong-950' }` }>
            <div className={ `flex size-7 items-center justify-center rounded-full ${ palette.bg } ${ palette.icon }` }>
                <Icon className="size-4" />
            </div>
            <div className="text-title-h6 text-text-strong-950 tabular-nums">{ value }</div>
            <div className="text-paragraph-xs text-text-sub-600">{ label }</div>
        </button>
    );
};

interface CommandRowProps
{
    germanCommand: string;
    englishCommand: string;
    requiredLevel: number;
    rewardXp: number;
    petLevel: number;
    lockProgress: number;
    isMastered: boolean;
    isLocked: boolean;
    isFiring: boolean;
    onFire: () => void;
}

const CommandRow: FC<CommandRowProps> = ({ germanCommand, englishCommand, requiredLevel, rewardXp, petLevel, lockProgress, isMastered, isLocked, isFiring, onFire }) =>
{
    const levelsToGo = Math.max(0, requiredLevel - petLevel);

    if(isLocked)
    {
        return (
            <div
                aria-disabled="true"
                className="flex flex-col gap-2 rounded-12 bg-bg-weak-50 px-3 py-2.5 ring-1 ring-stroke-soft-200 opacity-90">
                <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-white-0 text-text-sub-600 ring-1 ring-stroke-soft-200">
                        <RiLockLine className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-label-sm text-text-strong-950">{ germanCommand }</div>
                        <div className="text-paragraph-xs text-text-sub-600">
                            Stufe { requiredLevel } nötig · Noch { levelsToGo } { levelsToGo === 1 ? 'Stufe' : 'Stufen' }
                        </div>
                    </div>
                    <Badge.Root variant="lighter" color="gray" size="small">
                        +{ rewardXp } XP
                    </Badge.Root>
                </div>
                <div className="pl-11">
                    <ProgressBar.Root value={ lockProgress } max={ 100 } color="blue" />
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={ onFire }
            data-firing={ isFiring ? 'true' : 'false' }
            className={ `group flex items-center gap-3 rounded-12 px-3 py-2.5 text-left ring-1 transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-base ${ isFiring ? 'scale-[0.98] bg-primary-base text-static-white ring-primary-base shadow-regular-md' : isMastered ? 'bg-bg-white-0 ring-success-base/40 hover:bg-success-lighter hover:ring-success-base' : 'bg-bg-white-0 ring-stroke-soft-200 hover:bg-bg-weak-50 hover:ring-stroke-strong-950' }` }>
            <div className={ `flex size-8 shrink-0 items-center justify-center rounded-full ${ isFiring ? 'bg-static-white text-primary-base' : isMastered ? 'bg-success-lighter text-success-base' : 'bg-primary-alpha-10 text-primary-base' }` }>
                { isMastered ? <RiCheckLine className="size-4" /> : <RiGraduationCapLine className="size-4" /> }
            </div>
            <div className="min-w-0 flex-1">
                <div className={ `truncate text-label-sm ${ isFiring ? 'text-static-white' : 'text-text-strong-950' }` }>{ germanCommand }</div>
                <div className={ `truncate text-paragraph-xs ${ isFiring ? 'text-static-white/80' : 'text-text-sub-600' }` }>
                    Stufe { requiredLevel } · +{ rewardXp } XP · { englishCommand }
                </div>
            </div>
            <div className={ `text-label-xs ${ isFiring ? 'text-static-white' : isMastered ? 'text-success-base' : 'text-primary-base' }` }>
                { isFiring ? 'Gesendet ✓' : isMastered ? 'Üben' : 'Trainieren' }
            </div>
        </button>
    );
};

const EmptyState: FC<{ filter: FilterValue; petName: string; total: number }> = ({ filter, petName, total }) =>
{
    if(filter === 'training')
    {
        return (
            <EmptyCard
                Icon={ RiTrophyLine }
                title="Alles gelernt, was jetzt geht!"
                description={ `${ petName } beherrscht alle Tricks der aktuellen Stufe. Hebe das Level, um neue freizuschalten.` }
            />
        );
    }
    if(filter === 'mastered')
    {
        return (
            <EmptyCard
                Icon={ RiGraduationCapLine }
                title="Noch keine Tricks gelernt"
                description={ `${ petName } muss erst trainieren. Wechsle in den Tab "Lernen".` }
            />
        );
    }
    return (
        <EmptyCard
            Icon={ RiLightbulbLine }
            title="Keine gesperrten Tricks"
            description={ `${ petName } hat alle ${ total } Befehle freigeschaltet. Stufe weiter sammeln für neue Inhalte!` }
        />
    );
};

const EmptyCard: FC<{ Icon: React.ComponentType<{ className?: string }>; title: string; description: string }> = ({ Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-12 bg-bg-weak-50 px-4 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-stroke-soft-200">
            <Icon className="size-5 text-text-sub-600" />
        </div>
        <div className="text-label-sm text-text-strong-950">{ title }</div>
        <div className="text-paragraph-xs text-text-sub-600">{ description }</div>
    </div>
);
