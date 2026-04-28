import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { AvatarEditorGridPartItem, CategoryData, GetConfiguration, IAvatarEditorCategoryModel } from '../../../../api';
import { AvatarEditorPartTile } from './AvatarEditorPartTile';

export interface AvatarEditorFigureSetViewProps
{
    model: IAvatarEditorCategoryModel;
    category: CategoryData;
    setMaxPaletteCount: Dispatch<SetStateAction<number>>;
}

export const AvatarEditorFigureSetView: FC<AvatarEditorFigureSetViewProps> = props =>
{
    const { model = null, category = null, setMaxPaletteCount = null } = props;
    const elementRef = useRef<HTMLDivElement>(null);

    const hcDisabled = useMemo(() => GetConfiguration<boolean>('hc.disabled', false), []);

    const selectPart = useCallback((item: AvatarEditorGridPartItem) =>
    {
        const index = category.parts.indexOf(item);

        if(index === -1) return;

        model.selectPart(category.name, index);

        const partItem = category.getCurrentPart();

        setMaxPaletteCount(partItem.maxColorIndex || 1);
    }, [ model, category, setMaxPaletteCount ]);

    useEffect(() =>
    {
        if(!model || !category || !elementRef || !elementRef.current) return;

        elementRef.current.scrollTop = 0;
    }, [ model, category ]);

    return (
        <div
            ref={ elementRef }
            className="grid gap-2"
            style={ { gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' } }
        >
            { (category.parts.length > 0) && category.parts.map((item, index) =>
                <AvatarEditorPartTile
                    key={ index }
                    partItem={ item }
                    hcDisabled={ hcDisabled }
                    onClick={ () => selectPart(item) }
                />
            ) }
        </div>
    );
}
