import { GuideSessionRequesterCancelsMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { Loader2 } from 'lucide-react';
import { SendMessageComposer } from '../../../api';

interface GuideToolUserPendingViewProps
{
    helpRequestDescription: string;
    helpRequestAverageTime: number;
}

export const GuideToolUserPendingView: FC<GuideToolUserPendingViewProps> = props =>
{
    const { helpRequestDescription = null, helpRequestAverageTime = 0 } = props;

    const cancelRequest = () => SendMessageComposer(new GuideSessionRequesterCancelsMessageComposer());

    return (
        <div className="flex flex-col gap-3">
            {/* Anfrage-Zusammenfassung */}
            <div className="rounded-lg border border-border/40 bg-muted/50 p-3">
                <span className="text-xs font-semibold text-foreground block mb-1">Deine Anfrage</span>
                <p className="text-sm text-foreground/70 break-words">{ helpRequestDescription }</p>
            </div>

            {/* Warten-Indikator */}
            <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">In der Warteschlange</span>
                    <span className="text-[12px] text-muted-foreground">Ein Teammitglied wird sich gleich um dich kümmern.</span>
                </div>
                { helpRequestAverageTime > 0 && (
                    <span className="text-[11px] text-muted-foreground/70">
                        Geschätzte Wartezeit: ~{ helpRequestAverageTime } Min.
                    </span>
                ) }
            </div>

            {/* Abbrechen */}
            <button
                className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                onClick={ cancelRequest }
            >
                Anfrage abbrechen
            </button>
        </div>
    );
};
