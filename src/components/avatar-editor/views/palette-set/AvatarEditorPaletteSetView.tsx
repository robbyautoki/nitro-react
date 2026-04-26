import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { AvatarEditorGridColorItem, CategoryData, GetConfiguration, IAvatarEditorCategoryModel } from '../../../../api';
import { AutoGrid } from '../../../../common';
import { AvatarEditorColorSwatch } from './AvatarEditorColorSwatch';

export interface AvatarEditorPaletteSetViewProps
{
    model: IAvatarEditorCategoryModel;
    category: CategoryData;
    paletteSet: AvatarEditorGridColorItem[];
    paletteIndex: number;
}

export const AvatarEditorPaletteSetView: FC<AvatarEditorPaletteSetViewProps> = props =>
{
    const { model = null, category = null, paletteSet = [], paletteIndex = -1 } = props;
    const elementRef = useRef<HTMLDivElement>(null);

    const hcDisabled = useMemo(() => GetConfiguration<boolean>('hc.disabled', false), []);

    const selectColor = useCallback((item: AvatarEditorGridColorItem) =>
    {
        const index = paletteSet.indexOf(item);

        if(index === -1) return;

        model.selectColor(category.name, index, paletteIndex);
    }, [ model, category, paletteSet, paletteIndex ]);

    useEffect(() =>
    {
        if(!model || !category || !elementRef || !elementRef.current) return;

        elementRef.current.scrollTop = 0;
    }, [ model, category ]);

    return (
        <AutoGrid innerRef={ elementRef } gap={ 2 } columnCount={ 10 } columnMinWidth={ 32 }>
            { (paletteSet.length > 0) && paletteSet.map((item, index) =>
                <AvatarEditorColorSwatch
                    key={ index }
                    colorItem={ item }
                    hcDisabled={ hcDisabled }
                    onClick={ () => selectColor(item) }
                />
            ) }
        </AutoGrid>
    );
}
