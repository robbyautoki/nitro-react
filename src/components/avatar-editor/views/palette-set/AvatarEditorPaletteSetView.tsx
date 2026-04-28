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
    label?: string | null;
}

export const AvatarEditorPaletteSetView: FC<AvatarEditorPaletteSetViewProps> = props =>
{
    const { model = null, category = null, paletteSet = [], paletteIndex = -1, label = null } = props;
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
        <div className="flex flex-col gap-2">
            { label && (
                <div className="flex items-center gap-2">
                    <span className="text-subheading-2xs uppercase tracking-wider text-text-soft-400">
                        { label }
                    </span>
                    <div className="h-px flex-1 bg-stroke-soft-200" />
                </div>
            ) }
            <AutoGrid innerRef={ elementRef } gap={ 1 } columnCount={ 14 } columnMinWidth={ 26 }>
                { (paletteSet.length > 0) && paletteSet.map((item, index) =>
                    <AvatarEditorColorSwatch
                        key={ index }
                        colorItem={ item }
                        hcDisabled={ hcDisabled }
                        onClick={ () => selectColor(item) }
                    />
                ) }
            </AutoGrid>
        </div>
    );
}
