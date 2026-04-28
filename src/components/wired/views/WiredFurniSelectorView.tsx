import { FC, useEffect, useState } from 'react';
import { Hand, MousePointerClick, Package, Radio } from 'lucide-react';
import { WiredFurniType } from '../../../api';
import { useWired } from '../../../hooks';
import { cn } from '@/lib/utils';

type SelectionOption = {
    label: string;
    icon: typeof Hand;
};

const STUFF_SELECTION_OPTIONS: SelectionOption[] = [
    { label: 'Ausgewählte', icon: MousePointerClick },
    { label: 'Vom Signal', icon: Radio },
    { label: 'Vom Selektor', icon: Package }
];

export const WiredFurniSelectorView: FC<{}> = props =>
{
    const { trigger = null, furniIds = [], allowsFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE } = useWired();
    const [ selectionCode, setSelectionCode ] = useState(0);

    useEffect(() =>
    {
        if(trigger) setSelectionCode(trigger.stuffTypeSelectionCode ?? 0);
    }, [ trigger ]);

    const handleSelect = (index: number) =>
    {
        if(!trigger) return;
        trigger.stuffTypeSelectionCode = index;
        setSelectionCode(index);
    };

    const showSourcePicker = allowsFurni >= WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT;
    const limit = trigger?.maximumItemSelectionCount ?? 0;
    const count = furniIds.length;
    const isEmpty = count === 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-label-sm text-text-strong-950">
                    <Hand className="size-4 text-text-sub-600" />
                    Möbelauswahl
                </div>
                { isEmpty
                    ? <span className="rounded-full bg-warning-lighter px-2 py-0.5 text-paragraph-xs font-medium text-warning-base">
                        Erforderlich
                    </span>
                    : <span className="rounded-full bg-bg-weak-50 px-2 py-0.5 text-paragraph-xs tabular-nums text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                        { count }/{ limit }
                    </span>
                }
            </div>
            <p className="text-paragraph-xs leading-5 text-text-sub-600">
                { isEmpty
                    ? 'Klicke Möbel im Raum an, um sie auszuwählen.'
                    : `${ count } von ${ limit } Möbeln gewählt.` }
            </p>
            { showSourcePicker && (
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-bg-weak-50 p-1 ring-1 ring-inset ring-stroke-soft-200">
                    { STUFF_SELECTION_OPTIONS.map((option, index) =>
                    {
                        const Icon = option.icon;
                        const active = selectionCode === index;
                        return (
                            <button
                                key={ index }
                                type="button"
                                onClick={ () => handleSelect(index) }
                                className={ cn(
                                    'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-paragraph-xs font-medium transition',
                                    active
                                        ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs'
                                        : 'text-text-sub-600 hover:text-text-strong-950'
                                ) }
                            >
                                <Icon className="size-3.5" />
                                { option.label }
                            </button>
                        );
                    }) }
                </div>
            ) }
        </div>
    );
}
