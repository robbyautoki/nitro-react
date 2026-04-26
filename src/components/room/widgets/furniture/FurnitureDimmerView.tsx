import { RoomEngineTriggerWidgetEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { Lightbulb, Power, Save, Sparkles } from 'lucide-react';
import { ColorUtils, FurnitureDimmerUtilities, GetConfiguration, LocalizeText } from '../../../../api';
import { Base } from '../../../../common';
import { useFurnitureDimmerWidget, useRoomEngineEvent } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { cn } from '@/align-ui/utils/cn';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureDimmerView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { presets = [], dimmerState = 0, selectedPresetId = 0, color = 0xFFFFFF, brightness = 0xFF, effectId = 0, selectedColor = 0, setSelectedColor = null, selectedBrightness = 0, setSelectedBrightness = null, selectedEffectId = 0, setSelectedEffectId = null, selectPresetId = null, applyChanges } = useFurnitureDimmerWidget();

    const onClose = () =>
    {
        FurnitureDimmerUtilities.previewDimmer(color, brightness, (effectId === 2));

        setIsVisible(false);
    }

    useRoomEngineEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REMOVE_DIMMER, event => setIsVisible(false));

    useEffect(() =>
    {
        if(!presets || !presets.length) return;

        setIsVisible(true);
    }, [ presets ]);

    const isFreeColorMode = useMemo(() => GetConfiguration<boolean>('widget.dimmer.colorwheel', false), []);

    if(!isVisible) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-dimmer"
            title={ LocalizeText('widget.dimmer.title') }
            subtitle={ dimmerState === 1 ? LocalizeText(`widget.dimmer.tab.${ selectedPresetId }`) : LocalizeText('widget.dimmer.info.off') }
            icon={ Lightbulb }
            onClose={ onClose }
            widthClassName="w-[420px]"
            footer={
                dimmerState === 1 ? (
                    <FurnitureWidgetActions className="grid grid-cols-2">
                        <AlignButton.Root variant="error" mode="stroke" size="small" onClick={ () => FurnitureDimmerUtilities.changeState() }>
                            <AlignButton.Icon as={ Power } className="size-4" />
                            { LocalizeText('widget.dimmer.button.off') }
                        </AlignButton.Root>
                        <FancyButton.Root variant="primary" size="small" onClick={ applyChanges }>
                            <FancyButton.Icon as={ Save } />
                            { LocalizeText('widget.dimmer.button.apply') }
                        </FancyButton.Root>
                    </FurnitureWidgetActions>
                ) : null
            }
        >
            { (dimmerState === 0) &&
                <FurnitureWidgetSection className="flex flex-col items-center gap-4 text-center">
                    <FurnitureWidgetPreview className="size-28">
                        <Base className="dimmer-banner" />
                    </FurnitureWidgetPreview>
                    <FurnitureWidgetText>{ LocalizeText('widget.dimmer.info.off') }</FurnitureWidgetText>
                    <FancyButton.Root variant="primary" size="small" className="w-full" onClick={ () => FurnitureDimmerUtilities.changeState() }>
                        <FancyButton.Icon as={ Power } />
                        { LocalizeText('widget.dimmer.button.on') }
                    </FancyButton.Root>
                </FurnitureWidgetSection> }
            { (dimmerState === 1) &&
                <>
                    <div className="grid grid-cols-3 gap-2">
                        { presets.map(preset => (
                            <AlignButton.Root
                                key={ preset.id }
                                variant={ (selectedPresetId === preset.id) ? 'primary' : 'neutral' }
                                mode={ (selectedPresetId === preset.id) ? 'lighter' : 'stroke' }
                                size="xsmall"
                                onClick={ event => selectPresetId(preset.id) }
                            >
                                { LocalizeText(`widget.dimmer.tab.${ preset.id }`) }
                            </AlignButton.Root>
                        )) }
                    </div>
                    <FurnitureWidgetSection title={ LocalizeText('widget.backgroundcolor.hue') }>
                        { isFreeColorMode &&
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                                <span className="size-10 rounded-lg ring-1 ring-inset ring-stroke-soft-200" style={ { backgroundColor: ColorUtils.makeColorNumberHex(selectedColor) } } />
                                <span className="min-w-0 flex-1 text-label-sm text-text-strong-950">{ ColorUtils.makeColorNumberHex(selectedColor).toUpperCase() }</span>
                                <input type="color" className="size-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" value={ ColorUtils.makeColorNumberHex(selectedColor) } onChange={ event => setSelectedColor(ColorUtils.convertFromHex(event.target.value)) } />
                            </label> }
                        { !isFreeColorMode &&
                            <div className="grid grid-cols-7 gap-2">
                                { FurnitureDimmerUtilities.AVAILABLE_COLORS.map((color, index) => (
                                    <button
                                        type="button"
                                        key={ color }
                                        className={ cn('size-9 rounded-lg shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out hover:scale-105', (color === selectedColor) && 'ring-2 ring-primary-base') }
                                        style={ { backgroundColor: FurnitureDimmerUtilities.HTML_COLORS[index] } }
                                        onClick={ () => setSelectedColor(color) }
                                    />
                                )) }
                            </div> }
                    </FurnitureWidgetSection>
                    <FurnitureWidgetSection title={ LocalizeText('widget.backgroundcolor.lightness') }>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <AlignSlider.Root min={ FurnitureDimmerUtilities.MIN_BRIGHTNESS } max={ FurnitureDimmerUtilities.MAX_BRIGHTNESS } value={ [ selectedBrightness ] } onValueChange={ value => setSelectedBrightness(value[0]) }>
                                <AlignSlider.Thumb />
                            </AlignSlider.Root>
                            <div className="w-12 rounded-lg bg-bg-weak-50 px-2 py-1 text-center text-label-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200">
                                { FurnitureDimmerUtilities.scaleBrightness(selectedBrightness) }%
                            </div>
                        </div>
                    </FurnitureWidgetSection>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-regular-xs">
                        <AlignCheckbox.Root checked={ selectedEffectId === 2 } onCheckedChange={ checked => setSelectedEffectId(checked ? 2 : 1) } />
                        <Sparkles className="size-4 text-text-sub-600" />
                        <span className="text-paragraph-sm text-text-strong-950">{ LocalizeText('widget.dimmer.type.checkbox') }</span>
                    </label>
                </> }
        </FurnitureWidgetWindow>
    );
}
