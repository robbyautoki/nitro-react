import { FC, useCallback, useMemo, useState } from 'react';
import { CreateLinkEvent, GetConfiguration } from '../../../api';
import { getPrestigeFromBadges, getPrestigeInfo, getOwnPrestige, setOwnPrestige } from '../../../api/utils/PrestigeUtils';
import { useAchievements } from '../../../hooks';
import { useInventoryBadges } from '../../../hooks/inventory';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export const LevelView: FC<{}> = props =>
{
    const { achievementScore = 0 } = useAchievements();
    const { badgeCodes = [] } = useInventoryBadges();
    const [ prestigeLoading, setPrestigeLoading ] = useState(false);

    const localPrestige = useMemo(() => getOwnPrestige(), []);
    const badgePrestige = useMemo(() => getPrestigeFromBadges(badgeCodes), [ badgeCodes ]);
    const prestige = Math.max(localPrestige, badgePrestige);

    const prestigeInfo = useMemo(() => getPrestigeInfo(achievementScore, prestige), [ achievementScore, prestige ]);

    const isCloseToLevelUp = !prestigeInfo.isMaxLevel && prestigeInfo.progress > 0.9;

    const handlePrestige = useCallback(async () =>
    {
        if(prestigeLoading) return;

        setPrestigeLoading(true);

        try
        {
            const cmsUrl = GetConfiguration<string>('url.prefix', '');
            const response = await fetch(`${ cmsUrl }/api/prestige`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            if(data.success)
            {
                setOwnPrestige(data.prestige);
                window.location.reload();
            }
        }
        catch(error)
        {
            console.error('Prestige failed:', error);
        }
        finally
        {
            setPrestigeLoading(false);
        }
    }, [ prestigeLoading ]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group"
                    onClick={ () => CreateLinkEvent('achievements/toggle') }
                >
                    <div className="flex items-center gap-1.5">
                        { prestige > 0 && (
                            <span className="text-xs font-bold text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">
                                { prestige > 2 ? `🌟×${ prestige }` : '🌟'.repeat(prestige) }
                            </span>
                        ) }
                        <span className={ `text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] ${ isCloseToLevelUp ? 'animate-pulse' : '' } ${ prestigeInfo.isMaxLevel ? 'animate-pulse' : '' }` }>
                            { prestige > 0 ? '💎' : '⭐' }
                        </span>
                        <span className="text-xs font-bold text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]">
                            { prestigeInfo.displayLevel }
                        </span>
                    </div>
                    <Progress
                        value={ prestigeInfo.progress * 100 }
                        className="w-[80px] h-[4px] bg-white/[0.06]"
                        indicatorClassName={ `bg-gradient-to-r ${ prestige > 0 ? 'from-purple-400 to-amber-400' : 'from-amber-400 to-yellow-500' } ${ isCloseToLevelUp || prestigeInfo.isMaxLevel ? 'shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'shadow-[0_0_4px_rgba(251,191,36,0.3)]' }` }
                    />
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                <div className="flex flex-col gap-1">
                    { prestige > 0 && (
                        <span className="font-medium text-purple-400">Prestige { prestige }</span>
                    ) }
                    <span className="font-medium text-amber-300">Level { prestigeInfo.displayLevel }</span>
                    <span className="text-gray-400">
                        { prestigeInfo.isMaxLevel ? 'Max Level!' : `${ prestigeInfo.currentXP } / ${ prestigeInfo.nextLevelXP } XP` }
                    </span>
                    { prestigeInfo.isMaxLevel && (
                        <Button
                            size="sm"
                            className="mt-1 bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-white text-xs font-bold"
                            onClick={ (e) => { e.stopPropagation(); handlePrestige(); } }
                            disabled={ prestigeLoading }
                        >
                            { prestigeLoading ? 'Prestige...' : '🌟 Prestige!' }
                        </Button>
                    ) }
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
