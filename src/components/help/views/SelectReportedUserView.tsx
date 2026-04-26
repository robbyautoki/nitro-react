import { RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { Check, User } from 'lucide-react';
import { ChatEntryType, GetSessionDataManager, IReportedUser, ReportState } from '../../../api';
import { useChatHistory, useHelp } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';

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
            <div className="rounded-xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                <p className="text-label-sm text-text-strong-950">Spieler auswaehlen</p>
                <p className="mt-1 text-paragraph-xs text-text-sub-600">Waehle den Spieler, den du melden moechtest.</p>
            </div>
            { !availableUsers.length && (
                <div className="rounded-xl border border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-6 text-center">
                    <p className="text-paragraph-sm text-text-sub-600">Keine Spieler verfuegbar. Du musst zuerst mit jemandem chatten.</p>
                </div>
            ) }
            { availableUsers.length > 0 && (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    { availableUsers.map(user => (
                        <AlignButton.Root
                            key={ user.id }
                            type="button"
                            variant={ selectedUserId === user.id ? 'primary' : 'neutral' }
                            mode={ selectedUserId === user.id ? 'lighter' : 'stroke' }
                            size="medium"
                            className="h-auto w-full justify-start whitespace-normal px-3 py-2.5 text-left"
                            onClick={ () => selectUser(user.id) }
                        >
                            <span className={ cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                                selectedUserId === user.id ? 'bg-primary-alpha-10 text-primary-base ring-primary-base' : 'bg-bg-weak-50 text-text-sub-600 ring-stroke-soft-200'
                            ) }>
                                <User className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-label-sm">{ user.username }</span>
                            { selectedUserId === user.id && <AlignButton.Icon as={ Check } className="size-4 text-primary-base" /> }
                        </AlignButton.Root>
                    )) }
                </div>
            ) }
            <div className="flex justify-end pt-2">
                <AlignButton.Root
                    type="button"
                    variant="primary"
                    mode="filled"
                    size="small"
                    disabled={ selectedUserId <= 0 }
                    onClick={ () => submitUser(selectedUserId) }
                >
                    Weiter
                </AlignButton.Root>
            </div>
        </div>
    );
};
