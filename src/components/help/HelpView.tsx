import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { ChevronLeft, HelpCircle, X } from 'lucide-react';
import { AddEventLinkTracker, RemoveLinkEventTracker, ReportState } from '../../api';
import { useHelp } from '../../hooks';
import { DescribeReportView } from './views/DescribeReportView';
import { HelpIndexView } from './views/HelpIndexView';
import { NameChangeView } from './views/name-change/NameChangeView';
import { SanctionSatusView } from './views/SanctionStatusView';
import { SelectReportedChatsView } from './views/SelectReportedChatsView';
import { SelectReportedUserView } from './views/SelectReportedUserView';
import { SelectTopicView } from './views/SelectTopicView';
import { ReportSummaryView } from './views/ReportSummaryView';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignModal from '@/align-ui/components/ui/modal';

const STEP_TITLES: Record<number, string> = {
    [ReportState.SELECT_USER]: 'Wen moechtest du melden?',
    [ReportState.SELECT_CHATS]: 'Nachrichten auswaehlen',
    [ReportState.SELECT_TOPICS]: 'Kategorie waehlen',
    [ReportState.INPUT_REPORT_MESSAGE]: 'Beschreibe das Problem',
    [ReportState.REPORT_SUMMARY]: 'Meldung absenden',
};

export const HelpView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { activeReport = null, setActiveReport = null, report = null } = useHelp();

    const onClose = useCallback(() =>
    {
        setActiveReport(null);
        setIsVisible(false);
    }, [ setActiveReport ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                    case 'tour':
                        return;
                    case 'report':
                        if((parts.length >= 5) && (parts[2] === 'room'))
                        {
                            const roomId = parseInt(parts[3]);
                            const unknown = unescape(parts.splice(4).join('/'));
                        }
                        return;
                }
            },
            eventUrlPrefix: 'help/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!activeReport) return;
        setIsVisible(true);
    }, [ activeReport ]);

    const goBack = useCallback(() =>
    {
        if(!activeReport) return;

        if(activeReport.currentStep === ReportState.SELECT_USER)
        {
            setActiveReport(null);
            return;
        }

        setActiveReport(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }, [ activeReport, setActiveReport ]);

    const isInReportFlow = activeReport !== null;
    const stepTitle = isInReportFlow ? (STEP_TITLES[activeReport.currentStep] ?? 'Meldung') : null;

    const CurrentStepView = () =>
    {
        if(activeReport)
        {
            switch(activeReport.currentStep)
            {
                case ReportState.SELECT_USER:
                    return <SelectReportedUserView />;
                case ReportState.SELECT_CHATS:
                    return <SelectReportedChatsView />;
                case ReportState.SELECT_TOPICS:
                    return <SelectTopicView />;
                case ReportState.INPUT_REPORT_MESSAGE:
                    return <DescribeReportView />;
                case ReportState.REPORT_SUMMARY:
                    return <ReportSummaryView />;
            }
        }

        return <HelpIndexView />;
    };

    if(!isVisible) return (
        <>
            <SanctionSatusView />
            <NameChangeView />
        </>
    );

    return (
        <>
            <AlignModal.Root open={ isVisible } onOpenChange={ open => !open && onClose() }>
                <AlignModal.Content className="z-[201] max-w-[480px] overflow-hidden" overlayClassName="z-[200]" showClose={ false }>
                    <AlignModal.Header className="items-center py-3 pl-4 pr-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                                <HelpCircle className="size-4" />
                            </span>
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                { isInReportFlow && (
                                    <AlignButton.Root
                                        type="button"
                                        variant="neutral"
                                        mode="ghost"
                                        size="xxsmall"
                                        className="size-7 p-0"
                                        onClick={ goBack }
                                    >
                                        <AlignButton.Icon as={ ChevronLeft } className="size-4" />
                                    </AlignButton.Root>
                                ) }
                                <AlignModal.Title className="truncate">
                                    { isInReportFlow ? stepTitle : 'Hilfe' }
                                </AlignModal.Title>
                            </div>
                        </div>
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="size-7 p-0"
                            onClick={ onClose }
                        >
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    </AlignModal.Header>
                    <AlignModal.Body className="max-h-[calc(85vh-80px)] min-h-[200px] overflow-y-auto p-4">
                        <CurrentStepView />
                    </AlignModal.Body>
                </AlignModal.Content>
            </AlignModal.Root>
            <SanctionSatusView />
            <NameChangeView />
        </>
    );
};
