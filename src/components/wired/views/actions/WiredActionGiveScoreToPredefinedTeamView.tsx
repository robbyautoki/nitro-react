import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { cn } from '@/lib/utils';
import { WiredSliderField } from '../WiredSliderField';
import { WiredActionBaseView } from './WiredActionBaseView';

const TEAM_IDS = [ 1, 2, 3, 4 ];

const TEAM_TONE: Record<number, string> = {
    1: 'bg-error-base text-static-white ring-error-base',
    2: 'bg-success-base text-static-white ring-success-base',
    3: 'bg-warning-base text-static-white ring-warning-base',
    4: 'bg-information-base text-static-white ring-information-base',
};

export const WiredActionGiveScoreToPredefinedTeamView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ time, setTime ] = useState(1);
    const [ selectedTeam, setSelectedTeam ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ points, time, selectedTeam ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setPoints(trigger.intData[0]);
            setTime(trigger.intData[1]);
            setSelectedTeam(trigger.intData[2]);
        }
        else
        {
            setPoints(1);
            setTime(1);
            setSelectedTeam(1);
        }
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-3">
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.setpoints', [ 'points' ], [ points.toString() ]) }
                    value={ points }
                    min={ 1 }
                    max={ 100 }
                    onChange={ setPoints }
                />
                <WiredSliderField
                    label={ LocalizeText('wiredfurni.params.settimesingame', [ 'times' ], [ time.toString() ]) }
                    value={ time }
                    min={ 1 }
                    max={ 10 }
                    onChange={ setTime }
                />
                <div className="space-y-1.5">
                    <span className="text-label-sm text-text-strong-950">{ LocalizeText('wiredfurni.params.team') }</span>
                    <div className="grid grid-cols-2 gap-2">
                        { TEAM_IDS.map(value => (
                            <button
                                key={ value }
                                type="button"
                                onClick={ () => setSelectedTeam(value) }
                                className={ cn(
                                    'rounded-lg px-3 py-2 text-label-xs ring-1 ring-inset transition-colors',
                                    selectedTeam === value
                                        ? `${ TEAM_TONE[value] } shadow-regular-xs`
                                        : 'bg-bg-white-0 text-text-sub-600 ring-stroke-soft-200 hover:bg-bg-weak-50',
                                ) }
                            >
                                { LocalizeText(`wiredfurni.params.team.${ value }`) }
                            </button>
                        )) }
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
}
