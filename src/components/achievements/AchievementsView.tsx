import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { ArrowLeft, Trophy, X } from 'lucide-react';
import { AchievementUtilities, AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { DraggableWindow } from '../../common';
import { useAchievements } from '../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { AchievementCategoryView } from './views/AchievementCategoryView';
import { AchievementsCategoryListView } from './views/category-list/AchievementsCategoryListView';

export const AchievementsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { achievementCategories = [], selectedCategoryCode = null, setSelectedCategoryCode = null, achievementScore = 0, getProgress = 0, getMaxProgress = 0, selectedCategory = null } = useAchievements();

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
        
                if(parts.length < 2) return;
        
                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'achievements/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="achievements">
            <AlignSurface.Panel className="nitro-achievements nitro-achievements-align overflow-hidden">
                <div className="drag-handler flex cursor-grab items-center gap-4 border-b border-stroke-soft-200 px-5 py-4 active:cursor-grabbing">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-alpha-10 text-primary-base">
                        <Trophy className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-title-h6 text-text-strong-950">{ LocalizeText('inventory.achievements') }</div>
                        <div className="mt-1 truncate text-paragraph-sm text-text-sub-600">
                            { LocalizeText('achievements.categories.score', [ 'score' ], [ achievementScore.toString() ]) }
                        </div>
                    </div>
                    <AlignButton.Root variant="neutral" mode="ghost" size="small" className="size-10 p-0" onClick={ () => setIsVisible(false) }>
                        <AlignButton.Icon as={ X } className="size-5" />
                    </AlignButton.Root>
                </div>

                { selectedCategory &&
                    <div className="flex items-center gap-4 border-b border-stroke-soft-200 bg-bg-weak-50 px-5 py-4">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" className="size-11 p-0" onClick={ () => setSelectedCategoryCode(null) }>
                            <AlignButton.Icon as={ ArrowLeft } className="size-5" />
                        </AlignButton.Root>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-label-lg text-text-strong-950">{ LocalizeText(`quests.${ selectedCategory.code }.name`) }</div>
                            <div className="mt-3 flex items-center gap-3">
                                <AlignProgressBar.Root value={ selectedCategory.getProgress() } max={ selectedCategory.getMaxProgress() } color="green" className="h-2" />
                                <span className="shrink-0 text-label-sm tabular-nums text-text-sub-600">
                                    { selectedCategory.getProgress() }/{ selectedCategory.getMaxProgress() }
                                </span>
                            </div>
                        </div>
                        <div
                            className="size-20 shrink-0 bg-contain bg-center bg-no-repeat"
                            style={ { backgroundImage: `url(${ AchievementUtilities.getAchievementCategoryImageUrl(selectedCategory, null, true) })` } }
                        />
                    </div> }

                <div className="nitro-achievements-body bg-bg-weak-50 p-5">
                    { !selectedCategory &&
                        <div className="space-y-4">
                            <AchievementsCategoryListView categories={ achievementCategories } selectedCategoryCode={ selectedCategoryCode } setSelectedCategoryCode={ setSelectedCategoryCode } />
                            <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="text-label-xs text-text-strong-950">{ LocalizeText('achievements.categories.totalprogress', [ 'progress', 'limit' ], [ getProgress.toString(), getMaxProgress.toString() ]) }</span>
                                    <span className="text-paragraph-xs tabular-nums text-text-sub-600">{ getProgress }/{ getMaxProgress }</span>
                                </div>
                                <AlignProgressBar.Root value={ getProgress } max={ getMaxProgress } color="green" className="h-2" />
                            </div>
                        </div> }
                    { selectedCategory &&
                        <AchievementCategoryView category={ selectedCategory } /> }
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
};
