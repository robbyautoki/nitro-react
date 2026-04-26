import { AchievementData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { AchievementListItemView } from './AchievementListItemView';

interface AchievementListViewProps
{
    achievements: AchievementData[];
}

export const AchievementListView: FC<AchievementListViewProps> = props =>
{
    const { achievements = null } = props;

    return (
        <div className="nitro-achievements-list rounded-2xl bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
            { achievements && (achievements.length > 0) && achievements.map((achievement, index) => <AchievementListItemView key={ index } achievement={ achievement } />) }
        </div>
    );
}
