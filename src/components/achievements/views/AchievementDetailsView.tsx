import { AchievementData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { Gift, Star } from 'lucide-react';
import { AchievementUtilities, LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText } from '../../../api';
import { LayoutCurrencyIcon } from '../../../common';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import { AchievementBadgeView } from './AchievementBadgeView';

interface AchievementDetailsViewProps
{
    achievement: AchievementData;
}

export const AchievementDetailsView: FC<AchievementDetailsViewProps> = props =>
{
    const { achievement = null } = props;

    if(!achievement) return null;

    const badgeCode = AchievementUtilities.getAchievementBadgeCode(achievement);
    const progress = achievement.currentPoints + achievement.scoreAtStartOfLevel;
    const maxProgress = achievement.scoreLimit + achievement.scoreAtStartOfLevel;

    return (
        <div className="nitro-achievements-detail flex min-w-0 flex-col rounded-2xl bg-bg-white-0 p-5 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
            <div className="flex flex-col items-center text-center">
                <div className="flex size-36 shrink-0 items-center justify-center rounded-3xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                    <AchievementBadgeView className="nitro-achievements-badge-image" achievement={ achievement } scale={ 2 } />
                </div>
                <div className="mt-4 min-w-0">
                    <div className="line-clamp-2 text-label-lg text-text-strong-950">{ LocalizeBadgeName(badgeCode) }</div>
                    <p className="mt-2 line-clamp-4 text-paragraph-sm leading-6 text-text-sub-600">{ LocalizeBadgeDescription(badgeCode) }</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
                <AlignBadge.Root color="blue" variant="lighter" size="small">
                    <AlignBadge.Icon as={ Star } className="size-3" />
                    { LocalizeText('achievements.details.level', [ 'level', 'limit' ], [ AchievementUtilities.getAchievementLevel(achievement).toString(), achievement.levelCount.toString() ]) }
                </AlignBadge.Root>
                { achievement.levelRewardPoints > 0 &&
                    <AlignBadge.Root color="yellow" variant="lighter" size="small">
                        <AlignBadge.Icon as={ Gift } className="size-3" />
                        { achievement.levelRewardPoints }
                        <LayoutCurrencyIcon type={ achievement.levelRewardPointType } />
                    </AlignBadge.Root> }
            </div>

            <div className="flex-1" />

            { achievement.scoreLimit > 0 &&
                <div className="mt-5 rounded-2xl bg-bg-weak-50 p-4 ring-1 ring-inset ring-stroke-soft-200">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-label-sm text-text-strong-950">Fortschritt</span>
                        <span className="text-label-sm tabular-nums text-text-sub-600">{ progress }/{ maxProgress }</span>
                    </div>
                    <AlignProgressBar.Root value={ progress } max={ maxProgress } color="green" className="h-2" />
                </div> }
        </div>
    );
}
