import { GetCfhStatusMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { ShieldAlert, MessageCircle, Scale } from 'lucide-react';
import { DispatchUiEvent, GetConfiguration, LocalizeText, ReportState, ReportType, SendMessageComposer } from '../../../api';
import { GuideToolEvent } from '../../../events';
import { useHelp } from '../../../hooks';

const MENU_ITEMS = [
    {
        id: 'report',
        icon: ShieldAlert,
        title: 'Jemand melden',
        description: 'Melde einen Spieler wegen Fehlverhalten',
        color: 'text-red-400',
        hoverBg: 'hover:bg-red-500/10',
        hoverBorder: 'hover:border-red-500/20',
    },
    {
        id: 'support',
        icon: MessageCircle,
        title: 'Live-Support',
        description: 'Chatte direkt mit einem Teammitglied',
        color: 'text-blue-400',
        hoverBg: 'hover:bg-blue-500/10',
        hoverBorder: 'hover:border-blue-500/20',
    },
    {
        id: 'sanction',
        icon: Scale,
        title: 'Mein Sanktionsstatus',
        description: 'Pruefe ob Sanktionen gegen dich vorliegen',
        color: 'text-amber-400',
        hoverBg: 'hover:bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/20',
    },
];

export const HelpIndexView: FC<{}> = () =>
{
    const { setActiveReport = null } = useHelp();

    const onItemClick = (id: string) =>
    {
        switch(id)
        {
            case 'report':
                setActiveReport(prev => ({
                    ...prev,
                    currentStep: ReportState.SELECT_USER,
                    reportType: ReportType.BULLY,
                }));
                return;
            case 'support':
                DispatchUiEvent(new GuideToolEvent(GuideToolEvent.CREATE_HELP_REQUEST));
                return;
            case 'sanction':
                SendMessageComposer(new GetCfhStatusMessageComposer(false));
                return;
        }
    };

    return (
        <div className="space-y-2">
            <div className="text-center mb-4">
                <p className="text-lg font-semibold text-white/90">Wie koennen wir helfen?</p>
                <p className="text-xs text-white/40 mt-1">Waehle eine Option</p>
            </div>

            { MENU_ITEMS.map(item =>
            {
                const Icon = item.icon;
                const isDisabled = item.id === 'support' && !GetConfiguration('guides.enabled');

                return (
                    <button
                        key={ item.id }
                        className={ `w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] transition-all ${ item.hoverBg } ${ item.hoverBorder } disabled:opacity-30 disabled:cursor-not-allowed` }
                        onClick={ () => onItemClick(item.id) }
                        disabled={ isDisabled }
                    >
                        <div className={ `shrink-0 p-2 rounded-lg bg-white/[0.05] ${ item.color }` }>
                            <Icon className="size-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-white/85">{ item.title }</div>
                            <div className="text-[11px] text-white/35 mt-0.5">{ item.description }</div>
                        </div>
                    </button>
                );
            }) }
        </div>
    );
};
