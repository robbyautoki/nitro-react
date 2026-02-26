import { GuideSessionCreateMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { SendMessageComposer } from '../../../api';

interface GuideToolUserCreateRequestViewProps
{
    userRequest: string;
    setUserRequest: (value: string) => void;
}

const MIN_REQUEST_LENGTH: number = 15;

export const GuideToolUserCreateRequestView: FC<GuideToolUserCreateRequestViewProps> = props =>
{
    const { userRequest = '', setUserRequest = null } = props;
    const [ isPending, setIsPending ] = useState<boolean>(false);

    const sendRequest = () =>
    {
        setIsPending(true);
        SendMessageComposer(new GuideSessionCreateMessageComposer(1, userRequest));
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <span className="text-sm font-semibold text-foreground block mb-1">Wie können wir dir helfen?</span>
                <span className="text-[12px] text-muted-foreground">Beschreibe dein Anliegen und ein Teammitglied wird sich darum kümmern.</span>
            </div>

            <div className="relative">
                <textarea
                    className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors resize-none"
                    maxLength={ 140 }
                    value={ userRequest }
                    onChange={ event => setUserRequest(event.target.value) }
                    placeholder="Beschreibe dein Problem..."
                />
                <span className={ `absolute bottom-2 right-2.5 text-[10px] ${ userRequest.length < MIN_REQUEST_LENGTH ? 'text-muted-foreground/40' : 'text-muted-foreground' }` }>
                    { userRequest.length }/140
                </span>
            </div>

            { userRequest.length > 0 && userRequest.length < MIN_REQUEST_LENGTH && (
                <span className="text-[11px] text-amber-400/80">Mindestens { MIN_REQUEST_LENGTH } Zeichen nötig</span>
            ) }

            <button
                className="w-full py-2.5 rounded-lg bg-green-600 text-primary-foreground text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={ (userRequest.length < MIN_REQUEST_LENGTH) || isPending }
                onClick={ sendRequest }
            >
                { isPending ? 'Wird gesendet...' : 'Anfrage senden' }
            </button>
        </div>
    );
};
