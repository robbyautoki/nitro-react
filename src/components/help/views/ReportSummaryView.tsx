import { CallForHelpFromForumMessageMessageComposer, CallForHelpFromForumThreadMessageComposer, CallForHelpFromIMMessageComposer, CallForHelpFromPhotoMessageComposer, CallForHelpMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { Send } from 'lucide-react';
import { ReportType, SendMessageComposer } from '../../../api';
import { useHelp } from '../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';

export const ReportSummaryView: FC<{}> = () =>
{
    const { activeReport = null, setActiveReport = null } = useHelp();

    const submitReport = () =>
    {
        const chats: (string | number)[] = [];

        switch(activeReport.reportType)
        {
            case ReportType.BULLY:
            case ReportType.EMERGENCY:
            case ReportType.ROOM: {
                const reportedRoomId = ((activeReport.roomId <= 0) ? activeReport.reportedChats[0].roomId : activeReport.roomId);

                activeReport.reportedChats.forEach(entry => chats.push(entry.webId, entry.message));

                SendMessageComposer(new CallForHelpMessageComposer(activeReport.message, activeReport.cfhTopic, activeReport.reportedUserId, reportedRoomId, chats));
                break;
            }
            case ReportType.IM:
                activeReport.reportedChats.forEach(entry => chats.push(entry.webId, entry.message));

                SendMessageComposer(new CallForHelpFromIMMessageComposer(activeReport.message, activeReport.cfhTopic, activeReport.reportedUserId, chats));
                break;
            case ReportType.THREAD:
                SendMessageComposer(new CallForHelpFromForumThreadMessageComposer(activeReport.groupId, activeReport.threadId, activeReport.cfhTopic, activeReport.message));
                break;
            case ReportType.MESSAGE:
                SendMessageComposer(new CallForHelpFromForumMessageMessageComposer(activeReport.groupId, activeReport.threadId, activeReport.messageId, activeReport.cfhTopic, activeReport.message));
                break;
            case ReportType.PHOTO:
                SendMessageComposer(new CallForHelpFromPhotoMessageComposer(activeReport.extraData, activeReport.roomId, activeReport.reportedUserId, activeReport.cfhTopic, activeReport.roomObjectId));
                break;
        }

        setActiveReport(null);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                <p className="text-label-sm text-text-strong-950">Meldung pruefen</p>
                <p className="mt-1 text-paragraph-xs text-text-sub-600">Pruefe deine Meldung und sende sie ab.</p>
            </div>
            <div className="space-y-2">
                { activeReport?.message && (
                    <div className="rounded-xl bg-bg-white-0 px-3.5 py-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <p className="mb-1 text-subheading-2xs uppercase text-text-soft-400">Deine Beschreibung</p>
                        <p className="text-paragraph-sm text-text-sub-600">{ activeReport.message }</p>
                    </div>
                ) }
                { activeReport?.reportedChats?.length > 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-white-0 px-3.5 py-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <div>
                            <p className="mb-1 text-subheading-2xs uppercase text-text-soft-400">Gemeldete Nachrichten</p>
                            <p className="text-paragraph-sm text-text-sub-600">Nachricht(en) ausgewaehlt</p>
                        </div>
                        <AlignBadge.Root color="blue" variant="lighter" size="medium">
                            { activeReport.reportedChats.length }
                        </AlignBadge.Root>
                    </div>
                ) }
            </div>
            <div className="flex justify-end pt-2">
                <AlignButton.Root
                    type="button"
                    variant="primary"
                    mode="filled"
                    size="small"
                    onClick={ submitReport }
                >
                    <AlignButton.Icon as={ Send } className="size-3.5" />
                    Meldung absenden
                </AlignButton.Root>
            </div>
        </div>
    );
};
