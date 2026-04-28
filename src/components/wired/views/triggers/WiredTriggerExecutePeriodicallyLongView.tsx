import { FriendlyTime } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggeExecutePeriodicallyLongView: FC<{}> = props =>
{
    const [ time, setTime ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ time ]);

    useEffect(() =>
    {
        setTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    const formatted = FriendlyTime.format(time * 5).toString();

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredSliderField
                label={ LocalizeText('wiredfurni.params.setlongtime', [ 'time' ], [ formatted ]) }
                value={ time }
                min={ 1 }
                max={ 120 }
                onChange={ setTime }
                valueLabel={ formatted }
            />
        </WiredTriggerBaseView>
    );
}
