import { GuideSessionGuideDecidesMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { MessageCircle } from 'lucide-react';
import { LocalizeText, SendMessageComposer } from '../../../api';

interface GuideToolAcceptViewProps
{
    helpRequestDescription: string;
    helpRequestAverageTime: number;
}

export const GuideToolAcceptView: FC<GuideToolAcceptViewProps> = props =>
{
    const { helpRequestDescription = null, helpRequestAverageTime = 0 } = props;

    const answerRequest = (response: boolean) => SendMessageComposer(new GuideSessionGuideDecidesMessageComposer(response));

    return (
        <div className="flex flex-col gap-3">
            {/* Anfrage-Anzeige */}
            <div className="rounded-lg border border-border/40 bg-muted/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">Neue Supportanfrage</span>
                </div>
                <span className="text-[11px] text-muted-foreground block mb-1.5">{ LocalizeText('guide.help.request.type.1') }</span>
                <p className="text-sm text-foreground/80 break-words leading-relaxed">{ helpRequestDescription }</p>
            </div>

            {/* Aktions-Buttons */}
            <div className="flex flex-col gap-2">
                <button
                    className="w-full py-2.5 rounded-lg bg-green-600 text-primary-foreground text-sm font-medium hover:bg-green-500 transition-colors"
                    onClick={ () => answerRequest(true) }
                >
                    Anfrage annehmen
                </button>
                <button
                    className="w-full py-2 rounded-lg border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
                    onClick={ () => answerRequest(false) }
                >
                    Überspringen
                </button>
            </div>
        </div>
    );
};
