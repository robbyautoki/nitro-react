import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { HelpCircle, ChevronLeft } from 'lucide-react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, ReportState } from '../../api';
import { useHelp } from '../../hooks';
import { DescribeReportView } from './views/DescribeReportView';
import { HelpIndexView } from './views/HelpIndexView';
import { NameChangeView } from './views/name-change/NameChangeView';
import { SanctionSatusView } from './views/SanctionStatusView';
import { SelectReportedChatsView } from './views/SelectReportedChatsView';
import { SelectReportedUserView } from './views/SelectReportedUserView';
import { SelectTopicView } from './views/SelectTopicView';
import { ReportSummaryView } from './views/ReportSummaryView';

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
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

                <div className="relative w-[480px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                    <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0">
                            <div className="flex items-center gap-2.5">
                                { isInReportFlow && (
                                    <button
                                        className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all mr-1"
                                        onClick={ goBack }
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                ) }
                                <HelpCircle className="size-4 text-white/70" />
                                <span className="text-sm font-semibold text-white/90 tracking-tight">
                                    { isInReportFlow ? stepTitle : 'Hilfe' }
                                </span>
                            </div>
                            <button
                                className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                                onClick={ onClose }
                            >
                                <FaTimes className="size-3" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[200px]">
                            <CurrentStepView />
                        </div>
                    </div>
                </div>
            </div>

            <SanctionSatusView />
            <NameChangeView />
        </>
    );
};
