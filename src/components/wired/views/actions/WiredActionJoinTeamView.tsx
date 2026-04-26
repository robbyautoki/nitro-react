import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionJoinTeamView: FC<{}> = props =>
{
    const [ selectedTeam, setSelectedTeam ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ selectedTeam ]);

    useEffect(() =>
    {
        setSelectedTeam((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-2">
                <div className="text-label-sm text-text-strong-950">{ LocalizeText('wiredfurni.params.team') }</div>
                <div className="grid grid-cols-2 gap-2">
                { [ 1, 2, 3, 4 ].map(team =>
                {
                    const isSelected = selectedTeam === team;

                    return (
                        <button
                            key={ team }
                            type="button"
                            className={ `flex items-center gap-2 rounded-xl px-3 py-2 text-left transition duration-200 ${ isSelected ? 'bg-primary-alpha-10 text-primary-base ring-1 ring-inset ring-primary-base' : 'bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200 hover:bg-bg-white-0 hover:text-text-strong-950' }` }
                            onClick={ () => setSelectedTeam(team) }
                        >
                            <span className={ `flex size-4 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${ isSelected ? 'ring-primary-base' : 'ring-stroke-sub-300' }` }>
                                { isSelected && <span className="size-2 rounded-full bg-primary-base" /> }
                            </span>
                            <span className="text-label-xs">{ LocalizeText(`wiredfurni.params.team.${ team }`) }</span>
                        </button>
                    )
                }) }
                </div>
            </div>
        </WiredActionBaseView>
    );
}
