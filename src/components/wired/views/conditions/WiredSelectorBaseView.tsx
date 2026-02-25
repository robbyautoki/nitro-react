import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export interface WiredSelectorBaseViewProps
{
    title: string;
    requiresFurni?: number;
    hasSpecialInput?: boolean;
    save: () => void;
    showOptions?: boolean;
}

export const WiredSelectorBaseView: FC<PropsWithChildren<WiredSelectorBaseViewProps>> = props =>
{
    const { title = '', requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, hasSpecialInput = true, save = null, showOptions = true, children = null } = props;

    return (
        <WiredConditionBaseView requiresFurni={ requiresFurni } hasSpecialInput={ hasSpecialInput } save={ save }>
            { children }
            { showOptions && <WiredSelectorOptions /> }
        </WiredConditionBaseView>
    );
}

export const WiredSelectorOptions: FC<{}> = () =>
{
    const { trigger = null, intParams = [], setIntParams = null } = useWired();
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert, setInvert ] = useState(false);

    useEffect(() =>
    {
        if (!trigger) return;
        const p = trigger.intData || [];
        if (p.length >= 2) {
            setFilterExisting(p[p.length - 2] === 1);
            setInvert(p[p.length - 1] === 1);
        }
    }, [ trigger ]);

    return (
        <Column gap={ 1 }>
            <Text bold small>Selector Optionen:</Text>
            <Flex alignItems="center" gap={ 1 }>
                <input type="checkbox" id="slc-filter" checked={ filterExisting } onChange={ e => setFilterExisting(e.target.checked) } />
                <label htmlFor="slc-filter" className="small">Bestehende Selektion filtern</label>
            </Flex>
            <Flex alignItems="center" gap={ 1 }>
                <input type="checkbox" id="slc-invert" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                <label htmlFor="slc-invert" className="small">Invertieren</label>
            </Flex>
        </Column>
    );
}
