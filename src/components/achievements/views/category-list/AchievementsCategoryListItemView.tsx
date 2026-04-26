import { Dispatch, FC, SetStateAction } from 'react';
import { AchievementUtilities, IAchievementCategory, LocalizeText } from '../../../../api';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';

interface AchievementCategoryListItemViewProps
{
    category: IAchievementCategory;
    selectedCategoryCode: string;
    setSelectedCategoryCode: Dispatch<SetStateAction<string>>;
}

export const AchievementsCategoryListItemView: FC<AchievementCategoryListItemViewProps> = props =>
{
    const { category = null, selectedCategoryCode = null, setSelectedCategoryCode = null } = props;

    if(!category) return null;

    const progress = AchievementUtilities.getAchievementCategoryProgress(category);
    const maxProgress = AchievementUtilities.getAchievementCategoryMaxProgress(category);
    const getCategoryImage = AchievementUtilities.getAchievementCategoryImageUrl(category, progress);
    const getTotalUnseen = AchievementUtilities.getAchievementCategoryTotalUnseen(category);

    return (
        <button
            type="button"
            className={ `group relative min-h-[132px] overflow-hidden rounded-2xl bg-bg-white-0 p-3 text-left shadow-regular-xs ring-1 ring-inset transition duration-200 ${ selectedCategoryCode === category.code ? 'ring-primary-base' : 'ring-stroke-soft-200 hover:bg-bg-white-0 hover:ring-primary-base' }` }
            onClick={ () => setSelectedCategoryCode(category.code) }
        >
            { getTotalUnseen > 0 &&
                <AlignBadge.Root color="red" variant="filled" size="small" className="absolute right-2 top-2 z-10">
                    { getTotalUnseen }
                </AlignBadge.Root> }

            <div className="flex h-[74px] items-center justify-center">
                <img src={ getCategoryImage } alt="" className="max-h-[72px] max-w-full object-contain [image-rendering:auto]" draggable={ false } />
            </div>
            <div className="mt-2 truncate text-center text-label-sm text-text-strong-950">
                { LocalizeText(`quests.${ category.code }.name`) }
            </div>
            <div className="mt-2 flex items-center gap-2">
                <AlignProgressBar.Root value={ progress } max={ maxProgress } color="green" className="h-1.5" />
                <span className="shrink-0 text-paragraph-xs tabular-nums text-text-sub-600">{ progress }/{ maxProgress }</span>
            </div>
        </button>
    );
}
