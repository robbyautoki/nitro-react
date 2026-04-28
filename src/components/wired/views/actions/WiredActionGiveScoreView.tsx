import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionGiveScoreView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ time, setTime ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ points, time ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setPoints(trigger.intData[0]);
            setTime(trigger.intData[1]);
        }
        else
        {
            setPoints(1);
            setTime(1);
        }
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-3">
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.setpoints', [ 'points' ], [ points.toString() ]) }
                    value={ points }
                    min={ 1 }
                    max={ 100 }
                    onChange={ setPoints }
                />
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.settimesingame', [ 'times' ], [ time.toString() ]) }
                    value={ time }
                    min={ 1 }
                    max={ 10 }
                    onChange={ setTime }
                />
            </div>
        </WiredActionBaseView>
    );
}
