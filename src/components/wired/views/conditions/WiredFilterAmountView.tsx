import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredFilterAmountView: FC<{ title: string }> = ({ title }) =>
{
    const [ maxCount, setMaxCount ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ maxCount ]);

    useEffect(() =>
    {
        if (!trigger) return;
        const p = trigger.intData || [];
        if (p.length >= 1) setMaxCount(p[0]);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold small>Maximale Anzahl: { maxCount }</Text>
                <input type="range" className="form-range" min={ 1 } max={ 50 } value={ maxCount } onChange={ e => setMaxCount(parseInt(e.target.value)) } />
            </Column>
        </WiredConditionBaseView>
    );
}
