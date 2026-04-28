import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionUserCountInRoomView: FC<{}> = props =>
{
    const [ min, setMin ] = useState(1);
    const [ max, setMax ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ min, max ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setMin(trigger.intData[0]);
            setMax(trigger.intData[1]);
        }
        else
        {
            setMin(1);
            setMax(1);
        }
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-3">
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.usercountmin', [ 'value' ], [ min.toString() ]) }
                    value={ min }
                    min={ 1 }
                    max={ 50 }
                    onChange={ setMin }
                />
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.usercountmax', [ 'value' ], [ max.toString() ]) }
                    value={ max }
                    min={ 1 }
                    max={ 50 }
                    onChange={ setMax }
                />
            </div>
        </WiredConditionBaseView>
    );
}
