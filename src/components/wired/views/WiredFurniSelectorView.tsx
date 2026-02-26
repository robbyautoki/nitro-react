import { FC, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../api';
import { Column, Flex, Text } from '../../../common';
import { useWired } from '../../../hooks';

const STUFF_SELECTION_LABELS = [
    'Ausgewählte Möbel nehmen',
    'Möbel vom Signal nehmen',
    'Möbel vom Selektor nehmen'
];

export const WiredFurniSelectorView: FC<{}> = props =>
{
    const { trigger = null, furniIds = [], allowsFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE } = useWired();
    const [ showAdvanced, setShowAdvanced ] = useState(false);

    const currentCode = trigger?.stuffTypeSelectionCode ?? 0;

    const cycleSelection = (direction: number) =>
    {
        if(!trigger) return;
        const maxOptions = STUFF_SELECTION_LABELS.length;
        let next = currentCode + direction;
        if(next < 0) next = maxOptions - 1;
        if(next >= maxOptions) next = 0;
        trigger.stuffTypeSelectionCode = next;
    };

    const showSourcePicker = allowsFurni >= WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT;

    return (
        <Column gap={ 1 }>
            <Text bold>{ LocalizeText('wiredfurni.pickfurnis.caption', [ 'count', 'limit' ], [ furniIds.length.toString(), trigger.maximumItemSelectionCount.toString() ]) }</Text>
            <Text small>{ LocalizeText('wiredfurni.pickfurnis.desc') }</Text>
            { showSourcePicker &&
                <Column gap={ 1 } className="mt-1">
                    <Text small pointer underline className="text-center" onClick={ () => setShowAdvanced(prev => !prev) }>
                        { showAdvanced ? 'Erweiterte Einstellungen ausblenden:' : 'Erweiterte Einstellungen anzeigen:' }
                    </Text>
                    { showAdvanced &&
                        <Column gap={ 1 }>
                            <Text bold small>Möbelquelle auswählen:</Text>
                            <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                                <Text pointer bold className="px-1" onClick={ () => cycleSelection(-1) }>&lt;</Text>
                                <Text small center className="flex-grow-1">{ STUFF_SELECTION_LABELS[currentCode] || STUFF_SELECTION_LABELS[0] }</Text>
                                <Text pointer bold className="px-1" onClick={ () => cycleSelection(1) }>&gt;</Text>
                            </Flex>
                        </Column> }
                </Column> }
        </Column>
    );
}
