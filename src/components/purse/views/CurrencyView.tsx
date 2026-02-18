import { FC, useMemo } from 'react';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { LayoutCurrencyIcon } from '../../../common';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrencyViewProps
{
    type: number;
    amount: number;
    short: boolean;
}

export const CurrencyView: FC<CurrencyViewProps> = props =>
{
    const { type = -1, amount = -1, short = false } = props;

    const element = useMemo(() =>
    {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <span className="text-xs font-medium text-white/90 tabular-nums">
                    { short ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount) }
                </span>
                <LayoutCurrencyIcon type={ type } />
            </div>
        );
    }, [ amount, short, type ]);

    if(!short) return element;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                { element }
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                { LocalizeFormattedNumber(amount) }
            </TooltipContent>
        </Tooltip>
    );
}
