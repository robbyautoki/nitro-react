import { FC, useCallback, useMemo } from 'react';
import { Input as AriaInput, type Color, parseColor } from 'react-aria-components';
import { CheckCircle2, CircleAlert, Pipette, Paintbrush, Power, Save } from 'lucide-react';
import { ColorUtils, LocalizeText } from '../../../../api';
import { useFurnitureBackgroundColorWidget } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignColorPicker from '@/align-ui/components/ui/color-picker';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import * as AlignInput from '@/align-ui/components/ui/input';
import { cn } from '@/align-ui/utils/cn';
import { FurnitureWidgetActions, FurnitureWidgetSection, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureBackgroundColorView: FC<{}> = props =>
{
    const {
        objectId = -1,
        color = 0,
        setColor = null,
        applyToner = null,
        toggleToner = null,
        onClose = null,
        tonerState = 0,
        appliedColor = 0,
        isDirty = false
    } = useFurnitureBackgroundColorWidget();

    const selectedHex = ColorUtils.makeColorNumberHex(color).toUpperCase();
    const appliedHex = ColorUtils.makeColorNumberHex(appliedColor).toUpperCase();
    const pickerColor = useMemo(() => parseColor(selectedHex), [ selectedHex ]);
    const onColorChange = useCallback((nextColor: Color) =>
    {
        setColor?.(ColorUtils.convertFromHex(nextColor.toString('hex')));
    }, [ setColor ]);

    const isOn = tonerState === 1;

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-background-color"
            title={ LocalizeText('widget.backgroundcolor.title') }
            subtitle={ LocalizeText('widget.backgroundcolor.hue') }
            icon={ Paintbrush }
            onClose={ onClose }
            widthClassName="w-[360px]"
            footer={
                <FurnitureWidgetActions className="grid grid-cols-2">
                    <AlignButton.Root
                        variant={ isOn ? 'error' : 'neutral' }
                        mode="stroke"
                        size="small"
                        onClick={ toggleToner }
                    >
                        <AlignButton.Icon as={ Power } className="size-4" />
                        { isOn ? 'Ausschalten' : 'Einschalten' }
                    </AlignButton.Root>
                    <FancyButton.Root
                        variant="primary"
                        size="small"
                        onClick={ applyToner }
                        disabled={ !isDirty }
                        aria-disabled={ !isDirty }
                        className={ cn(!isDirty && 'cursor-not-allowed opacity-60') }
                    >
                        <FancyButton.Icon as={ Save } />
                        { isDirty ? 'Anwenden' : 'Angewendet' }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <div className="flex flex-wrap items-center gap-2">
                <AlignBadge.Root variant="lighter" color={ isOn ? 'green' : 'gray' } size="small">
                    <AlignBadge.Dot />
                    { isOn ? 'Eingeschaltet' : 'Ausgeschaltet' }
                </AlignBadge.Root>

                <AlignBadge.Root variant="lighter" color={ isDirty ? 'orange' : 'green' } size="small">
                    <AlignBadge.Icon as={ isDirty ? CircleAlert : CheckCircle2 } className="size-3" />
                    { isDirty ? 'Nicht angewendet' : 'Angewendet' }
                </AlignBadge.Root>

                { isDirty && (
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-bg-weak-50 px-2 py-0.5 text-[11px] text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200"
                        title={ `Aktuell angewendet: ${ appliedHex }` }
                    >
                        <span
                            className="size-3 rounded-full ring-1 ring-inset ring-stroke-soft-200"
                            style={ { backgroundColor: appliedHex } }
                            aria-hidden
                        />
                        <span className="font-mono">{ appliedHex }</span>
                    </span>
                ) }
            </div>

            <FurnitureWidgetSection title={ LocalizeText('widget.backgroundcolor.hue') }>
                <AlignColorPicker.Root value={ pickerColor } onChange={ onColorChange }>
                    <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <div className="relative overflow-hidden rounded-xl ring-1 ring-inset ring-stroke-soft-200">
                            <AlignColorPicker.Area
                                colorSpace="hsb"
                                xChannel="saturation"
                                yChannel="brightness"
                                className="h-[164px] w-full rounded-xl"
                            >
                                <AlignColorPicker.Thumb className="size-4 border-2 border-static-white ring-0 shadow-regular-xs" />
                            </AlignColorPicker.Area>
                        </div>

                        <AlignColorPicker.Slider colorSpace="hsl" channel="hue" className="mt-4 h-4 !p-0">
                            <AlignColorPicker.SliderTrack className="h-full rounded-full">
                                <div className="absolute inset-x-2 h-full">
                                    <AlignColorPicker.Thumb className="top-1/2 size-3 -translate-y-1/2 rounded-full !bg-bg-white-0 ring-0 shadow-regular-xs" />
                                </div>
                            </AlignColorPicker.SliderTrack>
                        </AlignColorPicker.Slider>

                        <div className="mt-4 flex items-center gap-2.5">
                            <span className="size-9 shrink-0 rounded-lg shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200" style={ { backgroundColor: selectedHex } } />

                            <AlignInput.Root size="small" className="flex-1">
                                <AlignColorPicker.Field colorSpace="hsb">
                                    <AlignInput.Wrapper>
                                        <AriaInput className="h-8 w-full bg-transparent font-mono text-label-sm uppercase text-text-strong-950 outline-none" aria-label={ LocalizeText('widget.backgroundcolor.hue') } />
                                    </AlignInput.Wrapper>
                                </AlignColorPicker.Field>
                            </AlignInput.Root>

                            <AlignColorPicker.EyeDropperButton className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50 hover:text-text-strong-950">
                                <Pipette className="size-4" />
                            </AlignColorPicker.EyeDropperButton>
                        </div>
                    </div>
                </AlignColorPicker.Root>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
