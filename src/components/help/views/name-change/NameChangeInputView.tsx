import { CheckUserNameMessageComposer, CheckUserNameResultMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { useMessageEvent } from '../../../../hooks';
import { NameChangeLayoutViewProps } from './NameChangeView.types';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import { cn } from '@/align-ui/utils/cn';

const AVAILABLE: number = 0;
const TOO_SHORT: number = 2;
const TOO_LONG: number = 3;
const NOT_VALID: number = 4;
const TAKEN_WITH_SUGGESTIONS: number = 5;
const DISABLED: number = 6;

export const NameChangeInputView:FC<NameChangeLayoutViewProps> = props =>
{
    const { onAction = null } = props;
    const [ newUsername, setNewUsername ] = useState<string>('');
    const [ canProceed, setCanProceed ] = useState<boolean>(false);
    const [ isChecking, setIsChecking ] = useState<boolean>(false);
    const [ errorCode, setErrorCode ] = useState<string>(null);
    const [ suggestions, setSuggestions ] = useState<string[]>([]);

    const check = () =>
    {
        if(newUsername === '') return;

        setCanProceed(false);
        setSuggestions([]);
        setErrorCode(null);
        setIsChecking(true);

        SendMessageComposer(new CheckUserNameMessageComposer(newUsername));
    }

    const handleUsernameChange = (username: string) =>
    {
        setCanProceed(false);
        setSuggestions([]);
        setErrorCode(null);
        setNewUsername(username);
    }
    
    useMessageEvent<CheckUserNameResultMessageEvent>(CheckUserNameResultMessageEvent, event =>
    {
        setIsChecking(false);

        const parser = event.getParser();

        if(!parser) return;

        switch(parser.resultCode)
        {
            case AVAILABLE:
                setCanProceed(true);
                break;
            case TOO_SHORT:
                setErrorCode('short');
                break;
            case TOO_LONG:
                setErrorCode('long');
                break;
            case NOT_VALID:
                setErrorCode('invalid');
                break;
            case TAKEN_WITH_SUGGESTIONS:
                setSuggestions(parser.nameSuggestions);
                setErrorCode('taken');
                break;
            case DISABLED:
                setErrorCode('change_not_allowed');
        }
    });

    return (
        <div className="flex h-full flex-col gap-3">
            <div className="rounded-xl bg-bg-weak-50 p-3 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                { LocalizeText('tutorial.name_change.info.select') }
            </div>
            <div className="flex gap-2">
                <AlignInput.Root size="xsmall" className="min-w-0 flex-1" hasError={ !!errorCode }>
                    <AlignInput.Wrapper className="h-9">
                        <AlignInput.Input
                            className="h-9 text-paragraph-sm"
                            value={ newUsername }
                            onChange={ event => handleUsernameChange(event.target.value) }
                        />
                    </AlignInput.Wrapper>
                </AlignInput.Root>
                <AlignButton.Root type="button" variant="primary" mode="stroke" size="small" disabled={ newUsername === '' || isChecking } onClick={ check }>
                    { LocalizeText('tutorial.name_change.check') }
                </AlignButton.Root>
            </div>
            { !errorCode && !canProceed &&
                <div className="rounded-xl bg-bg-weak-50 p-3 text-center text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">{ LocalizeText('help.tutorial.name.info') }</div> }
            { errorCode &&
                <div className="rounded-xl bg-error-lighter p-3 text-center text-paragraph-xs text-error-base ring-1 ring-inset ring-error-light">{ LocalizeText(`help.tutorial.name.${ errorCode }`, [ 'name' ], [ newUsername ]) }</div> }
            { canProceed &&
                <div className="rounded-xl bg-success-lighter p-3 text-center text-paragraph-xs text-success-base ring-1 ring-inset ring-success-light">{ LocalizeText('help.tutorial.name.available', [ 'name' ], [ newUsername ]) }</div> }
            { suggestions &&
                <div className="flex flex-col gap-2">
                    { suggestions.map((suggestion, index) =>
                        <AlignButton.Root
                            key={ index }
                            type="button"
                            variant="neutral"
                            mode="stroke"
                            size="small"
                            className={ cn('h-9 w-full justify-start text-paragraph-sm') }
                            onClick={ () => handleUsernameChange(suggestion) }
                        >
                            { suggestion }
                        </AlignButton.Root>) }
                </div> }
            <div className="grid grid-cols-2 gap-2">
                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" disabled={ !canProceed } onClick={ () => onAction('confirmation', newUsername) }>
                    { LocalizeText('tutorial.name_change.pick') }
                </AlignButton.Root>
                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" onClick={ () => onAction('close') }>
                    { LocalizeText('cancel') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
