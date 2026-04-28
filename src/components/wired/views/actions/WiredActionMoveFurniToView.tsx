import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { cn } from '@/lib/utils';
import { WiredSliderField } from '../WiredSliderField';
import { WiredActionBaseView } from './WiredActionBaseView';

const directionOptions: { value: number, icon: string }[] = [
    {
        value: 0,
        icon: 'ne'
    },
    {
        value: 2,
        icon: 'se'
    },
    {
        value: 4,
        icon: 'sw'
    },
    {
        value: 6,
        icon: 'nw'
    }
];

export const WiredActionMoveFurniToView: FC<{}> = props =>
{
    const [ spacing, setSpacing ] = useState(-1);
    const [ movement, setMovement ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ movement, spacing ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setSpacing(trigger.intData[1]);
            setMovement(trigger.intData[0]);
        }
        else
        {
            setSpacing(-1);
            setMovement(-1);
        }
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-3">
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.emptytiles', [ 'tiles' ], [ spacing.toString() ]) }
                    value={ spacing }
                    min={ 1 }
                    max={ 5 }
                    onChange={ setSpacing }
                />
                <div className="space-y-1.5">
                    <span className="text-label-sm text-text-strong-950">{ LocalizeText('wiredfurni.params.startdir') }</span>
                    <div className="flex flex-wrap gap-2">
                        { directionOptions.map(option => (
                            <button
                                key={ option.value }
                                type="button"
                                onClick={ () => setMovement(option.value) }
                                className={ cn(
                                    'flex size-9 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
                                    movement === option.value
                                        ? 'bg-primary-base text-static-white ring-primary-base shadow-regular-xs'
                                        : 'bg-bg-white-0 text-text-sub-600 ring-stroke-soft-200 hover:bg-bg-weak-50',
                                ) }
                                aria-label={ option.icon }
                            >
                                <i className={ `icon icon-${ option.icon }` } />
                            </button>
                        )) }
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
}
