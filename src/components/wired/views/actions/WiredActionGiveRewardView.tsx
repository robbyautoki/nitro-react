import { FC, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { WiredSliderField } from '../WiredSliderField';
import { WiredActionBaseView } from './WiredActionBaseView';

interface RewardEntry
{
    isBadge: boolean;
    itemCode: string;
    probability: number;
}

export const WiredActionGiveRewardView: FC<{}> = props =>
{
    const [ limitEnabled, setLimitEnabled ] = useState(false);
    const [ rewardTime, setRewardTime ] = useState(0);
    const [ uniqueRewards, setUniqueRewards ] = useState(false);
    const [ rewardsLimit, setRewardsLimit ] = useState(1);
    const [ limitationInterval, setLimitationInterval ] = useState(1);
    const [ rewards, setRewards ] = useState<RewardEntry[]>([]);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const addReward = () => setRewards(rewards => [ ...rewards, { isBadge: false, itemCode: '', probability: null } ]);

    const removeReward = (index: number) =>
    {
        setRewards(prevValue =>
        {
            const newValues = Array.from(prevValue);
            newValues.splice(index, 1);
            return newValues;
        });
    }

    const updateReward = (index: number, isBadge: boolean, itemCode: string, probability: number) =>
    {
        const rewardsClone = Array.from(rewards);
        const reward = rewardsClone[index];
        if(!reward) return;
        reward.isBadge = isBadge;
        reward.itemCode = itemCode;
        reward.probability = probability;
        setRewards(rewardsClone);
    }

    const save = () =>
    {
        const stringRewards: string[] = [];

        for(const reward of rewards)
        {
            if(!reward.itemCode) continue;

            const rewardsString = [ reward.isBadge ? '0' : '1', reward.itemCode, reward.probability?.toString() ?? '0' ];
            stringRewards.push(rewardsString.join(','));
        }

        if(stringRewards.length > 0)
        {
            setStringParam(stringRewards.join(';'));
            setIntParams([ rewardTime, uniqueRewards ? 1 : 0, rewardsLimit, limitationInterval ]);
        }
    }

    useEffect(() =>
    {
        const readRewards: RewardEntry[] = [];

        if(trigger.stringData.length > 0 && trigger.stringData.includes(';'))
        {
            const splittedRewards = trigger.stringData.split(';');

            for(const rawReward of splittedRewards)
            {
                const reward = rawReward.split(',');
                if(reward.length !== 3) continue;
                readRewards.push({ isBadge: reward[0] === '0', itemCode: reward[1], probability: Number(reward[2]) });
            }
        }

        if(readRewards.length === 0) readRewards.push({ isBadge: false, itemCode: '', probability: null });

        setRewardTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        setUniqueRewards((trigger.intData.length > 1) ? (trigger.intData[1] === 1) : false);
        setRewardsLimit((trigger.intData.length > 2) ? trigger.intData[2] : 0);
        setLimitationInterval((trigger.intData.length > 3) ? trigger.intData[3] : 0);
        setLimitEnabled((trigger.intData.length > 3) ? trigger.intData[3] > 0 : false);
        setRewards(readRewards);
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                        <AlignCheckbox.Root checked={ limitEnabled } onCheckedChange={ checked => setLimitEnabled(!!checked) } />
                        <span className="text-label-sm text-text-strong-950">
                            { LocalizeText('wiredfurni.params.prizelimit', [ 'amount' ], [ limitEnabled ? rewardsLimit.toString() : '' ]) }
                        </span>
                    </label>
                    { !limitEnabled && (
                        <p className="rounded-lg bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-sub-600">
                            Belohnungslimit nicht gesetzt. Stelle sicher, dass die Belohnungen Badges oder nicht-handelbare Items sind.
                        </p>
                    ) }
                    { limitEnabled && (
                        <WiredSliderField
                            label="Anzahl Belohnungen"
                            value={ rewardsLimit }
                            min={ 1 }
                            max={ 1000 }
                            onChange={ setRewardsLimit }
                        />
                    ) }
                </div>

                <div className="border-t border-stroke-soft-200" />

                <div className="space-y-1.5">
                    <span className="text-label-sm text-text-strong-950">Wie oft kann ein User belohnt werden?</span>
                    <div className="flex gap-2">
                        <AlignSelect.Root size="small" value={ rewardTime.toString() } onValueChange={ value => setRewardTime(Number(value)) }>
                            <AlignSelect.Trigger>
                                <AlignSelect.Value />
                            </AlignSelect.Trigger>
                            <AlignSelect.Content>
                                <AlignSelect.Item value="0">Einmalig</AlignSelect.Item>
                                <AlignSelect.Item value="3">Alle { limitationInterval } Minuten</AlignSelect.Item>
                                <AlignSelect.Item value="2">Alle { limitationInterval } Stunden</AlignSelect.Item>
                                <AlignSelect.Item value="1">Alle { limitationInterval } Tage</AlignSelect.Item>
                            </AlignSelect.Content>
                        </AlignSelect.Root>
                        { rewardTime > 0 && (
                            <AlignInput.Root size="small" className="w-24 shrink-0">
                                <AlignInput.Wrapper>
                                    <AlignInput.Input
                                        type="number"
                                        value={ limitationInterval }
                                        onChange={ event => setLimitationInterval(Number(event.target.value)) }
                                    />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                        ) }
                    </div>
                </div>

                <div className="border-t border-stroke-soft-200" />

                <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                        <AlignCheckbox.Root checked={ uniqueRewards } onCheckedChange={ checked => setUniqueRewards(!!checked) } />
                        <span className="text-label-sm text-text-strong-950">Einzigartige Belohnungen</span>
                    </label>
                    <p className="rounded-lg bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-sub-600">
                        Wenn aktiviert, erhält jeder User jede Belohnung nur einmal. Die Wahrscheinlichkeitsoption wird dann deaktiviert.
                    </p>
                </div>

                <div className="border-t border-stroke-soft-200" />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-label-sm text-text-strong-950">Belohnungen</span>
                        <AlignButton.Root variant="primary" mode="filled" size="xxsmall" onClick={ addReward }>
                            <AlignButton.Icon as={ Plus } className="size-3.5" />
                            Hinzufügen
                        </AlignButton.Root>
                    </div>
                    <div className="space-y-2">
                        { rewards.map((reward, index) => (
                            <div key={ index } className="space-y-2 rounded-lg bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200">
                                <div className="flex items-center justify-between">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <AlignCheckbox.Root
                                            checked={ reward.isBadge }
                                            onCheckedChange={ checked => updateReward(index, !!checked, reward.itemCode, reward.probability) }
                                        />
                                        <span className="text-paragraph-xs text-text-sub-600">Badge?</span>
                                    </label>
                                    { index > 0 && (
                                        <AlignCompactButton.Root size="medium" variant="ghost" onClick={ () => removeReward(index) }>
                                            <AlignCompactButton.Icon as={ Trash2 } className="text-error-base" />
                                        </AlignCompactButton.Root>
                                    ) }
                                </div>
                                <AlignInput.Root size="small">
                                    <AlignInput.Wrapper>
                                        <AlignInput.Input
                                            placeholder="Item-Code"
                                            value={ reward.itemCode }
                                            onChange={ e => updateReward(index, reward.isBadge, e.target.value, reward.probability) }
                                        />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                                <AlignInput.Root size="small">
                                    <AlignInput.Wrapper>
                                        <AlignInput.Input
                                            type="number"
                                            placeholder="Wahrscheinlichkeit"
                                            value={ reward.probability ?? '' }
                                            onChange={ e => updateReward(index, reward.isBadge, reward.itemCode, Number(e.target.value)) }
                                        />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>
                        )) }
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
}
