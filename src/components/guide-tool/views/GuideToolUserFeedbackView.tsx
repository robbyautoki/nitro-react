import { GuideSessionFeedbackMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { SendMessageComposer } from '../../../api';

interface GuideToolUserFeedbackViewProps
{
    userName: string;
}

export const GuideToolUserFeedbackView: FC<GuideToolUserFeedbackViewProps> = props =>
{
    const { userName = null } = props;

    const giveFeedback = (recommend: boolean) => SendMessageComposer(new GuideSessionFeedbackMessageComposer(recommend));

    return (
        <div className="flex flex-col gap-3">
            {/* Gesprächs-Info */}
            <div className="rounded-lg border border-border/40 bg-muted/50 p-3">
                <span className="text-sm font-semibold text-foreground block">{ userName }</span>
                <span className="text-[12px] text-muted-foreground">Das Gespräch wurde beendet.</span>
            </div>

            {/* Bewertung */}
            { userName && userName.length > 0 && (
                <>
                    <div className="h-px bg-border/40" />

                    <div className="text-center">
                        <span className="text-sm font-semibold text-foreground block mb-1">Wie war die Hilfe?</span>
                        <span className="text-[12px] text-muted-foreground">Würdest du diesen Helfer weiterempfehlen?</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-primary-foreground text-sm font-medium hover:bg-green-500 transition-colors"
                            onClick={ () => giveFeedback(true) }
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Ja
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                            onClick={ () => giveFeedback(false) }
                        >
                            <ThumbsDown className="w-4 h-4" />
                            Nein
                        </button>
                    </div>
                </>
            ) }
        </div>
    );
};
