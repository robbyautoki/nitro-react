import { FriendlyTime, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { CreateLinkEvent, GetConfiguration, LocalizeText } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { usePurse } from '../../hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyView } from './views/CurrencyView';
import { LevelView } from './views/LevelView';
import { SeasonalView } from './views/SeasonalView';

export const PurseView: FC<{}> = props =>
{
    const { purse = null, hcDisabled = false } = usePurse();

    const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

    const getClubText = (() =>
    {
        if(!purse) return null;

        const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
        const minutesUntilExpiration = purse.minutesUntilExpiration;

        if(purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');

        else if((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);

        else return FriendlyTime.shortFormat(totalDays * 86400);
    })();

    const getCurrencyElements = (offset: number, limit: number = -1, seasonal: boolean = false) =>
    {
        if(!purse || !purse.activityPoints || !purse.activityPoints.size) return null;

        const types = Array.from(purse.activityPoints.keys()).filter(type => (displayedCurrencies.indexOf(type) >= 0));

        let count = 0;

        while(count < offset)
        {
            types.shift();

            count++;
        }

        count = 0;

        const elements: JSX.Element[] = [];

        for(const type of types)
        {
            if((limit > -1) && (count === limit)) break;

            if(seasonal) elements.push(<SeasonalView key={ type } type={ type } amount={ purse.activityPoints.get(type) } />);
            else elements.push(<CurrencyView key={ type } type={ type } amount={ purse.activityPoints.get(type) } short={ currencyDisplayNumberShort } />);

            count++;
        }

        return elements;
    }

    if(!purse) return null;

    return (
        <TooltipProvider delayDuration={ 400 }>
            <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[69] pointer-events-auto flex items-center gap-1 py-1.5 px-3 texture-panel backdrop-blur-2xl rounded-2xl">
                <CurrencyView type={ -1 } amount={ purse.credits } short={ currencyDisplayNumberShort } />
                { getCurrencyElements(0, 2) }
                { getCurrencyElements(2, -1, true) }

                <div className="w-px h-6 bg-white/[0.06] mx-1" />
                <LevelView />

                { !hcDisabled && <div className="w-px h-6 bg-white/[0.06] mx-1" /> }
                { !hcDisabled && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={ () => CreateLinkEvent('habboUI/open/hccenter') }
                            >
                                <LayoutCurrencyIcon type="hc" />
                                <span className="text-xs font-medium text-white/90">{ getClubText }</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                            Habbo Club
                        </TooltipContent>
                    </Tooltip>
                ) }

                <div className="w-px h-6 bg-white/[0.06] mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => CreateLinkEvent('help/show') }
                        >
                            <i className="icon icon-help" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                        Help
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ () => CreateLinkEvent('user-settings/toggle') }
                        >
                            <i className="icon icon-cog" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 text-gray-200 text-xs border-0 shadow-sm">
                        Settings
                    </TooltipContent>
                </Tooltip>
                <div id="toolbar-room-tools-container" className="flex items-center" />
            </div>
        </TooltipProvider>
    );
}
