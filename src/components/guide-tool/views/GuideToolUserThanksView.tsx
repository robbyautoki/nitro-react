import { FC } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const GuideToolUserThanksView: FC<{}> = () =>
{
    return (
        <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <div className="text-center">
                <span className="text-sm font-semibold text-foreground block mb-1">Vielen Dank!</span>
                <span className="text-[12px] text-muted-foreground">Dein Feedback wurde gespeichert. Wir hoffen, dir geholfen zu haben.</span>
            </div>
        </div>
    );
};
