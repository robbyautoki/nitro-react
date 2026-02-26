import { FC } from 'react';
import { UserX } from 'lucide-react';

export const GuideToolUserNoHelpersView: FC<{}> = () =>
{
    return (
        <div className="flex flex-col items-center gap-3 py-4">
            <UserX className="w-10 h-10 text-amber-400" />
            <div className="text-center">
                <span className="text-sm font-semibold text-foreground block mb-1">Keine Helfer verfügbar</span>
                <span className="text-[12px] text-muted-foreground">Leider ist gerade kein Teammitglied im Dienst. Bitte versuche es später erneut.</span>
            </div>
        </div>
    );
};