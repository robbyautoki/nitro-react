import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { CategoryData, FigureData, IAvatarEditorCategoryModel } from '../../../api';
import { cn } from '../../../align-ui/utils/cn';
import { AvatarEditorIcon } from './AvatarEditorIcon';
import { AvatarEditorFigureSetView } from './figure-set/AvatarEditorFigureSetView';
import { AvatarEditorPaletteSetView } from './palette-set/AvatarEditorPaletteSetView';

export interface AvatarEditorModelViewProps
{
    model: IAvatarEditorCategoryModel;
    gender: string;
    setGender: Dispatch<SetStateAction<string>>;
}

export const AvatarEditorModelView: FC<AvatarEditorModelViewProps> = props =>
{
    const { model = null, gender = null, setGender = null } = props;
    const [ activeCategory, setActiveCategory ] = useState<CategoryData>(null);
    const [ maxPaletteCount, setMaxPaletteCount ] = useState(1);

    const selectCategory = useCallback((name: string) =>
    {
        const category = model.categories.get(name);

        if(!category) return;

        category.init();

        setActiveCategory(category);

        for(const part of category.parts)
        {
            if(!part || !part.isSelected) continue;

            setMaxPaletteCount(part.maxColorIndex || 1);

            break;
        }
    }, [ model ]);

    useEffect(() =>
    {
        model.init();

        for(const name of model.categories.keys())
        {
            selectCategory(name);

            break;
        }
    }, [ model, selectCategory ]);

    if(!model || !activeCategory) return null;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            { /* Top row: Gender SegmentedControl OR Sub-Category Tabs */ }
            <div className="flex shrink-0 items-center gap-2 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2.5">
                { model.canSetGender && (
                    <div className="flex items-center gap-0.5 rounded-xl bg-bg-white-0 p-1 ring-1 ring-stroke-soft-200">
                        <button
                            type="button"
                            onClick={ () => setGender(FigureData.MALE) }
                            className={ cn(
                                'flex h-11 w-14 items-center justify-center rounded-lg transition-all',
                                gender === FigureData.MALE
                                    ? 'bg-primary-alpha-10 ring-2 ring-primary-base shadow-regular-xs'
                                    : 'hover:bg-bg-weak-50'
                            ) }
                        >
                            <AvatarEditorIcon icon="male" selected={ gender === FigureData.MALE } />
                        </button>
                        <button
                            type="button"
                            onClick={ () => setGender(FigureData.FEMALE) }
                            className={ cn(
                                'flex h-11 w-14 items-center justify-center rounded-lg transition-all',
                                gender === FigureData.FEMALE
                                    ? 'bg-primary-alpha-10 ring-2 ring-primary-base shadow-regular-xs'
                                    : 'hover:bg-bg-weak-50'
                            ) }
                        >
                            <AvatarEditorIcon icon="female" selected={ gender === FigureData.FEMALE } />
                        </button>
                    </div>
                ) }
                { !model.canSetGender && model.categories && (model.categories.size > 0) && Array.from(model.categories.keys()).map(name =>
                {
                    const category = model.categories.get(name);
                    const isActive = (activeCategory === category);

                    return (
                        <button
                            key={ name }
                            type="button"
                            onClick={ () => selectCategory(name) }
                            className={ cn(
                                'flex size-12 shrink-0 items-center justify-center rounded-xl transition-all ring-inset',
                                isActive
                                    ? 'bg-primary-alpha-10 ring-2 ring-primary-base shadow-regular-xs'
                                    : 'bg-bg-white-0 ring-1 ring-stroke-soft-200 hover:ring-stroke-sub-300 hover:shadow-regular-xs'
                            ) }
                        >
                            <AvatarEditorIcon icon={ category.name } selected={ isActive } />
                        </button>
                    );
                }) }
            </div>
            { /* Items + Colors split */ }
            <div className="flex min-h-0 flex-1 flex-col">
                { /* Item Grid - scrollable */ }
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <AvatarEditorFigureSetView model={ model } category={ activeCategory } setMaxPaletteCount={ setMaxPaletteCount } />
                </div>
                { /* Color Palette - fixed at bottom, shows fully (no inner scroll) */ }
                { (maxPaletteCount >= 1) &&
                    <div className="flex shrink-0 flex-col gap-3 border-t border-stroke-soft-200 bg-bg-weak-50/40 p-3">
                        <AvatarEditorPaletteSetView
                            model={ model }
                            category={ activeCategory }
                            paletteSet={ activeCategory.getPalette(0) }
                            paletteIndex={ 0 }
                            label={ maxPaletteCount === 2 ? 'Hautton' : null }
                        />
                        { (maxPaletteCount === 2) &&
                            <AvatarEditorPaletteSetView
                                model={ model }
                                category={ activeCategory }
                                paletteSet={ activeCategory.getPalette(1) }
                                paletteIndex={ 1 }
                                label="Akzent"
                            /> }
                    </div> }
            </div>
        </div>
    );
}
