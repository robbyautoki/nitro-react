import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Button, Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { useWiredTileSelection } from './useWiredTileSelection';
import { WiredTileHighlightOverlay } from './WiredTileHighlightOverlay';

export const WiredSelectorAreaView: FC<{ title: string }> = ({ title }) =>
{
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const { selectedTiles, isSelecting, startSelecting, stopSelecting, clearTiles, setTilesFromString, tilesToString, tileCount } = useWiredTileSelection();

    const save = () =>
    {
        if (isSelecting) stopSelecting();
        setStringParam(tilesToString());
        setIntParams([ filterExisting ? 1 : 0, invert ? 1 : 0 ]);
    };

    useEffect(() =>
    {
        if (!trigger) return;
        const str = trigger.stringData || '';
        setTilesFromString(str);
        const p = trigger.intData || [];
        if (p.length >= 2) 
        {
            setFilterExisting(p[0] === 1);
            setInvert(p[1] === 1);
        }
    }, [ trigger, setTilesFromString ]);

    useEffect(() =>
    {
        return () => 
        {
            stopSelecting(); 
        };
    }, [ stopSelecting ]);

    const toggleSelecting = () =>
    {
        if (isSelecting) stopSelecting();
        else startSelecting();
    };

    return (
        <>
            <WiredTileHighlightOverlay selectedTiles={ selectedTiles } active={ isSelecting } />
            <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
                <Column gap={ 1 }>
                    <Text bold small>Bereichsauswahl</Text>
                    <Text small>
                        Um einen Bereich auszuwählen, klicke einfach auf den
                        „Bereich wählen“ Button und markiere dann mit
                        deinen Cursor den gewünschten Bereich im Raum.
                    </Text>
                    { tileCount > 0 && <Text small className="text-muted">{ tileCount } Felder ausgewählt</Text> }
                    <Flex gap={ 1 }>
                        <Button variant={ isSelecting ? 'danger' : 'success' } onClick={ toggleSelecting }>
                            { isSelecting ? 'Fertig' : 'Bereich wählen' }
                        </Button>
                        <Button variant="secondary" onClick={ clearTiles }>Löschen</Button>
                    </Flex>
                </Column>
                <Column gap={ 1 }>
                    <Text bold small>Selektor-Optionen:</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" checked={ filterExisting } onChange={ e => setFilterExisting(e.target.checked) } />
                        <Text small>Vorhandene Auswahl filtern</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                        <Text small>Umkehren</Text>
                    </Flex>
                </Column>
            </WiredConditionBaseView>
        </>
    );
}
