import { FC, useEffect, useState } from 'react';
import { GetConfiguration, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import * as AlignInput from '@/align-ui/components/ui/input';
import { WiredSliderField } from '../WiredSliderField';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionMuteUserView: FC<{}> = props =>
{
    const [ time, setTime ] = useState(-1);
    const [ message, setMessage ] = useState('');
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = () =>
    {
        setIntParams([ time ]);
        setStringParam(message);
    }

    useEffect(() =>
    {
        setTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        setMessage(trigger.stringData);
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-3">
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.length.minutes', [ 'minutes' ], [ time.toString() ]) }
                    value={ time }
                    min={ 1 }
                    max={ 10 }
                    onChange={ setTime }
                />
                <div className="space-y-1.5">
                    <span className="text-label-sm text-text-strong-950">{ LocalizeText('wiredfurni.params.message') }</span>
                    <AlignInput.Root size="small">
                        <AlignInput.Wrapper>
                            <AlignInput.Input
                                value={ message }
                                onChange={ event => setMessage(event.target.value) }
                                maxLength={ GetConfiguration<number>('wired.action.mute.user.max.length', 100) }
                            />
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                </div>
            </div>
        </WiredActionBaseView>
    );
}
