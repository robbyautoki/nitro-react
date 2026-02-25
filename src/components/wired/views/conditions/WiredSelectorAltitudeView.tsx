import { FC, useEffect, useState } from 'react';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

export const WiredSelectorAltitudeView: FC<{}> = () =>
{
    const [ minAlt, setMinAlt ] = useState(0);
    const [ maxAlt, setMaxAlt ] = useState(100);
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ minAlt, maxAlt, filterExisting ? 1 : 0, invert ? 1 : 0 ]);

    useEffect(() =>
    {
        if (!trigger) return;
        const p = trigger.intData || [];
        if (p.length >= 4) { setMinAlt(p[0]); setMaxAlt(p[1]); setFilterExisting(p[2] === 1); setInvert(p[3] === 1); }
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView title="Furni Altitude" hasSpecialInput={ true } save={ save } showOptions={ false }>
            <Flex gap={ 2 }>
                <Column gap={ 1 }>
                    <Text small>Min Hoehe (x100)</Text>
                    <input type="number" className="form-control form-control-sm" style={{ width: 80 }} value={ minAlt } onChange={ e => setMinAlt(parseInt(e.target.value) || 0) } />
                </Column>
                <Column gap={ 1 }>
                    <Text small>Max Hoehe (x100)</Text>
                    <input type="number" className="form-control form-control-sm" style={{ width: 80 }} value={ maxAlt } onChange={ e => setMaxAlt(parseInt(e.target.value) || 0) } />
                </Column>
            </Flex>
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
