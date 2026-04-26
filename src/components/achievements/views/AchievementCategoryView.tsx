import { FC, useEffect } from 'react';
import { AchievementCategory } from '../../../api';
import { useAchievements } from '../../../hooks';
import { AchievementListView } from './achievement-list';
import { AchievementDetailsView } from './AchievementDetailsView';

interface AchievementCategoryViewProps
{
    category: AchievementCategory;
}

export const AchievementCategoryView: FC<AchievementCategoryViewProps> = props =>
{
    const { category = null } = props;
    const { selectedAchievement = null, setSelectedAchievementId = null } = useAchievements();

    useEffect(() =>
    {
        if(!category) return;

        if(!selectedAchievement)
        {
            setSelectedAchievementId(category?.achievements?.[0]?.achievementId);
        }
    }, [ category, selectedAchievement, setSelectedAchievementId ]);

    if(!category) return null;

    return (
        <div className="nitro-achievements-category">
            <AchievementListView achievements={ category.achievements } />
            { !!selectedAchievement &&
                <AchievementDetailsView achievement={ selectedAchievement } /> }
        </div>
    );
}
