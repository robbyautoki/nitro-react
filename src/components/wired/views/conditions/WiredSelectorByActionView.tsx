import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

export const WiredSelectorByActionView: FC<{}> = () =>
{
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ filterExisting ? 1 : 0, invert ? 1 : 0 ]);

    useEffect(() =>
    {
        if (!trigger) return;
        const p = trigger.intData || [];
        if (p.length >= 2) { setFilterExisting(p[0] === 1); setInvert(p[1] === 1); }
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView title="Users By Action" hasSpecialInput={ true } save={ save } showOptions={ false }>
            <Column gap={ 1 }>
                <Text bold small>Selector Optionen:</Text>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" checked={ filterExisting } onChange={ e => setFilterExisting(e.target.checked) } />
                    <Text small>Bestehende Selektion filtern</Text>
                </Flex>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                    <Text small>Invertieren</Text>
                </Flex>
            </Column>
        </WiredSelectorBaseView>
    );
}
