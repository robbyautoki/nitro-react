import { FC } from 'react';
import { Users, Shield, HelpCircle } from 'lucide-react';

interface GuideToolMenuViewProps
{
    isOnDuty: boolean;
    isHandlingGuideRequests: boolean;
    setIsHandlingGuideRequests: (value: boolean) => void;
    isHandlingHelpRequests: boolean;
    setIsHandlingHelpRequests: (value: boolean) => void;
    isHandlingBullyReports: boolean;
    setIsHandlingBullyReports: (value: boolean) => void;
    guidesOnDuty: number;
    helpersOnDuty: number;
    guardiansOnDuty: number;
    processAction: (action: string) => void;
}

export const GuideToolMenuView: FC<GuideToolMenuViewProps> = props =>
{
    const {
        isOnDuty = false,
        isHandlingGuideRequests = false,
        setIsHandlingGuideRequests = null,
        isHandlingHelpRequests = false,
        setIsHandlingHelpRequests = null,
        isHandlingBullyReports = false,
        setIsHandlingBullyReports = null,
        guidesOnDuty = 0,
        helpersOnDuty = 0,
        guardiansOnDuty = 0,
        processAction = null
    } = props;

    return (
        <div className="flex flex-col gap-3">
            {/* Duty-Toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/50 p-3">
                <button
                    className={ `relative w-10 h-5 rounded-full transition-colors ${ isOnDuty ? 'bg-green-500' : 'bg-muted-foreground/30' }` }
                    onClick={ () => processAction('toggle_duty') }
                >
                    <span className={ `absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${ isOnDuty ? 'left-[22px]' : 'left-0.5' }` } />
                </button>
                <div>
                    <span className="text-sm font-semibold text-foreground block">Dein Status</span>
                    <span className={ `text-[11px] font-medium ${ isOnDuty ? 'text-green-500' : 'text-muted-foreground' }` }>
                        { isOnDuty ? 'Im Dienst' : 'Nicht im Dienst' }
                    </span>
                </div>
            </div>

            {/* Queue-Auswahl */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Warteschlangen</span>
                <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/30 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        disabled={ isOnDuty }
                        checked={ isHandlingGuideRequests }
                        onChange={ e => setIsHandlingGuideRequests(e.target.checked) }
                        className="w-3.5 h-3.5 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-foreground/80">Guide-Anfragen</span>
                </label>
                <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/30 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        disabled={ isOnDuty }
                        checked={ isHandlingHelpRequests }
                        onChange={ e => setIsHandlingHelpRequests(e.target.checked) }
                        className="w-3.5 h-3.5 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-foreground/80">Hilfe-Anfragen</span>
                </label>
                <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/30 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        disabled={ isOnDuty }
                        checked={ isHandlingBullyReports }
                        onChange={ e => setIsHandlingBullyReports(e.target.checked) }
                        className="w-3.5 h-3.5 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-foreground/80">Mobbing-Meldungen</span>
                </label>
            </div>

            {/* Separator */}
            <div className="h-px bg-border/40" />

            {/* Online-Statistiken */}
            <div className="flex flex-col gap-1.5 px-1">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{ guidesOnDuty }</strong> Guides im Dienst</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{ helpersOnDuty }</strong> Helfer im Dienst</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{ guardiansOnDuty }</strong> Wächter im Dienst</span>
                </div>
            </div>
        </div>
    );
}
