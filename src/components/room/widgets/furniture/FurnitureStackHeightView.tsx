import { FurnitureStackHeightComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { ArrowDownToLine, Layers, Ruler } from 'lucide-react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { useFurnitureStackHeightWidget } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import { FurnitureWidgetActions, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureStackHeightView: FC<{}> = props =>
{
    const { objectId = -1, height = 0, maxHeight = 40, onClose = null, updateHeight = null } = useFurnitureStackHeightWidget();
    const [ tempHeight, setTempHeight ] = useState('');

    const updateTempHeight = (value: string) =>
    {
        setTempHeight(value);

        const newValue = parseFloat(value);

        if(isNaN(newValue) || (newValue === height)) return;

        updateHeight(newValue);
    }

    useEffect(() =>
    {
        setTempHeight(height.toString());
    }, [ height ]);

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-stack-height"
            title={ LocalizeText('widget.custom.stack.height.title') }
            subtitle={ `${ height.toFixed(2) } / ${ maxHeight }` }
            icon={ Ruler }
            onClose={ onClose }
            widthClassName="w-[400px]"
            footer={
                <FurnitureWidgetActions className="grid grid-cols-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ event => SendMessageComposer(new FurnitureStackHeightComposer(objectId, -100)) }>
                        <AlignButton.Icon as={ Layers } className="size-4" />
                        { LocalizeText('furniture.above.stack') }
                    </AlignButton.Root>
                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ event => SendMessageComposer(new FurnitureStackHeightComposer(objectId, 0)) }>
                        <AlignButton.Icon as={ ArrowDownToLine } className="size-4" />
                        { LocalizeText('furniture.floor.level') }
                    </AlignButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection>
                <FurnitureWidgetText className="mb-4">{ LocalizeText('widget.custom.stack.height.text') }</FurnitureWidgetText>
                <div className="grid grid-cols-[1fr_82px] items-center gap-3">
                    <AlignSlider.Root min={ 0 } max={ maxHeight } step={ 0.01 } value={ [ height ] } onValueChange={ value => updateHeight(value[0]) }>
                        <AlignSlider.Thumb />
                    </AlignSlider.Root>
                    <AlignInput.Root>
                        <AlignInput.Wrapper>
                            <AlignInput.Input className="text-center" type="number" min={ 0 } max={ maxHeight } step={ 0.01 } value={ tempHeight } onChange={ event => updateTempHeight(event.target.value) } />
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
