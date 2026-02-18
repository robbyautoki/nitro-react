import { FC } from 'react';
import { LocalizeFormattedNumber, LocalizeText } from '../../../api';
import { LayoutCurrencyIcon } from '../../../common';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SeasonalViewProps
{
    type: number;
    amount: number;
}

export const SeasonalView: FC<SeasonalViewProps> = props =>
{
    const { type = -1, amount = -1 } = props;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-xs font-medium text-white/90 tabular-nums">
                        { LocalizeFormattedNumber(amount) }
                    </span>
                    <LayoutCurrencyIcon type={ type } />
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                { LocalizeText(`purse.seasonal.currency.${ type }`) }
            </TooltipContent>
        </Tooltip>
    );
}
