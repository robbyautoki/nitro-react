import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
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
            <Column gap={ 1 }>
                <Text bold>{ `Chance: ${ chance }%` }</Text>
                <ReactSlider
                    className={ 'nitro-slider' }
                    min={ 1 }
                    max={ 100 }
                    value={ chance }
                    onChange={ event => setChance(event) } />
            </Column>
        </WiredConditionBaseView>
    );
}
