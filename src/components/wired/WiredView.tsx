import { ConditionDefinition, TriggerDefinition, WiredActionDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { GetNitroInstance } from '../../api';
import { useWired } from '../../hooks';
import { WiredActionLayoutView } from './views/actions/WiredActionLayoutView';
import { WiredConditionLayoutView } from './views/conditions/WiredConditionLayoutView';
import { WiredTriggerLayoutView } from './views/triggers/WiredTriggerLayoutView';

let _wiredTextsRegistered = false;

const registerWiredTexts = () =>
{
    if(_wiredTextsRegistered) return;
    _wiredTextsRegistered = true;

    const loc = GetNitroInstance()?.localization;
    if(!loc) return;

    loc.setValue('wf_trg_recv_signal', 'Signal empfangen');
    loc.setValue('wf_trg_recv_signal desc', 'Wird ausgelöst, wenn ein Signal an die ausgewählten Möbel gesendet wird.');
    loc.setValue('wf_act_send_signal', 'Signal senden');
    loc.setValue('wf_act_send_signal desc', 'Sendet ein Signal an die ausgewählten Möbel.');
};

export const WiredView: FC<{}> = props =>
{
    const { trigger = null } = useWired();

    useEffect(() => { registerWiredTexts(); }, []);

    if(!trigger) return null;

    if(trigger instanceof WiredActionDefinition) return WiredActionLayoutView(trigger.code);

    if(trigger instanceof TriggerDefinition) return WiredTriggerLayoutView(trigger.code);
    
    if(trigger instanceof ConditionDefinition) return WiredConditionLayoutView(trigger.code);
    
    return null;
};
