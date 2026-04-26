import { GetCfhStatusMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { ShieldAlert, MessageCircle, Scale } from 'lucide-react';
import { DispatchUiEvent, GetConfiguration, ReportState, ReportType, SendMessageComposer } from '../../../api';
import { GuideToolEvent } from '../../../events';
import { useHelp } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import { cn } from '@/align-ui/utils/cn';

const MENU_ITEMS = [
    {
        id: 'report',
        icon: ShieldAlert,
        title: 'Jemand melden',
        description: 'Melde einen Spieler wegen Fehlverhalten',
        badge: 'Sicherheit',
        badgeColor: 'red' as const,
        iconClassName: 'bg-error-lighter text-error-base ring-error-light',
    },
    {
        id: 'support',
        icon: MessageCircle,
        title: 'Live-Support',
        description: 'Chatte direkt mit einem Teammitglied',
        badge: 'Support',
        badgeColor: 'blue' as const,
        iconClassName: 'bg-information-lighter text-information-base ring-information-light',
    },
    {
        id: 'sanction',
        icon: Scale,
        title: 'Mein Sanktionsstatus',
        description: 'Pruefe ob Sanktionen gegen dich vorliegen',
        badge: 'Status',
        badgeColor: 'orange' as const,
        iconClassName: 'bg-warning-lighter text-warning-base ring-warning-light',
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
        <div className="space-y-3">
            <div className="rounded-xl bg-bg-weak-50 px-4 py-3 text-center ring-1 ring-inset ring-stroke-soft-200">
                <p className="text-label-md text-text-strong-950">Wie koennen wir helfen?</p>
                <p className="mt-1 text-paragraph-xs text-text-sub-600">Waehle eine Option</p>
            </div>
            { MENU_ITEMS.map(item =>
            {
                const Icon = item.icon;
                const isDisabled = item.id === 'support' && !GetConfiguration('guides.enabled');

                return (
                    <AlignButton.Root
                        key={ item.id }
                        type="button"
                        variant="neutral"
                        mode="stroke"
                        size="medium"
                        className="h-auto w-full justify-start whitespace-normal px-3 py-3"
                        onClick={ () => onItemClick(item.id) }
                        disabled={ isDisabled }
                    >
                        <span className={ cn('flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', item.iconClassName) }>
                            <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1 text-left">
                            <div className="text-label-sm text-text-strong-950">{ item.title }</div>
                            <div className="mt-0.5 text-paragraph-xs text-text-sub-600">{ item.description }</div>
                        </div>
                        <AlignBadge.Root color={ item.badgeColor } variant="lighter" size="small" className="shrink-0">
                            { item.badge }
                        </AlignBadge.Root>
                    </AlignButton.Root>
                );
            }) }
        </div>
    );
};
