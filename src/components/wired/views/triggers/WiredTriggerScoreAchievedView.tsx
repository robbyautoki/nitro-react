import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggeScoreAchievedView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ points ]);

    useEffect(() =>
    {
        setPoints((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredSliderField
                label={ LocalizeText('wiredfurni.params.setscore', [ 'points' ], [ points.toString() ]) }
                value={ points }
                min={ 1 }
                max={ 1000 }
                onChange={ setPoints }
            />
        </WiredTriggerBaseView>
    );
}
