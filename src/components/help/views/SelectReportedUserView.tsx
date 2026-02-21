import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { ChatEntryType, GetSessionDataManager, IReportedUser, LocalizeText, ReportState } from '../../../api';
import { useChatHistory, useHelp } from '../../../hooks';

export const SelectReportedUserView: FC<{}> = () =>
{
    const [ selectedUserId, setSelectedUserId ] = useState(-1);
    const { chatHistory = [] } = useChatHistory();
    const { setActiveReport = null } = useHelp();

    const availableUsers = useMemo(() =>
    {
        const users: Map<number, IReportedUser> = new Map();

        chatHistory.forEach(chat =>
        {
            if((chat.type === ChatEntryType.TYPE_CHAT) && (chat.entityType === RoomObjectType.USER) && (chat.webId !== GetSessionDataManager().userId) && !users.has(chat.webId)) users.set(chat.webId, { id: chat.webId, username: chat.name });
        });

        return Array.from(users.values());
    }, [ chatHistory ]);

    const submitUser = (userId: number) =>
    {
        if(userId <= 0) return;

        setActiveReport(prev => ({
            ...prev,
            reportedUserId: userId,
            currentStep: ReportState.SELECT_CHATS,
        }));
    };

    const selectUser = (userId: number) =>
    {
        setSelectedUserId(prev => (userId === prev) ? -1 : userId);
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs text-white/40 mb-3">Waehle den Spieler, den du melden moechtest</p>
            </div>

            { !availableUsers.length && (
                <div className="px-4 py-6 rounded-xl border border-white/[0.06] bg-white/[0.03] text-center">
                    <p className="text-sm text-white/40">Keine Spieler verfuegbar. Du musst zuerst mit jemandem chatten.</p>
                </div>
            ) }

            { availableUsers.length > 0 && (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    { availableUsers.map(user => (
                        <button
                            key={ user.id }
                            className={ `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                                selectedUserId === user.id
                                    ? 'border-blue-500/30 bg-blue-500/10 text-white/90'
                                    : 'border-white/[0.06] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:border-white/[0.1]'
                            }` }
                            onClick={ () => selectUser(user.id) }
                        >
                            <div className={ `shrink-0 p-1.5 rounded-lg ${
                                selectedUserId === user.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.05] text-white/40'
                            }` }>
                                <User className="size-4" />
                            </div>
                            <span className="text-sm font-medium">{ user.username }</span>
                        </button>
                    )) }
                </div>
            ) }

            <div className="flex justify-end pt-2">
                <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={ selectedUserId <= 0 }
                    onClick={ () => submitUser(selectedUserId) }
                >
                    Weiter
                </button>
            </div>
        </div>
    );
};
