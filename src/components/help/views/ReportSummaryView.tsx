import { CallForHelpFromForumMessageMessageComposer, CallForHelpFromForumThreadMessageComposer, CallForHelpFromIMMessageComposer, CallForHelpFromPhotoMessageComposer, CallForHelpMessageComposer } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { Send } from 'lucide-react';
import { ReportType, SendMessageComposer } from '../../../api';
import { useHelp } from '../../../hooks';

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
            <div>
                <p className="text-xs text-white/40 mb-3">Pruefe deine Meldung und sende sie ab</p>
            </div>

            <div className="space-y-2">
                { activeReport?.message && (
                    <div className="px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                        <p className="text-[11px] text-white/30 mb-1">Deine Beschreibung</p>
                        <p className="text-sm text-white/70">{ activeReport.message }</p>
                    </div>
                ) }

                { activeReport?.reportedChats?.length > 0 && (
                    <div className="px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                        <p className="text-[11px] text-white/30 mb-1">Gemeldete Nachrichten</p>
                        <p className="text-sm text-white/70">{ activeReport.reportedChats.length } Nachricht(en) ausgewaehlt</p>
                    </div>
                ) }
            </div>

            <div className="flex justify-end pt-2">
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30"
                    onClick={ submitReport }
                >
                    <Send className="size-3.5" />
                    Meldung absenden
                </button>
            </div>
        </div>
    );
};
