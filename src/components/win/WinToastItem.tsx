import { FC } from 'react';
import { Trophy } from 'lucide-react';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { WinToast } from '../../hooks';

interface WinToastItemProps
{
    toast: WinToast;
}

/**
 * Original Win-Broadcast Bubble (vor Phase 11.5). Rendert als Card im
 * Unified-Stack rechts oben — KEIN eigener `fixed` Container.
 */
export const WinToastItem: FC<WinToastItemProps> = ({ toast }) =>
{
    return (
        <div className="pointer-events-auto w-full animate-in slide-in-from-right fade-in duration-300">
            <AlignSurface.Panel className="overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                    <Trophy className="size-4 shrink-0 text-warning-base" />
                    <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-text-strong-950">
                            { toast.username } hat einen Win erhalten!
                        </div>
                        { toast.level > 0 && (
                            <AlignBadge.Root color="orange" variant="lighter" size="small" className="mt-0.5">
                                Level { toast.level }
                            </AlignBadge.Root>
                        ) }
                    </div>
                </div>
            </AlignSurface.Panel>
        </div>
    );
};
