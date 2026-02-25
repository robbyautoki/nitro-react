import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const TEAMS = [ 'Rot', 'Gruen', 'Blau', 'Gelb' ];

export const WiredSelectorTeamView: FC<{}> = () =>
{
    const [ teamId, setTeamId ] = useState(0);
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ teamId, filterExisting ? 1 : 0, invert ? 1 : 0 ]);

    useEffect(() =>
    {
        if (!trigger) return;
        const p = trigger.intData || [];
        if (p.length >= 3) { setTeamId(p[0]); setFilterExisting(p[1] === 1); setInvert(p[2] === 1); }
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView title="Users In Team" hasSpecialInput={ true } save={ save } showOptions={ false }>
            <Column gap={ 1 }>
                <Text bold small>Team waehlen</Text>
                <Flex gap={ 1 } wrap>
                    { TEAMS.map((name, i) => (
                        <Flex key={ i } alignItems="center" gap={ 1 }>
                            <input type="radio" name="team" checked={ teamId === i } onChange={ () => setTeamId(i) } />
                            <Text small>{ name }</Text>
                        </Flex>
                    )) }
                </Flex>
            </Column>
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
