import { FlatControllerAddedEvent, FlatControllerRemovedEvent, FlatControllersEvent, RemoveAllRightsMessageComposer, RoomTakeRightsComposer, RoomUsersWithRightsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-200">
                    { LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ usersWithRights.size.toString(), usersWithRights.size.toString() ]) }
                </span>
                <div className="rounded-lg bg-white/5 border border-white/5 overflow-hidden" style={ { height: 100 } }>
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-0.5 p-1.5">
                            { usersWithRights.size === 0 && (
                                <span className="text-[11px] text-zinc-600 text-center py-2">{ LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ '0', '0' ]) }</span>
                            ) }
                            { Array.from(usersWithRights.entries()).map(([ id, name ], index) => (
                                <div
                                    key={ index }
                                    className="flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={ () => SendMessageComposer(new RoomTakeRightsComposer(id)) }
                                >
                                    <UserProfileIconView userName={ name } />
                                    <span className="text-xs text-zinc-300 truncate flex-1">{ name }</span>
                                </div>
                            )) }
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <Button
                    variant="ghost"
                    className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={ !usersWithRights.size }
                    onClick={ () => SendMessageComposer(new RemoveAllRightsMessageComposer(roomData.roomId)) }
                >
                    { LocalizeText('navigator.flatctrls.clear') }
                </Button>
            </div>
        </div>
    );
}
