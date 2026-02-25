import { FlatControllerAddedEvent, FlatControllerRemovedEvent, FlatControllersEvent, RemoveAllRightsMessageComposer, RoomTakeRightsComposer, RoomUsersWithRightsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Frame, FramePanel } from '@/components/ui/frame';
import { X } from 'lucide-react';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsRightsTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null } = props;
    const [ usersWithRights, setUsersWithRights ] = useState<Map<number, string>>(new Map());

    useMessageEvent<FlatControllersEvent>(FlatControllersEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(parser.users);
    });

    useMessageEvent<FlatControllerAddedEvent>(FlatControllerAddedEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);
            newValue.set(parser.data.userId, parser.data.userName);
            return newValue;
        });
    });

    useMessageEvent<FlatControllerRemovedEvent>(FlatControllerRemovedEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);
            newValue.delete(parser.userId);
            return newValue;
        });
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomUsersWithRightsComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    return (
        <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium">
                        { LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ usersWithRights.size.toString(), usersWithRights.size.toString() ]) }
                    </span>
                    <ScrollArea className="h-[120px]">
                        <div className="flex flex-col gap-0.5">
                            { usersWithRights.size === 0 && (
                                <span className="text-[11px] text-muted-foreground text-center py-4">Keine User mit Rechten</span>
                            ) }
                            { Array.from(usersWithRights.entries()).map(([ id, name ], index) => (
                                <div
                                    key={ index }
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                                >
                                    <UserProfileIconView userName={ name } />
                                    <span className="text-xs flex-1 truncate">{ name }</span>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                                        onClick={ () => SendMessageComposer(new RoomTakeRightsComposer(id)) }
                                    >
                                        <X className="w-3 h-3 text-destructive" />
                                    </button>
                                </div>
                            )) }
                        </div>
                    </ScrollArea>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={ !usersWithRights.size }
                        onClick={ () => SendMessageComposer(new RemoveAllRightsMessageComposer(roomData.roomId)) }
                    >
                        { LocalizeText('navigator.flatctrls.clear') }
                    </Button>
                </div>
            </FramePanel>
        </Frame>
    );
}
