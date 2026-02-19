import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { CategoryData, FigureData, IAvatarEditorCategoryModel } from '../../../api';
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
        <div className="flex flex-col flex-1 min-h-0">
            {/* Category icons - horizontal row */}
            <div className="flex gap-1 px-3 py-2 shrink-0 border-b border-white/[0.06]">
                { model.canSetGender &&
                    <>
                        <div className={ `category-item-h ${ gender === FigureData.MALE ? 'active' : '' }` } onClick={ () => setGender(FigureData.MALE) }>
                            <AvatarEditorIcon icon="male" selected={ (gender === FigureData.MALE) } />
                        </div>
                        <div className={ `category-item-h ${ gender === FigureData.FEMALE ? 'active' : '' }` } onClick={ () => setGender(FigureData.FEMALE) }>
                            <AvatarEditorIcon icon="female" selected={ (gender === FigureData.FEMALE) } />
                        </div>
                    </> }
                { !model.canSetGender && model.categories && (model.categories.size > 0) && Array.from(model.categories.keys()).map(name =>
                {
                    const category = model.categories.get(name);

                    return (
                        <div key={ name } className={ `category-item-h ${ activeCategory === category ? 'active' : '' }` } onClick={ () => selectCategory(name) }>
                            <AvatarEditorIcon icon={ category.name } selected={ (activeCategory === category) } />
                        </div>
                    );
                }) }
            </div>

            {/* Items + Colors split */}
            <div className="flex-1 min-h-0 flex flex-col">
                {/* Item Grid - scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2">
                    <AvatarEditorFigureSetView model={ model } category={ activeCategory } setMaxPaletteCount={ setMaxPaletteCount } />
                </div>

                {/* Color Palette - fixed at bottom */}
                { (maxPaletteCount >= 1) &&
                    <div className="shrink-0 max-h-[120px] overflow-y-auto p-2 pt-0 border-t border-white/[0.06]">
                        <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(0) } paletteIndex={ 0 } />
                        { (maxPaletteCount === 2) &&
                            <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(1) } paletteIndex={ 1 } /> }
                    </div> }
            </div>
        </div>
    );
}
