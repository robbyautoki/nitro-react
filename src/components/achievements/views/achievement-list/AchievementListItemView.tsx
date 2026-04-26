import { AchievementData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { useAchievements } from '../../../../hooks';
import { AchievementBadgeView } from '../AchievementBadgeView';

interface AchievementListItemViewProps
{
    achievement: AchievementData;
}

export const AchievementListItemView: FC<AchievementListItemViewProps> = props =>
{
    const { achievement = null } = props;
    const { selectedAchievement = null, setSelectedAchievementId = null } = useAchievements();

    if(!achievement) return null;

    return (
        <button
            type="button"
            className={ `relative flex aspect-square min-h-[72px] items-center justify-center rounded-2xl bg-bg-weak-50 shadow-regular-xs ring-1 ring-inset transition duration-200 ${ selectedAchievement === achievement ? 'bg-primary-alpha-10 ring-primary-base' : 'ring-stroke-soft-200 hover:bg-bg-white-0 hover:ring-primary-base' }` }
            onClick={ () => setSelectedAchievementId(achievement.achievementId) }
        >
            { achievement.unseen > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-error-base" /> }
            <AchievementBadgeView achievement={ achievement } />
        </button>
    );
}
