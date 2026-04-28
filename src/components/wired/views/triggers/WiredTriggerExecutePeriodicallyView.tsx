import { FC, useEffect, useState } from 'react';
import { GetWiredTimeLocale, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggeExecutePeriodicallyView: FC<{}> = props =>
{
    const [ time, setTime ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ time ]);

    useEffect(() =>
    {
        setTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredSliderField
                label={ LocalizeText('wiredfurni.params.settime', [ 'seconds' ], [ GetWiredTimeLocale(time) ]) }
                value={ time }
                min={ 0 }
                max={ 60 }
                onChange={ setTime }
                valueLabel={ GetWiredTimeLocale(time) }
            />
        </WiredTriggerBaseView>
    );
}
