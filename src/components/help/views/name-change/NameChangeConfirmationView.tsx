import { ChangeUserNameMessageComposer, UserNameChangeMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { GetSessionDataManager, LocalizeText, SendMessageComposer } from '../../../../api';
import { useMessageEvent } from '../../../../hooks';
import { NameChangeLayoutViewProps } from './NameChangeView.types';
import * as AlignButton from '@/align-ui/components/ui/button';

export const NameChangeConfirmationView:FC<NameChangeLayoutViewProps> = props =>
{
    const { username = '', onAction = null } = props;
    const [ isConfirming, setIsConfirming ] = useState<boolean>(false);

    const confirm = () =>
    {
        if(isConfirming) return;

        setIsConfirming(true);
        SendMessageComposer(new ChangeUserNameMessageComposer(username));
    }
    
    useMessageEvent<UserNameChangeMessageEvent>(UserNameChangeMessageEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        if(parser.webId !== GetSessionDataManager().userId) return;

        onAction('close');
    });

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="rounded-xl bg-bg-weak-50 p-3 text-center text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                { LocalizeText('tutorial.name_change.info.confirm') }
            </div>
            <div className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl bg-bg-white-0 p-3 text-center shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                <div className="text-paragraph-xs text-text-sub-600">{ LocalizeText('tutorial.name_change.confirm') }</div>
                <div className="max-w-full truncate text-label-md text-text-strong-950">{ username }</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" disabled={ isConfirming } onClick={ confirm }>
                    { LocalizeText('generic.ok') }
                </AlignButton.Root>
                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" onClick={ () => onAction('close') }>
                    { LocalizeText('cancel') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
