import { FC, ReactNode } from 'react';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import { cn } from '@/lib/utils';

export interface WiredSliderFieldProps
{
    label: ReactNode;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    valueLabel?: ReactNode;
    className?: string;
}

export const WiredSliderField: FC<WiredSliderFieldProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    valueLabel,
    className,
}) =>
{
    const safeValue = Number.isFinite(value) ? value : min;
    const display = valueLabel ?? safeValue;

    return (
        <div className={ cn('space-y-2', className) }>
            <div className="flex items-center justify-between gap-3">
                <span className="text-label-sm text-text-strong-950">{ label }</span>
                <span className="rounded-md bg-bg-weak-50 px-2 py-1 text-paragraph-xs tabular-nums text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                    { display }
                </span>
            </div>
            <AlignSlider.Root
                min={ min }
                max={ max }
                step={ step }
                value={ [ safeValue ] }
                onValueChange={ v => onChange(v[0] ?? min) }
            >
                <AlignSlider.Thumb />
            </AlignSlider.Root>
        </div>
    );
}
