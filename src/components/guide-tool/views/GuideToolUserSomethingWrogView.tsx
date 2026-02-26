import { FC } from 'react';
import { AlertTriangle } from 'lucide-react';

export const GuideToolUserSomethingWrogView: FC<{}> = () =>
{
    return (
        <div className="flex flex-col items-center gap-3 py-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <div className="text-center">
                <span className="text-sm font-semibold text-foreground block mb-1">Verbindung unterbrochen</span>
                <span className="text-[12px] text-muted-foreground">Der Helfer hat die Verbindung verloren. Du kannst das Fenster schließen und es erneut versuchen.</span>
            </div>
        </div>
    );
};