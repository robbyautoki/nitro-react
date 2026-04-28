import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSliderField } from '../WiredSliderField';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionRandomChanceView: FC<{}> = props =>
{
    const [ chance, setChance ] = useState(50);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ chance ]);

    useEffect(() =>
    {
        setChance((trigger.intData.length > 0) ? trigger.intData[0] : 50);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredSliderField
                label="Chance"
                value={ chance }
                min={ 1 }
                max={ 100 }
                onChange={ setChance }
                valueLabel={ `${ chance }%` }
            />
        </WiredConditionBaseView>
    );
}
