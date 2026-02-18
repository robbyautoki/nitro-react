const LEVEL_THRESHOLDS = [
    0,
    100,
    250,
    500,
    800,
    1200,
    1700,
    2300,
    3000,
    4000,
    5200,
    6600,
    8200,
    10000,
    12000,
];

const OVERFLOW_INCREMENT = 2500;

export interface LevelInfo
{
    level: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
}

export const getLevelFromScore = (score: number): LevelInfo =>
{
    if(score <= 0) return { level: 1, currentXP: 0, nextLevelXP: LEVEL_THRESHOLDS[1], progress: 0 };

    let level = 1;

    for(let i = 1; i < LEVEL_THRESHOLDS.length; i++)
    {
        if(score >= LEVEL_THRESHOLDS[i]) level = i + 1;
        else break;
    }

    if(level > LEVEL_THRESHOLDS.length)
    {
        const overflow = score - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        level = LEVEL_THRESHOLDS.length + Math.floor(overflow / OVERFLOW_INCREMENT);
    }

    const currentThreshold = level <= LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[level - 1]
        : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + ((level - LEVEL_THRESHOLDS.length) * OVERFLOW_INCREMENT);

    const nextThreshold = level < LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[level]
        : currentThreshold + OVERFLOW_INCREMENT;

    const xpIntoLevel = score - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;
    const progress = xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1;

    return {
        level,
        currentXP: xpIntoLevel,
        nextLevelXP: xpNeeded,
        progress,
    };
};
