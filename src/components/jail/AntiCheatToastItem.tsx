import { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AntiCheatToast } from '../../hooks';

interface AntiCheatToastItemProps
{
    toast: AntiCheatToast;
}

/**
 * Original Anti-Cheat-Toast (vor Phase 11.5). Rendert als Card im Unified-Stack
 * rechts oben — KEIN eigener `fixed` Container.
 */
export const AntiCheatToastItem: FC<AntiCheatToastItemProps> = ({ toast }) =>
{
    return (
        <div
            className={ `pointer-events-auto flex items-start gap-2.5 rounded-lg border p-2.5 pr-3 shadow-lg backdrop-blur-md transition-all w-full ${
                toast.level === 'critical'
                    ? 'border-error-base/40 bg-error-base/95 text-static-white'
                    : 'border-warning-base/40 bg-warning-base/95 text-static-white'
            }` }
            style={ { animation: 'jail-toast-in 0.3s ease-out, jail-toast-out 0.4s ease-in 5.6s forwards' } }
        >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1 text-xs">
                <div className="font-bold text-[12px]">
                    { toast.level === 'critical' ? 'Verstoß erkannt!' : 'Verdächtig' }
                </div>
                <div className="opacity-90">
                    { toast.level === 'critical' && toast.minutes
                        ? `Strafe verlängert um ${ toast.minutes } Min wegen ${ toast.event }.`
                        : `Verdächtiges Verhalten: ${ toast.event }` }
                </div>
            </div>
        </div>
    );
};
