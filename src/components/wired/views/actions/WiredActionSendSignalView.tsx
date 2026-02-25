import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionSendSignalView: FC<{}> = props =>
{
    const [ signalName, setSignalName ] = useState('');
    const { trigger = null, setStringParam = null } = useWired();

    const save = () => setStringParam(signalName);

    useEffect(() =>
    {
        setSignalName(trigger.stringData);
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold>Signalname</Text>
                <input type="text" className="form-control form-control-sm" value={ signalName } onChange={ event => setSignalName(event.target.value) } maxLength={ 64 } />
            </Column>
        </WiredActionBaseView>
    );
}
