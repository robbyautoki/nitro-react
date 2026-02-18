import { GetLocalStorage } from './GetLocalStorage';
import { SetLocalStorage } from './SetLocalStorage';

export const PRESTIGE_BADGE_PREFIX = 'PRESTIGE';
export const PRESTIGE_MULTIPLIER = 1.5;
export const BASE_MAX_XP = 12000;
const MAX_LEVEL = 15;

const BASE_THRESHOLDS = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000,
];

export interface PrestigeInfo
{
    prestigeLevel: number;
    displayLevel: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
    isMaxLevel: boolean;
}

export const getPrestigeFromBadges = (badges: string[]): number =>
{
    if(!badges || !badges.length) return 0;

    let maxPrestige = 0;

    for(const badge of badges)
    {
        if(badge.startsWith(PRESTIGE_BADGE_PREFIX))
        {
            const num = parseInt(badge.replace(PRESTIGE_BADGE_PREFIX, ''), 10);

            if(!isNaN(num) && num > maxPrestige) maxPrestige = num;
        }
    }

    return maxPrestige;
};

export const getXPConsumedByPrestige = (prestige: number): number =>
{
    if(prestige <= 0) return 0;

    return BASE_MAX_XP * ((Math.pow(PRESTIGE_MULTIPLIER, prestige) - 1) / (PRESTIGE_MULTIPLIER - 1));
};

export const getPrestigeThresholds = (prestige: number): number[] =>
{
    const multiplier = Math.pow(PRESTIGE_MULTIPLIER, prestige);

    return BASE_THRESHOLDS.map(t => Math.round(t * multiplier));
};

export const getPrestigeInfo = (rawScore: number, prestige: number): PrestigeInfo =>
{
    const xpConsumed = getXPConsumedByPrestige(prestige);
    const effectiveScore = Math.max(0, rawScore - xpConsumed);
    const thresholds = getPrestigeThresholds(prestige);

    let displayLevel = 1;

    for(let i = 1; i < thresholds.length; i++)
    {
        if(effectiveScore >= thresholds[i]) displayLevel = i + 1;
        else break;
    }

    if(displayLevel > MAX_LEVEL) displayLevel = MAX_LEVEL;

    const isMaxLevel = displayLevel >= MAX_LEVEL && effectiveScore >= thresholds[thresholds.length - 1];

    const currentThreshold = displayLevel <= thresholds.length
        ? thresholds[displayLevel - 1]
        : thresholds[thresholds.length - 1];

    const nextThreshold = displayLevel < thresholds.length
        ? thresholds[displayLevel]
        : currentThreshold;

    const xpIntoLevel = effectiveScore - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;
    const progress = isMaxLevel ? 1 : (xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1);

    return {
        prestigeLevel: prestige,
        displayLevel,
        currentXP: isMaxLevel ? xpNeeded : xpIntoLevel,
        nextLevelXP: xpNeeded,
        progress,
        isMaxLevel,
    };
};

export const getScoreNeededForPrestige = (prestige: number): number =>
{
    return Math.round(getXPConsumedByPrestige(prestige + 1));
};

export const getOwnPrestige = (): number =>
{
    return GetLocalStorage<number>('nitro.prestige.level') ?? 0;
};

export const setOwnPrestige = (level: number): void =>
{
    SetLocalStorage('nitro.prestige.level', level);
};
