import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import { ChatEntryType, IChatEntry, LocalizeText, ReportState, ReportType } from '../../../api';
import { useChatHistory, useHelp } from '../../../hooks';

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
            <div>
                <p className="text-xs text-white/40 mb-3">Waehle die Nachrichten, die du melden moechtest</p>
            </div>

            { (!userChats || !userChats.length) && (
                <div className="px-4 py-6 rounded-xl border border-white/[0.06] bg-white/[0.03] text-center">
                    <p className="text-sm text-white/40">Keine Nachrichten gefunden.</p>
                </div>
            ) }

            { userChats.length > 0 && (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    { userChats.map(chat =>
                    {
                        const isSelected = selectedChats.indexOf(chat) >= 0;

                        return (
                            <button
                                key={ chat.id }
                                className={ `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                                    isSelected
                                        ? 'border-blue-500/30 bg-blue-500/10'
                                        : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.1]'
                                }` }
                                onClick={ () => selectChat(chat) }
                            >
                                <div className={ `shrink-0 size-5 rounded-md border flex items-center justify-center transition-all ${
                                    isSelected
                                        ? 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                                        : 'border-white/[0.1] bg-white/[0.03]'
                                }` }>
                                    { isSelected && <Check className="size-3" /> }
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <MessageSquare className="size-3.5 text-white/30 shrink-0" />
                                    <span className="text-sm text-white/70 truncate">{ chat.message }</span>
                                </div>
                            </button>
                        );
                    }) }
                </div>
            ) }

            <div className="flex justify-end pt-2">
                <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={ selectedChats.length <= 0 }
                    onClick={ submitChats }
                >
                    Weiter
                </button>
            </div>
        </div>
    );
};
