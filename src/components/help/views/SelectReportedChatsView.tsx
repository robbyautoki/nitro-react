import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import { ChatEntryType, IChatEntry, ReportState, ReportType } from '../../../api';
import { useChatHistory, useHelp } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';

export const SelectReportedChatsView: FC<{}> = () =>
{
    const [ selectedChats, setSelectedChats ] = useState<IChatEntry[]>([]);
    const { activeReport = null, setActiveReport = null } = useHelp();
    const { chatHistory = [], messengerHistory = [] } = useChatHistory();

    const userChats = useMemo(() =>
    {
        switch(activeReport.reportType)
        {
            case ReportType.BULLY:
            case ReportType.EMERGENCY:
                return chatHistory.filter(chat => (chat.type === ChatEntryType.TYPE_CHAT) && (chat.webId === activeReport.reportedUserId) && (chat.entityType === RoomObjectType.USER));
            case ReportType.IM:
                return messengerHistory.filter(chat => (chat.webId === activeReport.reportedUserId) && (chat.type === ChatEntryType.TYPE_IM));
        }

        return [];
    }, [ activeReport, chatHistory, messengerHistory ]);

    const selectChat = (chatEntry: IChatEntry) =>
    {
        setSelectedChats(prev =>
        {
            const newValue = [ ...prev ];
            const index = newValue.indexOf(chatEntry);

            if(index >= 0) newValue.splice(index, 1);
            else newValue.push(chatEntry);

            return newValue;
        });
    };

    const submitChats = () =>
    {
        if(!selectedChats || selectedChats.length <= 0) return;

        setActiveReport(prev => ({
            ...prev,
            reportedChats: selectedChats,
            currentStep: ReportState.SELECT_TOPICS,
        }));
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                <p className="text-label-sm text-text-strong-950">Nachrichten auswaehlen</p>
                <p className="mt-1 text-paragraph-xs text-text-sub-600">Waehle die Nachrichten, die du melden moechtest.</p>
            </div>
            { (!userChats || !userChats.length) && (
                <div className="rounded-xl border border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-6 text-center">
                    <p className="text-paragraph-sm text-text-sub-600">Keine Nachrichten gefunden.</p>
                </div>
            ) }
            { userChats.length > 0 && (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    { userChats.map(chat =>
                    {
                        const isSelected = selectedChats.indexOf(chat) >= 0;

                        return (
                            <AlignButton.Root
                                key={ chat.id }
                                type="button"
                                variant={ isSelected ? 'primary' : 'neutral' }
                                mode={ isSelected ? 'lighter' : 'stroke' }
                                size="medium"
                                className="h-auto w-full justify-start whitespace-normal px-3 py-2.5 text-left"
                                onClick={ () => selectChat(chat) }
                            >
                                <span className={ cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ring-inset',
                                    isSelected ? 'bg-primary-base text-static-white ring-primary-base' : 'bg-bg-white-0 text-text-soft-400 ring-stroke-soft-200'
                                ) }>
                                    { isSelected && <Check className="size-3" /> }
                                </span>
                                <div className="flex items-center gap-2 min-w-0">
                                    <MessageSquare className="size-3.5 shrink-0 text-text-soft-400" />
                                    <span className="truncate text-paragraph-sm text-text-sub-600">{ chat.message }</span>
                                </div>
                            </AlignButton.Root>
                        );
                    }) }
                </div>
            ) }
            <div className="flex justify-end pt-2">
                <AlignButton.Root
                    type="button"
                    variant="primary"
                    mode="filled"
                    size="small"
                    disabled={ selectedChats.length <= 0 }
                    onClick={ submitChats }
                >
                    Weiter
                </AlignButton.Root>
            </div>
        </div>
    );
};
