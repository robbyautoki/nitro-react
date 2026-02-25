import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredFilterByVarView: FC<{ title: string }> = ({ title }) =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ sortOrder, setSortOrder ] = useState(0);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = () => { setStringParam(variableName); setIntParams([ sortOrder ]); };

    useEffect(() =>
    {
        if (!trigger) return;
        setVariableName(trigger.stringData || '');
        const p = trigger.intData || [];
        if (p.length >= 1) setSortOrder(p[0]);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold small>Variable Name</Text>
                <input type="text" className="form-control form-control-sm" value={ variableName } onChange={ e => setVariableName(e.target.value) } placeholder="Variable eingeben" />
            </Column>
            <Column gap={ 1 }>
                <Text bold small>Sortierung</Text>
                <Flex gap={ 2 }>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" name="sort" checked={ sortOrder === 0 } onChange={ () => setSortOrder(0) } />
                        <Text small>Hoechster Wert</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" name="sort" checked={ sortOrder === 1 } onChange={ () => setSortOrder(1) } />
                        <Text small>Niedrigster Wert</Text>
                    </Flex>
                </Flex>
            </Column>
            <Text small className="text-muted">Benoeigt Wired Variable System (Platzhalter)</Text>
        </WiredConditionBaseView>
    );
}
